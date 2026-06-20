import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Kendi Firebase yapılandırma bilgilerinizi buraya girin.
// Firebase Console'dan projenize web uygulaması ekleyerek bu bilgileri alabilirsiniz.
const firebaseConfig = {
  apiKey: "AIzaSyAMRrA7hDgRzX9ktOKJiYDrWpYT844or_o",
  authDomain: "boardgame-57b061.firebaseapp.com",
  databaseURL: "https://boardgame-57b061-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "boardgame-57b061",
  storageBucket: "boardgame-57b061.firebasestorage.app",
  messagingSenderId: "92097215918",
  appId: "1:92097215918:web:c1208976011c39b40b9c3f",
  measurementId: "G-1GF09JWZK2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
