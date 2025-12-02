import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from "firebase/firestore";


import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;
let db;
let storage;
let initError = null;

try {
    const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

    if (missingKeys.length > 0) {
        const msg = `Missing Firebase config keys: ${missingKeys.join(', ')}`;
        console.error(msg);
        initError = new Error(msg);
    } else {
        // Check if firebase app is already initialized (prevents HMR errors)
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
            // Initialize Firestore with long polling and specific database ID 'calorietracker3'
            db = initializeFirestore(app, {
                experimentalForceLongPolling: true,
            }, 'calorietracker3');
        } else {
            app = getApp();
            db = getFirestore(app, 'calorietracker3');
        }

        auth = getAuth(app);
        storage = getStorage(app);
        console.log("Firebase initialized successfully");
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
    initError = error;
}

// Connection Test Function
const checkConnection = async () => {
    try {
        if (initError) throw initError;
        if (!db) throw new Error("Firestore not initialized (Unknown reason)");

        // Log initialization status
        console.log("Firebase App Initialized:", !!app);
        console.log("Firestore Initialized:", !!db);
        console.log("Auth Initialized:", !!auth);

        return { success: true, message: "Firebase initialized locally" };
    } catch (error) {
        console.error("Connection check failed:", error);
        return { success: false, message: error.message };
    }
};

export { auth, db, storage, checkConnection };
