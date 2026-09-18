import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getVoterId } from '../utils/voterId';

export const PublicPoll = () => {
  const { id } = useParams();
  const [poll, setPoll] = useState<any>(null);
  const [results, setResults] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<string>(() => {
    return localStorage.getItem(`voted_option_${id}`) || '';
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasVoted, setHasVoted] = useState(() => {
    return localStorage.getItem(`voted_${id}`) === 'true';
  });
  
  const [connectionStatus, setConnectionStatus] = useState<'Connecting…' | 'Live' | 'Reconnecting…'>('Connecting…');
  
  const [effectiveStatus, setEffectiveStatus] = useState<'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'CLOSED' | 'LOADING'>('LOADING');
  const [countdownStr, setCountdownStr] = useState<string>('');

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/v1/public/polls/${id}`).then(r => r.json());
        if (res.success) {
          setPoll(res.poll);
          if (res.results) setResults(res.results);
        } else {
          setError(res.message || 'Poll not found');
        }
      } catch (err) {
        setError('Failed to load poll. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

  useEffect(() => {
    if (!poll) return;
    
    const updateStatus = () => {
      if (poll.status === 'closed') {
        setEffectiveStatus('CLOSED');
        setCountdownStr('');
        return;
      }
      
      const now = Date.now();
      const startTime = poll.start_time ? new Date(poll.start_time).getTime() : 0;
      const endTime = poll.end_time ? new Date(poll.end_time).getTime() : Infinity;
      
      const formatCountdown = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          return `${days}d ${hours % 24}h`;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      };

      if (startTime > now) {
        setEffectiveStatus('SCHEDULED');
        setCountdownStr(`Starts in ${formatCountdown(startTime - now)}`);
      } else if (now > endTime) {
        setEffectiveStatus('EXPIRED');
        setCountdownStr('');
      } else {
        setEffectiveStatus('ACTIVE');
        if (endTime !== Infinity) {
          setCountdownStr(`Ends in ${formatCountdown(endTime - now)}`);
        } else {
          setCountdownStr('');
        }
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [poll]);

  useEffect(() => {
    if (!poll || effectiveStatus !== 'ACTIVE') return;

    const sse = new EventSource(`http://localhost:8080/api/v1/public/polls/${id}/events`);
    
    sse.onopen = () => {
      setConnectionStatus('Live');
      fetch(`http://localhost:8080/api/v1/public/polls/${id}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.results) setResults(res.results);
        })
        .catch(console.error);
    };

    sse.onerror = () => {
      setConnectionStatus('Reconnecting…');
    };

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'vote_update' && data.results) {
          setResults(data.results);
        } else if (data.type === 'connected') {
          setConnectionStatus('Live');
        }
      } catch (e) {
        console.error("Error parsing SSE event", e);
      }
    };

    return () => sse.close();
  }, [poll, id, effectiveStatus]);

  const handleVote = async () => {
    if (!selectedOption) {
      setError('Please select an option before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`http://localhost:8080/api/v1/public/polls/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: selectedOption, voter_id: getVoterId() })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess('Your vote has been securely recorded.');
        setHasVoted(true);
        localStorage.setItem(`voted_${id}`, 'true');
        localStorage.setItem(`voted_option_${id}`, selectedOption);
      } else {
        if (res.status === 409) {
          setHasVoted(true);
          localStorage.setItem(`voted_${id}`, 'true');
          // Highlight the option they just tried to select as their locked choice
          localStorage.setItem(`voted_option_${id}`, selectedOption);
          setSuccess('You have already voted in this poll.');
        } else {
          setError(data.message || 'Failed to submit vote');
        }
      }
    } catch (err) {
      setError('A network error occurred while submitting your vote.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[calc(100vh-73px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
  
  if (!poll) return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-4">
      <div className="card text-center max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Poll</h2>
        <p className="text-gray-500 mb-6">{error || 'Poll not found'}</p>
        <Link to="/" className="btn-primary w-full block">Go to Homepage</Link>
      </div>
    </div>
  );

  const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-xl card shadow-sm mt-4 md:mt-12">
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="flex gap-2 items-center mb-4">
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full tracking-wide ${
              effectiveStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
              effectiveStatus === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
              effectiveStatus === 'EXPIRED' ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'
            }`}>
              {effectiveStatus === 'ACTIVE' ? 'ACTIVE POLL' : 
               effectiveStatus === 'SCHEDULED' ? 'SCHEDULED' : 
               effectiveStatus === 'EXPIRED' ? 'EXPIRED' : 'CLOSED POLL'}
            </span>
            {effectiveStatus === 'ACTIVE' && (
              <span className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1 rounded-full border ${connectionStatus === 'Live' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'Live' ? 'bg-blue-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                {connectionStatus}
              </span>
            )}
          </div>
          {countdownStr && (
            <div className="text-sm font-semibold text-gray-500 mb-3 bg-gray-100 px-4 py-1.5 rounded-full inline-block">
              ⏱️ {countdownStr}
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-snug">{poll.question}</h1>
          {hasVoted && effectiveStatus === 'ACTIVE' && (
            <p className="text-sm text-gray-500 mt-3 font-medium bg-gray-100 px-3 py-1 rounded-full inline-block">
              {totalVotes} Total Votes
            </p>
          )}
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center justify-center gap-2 font-medium shadow-sm"><svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg> {error}</div>}
        {success && <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-center justify-center gap-2 font-medium shadow-sm"><svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> {success}</div>}

        <div className="space-y-4 mb-8" role="radiogroup">
          {poll.options.map((opt: any) => {
            const isSelected = selectedOption === opt.id;
            const voteCount = results[opt.id] || 0;
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            
            return (
              <div 
                key={opt.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={hasVoted || effectiveStatus !== 'ACTIVE' ? -1 : 0}
                onClick={() => {
                  if (!hasVoted && effectiveStatus === 'ACTIVE') {
                    setSelectedOption(opt.id);
                    setError(''); // Clear any validation error on selection
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !hasVoted && effectiveStatus === 'ACTIVE') {
                    e.preventDefault();
                    setSelectedOption(opt.id);
                    setError('');
                  }
                }}
                className={`relative overflow-hidden p-5 rounded-xl border-2 transition-all ${hasVoted || effectiveStatus !== 'ACTIVE' ? '' : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transform hover:-translate-y-0.5 shadow-sm hover:shadow'} ${
                  hasVoted || effectiveStatus !== 'ACTIVE' ? 'border-gray-200 cursor-default' : 
                  isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 bg-white'
                }`}
              >
                {hasVoted && (
                  <div className="absolute top-0 left-0 bottom-0 bg-primary-100 transition-all duration-700 ease-out z-0" style={{ width: `${percentage}%` }}></div>
                )}
                <div className="relative z-10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {!hasVoted && (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary-600' : 'border-gray-300'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 bg-primary-600 rounded-full"></div>}
                      </div>
                    )}
                    <span className={`font-semibold text-lg ${isSelected && !hasVoted ? 'text-primary-800' : 'text-gray-800'}`}>{opt.text}</span>
                  </div>
                  {hasVoted && <span className="text-sm font-bold text-gray-700 tabular-nums">{percentage}%</span>}
                </div>
              </div>
            );
          })}
        </div>

        {!hasVoted && effectiveStatus === 'ACTIVE' && (
          <button 
            onClick={handleVote}
            disabled={submitting}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all transform flex justify-center items-center shadow-md ${
              submitting 
                ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                : 'bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-lg focus:ring-4 focus:ring-primary-200 outline-none'
            }`}
          >
            {submitting ? <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></span> : 'Submit Vote'}
          </button>
        )}
      </div>
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 mb-2">Powered by</p>
        <Link to="/" className="text-primary-600 font-bold tracking-tight hover:opacity-80 transition-opacity">LivePoll</Link>
      </div>
    </div>
  );
};
