import React from 'react';
import { Link } from 'react-router-dom';

export const Landing = () => (
  <div className="min-h-[calc(100vh-73px)] flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-gray-50 to-white">
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
        Poll your audience in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">real-time</span>
      </h1>
      
      <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
        Create a poll, share the link, and watch responses stream in instantly. 
        No refreshing, no delays.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
        <Link to="/signup" className="btn-primary text-lg px-8 py-3 w-full sm:w-auto shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
          Create a Free Poll
        </Link>
        <Link to="/login" className="btn-secondary text-lg px-8 py-3 w-full sm:w-auto">
          Log In
        </Link>
      </div>

      <div className="mt-16 pt-16 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
            <h3 className="font-bold text-lg mb-2">Create</h3>
            <p className="text-gray-500 text-sm">Draft a question and add multiple options in seconds.</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
            <h3 className="font-bold text-lg mb-2">Share</h3>
            <p className="text-gray-500 text-sm">Send your unique link to your audience or team.</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
            <h3 className="font-bold text-lg mb-2">Watch Live</h3>
            <p className="text-gray-500 text-sm">See votes appear on your screen the moment they happen.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
