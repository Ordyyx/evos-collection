/**
 * Firebase Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or use existing)
 * 3. Add a web app to your project
 * 4. Copy your config values below
 * 5. Enable Authentication > Google provider
 * 6. Enable Firestore Database
 */

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyASTEspHgYOv2UKQtpshegcdTvD1nVpyms",
  authDomain: "evos-collection.firebaseapp.com",
  projectId: "evos-collection",
  storageBucket: "evos-collection.firebasestorage.app",
  messagingSenderId: "547871879077",
  appId: "1:547871879077:web:d0ac928a3025f63266c24c",
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Initialize app
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Collection reference
const vinylsCollection = collection(db, "vinyls");

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Sign in with Google
 */
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign out
 */
async function logOut() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current user
 */
function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 */
function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ============================================
// FIRESTORE CRUD FUNCTIONS
// ============================================

/**
 * Get all vinyls (one-time fetch)
 */
async function getAllVinyls() {
  try {
    const q = query(vinylsCollection, orderBy("artist", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching vinyls:", error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates
 */
function subscribeToVinyls(callback) {
  const q = query(vinylsCollection, orderBy("artist", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const vinyls = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(vinyls);
    },
    (error) => {
      console.error("Subscription error:", error);
    },
  );
}

/**
 * Get single vinyl by ID
 */
async function getVinylById(id) {
  try {
    const docRef = doc(db, "vinyls", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching vinyl:", error);
    throw error;
  }
}

/**
 * Add new vinyl
 */
async function addVinyl(vinylData) {
  try {
    const dataWithTimestamp = {
      ...vinylData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(vinylsCollection, dataWithTimestamp);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding vinyl:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update existing vinyl
 */
async function updateVinyl(id, vinylData) {
  try {
    const docRef = doc(db, "vinyls", id);
    const dataWithTimestamp = {
      ...vinylData,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(docRef, dataWithTimestamp);
    return { success: true };
  } catch (error) {
    console.error("Error updating vinyl:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete vinyl
 */
async function deleteVinyl(id) {
  try {
    const docRef = doc(db, "vinyls", id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting vinyl:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Import collection from JSON array
 */
async function importCollection(jsonArray) {
  const results = [];
  for (const vinyl of jsonArray) {
    const result = await addVinyl(vinyl);
    results.push(result);
  }
  return results;
}

// Export all functions
export {
  // Auth
  signInWithGoogle,
  logOut,
  getCurrentUser,
  onAuthChange,
  // Firestore
  getAllVinyls,
  subscribeToVinyls,
  getVinylById,
  addVinyl,
  updateVinyl,
  deleteVinyl,
  importCollection,
  // References
  db,
  auth,
};
