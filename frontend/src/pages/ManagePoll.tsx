import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { request, API_URL } from '../api/client';

export const ManagePoll = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<any[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [poll, setPoll] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Helper to format ISO date to datetime-local
  const formatForInput = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // YYYY-MM-DDThh:mm
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await request(`/polls/${id}`);
        if (res.success) {
          setPoll(res.poll);
          setQuestion(res.poll.question);
          setOptions(res.poll.options.map((o: any) => o.text));
          if (res.poll.start_time) setStartTime(formatForInput(res.poll.start_time));
          if (res.poll.end_time) setEndTime(formatForInput(res.poll.end_time));
          if (res.results) setResults(res.results);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load poll. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

  useEffect(() => {
    if (!poll || poll.status !== 'active') return;

    const sse = new EventSource(`${API_URL}/public/polls/${id}/events`);
    
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'vote_update' && data.results) {
          setResults(data.results);
        }
      } catch (e) {
        console.error("Error parsing SSE event", e);
      }
    };

    return () => sse.close();
  }, [poll, id]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  const addOption = () => setOptions([...options, '']);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const validOptions = options.map(o => o.trim()).filter(o => o !== '');
    if (validOptions.length < 2) return setError('At least 2 non-empty options are required');
    
    let parsedStartTime = null;
    let parsedEndTime = null;
    if (startTime) parsedStartTime = new Date(startTime).toISOString();
    if (endTime) parsedEndTime = new Date(endTime).toISOString();

    if (parsedStartTime && parsedEndTime && new Date(parsedStartTime) >= new Date(parsedEndTime)) {
      return setError('Start time must be before end time');
    }
    
    setSaving(true);
    try {
      const res = await request(`/polls/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          question, 
          options: validOptions, 
          status: poll.status,
          start_time: parsedStartTime,
          end_time: parsedEndTime
        }),
      });
      if (res.success) {
        setSuccess('Poll updated successfully!');
        setPoll(res.poll); // sync latest state
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update poll');
    } finally {
      setSaving(false);
    }
  };

  const handleClosePoll = async () => {
    if (!window.confirm("Are you sure you want to close this poll? This action cannot be undone and will permanently disable voting.")) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const validOptions = options.map(o => o.trim()).filter(o => o !== '');
      const res = await request(`/polls/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ question, options: validOptions, status: 'closed' }),
      });
      if (res.success) {
        setSuccess('Poll closed successfully!');
        setPoll(res.poll); // sync latest state
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to close poll');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/poll/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[calc(100vh-73px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
  
  if (!poll && error) return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-4">
      <div className="card text-center max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Poll</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/dashboard" className="btn-primary w-full block">Return to Dashboard</Link>
      </div>
    </div>
  );

  const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-[calc(100vh-73px)]">
      <div className="mb-6">
        <button type="button" onClick={() => navigate(-1)} className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors w-fit cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Form */}
        <div className="lg:col-span-3 card border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="mb-8 border-b border-gray-100 dark:border-gray-700 pb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Manage Poll</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Update your poll question and options.</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-md tracking-wide ${
                  poll.status === 'active' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              {poll.status.toUpperCase()}
            </span>
          </div>
          
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2"><svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg><span>{error}</span></div>}
          
          {/* Toast Notification for Success */}
          <div className={`fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 transform ${success ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'} z-50`}>
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            <span className="font-medium">{success}</span>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Question</label>
              <input 
                type="text" required 
                value={question} onChange={e => setQuestion(e.target.value)} 
                className="input-field font-medium text-gray-900 dark:text-white" 
                disabled={saving || poll.status !== 'active'}
                maxLength={300}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Options</label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">{index + 1}.</span>
                      </div>
                      <input 
                        type="text" 
                        value={option} 
                        onChange={e => handleOptionChange(index, e.target.value)} 
                        className="input-field pl-8 focus:ring-primary-400" 
                        disabled={saving || poll.status !== 'active'} 
                        maxLength={100}
                        required={index < 2}
                      />
                    </div>
                    {options.length > 2 && poll.status === 'active' && (
                      <button 
                        type="button" 
                        onClick={() => removeOption(index)} 
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500" 
                        disabled={saving}
                        aria-label="Remove option"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {poll.status === 'active' && (
                <button 
                  type="button" 
                  onClick={addOption} 
                  disabled={saving || options.length >= 20} 
                  className="mt-4 flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add another option
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={startTime} onChange={e => setStartTime(e.target.value)} 
                  className="input-field text-sm text-gray-900 dark:text-white" 
                  disabled={saving || poll.status !== 'active'} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={endTime} onChange={e => setEndTime(e.target.value)} 
                  className="input-field text-sm text-gray-900 dark:text-white" 
                  disabled={saving || poll.status !== 'active'} 
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button 
                type="submit" 
                disabled={saving || poll.status !== 'active'} 
                className="btn-primary px-8 flex items-center justify-center min-w-[140px]"
              >
                {saving ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Voting Results Section */}
        <div className="lg:col-span-2 card border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Voting Results</h2>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              Total Votes: {totalVotes}
            </span>
          </div>

          {totalVotes === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">No votes yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {poll.options.map((opt: any) => {
                const voteCount = results[opt.id] || 0;
                const percentage = Math.round((voteCount / totalVotes) * 100);
                return (
                  <div key={opt.id}>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{opt.text}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-white mr-2">{percentage}%</span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-primary-500 dark:bg-primary-600 h-3 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6 lg:col-span-1">
          <div className="card bg-gray-900 border-none text-white shadow-md">
            <h3 className="font-bold text-lg mb-2">Share Link</h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">Share this link with your audience to start gathering votes immediately.</p>
            
            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700 mb-4 overflow-hidden">
              <div className="px-3 py-2 text-sm text-gray-300 font-mono truncate flex-1 opacity-80 select-all">
                {window.location.origin}/poll/{id}
              </div>
            </div>
            
            <button 
              onClick={copyLink} 
              className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${copied ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
            >
              {copied ? (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Link Copied!</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg> Copy URL</>
              )}
            </button>
            
            <Link to={`/poll/${id}`} target="_blank" rel="noopener noreferrer" className="block text-center mt-3 text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Open public page ↗
            </Link>
          </div>
          
          {poll.status === 'active' && (
            <div className="card border border-red-100 dark:border-red-900/50 shadow-sm bg-white dark:bg-gray-800">
              <h3 className="font-bold text-lg text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Closing the poll will permanently disable new votes. Existing results will be preserved.</p>
              <button 
                onClick={handleClosePoll} 
                disabled={saving}
                className="w-full py-2.5 rounded-lg font-medium text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Close Poll'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
