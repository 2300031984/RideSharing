package com.takeme.service;

import com.takeme.dto.NearbyDriverDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.geo.Circle;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.GeoResults;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DriverLocationService {

    private static final String DRIVER_GEO_KEY = "drivers:locations";

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Value("${app.feature.redis.enabled:true}")
    private boolean isRedisEnabled;

    public void updateDriverLocation(Long driverId, double lat, double lng) {
        if (!isRedisEnabled) return;
        Point point = new Point(lng, lat); // Redis takes Lng first
        redisTemplate.opsForGeo().add(DRIVER_GEO_KEY, point, String.valueOf(driverId));
        
        // TTL for active locations, expires if no update within 5 minutes
        redisTemplate.expire(DRIVER_GEO_KEY, Duration.ofMinutes(5));
    }

    public void removeDriverLocation(Long driverId) {
        if (!isRedisEnabled) return;
        redisTemplate.opsForGeo().remove(DRIVER_GEO_KEY, String.valueOf(driverId));
    }

    public List<NearbyDriverDto> getNearbyDrivers(double lat, double lng, double radiusKm) {
        if (!isRedisEnabled) {
            System.out.println("[REDIS MOCK] Skipping nearby driver search (Redis disabled)");
            return List.of();
        }
        Point center = new Point(lng, lat);
        Distance radius = new Distance(radiusKm, RedisGeoCommands.DistanceUnit.KILOMETERS);
        Circle circle = new Circle(center, radius);

        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs
                .newGeoRadiusArgs()
                .includeDistance()
                .includeCoordinates()
                .sortAscending()
                .limit(20);

        GeoResults<RedisGeoCommands.GeoLocation<String>> results =
                redisTemplate.opsForGeo().radius(DRIVER_GEO_KEY, circle, args);

        if (results == null) {
            return List.of();
        }

        return results.getContent().stream()
                .map(result -> {
                    String driverIdStr = result.getContent().getName();
                    double distance = result.getDistance().getValue();
                    Point coords = result.getContent().getPoint();
                    
                    return new NearbyDriverDto(
                            Long.parseLong(driverIdStr),
                            coords.getY(),
                            coords.getX(),
                            distance
                    );
                }).collect(Collectors.toList());
    }
}
