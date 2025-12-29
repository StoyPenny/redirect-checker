import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle, XCircle, ExternalLink, AlertTriangle, ArrowRight, Loader2, Info, Download } from 'lucide-react';

export default function App() {
  const [inputText, setInputText] = useState('');
  
  // Updated state for two domains
  const [oldBaseDomain, setOldBaseDomain] = useState('');
  const [newBaseDomain, setNewBaseDomain] = useState('');
  
  const [redirects, setRedirects] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Parsing logic to handle CSV, Tabs, or arrows
  const parseInput = () => {
    if (!inputText.trim()) return;

    const lines = inputText.split('\n');
    const parsed = lines
      .map((line, index) => {
        if (!line.trim()) return null;
        
        // Try to split by common separators
        let parts = line.split(/,|\t|\s{2,}|->/);
        
        // Clean up parts
        parts = parts.map(p => p.trim()).filter(p => p.length > 0);

        if (parts.length < 2) return null;

        return {
          id: index,
          originalInput: parts[0],
          targetInput: parts[1],
          status: 'pending', // pending, success, mismatch, error
          details: '',
          finalUrl: ''
        };
      })
      .filter(Boolean);

    setRedirects(parsed);
  };

  // Helper to construct full URL based on type (source vs target)
  const getFullUrl = (pathOrUrl, type) => {
    if (!pathOrUrl) return '';
    try {
      // If it's already a valid URL, return it
      new URL(pathOrUrl);
      return pathOrUrl;
    } catch (e) {
      // Determine which base domain to use
      const domain = type === 'source' ? oldBaseDomain : newBaseDomain;
      
      if (domain) {
        // Remove trailing slash from domain and leading slash from path to avoid doubles
        const cleanDomain = domain.replace(/\/$/, '');
        const cleanPath = pathOrUrl.replace(/^\//, '');
        return `${cleanDomain}/${cleanPath}`;
      }
      return pathOrUrl; // Return as is if no base domain (will likely fail validation later)
    }
  };

  // CSV Export Function
  const downloadCSV = () => {
    if (redirects.length === 0) return;

    // Helper to safely escape CSV fields
    const escapeCsv = (text) => {
      if (!text) return '';
      const stringText = String(text);
      if (stringText.includes(',') || stringText.includes('"') || stringText.includes('\n')) {
        return `"${stringText.replace(/"/g, '""')}"`;
      }
      return stringText;
    };

    const headers = ['Status', 'Original Input', 'Full Source URL', 'Target Input', 'Expected Target URL', 'Actual Final URL', 'Details'];
    
    const rows = redirects.map(r => [
      r.status,
      r.originalInput,
      getFullUrl(r.originalInput, 'source'),
      r.targetInput,
      getFullUrl(r.targetInput, 'target'),
      r.finalUrl || '',
      r.details
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `redirect_results_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // The checking logic
  const checkRedirects = async () => {
    if (redirects.length === 0) {
      parseInput(); // Try parsing if they hit run without parsing first
      if (!inputText) return;
    }

    setIsProcessing(true);
    let currentList = redirects.length > 0 ? [...redirects] : [];
    
    // If redirects state was empty, re-parse from input
    if (currentList.length === 0) {
      const lines = inputText.split('\n');
      currentList = lines.map((line, index) => {
        if (!line.trim()) return null;
        let parts = line.split(/,|\t|\s{2,}|->/);
        parts = parts.map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length < 2) return null;
        return {
          id: index,
          originalInput: parts[0],
          targetInput: parts[1],
          status: 'pending',
          details: '',
          finalUrl: ''
        };
      }).filter(Boolean);
      setRedirects(currentList);
    }

    setProgress({ current: 0, total: currentList.length });

    const updatedRedirects = [...currentList];

    for (let i = 0; i < updatedRedirects.length; i++) {
      const item = updatedRedirects[i];
      
      // Calculate full URLs using the specific type
      const sourceUrl = getFullUrl(item.originalInput, 'source');
      const expectedUrl = getFullUrl(item.targetInput, 'target');

      // Update progress
      setProgress({ current: i + 1, total: updatedRedirects.length });

      try {
        // We use fetch to try and follow the redirect
        const response = await fetch(sourceUrl, {
          method: 'GET',
          redirect: 'follow',
          // mode: 'cors' is default. If the server doesn't allow CORS, this will throw.
        });

        const landedUrl = response.url;
        
        // Normalize URLs for comparison (remove trailing slashes)
        const normalize = (u) => u.replace(/\/$/, '').toLowerCase();
        
        if (normalize(landedUrl) === normalize(expectedUrl)) {
          updatedRedirects[i].status = 'success';
          updatedRedirects[i].details = 'Redirected correctly';
          updatedRedirects[i].finalUrl = landedUrl;
        } else {
          updatedRedirects[i].status = 'mismatch';
          updatedRedirects[i].details = 'Landed on unexpected URL';
          updatedRedirects[i].finalUrl = landedUrl;
        }

      } catch (error) {
        // CORS errors or Network errors
        updatedRedirects[i].status = 'error';
        updatedRedirects[i].details = 'CORS/Network Error - Verify Manually';
        updatedRedirects[i].finalUrl = '---';
      }

      // Update state incrementally so user sees progress
      setRedirects([...updatedRedirects]);
      
      // Small delay to be nice to the browser/network
      await new Promise(r => setTimeout(r, 200)); 
    }

    setIsProcessing(false);
  };

  const clearAll = () => {
    setRedirects([]);
    setInputText('');
    setProgress({ current: 0, total: 0 });
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'success':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1"/> Working</span>;
      case 'mismatch':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1"/> Mismatch</span>;
      case 'error':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><Info className="w-3 h-3 mr-1"/> Manual Check</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 p-4 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <RotateCcw className="text-blue-600" />
            Redirect Verification Tool
          </h1>
          <p className="text-slate-500">
            Paste your list of redirects to verify them. 
            <span className="block mt-1 text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-100 w-fit">
              <AlertTriangle className="inline w-3 h-3 mr-1 mb-0.5"/>
              Note: Due to browser security (CORS), some functional redirects may show as "Manual Check". Use the link buttons to verify these.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
              <h2 className="font-semibold text-lg mb-4">1. Configuration</h2>
              
              <div className="space-y-4 flex-1">
                {/* Domain Inputs Grid */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Old Site Domain (Source)</label>
                    <input 
                      type="text" 
                      placeholder="https://oldsite.com"
                      value={oldBaseDomain}
                      onChange={(e) => setOldBaseDomain(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Site Domain (Target)</label>
                    <input 
                      type="text" 
                      placeholder="https://newsite.com"
                      value={newBaseDomain}
                      onChange={(e) => setNewBaseDomain(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <p className="text-xs text-slate-400">If domains are different (migration), fill both. If same site, just fill one or rely on full URLs in the text.</p>
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paste Redirects</label>
                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`/old-url-1, /new-url-1\n/old-url-2, /new-url-2\nhttps://site.com/old -> https://site.com/new`}
                    className="w-full flex-1 min-h-[300px] p-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-2">Format: "Old, New" or "Old [tab] New"</p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 flex gap-2">
                <button 
                  onClick={checkRedirects}
                  disabled={isProcessing || !inputText}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-white transition-colors
                    ${isProcessing || !inputText ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
                >
                  {isProcessing ? <Loader2 className="animate-spin w-4 h-4"/> : <Play className="w-4 h-4"/>}
                  {isProcessing ? 'Checking...' : 'Run Check'}
                </button>
                <button 
                  onClick={clearAll}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[500px]">
              <div className="p-5 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="font-semibold text-lg">2. Results</h2>
                  {!isProcessing && redirects.length > 0 && (
                     <div className="hidden sm:flex gap-4 text-xs font-medium border-l border-gray-200 pl-4">
                        <span className="text-green-600">{redirects.filter(r => r.status === 'success').length} Success</span>
                        <span className="text-yellow-600">{redirects.filter(r => r.status === 'mismatch').length} Mismatch</span>
                        <span className="text-gray-500">{redirects.filter(r => r.status === 'error').length} Manual</span>
                     </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isProcessing && (
                    <span className="text-sm text-slate-500 mr-2">
                      Processing {progress.current} of {progress.total}
                    </span>
                  )}
                  {redirects.length > 0 && !isProcessing && (
                    <button 
                      onClick={downloadCSV}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-slate-50 relative">
                {redirects.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <ArrowRight className="w-12 h-12 mb-4 text-slate-200" />
                    <p>Paste your links and click Run Check to see results here.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Old URL</th>
                        <th className="px-6 py-3 font-medium">Expected New</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {redirects.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={item.status} />
                              {item.status === 'mismatch' && (
                                <span className="text-xs text-red-500 truncate max-w-[200px]" title={item.finalUrl}>
                                  Got: {item.finalUrl}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate" title={getFullUrl(item.originalInput, 'source')}>
                            <span className="font-mono text-slate-600">{item.originalInput}</span>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate" title={getFullUrl(item.targetInput, 'target')}>
                            <span className="font-mono text-slate-600">{item.targetInput}</span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <a 
                              href={getFullUrl(item.originalInput, 'source')} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors text-xs font-medium"
                            >
                              Verify <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}