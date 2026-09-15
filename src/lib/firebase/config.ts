
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore"; 
import { FirebaseStorage, getStorage } from "firebase/storage";

// Strip accidental surrounding quotes from .env values (e.g. KEY="value").
// Keep direct process.env.NEXT_PUBLIC_* access so Next can inline them in the client bundle.
const stripQuotes = (value?: string) => value?.replace(/^["']|["']$/g, "");

const firebaseConfig = {
  apiKey: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || "placeholder-api-key",
  authDomain: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || "placeholder.firebaseapp.com",
  projectId: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "placeholder-project",
  storageBucket: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || "placeholder.appspot.com",
  messagingSenderId: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || "123456789",
  appId: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || "1:123456789:web:placeholder",
  // measurementId: stripQuotes(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID), // Uncomment if you need Analytics
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app); 
const storage: FirebaseStorage = getStorage(app);

export { app, auth , db, storage };
