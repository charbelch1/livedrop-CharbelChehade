# LiveDrop System Design

This repository contains the system design for a **Live Drop application**, demonstrating a scalable, high-throughput architecture with stateless microservices, event-driven communication, caching strategies, and observability.

## Graph Link
[Excalidraw Diagram Placeholder]([ADD_YOUR_EXCALIDRAW_LINK_HERE](https://excalidraw.com/#json=G6ZkETzjBxfdCRN_NfrjM,KqDSHiViwXq2iqMISiGSkw))

---

## Key Design Principles

### Stateless Microservices
**Core services:**
- **Auth Service** – handles authentication and authorization (JWT/session tokens).
- **User Service** – manages user profiles and account data.
- **Creator Service** – manages creator profiles and content publishing.
- **Drops Service** – handles drops (upcoming, live, ended) and product stock.
- **Order Service** – processes orders and manages stock updates.
- **Follow Service** – manages following/unfollowing creators and follower counts.
- **Notification Service** – sends push, email, or in-app notifications to users.
- **Feed Service** – precomputes and caches user feeds for low-latency browsing.
- **Payment Service** – handles payment processing, payment status updates, and integration with external payment gateways (credit card, PayPal, etc.).

**Stateless characteristics of all services:**
- Horizontal scaling under high load.
- Load balancing and failover.
- Easy deployment of new instances during traffic spikes.
- Stateless design ensures the system can scale elastically without maintaining local state.

---

## Data Model (SQL)
- All core entities are stored in SQL DB, including:
  - Users, Creators, Products, Drops, Orders, Followers, Payment, Notifications.
- SQL provides ACID transactions, ensuring:
  - Reliable stock decrements during high-concurrency purchases.
  - Consistent relationships between entities.
- **Follower data is hash-partitioned by creator_id**:
  - Large follower graphs for celebrity creators are distributed across multiple partitions (buckets) to prevent hotspots.
  - Partitioning is combined with indexes on critical columns for efficient querying.
- Materialized views and cursor-based pagination optimize read performance on large datasets.
- **Tradeoff:** SQL scaling is harder than NoSQL for extremely large follower graphs, but partitioning and indexing mitigate performance issues.

---

## Caching and Coordination (Redis + Redlock)
- **Redis Cluster** (sharded and replicated) is the central caching layer for high-throughput, low-latency access to hot data.
- Cached data includes:
  - Product snapshots and stock counters – used by Drops and Order services for fast reads during flash sales.
  - User feeds (precomputed timelines per follower) – used by Feed Service to deliver low-latency feeds.
  - Follower counts – maintained by Follow Service for fast retrieval without hitting Postgres.
  - Rate limits and authentication sessions – tracked by API Gateway and Auth Service.
- **Redlock distributed locks** prevent overselling during high-concurrency flash sales, primarily in Order and Drops services.
- **Caching Strategies and Invalidation:**
  - Product stock: decremented atomically; cache evicted when stock reaches zero.
  - User feeds: invalidated when a creator starts a drop; refreshed with new feed entries.
  - Follower counts: updated incrementally on follow/unfollow events.
  - TTL fallback: all Redis keys have short TTLs to prevent stale data.

---

## Event-Driven Architecture (Kafka)
- Kafka enables asynchronous, high-throughput event processing to decouple services and allow real-time updates.
- **Example events and producers:**
  - `order_created` → Order Service
  - `drop_started`, `drop_ended` → Drops Service
  - `user_followed_creator`, `user_unfollowed_creator` → Follow Service
  - `payment_initiated`, `payment_completed`, `payment_failed` → Payment Service
- **Consumers of Kafka events:**
  - Payment Service → consumes `order_created` to process payments.
  - Notification Service → sends push, email, or in-app notifications.
  - Feed Service → updates and precomputes user feeds in Redis using drop and follow events.
  - Order Service → consumes `payment_completed` or `payment_failed` to update order status.
- **Benefits:**
  - Decouples services from synchronous operations; critical flows are not blocked.
  - Supports near real-time fanout and updates across multiple services.
  - Enables horizontal scalability, as consumers process events independently.
- **Tradeoff:**
  - Adds infrastructure complexity and operational overhead but is essential for high-throughput, low-latency event delivery under flash-sale traffic.

---

## Performance Optimization Techniques
1. **Partitioning and Bucketing**  
   - Follower data is hash-partitioned into buckets to reduce hotspots from celebrity creators.  
2. **Indexing**  
   - Critical columns (user_id, creator_id, product_id) are indexed. Materialized views support complex queries like feed generation.  
3. **Precomputed Feeds**  
   - User feeds are pre-warmed in Redis for low-latency browsing. Invalidation occurs when creators start a drop.  
4. **Cursor-Based Pagination**  
   - Efficiently handles large result sets without full-table scans.  
5. **Stock Counters**  
   - Redlock prevents overselling in high-concurrency scenarios.

---

## Observability (Datadog + OpenTelemetry)
- Every service is instrumented for monitoring, tracing, and alerting.
- Metrics tracked include:
  - p95 latency
  - Cache hit ratio
  - Lock contention
  - Follower distribution
- Enables proactive detection and resolution of performance bottlenecks.

---

## Tradeoffs and Design Decisions
- **SQL vs NoSQL:** SQL provides ACID transactions for stock and entity consistency. Large follower graphs are harder to scale but partitioning and indexing mitigate this.  
- **Redis + Redlock:** Guarantees atomic stock decrements but adds lock latency and Redis dependency.  
- **Kafka:** Decouples services and enables near real-time fanout; adds infrastructure overhead.  
- **Search (Elasticsearch):** Provides fast, full-text queries with advanced filtering and relevance scoring. Adds infrastructure but improves search performance.  
- **Precomputed Feeds:** Enables low-latency user experience; invalidation adds complexity.  
- **Observability:** Datadog ensures latency, cache, and event flow monitoring for system reliability.

---
