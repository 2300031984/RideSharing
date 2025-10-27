import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [userId, setUserId] = useState(null);
  const [driverId, setDriverId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.id) {
      setUserId(user.id);
      fetchReviews();
    }
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post(`${API_BASE_URL}/api/reviews`, {
        userId,
        driverId,
        rating,
        comment
      });
      setComment('');
      setDriverId('');
      setRating(5);
      setMessage("Review submitted!");
      fetchReviews(); // refresh
    } catch (err) {
      setMessage("Failed to submit review.");
    }
  };

  return (
    <div style={{
      maxWidth: 600,
      margin: '3rem auto',
      padding: '2rem',
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
    }}>
      <h1 style={{ color: '#fdcb6e', fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Reviews & Ratings</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Driver ID"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          required
          style={{ padding: 8, marginBottom: 8, width: '100%' }}
        />
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ padding: 8, marginBottom: 8, width: '100%' }}>
          {[5, 4, 3, 2, 1].map(r => (
            <option key={r} value={r}>{r} Star{r > 1 && 's'}</option>
          ))}
        </select>
        <textarea
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          rows="4"
          style={{ padding: 8, marginBottom: 8, width: '100%' }}
        />
        <button type="submit" style={{ padding: '10px 16px' }}>Submit Review</button>
        {message && <p style={{ marginTop: 10, color: message.includes("Failed") ? "red" : "green" }}>{message}</p>}
      </form>

      <hr style={{ margin: '2rem 0' }} />

      <h3>Recent Reviews:</h3>
      {reviews.length === 0 && <p>No reviews yet.</p>}
      {reviews.map((rev, index) => (
        <div key={index} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
          <strong>{rev.driverId}</strong> — <span>{'⭐'.repeat(rev.rating)}</span>
          <p>{rev.comment}</p>
        </div>
      ))}
    </div>
  );
};

export default Reviews;
