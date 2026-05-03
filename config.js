// ─── SENTRY ───────────────────────────────────────────────────
if (window.Sentry) {
  Sentry.onLoad(function () {
    Sentry.init({
      environment: (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? 'development'
        : 'production',
      release: 'amichemin@1.0.0',
    });
  });
}

const firebaseConfig = {
  apiKey:            'AIzaSyDgem3Y4OkBBQSRULh0OK8bE_WoHLGy4GM',
  authDomain:        'meethalf01.firebaseapp.com',
  databaseURL:       'https://meethalf01-default-rtdb.europe-west1.firebasedatabase.app/',
  projectId:         'meethalf01',
  storageBucket:     'meethalf01.firebasestorage.app',
  messagingSenderId: '28009665769',
  appId:             '1:28009665769:web:33354338a3d41537ae0c78',
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
