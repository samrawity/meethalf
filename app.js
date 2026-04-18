'use strict';

// ─────────────────────────────────────────────────────────────
//  CONFIGURATION
//  Add or modify categories here — the rest of the app adapts.
//  osmKey: the OSM tag key  ("amenity", "leisure", "tourism"…)
//  query:  pipe-separated OSM tag values to match
// ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'food',    label: 'Food',    icon: '🍽', query: 'restaurant|fast_food|bakery',  osmKey: 'amenity' },
  { id: 'cafe',    label: 'Café',    icon: '☕', query: 'cafe',                          osmKey: 'amenity' },
  { id: 'drink',   label: 'Drink',   icon: '🍺', query: 'bar|pub|biergarten',           osmKey: 'amenity' },
  { id: 'gym',     label: 'Gym',     icon: '🏋', query: 'fitness_centre|sports_centre', osmKey: 'leisure' },
  { id: 'park',    label: 'Park',    icon: '🌿', query: 'park',                         osmKey: 'leisure' },
  { id: 'culture', label: 'Culture', icon: '🎭', query: 'theatre|cinema|museum',        osmKey: 'amenity' },
  // ↓ Add more categories below — just copy the pattern above.
  // { id: 'hotel', label: 'Hotel', icon: '🏨', query: 'hotel|hostel', osmKey: 'tourism' },
];

// Overpass search radius in metres around the midpoint
const SEARCH_RADIUS = 1500;

// Max places to display from Overpass results
const MAX_PLACES = 10;

// Sync interval (ms) — lower = more responsive, higher = fewer API calls
const SYNC_INTERVAL = 3000;

// ─────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────
let sessionId     = null;
let myUserId      = null;
let myName        = '';
let myCoords      = null;   // { lat, lng, label }
let pendingCoords = null;   // staged coords before user confirms
let map           = null;
let userMarkers   = {};
let midpointMarker = null;
let placeMarkers  = [];
let activeFilters = new Set(['food']);
let pollInterval  = null;
let addrDebounce  = null;
let sessionData   = null;   // latest snapshot from storage
let lastVotedPlace = null;  // placeId the current user voted for
let heartbeatInterval = null;
let sessionUnsub  = null;
let mapFitted     = false;

// ─────────────────────────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────────────────────────
function sessionPath(...parts) {
  return ['sessions', sessionId, ...parts].join('/');
}
async function fbSet(path, value) { await db.ref(path).set(value); }
async function fbRemove(path)     { await db.ref(path).remove(); }

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function genCode()   { return Math.random().toString(36).substring(2, 8).toUpperCase(); }
function genUserId() { return 'u_' + Math.random().toString(36).substring(2, 10); }

function showToast(msg, dur = 2500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

// Haversine distance in metres between two lat/lng points
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Spherical midpoint from array of { lat, lng } objects
function calcMidpoint(coords) {
  let x = 0, y = 0, z = 0;
  coords.forEach(c => {
    const lat = c.lat * Math.PI / 180;
    const lng = c.lng * Math.PI / 180;
    x += Math.cos(lat) * Math.cos(lng);
    y += Math.cos(lat) * Math.sin(lng);
    z += Math.sin(lat);
  });
  x /= coords.length; y /= coords.length; z /= coords.length;
  const lng = Math.atan2(y, x) * 180 / Math.PI;
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
  return { lat, lng };
}

// ─────────────────────────────────────────────────────────────
//  MAP INIT
// ─────────────────────────────────────────────────────────────
function initMap(center = [48.8566, 2.3522]) {
  if (map) return;
  map = L.map('map', { zoomControl: true }).setView(center, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);
}

// ─────────────────────────────────────────────────────────────
//  SESSION LIFECYCLE
// ─────────────────────────────────────────────────────────────
function createSession() {
  const name = document.getElementById('user-name-input').value.trim() || 'Anonymous';
  myName    = name;
  localStorage.setItem('meethalf_name', name);
  myUserId  = genUserId();
  sessionId = genCode();
  history.pushState({ sessionId }, '', '?s=' + sessionId);
  initSessionScreen();
}

function joinSession() {
  const code = document.getElementById('join-code-input').value.trim().toUpperCase();
  const name = document.getElementById('user-name-input').value.trim() || 'Anonymous';
  if (!code || code.length < 4) { showToast('Enter a valid session code'); return; }
  myName    = name;
  localStorage.setItem('meethalf_name', name);
  myUserId  = genUserId();
  sessionId = code;
  history.pushState({ sessionId }, '', '?s=' + sessionId);
  initSessionScreen();
}

async function initSessionScreen() {
  document.getElementById('screen-welcome').classList.remove('active');
  document.getElementById('screen-session').classList.add('active');

  document.getElementById('code-display').innerHTML =
    sessionId + '<span class="copy-hint">Click to copy</span>';
  const badge = document.getElementById('header-code-badge');
  badge.textContent = 'Session — ' + sessionId;
  badge.style.display = 'inline';

  buildFilters();
  initMap();
  setTimeout(() => { if (map) map.invalidateSize(); }, 50);

  mapFitted = false;
  await pushMyUser();
  startHeartbeat();
  listenToSession();
}

// ─────────────────────────────────────────────────────────────
//  MOBILE PANEL TOGGLE
// ─────────────────────────────────────────────────────────────
function togglePanel() {
  const sidebar = document.querySelector('.sidebar');
  const fab     = document.getElementById('fab-btn');
  const isOpen  = sidebar.classList.toggle('is-open');
  if (fab) fab.textContent = isOpen ? '✕' : '☰';
  // Let the CSS transition finish before recalculating map size
  setTimeout(() => { if (map) map.invalidateSize(); }, 360);
}

function updateSheetSummary() {
  const el = document.getElementById('sheet-summary');
  if (!el) return;
  const users  = sessionData ? Object.values(sessionData.users  || {}) : [];
  const places = sessionData ? Object.values(sessionData.places || {}) : [];
  const withLoc = users.filter(u => u.coords).length;
  if (places.length) {
    el.textContent = `${places.length} place${places.length > 1 ? 's' : ''} found · ${withLoc}/${users.length} ready`;
  } else if (users.length) {
    el.textContent = `${withLoc}/${users.length} location${users.length > 1 ? 's' : ''} shared`;
  } else {
    el.textContent = 'Tap to open';
  }
}

function leaveSession() {
  clearInterval(heartbeatInterval);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  if (sessionUnsub) { sessionUnsub(); sessionUnsub = null; }

  history.pushState({}, '', location.pathname);

  // Close the bottom sheet if open
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.remove('is-open');
  const fab = document.getElementById('fab-btn');
  if (fab) fab.textContent = '☰';

  // Cancel the server-side onDisconnect handler and remove the user entry immediately.
  if (sessionId && myUserId) {
    const ref = db.ref(sessionPath('users', myUserId));
    ref.onDisconnect().cancel();
    ref.remove();
  }

  // Reset all state
  sessionId      = null;
  myCoords       = null;
  pendingCoords  = null;
  lastVotedPlace = null;
  sessionData    = null;

  // Destroy map
  if (map) { map.remove(); map = null; }
  Object.values(userMarkers).forEach(m => m.remove());
  userMarkers = {};
  placeMarkers.forEach(m => m.remove());
  placeMarkers = [];
  if (midpointMarker) { midpointMarker.remove(); midpointMarker = null; }

  // Reset UI
  document.getElementById('screen-session').classList.remove('active');
  document.getElementById('screen-welcome').classList.add('active');
  document.getElementById('addr-input').value = '';
  document.getElementById('loc-status').textContent = '';
  document.getElementById('place-list').innerHTML =
    '<div class="empty-state">Search for places to see results here.</div>';
  document.getElementById('user-list').innerHTML =
    '<div class="empty-state">Waiting for participants…</div>';
}

// ─────────────────────────────────────────────────────────────
//  STORAGE — push / pull
// ─────────────────────────────────────────────────────────────
async function pushMyUser() {
  if (!sessionId || !myUserId) return;
  try {
    const ref = db.ref(sessionPath('users', myUserId));
    // Register server-side cleanup: Firebase removes this entry the moment
    // the client's connection drops (tab close, network loss, browser kill).
    await ref.onDisconnect().remove();
    await ref.set({ id: myUserId, name: myName, coords: myCoords || null, ts: Date.now() });
  } catch(e) { console.warn('pushMyUser failed', e); }
}

function startHeartbeat() {
  clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(pushMyUser, 30000);

  // Re-push immediately when the user returns to this tab,
  // bypassing browser timer throttling on background tabs.
  document.removeEventListener('visibilitychange', onVisibilityChange);
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') pushMyUser();
}

function listenToSession() {
  if (sessionUnsub) { sessionUnsub(); sessionUnsub = null; }
  const fbRef = db.ref(sessionPath());
  const handler = snapshot => {
    const data = snapshot.val() || {};
    const users = Object.values(data.users || {})
      .filter(u => u && Date.now() - (u.ts || 0) < 300000);
    const places = data.places ? Object.values(data.places) : null;
    const votes = {};
    Object.values(data.votes || {}).forEach(v => {
      if (v && v.placeId) votes[v.placeId] = (votes[v.placeId] || 0) + 1;
    });
    sessionData = { users, places, votes };
    renderUsers(users);
    if (places) renderPlaces(places, votes);
    updateMapMarkers(users);
    updateSearchBtn(users);
    updateSheetSummary();
    const count = users.length;
    document.getElementById('online-count').textContent = count + ' user' + (count !== 1 ? 's' : '');
    document.getElementById('status-text').textContent = `Online · ${count} participant${count !== 1 ? 's' : ''}`;
  };
  fbRef.on('value', handler);
  sessionUnsub = () => fbRef.off('value', handler);
}

// ─────────────────────────────────────────────────────────────
//  UI RENDERING
// ─────────────────────────────────────────────────────────────
function renderUsers(users) {
  const list = document.getElementById('user-list');
  if (!users.length) {
    list.innerHTML = '<div class="empty-state">Waiting for participants…</div>';
    return;
  }
  list.innerHTML = '';
  users.forEach(u => {
    const isMe = u.id === myUserId;
    const div  = document.createElement('div');
    div.className = 'user-item';
    div.innerHTML = `
      <div class="user-dot ${u.coords ? 'located' : ''} ${isMe ? 'me' : ''}"></div>
      <div>
        <div class="user-name">${escapeHtml(u.name)}${isMe ? ' <span style="color:var(--muted);font-weight:400;">(you)</span>' : ''}</div>
        <div class="user-loc">${u.coords ? '📍 ' + escapeHtml(u.coords.label || 'Located') : 'No location set'}</div>
      </div>
    `;
    list.appendChild(div);
  });
}

function updateSearchBtn(users) {
  const located = users.filter(u => u.coords).length;
  const btn = document.getElementById('search-btn');
  btn.disabled = located < 2;
  if (located < 2) {
    const needed = 2 - located;
    btn.textContent = `Need ${needed} more participant${needed !== 1 ? 's' : ''} to search`;
  } else {
    btn.textContent = `Find midpoint places (${located} locations)`;
  }
}

function buildFilters() {
  const row = document.getElementById('filters-row');
  row.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const tag = document.createElement('div');
    tag.className = 'filter-tag' + (activeFilters.has(cat.id) ? ' active' : '');
    tag.dataset.id = cat.id;
    tag.innerHTML = `<span class="icon">${cat.icon}</span>${cat.label}`;
    tag.addEventListener('click', () => {
      if (activeFilters.has(cat.id)) {
        activeFilters.delete(cat.id);
        tag.classList.remove('active');
      } else {
        activeFilters.add(cat.id);
        tag.classList.add('active');
      }
    });
    row.appendChild(tag);
  });
}

function renderPlaces(places, votes) {
  const list = document.getElementById('place-list');
  if (!places || !places.length) {
    list.innerHTML = '<div class="empty-state">No places found. Try different filters or a wider search.</div>';
    return;
  }

  const maxVotes = Math.max(1, ...Object.values(votes));

  // Sort: votes → distance
  const sorted = [...places].sort((a, b) => {
    const vd = (votes[b.id] || 0) - (votes[a.id] || 0);
    if (vd !== 0) return vd;
    return a.dist - b.dist;
  });

  list.innerHTML = '';
  sorted.forEach((p, i) => {
    const v        = votes[p.id] || 0;
    const isWinner = i === 0 && v > 0;
    const hasVoted = lastVotedPlace === p.id;
    const distStr  = p.dist < 1000 ? p.dist + 'm' : (p.dist / 1000).toFixed(1) + 'km';
    const pct      = v ? Math.round((v / maxVotes) * 100) : 0;

    const extraInfo = [
      p.hours ? `<span class="place-info-item">🕐 ${escapeHtml(p.hours)}</span>` : '',
      p.phone ? `<span class="place-info-item">📞 <a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a></span>` : '',
      p.price ? `<span class="place-info-item">💰 ${escapeHtml(p.price)}</span>` : '',
      p.url   ? `<span class="place-info-item">🔗 <a href="${escapeHtml(p.url)}" target="_blank">Website</a></span>` : '',
    ].filter(Boolean).join('');

    const card = document.createElement('div');
    card.className = 'place-card' + (hasVoted ? ' voted' : '') + (isWinner ? ' winner' : '');
    card.innerHTML = `
      ${isWinner ? '<span class="winner-crown">Top pick</span>' : ''}
      <div class="place-name">${p.catIcon} ${escapeHtml(p.name)}</div>
      <div class="place-meta">${escapeHtml(p.type.replace(/_/g, ' '))}${p.addr ? ' · ' + escapeHtml(p.addr) : ''}</div>
      <div class="place-dist">${distStr} from midpoint</div>
      ${extraInfo ? `<div class="place-extra">${extraInfo}</div>` : ''}
      <div class="vote-row">
        <button class="btn sm ${hasVoted ? 'primary' : ''}" data-id="${p.id}" onclick="vote('${p.id}')">
          ${hasVoted ? '✓ Voted' : 'Vote'}
        </button>
        <div class="vote-bar-wrap">
          <div class="vote-bar" style="width:${pct}%"></div>
        </div>
        <span class="vote-count">${v} vote${v !== 1 ? 's' : ''}</span>
      </div>
    `;
    card.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') return;
      map.setView([p.lat, p.lng], 17);
    });
    list.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────────────
//  MAP MARKERS
// ─────────────────────────────────────────────────────────────
function updateMapMarkers(users) {
  Object.values(userMarkers).forEach(m => m.remove());
  userMarkers = {};

  const located = users.filter(u => u.coords);

  located.forEach(u => {
    const isMe    = u.id === myUserId;
    const color   = isMe ? '#c84a1e' : '#2a6b4f';
    const initial = u.name[0].toUpperCase();
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:32px;height:32px;border-radius:50%;
        background:${color};border:2px solid white;
        display:flex;align-items:center;justify-content:center;
        font-size:12px;font-weight:500;color:white;
        font-family:'DM Mono',monospace;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
      ">${initial}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    userMarkers[u.id] = L.marker([u.coords.lat, u.coords.lng], { icon })
      .addTo(map)
      .bindTooltip(u.name, { permanent: false });
  });

  // Draw/update midpoint marker
  if (located.length >= 2) {
    const mid = calcMidpoint(located.map(u => u.coords));
    if (midpointMarker) midpointMarker.remove();
    const mIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:14px;height:14px;background:#c84a1e;
        transform:rotate(45deg);border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    midpointMarker = L.marker([mid.lat, mid.lng], { icon: mIcon })
      .addTo(map)
      .bindTooltip('Midpoint', { permanent: true });

    if (!mapFitted) {
      const bounds = L.latLngBounds(located.map(u => [u.coords.lat, u.coords.lng]));
      map.fitBounds(bounds, { padding: [60, 60] });
      mapFitted = true;
    }
  }
}

function addPlaceMarkersToMap(places, mid) {
  placeMarkers.forEach(m => m.remove());
  placeMarkers = [];

  places.forEach(p => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:28px;height:28px;border-radius:50%;
        background:#f5f2ea;border:1.5px solid #1a1a18;
        display:flex;align-items:center;justify-content:center;
        font-size:14px;box-shadow:0 2px 4px rgba(0,0,0,0.12);
      ">${p.catIcon}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const distStr = p.dist < 1000 ? p.dist + 'm' : (p.dist / 1000).toFixed(1) + 'km';
    const osmUrl = `https://www.openstreetmap.org/node/${p.id}`;
    const popupDetails = [
      p.hours ? `🕐 ${p.hours}` : null,
      p.phone ? `📞 <a href="tel:${p.phone}">${p.phone}</a>` : null,
      p.price ? `💰 ${p.price}` : null,
    ].filter(Boolean).map(d => `<div>${d}</div>`).join('');
    const links = [
      p.url ? `<a href="${p.url}" target="_blank">Website</a>` : null,
              `<a href="${osmUrl}" target="_blank">OpenStreetMap</a>`,
    ].filter(Boolean).join(' · ');

    const m = L.marker([p.lat, p.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <strong style="font-family:Fraunces,serif;">${p.name}</strong><br>
        <small style="font-family:DM Mono,monospace;color:#7a7870;">
          ${p.type.replace(/_/g, ' ')} · ${distStr} from midpoint
        </small>
        ${popupDetails ? `<div style="margin-top:5px;font-size:11px;font-family:DM Mono,monospace;line-height:1.8;">${popupDetails}</div>` : ''}
        <div style="margin-top:5px;font-size:11px;font-family:DM Mono,monospace;">${links}</div>
      `);
    placeMarkers.push(m);
  });
}

// ─────────────────────────────────────────────────────────────
//  LOCATION — GPS & GEOCODING
// ─────────────────────────────────────────────────────────────
function useGPS() {
  if (!navigator.geolocation) {
    showToast('GPS not available in this browser');
    return;
  }
  document.getElementById('loc-status').textContent = 'Acquiring GPS…';
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const label = await reverseGeocode(lat, lng);
      pendingCoords = { lat, lng, label };
      document.getElementById('addr-input').value = label;
      document.getElementById('confirm-loc-btn').disabled = false;
      document.getElementById('loc-status').textContent = `📍 ${label}`;
    },
    () => {
      document.getElementById('loc-status').textContent =
        'GPS denied or unavailable — type an address instead.';
    },
    { timeout: 10000, enableHighAccuracy: false }
  );
}

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'MeetHalf/1.0' } }
    );
    const d = await r.json();
    return d.display_name
      ? d.display_name.split(',').slice(0, 3).join(', ')
      : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function onAddrInput(val) {
  clearTimeout(addrDebounce);
  if (val.length < 3) {
    document.getElementById('suggestion-list').style.display = 'none';
    return;
  }
  addrDebounce = setTimeout(() => fetchSuggestions(val), 400);
}

function showSuggestions() {
  const val = document.getElementById('addr-input').value;
  if (val.length >= 3) fetchSuggestions(val);
}

async function geocodeAddress() {
  const q = document.getElementById('addr-input').value.trim();
  if (q.length >= 2) fetchSuggestions(q);
}

async function fetchSuggestions(q) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'MeetHalf/1.0' } }
    );
    const results = await r.json();
    const list = document.getElementById('suggestion-list');

    if (!results.length) { list.style.display = 'none'; return; }

    list.innerHTML = '';
    results.forEach(res => {
      const label = res.display_name.split(',').slice(0, 4).join(', ');
      const item  = document.createElement('div');
      item.className = 'suggestion-item';
      item.textContent = label;
      item.addEventListener('click', () => {
        document.getElementById('addr-input').value = label;
        pendingCoords = { lat: parseFloat(res.lat), lng: parseFloat(res.lon), label };
        document.getElementById('confirm-loc-btn').disabled = false;
        document.getElementById('loc-status').textContent = `📍 ${label}`;
        list.style.display = 'none';
      });
      list.appendChild(item);
    });
    list.style.display = 'block';
  } catch (e) {
    console.warn('fetchSuggestions failed', e);
  }
}

async function setMyLocation() {
  if (!pendingCoords) return;
  myCoords = pendingCoords;
  document.getElementById('loc-status').textContent = `✓ Set: ${myCoords.label}`;
  document.getElementById('confirm-loc-btn').disabled = true;
  await pushMyUser();
  showToast('Location saved!');
}

// ─────────────────────────────────────────────────────────────
//  OVERPASS PLACE SEARCH
// ─────────────────────────────────────────────────────────────
async function searchPlaces() {
  if (!sessionData) return;
  const located = sessionData.users.filter(u => u.coords);
  if (located.length < 2) return;

  const mid = calcMidpoint(located.map(u => u.coords));

  const selectedCats = CATEGORIES.filter(c => activeFilters.has(c.id));
  if (!selectedCats.length) {
    showToast('Select at least one category first');
    return;
  }

  const loadingEl = document.getElementById('map-loading');
  loadingEl.style.display = 'flex';

  // Build Overpass QL query — one node clause per category
  const nodeClauses = selectedCats.map(cat =>
    `nwr["${cat.osmKey}"~"${cat.query}"](around:${SEARCH_RADIUS},${mid.lat},${mid.lng});`
  ).join('\n');

  const overpassQuery = `[out:json][timeout:15];(\n${nodeClauses}\n);out center ${MAX_PLACES * 3};`;

  const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.fr/api/interpreter',
    'https://overpass.osm.ch/api/interpreter',
  ];

  async function fetchOverpass(query) {
    const body = 'data=' + encodeURIComponent(query);
    const controllers = OVERPASS_ENDPOINTS.map(() => new AbortController());

    const attempt = async (endpoint, i) => {
      const timeout = setTimeout(() => controllers[i].abort(), 20000);
      const r = await fetch(endpoint, { method: 'POST', body, signal: controllers[i].signal });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      clearTimeout(timeout);
      controllers.forEach((c, j) => { if (j !== i) c.abort(); });
      return data;
    };

    try {
      return await Promise.any(OVERPASS_ENDPOINTS.map((ep, i) => attempt(ep, i)));
    } catch {
      throw new Error('All Overpass endpoints failed');
    }
  }

  try {
    const data = await fetchOverpass(overpassQuery);

    console.log('[Overpass] elements received:', data.elements?.length ?? 0);
    const allPlaces = (data.elements || [])
      .filter(el => el.tags && el.tags.name)
      .map(el => {
        const lat  = el.lat ?? el.center?.lat;
        const lon  = el.lon ?? el.center?.lon;
        if (!lat || !lon) return null;
        const dist = Math.round(haversine(mid.lat, mid.lng, lat, lon));
        const cat  = selectedCats.find(c => {
          const vals = c.query.split('|');
          return vals.some(v => el.tags[c.osmKey] === v);
        });
        return {
          id:      el.id.toString(),
          name:    el.tags.name,
          type:    el.tags.amenity || el.tags.leisure || el.tags.tourism || '',
          lat,
          lng:     lon,
          dist,
          cat:     cat ? cat.id   : 'other',
          catIcon: cat ? cat.icon : '📍',
          addr:    [el.tags['addr:street'], el.tags['addr:housenumber']].filter(Boolean).join(' '),
          url:     el.tags.website || el.tags['contact:website'] || '',
          phone:   el.tags.phone || el.tags['contact:phone'] || '',
          hours:   el.tags.opening_hours || '',
          price:   el.tags.stars || el.tags['price_range'] || el.tags['price_level'] || '',
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.dist - b.dist);

    console.log('[Overpass] named places with coords:', allPlaces.length);

    // Keep at most 5 results per category, then re-sort by distance
    const perCatCount = {};
    const places = allPlaces
      .filter(p => {
        perCatCount[p.cat] = (perCatCount[p.cat] || 0) + 1;
        return perCatCount[p.cat] <= 5;
      })
      .sort((a, b) => a.dist - b.dist);

    const po = {};
    places.forEach(p => { po[p.id] = p; });
    await fbSet(sessionPath('places'), po);

    renderPlaces(places, sessionData?.votes || {});
    addPlaceMarkersToMap(places, mid);
    showToast(`Found ${places.length} place${places.length !== 1 ? 's' : ''} near the midpoint`);
  } catch (e) {
    showToast('Could not fetch places — check connection and retry');
    console.error('searchPlaces failed', e);
  } finally {
    loadingEl.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────────────────
//  VOTING
// ─────────────────────────────────────────────────────────────
async function vote(placeId) {
  if (lastVotedPlace) {
    try { await fbRemove(sessionPath('votes', myUserId)); } catch (_) {}
  }
  lastVotedPlace = placeId;
  try {
    await fbSet(sessionPath('votes', myUserId), { placeId, userId: myUserId, ts: Date.now() });
    showToast('Vote cast!');
  } catch (e) {
    showToast('Vote failed — try again');
    console.error('vote failed', e);
  }
}


// ─────────────────────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────────────────────
function copyCode() {
  const url = location.origin + location.pathname + '?s=' + sessionId;
  navigator.clipboard.writeText(url)
    .then(() => showToast('Link copied to clipboard!'))
    .catch(() => showToast(url));
}

// Minimal XSS protection for user-supplied strings in innerHTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Close autocomplete when clicking elsewhere
document.addEventListener('click', e => {
  const input = document.getElementById('addr-input');
  const list  = document.getElementById('suggestion-list');
  if (input && list && !input.contains(e.target) && !list.contains(e.target)) {
    list.style.display = 'none';
  }
});

// ─────────────────────────────────────────────────────────────
//  URL-BASED SESSION DETECTION
//  Handles direct links: meethalf.app/join/ABC123
// ─────────────────────────────────────────────────────────────
(function detectSessionFromUrl() {
  const code = new URLSearchParams(location.search).get('s');
  if (!code) return;
  const upper = code.toUpperCase();
  history.replaceState({}, '', '?s=' + upper);

  const savedName = localStorage.getItem('meethalf_name');
  if (savedName) {
    // Known user — jump straight into the session
    myName    = savedName;
    myUserId  = genUserId();
    sessionId = upper;
    initSessionScreen();
  } else {
    // New visitor — pre-fill code and focus name input
    const codeInput = document.getElementById('join-code-input');
    const nameInput = document.getElementById('user-name-input');
    if (codeInput) codeInput.value = upper;
    if (nameInput) nameInput.focus();
  }
})();

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
  if (sessionId) leaveSession();
});
