import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  
  return (
    <nav className="bg-white shadow-sm px-4 md:px-8 py-4 flex justify-between items-center border-b border-gray-100 sticky top-0 z-50">
      <Link to="/" className="font-bold text-xl text-primary-600 tracking-tight hover:opacity-80 transition-opacity">
        LivePoll
      </Link>
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <span className="hidden md:inline text-sm text-gray-600 font-medium">Hi, {user.name}</span>
            <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 font-medium text-sm transition-colors">Dashboard</Link>
            <button 
              onClick={logout} 
              className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
              aria-label="Logout"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium text-sm transition-colors">Log In</Link>
            <Link to="/signup" className="btn-primary text-sm px-4 py-1.5 shadow-sm hover:shadow">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};
