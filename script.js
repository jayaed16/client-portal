// script.js
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// ---- growth-minded constant: all reads/writes go through this ----
const CURRENT_SITE_ID = "test-site-1"; // later: get from URL, user roles, etc.

// ---- DOM elements ----
const topbarEl = document.getElementById("topbar");
const centerWrapperEl = document.getElementById("center-wrapper");
const loginCardEl = document.getElementById("login-card");
const editorLayoutEl = document.getElementById("editor-layout");

const loginFormEl = document.getElementById("login-form");
const loginEmailEl = document.getElementById("login-email");
const loginPasswordEl = document.getElementById("login-password");
const loginErrorEl = document.getElementById("login-error");

const logoutBtn = document.getElementById("logout-btn");
const userEmailEl = document.getElementById("user-email");

const heroHeadlineEl = document.getElementById("hero-headline");
const heroSubtextEl = document.getElementById("hero-subtext");
const heroButtonTextEl = document.getElementById("hero-button-text");
const saveBtn = document.getElementById("save-btn");
const saveStatusEl = document.getElementById("save-status");

const previewHeadlineEl = document.getElementById("preview-headline");
const previewSubtextEl = document.getElementById("preview-subtext");
const previewButtonEl = document.getElementById("preview-button");

// Firestore doc for this site
function siteDocRef(siteId) {
  // v1: one doc per site
  // later: you can add owners, roles, etc. here
  return doc(db, "sites", siteId);
}

// ---- Auth state ----

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showLogin();
    return;
  }

  userEmailEl.textContent = user.email || "";
  showEditor();

  // Load hero content for CURRENT_SITE_ID
  await loadHero(CURRENT_SITE_ID);
});

// ---- UI state helpers ----

function showLogin() {
  topbarEl.classList.add("hidden");
  editorLayoutEl.classList.add("hidden");
  loginCardEl.classList.remove("hidden");
}

function showEditor() {
  topbarEl.classList.remove("hidden");
  editorLayoutEl.classList.remove("hidden");
  loginCardEl.classList.add("hidden");
}

// ---- Login form ----

loginFormEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginErrorEl.classList.add("hidden");
  loginErrorEl.textContent = "";

  const email = loginEmailEl.value.trim();
  const password = loginPasswordEl.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginPasswordEl.value = "";
  } catch (err) {
    console.error(err);
    loginErrorEl.textContent = "Login failed. Check your email and password.";
    loginErrorEl.classList.remove("hidden");
  }
});

// ---- Logout ----

logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// ---- Load hero content ----

async function loadHero(siteId) {
  saveStatusEl.textContent = "Loading…";
  try {
    const ref = siteDocRef(siteId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      const hero = data.hero || {};
      heroHeadlineEl.value = hero.headline || "";
      heroSubtextEl.value = hero.subtext || "";
      heroButtonTextEl.value = hero.buttonText || "";
      updatePreview();
      saveStatusEl.textContent = "";
    } else {
      // If no doc yet, clear fields
      heroHeadlineEl.value = "";
      heroSubtextEl.value = "";
      heroButtonTextEl.value = "";
      updatePreview();
      saveStatusEl.textContent = "";
    }
  } catch (err) {
    console.error(err);
    saveStatusEl.textContent = "Error loading content";
  }
}

// ---- Save hero content ----

saveBtn.addEventListener("click", async () => {
  saveStatusEl.textContent = "Saving…";
  saveBtn.disabled = true;
  try {
    const ref = siteDocRef(CURRENT_SITE_ID);

    // v1: single "hero" object
    // later: add "heroDraft" vs "heroPublished" for publish workflow
    await setDoc(
      ref,
      {
        hero: {
          headline: heroHeadlineEl.value.trim(),
          subtext: heroSubtextEl.value.trim(),
          buttonText: heroButtonTextEl.value.trim(),
        },
      },
      { merge: true }
    );

    saveStatusEl.textContent = "Saved";
  } catch (err) {
    console.error(err);
    saveStatusEl.textContent = "Error saving";
  } finally {
    saveBtn.disabled = false;
    setTimeout(() => {
      if (saveStatusEl.textContent === "Saved") {
        saveStatusEl.textContent = "";
      }
    }, 1500);
  }
});

// ---- Live preview ----

function updatePreview() {
  const h = heroHeadlineEl.value.trim();
  const s = heroSubtextEl.value.trim();
  const b = heroButtonTextEl.value.trim();

  previewHeadlineEl.textContent =
    h || "Your headline will appear here";
  previewSubtextEl.textContent =
    s ||
    "Use this space to explain what you do in one or two sentences.";
  previewButtonEl.textContent = b || "Primary action";
}

heroHeadlineEl.addEventListener("input", updatePreview);
heroSubtextEl.addEventListener("input", updatePreview);
heroButtonTextEl.addEventListener("input", updatePreview);
