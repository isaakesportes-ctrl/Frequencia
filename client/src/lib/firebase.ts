import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBjsvmUe8rpc30VDiYPetcdpXXw0-udsFw",
  authDomain: "frequencia-df542.firebaseapp.com",
  projectId: "frequencia-df542",
  storageBucket: "frequencia-df542.firebasestorage.app",
  messagingSenderId: "578138293176",
  appId: "1:578138293176:web:26af5e4fc47ceca415854d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
