import React, { useEffect, useMemo, useState } from 'react';
import { getUserRidesPaged } from '../../services/RideService';
import RideCard from '../../components/RideCard';
import { Link, useSearchParams } from 'react-router-dom';

const RideHistory = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [fromDate, setFromDate] = useState(searchParams.get('from') || '');
  const [toDate, setToDate] = useState(searchParams.get('to') || '');
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));
  const [pageSize, setPageSize] = useState(Number(searchParams.get('size') || 10));
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [serverTotalElements, setServerTotalElements] = useState(0);

  // Initial load: restore from localStorage if URL empty
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const hasUrl = searchParams.toString().length > 0;
    if (!hasUrl) {
      try {
        const saved = JSON.parse(localStorage.getItem('rideHistoryFilters') || '{}');
        if (saved && typeof saved === 'object') {
          if (saved.status) setStatusFilter(saved.status);
          if (saved.from) setFromDate(saved.from);
          if (saved.to) setToDate(saved.to);
          if (saved.page) setPage(saved.page);
          if (saved.size) setPageSize(saved.size);
        }
      } catch {}
    }
    setLoading(false);
  }, [user?.id]);

  // Fetch from backend whenever filters/page/size change
  useEffect(() => {
    let cancelled = false;
    const loadPaged = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await getUserRidesPaged({
          userId: user.id,
          status: statusFilter || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
          page: (page || 1) - 1,
          size: pageSize,
        });
        if (!cancelled) {
          const data = res.data || {};
          setRides(Array.isArray(data.content) ? data.content : []);
          setServerTotalPages(Number.isFinite(data.totalPages) ? data.totalPages : 1);
          setServerTotalElements(Number.isFinite(data.totalElements) ? data.totalElements : 0);
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e.message || 'Failed to load ride history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPaged();
    return () => { cancelled = true; };
  }, [user?.id, statusFilter, fromDate, toDate, page, pageSize]);

  // Compute filtered rides
  const filteredRides = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return (rides || []).filter(r => {
      if (statusFilter && r.status !== statusFilter) return false;
      const ts = r.requestedAt ? new Date(r.requestedAt) : null;
      if (from && ts && ts < from) return false;
      if (to && ts && ts > new Date(new Date(to).setHours(23,59,59,999))) return false;
      return true;
    });
  }, [rides, statusFilter, fromDate, toDate]);

  // Pagination derived values
  const totalPages = Math.max(1, serverTotalPages || 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pagedRides = rides; // server already pages

  // Persist filters and pagination in URL when they change
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    if (currentPage !== 1) params.set('page', String(currentPage));
    if (pageSize !== 10) params.set('size', String(pageSize));
    setSearchParams(params);
    // persist in localStorage as well
    try {
      localStorage.setItem('rideHistoryFilters', JSON.stringify({
        status: statusFilter,
        from: fromDate,
        to: toDate,
        page: currentPage,
        size: pageSize,
      }));
    } catch {}
  }, [statusFilter, fromDate, toDate, currentPage, pageSize, setSearchParams]);

  // When filters change, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [statusFilter, fromDate, toDate]);

  // Export filtered rides to CSV
  const exportCsv = () => {
    const header = ['Date','Status','Pickup','Dropoff','Fare'];
    const rows = (rides || []).map(r => [
      r.requestedAt ? new Date(r.requestedAt).toLocaleString() : '',
      r.status || '',
      r.pickupAddress || '',
      r.dropoffAddress || '',
      r.fare != null ? r.fare : ''
    ]);
    const csv = [header, ...rows]
      .map(cols => cols.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ride_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Your Ride History</h2>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', margin: '12px 0' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: 6 }}>
          <option value="">All Statuses</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="DRIVER_ARRIVED">DRIVER_ARRIVED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <label>
          From:&nbsp;
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label>
          To:&nbsp;
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        <button onClick={() => { setStatusFilter(''); setFromDate(''); setToDate(''); }}>
          Clear
        </button>
        <button onClick={() => exportCsv()}>Export CSV</button>
        <span style={{ marginLeft: 'auto' }} />
        <label>
          Page size:&nbsp;
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!loading && !error && serverTotalElements === 0 && (
        <p>No rides yet.</p>
      )}
      {!loading && !error && serverTotalElements > 0 && (
        <p style={{ color: '#555' }}>Total rides: {serverTotalElements}</p>
      )}
      <div style={{ display: 'grid', gap: 12 }}>
        {pagedRides.map((ride) => (
          <RideCard key={ride.id} ride={{
            pickupLocation: ride.pickupAddress || { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude },
            dropLocation: ride.dropoffAddress || { latitude: ride.dropoffLatitude, longitude: ride.dropoffLongitude },
            createdAt: ride.requestedAt || ride.createdAt,
            status: ride.status,
            fare: ride.fare,
            user: { username: user.username, id: user.id }
          }} />
        ))}
      </div>

      {/* Pagination controls */}
      {filteredRides.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setPage(1)} disabled={currentPage === 1}>{'<<'}</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>{'<'}</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>{'>'}</button>
          <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>{'>>'}</button>
        </div>
      )}

      {/* Compact table with View Details */}
      {filteredRides.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Details</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Date</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Status</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Pickup</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Dropoff</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Fare</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedRides.map((r) => (
                  <tr key={`row-${r.id}`}>
                    <td style={{ padding: 8 }}>{r.requestedAt ? new Date(r.requestedAt).toLocaleString() : '-'}</td>
                    <td style={{ padding: 8 }}>{r.status}</td>
                    <td style={{ padding: 8 }}>{r.pickupAddress}</td>
                    <td style={{ padding: 8 }}>{r.dropoffAddress}</td>
                    <td style={{ padding: 8 }}>{r.fare != null ? r.fare : '-'}</td>
                    <td style={{ padding: 8 }}>
                      <Link to={`/ride/${r.id}`}>View details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideHistory;
