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

// Safe Firebase initialization with error handling
let app = null;
let auth = null;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize basic Auth (no Google OAuth)
  auth = getAuth(app);
  
  console.log('🔥 Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.warn('🚨 App will continue without Firebase features');
}

export { auth };
export default app; 