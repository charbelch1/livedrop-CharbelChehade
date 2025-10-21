# LiveDrop – System Design Assignment

## Architecture Diagram
You can view the high-level system architecture here:  
[Excalidraw Diagram](https://excalidraw.com/#json=WfUjrnsMZtuNmCvjt5YE7,6XMCtBJk9zeZY00H6qNxCQ)

## Functional Requirements Coverage
- **Following/unfollowing creators** → handled by FollowSvc + Postgres + Redis cache.  
- **Listing followers/following with pagination** → supported by FollowSvc + Redis for fast lookups.  
- **Product creation and drops scheduling** → ProductSvc + DropSvc + Postgres.  
- **Browsing products/drops** → SearchSvc + Elasticsearch + caching.  
- **Real-time notifications** → Kafka → NotificationSvc → push/email/WebSocket.  
- **Orders with idempotency and no overselling** → OrderSvc + Redis (idempotency + counters) + Postgres (transactions).  
- **Single public API with clear resource-oriented endpoints** → API Gateway / REST BFF.  

## Non-Functional Requirements Coverage
- **Scalability** → Kafka decouples events, Redis caches hot data, Postgres replicas handle reads.  
- **Performance** → p95 read ≤200ms achieved with caching and search index.  
- **Reliability** → idempotency keys in Redis + Postgres constraints prevent duplicates and overselling.  
- **High-fanout (celebrity creators)** → Redis sharding/hash partitioning avoids hot spots.  
- **Notifications <2s** → asynchronous via Kafka + NotificationSvc.  
- **Security** → API Gateway handles auth, inter-service auth via tokens/mTLS.  
- **Observability** → all services export to Datadog + OpenTelemetry.  

## Caching Invalidation Strategy
- When stock/order updates → Postgres is source of truth.  
- Services publish events to Kafka → consumers update Redis or invalidate cached entries.  
- TTLs on Redis keys ensure stale data is short-lived.  

## Diagram Explanation
**1) API Gateway / REST BFF → Services**  
The gateway calls each service over HTTP/REST. It talks to:  
- UserSvc for authentication, profiles, and preferences.  
- CreatorSvc for creator pages and verification.  
- FollowSvc for follow/unfollow actions and follower counts.  
- ProductSvc for product details and prices.  
- DropSvc for live drop information and schedules.  
- OrderSvc for cart and checkout flows.  
The gateway also uses Redis Cluster directly for session caching, JWT tokens, rate-limits, and response caching.  

**2) Producers → Kafka**  
Several services publish domain events to Kafka so that others can react asynchronously.  
- OrderSvc publishes events like order placed, order confirmed, payment failed, and stock reserved/released.  
- DropSvc publishes drop created/updated and drop started/ended.  
- FollowSvc publishes follow added/removed and updated follower counts.  
- ProductSvc publishes product created/updated, price changed, and stock low.  
- CreatorSvc publishes creator verified/updated events.  
- UserSvc publishes user created/updated events.  
These events allow downstream services to react without tight coupling.  

**3) Kafka → Consumers**  
Kafka fans out events to consumers.  
- NotificationSvc consumes order, drop, and follow events so it can send push notifications, emails, SMS, or WebSocket updates.  
- ProductSvc consumes order-related events so it can reconcile stock and update inventory.  

**4) ProductSvc → CDN / Object Store**  
The Product Service pushes images, media, and product files to a CDN or object storage system. This offloads heavy media delivery, ensures global distribution, and allows signed URLs for uploads and downloads. Only references to these files are stored in the database.  

**5) Services → Redis Cluster**  
Several services use Redis for caching, rate-limiting, and fast lookups.  
- OrderSvc uses it for idempotency keys, cart tokens, and fast stock counters.  
- DropSvc caches active drops for very quick reads.  
- FollowSvc uses Redis to store follow sets and apply rate limits.  
- NotificationSvc uses Redis for throttling keys and ephemeral delivery state to avoid spamming.  
- The API Gateway also uses Redis for sessions, JWT caches, and global rate limits.  
Redis is treated as a cache or fast-access store, not the source of truth.  

**6) Search**  
SearchSvc communicates with Elasticsearch. It sends queries to Elasticsearch and also relies on indexing pipelines (typically through Kafka consumers) to keep documents fresh. This enables full-text search, autocomplete, and aggregations at scale.  

**7) Databases**  
Each domain service (Users, Creators, Followers, Products, Drops, Orders) persists data to Postgres Primary. This ensures strong consistency, relational integrity, and transactional guarantees. Read replicas can be added later for scaling read-heavy workloads.  

**8) Observability**  
All services and infrastructure components — including the BFF, each service, Kafka, Postgres, Redis, Elasticsearch, and CDN edge logs — export logs, metrics, and traces to Datadog and OpenTelemetry. This enables end-to-end tracing across service calls, monitoring of service-level objectives, alerting, and capacity planning. Traces should use consistent IDs across hops, sensitive data should be masked, and sampling should be configured appropriately.  

## Trade-offs
- **GraphQL vs REST**: we chose REST because it provides clear resource-oriented endpoints, aligns well with idempotency and pagination requirements, and is simpler to reason about for this exercise. GraphQL could have offered more flexible queries and reduced over-fetching, but REST keeps the design straightforward and easier to test, while still meeting performance and mobile efficiency requirements.  
- **Postgres vs NoSQL**: Postgres chosen for relational guarantees and strong consistency (inventory, orders). NoSQL could scale better for denormalized reads, but Postgres with replicas is sufficient here.  
- **Kafka + Redis**: Kafka ensures reliability and fanout, Redis ensures speed; using both adds complexity but balances performance and consistency.  
- **Search via Elasticsearch**: extra infra overhead, but needed for fast queries and autocomplete.  
