package com.takeme.interceptor;

import com.takeme.service.RateLimitService;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    @Autowired
    private RateLimitService rateLimitService;

    @Value("${app.feature.redis.enabled:true}")
    private boolean isRedisEnabled;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        
        if (!isRedisEnabled) {
            return true;
        }

        // Skip rate-limiting entirely for real-time STOMP bridges or static payload transfers
        if (path.startsWith("/ws") || path.contains(".")) {
            return true;
        }

        String clientId = getClientId(request);
        ConsumptionProbe probe;

        // Route evaluation
        if (path.startsWith("/api/auth/")) {
            probe = rateLimitService.tryConsumeLogin(clientId);
        } else if (path.equals("/api/rides/estimate")) {
            probe = rateLimitService.tryConsumeFareEstimate(clientId);
        } else {
            probe = rateLimitService.tryConsumeGeneral(clientId);
        }

        // Action block
        if (probe.isConsumed()) {
            // Append header telemetry on exactly how many allocations are left
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            return true;
        } else {
            // Throw exception formatting returning standard HTTP 429
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
            response.addHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Too many requests. Overwhelmed backend detected. Please try again later.\"}");
            return false;
        }
    }

    private String getClientId(HttpServletRequest request) {
        // Attempt to extract Authorization token claim first
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            // Mapping substring as mock signature for JWT User Principal mapping
            return authHeader.length() > 20 ? authHeader.substring(7, 20) : authHeader.substring(7); 
        }
        
        // Fallback to IP address if unauthenticated
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}
