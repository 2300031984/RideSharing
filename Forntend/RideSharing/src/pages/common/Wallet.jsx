import React, { useEffect, useState } from 'react';
import { getWalletBalance, addWalletFunds, getPaymentsHistory } from '../../services/RideService';

const USE_PAYMENTS_SERVICE = true;

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.id) {
      setUserId(user.id);
      fetchWallet(user.id);
      fetchHistory();
    }
  }, []);

  const fetchWallet = async (id) => {
    try {
      if (USE_PAYMENTS_SERVICE) {
        const bal = await getWalletBalance();
        setBalance(typeof bal === 'number' ? bal : 0);
      }
    } catch (err) {
      setError("Failed to fetch wallet.");
    }
  };

  const fetchHistory = async () => {
    try {
      if (USE_PAYMENTS_SERVICE) {
        const list = await getPaymentsHistory();
        setHistory(Array.isArray(list) ? list : []);
      }
    } catch {}
  };

  const handleAddFunds = async () => {
    setError('');
    setSuccess('');
    try {
      if (USE_PAYMENTS_SERVICE) {
        const res = await addWalletFunds({ amount: parseFloat(amount) || 0 });
        setBalance(res?.balance ?? balance);
        setSuccess('Funds added successfully!');
        fetchHistory();
      }
    } catch (err) {
      setError("Failed to add funds.");
    }
  };

  const handleDeductFunds = async () => {
    setError('');
    setSuccess('');
    try {
      // For now, simulate a debit by reducing local balance to avoid breaking flows
      const amt = parseFloat(amount) || 0;
      const newBal = Math.max(0, (balance || 0) - amt);
      setBalance(newBal);
      setSuccess('Payment successful! (simulated)');
    } catch (err) {
      setError("Insufficient balance or error occurred.");
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
      <h1 style={{ color: '#00b894', fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Wallet & Payments</h1>
      <p style={{ color: '#636e72', fontSize: 18, marginBottom: 24 }}>
        Balance: ₹{balance.toFixed(2)}
      </p>

      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ padding: 8, marginRight: 8 }}
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        style={{ padding: 8, marginRight: 8 }}
      />
      <div style={{ marginTop: 12 }}>
        <button onClick={handleAddFunds} style={{ marginRight: 8 }}>Add Funds</button>
        <button onClick={handleDeductFunds}>Pay</button>
      </div>

      {success && <p style={{ color: 'green', marginTop: 12 }}>{success}</p>}
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}

      {/* Recent Transactions (feature-flagged) */}
      {USE_PAYMENTS_SERVICE && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8 }}>Recent Transactions</h3>
          {history.length === 0 ? (
            <div style={{ color: '#6b7280' }}>No transactions yet.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {history.slice(0, 10).map((h) => (
                <li key={h.id} style={{ padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{h.id} • {h.status || 'success'}</span>
                    <span style={{ color: '#6b7280' }}>{new Date(h.date || Date.now()).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Wallet;
