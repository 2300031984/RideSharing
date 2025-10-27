import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, role: userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If a specific role is required, enforce it. If no role provided, allow any authenticated user.
  if (role && userRole !== role) {
    const fallback = userRole === 'Driver' ? '/driver' : userRole === 'Admin' ? '/admin' : '/user';
    return <Navigate to={fallback} />;
  }

  return children;
};

export default ProtectedRoute;
