'use strict';

// ─────────────────────────────────────────────────────────────
//  TRANSLATIONS
//  All user-facing strings. Keys are semantic identifiers.
//  Functions handle pluralisation / interpolation.
// ─────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  fr: {
    // Welcome screen
    hero_title_pre:        "Trouvez l'endroit où",
    hero_title_em:         "tout le monde",
    hero_title_post:       "arrive à mi-chemin.",
    hero_subtitle:         "Partagez un code, épinglez votre position, votez pour un lieu. En 60 secondes, c'est réglé.",
    pill_free:             "Gratuit",
    pill_no_account:       "Sans compte",
    pill_realtime:         "Temps réel",
    pill_open_data:        "Données ouvertes",
    // Start card
    card_start_eyebrow:    "Créer",
    card_start_title:      "Créer une session",
    card_start_sub:        "Choisissez un point de rencontre — partagez un code pour inviter les autres",
    label_meet_name:       "C'est quoi le plan ?",
    ph_meet_name:          "Soirée entre amis",
    label_your_name:       "Votre prénom",
    ph_your_name:          "ex. Sophie",
    btn_start_session:     "Créer une session",
    btn_get_started:       "Commencer →",
    // Join card
    card_join_eyebrow:     "Rejoindre",
    card_join_title:       "Rejoindre une session",
    card_join_sub:         "Quelqu'un vous a envoyé un code — entrez-le pour partager votre position et voter",
    label_join_name:       "Votre prénom",
    label_session_code:    "Code de session",
    ph_session_code:       "ABC123",
    btn_join_session:      "Rejoindre avec un code",
    btn_enter_code:        "Entrer le code →",
    // Share step
    share_label:           "Partagez avec votre groupe",
    share_hint:            "Quiconque a le lien peut épingler sa position.",
    btn_copy_link:         "Copier le lien",
    btn_lets_go:           "C'est parti →",
    welcome_note:          "Votre position n'est jamais obligatoire. Elle disparaît à la fin de la session.",
    // Session header
    btn_leave_session:     "Quitter",
    // Code panel
    panel_code_title:      "Code de session",
    panel_code_sub:        "Partagez avec vos amis",
    copy_hint:             "Cliquer pour copier",
    // Location panel
    step_1:                "Étape 1",
    panel_location:        "Votre position",
    ph_address:            "Tapez une adresse…",
    btn_use_gps:           "GPS",
    btn_confirm_location:  "Confirmer",
    pin_drop_hint:         "Ou tapez la carte pour épingler",
    loc_finding:           "Localisation en cours…",
    loc_locating:          "Localisation…",
    loc_set:               label => `✓ Enregistré : ${label}`,
    // Participants panel
    step_2:                "Étape 2",
    panel_participants:    "Participants",
    empty_waiting:         "En attente de participants…",
    no_location_set:       "Position non définie",
    user_you:              "(vous)",
    // Find places panel
    step_3:                "Étape 3",
    panel_find_places:     "Trouver des lieux",
    search_radius:         "Rayon de recherche",
    btn_find_places:       "Trouver des lieux proches",
    loading_text:          "Recherche dans le quartier…",
    // Vote panel
    step_4:                "Étape 4",
    panel_vote:            "Votez pour un lieu",
    empty_places:          "Cherchez des lieux pour voir les résultats ici.",
    btn_vote:              "Voter",
    btn_voted:             "✓ Voté",
    top_pick:              "Favori",
    from_midpoint:         "du point médian",
    btn_share_result:      "Partager le résultat",
    // Result
    result_label:          "Résultat",
    result_winner:         "Nous avons un gagnant",
    btn_open_maps:         "Ouvrir dans Maps",
    result_decided:        "Décidé à",
    // Status / misc
    status_connecting:     "Connexion…",
    sheet_tap:             "Appuyez pour ouvrir",
    midpoint_label:        "Point médian",
    // Categories
    cat_food:              "Restaurants",
    cat_cafe:              "Café",
    cat_drink:             "Bars",
    cat_gym:               "Sport",
    cat_park:              "Parcs",
    cat_culture:           "Culture",
    // Toasts
    toast_link_copied:     "Lien copié !",
    toast_code_copied:     "Lien copié — envoyez-le à votre groupe !",
    toast_location_saved:  "Position enregistrée !",
    toast_voted:           "Voté !",
    toast_session_full:    "Cette session est complète",
    toast_gps_unavailable: "GPS non disponible — essayez de saisir votre adresse",
    toast_gps_failed:      "Impossible d'obtenir votre GPS — saisissez votre adresse.",
    toast_no_category:     "Sélectionnez au moins une catégorie",
    toast_vote_error:      "Impossible de mettre à jour votre vote — réessayez",
    toast_vote_save_error: "Impossible d'enregistrer votre vote — réessayez",
    toast_places_error:    "Impossible de récupérer les lieux — réessayez",
    toast_share_error:     "Impossible d'ouvrir le partage — lien copié",
    toast_result_copied:   "Résultat copié — partagez-le !",
    toast_join_error:      "Entrez un code valide à 6 caractères",
    // Dynamic (functions)
    sheet_places:          (n, w, tot) => `${n} lieu${n > 1 ? 'x' : ''} · ${w}/${tot} prêts`,
    sheet_users:           (w, tot) => `${w} sur ${tot} position${tot > 1 ? 's' : ''} partagée${tot > 1 ? 's' : ''}`,
    online_count:          n => `${n} participant${n > 1 ? 's' : ''}`,
    status_online:         n => `En ligne · ${n} participant${n > 1 ? 's' : ''}`,
    search_waiting:        n => `En attente de ${n} participant${n > 1 ? 's' : ''} supplémentaire${n > 1 ? 's' : ''}`,
    search_ready:          n => `Trouver des lieux (${n} positions)`,
    toast_places_found:    n => `${n} lieu${n > 1 ? 'x' : ''} trouvé${n > 1 ? 's' : ''} — jetez un œil !`,
    votes_count:           n => `${n} vote${n > 1 ? 's' : ''}`,
    result_stats:          (v, p) => `${v} vote${v > 1 ? 's' : ''} · ${p} participant${p > 1 ? 's' : ''}`,
    share_meeting_prefix:  "On se retrouve au",
    share_found_with:      "Trouvé avec Amichemin —",
    share_meeting_title:   name => `On se retrouve au ${name}`,
  },
  en: {
    // Welcome screen
    hero_title_pre:        "Find the spot",
    hero_title_em:         "everyone",
    hero_title_post:       "can actually reach.",
    hero_subtitle:         "Share a code, drop your location, vote on a place. Done in 60 seconds.",
    pill_free:             "Free",
    pill_no_account:       "No account",
    pill_realtime:         "Real-time",
    pill_open_data:        "Open map data",
    // Start card
    card_start_eyebrow:    "Start",
    card_start_title:      "Start a session",
    card_start_sub:        "Pick a meeting spot for your group — share a code to invite others",
    label_meet_name:       "What's the meet?",
    ph_meet_name:          "Party time",
    label_your_name:       "Your name",
    ph_your_name:          "e.g. Sophie",
    btn_start_session:     "Start a session",
    btn_get_started:       "Get started →",
    // Join card
    card_join_eyebrow:     "Join",
    card_join_title:       "Join a session",
    card_join_sub:         "Someone sent you a code — enter it to share your location and vote",
    label_join_name:       "Your name",
    label_session_code:    "Session code",
    ph_session_code:       "ABC123",
    btn_join_session:      "Join with a code →",
    btn_enter_code:        "Enter code →",
    // Share step
    share_label:           "Share with your group",
    share_hint:            "Anyone with the link can drop their pin.",
    btn_copy_link:         "Copy link",
    btn_lets_go:           "Let's go →",
    welcome_note:          "Your location is never required. It vanishes when the session ends.",
    // Session header
    btn_leave_session:     "Exit",
    // Code panel
    panel_code_title:      "Session code",
    panel_code_sub:        "Share with friends",
    copy_hint:             "Click to copy",
    // Location panel
    step_1:                "Step 1",
    panel_location:        "Your location",
    ph_address:            "Type an address…",
    btn_use_gps:           "Use GPS",
    btn_confirm_location:  "Confirm location",
    pin_drop_hint:         "Or tap the map to drop a pin",
    loc_finding:           "Finding your location…",
    loc_locating:          "Locating…",
    loc_set:               label => `✓ Set: ${label}`,
    // Participants panel
    step_2:                "Step 2",
    panel_participants:    "Participants",
    empty_waiting:         "Waiting for participants…",
    no_location_set:       "No location set",
    user_you:              "(you)",
    // Find places panel
    step_3:                "Step 3",
    panel_find_places:     "Find places",
    search_radius:         "Search radius",
    btn_find_places:       "Find places nearby",
    loading_text:          "Searching the neighbourhood…",
    // Vote panel
    step_4:                "Step 4",
    panel_vote:            "Vote for a place",
    empty_places:          "Search for places to see results here.",
    btn_vote:              "Vote",
    btn_voted:             "✓ Voted",
    top_pick:              "Top pick",
    from_midpoint:         "from midpoint",
    btn_share_result:      "Share the result",
    // Result
    result_label:          "Result",
    result_winner:         "We have a winner",
    btn_open_maps:         "Open in Maps",
    result_decided:        "Decided at",
    // Status / misc
    status_connecting:     "Connecting…",
    sheet_tap:             "Tap to open",
    midpoint_label:        "Midpoint",
    // Categories
    cat_food:              "Food",
    cat_cafe:              "Café",
    cat_drink:             "Bars",
    cat_gym:               "Gym",
    cat_park:              "Parks",
    cat_culture:           "Culture",
    // Toasts
    toast_link_copied:     "Link copied!",
    toast_code_copied:     "Link copied — send it to your group!",
    toast_location_saved:  "Got it, you're on the map!",
    toast_voted:           "Voted!",
    toast_session_full:    "This session is full",
    toast_gps_unavailable: "GPS isn't available in this browser — try typing your address instead",
    toast_gps_failed:      "Couldn't get your GPS — just type your address above.",
    toast_no_category:     "Pick at least one category to search",
    toast_vote_error:      "Couldn't update your vote — please try again",
    toast_vote_save_error: "Couldn't save your vote — please try again",
    toast_places_error:    "Something went wrong fetching places — check your connection and try again",
    toast_share_error:     "Couldn't open share sheet — link copied instead",
    toast_result_copied:   "Result copied — paste it anywhere!",
    toast_join_error:      "Please enter a valid 6-character code",
    // Dynamic (functions)
    sheet_places:          (n, w, tot) => `${n} place${n !== 1 ? 's' : ''} found · ${w}/${tot} ready`,
    sheet_users:           (w, tot) => `${w} of ${tot} location${tot !== 1 ? 's' : ''} shared`,
    online_count:          n => `${n} ${n !== 1 ? 'people' : 'person'} connected`,
    status_online:         n => `Online · ${n} ${n !== 1 ? 'people' : 'person'} connected`,
    search_waiting:        n => `Waiting for ${n} more ${n !== 1 ? 'people' : 'person'} to share their location`,
    search_ready:          n => `Find places nearby (${n} locations)`,
    toast_places_found:    n => `Found ${n} place${n !== 1 ? 's' : ''} — take a look!`,
    votes_count:           n => `${n} vote${n !== 1 ? 's' : ''}`,
    result_stats:          (v, p) => `${v} vote${v !== 1 ? 's' : ''} · ${p} participant${p !== 1 ? 's' : ''}`,
    share_meeting_prefix:  "We're meeting at",
    share_found_with:      "Found with Amichemin —",
    share_meeting_title:   name => `Meeting at ${name}`,
  },
};

// ─────────────────────────────────────────────────────────────
//  I18N HELPERS
// ─────────────────────────────────────────────────────────────
let lang = 'fr'; // overridden by detectLang at bottom

function t(key) {
  const val = TRANSLATIONS[lang]?.[key];
  if (val !== undefined && typeof val !== 'function') return val;
  const fb = TRANSLATIONS.fr[key];
  return (fb !== undefined && typeof fb !== 'function') ? fb : key;
}

function tf(key, ...args) {
  const val = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.fr[key];
  return typeof val === 'function' ? val(...args) : (val ?? key);
}

function setLang(newLang) {
  if (!TRANSLATIONS[newLang]) return;
  lang = newLang;
  localStorage.setItem('amichemin_lang', newLang);
  document.documentElement.lang = newLang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = TRANSLATIONS[lang][el.dataset.i18n];
    if (val !== undefined && typeof val !== 'function') el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = TRANSLATIONS[lang][el.dataset.i18nPlaceholder];
    if (val !== undefined) el.placeholder = val;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const val = TRANSLATIONS[lang][el.dataset.i18nAria];
    if (val !== undefined) el.setAttribute('aria-label', val);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Refresh dynamic session UI if a session is active
  if (sessionId) {
    buildFilters();
    updateSheetSummary();
    if (sessionData) {
      const count = sessionData.users.length;
      document.getElementById('online-count').textContent = tf('online_count', count);
      document.getElementById('status-text').textContent  = tf('status_online', count);
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'food',    icon: '🍽', query: 'restaurant|fast_food|bakery',  osmKey: 'amenity' },
  { id: 'cafe',    icon: '☕', query: 'cafe',                          osmKey: 'amenity' },
  { id: 'drink',   icon: '🍺', query: 'bar|pub|biergarten',           osmKey: 'amenity' },
  { id: 'gym',     icon: '🏋', query: 'fitness_centre|sports_centre', osmKey: 'leisure' },
  { id: 'park',    icon: '🌿', query: 'park',                         osmKey: 'leisure' },
  { id: 'culture', icon: '🎭', query: 'theatre|cinema|museum',        osmKey: 'amenity' },
];

let searchRadius = 1500;
const MAX_PLACES      = 20;
const MAX_PARTICIPANTS = 50;
const SYNC_INTERVAL   = 3000;

// ─────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────
let sessionId      = null;
let myUserId       = null;
let myName         = '';
let meetName       = '';
let myCoords       = null;
let pendingCoords  = null;
let map            = null;
let pinDropMarker  = null;
let userMarkers    = {};
let midpointMarker = null;
let placeMarkers   = [];
let activeFilters  = new Set(['food']);
let pollInterval   = null;
let addrDebounce   = null;
let sessionData    = null;
let lastVotedPlace = null;
let heartbeatInterval = null;
let sessionUnsub   = null;
let mapFitted      = false;
let radiusCircle   = null;
let suggestionAbort = null;
let locatedCount   = 0;

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
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  localStorage.setItem('amichemin_name', name);
  sessionStorage.setItem('amichemin_session', JSON.stringify({ sessionId, myUserId, myName, meetName }));
  history.pushState({ sessionId }, '', '?s=' + sessionId);

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
    .then(() => showToast(t('toast_link_copied')))
    .catch(() => {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast(t('toast_link_copied'));
    });
}

function joinSession() {
  const code = document.getElementById('join-code-input').value.trim().toUpperCase();
  const name = document.getElementById('name-join').value.trim() || 'Anonymous';
  if (!code || code.length !== 6) { showToast(t('toast_join_error')); return; }
  myName    = name;
  myUserId  = genUserId();
  sessionId = code;
  localStorage.setItem('amichemin_name', name);
  sessionStorage.setItem('amichemin_session', JSON.stringify({ sessionId, myUserId, myName }));
  history.pushState({ sessionId }, '', '?s=' + sessionId);
  initSessionScreen();
}

async function initSessionScreen() {
  document.getElementById('screen-welcome').classList.remove('active');
  document.getElementById('screen-session').classList.add('active');

  document.getElementById('code-display').innerHTML =
    sessionId + `<span class="copy-hint">${t('copy_hint')}</span>`;
  const badge = document.getElementById('header-code-badge');
  badge.textContent = meetName ? `${meetName} · ${sessionId}` : sessionId;
  badge.style.display = 'inline';

  buildFilters();
  initMap();

  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    const fab     = document.getElementById('fab-btn');
    if (sidebar) sidebar.classList.add('is-open');
    if (fab) fab.textContent = '✕';
  }

  setTimeout(() => { if (map) map.invalidateSize(); }, 50);

  mapFitted = false;

  const snapshot = await db.ref(sessionPath('users')).get();
  const currentCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
  if (currentCount >= MAX_PARTICIPANTS) {
    showToast(t('toast_session_full'));
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
  setTimeout(() => { if (map) map.invalidateSize(); }, 360);
}

function updateSheetSummary() {
  const el = document.getElementById('sheet-summary');
  if (!el) return;
  const users  = sessionData ? Object.values(sessionData.users  || {}) : [];
  const places = sessionData ? Object.values(sessionData.places || {}) : [];
  const withLoc = users.filter(u => u.coords).length;
  if (places.length) {
    el.textContent = tf('sheet_places', places.length, withLoc, users.length);
  } else if (users.length) {
    el.textContent = tf('sheet_users', withLoc, users.length);
  } else {
    el.textContent = t('sheet_tap');
  }
}

function leaveSession() {
  clearInterval(heartbeatInterval);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  if (sessionUnsub) { sessionUnsub(); sessionUnsub = null; }

  history.pushState({}, '', location.pathname);

  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.remove('is-open');
  const fab = document.getElementById('fab-btn');
  if (fab) fab.textContent = '☰';

  if (sessionId && myUserId) {
    const ref = db.ref(sessionPath('users', myUserId));
    ref.onDisconnect().cancel();
    ref.remove();
  }
  sessionStorage.removeItem('amichemin_session');

  sessionId      = null;
  meetName       = '';
  myCoords       = null;
  pendingCoords  = null;
  lastVotedPlace = null;
  sessionData    = null;
  locatedCount   = 0;

  if (pinDropMarker) { pinDropMarker.remove(); pinDropMarker = null; }
  if (map) { map.remove(); map = null; }
  Object.values(userMarkers).forEach(m => m.remove());
  userMarkers = {};
  placeMarkers.forEach(m => m.remove());
  placeMarkers = [];
  if (midpointMarker) { midpointMarker.remove(); midpointMarker = null; }
  if (radiusCircle)   { radiusCircle.remove();   radiusCircle = null; }

  document.getElementById('screen-session').classList.remove('active');
  document.getElementById('screen-welcome').classList.add('active');
  document.getElementById('addr-input').value = '';
  document.getElementById('loc-status').textContent = '';
  document.getElementById('place-list').style.display = '';
  document.getElementById('place-list').innerHTML =
    `<div class="empty-state">${t('empty_places')}</div>`;
  document.getElementById('result-panel-content').style.display = 'none';
  document.getElementById('result-panel-content').innerHTML = '';
  document.getElementById('results-panel-step').textContent = t('step_4');
  document.getElementById('results-panel-heading').textContent = t('panel_vote');
  document.getElementById('user-list').innerHTML =
    `<div class="empty-state">${t('empty_waiting')}</div>`;
}

// ─────────────────────────────────────────────────────────────
//  STORAGE — push / pull
// ─────────────────────────────────────────────────────────────
async function pushMyUser() {
  if (!sessionId || !myUserId) return;
  try {
    const ref = db.ref(sessionPath('users', myUserId));
    await ref.onDisconnect().remove();
    await ref.set({ id: myUserId, name: myName, coords: myCoords || null, ts: Date.now() });
  } catch(e) { console.warn('pushMyUser failed', e); }
}

function startHeartbeat() {
  clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(pushMyUser, 30000);
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
    document.getElementById('online-count').textContent = tf('online_count', count);
    document.getElementById('status-text').textContent  = tf('status_online', count);
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
    list.innerHTML = `<div class="empty-state">${t('empty_waiting')}</div>`;
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
        <div class="user-name">${escapeHtml(u.name)}${isMe ? ` <span style="color:var(--muted);font-weight:400;">${t('user_you')}</span>` : ''}</div>
        <div class="user-loc">${u.coords ? '📍 ' + escapeHtml(u.coords.label || t('panel_location')) : t('no_location_set')}</div>
      </div>
    `;
    list.appendChild(div);
  });
}

function updateSearchBtn(users) {
  const located = users.filter(u => u.coords).length;
  const btn = document.getElementById('search-btn');
  btn.disabled = located < 2;
  btn.textContent = located < 2
    ? tf('search_waiting', 2 - located)
    : tf('search_ready', located);
}

function buildFilters() {
  const row = document.getElementById('filters-row');
  row.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const tag = document.createElement('div');
    tag.className = 'filter-tag' + (activeFilters.has(cat.id) ? ' active' : '');
    tag.dataset.id = cat.id;
    tag.innerHTML = `<span class="icon">${cat.icon}</span>${t('cat_' + cat.id)}`;
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
    list.innerHTML = `<div class="empty-state">${t('empty_places')}</div>`;
    return;
  }

  const maxVotes = Math.max(1, ...Object.values(votes));

  const sorted = [...places].sort((a, b) => {
    const vd = (votes[b.id] || 0) - (votes[a.id] || 0);
    if (vd !== 0) return vd;
    return a.dist - b.dist;
  });

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
      ${isWinner ? `<span class="winner-crown">${t('top_pick')}</span>` : ''}
      <div class="place-name">${p.catIcon} ${escapeHtml(p.name)}</div>
      <div class="place-meta">${escapeHtml(p.type.replace(/_/g, ' '))}${p.addr ? ' · ' + escapeHtml(p.addr) : ''}</div>
      <div class="place-dist">${distStr} ${t('from_midpoint')}</div>
      ${extraInfo ? `<div class="place-extra">${extraInfo}</div>` : ''}
      <div class="vote-row">
        <button class="btn sm ${hasVoted ? 'primary' : ''}" data-id="${p.id}" onclick="vote('${p.id}')">
          ${hasVoted ? t('btn_voted') : t('btn_vote')}
        </button>
        <div class="vote-bar-wrap">
          <div class="vote-bar" style="width:${pct}%"></div>
        </div>
        <span class="vote-count">${tf('votes_count', v)}</span>
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
      shareBtn.textContent = t('btn_share_result');
      shareBtn.addEventListener('click', () => shareResult(p));
      list.appendChild(shareBtn);
    }
  });
}

async function shareResult(place) {
  const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(place.name + (place.addr ? ', ' + place.addr : ''))}`;
  const appUrl  = location.origin + location.pathname + (sessionId ? '?s=' + sessionId : '');
  const summary = [
    `${t('share_meeting_prefix')} ${place.name}`,
    place.addr ? place.addr : null,
    mapsUrl,
    `${t('share_found_with')} ${appUrl}`,
  ].filter(Boolean).join('\n');

  if (navigator.share) {
    try {
      await navigator.share({ title: tf('share_meeting_title', place.name), text: summary });
    } catch (e) {
      if (e.name !== 'AbortError') showToast(t('toast_share_error'));
      else return;
    }
  } else {
    try {
      await navigator.clipboard.writeText(summary);
      showToast(t('toast_result_copied'));
    } catch {
      showToast(summary, 6000);
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  SESSION SUMMARY — write & render
// ─────────────────────────────────────────────────────────────
async function maybeWriteSummary(places, votes, users) {
  if (!places || !places.length) return;

  const sorted     = [...places].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
  const winner     = sorted[0];
  const topVotes   = votes[winner.id] || 0;
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
    await db.ref(sessionPath('summary')).transaction(current => current === null ? summary : undefined);
  } catch (e) {
    console.warn('Could not write session summary', e);
  }
}

function renderResult(summary) {
  document.getElementById('results-panel-step').textContent    = t('result_label');
  document.getElementById('results-panel-heading').textContent = t('result_winner');

  document.getElementById('place-list').style.display = 'none';
  const el = document.getElementById('result-panel-content');
  el.style.display = 'block';

  const distStr  = summary.distFromMidpoint < 1000
    ? summary.distFromMidpoint + 'm'
    : (summary.distFromMidpoint / 1000).toFixed(1) + 'km';

  const topVotes = Math.max(...Object.values(summary.voteBreakdown || {}), 0);

  el.innerHTML = `
    <div class="result-card">
      <div class="result-name">${escapeHtml(summary.placeName)}</div>
      ${summary.placeAddr ? `<div class="result-addr">${escapeHtml(summary.placeAddr)}</div>` : ''}
      <div class="result-dist">${distStr} ${t('from_midpoint')}</div>
      <div class="result-votes">${tf('result_stats', topVotes, summary.participantCount)}</div>
      <a class="btn primary full result-maps-btn" href="${escapeHtml(summary.mapsUrl)}" target="_blank" rel="noopener">
        ${t('btn_open_maps')}
      </a>
    </div>
    <p class="result-timestamp">${t('result_decided')} ${new Date(summary.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
  `;
}

// ─────────────────────────────────────────────────────────────
//  MAP MARKERS
// ─────────────────────────────────────────────────────────────
function updateMapMarkers(users) {
  Object.values(userMarkers).forEach(m => m.remove());
  userMarkers = {};

  const located = users.filter(u => u.coords);

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
      .bindTooltip(t('midpoint_label'), { permanent: true });

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
        <strong style="font-family:Inter,sans-serif;">${p.name}</strong><br>
        <small style="font-family:ui-monospace,monospace;color:#7a7870;">
          ${p.type.replace(/_/g, ' ')} · ${distStr} ${t('from_midpoint')}
        </small>
        ${popupDetails ? `<div style="margin-top:5px;font-size:11px;font-family:ui-monospace,monospace;line-height:1.8;">${popupDetails}</div>` : ''}
        <div style="margin-top:5px;font-size:11px;font-family:ui-monospace,monospace;">${links}</div>
      `);
    placeMarkers.push(m);
  });
}

// ─────────────────────────────────────────────────────────────
//  LOCATION — GPS & GEOCODING
// ─────────────────────────────────────────────────────────────
function useGPS() {
  if (!navigator.geolocation) {
    showToast(t('toast_gps_unavailable'));
    return;
  }
  document.getElementById('loc-status').textContent = t('loc_finding');
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
      document.getElementById('loc-status').textContent = t('toast_gps_failed');
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
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Amichemin/1.0' } }
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
  if (myCoords) return;
  const { lat, lng } = e.latlng;

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

  document.getElementById('loc-status').textContent = t('loc_locating');
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
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Amichemin/1.0' }, signal: suggestionAbort.signal }
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
    if (e.name === 'AbortError') return;
    console.warn('fetchSuggestions failed', e);
    captureApiError(e, 'nominatim', { operation: 'autocomplete' });
  }
}

async function setMyLocation() {
  if (!pendingCoords) return;
  myCoords = pendingCoords;
  document.getElementById('loc-status').textContent = tf('loc_set', myCoords.label);
  document.getElementById('confirm-loc-btn').disabled = true;

  if (pinDropMarker) { pinDropMarker.remove(); pinDropMarker = null; }
  document.getElementById('map').classList.remove('map--pin-mode');

  await pushMyUser();
  showToast(t('toast_location_saved'));
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
    showToast(t('toast_no_category'));
    return;
  }

  const loadingEl = document.getElementById('map-loading');
  loadingEl.style.display = 'flex';

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
    showToast(tf('toast_places_found', places.length));
  } catch (e) {
    showToast(t('toast_places_error'));
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
      showToast(t('toast_vote_error'));
      return;
    }
  }
  lastVotedPlace = placeId;
  try {
    await fbSet(sessionPath('votes', myUserId), { placeId, userId: myUserId, ts: Date.now() });
    showToast(t('toast_voted'));
  } catch (e) {
    captureApiError(e, 'firebase', { operation: 'set_vote', placeId });
    showToast(t('toast_vote_save_error'));
    lastVotedPlace = null;
  }
}

// ─────────────────────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────────────────────
function copyCode() {
  const url = location.origin + location.pathname + '?s=' + sessionId;
  navigator.clipboard.writeText(url)
    .then(() => showToast(t('toast_code_copied')))
    .catch(() => showToast(url));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  return (s.startsWith('https://') || s.startsWith('http://')) ? s : null;
}

document.addEventListener('click', e => {
  const input = document.getElementById('addr-input');
  const list  = document.getElementById('suggestion-list');
  if (input && list && !input.contains(e.target) && !list.contains(e.target)) {
    list.style.display = 'none';
  }
});

// ─────────────────────────────────────────────────────────────
//  LANGUAGE DETECTION
// ─────────────────────────────────────────────────────────────
(function detectLang() {
  const stored = localStorage.getItem('amichemin_lang');
  lang = (stored && TRANSLATIONS[stored]) ? stored
       : (navigator.language?.startsWith('fr') ? 'fr' : 'fr');
  setLang(lang);
})();

// ─────────────────────────────────────────────────────────────
//  URL-BASED SESSION DETECTION
//  Handles direct links: amichemin.app/?s=ABC123
// ─────────────────────────────────────────────────────────────
(function detectSessionFromUrl() {
  const code = new URLSearchParams(location.search).get('s');
  if (!code) return;
  const upper = code.toUpperCase();
  history.replaceState({}, '', '?s=' + upper);

  const stored = sessionStorage.getItem('amichemin_session');
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
      if (parsed.sessionId && parsed.myUserId) {
        db.ref(`sessions/${parsed.sessionId}/users/${parsed.myUserId}`).remove().catch(() => {});
      }
      sessionStorage.removeItem('amichemin_session');
    } catch (e) { /* corrupted storage */ }
  }

  const savedName = localStorage.getItem('amichemin_name');
  if (savedName) {
    myName    = savedName;
    myUserId  = genUserId();
    sessionId = upper;
    sessionStorage.setItem('amichemin_session', JSON.stringify({ sessionId: upper, myUserId, myName }));
    initSessionScreen();
  } else {
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
