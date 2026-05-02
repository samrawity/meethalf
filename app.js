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

// Overpass search radius in metres around the midpoint (adjustable via slider)
let searchRadius = 1500;

// Max places to display from Overpass results
const MAX_PLACES = 20;

// Max participants per session
const MAX_PARTICIPANTS = 50;

// Sync interval (ms) — lower = more responsive, higher = fewer API calls
const SYNC_INTERVAL = 3000;

// ─────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────
let sessionId     = null;
let myUserId      = null;
let myName        = '';
let meetName      = '';     // session display name set by the creator
let myCoords      = null;   // { lat, lng, label }
let pendingCoords = null;   // staged coords before user confirms
let map           = null;
let pinDropMarker = null;   // temporary marker while user is picking their location
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
let radiusCircle  = null;
let suggestionAbort  = null; // AbortController for in-flight autocomplete requests
let locatedCount     = 0;   // tracks how many participants have coords; reset triggers map refit

// ─────────────────────────────────────────────────────────────
//  SENTRY HELPERS
// ─────────────────────────────────────────────────────────────
function captureApiError(error, apiSource, context = {}) {
  if (!window.Sentry) return;
  Sentry.withScope(scope => {
    scope.setTag('api_source', apiSource);
    scope.setContext('api_call', context);
    Sentry.captureException(error);
  });
}

// Replace session ID in Firebase paths so session content never reaches Sentry
function scrubPath(path) {
  return path.replace(/sessions\/[^/]+/, 'sessions/*');
}

// ─────────────────────────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────────────────────────
function sessionPath(...parts) {
  return ['sessions', sessionId, ...parts].join('/');
}

async function fbSet(path, value) {
  try {
    await db.ref(path).set(value);
  } catch (e) {
    captureApiError(e, 'firebase', { operation: 'set', path: scrubPath(path) });
    throw e;
  }
}

async function fbRemove(path) {
  try {
    await db.ref(path).remove();
  } catch (e) {
    captureApiError(e, 'firebase', { operation: 'remove', path: scrubPath(path) });
    throw e;
  }
}

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
const TZ_COORDS = {
  'Europe/London':[51.505,-0.09],'Europe/Lisbon':[38.717,-9.142],'Europe/Paris':[48.856,2.352],
  'Europe/Brussels':[50.85,4.351],'Europe/Amsterdam':[52.37,4.895],'Europe/Madrid':[40.416,-3.703],
  'Europe/Berlin':[52.52,13.405],'Europe/Rome':[41.89,12.492],'Europe/Zurich':[47.376,8.541],
  'Europe/Stockholm':[59.332,18.065],'Europe/Oslo':[59.913,10.752],'Europe/Copenhagen':[55.676,12.568],
  'Europe/Warsaw':[52.229,21.012],'Europe/Prague':[50.075,14.437],'Europe/Vienna':[48.208,16.373],
  'Europe/Budapest':[47.498,19.04],'America/New_York':[40.712,-74.006],'America/Toronto':[43.651,-79.347],
  'America/Chicago':[41.878,-87.629],'America/Mexico_City':[19.432,-99.133],'America/Denver':[39.739,-104.984],
  'America/Los_Angeles':[34.052,-118.243],'America/Sao_Paulo':[-23.55,-46.633],
  'Asia/Dubai':[25.204,55.27],'Asia/Kolkata':[28.613,77.209],'Asia/Singapore':[1.352,103.82],
  'Asia/Shanghai':[31.228,121.473],'Asia/Tokyo':[35.689,139.692],'Asia/Seoul':[37.566,126.978],
  'Australia/Sydney':[-33.868,151.209],'Africa/Cairo':[30.044,31.235],'Africa/Johannesburg':[-26.204,28.047],
  'Pacific/Auckland':[-36.848,174.763],
};

function initMap() {
  if (map) return;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzCenter = TZ_COORDS[tz];
  const center = tzCenter || [48.8566, 2.3522];
  const zoom   = tzCenter ? 11 : 5;
  map = L.map('map', { zoomControl: true }).setView(center, zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);
  map.on('click', onMapClick);
  document.getElementById('map').classList.add('map--pin-mode');
}

function updateRadiusCircle() {
  if (!map) return;
  const located = sessionData ? sessionData.users.filter(u => u.coords) : [];
  if (located.length < 2) {
    if (radiusCircle) { radiusCircle.remove(); radiusCircle = null; }
    return;
  }
  const mid = calcMidpoint(located.map(u => u.coords));
  if (radiusCircle) {
    radiusCircle.setLatLng([mid.lat, mid.lng]);
    radiusCircle.setRadius(searchRadius);
  } else {
    radiusCircle = L.circle([mid.lat, mid.lng], {
      radius: searchRadius,
      color: '#c84a1e',
      weight: 1.5,
      opacity: 0.7,
      fillColor: '#c84a1e',
      fillOpacity: 0.07,
      dashArray: '5 5',
    }).addTo(map);
  }
}

function onRadiusChange(val) {
  searchRadius = parseInt(val, 10);
  document.getElementById('radius-value').textContent = searchRadius >= 1000
    ? (searchRadius / 1000).toFixed(1) + ' km'
    : searchRadius + ' m';
  updateRadiusCircle();
}

// ─────────────────────────────────────────────────────────────
//  SESSION LIFECYCLE
// ─────────────────────────────────────────────────────────────
function expandCard(which) {
  const other = which === 'start' ? 'join' : 'start';
  document.getElementById('card-' + which).classList.add('is-active');
  document.getElementById('card-' + other).classList.remove('is-active');
  const inputId = which === 'start' ? 'meet-name' : 'name-' + which;
  const input = document.getElementById(inputId);
  if (input) setTimeout(() => input.focus(), 50);
}

function createSession() {
  meetName  = document.getElementById('meet-name').value.trim();
  const name = document.getElementById('name-start').value.trim() || 'Anonymous';
  myName    = name;
  myUserId  = genUserId();
  sessionId = genCode();
  localStorage.setItem('meethalf_name', name);
  sessionStorage.setItem('meethalf_session', JSON.stringify({ sessionId, myUserId, myName, meetName }));
  history.pushState({ sessionId }, '', '?s=' + sessionId);

  // Show the share step before entering the session
  document.getElementById('share-code-val').textContent = sessionId;
  document.getElementById('card-start').classList.add('is-shared');
}

function enterSession() {
  if (meetName) fbSet(sessionPath('name'), meetName).catch(() => {});
  initSessionScreen();
}

function copyShareCode() {
  const url = location.origin + location.pathname + '?s=' + sessionId;
  navigator.clipboard.writeText(url)
    .then(() => showToast('Link copied!'))
    .catch(() => {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('Link copied!');
    });
}

function joinSession() {
  const code = document.getElementById('join-code-input').value.trim().toUpperCase();
  const name = document.getElementById('name-join').value.trim() || 'Anonymous';
  if (!code || code.length < 4) { showToast('Please enter a valid 6-character code'); return; }
  myName    = name;
  myUserId  = genUserId();
  sessionId = code;
  localStorage.setItem('meethalf_name', name);
  sessionStorage.setItem('meethalf_session', JSON.stringify({ sessionId, myUserId, myName }));
  history.pushState({ sessionId }, '', '?s=' + sessionId);
  initSessionScreen();
}

async function initSessionScreen() {
  document.getElementById('screen-welcome').classList.remove('active');
  document.getElementById('screen-session').classList.add('active');

  document.getElementById('code-display').innerHTML =
    sessionId + '<span class="copy-hint">Click to copy</span>';
  const badge = document.getElementById('header-code-badge');
  badge.textContent = meetName ? `${meetName} · ${sessionId}` : sessionId;
  badge.style.display = 'inline';

  buildFilters();
  initMap();

  // On mobile, open the bottom sheet automatically so users see the steps immediately
  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    const fab     = document.getElementById('fab-btn');
    if (sidebar) sidebar.classList.add('is-open');
    if (fab) fab.textContent = '✕';
  }

  setTimeout(() => { if (map) map.invalidateSize(); }, 50);

  mapFitted = false;

  // Participant cap: check current user count before joining.
  const snapshot = await db.ref(sessionPath('users')).get();
  const currentCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
  if (currentCount >= MAX_PARTICIPANTS) {
    showToast('This session is full');
    leaveSession();
    return;
  }

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
    el.textContent = `${withLoc} of ${users.length} location${users.length > 1 ? 's' : ''} shared`;
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
  sessionStorage.removeItem('meethalf_session');

  // Reset all state
  sessionId      = null;
  meetName       = '';
  myCoords       = null;
  pendingCoords  = null;
  lastVotedPlace = null;
  sessionData    = null;
  locatedCount   = 0;

  // Destroy map
  if (pinDropMarker) { pinDropMarker.remove(); pinDropMarker = null; }
  if (map) { map.remove(); map = null; }
  Object.values(userMarkers).forEach(m => m.remove());
  userMarkers = {};
  placeMarkers.forEach(m => m.remove());
  placeMarkers = [];
  if (midpointMarker) { midpointMarker.remove(); midpointMarker = null; }
  if (radiusCircle)   { radiusCircle.remove();   radiusCircle = null; }

  // Reset UI
  document.getElementById('screen-session').classList.remove('active');
  document.getElementById('screen-welcome').classList.add('active');
  document.getElementById('addr-input').value = '';
  document.getElementById('loc-status').textContent = '';
  document.getElementById('place-list').style.display = '';
  document.getElementById('place-list').innerHTML =
    '<div class="empty-state">Hit "Find places nearby" once everyone has dropped their location.</div>';
  document.getElementById('result-panel-content').style.display = 'none';
  document.getElementById('result-panel-content').innerHTML = '';
  document.getElementById('results-panel-step').textContent = 'Step 4';
  document.getElementById('results-panel-heading').textContent = 'Vote for a place';
  document.getElementById('user-list').innerHTML =
    '<div class="empty-state">Waiting for people to join…</div>';
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
    sessionData = { users, places, votes, summary: data.summary || null };
    if (data.name && !meetName) {
      meetName = data.name;
      const badge = document.getElementById('header-code-badge');
      if (badge) badge.textContent = `${meetName} · ${sessionId}`;
    }
    renderUsers(users);
    if (data.summary) {
      renderResult(data.summary);
    } else if (places) {
      renderPlaces(places, votes);
      maybeWriteSummary(places, votes, users);
    }
    updateMapMarkers(users);
    updateSearchBtn(users);
    updateSheetSummary();
    const count = users.length;
    document.getElementById('online-count').textContent = count + ' person' + (count !== 1 ? 's' : '');
    document.getElementById('status-text').textContent = `Online · ${count} ${count !== 1 ? 'people' : 'person'} connected`;
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
    list.innerHTML = '<div class="empty-state">Waiting for people to join…</div>';
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
    btn.textContent = `Waiting for ${needed} more ${needed !== 1 ? 'people' : 'person'} to share their location`;
  } else {
    btn.textContent = `Find places nearby (${located} locations)`;
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
    list.innerHTML = '<div class="empty-state">Nothing found nearby — try different filters or a wider search radius.</div>';
    return;
  }

  const maxVotes = Math.max(1, ...Object.values(votes));

  // Sort: votes → distance
  const sorted = [...places].sort((a, b) => {
    const vd = (votes[b.id] || 0) - (votes[a.id] || 0);
    if (vd !== 0) return vd;
    return a.dist - b.dist;
  });

  // Determine if top place has a clear majority (more votes than all others combined)
  const topVotes   = votes[sorted[0].id] || 0;
  const otherVotes = sorted.slice(1).reduce((sum, p) => sum + (votes[p.id] || 0), 0);
  const hasWinner  = topVotes > 0 && topVotes > otherVotes;

  list.innerHTML = '';
  sorted.forEach((p, i) => {
    const v        = votes[p.id] || 0;
    const isWinner = i === 0 && hasWinner;
    const hasVoted = lastVotedPlace === p.id;
    const distStr  = p.dist < 1000 ? p.dist + 'm' : (p.dist / 1000).toFixed(1) + 'km';
    const pct      = v ? Math.round((v / maxVotes) * 100) : 0;

    const cardUrl = safeUrl(p.url);
    const extraInfo = [
      p.hours  ? `<span class="place-info-item">🕐 ${escapeHtml(p.hours)}</span>` : '',
      p.phone  ? `<span class="place-info-item">📞 <a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a></span>` : '',
      p.price  ? `<span class="place-info-item">💰 ${escapeHtml(p.price)}</span>` : '',
      cardUrl  ? `<span class="place-info-item">🔗 <a href="${escapeHtml(cardUrl)}" target="_blank" rel="noopener">Website</a></span>` : '',
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
      if (map) map.setView([p.lat, p.lng], 17);
    });
    list.appendChild(card);

    if (isWinner) {
      const shareBtn = document.createElement('button');
      shareBtn.className = 'btn full share-btn';
      shareBtn.textContent = 'Share the result';
      shareBtn.addEventListener('click', () => shareResult(p));
      list.appendChild(shareBtn);
    }
  });
}

async function shareResult(place) {
  const mapsUrl  = `https://maps.google.com/maps?q=${encodeURIComponent(place.name + (place.addr ? ', ' + place.addr : ''))}`;
  const appUrl   = location.origin + location.pathname + (sessionId ? '?s=' + sessionId : '');
  const summary  = [
    `We're meeting at ${place.name}`,
    place.addr ? place.addr : null,
    mapsUrl,
    `Found with MeetHalf — ${appUrl}`,
  ].filter(Boolean).join('\n');

  if (navigator.share) {
    try {
      await navigator.share({ title: `Meeting at ${place.name}`, text: summary });
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Couldn\'t open share sheet — link copied instead');
      else return;
    }
  } else {
    try {
      await navigator.clipboard.writeText(summary);
      showToast('Result copied — paste it anywhere!');
    } catch {
      showToast(summary, 6000);
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  SESSION SUMMARY — write & render
// ─────────────────────────────────────────────────────────────

// Called after every vote update. Writes summary to Firebase once a clear
// winner exists (≥2 votes, strictly more than all others combined).
// Idempotent: if summary already exists in Firebase, the listener skips this.
async function maybeWriteSummary(places, votes, users) {
  if (!places || !places.length) return;

  const sorted    = [...places].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
  const winner    = sorted[0];
  const topVotes  = votes[winner.id] || 0;
  const otherVotes = sorted.slice(1).reduce((s, p) => s + (votes[p.id] || 0), 0);
  if (topVotes < 2 || topVotes <= otherVotes) return;

  const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(winner.name + (winner.addr ? ', ' + winner.addr : ''))}`;
  const voteBreakdown = {};
  sorted.forEach(p => { if (votes[p.id]) voteBreakdown[p.name] = votes[p.id]; });

  const summary = {
    placeName:        winner.name,
    placeAddr:        winner.addr || '',
    lat:              winner.lat,
    lng:              winner.lng,
    mapsUrl,
    distFromMidpoint: winner.dist,
    participantCount: users.length,
    voteBreakdown,
    timestamp:        firebase.database.ServerValue.TIMESTAMP,
  };

  try {
    // Transaction: only write if no summary exists yet, preventing timestamp drift
    // from concurrent calls before the first write is confirmed.
    await db.ref(sessionPath('summary')).transaction(current => current === null ? summary : undefined);
  } catch (e) {
    console.warn('Could not write session summary', e);
  }
}

function renderResult(summary) {
  // Switch panel heading
  document.getElementById('results-panel-step').textContent = 'Result';
  document.getElementById('results-panel-heading').textContent = 'We have a winner';

  // Hide vote list, show result content
  document.getElementById('place-list').style.display = 'none';
  const el = document.getElementById('result-panel-content');
  el.style.display = 'block';

  const distStr = summary.distFromMidpoint < 1000
    ? summary.distFromMidpoint + 'm'
    : (summary.distFromMidpoint / 1000).toFixed(1) + 'km';

  const topVotes = Math.max(...Object.values(summary.voteBreakdown || {}), 0);

  el.innerHTML = `
    <div class="result-card">
      <div class="result-name">${escapeHtml(summary.placeName)}</div>
      ${summary.placeAddr ? `<div class="result-addr">${escapeHtml(summary.placeAddr)}</div>` : ''}
      <div class="result-dist">${distStr} from midpoint</div>
      <div class="result-votes">${topVotes} vote${topVotes !== 1 ? 's' : ''} · ${summary.participantCount} participant${summary.participantCount !== 1 ? 's' : ''}</div>
      <a class="btn primary full result-maps-btn" href="${escapeHtml(summary.mapsUrl)}" target="_blank" rel="noopener">
        Open in Maps
      </a>
    </div>
    <p class="result-timestamp">Decided ${new Date(summary.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
  `;
}

// ─────────────────────────────────────────────────────────────
//  MAP MARKERS
// ─────────────────────────────────────────────────────────────
function updateMapMarkers(users) {
  Object.values(userMarkers).forEach(m => m.remove());
  userMarkers = {};

  const located = users.filter(u => u.coords);

  // Reset mapFitted whenever a new participant drops their location so the
  // map re-fits to include them on the next updateMapMarkers pass.
  if (located.length > locatedCount) mapFitted = false;
  locatedCount = located.length;

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
  updateRadiusCircle();
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
    const osmUrl  = `https://www.openstreetmap.org/node/${p.id}`;
    const popupDetails = [
      p.hours ? `🕐 ${p.hours}` : null,
      p.phone ? `📞 <a href="tel:${p.phone}">${p.phone}</a>` : null,
      p.price ? `💰 ${p.price}` : null,
    ].filter(Boolean).map(d => `<div>${d}</div>`).join('');
    const links = [
      p.url ? `<a href="${p.url}" target="_blank" rel="noopener">Website</a>` : null,
              `<a href="${osmUrl}" target="_blank" rel="noopener">OpenStreetMap</a>`,
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
    showToast('GPS isn\'t available in this browser — try typing your address instead');
    return;
  }
  document.getElementById('loc-status').textContent = 'Finding your location…';
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const label = await reverseGeocode(lat, lng);
      pendingCoords = { lat, lng, label };
      document.getElementById('addr-input').value = label;
      document.getElementById('confirm-loc-btn').disabled = false;
      document.getElementById('loc-status').textContent = `📍 ${label}`;
    },
    err => {
      document.getElementById('loc-status').textContent =
        'Couldn\'t get your GPS — just type your address above.';
      captureApiError(new Error('Geolocation failed'), 'geolocation', {
        error_code: err.code,
        error_message: err.message,
      });
    },
    { timeout: 25000, enableHighAccuracy: false }
  );
}

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'MeetHalf/1.0' } }
    );
    if (!r.ok) throw new Error(`Nominatim reverse geocode failed with HTTP ${r.status}`);
    const d = await r.json();
    return d.display_name
      ? d.display_name.split(',').slice(0, 3).join(', ')
      : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (e) {
    captureApiError(e, 'nominatim', { operation: 'reverse_geocode' });
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

async function onMapClick(e) {
  if (myCoords) return; // already confirmed — don't override
  const { lat, lng } = e.latlng;

  // Place or move the drop-pin marker
  if (pinDropMarker) {
    pinDropMarker.setLatLng([lat, lng]);
  } else {
    const icon = L.divIcon({
      className: '',
      html: `<div class="pin-drop-marker"><div class="pin-drop-ring"></div></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
    pinDropMarker = L.marker([lat, lng], { icon, zIndexOffset: 500 }).addTo(map);
  }

  document.getElementById('loc-status').textContent = 'Locating…';
  document.getElementById('confirm-loc-btn').disabled = true;

  const label = await reverseGeocode(lat, lng);
  pendingCoords = { lat, lng, label };
  document.getElementById('addr-input').value = label;
  document.getElementById('confirm-loc-btn').disabled = false;
  document.getElementById('loc-status').textContent = `📍 ${label}`;
  document.getElementById('suggestion-list').style.display = 'none';
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
  if (suggestionAbort) suggestionAbort.abort();
  suggestionAbort = new AbortController();
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'MeetHalf/1.0' }, signal: suggestionAbort.signal }
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
    if (e.name === 'AbortError') return; // intentionally cancelled — not an error
    console.warn('fetchSuggestions failed', e);
    captureApiError(e, 'nominatim', { operation: 'autocomplete' });
  }
}

async function setMyLocation() {
  if (!pendingCoords) return;
  myCoords = pendingCoords;
  document.getElementById('loc-status').textContent = `✓ Set: ${myCoords.label}`;
  document.getElementById('confirm-loc-btn').disabled = true;

  // Remove drop-pin preview and crosshair cursor once location is confirmed
  if (pinDropMarker) { pinDropMarker.remove(); pinDropMarker = null; }
  document.getElementById('map').classList.remove('map--pin-mode');

  await pushMyUser();
  showToast('Got it, you\'re on the map!');
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
    showToast('Pick at least one category to search');
    return;
  }

  const loadingEl = document.getElementById('map-loading');
  loadingEl.style.display = 'flex';

  // Build Overpass QL query — one node clause per category
  const clauses = selectedCats.flatMap(cat => [
    `node["${cat.osmKey}"~"${cat.query}"](around:${searchRadius},${mid.lat},${mid.lng});`,
    `way["${cat.osmKey}"~"${cat.query}"](around:${searchRadius},${mid.lat},${mid.lng});`,
  ]).join('\n');

  const overpassQuery = `[out:json][timeout:25];(\n${clauses}\n);out body center ${MAX_PLACES * 5};`;

  const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.fr/api/interpreter',
  ];

  async function fetchOverpass(query) {
    const body = 'data=' + encodeURIComponent(query);

    const tryEndpoint = async endpoint => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const t0 = Date.now();
      try {
        const r = await fetch(endpoint, { method: 'POST', body, signal: controller.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('json')) throw new Error('rate-limited (XML)');
        const data = await r.json();
        if (!Array.isArray(data.elements)) throw new Error('no elements array');
        clearTimeout(timeout);
        console.log('[Overpass]', endpoint, '→', data.elements.length, 'elements', data.remark || '');
        return data;
      } catch (e) {
        clearTimeout(timeout);
        if (e.name !== 'AbortError') {
          console.warn('[Overpass] failed:', endpoint, e.message);
          captureApiError(e, 'overpass', {
            endpoint,
            radius_m: searchRadius,
            duration_ms: Date.now() - t0,
            timed_out: e.name === 'AbortError',
          });
        }
        throw e;
      }
    };

    // Query all endpoints in parallel, take the one with the most elements.
    // This prevents a fast-but-stale endpoint from winning over a correct one.
    const settled = await Promise.allSettled(OVERPASS_ENDPOINTS.map(tryEndpoint));
    const best = settled
      .filter(r => r.status === 'fulfilled')
      .sort((a, b) => b.value.elements.length - a.value.elements.length)[0];

    if (!best) throw new Error('All Overpass endpoints failed');
    console.log('[Overpass] best result:', best.value.elements.length, 'elements');
    return best.value;
  }

  const searchStartTime = Date.now();
  console.log('[Overpass] query:', overpassQuery);
  try {
    const data = await fetchOverpass(overpassQuery);

    console.log('[Overpass] elements received:', data.elements?.length ?? 0, data.remark || '');
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

    // Keep at most 5 results per category, apply global cap, then re-sort by distance
    const perCatCount = {};
    const places = allPlaces
      .filter(p => {
        perCatCount[p.cat] = (perCatCount[p.cat] || 0) + 1;
        return perCatCount[p.cat] <= 5;
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, MAX_PLACES);

    const po = {};
    places.forEach(p => { po[p.id] = p; });
    await fbSet(sessionPath('places'), po);

    renderPlaces(places, sessionData?.votes || {});
    addPlaceMarkersToMap(places, mid);
    showToast(`Found ${places.length} place${places.length !== 1 ? 's' : ''} — take a look!`);
  } catch (e) {
    showToast('Something went wrong fetching places — check your connection and try again');
    console.error('searchPlaces failed', e);
    captureApiError(e, 'overpass', {
      radius_m: searchRadius,
      categories: selectedCats.map(c => c.id),
      duration_ms: Date.now() - searchStartTime,
      result_count: 0,
    });
  } finally {
    loadingEl.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────────────────
//  VOTING
// ─────────────────────────────────────────────────────────────
async function vote(placeId) {
  if (lastVotedPlace) {
    try {
      await fbRemove(sessionPath('votes', myUserId));
    } catch (e) {
      captureApiError(e, 'firebase', { operation: 'remove_vote', prev: lastVotedPlace, next: placeId });
      showToast("Couldn't update your vote — please try again");
      return;
    }
  }
  // Only advance state once the removal has confirmed success.
  lastVotedPlace = placeId;
  try {
    await fbSet(sessionPath('votes', myUserId), { placeId, userId: myUserId, ts: Date.now() });
    showToast('Voted!');
  } catch (e) {
    captureApiError(e, 'firebase', { operation: 'set_vote', placeId });
    showToast("Couldn't save your vote — please try again");
    // Roll back local state so a retry attempt will attempt the write again.
    lastVotedPlace = null;
  }
}


// ─────────────────────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────────────────────
function copyCode() {
  const url = location.origin + location.pathname + '?s=' + sessionId;
  navigator.clipboard.writeText(url)
    .then(() => showToast('Link copied — send it to your group!'))
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

// Allow only http/https URLs from external sources (OSM data, etc.)
function safeUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  return (s.startsWith('https://') || s.startsWith('http://')) ? s : null;
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

  // Refresh recovery: restore the same userId so the Firebase entry is reused.
  const stored = sessionStorage.getItem('meethalf_session');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.sessionId === upper) {
        myName    = parsed.myName;
        myUserId  = parsed.myUserId;
        meetName  = parsed.meetName || '';
        sessionId = upper;
        initSessionScreen();
        return;
      }
      // Stale entry from a different session — silently remove the ghost user
      // node so it doesn't linger as a phantom presence in the old session.
      if (parsed.sessionId && parsed.myUserId) {
        db.ref(`sessions/${parsed.sessionId}/users/${parsed.myUserId}`).remove().catch(() => {});
      }
      sessionStorage.removeItem('meethalf_session');
    } catch (e) { /* corrupted storage — fall through */ }
  }

  const savedName = localStorage.getItem('meethalf_name');
  if (savedName) {
    // Known user arriving via a shared link — generate a fresh userId.
    myName    = savedName;
    myUserId  = genUserId();
    sessionId = upper;
    sessionStorage.setItem('meethalf_session', JSON.stringify({ sessionId: upper, myUserId, myName }));
    initSessionScreen();
  } else {
    // New visitor — expand join card, pre-fill code, focus name input.
    const codeInput = document.getElementById('join-code-input');
    if (codeInput) codeInput.value = upper;
    expandCard('join');
  }
})();

// ── Service Worker registration ───────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
