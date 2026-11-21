import React from 'react';
import { Sparkles, Eye, Search, Tag, Clock, ArrowUpRight } from 'lucide-react';

export default function SearchResults({
  searchResponse,
  onInspectImage,
  onSearchSimilar,
  onTagClick
}) {
  if (!searchResponse) return null;

  const { query_type, query_text, query_image_url, results, total_found, search_time_ms } = searchResponse;

  const getScoreColor = (pct) => {
    if (pct >= 75) return 'from-emerald-500 to-teal-400 text-emerald-300 border-emerald-500/30';
    if (pct >= 55) return 'from-brand-500 to-cyan-400 text-brand-300 border-brand-500/30';
    return 'from-amber-500 to-orange-400 text-amber-300 border-amber-500/30';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          {query_type === 'image' && query_image_url ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0">
              <img src={query_image_url} alt="Query" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-brand-500/15 text-brand-400 font-semibold">
                {query_type === 'text' ? 'Text Query' : 'Visual Reference'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {search_time_ms} ms
              </span>
            </div>
            <h3 className="text-base font-semibold text-white mt-1">
              {query_type === 'text' ? (
                <span>&ldquo;{query_text}&rdquo;</span>
              ) : (
                <span>Visual similarity search matches</span>
              )}
            </h3>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {total_found}
          </div>
          <div className="text-xs text-slate-400">Relevant results retrieved</div>
        </div>
      </div>

      {/* No Results Fallback */}
      {results.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-200">No matching images found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Try adjusting your query, using broader descriptive keywords, or uploading more images to your library.
          </p>
        </div>
      ) : (
        /* Results Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {results.map(({ image, similarity, similarity_percentage, rank }) => (
            <div
              key={image.id}
              className="group relative rounded-2xl overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image Preview */}
              <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onInspectImage(image)}>
                <img
                  src={image.thumbnail_url || image.url}
                  alt={image.original_name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Similarity Score Pill */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-xs font-mono font-bold shadow-lg">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getScoreColor(similarity_percentage)}`} />
                  <span className="text-white">{similarity_percentage}% match</span>
                </div>

                {/* Rank Badge */}
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-300 text-[11px] font-mono font-bold flex items-center justify-center shadow-md">
                  #{rank}
                </div>

                {/* Hover Overlay Action */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectImage(image);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md"
                    title="View details & zoom"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchSimilar(image);
                    }}
                    className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-brand-600/30"
                    title="Find images similar to this"
                  >
                    <Search className="w-4 h-4" />
                    <span>Similar</span>
                  </button>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate font-medium text-slate-300" title={image.original_name}>
                    {image.original_name}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 flex-shrink-0 ml-2">
                    {image.width}×{image.height}
                  </span>
                </div>

                {/* Tags */}
                {image.tags && image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {image.tags.slice(0, 3).map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => onTagClick?.(tag)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                    {image.tags.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                        +{image.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
