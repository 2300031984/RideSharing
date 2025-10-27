import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/Toast';
import { getWalletBalance, addWalletFunds, createPaymentOrder, capturePayment } from '../../services/RideService';

const API = (import.meta.env?.VITE_API_URL || 'http://localhost:8081');
const USE_PAYMENTS_SERVICE = true;

const Payment = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = user?.token;
  
  const [wallet, setWallet] = useState({ balance: 0 });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    isDefault: false
  });

  useEffect(() => {
    fetchWallet();
    fetchPaymentMethods();
  }, []);

  const fetchWallet = async () => {
    try {
      if (USE_PAYMENTS_SERVICE) {
        const bal = await getWalletBalance();
        setWallet({ balance: typeof bal === 'number' ? bal : 0 });
      } else {
        const res = await fetch(`${API}/api/users/${user.id}/wallet`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data && typeof data.balance === 'number') {
          setWallet(data);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      // Mock payment methods for now
      setPaymentMethods([
        {
          id: 1,
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiryMonth: '12',
          expiryYear: '25',
          isDefault: true
        },
        {
          id: 2,
          type: 'card',
          last4: '5555',
          brand: 'Mastercard',
          expiryMonth: '08',
          expiryYear: '26',
          isDefault: false
        }
      ]);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (amount) => {
    try {
      if (USE_PAYMENTS_SERVICE) {
        // Create order -> (provider checkout) -> capture
        const order = await createPaymentOrder({ amount });
        // simulate successful provider checkout and capture
        await capturePayment({ orderId: order.id, paymentId: 'sim_' + Date.now(), signature: 'sig' });
        const bal = await getWalletBalance();
        setWallet({ balance: typeof bal === 'number' ? bal : wallet.balance });
        setToast({ message: `Added ₹${amount} to wallet`, type: 'success' });
      } else {
        const res = await fetch(`${API}/api/users/${user.id}/wallet/add-funds`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ amount })
        });
        const data = await res.json();
        if (res.ok) {
          setWallet(data);
          setToast({ message: `Added ₹${amount} to wallet`, type: 'success' });
        } else {
          throw new Error(data?.message || 'Failed to add funds');
        }
      }
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    // Mock adding card
    const card = {
      id: Date.now(),
      ...newCard,
      last4: newCard.cardNumber.slice(-4),
      brand: newCard.cardNumber.startsWith('4') ? 'Visa' : 'Mastercard'
    };
    setPaymentMethods([...paymentMethods, card]);
    setNewCard({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      isDefault: false
    });
    setShowAddCard(false);
    setToast({ message: 'Card added successfully', type: 'success' });
  };

  const handleSetDefault = (cardId) => {
    setPaymentMethods(paymentMethods.map(card => ({
      ...card,
      isDefault: card.id === cardId
    })));
    setToast({ message: 'Default payment method updated', type: 'success' });
  };

  const handleDeleteCard = (cardId) => {
    setPaymentMethods(paymentMethods.filter(card => card.id !== cardId));
    setToast({ message: 'Card removed successfully', type: 'success' });
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Loading payment information...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 700 }}>Payment & Billing</h1>
      
      {/* Wallet Balance */}
      <Card title="Wallet Balance" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#059669' }}>
              ₹{wallet.balance?.toFixed(2) || '0.00'}
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              Available balance
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleAddFunds(100)}
              style={{
                padding: '8px 16px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              +₹100
            </button>
            <button
              onClick={() => handleAddFunds(500)}
              style={{
                padding: '8px 16px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              +₹500
            </button>
            <button
              onClick={() => {
                const amount = prompt('Enter amount:');
                if (amount && !isNaN(amount)) {
                  handleAddFunds(parseFloat(amount));
                }
              }}
              style={{
                padding: '8px 16px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              Custom
            </button>
          </div>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card title="Payment Methods" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Saved Cards</h3>
          <button
            onClick={() => setShowAddCard(true)}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Add Card
          </button>
        </div>

        {paymentMethods.map(card => (
          <div
            key={card.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              marginBottom: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 24 }}>
                {card.brand === 'Visa' ? '💳' : '💳'}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {card.brand} •••• {card.last4}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>
                  Expires {card.expiryMonth}/{card.expiryYear}
                </div>
              </div>
              {card.isDefault && (
                <Badge variant="green">Default</Badge>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!card.isDefault && (
                <button
                  onClick={() => handleSetDefault(card.id)}
                  style={{
                    padding: '4px 8px',
                    background: 'none',
                    border: '1px solid #2563eb',
                    color: '#2563eb',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  Set Default
                </button>
              )}
              <button
                onClick={() => handleDeleteCard(card.id)}
                style={{
                  padding: '4px 8px',
                  background: 'none',
                  border: '1px solid #dc2626',
                  color: '#dc2626',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {paymentMethods.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
            No payment methods added yet
          </div>
        )}
      </Card>

      {/* Add Card Modal */}
      {showAddCard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            width: '100%',
            maxWidth: 400,
            margin: 16
          }}>
            <h3 style={{ marginBottom: 16 }}>Add New Card</h3>
            <form onSubmit={handleAddCard}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Card Number
                </label>
                <input
                  type="text"
                  value={newCard.cardNumber}
                  onChange={(e) => setNewCard({...newCard, cardNumber: e.target.value})}
                  placeholder="1234 5678 9012 3456"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #d1d5db',
                    borderRadius: 6
                  }}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={newCard.expiryDate}
                    onChange={(e) => setNewCard({...newCard, expiryDate: e.target.value})}
                    placeholder="MM/YY"
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '1px solid #d1d5db',
                      borderRadius: 6
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                    CVV
                  </label>
                  <input
                    type="text"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({...newCard, cvv: e.target.value})}
                    placeholder="123"
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '1px solid #d1d5db',
                      borderRadius: 6
                    }}
                    required
                  />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={newCard.cardholderName}
                  onChange={(e) => setNewCard({...newCard, cardholderName: e.target.value})}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #d1d5db',
                    borderRadius: 6
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={newCard.isDefault}
                    onChange={(e) => setNewCard({...newCard, isDefault: e.target.checked})}
                  />
                  Set as default payment method
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  style={{
                    padding: '8px 16px',
                    background: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
};

export default Payment;
