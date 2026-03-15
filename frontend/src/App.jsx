import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import SessionTimeout from './components/SessionTimeout';

// Common Pages
import Home from "./pages/common/Home";
import Login from "./pages/common/Login";
import SignUp from "./pages/common/SignUp";
import NotFound from './pages/common/NotFound';
import About from './pages/common/About';
import Contact from './pages/common/Contact';
import Help from './pages/common/Help';
import Profile from './pages/common/Profile';
import Notifications from './pages/common/Notifications';
import RideDetails from './pages/common/RideDetails';
import Wallet from './pages/common/Wallet';
import Reviews from './pages/common/Reviews';
import Support from './pages/common/Support';
import Terms from './pages/common/Terms';
import Privacy from './pages/common/Privacy';
import Payment from './pages/common/Payment';
import Settings from './pages/common/Settings';
import Emergency from './pages/common/Emergency';
import ReportIncident from './pages/common/ReportIncident';
import ShareLocation from './pages/common/ShareLocation';
import ManageContacts from './pages/common/ManageContacts';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import RideHistory from './pages/user/RideHistory';
import TripHistory from './pages/user/TripHistory';
import BookRide from './pages/user/BookRide';
import UserWallet from './pages/user/Wallet';
import SavedPlaces from './pages/user/SavedPlaces';
import RecentRides from './pages/user/RecentRides';
import Offers from './pages/user/Offers';
import ScheduleRide from './pages/user/ScheduleRide';
import ScheduledRides from './pages/user/ScheduledRides';
import Booking from './pages/user/Booking';
import LiveRide from './pages/user/LiveRide';
import RideRequestWaiting from './pages/user/RideRequestWaiting';
import UserMyRides from './pages/user/MyRides';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import RideRequests from './pages/driver/RideRequests';
import UpdateLocation from './pages/driver/UpdateLocation';
import Earnings from './pages/driver/Earnings';
import LongDistanceScheduledRides from './pages/driver/LongDistanceScheduledRides';
import PresentTimeRides from './pages/driver/PresentTimeRides';
import ActiveRideTracking from './pages/driver/ActiveRideTracking';
import DriverMyRides from './pages/driver/MyRides';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  // Feature flags for safe, reversible disablement
  const USER_AREA_ENABLED = true;
  const DRIVER_AREA_ENABLED = true;

  const FeatureUnavailable = ({ title = 'Feature Unavailable' }) => (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 640, textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{title}</h1>
        <p style={{ color: '#6b7280' }}>This section is temporarily disabled. Please check back later.</p>
      </div>
    </div>
  );
  return (
      <Router>
        <SessionTimeout />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />
          <Route path="/support" element={<Support />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          
          {/* Protected Common Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ride/:id"
            element={
              <ProtectedRoute>
                <RideDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedRoute>
                <Reviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency"
            element={
              <ProtectedRoute>
                <Emergency />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report-incident"
            element={
              <ProtectedRoute>
                <ReportIncident />
              </ProtectedRoute>
            }
          />
          <Route
            path="/share-location"
            element={
              <ProtectedRoute>
                <ShareLocation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-contacts"
            element={
              <ProtectedRoute>
                <ManageContacts />
              </ProtectedRoute>
            }
          />
          
          {/* User Routes */}
          {USER_AREA_ENABLED ? (
            <>
              <Route
                path="/user/dashboard"
                element={
                  <ProtectedRoute role="User">
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/ride-history"
                element={
                  <ProtectedRoute role="User">
                    <RideHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/trip-history"
                element={
                  <ProtectedRoute role="User">
                    <TripHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book-ride"
                element={
                  <ProtectedRoute role="User">
                    <BookRide />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user"
                element={
                  <ProtectedRoute role="User">
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              {/* New User Subpages */}
              <Route
                path="/user/wallet"
                element={
                  <ProtectedRoute role="User">
                    <UserWallet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/saved-places"
                element={
                  <ProtectedRoute role="User">
                    <SavedPlaces />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/recent-rides"
                element={
                  <ProtectedRoute role="User">
                    <RecentRides />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/offers"
                element={
                  <ProtectedRoute role="User">
                    <Offers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedule-ride"
                element={
                  <ProtectedRoute role="User">
                    <ScheduleRide />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/scheduled-rides"
                element={
                  <ProtectedRoute role="User">
                    <ScheduledRides />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/my-rides"
                element={
                  <ProtectedRoute role="User">
                    <UserMyRides />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/live-ride/:rideRequestId"
                element={
                  <ProtectedRoute role="User">
                    <LiveRide />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:rideRequestId"
                element={
                  <ProtectedRoute role="User">
                    <Booking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ride/live/:rideRequestId"
                element={
                  <ProtectedRoute role="User">
                    <LiveRide />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ride-request/:rideRequestId"
                element={
                  <ProtectedRoute role="User">
                    <RideRequestWaiting />
                  </ProtectedRoute>
                }
              />
            </>
          ) : (
            <>
              <Route path="/user/*" element={<FeatureUnavailable title="User Area" />} />
              <Route path="/book-ride" element={<FeatureUnavailable title="User Area" />} />
              <Route path="/schedule-ride" element={<FeatureUnavailable title="User Area" />} />
            </>
          )}
          
          {/* Driver Routes */}
          {DRIVER_AREA_ENABLED ? (
            <>
              <Route
                path="/driver/dashboard"
                element={
                  <ProtectedRoute role="Driver">
                    <DriverDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver/requests"
                element={
                  <ProtectedRoute role="Driver">
                    <RideRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver/location"
                element={
                  <ProtectedRoute role="Driver">
                    <UpdateLocation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver/earnings"
                element={
                  <ProtectedRoute role="Driver">
                    <Earnings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver/scheduled-rides"
                element={
                  <ProtectedRoute role="Driver">
                    <LongDistanceScheduledRides />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver/present-rides"
                element={
                  <ProtectedRoute role="Driver">
                    <PresentTimeRides />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver/active-ride"
                element={
                  <ProtectedRoute role="Driver">
                    <ActiveRideTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver/my-rides"
                element={
                  <ProtectedRoute role="Driver">
                    <DriverMyRides />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver"
                element={
                  <ProtectedRoute role="Driver">
                    <DriverDashboard />
                  </ProtectedRoute>
                }
              />
            </>
          ) : (
            <Route path="/driver/*" element={<FeatureUnavailable title="Driver Area" />} />
          )}
          
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="Admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
  );
}

export default App;
