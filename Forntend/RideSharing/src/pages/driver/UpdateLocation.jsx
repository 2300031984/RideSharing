// src/pages/driver/UpdateLocation.jsx
import React, { useState } from "react";
import axios from "axios";

const API = (import.meta.env?.VITE_API_URL || "http://localhost:8081");

const UpdateLocation = () => {
  const driverId = JSON.parse(localStorage.getItem("user"))?.id;
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateBackend = async (latVal, lngVal) => {
    if (!driverId) { setMessage("No driver ID"); return; }
    try {
      setLoading(true);
      await axios.put(`${API}/api/drivers/${driverId}/location?lat=${latVal}&lng=${lngVal}`);
      setMessage("Location updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update location");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!lat || !lng) { setMessage("Enter lat/lng or use GPS"); return; }
    updateBackend(lat, lng);
  };

  const useMyGPS = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation not supported");
      return;
    }
    setMessage("Fetching your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latVal = pos.coords.latitude.toFixed(6);
        const lngVal = pos.coords.longitude.toFixed(6);
        setLat(latVal);
        setLng(lngVal);
        updateBackend(latVal, lngVal);
      },
      (err) => {
        console.error(err);
        setMessage("Permission denied or unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2 style={{ marginBottom: 12 }}>Update Location</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input type="text" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
        <input type="text" placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleUpdate} disabled={loading} style={{ padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer' }}>Update Location</button>
        <button onClick={useMyGPS} disabled={loading} style={{ padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer' }}>Use My GPS</button>
      </div>
      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
};

export default UpdateLocation;
