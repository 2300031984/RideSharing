package com.takeme.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Value("${app.firebase.config.path}")
    private String firebaseConfigPath;
    
    @Value("${app.firebase.enabled:false}")
    private boolean isFirebaseEnabled;

    @PostConstruct
    public void initialize() {
        if (!isFirebaseEnabled) {
            System.out.println("Firebase FCM integration is disabled locally via app.firebase.enabled=false. Mocking outputs...");
            return;
        }

        try {
            ClassPathResource resource = new ClassPathResource(firebaseConfigPath.replace("classpath:", ""));
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(resource.getInputStream()))
                .build();
                
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("Firebase Admin SDK actively initialized for Push Notifications.");
            }
        } catch (IOException e) {
            System.err.println("Firebase initialized failed. Did you place 'firebase-service-account.json' into src/main/resources? " + e.getMessage());
        }
    }
}
