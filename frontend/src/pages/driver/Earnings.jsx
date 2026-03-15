import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverNavbar from '../../components/DriverNavbar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');

const Earnings = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = user?.token;
  
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
    pending: 0
  });
  
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    fetchEarnings();
    fetchRides();
  }, []);

  const fetchEarnings = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockEarnings = {
        today: 1250,
        thisWeek: 8750,
        thisMonth: 32500,
        total: 125000,
        pending: 450
      };
      setEarnings(mockEarnings);
    } catch (error) {
      setToast({ message: 'Failed to load earnings', type: 'error' });
    }
  };

  const fetchRides = async () => {
    try {
      // Mock data - in real app, fetch from API
      const mockRides = [
        {
          id: 1,
          date: '2024-01-15',
          time: '14:30',
          passenger: 'John Doe',
          pickup: 'Mall, MG Road',
          dropoff: 'Airport Terminal 1',
          fare: 450,
          commission: 45,
          netEarning: 405,
          status: 'completed',
          distance: '12.5 km',
          duration: '28 min',
          rating: 5
        },
        {
          id: 2,
          date: '2024-01-15',
          time: '11:15',
          passenger: 'Sarah Wilson',
          pickup: 'Office Complex, Whitefield',
          dropoff: 'Home, Koramangala',
          fare: 320,
          commission: 32,
          netEarning: 288,
          status: 'completed',
          distance: '8.2 km',
          duration: '22 min',
          rating: 4
        },
        {
          id: 3,
          date: '2024-01-14',
          time: '19:45',
          passenger: 'Mike Johnson',
          pickup: 'Restaurant, Indiranagar',
          dropoff: 'Hotel, Brigade Road',
          fare: 180,
          commission: 18,
          netEarning: 162,
          status: 'completed',
          distance: '4.5 km',
          duration: '12 min',
          rating: 5
        },
        {
          id: 4,
          date: '2024-01-14',
          time: '16:20',
          passenger: 'Emma Davis',
          pickup: 'Shopping Mall, Jayanagar',
          dropoff: 'Home, Banashankari',
          fare: 280,
          commission: 28,
          netEarning: 252,
          status: 'completed',
          distance: '6.8 km',
          duration: '18 min',
          rating: 4
        },
        {
          id: 5,
          date: '2024-01-13',
          time: '09:30',
          passenger: 'David Brown',
          pickup: 'Home, HSR Layout',
          dropoff: 'Office, Electronic City',
          fare: 380,
          commission: 38,
          netEarning: 342,
          status: 'completed',
          distance: '15.2 km',
          duration: '35 min',
          rating: 5
        }
      ];
      
      setRides(mockRides);
    } catch (error) {
      setToast({ message: 'Failed to load rides', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRides = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    switch (selectedPeriod) {
      case 'today':
        return rides.filter(ride => ride.date === today);
      case 'week':
        return rides.filter(ride => ride.date >= weekAgo);
      case 'month':
        return rides.filter(ride => ride.date >= monthAgo);
      default:
        return rides;
    }
  };

  const getTotalEarnings = () => {
    const filteredRides = getFilteredRides();
    return filteredRides.reduce((total, ride) => total + ride.netEarning, 0);
  };

  const getTotalRides = () => {
    return getFilteredRides().length;
  };

  const getAverageEarning = () => {
    const rides = getFilteredRides();
    if (rides.length === 0) return 0;
    return getTotalEarnings() / rides.length;
  };

  const getAverageRating = () => {
    const rides = getFilteredRides();
    if (rides.length === 0) return 0;
    const totalRating = rides.reduce((sum, ride) => sum + ride.rating, 0);
    return (totalRating / rides.length).toFixed(1);
  };

  const handleWithdraw = () => {
    if (earnings.total < 100) {
      setToast({ message: 'Minimum withdrawal amount is ₹100', type: 'error' });
      return;
    }
    
    if (window.confirm(`Withdraw ₹${earnings.total.toLocaleString()} to your bank account?`)) {
      setToast({ message: 'Withdrawal request submitted. Amount will be transferred within 24 hours.', type: 'success' });
    }
  };

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  if (loading) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <DriverNavbar />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 18, color: '#6b7280' }}>Loading earnings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <DriverNavbar />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>

        {/* Earnings Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 24 }}>💰</div>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Total Earnings</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>
              ₹{getTotalEarnings().toLocaleString()}
            </div>
          </Card>
          
          <Card style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 24 }}>🚗</div>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Total Rides</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
              {getTotalRides()}
            </div>
          </Card>
          
          <Card style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 24 }}>📊</div>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Avg per Ride</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>
              ₹{Math.round(getAverageEarning())}
            </div>
          </Card>
          
          <Card style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 24 }}>⭐</div>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Avg Rating</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>
              {getAverageRating()}
            </div>
          </Card>
        </div>

        {/* Withdrawal Section */}
        <Card title="Withdraw Earnings" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#059669', marginBottom: 4 }}>
                ₹{earnings.total.toLocaleString()}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                Available for withdrawal
              </div>
              {earnings.pending > 0 && (
                <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>
                  ₹{earnings.pending} pending verification
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setToast({ message: 'Bank details updated successfully', type: 'success' })}
                style={{
                  padding: '12px 20px',
                  background: 'none',
                  color: '#2563eb',
                  border: '1px solid #2563eb',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Update Bank Details
              </button>
              <button
                onClick={handleWithdraw}
                disabled={earnings.total < 100}
                style={{
                  padding: '12px 24px',
                  background: earnings.total < 100 ? '#9ca3af' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: earnings.total < 100 ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Withdraw Now
              </button>
            </div>
          </div>
        </Card>

      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default Earnings;