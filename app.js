/**
 * WAX — Vinyl Collection Display
 * Firebase-Powered Edition with Enhanced Features
 * 
 * Features:
 * - Cache-busting for fresh data
 * - Grid/Shelf view toggle with localStorage persistence
 * - Improved mobile UX
 */

import { subscribeToVinyls, onAuthChange } from './js/firebase-config.js';

(function() {
  // ============================================
  // DOM ELEMENTS
  // ============================================
  const grid = document.getElementById('grid');
  const countEl = document.getElementById('count');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const adminLink = document.getElementById('adminLink');
  const nowPlayingOverlay = document.getElementById('nowPlaying');
  const npCover = document.getElementById('npCover');
  const npTitle = document.getElementById('npTitle');
  const npArtist = document.getElementById('npArtist');
  const npYear = document.getElementById('npYear');
  const npGenre = document.getElementById('npGenre');
  const npGenreSeparator = document.getElementById('npGenreSeparator');
  const npRating = document.getElementById('npRating');
  const npLinks = document.getElementById('npLinks');
  const npTracklist = document.getElementById('npTracklist');
  const viewToggle = document.getElementById('viewToggle');
  const viewButtons = viewToggle.querySelectorAll('.view-btn');

  // ============================================
  // STATE
  // ============================================
  let collection = [];
  let unsubscribe = null;
  let currentView = localStorage.getItem('vinylViewMode') || 'grid';

  // ============================================
  // INITIALIZATION
  // ============================================
  
  // Initialize view mode from localStorage
  initializeViewMode();

  // Show/hide admin link based on auth
  onAuthChange((user) => {
    if (user) {
      adminLink.style.display = 'flex';
    } else {
      adminLink.style.display = 'none';
    }
  });

  // ============================================
  // VIEW TOGGLE FUNCTIONALITY
  // ============================================
  
  function initializeViewMode() {
    // Set initial active state
    viewButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === currentView);
    });
    
    // Apply view class to grid
    grid.classList.toggle('shelf-view', currentView === 'shelf');
  }

  // View toggle event listeners
  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const newView = btn.dataset.view;
      if (newView === currentView) return;
      
      // Update state
      currentView = newView;
      localStorage.setItem('vinylViewMode', newView);
      
      // Update button states
      viewButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.view === newView);
      });
      
      // Animate view change
      grid.style.opacity = '0';
      grid.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        grid.classList.toggle('shelf-view', newView === 'shelf');
        
        // Re-render collection for the new view
        renderCollection(collection);
        
        // Animate in
        requestAnimationFrame(() => {
          grid.style.opacity = '1';
          grid.style.transform = 'translateY(0)';
        });
      }, 200);
    });
  });

  // ============================================
  // VINYL DISC GENERATION
  // ============================================
  
  function createVinylDisc(record) {
    const vinyl = record.vinyl || {};
    const color = vinyl.color || '#1a1a1a';
    const color2 = vinyl.color2 || '#0a0a0a';
    const style = vinyl.style || 'classic';
    const labelColor = vinyl.labelColor || '#1a1a1a';
    const labelText = vinyl.labelText || 'auto';
    
    let extraLayers = '';
    let extraClasses = `vinyl-${style}`;
    
    if (style === 'marble') {
      extraLayers = `<div class="marble-swirl"></div>`;
    } else if (style === 'splatter') {
      extraLayers = `<div class="splatter-layer"></div>`;
    } else if (style === 'picture') {
      extraLayers = `<div class="picture-layer" style="background-image: url('${record.cover}')"></div>`;
    }
    
    const isColored = color !== '#1a1a1a' && color !== '#000000' && color !== '#0a0a0a';
    const glowLayer = isColored ? `<div class="vinyl-glow" style="--vinyl-color: ${color};"></div>` : '';
    const labelTextColor = isLightColor(labelColor) ? '#1a1a1a' : '#ffffff';
    const displayLabelText = labelText === 'auto' ? record.album : labelText;
    
    return `
      <div class="vinyl-disc ${extraClasses}" 
           style="--vinyl-color: ${color}; --vinyl-color2: ${color2};">
        ${extraLayers}
        <div class="vinyl-label" style="--label-color: ${labelColor}; --label-text: ${labelTextColor};">
          <span class="vinyl-label-text">${displayLabelText}</span>
        </div>
        <div class="vinyl-reflection"></div>
      </div>
      ${glowLayer}
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

  // ============================================
  // RATING & LINKS GENERATION
  // ============================================
  
  function createRatingStars(rating) {
    if (!rating || rating === 0) return '';
    
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<span class="star filled">★</span>';
      } else {
        stars += '<span class="star">☆</span>';
      }
    }
    return stars;
  }

  function createLinksHTML(links) {
    if (!links) return '';
    
    let html = '';
    
    if (links.appleMusic) {
      html += `<a href="${links.appleMusic}" target="_blank" rel="noopener" class="link-button link-apple" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        Apple Music
      </a>`;
    }
    
    if (links.discogs) {
      html += `<a href="${links.discogs}" target="_blank" rel="noopener" class="link-button link-discogs" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 21.6c-5.296 0-9.6-4.304-9.6-9.6S6.704 2.4 12 2.4s9.6 4.304 9.6 9.6-4.304 9.6-9.6 9.6zm0-16.8c-3.976 0-7.2 3.224-7.2 7.2s3.224 7.2 7.2 7.2 7.2-3.224 7.2-7.2-3.224-7.2-7.2-7.2zm0 12c-2.648 0-4.8-2.152-4.8-4.8s2.152-4.8 4.8-4.8 4.8 2.152 4.8 4.8-2.152 4.8-4.8 4.8zm0-7.2c-1.324 0-2.4 1.076-2.4 2.4s1.076 2.4 2.4 2.4 2.4-1.076 2.4-2.4-1.076-2.4-2.4-2.4z"/></svg>
        Discogs
      </a>`;
    }
    
    return html;
  }

  // ============================================
  // TRACKLIST GENERATION
  // ============================================
  
  function createTracklistHTML(tracks) {
    if (!tracks || tracks.length === 0) return '';
    
    // Group tracks by side
    const sides = {};
    tracks.forEach((track) => {
      const side = track.side || 'A';
      if (!sides[side]) {
        sides[side] = [];
      }
      sides[side].push(track.title);
    });
    
    // Generate HTML for each side
    let html = '<div class="tracklist-container">';
    
    Object.keys(sides).sort().forEach(side => {
      html += `
        <div class="tracklist-side">
          <h3 class="side-label">Side ${side}</h3>
          <ol class="track-list">
            ${sides[side].map(title => `<li>${title}</li>`).join('')}
          </ol>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  // ============================================
  // RENDER COLLECTION
  // ============================================
  
  function renderCollection(vinyls) {
    collection = vinyls;
    countEl.textContent = collection.length;
    
    // Hide loading
    loadingOverlay.classList.add('hidden');

    // Empty state
    if (collection.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h2>Your shelf is empty</h2>
          <p>Add your first record using the admin dashboard</p>
          <a href="admin.html" class="empty-state-link">Open Admin Dashboard</a>
        </div>
      `;
      return;
    }

    // Render based on current view mode
    if (currentView === 'shelf') {
      renderShelfView();
    } else {
      renderGridView();
    }
  }

  // Grid View Rendering
  function renderGridView() {
    grid.innerHTML = '';
    
    collection.forEach((record, index) => {
      const album = document.createElement('article');
      album.className = 'album';
      album.style.animationDelay = `${Math.min(index * 0.05, 0.6)}s`;
      
      const ratingBadge = record.rating && record.rating > 0 
        ? `<span class="album-rating">${'★'.repeat(record.rating)}</span>` 
        : '';
      
      album.innerHTML = `
        <div class="album-inner">
          ${createVinylDisc(record)}
          <div class="album-cover">
            <img src="${record.cover}" alt="${record.album} by ${record.artist}" loading="lazy">
          </div>
          <span class="album-year">${record.year}</span>
          ${ratingBadge}
          <div class="album-info">
            <h2 class="album-title">${record.album}</h2>
            <p class="album-artist">${record.artist}</p>
          </div>
        </div>
      `;
      
      album.addEventListener('click', () => openNowPlaying(record));
      
      grid.appendChild(album);
    });
  }

  // Shelf View Rendering
  function renderShelfView() {
    grid.innerHTML = '';
    
    // Create shelf container
    const shelfContainer = document.createElement('div');
    shelfContainer.className = 'shelf-container';
    
    // Calculate items per shelf based on viewport
    const itemsPerShelf = getItemsPerShelf();
    
    // Group records into shelves
    for (let i = 0; i < collection.length; i += itemsPerShelf) {
      const shelfRecords = collection.slice(i, i + itemsPerShelf);
      const shelf = createShelf(shelfRecords, i);
      shelfContainer.appendChild(shelf);
    }
    
    grid.appendChild(shelfContainer);
  }

  function getItemsPerShelf() {
    const width = window.innerWidth;
    if (width < 500) return 4;
    if (width < 768) return 6;
    if (width < 1024) return 8;
    if (width < 1400) return 10;
    return 12;
  }

  function createShelf(records, startIndex) {
    const shelf = document.createElement('div');
    shelf.className = 'vinyl-shelf';
    
    const shelfContent = document.createElement('div');
    shelfContent.className = 'shelf-records';
    
    records.forEach((record, index) => {
      const item = document.createElement('div');
      item.className = 'shelf-record';
      item.style.animationDelay = `${Math.min((startIndex + index) * 0.03, 0.6)}s`;
      
      // Calculate slight random tilt for realism
      const tilt = (Math.random() - 0.5) * 4;
      item.style.setProperty('--tilt', `${tilt}deg`);
      
      item.innerHTML = `
        <div class="shelf-record-inner">
          <img src="${record.cover}" alt="${record.album} by ${record.artist}" loading="lazy">
          <div class="shelf-record-spine">
            <span class="spine-artist">${record.artist}</span>
            <span class="spine-title">${record.album}</span>
          </div>
        </div>
      `;
      
      item.addEventListener('click', () => openNowPlaying(record));
      
      // Touch feedback for mobile
      item.addEventListener('touchstart', () => {
        item.classList.add('touching');
      }, { passive: true });
      
      item.addEventListener('touchend', () => {
        item.classList.remove('touching');
      }, { passive: true });
      
      shelfContent.appendChild(item);
    });
    
    shelf.appendChild(shelfContent);
    
    // Add shelf base
    const shelfBase = document.createElement('div');
    shelfBase.className = 'shelf-base';
    shelf.appendChild(shelfBase);
    
    return shelf;
  }

  // Handle window resize for shelf view
  let resizeTimeout;
  window.addEventListener('resize', () => {
    if (currentView !== 'shelf') return;
    
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      renderShelfView();
    }, 250);
  });

  // ============================================
  // NOW PLAYING MODAL
  // ============================================
  
  function openNowPlaying(record) {
    npCover.src = record.cover;
    npCover.alt = `${record.album} by ${record.artist}`;
    npTitle.textContent = record.album;
    npArtist.textContent = record.artist;
    npYear.textContent = record.year;
    
    // Genre
    if (record.genre) {
      npGenre.textContent = record.genre;
      npGenre.style.display = 'inline';
      npGenreSeparator.style.display = 'inline';
    } else {
      npGenre.style.display = 'none';
      npGenreSeparator.style.display = 'none';
    }
    
    // Rating
    npRating.innerHTML = createRatingStars(record.rating);
    
    // Links
    npLinks.innerHTML = createLinksHTML(record.links);
    
    // Tracklist
    npTracklist.innerHTML = createTracklistHTML(record.tracks);
    
    nowPlayingOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeNowPlaying() {
    nowPlayingOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Close on overlay click (not on content)
  nowPlayingOverlay.addEventListener('click', (e) => {
    if (e.target === nowPlayingOverlay) {
      closeNowPlaying();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNowPlaying();
    }
  });

  // Arrow key navigation in now playing mode
  document.addEventListener('keydown', (e) => {
    if (!nowPlayingOverlay.classList.contains('active')) return;
    
    const currentAlbum = npTitle.textContent;
    const currentIndex = collection.findIndex(r => r.album === currentAlbum);
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const nextIndex = (currentIndex + 1) % collection.length;
      openNowPlaying(collection[nextIndex]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const prevIndex = (currentIndex - 1 + collection.length) % collection.length;
      openNowPlaying(collection[prevIndex]);
    }
  });

  // ============================================
  // SWIPE NAVIGATION FOR MOBILE
  // ============================================
  
  let touchStartX = 0;
  let touchEndX = 0;
  
  nowPlayingOverlay.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  nowPlayingOverlay.addEventListener('touchend', (e) => {
    if (!nowPlayingOverlay.classList.contains('active')) return;
    
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) < swipeThreshold) return;
    
    const currentAlbum = npTitle.textContent;
    const currentIndex = collection.findIndex(r => r.album === currentAlbum);
    
    if (diff > 0) {
      // Swipe left - next
      const nextIndex = (currentIndex + 1) % collection.length;
      openNowPlaying(collection[nextIndex]);
    } else {
      // Swipe right - previous
      const prevIndex = (currentIndex - 1 + collection.length) % collection.length;
      openNowPlaying(collection[prevIndex]);
    }
  }

  // ============================================
  // FIREBASE SUBSCRIPTION
  // ============================================
  
  try {
    unsubscribe = subscribeToVinyls((vinyls) => {
      renderCollection(vinyls);
    });
  } catch (error) {
    console.error('Error connecting to Firestore:', error);
    loadingOverlay.innerHTML = `
      <div class="loading-spinner error">
        <p>Error loading collection</p>
        <p class="error-message">${error.message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (unsubscribe) unsubscribe();
  });

})();
