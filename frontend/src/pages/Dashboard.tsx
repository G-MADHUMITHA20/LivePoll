import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/client';

export const Dashboard = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await request('/polls');
        if (res.success) setPolls(res.polls);
      } catch (err) {
        console.error("Failed to fetch polls", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-[calc(100vh-73px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your active and past polls.</p>
        </div>
        <Link to="/create" className="btn-primary flex items-center gap-2 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Create Poll
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="card h-48 animate-pulse bg-white">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="flex justify-between mt-auto">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No polls created yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">Create your first poll to start gathering real-time feedback from your audience.</p>
          <Link to="/create" className="btn-primary shadow">Create your first poll</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map(poll => {
            const now = Date.now();
            const startTime = poll.start_time ? new Date(poll.start_time).getTime() : 0;
            const endTime = poll.end_time ? new Date(poll.end_time).getTime() : Infinity;
            
            let effectiveStatus = 'ACTIVE';
            if (poll.status === 'closed') effectiveStatus = 'CLOSED';
            else if (startTime > now) effectiveStatus = 'SCHEDULED';
            else if (now > endTime) effectiveStatus = 'EXPIRED';

            return (
            <div key={poll.id} className="card hover:shadow-md transition-all flex flex-col border-gray-200 group">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md tracking-wide ${
                  effectiveStatus === 'ACTIVE' 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : effectiveStatus === 'SCHEDULED' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : effectiveStatus === 'EXPIRED'
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {effectiveStatus}
                </span>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  {new Date(poll.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
                {poll.question}
              </h3>
              <p className="text-sm text-gray-500 mb-6 flex items-center gap-1.5 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                {poll.options?.length || 0} Options
              </p>
              
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <Link to={`/manage/${poll.id}`} className="text-primary-600 text-sm font-semibold hover:text-primary-700 hover:underline flex items-center gap-1">
                  Manage Details
                </Link>
                <Link to={`/poll/${poll.id}`} className="text-gray-500 text-sm font-semibold hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-gray-200">
                  Open Live
                </Link>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
