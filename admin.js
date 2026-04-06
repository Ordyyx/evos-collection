/**
 * Admin Dashboard — Vinyl Collection
 * Firebase-Powered CRUD Operations
 */

import {
  signInWithGoogle,
  logOut,
  onAuthChange,
  subscribeToVinyls,
  addVinyl,
  updateVinyl,
  deleteVinyl,
  importCollection
} from './js/firebase-config.js';

// ============================================
// DOM ELEMENTS
// ============================================

const authGate = document.getElementById('authGate');
const adminContainer = document.getElementById('adminContainer');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');

// Views
const listView = document.getElementById('listView');
const formView = document.getElementById('formView');
const importView = document.getElementById('importView');
const navItems = document.querySelectorAll('.nav-item');

// List View
const recordsGrid = document.getElementById('recordsGrid');
const searchInput = document.getElementById('searchInput');
const filterGenre = document.getElementById('filterGenre');
const sortBy = document.getElementById('sortBy');

// Form View
const vinylForm = document.getElementById('vinylForm');
const formTitle = document.getElementById('formTitle');
const vinylIdInput = document.getElementById('vinylId');
const cancelBtn = document.getElementById('cancelBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const submitBtn = document.getElementById('submitBtn');

// Form Fields
const artistInput = document.getElementById('artist');
const albumInput = document.getElementById('album');
const yearInput = document.getElementById('year');
const genreInput = document.getElementById('genre');
const ratingInput = document.getElementById('rating');
const coverInput = document.getElementById('cover');
const coverPreviewImg = document.getElementById('coverPreviewImg');
const coverPreview = document.getElementById('coverPreview');

// Vinyl Customization
const vinylStyleSelect = document.getElementById('vinylStyle');
const vinylColorInput = document.getElementById('vinylColor');
const vinylColorHex = document.getElementById('vinylColorHex');
const vinylColor2Input = document.getElementById('vinylColor2');
const vinylColor2Hex = document.getElementById('vinylColor2Hex');
const labelColorInput = document.getElementById('labelColor');
const labelColorHex = document.getElementById('labelColorHex');
const labelTextInput = document.getElementById('labelText');
const vinylPreview = document.getElementById('vinylPreview');

// Links
const appleMusicInput = document.getElementById('appleMusic');
const discogsInput = document.getElementById('discogs');

// Tracks
const tracksList = document.getElementById('tracksList');
const addTrackBtn = document.getElementById('addTrackBtn');

// Star Rating
const starRating = document.getElementById('starRating');
const starButtons = starRating.querySelectorAll('.star');
const clearRatingBtn = starRating.querySelector('.clear-rating');

// Import
const importJson = document.getElementById('importJson');
const validateJsonBtn = document.getElementById('validateJsonBtn');
const importJsonBtn = document.getElementById('importJsonBtn');
const importStatus = document.getElementById('importStatus');

// Delete Modal
const deleteModal = document.getElementById('deleteModal');
const deleteRecordName = document.getElementById('deleteRecordName');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Discogs Auto-fill
const discogsFetchBtn = document.getElementById('discogsFetchBtn');
const discogsModal = document.getElementById('discogsModal');
const discogsResults = document.getElementById('discogsResults');
const cancelDiscogsBtn = document.getElementById('cancelDiscogsBtn');
const labelInput = document.getElementById('label');

// Toast
const toastContainer = document.getElementById('toastContainer');

// ============================================
// STATE
// ============================================

let allRecords = [];
let currentUser = null;
let unsubscribe = null;
let currentTracks = [];
let deleteTargetId = null;

// Discogs API Configuration
// Replace with your personal Discogs token from https://www.discogs.com/settings/developers
const DISCOGS_TOKEN = 'YOUR_DISCOGS_TOKEN';

// ============================================
// AUTH HANDLERS
// ============================================

onAuthChange((user) => {
  currentUser = user;
  
  if (user) {
    // Show admin interface
    authGate.style.display = 'none';
    adminContainer.style.display = 'flex';
    
    // Update user info
    userAvatar.src = user.photoURL || '';
    userName.textContent = user.displayName || user.email;
    
    // Subscribe to data
    if (!unsubscribe) {
      unsubscribe = subscribeToVinyls((records) => {
        allRecords = records;
        updateGenreFilter();
        renderRecords();
      });
    }
  } else {
    // Show auth gate
    authGate.style.display = 'flex';
    adminContainer.style.display = 'none';
    
    // Cleanup subscription
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }
});

googleSignInBtn.addEventListener('click', async () => {
  googleSignInBtn.disabled = true;
  googleSignInBtn.innerHTML = `
    <svg class="spinner" viewBox="0 0 24 24" width="20" height="20">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="30 70"/>
    </svg>
    Signing in...
  `;
  
  const result = await signInWithGoogle();
  
  if (!result.success) {
    showToast('Sign in failed: ' + result.error, 'error');
    googleSignInBtn.disabled = false;
    googleSignInBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Sign in with Google
    `;
  }
});

signOutBtn.addEventListener('click', async () => {
  await logOut();
  showToast('Signed out successfully', 'success');
});

// ============================================
// NAVIGATION
// ============================================

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const view = item.dataset.view;
    switchView(view);
  });
});

function switchView(view) {
  // Update nav
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });
  
  // Show/hide views
  listView.style.display = view === 'list' ? 'block' : 'none';
  formView.style.display = view === 'add' || view === 'edit' ? 'block' : 'none';
  importView.style.display = view === 'import' ? 'block' : 'none';
  
  // Reset form when switching to add
  if (view === 'add') {
    resetForm();
    formTitle.textContent = 'Add New Record';
  }
}

cancelBtn.addEventListener('click', () => switchView('list'));
cancelFormBtn.addEventListener('click', () => switchView('list'));

// ============================================
// RECORDS LIST
// ============================================

function updateGenreFilter() {
  const genres = [...new Set(allRecords.map(r => r.genre).filter(Boolean))].sort();
  filterGenre.innerHTML = '<option value="">All Genres</option>' +
    genres.map(g => `<option value="${g}">${g}</option>`).join('');
}

function renderRecords() {
  let records = [...allRecords];
  
  // Search filter
  const search = searchInput.value.toLowerCase().trim();
  if (search) {
    records = records.filter(r => 
      r.artist.toLowerCase().includes(search) ||
      r.album.toLowerCase().includes(search)
    );
  }
  
  // Genre filter
  const genre = filterGenre.value;
  if (genre) {
    records = records.filter(r => r.genre === genre);
  }
  
  // Sort
  const sort = sortBy.value;
  records.sort((a, b) => {
    if (sort === 'artist') return (a.artist || '').localeCompare(b.artist || '');
    if (sort === 'album') return (a.album || '').localeCompare(b.album || '');
    if (sort === 'year') return (b.year || 0) - (a.year || 0);
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });
  
  if (records.length === 0) {
    recordsGrid.innerHTML = `
      <div class="empty-records">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
        <p>${search || genre ? 'No records match your filters' : 'No records yet. Add your first one!'}</p>
      </div>
    `;
    return;
  }
  
  recordsGrid.innerHTML = records.map(record => `
    <div class="record-card" data-id="${record.id}">
      <div class="record-cover">
        <img src="${record.cover}" alt="${record.album}" loading="lazy">
        <div class="record-overlay">
          <button class="edit-btn" data-id="${record.id}" title="Edit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="delete-btn" data-id="${record.id}" data-name="${record.album}" title="Delete">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="record-info">
        <h3 class="record-title">${record.album}</h3>
        <p class="record-artist">${record.artist}</p>
        <div class="record-meta">
          <span>${record.year}</span>
          ${record.genre ? `<span class="record-genre">${record.genre}</span>` : ''}
          ${record.rating ? `<span class="record-rating">${'★'.repeat(record.rating)}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  recordsGrid.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      editRecord(btn.dataset.id);
    });
  });
  
  recordsGrid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteModal(btn.dataset.id, btn.dataset.name);
    });
  });
}

// Filter/search listeners
searchInput.addEventListener('input', renderRecords);
filterGenre.addEventListener('change', renderRecords);
sortBy.addEventListener('change', renderRecords);

// ============================================
// FORM HANDLING
// ============================================

function resetForm() {
  vinylForm.reset();
  vinylIdInput.value = '';
  currentTracks = [];
  renderTracks();
  updateStarRating(0);
  updateCoverPreview('');
  updateVinylPreview();
  
  // Reset color inputs
  vinylColorInput.value = '#1a1a1a';
  vinylColorHex.value = '#1a1a1a';
  vinylColor2Input.value = '#0a0a0a';
  vinylColor2Hex.value = '#0a0a0a';
  labelColorInput.value = '#1a1a1a';
  labelColorHex.value = '#1a1a1a';
}

function editRecord(id) {
  const record = allRecords.find(r => r.id === id);
  if (!record) return;
  
  formTitle.textContent = 'Edit Record';
  switchView('edit');
  
  // Fill form
  vinylIdInput.value = record.id;
  artistInput.value = record.artist || '';
  albumInput.value = record.album || '';
  yearInput.value = record.year || '';
  genreInput.value = record.genre || '';
  coverInput.value = record.cover || '';
  updateCoverPreview(record.cover);
  updateStarRating(record.rating || 0);
  
  // Vinyl customization
  const vinyl = record.vinyl || {};
  vinylStyleSelect.value = vinyl.style || 'classic';
  vinylColorInput.value = vinyl.color || '#1a1a1a';
  vinylColorHex.value = vinyl.color || '#1a1a1a';
  vinylColor2Input.value = vinyl.color2 || '#0a0a0a';
  vinylColor2Hex.value = vinyl.color2 || '#0a0a0a';
  labelColorInput.value = vinyl.labelColor || '#1a1a1a';
  labelColorHex.value = vinyl.labelColor || '#1a1a1a';
  labelTextInput.value = vinyl.labelText || '';
  updateVinylPreview();
  
  // Links
  const links = record.links || {};
  appleMusicInput.value = links.appleMusic || '';
  discogsInput.value = links.discogs || '';
  
  // Tracks
  currentTracks = (record.tracks || []).map((t, i) => ({
    id: Date.now() + i,
    side: t.side || 'A',
    title: t.title || ''
  }));
  renderTracks();
}

// Form submission
vinylForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const isEdit = !!vinylIdInput.value;
  
  // Show loading
  submitBtn.querySelector('.btn-text').style.display = 'none';
  submitBtn.querySelector('.btn-loading').style.display = 'flex';
  submitBtn.disabled = true;
  
  // Build data object
  const vinylData = {
    artist: artistInput.value.trim(),
    album: albumInput.value.trim(),
    year: parseInt(yearInput.value, 10),
    genre: genreInput.value.trim() || null,
    rating: parseInt(ratingInput.value, 10) || 0,
    cover: coverInput.value.trim(),
    vinyl: {
      color: vinylColorInput.value,
      color2: vinylColor2Input.value,
      style: vinylStyleSelect.value,
      labelColor: labelColorInput.value,
      labelText: labelTextInput.value.trim() || 'auto'
    },
    links: {
      appleMusic: appleMusicInput.value.trim() || null,
      discogs: discogsInput.value.trim() || null
    },
    tracks: currentTracks.map(t => ({
      side: t.side,
      title: t.title
    })).filter(t => t.title.trim())
  };
  
  let result;
  if (isEdit) {
    result = await updateVinyl(vinylIdInput.value, vinylData);
  } else {
    result = await addVinyl(vinylData);
  }
  
  // Reset button
  submitBtn.querySelector('.btn-text').style.display = 'inline';
  submitBtn.querySelector('.btn-loading').style.display = 'none';
  submitBtn.disabled = false;
  
  if (result.success) {
    showToast(isEdit ? 'Record updated!' : 'Record added!', 'success');
    switchView('list');
    resetForm();
  } else {
    showToast('Error: ' + result.error, 'error');
  }
});

// ============================================
// STAR RATING
// ============================================

function updateStarRating(value) {
  ratingInput.value = value;
  starButtons.forEach((star, index) => {
    star.classList.toggle('active', index < value);
  });
}

starButtons.forEach(star => {
  star.addEventListener('click', () => {
    updateStarRating(parseInt(star.dataset.value, 10));
  });
  
  star.addEventListener('mouseenter', () => {
    const value = parseInt(star.dataset.value, 10);
    starButtons.forEach((s, i) => {
      s.classList.toggle('hover', i < value);
    });
  });
});

starRating.addEventListener('mouseleave', () => {
  starButtons.forEach(s => s.classList.remove('hover'));
});

clearRatingBtn.addEventListener('click', () => updateStarRating(0));

// ============================================
// COVER PREVIEW
// ============================================

function updateCoverPreview(url) {
  if (url) {
    coverPreviewImg.src = url;
    coverPreview.classList.add('has-image');
  } else {
    coverPreviewImg.src = '';
    coverPreview.classList.remove('has-image');
  }
}

coverInput.addEventListener('input', () => {
  updateCoverPreview(coverInput.value);
  updateVinylPreview();
});

coverPreviewImg.addEventListener('error', () => {
  coverPreview.classList.remove('has-image');
});

// ============================================
// VINYL PREVIEW
// ============================================

function updateVinylPreview() {
  const style = vinylStyleSelect.value;
  const color = vinylColorInput.value;
  const color2 = vinylColor2Input.value;
  const labelColor = labelColorInput.value;
  const labelText = labelTextInput.value || albumInput.value || 'VINYL';
  const coverUrl = coverInput.value;
  
  let extraLayers = '';
  if (style === 'marble') {
    extraLayers = `<div class="marble-swirl"></div>`;
  } else if (style === 'splatter') {
    extraLayers = `<div class="splatter-layer"></div>`;
  } else if (style === 'picture') {
    extraLayers = `<div class="picture-layer" style="background-image: url('${coverUrl}')"></div>`;
  }
  
  const labelTextColor = isLightColor(labelColor) ? '#1a1a1a' : '#ffffff';
  
  vinylPreview.innerHTML = `
    <div class="vinyl-disc vinyl-${style}" 
         style="--vinyl-color: ${color}; --vinyl-color2: ${color2};">
      ${extraLayers}
      <div class="vinyl-label" style="--label-color: ${labelColor}; --label-text: ${labelTextColor};">
        <span class="vinyl-label-text">${labelText}</span>
      </div>
      <div class="vinyl-reflection"></div>
    </div>
  `;
}

function isLightColor(hex) {
  if (!hex) return false;
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

// Color input sync
function syncColorInputs(colorInput, hexInput) {
  colorInput.addEventListener('input', () => {
    hexInput.value = colorInput.value;
    updateVinylPreview();
  });
  
  hexInput.addEventListener('input', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
      colorInput.value = hexInput.value;
      updateVinylPreview();
    }
  });
  
  hexInput.addEventListener('blur', () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
      hexInput.value = colorInput.value;
    }
  });
}

syncColorInputs(vinylColorInput, vinylColorHex);
syncColorInputs(vinylColor2Input, vinylColor2Hex);
syncColorInputs(labelColorInput, labelColorHex);

vinylStyleSelect.addEventListener('change', updateVinylPreview);
labelTextInput.addEventListener('input', updateVinylPreview);
albumInput.addEventListener('input', updateVinylPreview);

// Initial preview
updateVinylPreview();

// ============================================
// TRACKS EDITOR
// ============================================

function renderTracks() {
  if (currentTracks.length === 0) {
    tracksList.innerHTML = `
      <div class="no-tracks">
        <p>No tracks added yet</p>
      </div>
    `;
    return;
  }
  
  tracksList.innerHTML = currentTracks.map((track, index) => `
    <div class="track-item" data-id="${track.id}" draggable="true">
      <div class="track-drag-handle">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
        </svg>
      </div>
      <select class="track-side" data-index="${index}">
        <option value="A" ${track.side === 'A' ? 'selected' : ''}>A</option>
        <option value="B" ${track.side === 'B' ? 'selected' : ''}>B</option>
        <option value="C" ${track.side === 'C' ? 'selected' : ''}>C</option>
        <option value="D" ${track.side === 'D' ? 'selected' : ''}>D</option>
      </select>
      <input type="text" class="track-title" data-index="${index}" 
             value="${track.title}" placeholder="Track title">
      <button type="button" class="remove-track-btn" data-index="${index}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `).join('');
  
  // Event listeners
  tracksList.querySelectorAll('.track-side').forEach(select => {
    select.addEventListener('change', () => {
      const index = parseInt(select.dataset.index, 10);
      currentTracks[index].side = select.value;
    });
  });
  
  tracksList.querySelectorAll('.track-title').forEach(input => {
    input.addEventListener('input', () => {
      const index = parseInt(input.dataset.index, 10);
      currentTracks[index].title = input.value;
    });
  });
  
  tracksList.querySelectorAll('.remove-track-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index, 10);
      currentTracks.splice(index, 1);
      renderTracks();
    });
  });
  
  // Drag and drop
  initDragAndDrop();
}

addTrackBtn.addEventListener('click', () => {
  // Determine the next side based on last track
  let nextSide = 'A';
  if (currentTracks.length > 0) {
    const lastSide = currentTracks[currentTracks.length - 1].side;
    nextSide = lastSide;
  }
  
  currentTracks.push({
    id: Date.now(),
    side: nextSide,
    title: ''
  });
  renderTracks();
  
  // Focus new input
  const inputs = tracksList.querySelectorAll('.track-title');
  if (inputs.length > 0) {
    inputs[inputs.length - 1].focus();
  }
});

// Drag and drop for tracks
function initDragAndDrop() {
  const items = tracksList.querySelectorAll('.track-item');
  let draggedItem = null;
  
  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggedItem = null;
      
      // Update currentTracks order
      const newOrder = [];
      tracksList.querySelectorAll('.track-item').forEach(el => {
        const id = parseInt(el.dataset.id, 10);
        const track = currentTracks.find(t => t.id === id);
        if (track) newOrder.push(track);
      });
      currentTracks = newOrder;
    });
    
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!draggedItem || draggedItem === item) return;
      
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      
      if (e.clientY < midY) {
        item.parentNode.insertBefore(draggedItem, item);
      } else {
        item.parentNode.insertBefore(draggedItem, item.nextSibling);
      }
    });
  });
}

// ============================================
// DELETE MODAL
// ============================================

function showDeleteModal(id, name) {
  deleteTargetId = id;
  deleteRecordName.textContent = name;
  deleteModal.classList.add('active');
}

function hideDeleteModal() {
  deleteModal.classList.remove('active');
  deleteTargetId = null;
}

cancelDeleteBtn.addEventListener('click', hideDeleteModal);

deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) hideDeleteModal();
});

confirmDeleteBtn.addEventListener('click', async () => {
  if (!deleteTargetId) return;
  
  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Deleting...';
  
  const result = await deleteVinyl(deleteTargetId);
  
  confirmDeleteBtn.disabled = false;
  confirmDeleteBtn.textContent = 'Delete';
  
  if (result.success) {
    showToast('Record deleted', 'success');
    hideDeleteModal();
  } else {
    showToast('Error: ' + result.error, 'error');
  }
});

// ============================================
// IMPORT
// ============================================

validateJsonBtn.addEventListener('click', () => {
  try {
    const data = JSON.parse(importJson.value);
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of records');
    }
    
    // Validate each record has required fields
    const errors = [];
    data.forEach((record, i) => {
      if (!record.artist) errors.push(`Record ${i + 1}: missing artist`);
      if (!record.album) errors.push(`Record ${i + 1}: missing album`);
      if (!record.year) errors.push(`Record ${i + 1}: missing year`);
      if (!record.cover) errors.push(`Record ${i + 1}: missing cover`);
    });
    
    if (errors.length > 0) {
      importStatus.innerHTML = `<div class="import-error">
        <strong>Validation failed:</strong>
        <ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>
      </div>`;
      importJsonBtn.disabled = true;
    } else {
      importStatus.innerHTML = `<div class="import-success">
        ✓ Valid JSON with ${data.length} records ready to import
      </div>`;
      importJsonBtn.disabled = false;
    }
  } catch (error) {
    importStatus.innerHTML = `<div class="import-error">
      <strong>Invalid JSON:</strong> ${error.message}
    </div>`;
    importJsonBtn.disabled = true;
  }
});

importJsonBtn.addEventListener('click', async () => {
  try {
    const data = JSON.parse(importJson.value);
    
    importJsonBtn.querySelector('.btn-text').style.display = 'none';
    importJsonBtn.querySelector('.btn-loading').style.display = 'flex';
    importJsonBtn.disabled = true;
    
    const results = await importCollection(data);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    importJsonBtn.querySelector('.btn-text').style.display = 'inline';
    importJsonBtn.querySelector('.btn-loading').style.display = 'none';
    
    if (failed === 0) {
      showToast(`Successfully imported ${successful} records!`, 'success');
      importJson.value = '';
      importStatus.innerHTML = '';
      importJsonBtn.disabled = true;
      switchView('list');
    } else {
      showToast(`Imported ${successful} records, ${failed} failed`, 'warning');
    }
  } catch (error) {
    showToast('Import failed: ' + error.message, 'error');
    importJsonBtn.querySelector('.btn-text').style.display = 'inline';
    importJsonBtn.querySelector('.btn-loading').style.display = 'none';
  }
});

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">×</button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // Auto remove
  const timeout = setTimeout(() => removeToast(toast), 5000);
  
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timeout);
    removeToast(toast);
  });
}

function removeToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => toast.remove(), 300);
}

// ============================================
// DISCOGS API INTEGRATION
// ============================================

/**
 * Search Discogs API for album information
 * @param {string} artist - Artist name
 * @param {string} album - Album title
 * @returns {Promise<Array>} - Array of matching releases
 */
async function searchDiscogs(artist, album) {
  if (DISCOGS_TOKEN === 'YOUR_DISCOGS_TOKEN') {
    throw new Error('Please set your Discogs API token in admin.js');
  }
  
  const query = encodeURIComponent(`${artist} ${album}`);
  const url = `https://api.discogs.com/database/search?q=${query}&type=release&per_page=10`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
      'User-Agent': 'VinylCollectionApp/1.0'
    }
  });
  
  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
  }
  
  if (!response.ok) {
    throw new Error(`Discogs API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

/**
 * Fetch detailed release information from Discogs
 * @param {number} releaseId - Discogs release ID
 * @returns {Promise<Object>} - Release details
 */
async function fetchReleaseDetails(releaseId) {
  const url = `https://api.discogs.com/releases/${releaseId}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
      'User-Agent': 'VinylCollectionApp/1.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch release details: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Handle Discogs fetch button click
 */
discogsFetchBtn.addEventListener('click', async () => {
  const artist = artistInput.value.trim();
  const album = albumInput.value.trim();
  
  if (!artist || !album) {
    showToast('Please enter both artist and album title first', 'error');
    return;
  }
  
  // Show loading state
  discogsFetchBtn.disabled = true;
  discogsFetchBtn.querySelector('.btn-text').style.display = 'none';
  discogsFetchBtn.querySelector('.btn-loading').style.display = 'flex';
  
  try {
    const results = await searchDiscogs(artist, album);
    
    if (results.length === 0) {
      showToast('No results found on Discogs', 'error');
      return;
    }
    
    if (results.length === 1) {
      // Only one result, auto-fill directly
      await applyDiscogsResult(results[0]);
    } else {
      // Multiple results, show selection modal
      showDiscogsResultsModal(results);
    }
  } catch (error) {
    console.error('Discogs fetch error:', error);
    showToast(error.message || 'Failed to fetch from Discogs', 'error');
  } finally {
    // Reset button state
    discogsFetchBtn.disabled = false;
    discogsFetchBtn.querySelector('.btn-text').style.display = 'flex';
    discogsFetchBtn.querySelector('.btn-loading').style.display = 'none';
  }
});

/**
 * Show modal with multiple Discogs results for selection
 * @param {Array} results - Array of Discogs search results
 */
function showDiscogsResultsModal(results) {
  discogsResults.innerHTML = results.map(result => `
    <div class="discogs-result-item" data-id="${result.id}">
      <div class="discogs-result-cover">
        <img src="${result.cover_image || result.thumb || ''}" 
             alt="${result.title}" 
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>♫</text></svg>'">
      </div>
      <div class="discogs-result-info">
        <div class="discogs-result-title">${result.title}</div>
        <div class="discogs-result-artist">${result.title.split(' - ')[0] || 'Unknown Artist'}</div>
        <div class="discogs-result-meta">
          ${result.year ? `<span>📅 ${result.year}</span>` : ''}
          ${result.genre ? `<span>🎵 ${result.genre[0]}</span>` : ''}
          ${result.label ? `<span>🏷️ ${result.label[0]}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
  
  // Add click handlers for result items
  discogsResults.querySelectorAll('.discogs-result-item').forEach(item => {
    item.addEventListener('click', async () => {
      const resultId = item.dataset.id;
      const result = results.find(r => r.id.toString() === resultId);
      if (result) {
        hideDiscogsModal();
        await applyDiscogsResult(result);
      }
    });
  });
  
  discogsModal.classList.add('active');
}

/**
 * Hide the Discogs results modal
 */
function hideDiscogsModal() {
  discogsModal.classList.remove('active');
}

cancelDiscogsBtn.addEventListener('click', hideDiscogsModal);

discogsModal.addEventListener('click', (e) => {
  if (e.target === discogsModal) {
    hideDiscogsModal();
  }
});

/**
 * Apply selected Discogs result to the form
 * @param {Object} result - Discogs search result
 */
async function applyDiscogsResult(result) {
  try {
    // Fetch detailed release info for tracklist
    const details = await fetchReleaseDetails(result.id);
    
    // Fill in year
    if (details.year || result.year) {
      yearInput.value = details.year || result.year;
    }
    
    // Fill in genre
    if (details.genres && details.genres.length > 0) {
      genreInput.value = details.genres[0];
    } else if (result.genre && result.genre.length > 0) {
      genreInput.value = result.genre[0];
    }
    
    // Fill in label
    if (details.labels && details.labels.length > 0) {
      labelInput.value = details.labels[0].name;
    } else if (result.label && result.label.length > 0) {
      labelInput.value = result.label[0];
    }
    
    // Fill in cover art
    if (details.images && details.images.length > 0) {
      const coverUrl = details.images[0].uri || details.images[0].resource_url;
      if (coverUrl) {
        coverInput.value = coverUrl;
        coverPreviewImg.src = coverUrl;
        coverPreview.style.display = 'block';
      }
    } else if (result.cover_image) {
      coverInput.value = result.cover_image;
      coverPreviewImg.src = result.cover_image;
      coverPreview.style.display = 'block';
    }
    
    // Fill in tracklist
    if (details.tracklist && details.tracklist.length > 0) {
      currentTracks = details.tracklist
        .filter(track => track.type_ === 'track')
        .map(track => ({
          title: track.title,
          duration: track.duration || ''
        }));
      renderTracks();
    }
    
    // Fill in Discogs link
    if (details.uri) {
      discogsInput.value = details.uri;
    }
    
    showToast('Album details filled from Discogs!', 'success');
    
  } catch (error) {
    console.error('Error applying Discogs result:', error);
    
    // Fall back to basic info from search result
    if (result.year) yearInput.value = result.year;
    if (result.genre && result.genre[0]) genreInput.value = result.genre[0];
    if (result.label && result.label[0]) labelInput.value = result.label[0];
    if (result.cover_image) {
      coverInput.value = result.cover_image;
      coverPreviewImg.src = result.cover_image;
      coverPreview.style.display = 'block';
    }
    
    showToast('Filled basic info (detailed fetch failed)', 'info');
  }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
  // Escape to close modals/forms
  if (e.key === 'Escape') {
    if (discogsModal.classList.contains('active')) {
      hideDiscogsModal();
    } else if (deleteModal.classList.contains('active')) {
      hideDeleteModal();
    } else if (formView.style.display !== 'none') {
      switchView('list');
    }
  }
  
  // Ctrl/Cmd + N for new record
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    switchView('add');
  }
});
