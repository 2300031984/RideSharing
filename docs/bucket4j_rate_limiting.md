# Distributed Rate Limiting (Bucket4j + Redis)

To protect the Ride-Sharing backend from malicious botnets, brute-force dictionary attacks, and accidental client-side polling loops, we will implement **Token Bucket Algorithm** rate limits utilizing **Bucket4j**.

Because our backend runs as a stateless system designed to scale horizontally across multiple instances, the token buckets must be centrally managed in **Redis** rather than local JVM memory. This guarantees that limits apply cross-cluster.

## System Flow

1. **Interception**: Every HTTP API call entering Spring Boot hits the global `RateLimitInterceptor`.
2. **Identification**: The interceptor parses the endpoint URL (e.g., `/api/auth/login`) and extracts a unique client identifier (the `userId` JWT claim if authenticated, or the caller's IP string if unauthenticated).
3. **Redis Probe**: The interceptor builds a string key like `rate_limit:login:192.168.1.1` and queries the centralized Redis token bucket.
4. **Validation**: 
   - If tokens remain, Bucket4j deducts `1` token, and the Controller execution proceeds normally. 
   - If `0` tokens remain, Bucket4j instantly stops the chain and Spring Boot yields an `HTTP 429 (Too Many Requests)` exception preventing database saturation.
5. **Headers**: Both success and rejection responses carry tracking context natively: `X-Rate-Limit-Remaining`, `X-Rate-Limit-Retry-After`.

## 1. Dependencies

```xml
<!-- Bucket4j core mapping -->
<dependency>
    <groupId>com.github.vladimir-bukhtoyarov</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>7.6.0</version>
</dependency>
<dependency>
    <groupId>com.github.vladimir-bukhtoyarov</groupId>
    <artifactId>bucket4j-redis</artifactId>
    <version>7.6.0</version>
</dependency>
```

> NOTE: Because we are already using Spring Data Redis natively inside `application.properties` for the Geospatial driver routing, we don't need additional `.properties` bindings.

## 2. Configuration & Rate Rules (`RateLimitService`)

We will define three independent Token Buckets representing our core defense rules:

| Endpoint Target | Max Capacity / Window | Replenishment | Purpose |
|-----------------|----------------------|--------------|---------|
| `/api/auth/**` | 5 tokens | 5 per minute | Prevents brute force dictionary login attacks. |
| `/api/rides/estimate` | 20 tokens | 10 per minute | Stops botnets from scraping fare algorithms map data. |
| `/api/**` (General) | 100 tokens | 50 per minute | Standard operational constraints against DDOS polling. |

## 3. WebMvc Interceptor

The `RateLimitInterceptor` will sit dynamically right before our JWT authorization filter.
```java
@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    
    // Injects RateLimitService
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        String clientId = getClientId(request); // JWT principal or direct IP mapping
        
        ConsumptionProbe probe;

        if (path.startsWith("/api/auth/")) {
             probe = rateLimitService.tryConsumeLogin(clientId);
        } else if (path.equals("/api/rides/estimate")) {
             probe = rateLimitService.tryConsumeFareEstimate(clientId);
        } else {
             probe = rateLimitService.tryConsumeGeneral(clientId);
        }

        if (probe.isConsumed()) {
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            return true;
        } else {
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
            response.addHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value()); // HTTP 429
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Too many requests. Please try again later.\"}");
            return false;
        }
    }
}
```

## 4. Frontend Response Handling

React `fetch` blocks and HTTP libraries (`axios`) must logically catch 429 network errors.
```javascript
const response = await fetch('/api/rides/estimate');
if (response.status === 429) {
   const retrySecs = response.headers.get('X-Rate-Limit-Retry-After-Seconds');
   alert(`Rate limit triggered. Cooling down for ${retrySecs} seconds.`);
}
```

## User Review Required

> [!NOTE]
> Based on standard API definitions, 5 auth queries per minute per IP, and 100 general queries per minute per user are the standard defaults mapped. 
> Please review this `Bucket4j` schema. If approved, I will implement it directly onto your framework!
