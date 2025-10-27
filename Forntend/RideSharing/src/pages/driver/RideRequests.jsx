// src/pages/driver/RideRequests.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DriverNavbar from "../../components/DriverNavbar";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

const API = (import.meta.env?.VITE_API_URL || "http://localhost:8081");

const STATUS_OPTIONS = ["REQUESTED", "ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const pageSize = 10;

const RideRequests = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const token = user?.token;
  const driverId = user?.id;

  const [status, setStatus] = useState("REQUESTED");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter(r =>
      (!status || r.status === status) &&
      (!q || (r.passengerName?.toLowerCase().includes(q) || r.pickupAddress?.toLowerCase().includes(q) || r.dropoffAddress?.toLowerCase().includes(q)))
    );
  }, [requests, status, search]);

  const paged = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      // backend lists REQUESTED open requests; adapt if endpoint changes
      const res = await axios.get(`${API}/api/rides/requests`, { headers: authHeaders });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAccept = async (rideId) => {
    try {
      await axios.post(`${API}/api/rides/${rideId}/accept?driverId=${driverId}`, null, { headers: authHeaders });
      await fetchRequests();
      alert('Ride accepted successfully!');
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.response?.data || e.message || 'Failed to accept ride';
      alert(errorMessage);
      // Refresh the requests list to remove any unavailable rides
      await fetchRequests();
    }
  };

  const handleReject = async (rideId) => {
    try {
      await axios.post(`${API}/api/rides/${rideId}/reject`, null, { headers: authHeaders });
      await fetchRequests();
    } catch (e) {
      alert(e?.response?.data || e.message || 'Failed to reject');
    }
  };

  return (
    <>
      <DriverNavbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <Card title="Ride Requests" actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search passenger or address" />
            <button onClick={fetchRequests}>Refresh</button>
          </div>
        }>
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
          {!loading && !error && paged.length === 0 && <p>No requests match the filters.</p>}
          <div style={{ display: 'grid', gap: 12 }}>
            {paged.map(r => (
              <Card key={r.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.passengerName}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>#{r.id}</div>
                    <div><strong>Pickup:</strong> {r.pickupAddress}</div>
                    <div><strong>Dropoff:</strong> {r.dropoffAddress}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge variant="blue">{r.status}</Badge>
                    <button onClick={() => handleAccept(r.id)}>Accept</button>
                    <button onClick={() => handleReject(r.id)} style={{ marginLeft: 4 }}>Reject</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {filtered.length > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</button>
              <button disabled={(page + 1) * pageSize >= filtered.length} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default RideRequests;
