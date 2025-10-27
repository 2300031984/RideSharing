import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import '../../Styles/Login.css';
import { useAuth } from '../../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!role) {
      setError("Please select a role");
      setLoading(false);
      return;
    }

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const response = await AuthService.login(role, email.trim().toLowerCase(), password.trim());
      const user = response.data;

      if (user.role !== role) {
        setError("Incorrect role selected");
        setLoading(false);
        return;
      }

      // Set authenticated user in context (persists to storage via provider)
      login(user);

      // Navigate to role-based dashboard
      if (user.role === 'Driver') navigate('/driver');
      else if (user.role === 'Admin') navigate('/admin');
      else navigate('/user');

    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = "Login failed. Please try again.";
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.response.status === 400) {
          errorMessage = error.response.data || "Invalid request. Please check your input.";
        } else if (error.response.status === 403) {
          errorMessage = "Access denied. Please contact support if this persists.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.response.data) {
          errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || error.response.data.error || errorMessage;
        }
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="container">
        <h2 style={{ color: 'white' }}>Login to TakeMe</h2>
        <form onSubmit={handleLogin}>
        <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="">Select Role</option>
          <option value="User">User</option>
          <option value="Driver">Driver</option>
        </select>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && <p className="error-msg">{error}</p>}

        <p className="toggle-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
