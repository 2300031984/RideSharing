# High-Performance Geospatial Driver Matching using Redis

Driver matching through MySQL SQL queries running bounding boxes or Haversine math (`ORDER BY distance`) is a massive O(N) operation that locks database tables and destroys performance under load. 

By pushing this volatile data to an in-memory Redis structure specifically designed for geospatial queries (`GEOSPATIAL` or `GEOADD`/`GEOSEARCH`), lookups become `O(log(N))` and database traffic drops significantly.

## 1. Redis Dependency Configuration (`pom.xml`)

Add the Spring Boot Data Redis starter package.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<!-- If not already using generic pooling -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-pool2</artifactId>
</dependency>
```

## 2. Redis Connection Configuration

Add connections via `application.properties` or `application.yml`:

```properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
# spring.data.redis.password=yourpassword
```

Configuring your `RedisTemplate` wrapper in Spring:

```java
package com.takeme.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        return template;
    }
}
```

## 3 & 4. Redis GEO Service (Spring Implementation)

Here is the robust Service mapping to handle `GEOADD` and `GEOSEARCH` operations on the key `drivers:locations`.

```java
package com.takeme.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.geo.Circle;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.GeoResults;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DriverLocationService {

    private static final String DRIVER_GEO_KEY = "drivers:locations";

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    /**
     * Stores or updates the driver's location in Redis. (Replaces MySQL update)
     */
    public void updateDriverLocation(Long driverId, double lat, double lng) {
        Point point = new Point(lng, lat); // Redis takes Longitude FIRST
        redisTemplate.opsForGeo().add(DRIVER_GEO_KEY, point, String.valueOf(driverId));
        
        // Optional: Set a TTL on the location so offline drivers fall out of the cache automatically
        // Example: Only tracking drivers that updated within the last 5 minutes.
        // Doing this via Geospatial sets requires custom ZSET score management, 
        // but adding an expiration string ping is simpler:
        // redisTemplate.opsForValue().set("driver_active:" + driverId, "1", Duration.ofMinutes(5));
    }

    /**
     * Removes driver from the geospatial index (e.g. when they log off)
     */
    public void removeDriverLocation(Long driverId) {
        redisTemplate.opsForGeo().remove(DRIVER_GEO_KEY, String.valueOf(driverId));
    }

    /**
     * Executes GEOSEARCH/GEORADIUS to find nearby drivers
     */
    public List<NearbyDriverDto> getNearbyDrivers(double lat, double lng, double radiusKm) {
        Point center = new Point(lng, lat);
        Distance radius = new Distance(radiusKm, RedisGeoCommands.DistanceUnit.KILOMETERS);
        Circle circle = new Circle(center, radius);

        // Required explicitly to include distance in the return payload
        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs
                .newGeoRadiusArgs()
                .includeDistance()
                .includeCoordinates()
                .sortAscending()
                .limit(20); // only find closest 20

        GeoResults<RedisGeoCommands.GeoLocation<String>> results = 
                redisTemplate.opsForGeo().radius(DRIVER_GEO_KEY, circle, args);

        if (results == null) return List.of();

        return results.getContent().stream().map(result -> {
            String driverId = result.getContent().getName();
            double distance = result.getDistance().getValue();
            Point coordinates = result.getContent().getPoint();
            
            return new NearbyDriverDto(
                    Long.parseLong(driverId),
                    coordinates.getY(), // Lat
                    coordinates.getX(), // Lng
                    distance
            );
        }).collect(Collectors.toList());
    }
}
```

```java
// DTO Definition
package com.takeme.dto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NearbyDriverDto {
    private Long driverId;
    private double latitude;
    private double longitude;
    private double distanceKm;
}
```

## 5. Exposing the Driver Matching REST API

The endpoint requested `GET /api/drivers/nearby?lat={lat}&lng={lng}&radius=5`

```java
package com.takeme.controller;

import com.takeme.dto.NearbyDriverDto;
import com.takeme.service.DriverLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*")
public class DriverGeospatialController {

    @Autowired
    private DriverLocationService driverLocationService;

    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyDriverDto>> getNearbyDrivers(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radius) {
            
        List<NearbyDriverDto> nearbyDrivers = driverLocationService.getNearbyDrivers(lat, lng, radius);
        return ResponseEntity.ok(nearbyDrivers);
    }
    
    // In actual implementation, the STOMP WebSocket tracking flow you already 
    // built can inject the `LocationPayload` right into `DriverLocationService.updateDriverLocation()`.
}
```

## 6. Example API Response
```json
[
  {
    "driverId": 234,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "distanceKm": 1.25
  },
  {
    "driverId": 12,
    "latitude": 40.7100,
    "longitude": -74.0100,
    "distanceKm": 2.80
  }
]
```

## 7. Frontend Integration for Rider Matching

```javascript
// Function called right before initiating a `rideRequest`
const findNearbyDrivers = async (userLat, userLng) => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const API = import.meta.env?.VITE_API_URL || 'http://localhost:8081';
        
        const response = await fetch(
            `${API}/api/drivers/nearby?lat=${userLat}&lng=${userLng}&radius=5`, 
            {
               headers: { Authorization: `Bearer ${user.token}` }
            }
        );

        if (response.ok) {
            const drivers = await response.json();
            console.log(`Found ${drivers.length} drivers nearby!`);
            // Set these driver coordinates onto the map using <Marker> arrays
            setAvailableDrivers(drivers); 
            
            // Note: During actual ride dispatch, you would iterate over this array and send
            // push notifications or WebSocket pings to these specific driver IDs.
        }
    } catch (err) {
        console.error("Geospatial matching failed", err);
    }
}
```

## 8. Why Live Driver Location Should NEVER Be in MySQL

1. **Write Amplification:** `UPDATE driver SET lat = ?, lng = ?` causes B-Tree index rebuilds. Doing this every 2 seconds for 5,000 drivers generates immense Write-Ahead Logging overhead and crushes the `InnoDB` buffer pool.
2. **Read Amplification:** Haversine formulas in SQL require scanning the entire table to run distance math (`ACOS(SIN() ...)` before filtering `HAVING distance < 5`. 
3. **Volatility:** A driver's location from 5 seconds ago is entirely useless. It is ephemerally inherently memory-bound data.
4. **Conclusion:** Redis runs purely in memory using highly-optimized Sorted Sets (ZSet) layered with Geohash mapping under the hood (`GEOADD`), resulting in ~O(log N) fetch times—taking milliseconds versus seconds.

## 9. Next Scale Milestones
As you hit Uber scale volumes (10,000+ radius lookups per second), Redis `GEORADIUS` can sometimes bottleneck a single thread. Look into:
1. **Redis Enterprise Cluster** (Sharding by geographical regions via Geohash Prefixing).
2. Advanced engines like **H3** (Uber's hexagon index algorithm).
3. Eager background matching: Constantly pre-loading grid grids instead of ad-hoc queries on ride dispatch.
