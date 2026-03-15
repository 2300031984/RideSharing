import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../Styles/SignUp.css';
import AuthService from '../../services/AuthService';
import { useAuth } from '../../context/AuthContext';

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    phone: "",
    age: "",
    location: "",
    licenseNumber: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Basic validation
    if (!formData.username || !formData.email || !formData.password || !formData.role) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // Only send fields expected by backend DTO
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
        role: (formData.role || 'User').trim(),
      };

      const isDriver = (formData.role === 'Driver');
      const response = isDriver
        ? await AuthService.driverSignup({
            name: formData.username.trim(),
            email: payload.email,
            password: payload.password,
            role: 'Driver',
            licenseNumber: formData.licenseNumber.trim(),
            phoneNumber: formData.phone.trim()
          })
        : await AuthService.signup(payload);

      if (response.status >= 200 && response.status < 300) {
        setSuccess("Account created successfully! Please login to continue.");
        
        // Clear form
        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "",
          phone: "",
          age: "",
          location: "",
          licenseNumber: ""
        });

        // Redirect to login page after successful registration
        setTimeout(() => {
          navigate('/login');
        }, 2000); // Give user time to see the success message
      }
    } catch (err) {
      console.error('Signup error:', err);
      let errorMessage = "Registration failed. Please try again.";
      
      if (err.response) {
        console.log('Response status:', err.response.status);
        console.log('Response data:', err.response.data);
        
        if (err.response.status === 409) {
          errorMessage = "Email already exists. Please use a different email.";
        } else if (err.response.status === 400) {
          // Handle 400 Bad Request with specific error messages
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
          } else {
            errorMessage = "Invalid request data. Please check all fields.";
          }
        } else if (err.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.response.data) {
          errorMessage = typeof err.response.data === 'string' 
            ? err.response.data 
            : err.response.data.message || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="container">
        <h2 style={{ color: "white" }}>Create an Account</h2>
        <form onSubmit={handleSubmit}>
        <input name="username" type="text" placeholder={formData.role === 'Driver' ? 'Name' : 'Username'} required value={formData.username} onChange={handleChange} />
        <input name="email" type="email" placeholder="Email ID" required value={formData.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" required value={formData.password} onChange={handleChange} />
        <input name="confirmPassword" type="password" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={handleChange} />

        <select name="role" required value={formData.role} onChange={handleChange}>
          <option value="">Select Role</option>
          <option value="User">User</option>
          <option value="Driver">Driver</option>
        </select>

        <div className="form-group">
          <input name="phone" type="text" placeholder="Phone Number" required value={formData.phone} onChange={handleChange} />
          <input name="age" type="number" placeholder="Age" required value={formData.age} onChange={handleChange} />
        </div>

        {formData.role === 'Driver' && (
          <input name="licenseNumber" type="text" placeholder="License Number" required value={formData.licenseNumber} onChange={handleChange} />
        )}

        <input name="location" type="text" placeholder="Location" required value={formData.location} onChange={handleChange} />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}

        <p className="toggle-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
