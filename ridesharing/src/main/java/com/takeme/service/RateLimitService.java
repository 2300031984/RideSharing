package com.takeme.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RateLimitService {

    @Autowired
    private ProxyManager<byte[]> proxyManager;

    public ConsumptionProbe tryConsumeLogin(String clientId) {
        Bucket bucket = proxyManager.builder().build(("rate:login:" + clientId).getBytes(), this::newLoginBucket);
        return bucket.tryConsumeAndReturnRemaining(1);
    }
    
    public ConsumptionProbe tryConsumeFareEstimate(String clientId) {
        Bucket bucket = proxyManager.builder().build(("rate:fare:" + clientId).getBytes(), this::newFareEstimateBucket);
        return bucket.tryConsumeAndReturnRemaining(1);
    }
    
    public ConsumptionProbe tryConsumeGeneral(String clientId) {
        Bucket bucket = proxyManager.builder().build(("rate:general:" + clientId).getBytes(), this::newGeneralBucket);
        return bucket.tryConsumeAndReturnRemaining(1);
    }

    private BucketConfiguration newLoginBucket() {
        return BucketConfiguration.builder()
                .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1))))
                .build();
    }
    
    private BucketConfiguration newFareEstimateBucket() {
        return BucketConfiguration.builder()
                .addLimit(Bandwidth.classic(20, Refill.intervally(10, Duration.ofMinutes(1))))
                .build();
    }

    private BucketConfiguration newGeneralBucket() {
        // Standard Operating Polling: 60 capacities natively
        return BucketConfiguration.builder()
                .addLimit(Bandwidth.classic(60, Refill.intervally(60, Duration.ofMinutes(1))))
                .build();
    }
}
