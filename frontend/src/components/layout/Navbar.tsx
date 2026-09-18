import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm px-4 md:px-8 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
      <Link to="/" className="font-bold text-xl text-primary-600 dark:text-primary-500 tracking-tight hover:opacity-80 transition-opacity">
        LivePoll
      </Link>
      <div className="flex gap-4 items-center">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        
        {user ? (
          <>
            <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-300 font-medium">Hi, {user.name}</span>
            <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium text-sm transition-colors">Dashboard</Link>
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
            <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium text-sm transition-colors">Log In</Link>
            <Link to="/signup" className="btn-primary text-sm px-4 py-1.5 shadow-sm hover:shadow">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};
