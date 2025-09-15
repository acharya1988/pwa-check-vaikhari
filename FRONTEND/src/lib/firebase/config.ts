

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAD2jh3X1tljD4EwDEq2y0jyY8UP7Of5jg",
  authDomain: "vakyaverse.firebaseapp.com",
  databaseURL: "https://vakyaverse-default-rtdb.firebaseio.com",
  projectId: "vakyaverse",
  storageBucket: "vakyaverse.appspot.com",
  messagingSenderId: "378458540928",
  appId: "1:378458540928:web:1862db06516ec36f960f65"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;

