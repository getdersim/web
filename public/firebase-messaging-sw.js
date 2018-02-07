// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyAnI8whawVkwgJQ73moU4HHiOIehVaofVs",
  authDomain: "getdersim.firebaseapp.com",
  databaseURL: "https://getdersim.firebaseio.com",
  projectId: "getdersim",
  storageBucket: "getdersim.appspot.com",
  messagingSenderId: "28031381946"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
