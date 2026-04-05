/**
 * WAX — Vinyl Collection Display
 * 
 * Edit collection.json to add your records.
 * 
 * Each album needs:
 *   artist  - Artist name
 *   album   - Album title
 *   year    - Release year
 *   cover   - Cover art URL (use Spotify for best quality)
 *   vinyl   - (optional) Vinyl appearance:
 *       color   - Hex color code (e.g., "#e74c3c" for red)
 *       color2  - Second color for marble/splatter styles
 *       style   - One of: "classic", "translucent", "marble", "splatter", "picture"
 * 
 * VINYL STYLES:
 *   classic     - Standard black vinyl (default)
 *   translucent - See-through colored vinyl
 *   marble      - Swirled two-color effect
 *   splatter    - Random splatter pattern
 *   picture     - Picture disc (uses album cover)
 * 
 * To find high-quality cover art:
 * 1. Search the album on open.spotify.com
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
    
    let extraLayers = '';
    let extraClasses = `vinyl-${style}`;
    
    // Add extra elements for certain styles
    if (style === 'marble') {
      extraLayers = `<div class="marble-swirl"></div>`;
    } else if (style === 'splatter') {
      extraLayers = `<div class="splatter-layer"></div>`;
    } else if (style === 'picture') {
      extraLayers = `<div class="picture-layer" style="background-image: url('${record.cover}')"></div>`;
    }
    
    // Add glow for colored vinyl
    const showGlow = style !== 'classic' && color !== '#1a1a1a' && color !== '#000000';
    const glowLayer = showGlow ? `<div class="vinyl-glow"></div>` : '';
    
    return `
      <div class="vinyl-disc ${extraClasses}" 
           style="--vinyl-color: ${color}; --vinyl-color2: ${color2};">
        ${extraLayers}
      </div>
      ${glowLayer}
    `;
  }

  // Render albums
  collection.forEach((record, index) => {
    const album = document.createElement('article');
    album.className = 'album';
    album.innerHTML = `
      <div class="album-inner">
        ${createVinylDisc(record)}
        <div class="album-cover">
          <img src="${record.cover}" alt="${record.album} by ${record.artist}" loading="lazy">
        </div>
        <span class="album-year">${record.year}</span>
        <div class="album-info">
          <h2 class="album-title">${record.album}</h2>
          <p class="album-artist">${record.artist}</p>
        </div>
      </div>
    `;
    
    // Click to open now playing
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
    nowPlayingOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeNowPlaying() {
    nowPlayingOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Close on click
  nowPlayingOverlay.addEventListener('click', closeNowPlaying);

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
