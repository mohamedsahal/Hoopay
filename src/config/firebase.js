import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration (from google-services.json)
const firebaseConfig = {
  apiKey: "AIzaSyAxHx7CleoEhe3lDoOervZncsUik0qdMN0",
  authDomain: "hoopay-ef6ae.firebaseapp.com",
  projectId: "hoopay-ef6ae",
  storageBucket: "hoopay-ef6ae.firebasestorage.app",
  messagingSenderId: "121937300304",
  appId: "1:121937300304:android:d89dedb7a263c386103a55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize basic Auth (no Google OAuth)
const auth = getAuth(app);

console.log('🔥 Firebase initialized without Google Auth');

export { auth };
export default app; 