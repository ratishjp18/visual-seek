import React from 'react';
import { Search, Image as ImageIcon, History, Upload, Sparkles, Layers, HardDrive } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenUpload, stats }) {
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => setActiveTab('search')}>
              <div className="w-10 h-10 rounded-xl overflow-hidden p-[1px] bg-gradient-to-tr from-cyan-400 via-brand-500 to-indigo-500 shadow-lg shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/logo.svg"
                  alt="VisualSeek Logo"
                  className="w-full h-full object-contain bg-slate-950 rounded-[11px] p-0.5"
                />
              </div>
              <div className="absolute -inset-0.5 bg-cyan-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300 pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  VisualSeek
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold">
                  CLIP AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multimodal Semantic Image Search
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'gallery'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Gallery</span>
              {stats?.total_images > 0 && (
                <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {stats.total_images}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
          </nav>

          {/* Right Action / Upload Button */}
          <div className="flex items-center gap-3">
            {stats && (
              <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 font-mono border-r border-slate-800 pr-4">
                <span className="flex items-center gap-1.5" title="Indexed Vectors in FAISS">
                  <Layers className="w-3.5 h-3.5 text-brand-400" />
                  {stats.indexed_vectors ?? 0} vectors
                </span>
                <span className="flex items-center gap-1.5" title="Disk Storage">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  {formatBytes(stats.total_storage_bytes)}
                </span>
              </div>
            )}

            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium text-sm transition-all shadow-lg shadow-brand-500/25 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Images</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
