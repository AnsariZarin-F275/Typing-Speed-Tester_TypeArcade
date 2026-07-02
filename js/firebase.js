import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB703q9_CDKDivZtWFR4g4oK97OgDEMm4",
  authDomain: "typingspeedtester-typearcade.firebaseapp.com",
  projectId: "typingspeedtester-typearcade",
  storageBucket: "typingspeedtester-typearcade.firebasestorage.app",
  messagingSenderId: "600430352107",
  appId: "1:600430352107:web:8e7d84a0601b864add10ae"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit
};