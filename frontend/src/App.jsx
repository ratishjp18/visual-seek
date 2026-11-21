import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import ImageGallery from './components/ImageGallery';
import SearchHistory from './components/SearchHistory';
import UploadModal from './components/UploadModal';
import ImageDetailModal from './components/ImageDetailModal';

import {
  fetchStats,
  searchByText,
  searchByImage,
  fetchImages,
  deleteImage,
  updateImageTags,
  fetchHistory,
  clearHistory,
  fetchTags
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'gallery' | 'history'
  const [stats, setStats] = useState(null);

  // Search state
  const [searchResponse, setSearchResponse] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [gallerySearchTerm, setGallerySearchTerm] = useState('');
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [inspectedImage, setInspectedImage] = useState(null);

  // Initial load
  useEffect(() => {
    loadStats();
    loadTags();
  }, []);

  // Tab switch effect
  useEffect(() => {
    if (activeTab === 'gallery') {
      loadGallery();
    } else if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, activeTag, gallerySearchTerm]);

  const loadStats = async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (e) {
      console.warn('Could not load stats yet', e);
    }
  };

  const loadTags = async () => {
    try {
      const data = await fetchTags();
      setTags(data.tags || []);
    } catch (e) {
      console.warn('Could not load tags', e);
    }
  };

  const loadGallery = async () => {
    setIsGalleryLoading(true);
    try {
      const data = await fetchImages({
        limit: 100,
        tag: activeTag,
        search: gallerySearchTerm || null
      });
      setGalleryImages(data.images || []);
      setGalleryTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const data = await fetchHistory(50);
      setHistory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Search Handlers
  const handleSearchText = async (query, topK = 20) => {
    setIsSearching(true);
    setActiveTab('search');
    try {
      const res = await searchByText(query, topK);
      setSearchResponse(res);
      loadStats();
    } catch (err) {
      alert(`Search error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchImage = async (file, topK = 20) => {
    setIsSearching(true);
    setActiveTab('search');
    try {
      const res = await searchByImage(file, topK);
      setSearchResponse(res);
      loadStats();
    } catch (err) {
      alert(`Search error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Action: Search similar to an existing image
  const handleSearchSimilarFromCard = async (image) => {
    try {
      // Fetch image blob from URL and execute search by image
      const response = await fetch(image.url);
      const blob = await response.blob();
      const file = new File([blob], image.filename, { type: image.mime_type });
      handleSearchImage(file);
    } catch (err) {
      alert(`Could not initiate similar search: ${err.message}`);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await deleteImage(imageId);
      // Remove from gallery and search results
      setGalleryImages(prev => prev.filter(img => img.id !== imageId));
      setGalleryTotal(prev => Math.max(0, prev - 1));
      if (searchResponse) {
        setSearchResponse(prev => ({
          ...prev,
          results: prev.results.filter(r => r.image.id !== imageId),
          total_found: Math.max(0, prev.total_found - 1)
        }));
      }
      loadStats();
      loadTags();
    } catch (err) {
      alert(`Failed to delete image: ${err.message}`);
    }
  };

  const handleUpdateTags = async (imageId, newTags) => {
    const updated = await updateImageTags(imageId, newTags);
    setGalleryImages(prev => prev.map(img => img.id === imageId ? updated : img));
    if (inspectedImage?.id === imageId) {
      setInspectedImage(updated);
    }
    loadTags();
    loadStats();
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      setHistory([]);
      loadStats();
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  const handleUploadComplete = () => {
    loadStats();
    loadTags();
    loadGallery();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        stats={stats}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Tab 1: Search View */}
        {activeTab === 'search' && (
          <div className="space-y-8">
            {/* Search Input Bar */}
            <div className="text-center space-y-2 pt-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Find Any Image by Natural Language
              </h1>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Powered by OpenCLIP multimodal embeddings and FAISS cosine similarity vector search. No manual filenames required.
              </p>
            </div>

            <SearchBar
              onSearchText={handleSearchText}
              onSearchImage={handleSearchImage}
              isSearching={isSearching}
            />

            {/* Results Grid */}
            <SearchResults
              searchResponse={searchResponse}
              onInspectImage={(img) => setInspectedImage(img)}
              onSearchSimilar={handleSearchSimilarFromCard}
              onTagClick={(tag) => {
                setActiveTab('gallery');
                setActiveTag(tag);
              }}
            />
          </div>
        )}

        {/* Tab 2: Gallery View */}
        {activeTab === 'gallery' && (
          <ImageGallery
            images={galleryImages}
            total={galleryTotal}
            tags={tags}
            activeTag={activeTag}
            setActiveTag={setActiveTag}
            searchTerm={gallerySearchTerm}
            setSearchTerm={setGallerySearchTerm}
            onInspectImage={(img) => setInspectedImage(img)}
            onSearchSimilar={handleSearchSimilarFromCard}
            onDeleteImage={handleDeleteImage}
            onOpenUpload={() => setIsUploadOpen(true)}
            isLoading={isGalleryLoading}
          />
        )}

        {/* Tab 3: History View */}
        {activeTab === 'history' && (
          <SearchHistory
            history={history}
            onReplaySearch={(text) => handleSearchText(text)}
            onClearHistory={handleClearHistory}
            isLoading={isHistoryLoading}
          />
        )}
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* Image Detail / Zoom Modal */}
      <ImageDetailModal
        image={inspectedImage}
        onClose={() => setInspectedImage(null)}
        onSearchSimilar={handleSearchSimilarFromCard}
        onDeleteImage={handleDeleteImage}
        onUpdateTags={handleUpdateTags}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <p>VisualSeek • OpenCLIP (ViT-B-32) + FAISS Vector Search + FastAPI + React</p>
      </footer>
    </div>
  );
}
