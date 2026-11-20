import React from 'react';
import { History, Search, Image as ImageIcon, Trash2, Clock, ArrowRight } from 'lucide-react';

export default function SearchHistory({
  history,
  onReplaySearch,
  onClearHistory,
  isLoading
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Search History</h3>
            <p className="text-xs text-slate-400">Past multimodal and natural-language queries</p>
          </div>
        </div>

        {history && history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 text-xs font-medium transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !history || history.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800/80">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-200">No search history yet</h4>
          <p className="text-xs text-slate-400 mt-1">
            Search for images by natural-language description or visual reference to see your log here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-center gap-4">
                {item.query_type === 'image' && item.query_image_url ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex-shrink-0">
                    <img src={item.query_image_url} alt="Query ref" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 group-hover:text-brand-400 flex items-center justify-center flex-shrink-0">
                    <Search className="w-5 h-5" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.query_type === 'text' ? 'Text Search' : 'Visual Search'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {item.created_at}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1">
                    {item.query_type === 'text' ? (
                      <span>&ldquo;{item.query_text}&rdquo;</span>
                    ) : (
                      <span>Search by Reference Image</span>
                    )}
                  </h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Found {item.result_count} relevant images
                  </div>
                </div>
              </div>

              {item.query_type === 'text' && (
                <button
                  onClick={() => onReplaySearch(item.query_text)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>Re-run</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
