// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuqEph59tw9Dhsjk3gqY6q69KY07RYG38",
  authDomain: "jed-client-portal.firebaseapp.com",
  projectId: "jed-client-portal",
  storageBucket: "jed-client-portal.firebasestorage.app",
  messagingSenderId: "397466183421",
  appId: "1:397466183421:web:2878ca752e84ec186c0094"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
