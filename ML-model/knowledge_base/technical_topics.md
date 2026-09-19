# Technical Interview Topics — Complete Reference

## Data Structures & Algorithms

### Arrays & Strings
- **Two Pointer Technique**: Use when searching for pairs, palindromes, or sorted array operations. Time: O(n), Space: O(1).
- **Sliding Window**: Use for subarray/substring problems with constraints. Time: O(n).
- **Prefix Sum**: Pre-compute cumulative sums for range query problems. Time: O(n) preprocessing, O(1) queries.

### Linked Lists
- **Fast & Slow Pointer (Floyd's)**: Detect cycles, find middle node, detect intersection.
- **Dummy Head Node**: Simplifies edge cases in insertion/deletion.
- **Reversal**: Iterative (3 pointers) vs Recursive approaches.

### Stacks & Queues
- **Monotonic Stack**: Next Greater Element, histogram problems. Time: O(n).
- **Queue with Two Stacks**: Amortized O(1) for enqueue/dequeue.
- **Priority Queue (Heap)**: Top-K problems, merge K sorted lists. Time: O(n log k).

### Trees & Graphs
- **BFS (Breadth-First Search)**: Level-order traversal, shortest path in unweighted graphs.
- **DFS (Depth-First Search)**: Preorder/Inorder/Postorder, path finding, connected components.
- **Binary Search Tree**: Inorder traversal gives sorted order. Search/Insert/Delete: O(log n) average.
- **Trie (Prefix Tree)**: Autocomplete, spell check, word search. Insert/Search: O(word length).

### Dynamic Programming
- **Top-Down (Memoization)**: Recursive with cache. Easier to implement.
- **Bottom-Up (Tabulation)**: Iterative, fills table. More space-efficient.
- **Common Patterns**: 0/1 Knapsack, Longest Common Subsequence, Coin Change, House Robber.
- **State Identification**: Define what changes between subproblems.

### Sorting & Searching
- **Binary Search**: O(log n). Use for sorted arrays, search space reduction.
- **Merge Sort**: O(n log n), stable, good for linked lists.
- **Quick Sort**: O(n log n) average, in-place, not stable.
- **Counting/Radix Sort**: O(n + k) for bounded integer ranges.

---

## Time & Space Complexity Cheat Sheet

| Algorithm | Time (Best) | Time (Average) | Time (Worst) | Space |
|-----------|-------------|----------------|--------------|-------|
| Binary Search | O(1) | O(log n) | O(log n) | O(1) |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) |
| Hash Table Lookup | O(1) | O(1) | O(n) | O(n) |
| BFS/DFS | O(V+E) | O(V+E) | O(V+E) | O(V) |
| Dijkstra's | O((V+E)log V) | O((V+E)log V) | O((V+E)log V) | O(V) |

---

## System Design Fundamentals

### Load Balancing
- **Round Robin**: Simple, equal distribution. Good for homogeneous servers.
- **Weighted Round Robin**: Assigns more traffic to more powerful servers.
- **Least Connections**: Routes to server with fewest active connections.
- **Consistent Hashing**: Minimizes redistribution when servers are added/removed.

### Caching Strategies
- **Cache-Aside (Lazy Loading)**: App checks cache first, then DB. Most common pattern.
- **Write-Through**: Write to cache and DB simultaneously. Ensures consistency.
- **Write-Behind (Write-Back)**: Write to cache, async write to DB. Better performance, risk of data loss.
- **TTL (Time To Live)**: Set expiration to prevent stale data.
- **Tools**: Redis, Memcached. Redis supports data structures (sorted sets, lists, hashes).

### Database Design
- **SQL vs NoSQL**: SQL for structured data with relationships (PostgreSQL, MySQL). NoSQL for flexible schema, high write throughput (MongoDB, DynamoDB).
- **Indexing**: B-Tree indexes for range queries. Hash indexes for equality lookups. Composite indexes for multi-column queries.
- **Sharding**: Horizontal partitioning across servers. Shard key selection is critical.
- **Replication**: Master-Slave for read scaling. Master-Master for write availability.
- **ACID vs BASE**: SQL = ACID (consistency). NoSQL = BASE (availability).

### Message Queues
- **RabbitMQ**: Traditional message broker. Good for task queues, pub/sub.
- **Apache Kafka**: Distributed event streaming. High throughput, log-based. Good for event sourcing.
- **Use Cases**: Async processing, microservice communication, event-driven architecture.

### API Design
- **REST**: Resource-based URLs, HTTP methods (GET/POST/PUT/DELETE), stateless. Most common.
- **GraphQL**: Client specifies exact data needed. Single endpoint. Good for mobile apps with bandwidth constraints.
- **gRPC**: Binary protocol (Protocol Buffers). High performance. Good for internal microservice communication.
- **Versioning**: URL versioning (/api/v1/) or header versioning (Accept: application/vnd.api.v1+json).

---

## Web Development Fundamentals

### Node.js & Express
- **Event Loop**: Single-threaded, non-blocking I/O. Handles concurrent connections via callbacks/promises.
- **Middleware Pattern**: Request → Middleware chain → Route handler → Response.
- **Error Handling**: Express error middleware with 4 params (err, req, res, next).
- **Security**: helmet for headers, cors for cross-origin, rate-limit for DDoS protection, JWT for authentication.

### React & React Native
- **Virtual DOM**: React diffs virtual DOM to minimize real DOM updates. O(n) reconciliation algorithm.
- **Hooks**: useState (state), useEffect (side effects), useContext (global state), useMemo/useCallback (memoization).
- **Component Lifecycle**: Mount → Update → Unmount (mapped to useEffect dependencies).
- **State Management**: Context API for simple apps, Redux/Zustand for complex state, React Query for server state.

### TypeScript
- **Static Typing**: Catch errors at compile time. Interfaces, generics, type guards.
- **Utility Types**: Partial<T>, Required<T>, Pick<T,K>, Omit<T,K>, Record<K,V>.
- **Generics**: Reusable type-safe functions and classes. `function identity<T>(arg: T): T`.
- **Type Guards**: `typeof`, `instanceof`, custom type predicates for narrowing.

### PostgreSQL & SQL
- **Joins**: INNER (matching rows), LEFT (all from left + matching), RIGHT, FULL OUTER.
- **Aggregations**: GROUP BY + HAVING for filtered aggregation. COUNT, SUM, AVG, MIN, MAX.
- **Window Functions**: ROW_NUMBER(), RANK(), LAG(), LEAD() — analytics over partitions.
- **CTEs (Common Table Expressions)**: WITH clause for readable complex queries.
- **Transactions**: BEGIN/COMMIT/ROLLBACK. Isolation levels: READ COMMITTED, SERIALIZABLE.

---

## DevOps & Cloud Basics

### Docker
- **Dockerfile**: FROM → COPY → RUN → EXPOSE → CMD. Multi-stage builds for smaller images.
- **Docker Compose**: Multi-container orchestration. Define services, networks, volumes.
- **Volumes**: Persist data beyond container lifecycle.

### CI/CD Pipeline
- **Stages**: Build → Test → Deploy. Fail fast principle.
- **Tools**: GitHub Actions, Jenkins, GitLab CI, CircleCI.
- **Best Practices**: Automated testing, code review gates, staging environments.

### AWS Basics
- **EC2**: Virtual servers. Auto Scaling Groups for elasticity.
- **S3**: Object storage. Static website hosting, file uploads.
- **RDS**: Managed relational databases (PostgreSQL, MySQL).
- **Lambda**: Serverless functions. Pay per invocation.
- **CloudFront**: CDN for low-latency content delivery.
