import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD3OYvC8cXUCkgbhRARE62ZJHo_SkoQGYE",
  authDomain: "peloapelo-13354.firebaseapp.com",
  projectId: "peloapelo-13354",
  storageBucket: "peloapelo-13354.firebasestorage.app",
  messagingSenderId: "150124253901",
  appId: "1:150124253901:web:4e6f9f24027d596119cf84",
  measurementId: "G-2Z30ZTZQCV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);