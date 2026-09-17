import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../api/client';

export const CreatePoll = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validOptions = options.map(o => o.trim()).filter(o => o !== '');
    if (validOptions.length < 2) return setError('At least 2 non-empty options are required');
    
    setLoading(true);
    try {
      const res = await request('/polls', {
        method: 'POST',
        body: JSON.stringify({ question, options: validOptions }),
      });
      if (res.success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto min-h-[calc(100vh-73px)]">
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>
      </div>
      
      <div className="card border-gray-200 shadow-sm">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create a New Poll</h1>
          <p className="text-gray-500 mt-2 text-sm">Ask a question and define the options for your audience.</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Question</label>
            <input 
              type="text" required 
              value={question} onChange={e => setQuestion(e.target.value)} 
              className="input-field text-lg font-medium placeholder-gray-400" 
              placeholder="e.g., Which framework do you prefer for 2026?" 
              disabled={loading} 
              maxLength={300}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Voting Options</label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2 items-center group">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-medium text-sm">{index + 1}.</span>
                    </div>
                    <input 
                      type="text" 
                      value={option} 
                      onChange={e => handleOptionChange(index, e.target.value)} 
                      className="input-field pl-8 focus:ring-primary-400" 
                      placeholder={`Enter option text...`} 
                      disabled={loading} 
                      maxLength={100}
                      required={index < 2} // First two are required by HTML
                    />
                  </div>
                  {options.length > 2 && (
                    <button 
                      type="button" 
                      onClick={() => removeOption(index)} 
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500" 
                      disabled={loading}
                      aria-label="Remove option"
                      title="Remove option"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button 
              type="button" 
              onClick={addOption} 
              disabled={loading || options.length >= 20} 
              className="mt-4 flex items-center gap-1.5 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add another option
            </button>
          </div>
          
          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <Link to="/dashboard" className="btn-secondary px-6">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-primary px-8 flex items-center justify-center">
              {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
