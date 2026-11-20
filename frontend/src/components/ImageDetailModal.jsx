import React, { useState } from 'react';
import { X, Tag, Plus, Trash2, Search, Calendar, FileText, Maximize2, Check } from 'lucide-react';

export default function ImageDetailModal({
  image,
  onClose,
  onSearchSimilar,
  onDeleteImage,
  onUpdateTags
}) {
  if (!image) return null;

  const [tags, setTags] = useState(image.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddTag = (e) => {
    e?.preventDefault();
    const clean = newTagInput.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSaveTags = async () => {
    setIsSavingTags(true);
    try {
      await onUpdateTags(image.id, tags);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTags(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left side: High Res Image Preview */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center p-6 relative min-h-[300px] border-b md:border-b-0 md:border-r border-slate-800">
          <img
            src={image.url}
            alt={image.original_name}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
          />
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 left-4 p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-all"
            title="Open original high-res image"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Full Image</span>
          </a>
        </div>

        {/* Right side: Metadata & Actions */}
        <div className="w-full md:w-96 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            
            {/* Header / Filename */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white break-all leading-tight">
                  {image.original_name}
                </h3>
                <span className="text-xs text-slate-500 font-mono mt-1 block">
                  ID: #{image.id}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onSearchSimilar(image);
                  onClose();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Search Similar</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this image and its vector embedding?')) {
                    onDeleteImage(image.id);
                    onClose();
                  }
                }}
                className="p-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 text-xs transition-all"
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata Table */}
            <div className="space-y-2.5 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Dimensions</span>
                <span className="font-mono text-slate-200">{image.width} × {image.height} px</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">File Size</span>
                <span className="font-mono text-slate-200">{formatBytes(image.file_size)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Format</span>
                <span className="font-mono text-slate-200 uppercase">{image.mime_type.replace('image/', '')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Indexed Date</span>
                <span className="font-mono text-slate-400 text-[11px]">{image.created_at || 'Just now'}</span>
              </div>
            </div>

            {/* Tags & Zero-Shot Auto-Classification */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-400" />
                  Semantic Tags
                </span>
                <button
                  onClick={handleSaveTags}
                  disabled={isSavingTags}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Saved</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>

              {/* Tags Pills */}
              <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700/60"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Tag Input */}
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Add custom tag..."
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={!newTagInput.trim()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
