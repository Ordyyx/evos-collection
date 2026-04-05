/**
 * WAX — Vinyl Collection Display
 * 
 * Edit collection.json to add your records.
 * 
 * Each album needs:
 *   artist  - Artist name
 *   album   - Album title
 *   year    - Release year
 *   cover   - Cover art URL (use Spotify/Apple Music for best quality)
 *   genre   - (optional) Music genre (e.g., "Pop", "R&B", "Alternative")
 *   rating  - (optional) Your rating 1-5 (0 = unrated)
 *   tracks  - (optional) Array of track objects with side and title:
 *       [
 *         { "side": "A", "title": "Track Name" },
 *         { "side": "B", "title": "Another Track" }
 *       ]
 *   links   - (optional) External links:
 *       appleMusic - Apple Music album URL
 *       discogs    - Discogs release URL
 *   vinyl   - (optional) Vinyl appearance:
 *       color      - Hex color code (e.g., "#e74c3c" for red)
 *       color2     - Second color for marble/splatter styles
 *       style      - One of: "classic", "translucent", "marble", "splatter", "picture"
 *       labelColor - Hex color for the center label (default: "#1a1a1a")
 *       labelText  - Custom text for label, or "auto" to use album name (default: "auto")
 * 
 * VINYL STYLES:
 *   classic     - Standard vinyl (default)
 *   translucent - See-through colored vinyl
 *   marble      - Swirled two-color effect
 *   splatter    - Random splatter pattern
 *   picture     - Picture disc (uses album cover)
 * 
 * To find high-quality cover art:
 * 1. Search the album on open.spotify.com or music.apple.com
 * 2. Right-click the cover → "Copy image address"
 */

(async function() {
  const grid = document.getElementById('grid');
  const countEl = document.getElementById('count');
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

  // Load collection
  let collection = [];
  
  try {
    const response = await fetch('collection.json');
    collection = await response.json();
  } catch (err) {
    console.error('Could not load collection.json:', err);
    grid.innerHTML = `
      <div class="empty-state">
        <h2>No records yet</h2>
        <p>Add your vinyl collection by editing the collection.json file in VS Code.</p>
        <code>collection.json</code>
      </div>
    `;
    return;
  }

  // Update count
  countEl.textContent = collection.length;

  // Empty state
  if (collection.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h2>Your shelf is empty</h2>
        <p>Add your first record by editing collection.json</p>
        <code>collection.json</code>
      </div>
    `;
    return;
  }

  // Generate vinyl disc HTML based on style
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
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  }

  // Generate star rating HTML
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

  // Generate links HTML
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

  // Generate tracklist HTML grouped by side
  function createTracklistHTML(tracks) {
    if (!tracks || tracks.length === 0) return '';
    
    // Group tracks by side
    const sides = {};
    tracks.forEach((track, index) => {
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

  // Render albums
  collection.forEach((record, index) => {
    const album = document.createElement('article');
    album.className = 'album';
    
    // Add rating badge if rated
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

  // Now Playing functions
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

})();
