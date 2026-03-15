# Real-Time Driver Location Tracking Implementation

By relying on STOMP messaging for geospatial coordinates, we can stream a driver's live GPS movement to an active rider precisely like Uber, without obliterating our MySQL database.

## 1. Message Format for Location Payload

First, define a strict payload configuration so the driver and rider applications understand exactly what data structure they are working with.

```java
// src/main/java/com/takeme/dto/LocationPayload.java
package com.takeme.dto;
import lombok.Data;

@Data
public class LocationPayload {
    private Long driverId;
    private Long rideId;
    private double latitude;
    private double longitude;
    private double heading; // 0-360 degrees for car rotation parsing on the Map
    private double timestamp;
}
```

## 2. Spring Boot WebSocket Message Endpoint

Now, create a `@Controller` that uses `@MessageMapping`. STOMP handles routing messages sent by the **Driver** to `/app/driver/location/{rideId}` right into this method. 

```java
// src/main/java/com/takeme/controller/WebSocketLocationController.java
package com.takeme.controller;

import com.takeme.dto.LocationPayload;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketLocationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Driver emits payload to: /app/driver/location/{rideId}
     * Back-end broadcasts to: /topic/driver-location/{rideId}
     */
    @MessageMapping("/driver/location/{rideId}")
    public void receiveAndBroadcastDriverLocation(
            @DestinationVariable Long rideId, 
            LocationPayload locationPayload) {
            
        // Security checks: Are they an authenticated driver? Is the ride ACTIVE?
        // (Optional check: Is this ride assigned to this driver?)
        
        // Broadcast the mapped coordinates immediately downstream to the subscriber (Rider)
        messagingTemplate.convertAndSend(
            "/topic/driver-location/" + rideId, 
            locationPayload
        );
        
        // 8 & 9. Preventing Database Overload via Redis integration (Optional logic handled async)
        // redisTemplate.opsForGeo().add("active_driver_locations", new Point(locationPayload.getLongitude(), locationPayload.getLatitude()), locationPayload.getDriverId());
    }
}
```

## 3. React Driver Implementation: Publishing Coordinates
The Driver's app handles capturing GPS data organically per device updates.

```javascript
import { useEffect, useRef } from 'react';
import WebSocketService from '../../services/WebSocketService';

const DriverLiveMap = ({ rideId, driverId }) => {
    const watchIdRef = useRef(null);

    useEffect(() => {
        // Connect STOMP socket if not already active
        WebSocketService.connect();

        if ("geolocation" in navigator) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const payload = {
                        driverId: driverId,
                        rideId: rideId,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        heading: position.coords.heading || 0, // In degrees (from true north)
                        timestamp: position.timestamp
                    };
                    
                    // Broadcast directly to Spring Boot
                    if (WebSocketService.client && WebSocketService.client.connected) {
                        WebSocketService.client.publish({
                            destination: `/app/driver/location/${rideId}`,
                            body: JSON.stringify(payload)
                        });
                    }
                },
                (error) => console.error(error.message),
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,        // Forces device to ignore cache
                    timeout: 27000        // Maximum time allowed to retrieve position
                }
            );
        }
        
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [rideId, driverId]);
    
    return <div>Driver Maps SDK container</div>;
}
```

## 4. React Rider Implementation: Consuming Coordinates

The Rider's app leverages the Google Maps `<Marker />` overlay. 

```javascript
import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import WebSocketService from '../../services/WebSocketService';

const RiderMapTracking = ({ rideId }) => {
    const [driverLocation, setDriverLocation] = useState(null);

    useEffect(() => {
        let subscription = null;
        
        WebSocketService.connect(() => {
            subscription = WebSocketService.client.subscribe(
                `/topic/driver-location/${rideId}`,
                (message) => {
                    const locationData = JSON.parse(message.body);
                    setDriverLocation({
                        lat: locationData.latitude,
                        lng: locationData.longitude,
                        heading: locationData.heading
                    });
                }
            );
        });

        return () => {
             if (subscription) subscription.unsubscribe();
        };
    }, [rideId]);

    // Google Map configuration
    const mapContainerStyle = { width: '100%', height: '500px' };
    
    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={15}
            center={driverLocation || { lat: 0, lng: 0 }} // Centers on driver gracefully
        >
            {driverLocation && (
                <Marker 
                    position={driverLocation} 
                    icon={{
                        // Basic car icon setup, rotating by heading
                        url: "/assets/car-top-down-icon.png",  
                        scaledSize: new window.google.maps.Size(40, 40),
                        rotation: driverLocation.heading // Rotation applies to SVG maps
                    }}
                />
            )}
        </GoogleMap>
    );
};
```

## 5. System Architectural Rules

1. **Fire and Forget Coordinates:** Never ever use `.save(location)` onto MySQL inside the `@MessageMapping` endpoint. The Google Geolocation API can fire up to 1-3 times a second per driver. A thousand drivers means 3k inserts per second. Relational DBs will lock up instantly.
2. **Ephemeral Caching (Redis/Kafka):** If you must persist driver routes for safety logs, push the Payload into an asynchronous Kafka Topic, and let a background consumer batch-insert them into a fast timeseries database (like InfluxDB or MongoDB) every 30 seconds.
3. **Graceful Disconnects:** Mobile environments drop sockets. Ensure your WebSocket service auto-reconnects with `reconnectDelay` so the driver's phone resumes sending transparently upon tunnel exits or 5G cell tower handoffs.
