import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Replace these placeholders with your actual Firebase Project keys configured from console.firebase.google.com
const firebaseConfig = {
  apiKey: "AIzaSy_YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:12345:web:abcd12345"
};

const app = initializeApp(firebaseConfig);
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

// Replace with the VAPID key exported from the Firebase Cloud Messaging settings
const VAPID_KEY = 'BXXXX_YOUR_PUBLIC_VAPID_KEY_XXXXC';

export const requestFirebaseNotificationPermission = async (userId, role) => {
  try {
    if (!messaging) return;
    
    console.log("Requesting Notification Permission...");
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      console.log("FCM Token retrieved successfully:", token);
      
      const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8081';
      // Ship token to backend profile bindings
      await fetch(`${API_URL}/api/users/fcm-token?userId=${userId}&role=${role}&token=${token}`, {
        method: 'POST',
      });
      return token;
    } else {
      console.log("User denied background notification permissions.");
    }
  } catch (error) {
    console.error("FCM Token Error:", error);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });
