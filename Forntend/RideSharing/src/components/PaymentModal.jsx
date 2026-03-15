import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Replace with your real Stripe Publishable Key
const stripePromise = loadStripe('pk_test_replace_with_your_stripe_publishable_key');

const CheckoutForm = ({ rideId, fare, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    const API = import.meta.env?.VITE_API_URL || 'http://localhost:8081';
    
    // Request an intent from Spring Boot
    fetch(`${API}/api/payments/create-intent`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${user.token}` // Apply if backend is secured directly here
      },
      body: JSON.stringify({ rideId, amount: fare })
    })
      .then(res => res.json())
      .then(data => {
          if(data.clientSecret) {
              setClientSecret(data.clientSecret);
          } else {
              setError("Failed to initialize payment intent.");
          }
      })
      .catch(err => setError(err.message));
  }, [rideId, fare]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      }
    });

    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        onPaymentSuccess();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
          <CardElement options={{
              style: { base: { fontSize: '16px', color: '#1e293b', '::placeholder': { color: '#94a3b8' } } }
          }} />
      </div>
      <button 
          disabled={!stripe || processing} 
          style={{
              padding: '12px 20px', 
              background: processing ? '#94a3b8' : '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 600, 
              cursor: processing ? 'not-allowed' : 'pointer'
          }}>
          {processing ? 'Processing...' : `Pay ₹${fare}`}
      </button>
      {error && <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{error}</div>}
    </form>
  );
};

export const PaymentModal = ({ isOpen, onClose, rideId, fare, onSuccess }) => {
    if(!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div style={{
                background: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Secure Checkout</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
                </div>
                
                <Elements stripe={stripePromise}>
                    <CheckoutForm rideId={rideId} fare={fare} onPaymentSuccess={onSuccess} />
                </Elements>
            </div>
        </div>
    );
}
