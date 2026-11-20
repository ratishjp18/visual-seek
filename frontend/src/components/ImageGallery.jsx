import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Search, Trash2, Eye, Tag, Filter, RefreshCw, Upload } from 'lucide-react';

export default function ImageGallery({
  images,
  total,
  tags,
  activeTag,
  setActiveTag,
  searchTerm,
  setSearchTerm,
  onInspectImage,
  onSearchSimilar,
  onDeleteImage,
  onOpenUpload,
  isLoading
}) {
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search by name & Tag filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        
        {/* Search by filename */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter gallery by filename..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Gallery Stats / Total Count */}
        <div className="flex items-center gap-3 justify-end text-xs text-slate-400">
          <span className="font-mono text-slate-200 font-bold">{total}</span> total images indexed
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Add Images</span>
          </button>
        </div>
      </div>

      {/* Horizontal Tag Filters */}
      {tags && tags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTag(null)}
            className={`flex-shrink-0 text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              activeTag === null
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Images ({total})
          </button>
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTag === tag
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>#{tag}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : images.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800/80">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No images found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {activeTag || searchTerm
              ? 'No images match the current filter. Try clearing filters.'
              : 'Your collection is empty. Upload image files to build your multimodal vector index!'}
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Images Now</span>
          </button>
        </div>
      ) : (
        /* Images Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative rounded-2xl overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              <div
                className="relative aspect-square bg-slate-950 overflow-hidden cursor-pointer"
                onClick={() => onInspectImage(image)}
              >
                <img
                  src={image.thumbnail_url || image.url}
                  alt={image.original_name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectImage(image);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs transition-all"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchSimilar(image);
                    }}
                    className="p-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs transition-all"
                    title="Search similar"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage(image.id);
                    }}
                    className="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs transition-all"
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div className="truncate text-xs font-medium text-slate-300" title={image.original_name}>
                  {image.original_name}
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>{image.width}×{image.height}</span>
                  <span>{formatBytes(image.file_size)}</span>
                </div>

                {image.tags && image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {image.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                    {image.tags.length > 2 && (
                      <span className="text-[9px] text-slate-500 font-mono">
                        +{image.tags.length - 2}
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
