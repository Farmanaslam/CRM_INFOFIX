
import { initializeApp } from 'firebase/app';
import { getFirestore, setLogLevel, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDjSrAR7VH6waSwdURVbn4Rl2emQkXJmq8",
  authDomain: "infofix-services.firebaseapp.com",
  projectId: "infofix-services",
  storageBucket: "infofix-services.firebasestorage.app",
  messagingSenderId: "66762039428",
  appId: "1:66762039428:web:780bba05c72acbf06222d1",
  measurementId: "G-J6N1BZEJ5W"
};

// Logic to check if the user has actually configured Firebase
const isFirebaseConfigured = firebaseConfig.projectId !== "YOUR_PROJECT_ID";

let app;
let db = null;
let analytics = null;

if (isFirebaseConfigured) {
  try {
    // Suppress verbose connection errors in console
    setLogLevel('silent'); 

    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    
    // Enable Offline Persistence
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time.
            console.warn('Firestore persistence failed: multiple tabs open');
        } else if (err.code === 'unimplemented') {
            // The current browser does not support all of the features required to enable persistence
            console.warn('Firestore persistence failed: browser not supported');
        }
    });
    
    try {
        analytics = getAnalytics(app);
    } catch(e) {}
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.warn("Firebase configuration is missing or using placeholders. Falling back to Local Storage mode.");
}

export { db, isFirebaseConfigured, analytics };
