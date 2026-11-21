import React, { useState, useRef } from 'react';
import { Search, Image as ImageIcon, Sparkles, X, UploadCloud, ArrowRight } from 'lucide-react';

const SUGGESTIONS = [
  "Red sports car parked near a mountain",
  "Golden retriever puppy playing in the grass",
  "Futuristic cyberpunk neon city street at night",
  "Freshly brewed cup of espresso with foam art",
  "Tropical island beach with turquoise water",
  "Cozy modern workspace with laptop and houseplants",
  "Majestic snowy mountain peak under sunset",
];

export default function SearchBar({ onSearchText, onSearchImage, isSearching }) {
  const [mode, setMode] = useState('text'); // 'text' | 'image'
  const [textQuery, setTextQuery] = useState('');
  const [topK, setTopK] = useState(20);

  // Reference image state
  const [refImageFile, setRefImageFile] = useState(null);
  const [refImagePreview, setRefImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleTextSubmit = (e) => {
    e?.preventDefault();
    if (!textQuery.trim() || isSearching) return;
    onSearchText(textQuery.trim(), topK);
  };

  const handleSuggestionClick = (suggestion) => {
    setTextQuery(suggestion);
    onSearchText(suggestion, topK);
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    setRefImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setRefImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageSubmit = (e) => {
    e?.preventDefault();
    if (!refImageFile || isSearching) return;
    onSearchImage(refImageFile, topK);
  };

  const handleClearImage = () => {
    setRefImageFile(null);
    setRefImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Mode Switcher & Top-K selector */}
      <div className="flex items-center justify-between px-1">
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'text'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Text to Image</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('image')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'image'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Search by Reference Image</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Top Results:</span>
          <select
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={40}>Top 40</option>
          </select>
        </div>
      </div>

      {/* Text Search Box */}
      {mode === 'text' && (
        <form onSubmit={handleTextSubmit} className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              placeholder='Describe any image (e.g. "Red sports car parked near a mountain")...'
              className="w-full pl-12 pr-28 py-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-brand-500 focus:bg-slate-900 text-white placeholder-slate-500 shadow-2xl transition-all outline-none text-base"
            />
            {textQuery && (
              <button
                type="button"
                onClick={() => setTextQuery('')}
                className="absolute right-24 text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!textQuery.trim() || isSearching}
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:opacity-40 text-white font-medium text-sm transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/25"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Quick prompt pills */}
          <div className="pt-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Try natural-language examples:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(item)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all text-left"
                >
                  "{item}"
                </button>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* Image Reference Search Dropzone */}
      {mode === 'image' && (
        <form onSubmit={handleImageSubmit} className="space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageSelect(e.target.files?.[0])}
          />

          {!refImagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleImageSelect(e.dataTransfer.files?.[0]);
              }}
              className="border-2 border-dashed border-slate-800 hover:border-brand-500/50 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl p-8 text-center cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">
                Drag and drop a reference image here, or browse
              </h4>
              <p className="text-xs text-slate-400">
                VisualSeek will use OpenCLIP's image encoder to find visually and semantically similar images in your collection.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-700">
                  <img
                    src={refImagePreview}
                    alt="Query Reference"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Reference Image Selected</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono">
                      Query Vector
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {refImageFile?.name} ({(refImageFile?.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-all"
                >
                  Change Image
                </button>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-white font-medium text-xs shadow-lg shadow-brand-500/25 flex items-center gap-2"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Find Similar Images</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
