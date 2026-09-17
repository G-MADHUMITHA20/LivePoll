import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Landing } from './pages/Landing';
import { Login, Signup } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { CreatePoll } from './pages/CreatePoll';
import { ManagePoll } from './pages/ManagePoll';
import { PublicPoll } from './pages/PublicPoll';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="font-sans text-gray-900 min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreatePoll /></ProtectedRoute>} />
              <Route path="/manage/:id" element={<ProtectedRoute><ManagePoll /></ProtectedRoute>} />
              
              {/* Public Poll Route */}
              <Route path="/poll/:id" element={<PublicPoll />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
