# VisualSeek: AI-Powered Semantic Image Search Engine

> Search image collections using natural-language descriptions or visual reference images instead of filenames. Powered by **OpenCLIP** multimodal embeddings, **FAISS** vector search, **FastAPI**, and **React**.

---

## Overview

Finding specific images in a large collection (e.g. 10,000 photos named `IMG_001.jpg`, `IMG_002.jpg`) is difficult when relying solely on filenames.

With **VisualSeek**, users can type natural language descriptions such as:
> *"Red sports car parked near a mountain"*
> *"Golden retriever puppy playing in the grass"*
> *"Cozy workspace with laptop and coffee"*

The system retrieves visually and semantically relevant images ranked by similarity score. It also supports **search by reference image** (image-to-image similarity) and **zero-shot automatic tagging**.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + Tailwind CSS | Responsive, modern dark UI with Lucide icons |
| **Backend** | FastAPI + Uvicorn | High-performance asynchronous REST API |
| **AI / Embeddings** | OpenCLIP (`ViT-B-32-quickgelu` / OpenAI weights) | Multimodal 512-dim text & image vector representation |
| **Vector Search** | FAISS (`IndexIDMap2` + `IndexFlatIP`) | Fast cosine similarity ranking & sub-100ms vector retrieval |
| **Image Processing** | Pillow (PIL) | Dimension inspection, thumbnail generation, format parsing |
| **Metadata Storage** | SQLite 3 | Image metadata, SHA256 hashes, tag storage, search history |
| **Paid API** | **Not Required** | Runs 100% locally on CPU or CUDA GPU |

---

## Features

1. **Multiple Image Uploads**: Batch drag-and-drop or select images; instantly generates thumbnails, computes CLIP embeddings, tags concepts, and indexes into FAISS.
2. **Text-to-Image Search**: Enter natural-language queries to retrieve the most visually relevant images with cosine similarity scores.
3. **Search by Reference Image**: Upload or select an image to find visually and semantically similar items across the entire collection.
4. **Similarity-Ranked Results**: Badges showing matching percentage (`% match`), rank `#1, #2...`, and hover actions (`View Details`, `Search Similar`).
5. **Image Gallery**: Browse the entire library with pagination, filter by auto-generated tags, and search by filename.
6. **Zero-Shot Semantic Tags & Metadata**: Automatic classification across common categories (`nature`, `vehicles`, `mountains`, `sunset`, `workspace`, etc.) plus custom tag editing.
7. **Search History**: Complete log of previous text and image queries with timestamps, result counts, and one-click search replay.

---

## Project Structure

```
visual-seek/
├── backend/
│   ├── app/
│   │   ├── config.py         # App configuration, paths, model parameters
│   │   ├── database.py       # SQLite schema, tables (images, search_history)
│   │   ├── model.py          # OpenCLIP model loader, image/text embedders, zero-shot tagging
│   │   ├── indexer.py        # FAISS index manager (IndexFlatIP + IndexIDMap2)
│   │   ├── services.py       # Core orchestration (ingestion, vector search, deletion)
│   │   ├── schemas.py        # Pydantic schemas for requests and responses
│   │   └── main.py           # FastAPI application endpoints & lifespan hooks
│   ├── seed_demo_images.py   # Populates database and FAISS with diverse demo images
│   ├── requirements.txt      # Python dependencies
│   └── run.py                # Backend server runner (port 8000)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Header with navigation & live vector stats
│   │   │   ├── SearchBar.jsx         # Dual text/image query input & sample pills
│   │   │   ├── SearchResults.jsx     # Ranked result cards with similarity badges
│   │   │   ├── ImageGallery.jsx      # Image collection grid with tag filtering
│   │   │   ├── UploadModal.jsx       # Multi-file upload dropzone & progress
│   │   │   ├── ImageDetailModal.jsx  # High-res preview, metadata & tag editor
│   │   │   └── SearchHistory.jsx     # Query history & re-search button
│   │   ├── api.js                    # Fetch client for all backend endpoints
│   │   ├── App.jsx                   # Root application state & tab switcher
│   │   ├── index.css                 # Custom glassmorphic Tailwind styling
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## Getting Started

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment (Python 3.10+)
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies (CPU PyTorch by default)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# (Optional) Seed the database with sample demo images
python seed_demo_images.py

# Start FastAPI server
python run.py
```
Backend API will be running at `http://127.0.0.1:8000` (Interactive Swagger docs at `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup

```bash
cd frontend

# Install packages
pnpm install # or npm install

# Start Vite development server
pnpm run dev # or npm run dev
```
Frontend UI will be running at `http://localhost:5173`.
