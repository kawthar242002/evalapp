import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBxUTXjbmNy-3H8pkuedcZOii-IlURSl20",
  authDomain: "evalapp-c4611.firebaseapp.com",
  projectId: "evalapp-c4611",
  storageBucket: "evalapp-c4611.firebasestorage.app",
  messagingSenderId: "715335484191",
  appId: "1:715335484191:web:c09a47b46ea4983022a62a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);