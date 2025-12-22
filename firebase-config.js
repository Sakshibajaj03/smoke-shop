// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_5GzgR9_reRBAfJ_JHOVvTRoU4V41vWQ",
  authDomain: "smoke-shop-adf08.firebaseapp.com",
  projectId: "smoke-shop-adf08",
  storageBucket: "smoke-shop-adf08.firebasestorage.app",
  messagingSenderId: "8721243916",
  appId: "1:8721243916:web:57254e2b8838bda485f329"
};

// Initialize Firebase (using compat mode for script tags)
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const db = firebase.firestore();
const storage = firebase.storage();



