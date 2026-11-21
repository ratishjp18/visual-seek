import React, { useState, useRef } from 'react';
import { UploadCloud, X, CheckCircle, AlertCircle, FileText, Sparkles, Layers } from 'lucide-react';
import { uploadImages } from '../api';

export default function UploadModal({ isOpen, onClose, onUploadComplete }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadReport, setUploadReport] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFilesAdded = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    setSelectedFiles(prev => [...prev, ...fileList]);

    // Create thumbnail previews
    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, { name: file.name, url: e.target.result, size: file.size }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      const result = await uploadImages(selectedFiles);
      setUploadReport(result);
      setUploadStatus('success');
      onUploadComplete?.();
    } catch (err) {
      setUploadStatus('error');
      setUploadReport({ error: err.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setUploadStatus(null);
    setUploadReport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Upload Images</h3>
              <p className="text-xs text-slate-400">Add multiple images to the OpenCLIP FAISS vector index</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
          />

          {uploadStatus !== 'success' ? (
            <>
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesAdded(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-slate-800 hover:border-brand-500/50 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-6 text-center cursor-pointer transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Click to select multiple images or drag & drop here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports JPG, PNG, WEBP, BMP. Images are auto-tagged and indexed for natural language search.
                </p>
              </div>

              {/* Previews List */}
              {previews.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{previews.length} images selected</span>
                    <button
                      onClick={handleReset}
                      className="text-red-400 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-56 overflow-y-auto p-1">
                    {previews.map((item, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-950 border border-slate-800">
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Upload Complete Report */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Upload & Indexing Complete!</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Successfully embedded {uploadReport?.uploaded_count} images with OpenCLIP and added vectors to the FAISS index.
                </p>
              </div>

              <div className="flex justify-center gap-3 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  Uploaded: <span className="text-emerald-400 font-bold">{uploadReport?.uploaded_count}</span>
                </div>
                {uploadReport?.error_count > 0 && (
                  <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    Errors: <span className="text-red-400 font-bold">{uploadReport?.error_count}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          {uploadStatus !== 'success' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-600/30"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Indexing Vectors...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Index {selectedFiles.length} Images</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
            >
              Done & Browse
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
