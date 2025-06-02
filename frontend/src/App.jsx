import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';
import Home from './pages/Home';
import Campaigns from './pages/Campaign';
import Segments from './pages/Segment';
import Customers from './pages/Customer';
import ResponsiveAppBar from './components/Navbar';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <ResponsiveAppBar />
      {children}
    </>
  );
};

// Layout component for protected routes
const ProtectedLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {children}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Home />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Campaigns />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/segments"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Segments />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Customers />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        {/* Catch all route - redirect to home if authenticated, login if not */}
        <Route
          path="*"
          element={
            <Navigate to="/home" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
