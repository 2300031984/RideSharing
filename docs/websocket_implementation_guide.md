# WebSocket Implementation Guide: Real-Time Ride Updates

Implementing WebSockets will greatly improve the user experience by replacing HTTP polling with instant bidirectional communication between the server and clients.

## 1. Required Dependencies (`pom.xml`)

Add the Spring Boot WebSocket starter. This pulls in the necessary Spring Messaging framework, WebSockets support, and default Jackson parsers.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

## 2. Spring Boot WebSocket Configuration (STOMP + SockJS)

Create a new configuration class to enable the message broker and register the WebSocket endpoint.

```java
package com.takeme.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker for messages prefixed with "/topic"
        config.enableSimpleBroker("/topic");
        
        // Prefix for messages that are bound for application-level @MessageMapping methods (if any)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The endpoint clients will use to connect to the WebSocket server
        // We enable SockJS fallback options for older browsers/network restrictions
        registry.addEndpoint("/ws-ride")
                .setAllowedOriginPatterns("*") // Configure strictly according to your CORS setup in production
                .withSockJS(); 
    }
}
```

## 3. WebSocket Endpoint Configuration
Covered in the `registerStompEndpoints` method above. The endpoint `/ws-ride` is what React will connect to initially.

## 4. Message Topics for Ride Updates

We will use the destination path: `/topic/ride-updates/{rideId}`.

By segregating topics per ride (`rideId`), a rider and a driver only ever subscribe to events relevant to their specific active ride. This enforces strict logical separation and reduces unnecessary network traffic compared to a global broadcast channel.

## 5 & 6. Sending Status Updates via `SimpMessagingTemplate`

Create a dedicated Notification Service to broadcast real-time state changes using `SimpMessagingTemplate`.

```java
package com.takeme.service;

import com.takeme.dto.RideResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RideNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcasts ride status updates to the specific ride topic.
     */
    public void sendRideUpdate(Long rideId, RideResponse rideResponse) {
        String destination = "/topic/ride-updates/" + rideId;
        messagingTemplate.convertAndSend(destination, rideResponse);
    }
}
```

Now, inside your existing `RideService.java`, integrate this service. Call `sendRideUpdate` whenever critical state transitions happen:

```java
@Autowired
private RideNotificationService notificationService;

public Ride acceptRide(Long rideId, Long driverId) {
    // Existing logic to accept the ride...
    Ride ride = rideRepository.findById(rideId).orElseThrow(...);
    ride.setStatus(RideStatus.ACCEPTED);
    ride.setDriverId(driverId);
    // save...
    
    // Broadcast the updated ride to the topic
    RideResponse response = convertToResponse(ride);
    notificationService.sendRideUpdate(rideId, response);
    
    return ride;
}
```
*(Repeat this integration for `startRide`, `completeRide`, and `cancelRide`).* 

## 7 & 8. React Setup & WebSocket Service Implementation

First, install the required packages:
```bash
npm install sockjs-client @stomp/stompjs
```

Create a service class to handle connections centrally. 

```javascript
// src/services/WebSocketService.js
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.client = null;
    }

    connect(onConnected, onError) {
        // Replace with your backend URL
        const socket = new SockJS('http://localhost:8080/ws-ride');
        
        this.client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000, // Reconnect automatically upon disconnect
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: function (str) {
                console.log('STOMP: ' + str);
            }
        });

        this.client.onConnect = onConnected;
        this.client.onStompError = onError;

        this.client.activate();
    }

    subscribeToRideUpdates(rideId, callback) {
        if (this.client && this.client.connected) {
            return this.client.subscribe(`/topic/ride-updates/${rideId}`, (message) => {
                if (message.body) {
                    callback(JSON.parse(message.body));
                }
            });
        }
        return null;
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
        }
    }
}

export default new WebSocketService();
```

## 9. Example React Component Subscribing to Updates

Integrate the service into your Ride tracking component (e.g., Rider tracking the driver).

```javascript
// src/components/RideTracker.jsx
import React, { useEffect, useState } from 'react';
import WebSocketService from '../services/WebSocketService';

const RideTracker = ({ rideId }) => {
    const [rideStatus, setRideStatus] = useState('REQUESTED');
    const [rideData, setRideData] = useState(null);

    useEffect(() => {
        let subscription = null;

        // 1. Connect to WebSocket
        WebSocketService.connect(
            () => {
                console.log('Connected to WebSocket server');
                
                // 2. Subscribe to the specific ride topic
                subscription = WebSocketService.subscribeToRideUpdates(rideId, (updatedRide) => {
                    setRideStatus(updatedRide.status);
                    setRideData(updatedRide);
                });
            },
            (error) => {
                console.error('WebSocket connection error:', error);
            }
        );

        // Cleanup on unmount or when ride terminal state reached
        return () => {
            if (subscription) subscription.unsubscribe();
            WebSocketService.disconnect();
        };
    }, [rideId]);

    return (
        <div className="p-4 border rounded shadow-md">
            <h2 className="text-xl font-bold">Status: {rideStatus}</h2>
            {rideData && (
                <div className="mt-4">
                    <p><strong>Driver:</strong> {rideData.driverName || 'Looking for driver...'}</p>
                    <p><strong>Fare:</strong> ₹{rideData.fare}</p>
                    <p><strong>OTP:</strong> {rideData.otp}</p>
                </div>
            )}
        </div>
    );
};

export default RideTracker;
```

## 10. Best Practices for Scaling WebSockets in Production

1. **External Message Broker (RabbitMQ/ActiveMQ)**
   The Spring `enableSimpleBroker` is **in-memory** and **cannot scale horizontally** across multiple backend instances. In production, configure an external broker like RabbitMQ via `enableStompBrokerRelay`. When Instance A sends a message, RabbitMQ ensures a client connected to Instance B will receive it.
   ```java
   config.enableStompBrokerRelay("/topic")
         .setRelayHost("localhost")
         .setRelayPort(61613) // Default STOMP port for RabbitMQ/ActiveMQ
         .setClientLogin("guest")
         .setClientPasscode("guest");
   ```

2. **Load Balancer Tying & Stickiness**
   If you are falling back to SockJS HTTP long-polling due to network conditions, your Load Balancer (Nginx/ALB) needs **sticky sessions** (based on `IP Hash` or cookies). Without it, the sequential HTTP requests might hit different backend instances and break the SockJS protocol.

3. **Token-Based Handshake Security**
   Never allow unauthenticated WebSocket connections. Intercept the initial upgrade request in Spring Boot by implementing a `ChannelInterceptor` and validate the incoming Authorization JWT header before allowing the inner STOMP connection to establish.

4. **Event Lifecycle Management**
   Actively command the frontend to `.unsubscribe()` the topic listener the moment a ride hits a terminal state (COMPLETED, CANCELLED). This saves precious TCP port memory on both the device and server.
