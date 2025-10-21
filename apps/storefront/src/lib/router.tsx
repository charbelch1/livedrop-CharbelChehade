import React, { useEffect, useMemo, useState } from 'react'

type RouteDef = { path: string; component: React.ReactNode }

const PATH_TOKEN = /:[^/]+/g

function compile(path: string) {
  const keys: string[] = []
  const pattern = path
    .replace(/\//g, '\\/')
    .replace(PATH_TOKEN, (m) => {
      keys.push(m.slice(1))
      return '([^/]+)'
    })
  const re = new RegExp('^' + pattern + '$')
  return { re, keys }
}

function matchPath(path: string, pattern: string) {
  const { re, keys } = compile(pattern)
  const m = re.exec(path)
  if (!m) return null
  const params: Record<string, string> = {}
  keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])))
  return params
}

const NavContext = React.createContext<{
  path: string
  navigate: (to: string) => void
}>({ path: '/', navigate: () => {} })

export const Router: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState(() => location.hash.replace('#', '') || '/')
  useEffect(() => {
    const onHash = () => setPath(location.hash.replace('#', '') || '/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const navigate = (to: string) => {
    if (!to.startsWith('/')) to = '/' + to
    if (to !== path) location.hash = to
  }
  return (
    <NavContext.Provider value={{ path, navigate }}>
      {children}
    </NavContext.Provider>
  )
}

export const Route: React.FC<RouteDef> = ({ path, component }) => {
  const ctx = React.useContext(NavContext)
  const params = useMemo(() => matchPath(ctx.path, path), [ctx.path, path])
  if (!params) return null
  return <ParamContext.Provider value={params}>{component}</ParamContext.Provider>
}

const ParamContext = React.createContext<Record<string, string>>({})
export function useParams<T extends Record<string, string> = Record<string, string>>() {
  return React.useContext(ParamContext) as T
}

export function useNavigate() {
  return React.useContext(NavContext).navigate
}

export const Link: React.FC<React.PropsWithChildren<{ href: string; className?: string }>> = ({ href, children, className }) => (
  <a className={className} href={`#${href}`}>{children}</a>
)

