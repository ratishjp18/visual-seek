const BASE_URL = '';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${BASE_URL}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function searchByText(query, topK = 20) {
  const formData = new FormData();
  formData.append('query', query);
  formData.append('top_k', topK.toString());

  const res = await fetch(`${BASE_URL}/api/search/text`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Search failed');
  }
  return res.json();
}

export async function searchByImage(file, topK = 20) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('top_k', topK.toString());

  const res = await fetch(`${BASE_URL}/api/search/image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Image search failed');
  }
  return res.json();
}

export async function uploadImages(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function fetchImages({ limit = 50, offset = 0, tag = null, search = null } = {}) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (tag) params.append('tag', tag);
  if (search) params.append('search', search);

  const res = await fetch(`${BASE_URL}/api/images?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch images');
  return res.json();
}

export async function deleteImage(imageId) {
  const res = await fetch(`${BASE_URL}/api/images/${imageId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete image');
  return res.json();
}

export async function updateImageTags(imageId, tags) {
  const res = await fetch(`${BASE_URL}/api/images/${imageId}/tags`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags }),
  });
  if (!res.ok) throw new Error('Failed to update tags');
  return res.json();
}

export async function fetchHistory(limit = 20) {
  const res = await fetch(`${BASE_URL}/api/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch search history');
  return res.json();
}

export async function clearHistory() {
  const res = await fetch(`${BASE_URL}/api/history`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear search history');
  return res.json();
}

export async function fetchTags() {
  const res = await fetch(`${BASE_URL}/api/tags`);
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}
