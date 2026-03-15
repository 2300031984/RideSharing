import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.client = null;
    }

    connect(onConnected, onError) {
        if (this.client && this.client.connected) {
            if (onConnected) onConnected();
            return;
        }

        const API = import.meta.env?.VITE_API_URL || 'http://localhost:8081';
        const socket = new SockJS(`${API}/ws-ride`);
        
        this.client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: function (str) {
                console.log('STOMP: ' + str);
            }
        });

        this.client.onConnect = () => {
            console.log('STOMP: Connected successfully');
            if (onConnected) onConnected();
        };
        
        this.client.onStompError = (frame) => {
            console.error('STOMP Error:', frame.headers['message']);
            if (onError) onError(frame);
        };

        this.client.activate();
    }

    subscribeToRideUpdates(rideId, callback) {
        if (this.client && this.client.connected) {
            console.log(`STOMP: Subscribing to /topic/ride-updates/${rideId}`);
            return this.client.subscribe(`/topic/ride-updates/${rideId}`, (message) => {
                if (message.body) {
                    callback(JSON.parse(message.body));
                }
            });
        } else {
            console.warn('STOMP: Cannot subscribe, client not connected');
            return null;
        }
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }
    }
}

export default new WebSocketService();
