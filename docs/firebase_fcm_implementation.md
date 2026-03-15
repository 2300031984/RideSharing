# Firebase Cloud Messaging (FCM) Integration

To reliably deliver notifications to users even when the React application is running in the background or completely closed, we will employ **Firebase Cloud Messaging (FCM)**. This decouples notifications from the active STOMP WebSocket connections.

## System Architecture

1. **Token Registration:** When a user logs into the React frontend, the app requests notification permissions from the browser/OS, connects to the Firebase JS SDK, and acquires a unique FCM Registration Token.
2. **Backend Storage:** The frontend securely sends this token to `POST /api/users/fcm-token`. Spring Boot stores this token inside the `Rider` or `Driver` database mapping.
3. **Event Triggers:** When significant lifecycle events occur (e.g., Driver Accepted, Ride Completed, Payment Successful), the backend services (like our `NotificationConsumer` in Kafka) invoke the `FcmNotificationService`.
4. **FCM Dispatch:** Spring Boot utilizes the `firebase-admin` Java SDK to dispatch a JSON payload targeting the specific user's `fcmToken`.
5. **Background Delivery:** Google's FCM network delivers the push notification directly to the user's device operating system, displaying a native alert.

## 1. Spring Boot Dependencies

```xml
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
```

## 2. Configuration & Initialization

You will need a `firebase-service-account.json` file generated from your Firebase Console (Project Settings -> Service Accounts -> Generate new private key). We will map this via `application.properties`:

```properties
app.firebase.config.path=classpath:firebase-service-account.json
```

```java
// FirebaseConfig.java
@Configuration
public class FirebaseConfig {
    @Value("${app.firebase.config.path}")
    private String firebaseConfigPath;

    @PostConstruct
    public void initialize() {
        try {
            ClassPathResource resource = new ClassPathResource(firebaseConfigPath.replace("classpath:", ""));
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(resource.getInputStream()))
                .build();
                
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## 3. Database Modifications

Both `Rider` and `Driver` (or your unified `User` model) need to support storing the token.
```java
@Column(name = "fcm_token")
private String fcmToken;
```

## 4. FCM Token API Endpoint

```java
// UserController.java
@PostMapping("/api/users/fcm-token")
public ResponseEntity<?> updateFcmToken(@RequestParam Long userId, @RequestParam String token) {
    // userService.updateFcmToken(userId, token);
    return ResponseEntity.ok(Map.of("message", "FCM token updated successfully"));
}
```

## 5. FcmNotificationService Implementation

```java
@Service
public class FcmNotificationService {

    public void sendPushNotification(String targetToken, String title, String body, Map<String, String> data) {
        if (targetToken == null || targetToken.isEmpty()) return;

        Message message = Message.builder()
                .setToken(targetToken)
                .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .putAllData(data != null ? data : new HashMap<>())
                .build();

        try {
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("Successfully sent message: " + response);
        } catch (FirebaseMessagingException e) {
            System.err.println("Error sending FCM message: " + e.getMessage());
        }
    }
}
```

## 6. React Frontend Integration

You need the `firebase` npm package.
`npm install firebase`

1. **firebase.js configuration:** Initialize your Firebase project params in the React app.
2. **Requesting the Token:** When the user logs in:
```javascript
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebase"; // your initialized firebase app

const messaging = getMessaging(app);

export const requestFirebaseNotificationPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' });
      // Send token to our Spring Boot endpoint
      await fetch(`/api/users/fcm-token?userId=${userId}&token=${token}`, { method: 'POST' });
    }
  } catch (error) {
    console.error("FCM Token Error:", error);
  }
};
```
3. **Handling Background Messages:** A service worker `firebase-messaging-sw.js` must be placed in the `public/` directory of the React app to intercept messages when the browser window is closed.

## User Review Required

> [!CAUTION]
> This integration requires a `firebase-service-account.json` key file and a configured Firebase project. Do you already have a Firebase project created to drop the keys into, or would you like me to mock these configurations for now so the architecture relies on placeholders?

Please review this design. If approved, I will begin execution.
