import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// This config is safe to keep in client-side code — it identifies your
// Firebase project publicly, it is not a secret credential. Real access
// control is enforced by Firestore security rules (see README).
const firebaseConfig = {
  apiKey: "AIzaSyDrwcTWP6_aHVdGKzamrTgmv5dzb4_ktu8",
  authDomain: "word-garden-49fd2.firebaseapp.com",
  projectId: "word-garden-49fd2",
  storageBucket: "word-garden-49fd2.firebasestorage.app",
  messagingSenderId: "1016121627663",
  appId: "1:1016121627663:web:545e1f3da725012077bf7a",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function signOutUser() {
  return signOut(auth);
}

const GARDEN_DOC = "gardens";

export async function loadGardenState(uid) {
  const ref = doc(db, GARDEN_DOC, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveGardenState(uid, state) {
  const ref = doc(db, GARDEN_DOC, uid);
  await setDoc(ref, state, { merge: false });
}
