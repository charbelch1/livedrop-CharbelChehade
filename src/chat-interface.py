#!/usr/bin/env python3
# /src/chat-interface.py
import argparse, json, os, sys, time, datetime, pathlib
import requests

def get_base_url(args):
    if args.base:
        return args.base.rstrip("/")
    env = os.getenv("CHAT_API_BASE", "").strip()
    if env:
        return env.rstrip("/")
    return input("Enter your ngrok base URL (e.g., https://xxx.ngrok-free.app): ").strip().rstrip("/")

def _safe_json(resp):
    try:
        return resp.json()
    except Exception:
        return {"_raw": resp.text}

def call_health(base):
    try:
        r = requests.get(f"{base}/health", timeout=10)
        r.raise_for_status()
        return _safe_json(r)
    except Exception as e:
        return {"error": str(e)}

def call_chat(base, question, max_new_tokens=160):
    payload = {"question": question, "max_new_tokens": max_new_tokens}
    r = requests.post(f"{base}/chat", json=payload, timeout=120)
    r.raise_for_status()
    return _safe_json(r)

def call_ping(base, prompt, max_new_tokens=80):
    payload = {"prompt": prompt, "max_new_tokens": max_new_tokens}
    r = requests.post(f"{base}/ping", json=payload, timeout=60)
    r.raise_for_status()
    return _safe_json(r)

def call_generate(base, prompt, max_tokens=200):
    payload = {"prompt": prompt, "max_tokens": max_tokens}
    r = requests.post(
        f"{base}/generate",
        json=payload,
        timeout=120,
        headers={"ngrok-skip-browser-warning": "1"}
    )
    r.raise_for_status()
    return _safe_json(r)

def _parse_answer(resp, elapsed_fallback=None):
    """
    Accepts both:
      New: {"answer": "<string>", "sources": [...], "latency_s": 1.23}
      Old: {"answer": ["<string>", ["src1","src2"]]}
    """
    if not isinstance(resp, dict):
        return ("", [], elapsed_fallback)

    raw_answer = resp.get("answer", "")
    sources = resp.get("sources", [])

    # Legacy shape: answer is a list -> ["text", ["src1","src2"]]
    if isinstance(raw_answer, list):
        answer = raw_answer[0] if raw_answer else ""
        if not sources and len(raw_answer) > 1 and isinstance(raw_answer[1], list):
            sources = raw_answer[1]
    else:
        answer = "" if raw_answer is None else str(raw_answer)

    # Normalize sources to a list[str]
    if isinstance(sources, str):
        sources = [sources]
    elif not isinstance(sources, list):
        sources = []
    sources = [str(s) for s in sources]

    latency = resp.get("latency_s", elapsed_fallback)
    return (answer.strip(), sources, latency)

def main():
    parser = argparse.ArgumentParser(description="CLI for LLM RAG API over ngrok")
    parser.add_argument("--base", help="Base URL for the API (e.g., https://xxx.ngrok-free.app)")
    parser.add_argument("--max-new-tokens", type=int, default=160, help="Max new tokens for answers")
    parser.add_argument("--ping", action="store_true", help="Use /ping (no RAG) instead of /chat")
    parser.add_argument("--generate", action="store_true", help="Use /generate (plain text completion) instead of /chat")
    parser.add_argument("--raw", action="store_true", help="Also print raw JSON response")
    args = parser.parse_args()

    base = get_base_url(args)
    print(f"Connecting to {base} ...")

    health = call_health(base)
    if "error" in health:
        print(f"[!] Health check failed: {health['error']}")
        sys.exit(1)
    print(f"[ok] Health: {health}")

    # Prepare logging
    logs_dir = pathlib.Path("logs")
    logs_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_path = logs_dir / f"chat_{ts}.jsonl"
    print(f"[log] Writing to {log_path}")

    print("\nType your question (Ctrl+C to exit)\n")
    try:
        while True:
            q = input("> ").strip()
            if not q:
                continue

            if args.generate:
                print("[Calling /generate ...]", flush=True)
                t0 = time.time()
                try:
                    resp = call_generate(base, q, max_tokens=min(args.max_new_tokens, 500))
                except requests.exceptions.RequestException as e:
                    print(f"[error] {e}")
                    continue
            elif args.ping:
                print("[Calling LLM...]", flush=True)
                t0 = time.time()
                try:
                    resp = call_ping(base, q, max_new_tokens=min(args.max_new_tokens, 200))
                except requests.exceptions.RequestException as e:
                    print(f"[error] {e}")
                    continue
            else:
                print("[Retrieving context...]", flush=True)
                print("[Calling LLM...]", flush=True)
                t0 = time.time()
                try:
                    resp = call_chat(base, q, max_new_tokens=args.max_new_tokens)
                except requests.exceptions.RequestException as e:
                    print(f"[error] {e}")
                    continue

            elapsed = time.time() - t0
            # try /generate shape first
            if args.generate:
                # accept {text} or {output}
                txt = resp.get('text') if isinstance(resp, dict) else None
                if not txt and isinstance(resp, dict):
                    txt = resp.get('output')
                answer, sources, latency = (txt or ''), [], round(elapsed, 3)
            else:
                answer, sources, latency = _parse_answer(resp, elapsed_fallback=round(elapsed, 3))

            if args.raw:
                print("\n[raw]", json.dumps(resp, ensure_ascii=False))

            print("\nAnswer:", answer or "(empty)")
            if sources:
                print("Sources:", ", ".join(sources))
            if latency is not None:
                print(f"Latency: {latency}s")
            print()

            with open(log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps({
                    "ts": time.time(),
                    "question": q,
                    "response": resp
                }, ensure_ascii=False) + "\n")

    except KeyboardInterrupt:
        print("\nBye!")

if __name__ == "__main__":
    main()
