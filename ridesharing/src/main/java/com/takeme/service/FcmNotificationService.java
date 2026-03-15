package com.takeme.service;

import com.google.firebase.messaging.*;
import com.takeme.repository.DriverRepository;
import com.takeme.repository.RiderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class FcmNotificationService {

    @Value("${app.feature.firebase.enabled:false}")
    private boolean isFirebaseEnabled;

    @Autowired
    private RiderRepository riderRepository;

    @Autowired
    private DriverRepository driverRepository;

    public void sendPushNotification(String targetToken, String title, String body, Map<String, String> data) {
        if (targetToken == null || targetToken.trim().isEmpty()) {
            System.out.println("[FCM Mock] Request blocked -> FCM token missing.");
            return;
        }

        if (!isFirebaseEnabled) {
            System.out.println("[FCM Mock] Push Notification generated successfully!");
            System.out.println("   To: " + targetToken);
            System.out.println("   Title: " + title);
            System.out.println("   Body: " + body);
            return;
        }

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
            System.out.println("Successfully sent FCM message: " + response);
        } catch (FirebaseMessagingException e) {
            System.err.println("Error sending FCM message: " + e.getMessage());
            
            // Cleanup dead tokens if unregistered or invalid
            MessagingErrorCode code = e.getMessagingErrorCode();
            if (code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT) {
                System.out.println("[FCM] Target token is invalid or unregistered (" + code + "). Pruning from DB: " + targetToken);
                
                riderRepository.findByFcmToken(targetToken).ifPresent(rider -> {
                    rider.setFcmToken(null);
                    riderRepository.save(rider);
                    System.out.println("[FCM] Pruned dead token from Rider: " + rider.getId());
                });
                
                driverRepository.findByFcmToken(targetToken).ifPresent(driver -> {
                    driver.setFcmToken(null);
                    driverRepository.save(driver);
                    System.out.println("[FCM] Pruned dead token from Driver: " + driver.getId());
                });
            }
        }
    }
}
