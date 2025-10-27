import React from 'react';

const statusColors = {
  Completed: 'limegreen',
  Pending: '#ff9800',
  Cancelled: '#f44336',
  Accepted: '#008CBA',
  default: '#aaa',
};

const iconStyle = {
  marginRight: 8,
  fontSize: 18,
  verticalAlign: 'middle',
};

function formatLocation(loc) {
  if (!loc) return 'N/A';
  if (typeof loc === 'string') return loc;
  if (loc.latitude && loc.longitude) {
    return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
  }
  return 'N/A';
}

const RideCard = ({ ride }) => {
  const status = ride.status || 'Completed';
  return (
    <div className="ride-card" style={{ borderLeft: `6px solid ${statusColors[status] || statusColors.default}` }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <span style={iconStyle}>🚕</span>
        <strong>Pickup:</strong>&nbsp;{formatLocation(ride.pickupLocation)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <span style={iconStyle}>🏁</span>
        <strong>Drop:</strong>&nbsp;{formatLocation(ride.dropLocation)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <span style={iconStyle}>📅</span>
        <strong>Date:</strong>&nbsp;{ride.createdAt ? new Date(ride.createdAt).toLocaleString() : 'N/A'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <span style={iconStyle}>🔖</span>
        <strong>Status:</strong>&nbsp;
        <span style={{ color: statusColors[status] || statusColors.default, fontWeight: 600 }}>{status}</span>
      </div>
      {ride.fare != null && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <span style={iconStyle}>💵</span>
          <strong>Fare:</strong>&nbsp;
          <span style={{ color: '#059669', fontWeight: 600 }}>₹{ride.fare}</span>
        </div>
      )}
      {ride.user && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <span style={iconStyle}>👤</span>
          <strong>User:</strong>&nbsp;{ride.user.username || ride.user.id}
        </div>
      )}
    </div>
  );
};

export default RideCard;
