import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { request } from '../api/client';

export const ManagePoll = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<any[]>([]);
  const [poll, setPoll] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await request(`/polls/${id}`);
        if (res.success) {
          setPoll(res.poll);
          setQuestion(res.poll.question);
          setOptions(res.poll.options.map((o: any) => o.text));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load poll. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

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
    
    setSaving(true);
    try {
      const res = await request(`/polls/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ question, options: validOptions }),
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

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-[calc(100vh-73px)]">
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors w-fit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Form */}
        <div className="lg:col-span-2 card border-gray-200 shadow-sm">
          <div className="mb-8 border-b border-gray-100 pb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Poll</h1>
              <p className="text-gray-500 mt-1 text-sm">Update your poll question and options.</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-md tracking-wide ${
                  poll.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Question</label>
              <input 
                type="text" required 
                value={question} onChange={e => setQuestion(e.target.value)} 
                className="input-field font-medium text-gray-900" 
                disabled={saving || poll.status !== 'active'}
                maxLength={300}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Options</label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-medium text-sm">{index + 1}.</span>
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
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500" 
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
                  className="mt-4 flex items-center gap-1.5 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add another option
                </button>
              )}
            </div>
            
            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
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

        {/* Sidebar Actions */}
        <div className="space-y-6">
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
        </div>
      </div>
    </div>
  );
};
