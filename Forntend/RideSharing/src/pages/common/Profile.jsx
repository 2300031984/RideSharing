import React from 'react';
import RiderProfile from '../user/RiderProfile';
import DriverProfile from '../driver/DriverProfile';

const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  
  // Route to appropriate profile based on user role
  if (!storedUser) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f8fafc'
      }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          background: '#fff', 
          borderRadius: 12, 
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)' 
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: 16 }}>Not Logged In</h2>
          <p style={{ color: '#6b7280' }}>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Check if user is a driver
  if (storedUser.role && storedUser.role.toLowerCase().includes('driver')) {
    return <DriverProfile />;
  }

  // Default to rider profile
  return <RiderProfile />;
};

export default Profile; 