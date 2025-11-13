// script.js — PORTAL with draft/published + iframe preview

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

// For now, a single test site
const CURRENT_SITE_ID = "test-site-1";

// 🔽 Live client site base URL (GitHub Pages)
const CLIENT_SITE_BASE_URL =
  "https://jayaed16.github.io/client-site-template";

// -------- DOM refs --------

// Layout / auth
const topbarEl = document.getElementById("topbar");
const loginCardEl = document.getElementById("login-card");
const editorLayoutEl = document.getElementById("editor-layout");

const loginFormEl = document.getElementById("login-form");
const loginEmailEl = document.getElementById("login-email");
const loginPasswordEl = document.getElementById("login-password");
const loginErrorEl = document.getElementById("login-error");

const logoutBtn = document.getElementById("logout-btn");
const userEmailEl = document.getElementById("user-email");

// Editor fields: HOME
const heroHeadlineEl = document.getElementById("hero-headline");
const heroSubtextEl = document.getElementById("hero-subtext");
const heroButtonTextEl = document.getElementById("hero-button-text");

// Editor fields: ABOUT
const aboutHeadingEl = document.getElementById("about-heading");
const aboutBodyEl = document.getElementById("about-body");

// Editor fields: CONTACT
const contactHeadingEl = document.getElementById("contact-heading");
const contactBodyEl = document.getElementById("contact-body");
const contactButtonTextEl = document.getElementById("contact-button-text");

// Save / publish
const saveBtn = document.getElementById("save-btn"); // Save draft
const publishBtn = document.getElementById("publish-btn"); // Publish
const saveStatusEl = document.getElementById("save-status");

// Tabs
const tabButtons = document.querySelectorAll(".editor-tab");
const editorHomeEl = document.getElementById("editor-home");
const editorAboutEl = document.getElementById("editor-about");
const editorContactEl = document.getElementById("editor-contact");

// Iframe preview
const previewFrameEl = document.getElementById("site-preview");
const previewPageLabelEl = document.getElementById("preview-page-label");

// Keep track of which page we’re previewing
let currentPreviewPage = "home"; // "home" | "about" | "contact"

// -------- Helpers --------

function siteDocRef(siteId) {
  return doc(db, "sites", siteId);
}

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

/**
 * Build the structured content object from the form fields
 * This matches the Firestore shape under draft/published.
 */
function getContentFromForm() {
  return {
    hero: {
      headline: heroHeadlineEl.value.trim(),
      subtext: heroSubtextEl.value.trim(),
      buttonText: heroButtonTextEl.value.trim(),
    },
    about: {
      heading: aboutHeadingEl.value.trim(),
      body: aboutBodyEl.value.trim(),
    },
    contact: {
      heading: contactHeadingEl.value.trim(),
      body: contactBodyEl.value.trim(),
      buttonText: contactButtonTextEl.value.trim(),
    },
  };
}

/**
 * Set the iframe URL + label based on page, always in draft preview mode.
 * The client site will read ?mode=draft and use data.draft.*.
 */
function setPreviewPage(page) {
  currentPreviewPage = page;

  let path = "/index.html";
  let label = "Home";

  if (page === "about") {
    path = "/about.html";
    label = "About";
  } else if (page === "contact") {
    path = "/contact.html";
    label = "Contact";
  }

  if (previewFrameEl) {
    const url = new URL(CLIENT_SITE_BASE_URL + path);
    url.searchParams.set("mode", "draft");
    previewFrameEl.src = url.toString();
  }
  if (previewPageLabelEl) {
    previewPageLabelEl.textContent = label;
  }
}

// Reload iframe (called after saving draft)
function refreshPreview() {
  if (previewFrameEl && previewFrameEl.src) {
    const src = previewFrameEl.src;
    previewFrameEl.src = src; // reassign to trigger reload
  }
}

// -------- Auth state --------

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showLogin();
    return;
  }

  userEmailEl.textContent = user.email || "";
  showEditor();
  await loadSite(CURRENT_SITE_ID);

  // Default preview to Home page on login
  setPreviewPage("home");
});

// -------- Login / logout --------

if (loginFormEl) {
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
      loginErrorEl.textContent =
        "Login failed. Check your email and password.";
      loginErrorEl.classList.remove("hidden");
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth);
  });
}

// -------- Load site content into form --------

async function loadSite(siteId) {
  saveStatusEl.textContent = "Loading…";
  try {
    const ref = siteDocRef(siteId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();

      // Prefer draft → then published → then root (for backwards compat)
      const root =
        (data.draft && typeof data.draft === "object" && data.draft) ||
        (data.published && typeof data.published === "object" && data.published) ||
        data;

      // Home hero
      const hero = root.hero || {};
      heroHeadlineEl.value = hero.headline || "";
      heroSubtextEl.value = hero.subtext || "";
      heroButtonTextEl.value = hero.buttonText || "";

      // About
      const about = root.about || {};
      aboutHeadingEl.value = about.heading || "";
      aboutBodyEl.value = about.body || "";

      // Contact
      const contact = root.contact || {};
      contactHeadingEl.value = contact.heading || "";
      contactBodyEl.value = contact.body || "";
      contactButtonTextEl.value = contact.buttonText || "";

      saveStatusEl.textContent = "";
    } else {
      // Clear if no doc yet
      heroHeadlineEl.value = "";
      heroSubtextEl.value = "";
      heroButtonTextEl.value = "";
      aboutHeadingEl.value = "";
      aboutBodyEl.value = "";
      contactHeadingEl.value = "";
      contactBodyEl.value = "";
      contactButtonTextEl.value = "";

      saveStatusEl.textContent = "";
    }
  } catch (err) {
    console.error(err);
    saveStatusEl.textContent = "Error loading content";
  }
}

// -------- Save draft --------

async function handleSaveDraft() {
  saveStatusEl.textContent = "Saving draft…";
  saveBtn.disabled = true;
  if (publishBtn) publishBtn.disabled = true;

  try {
    const content = getContentFromForm();
    const ref = siteDocRef(CURRENT_SITE_ID);

    await setDoc(
      ref,
      {
        draft: content,
      },
      { merge: true }
    );

    saveStatusEl.textContent = "Draft saved";
    refreshPreview();
  } catch (err) {
    console.error(err);
    saveStatusEl.textContent = "Error saving draft";
  } finally {
    saveBtn.disabled = false;
    if (publishBtn) publishBtn.disabled = false;
    setTimeout(() => {
      if (saveStatusEl.textContent === "Draft saved") {
        saveStatusEl.textContent = "";
      }
    }, 1500);
  }
}

// -------- Publish site --------

async function handlePublish() {
  saveStatusEl.textContent = "Publishing…";
  saveBtn.disabled = true;
  publishBtn.disabled = true;

  try {
    const content = getContentFromForm();
    const ref = siteDocRef(CURRENT_SITE_ID);

    // Publish: copy current form snapshot into published
    // and keep draft in sync so reopening the portal shows the latest.
    await setDoc(
      ref,
      {
        draft: content,
        published: content,
      },
      { merge: true }
    );

    saveStatusEl.textContent = "Site published ✔";
    // We keep the iframe in draft mode; since draft == published now, it matches.
  } catch (err) {
    console.error(err);
    saveStatusEl.textContent = "Error publishing";
  } finally {
    saveBtn.disabled = false;
    publishBtn.disabled = false;
    setTimeout(() => {
      if (saveStatusEl.textContent === "Site published ✔") {
        saveStatusEl.textContent = "";
      }
    }, 1500);
  }
}

// -------- Tabs: switch editor + preview page --------

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.dataset.section; // "home" | "about" | "contact"

    // Activate tab
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Show the right editor
    editorHomeEl.classList.add("hidden");
    editorAboutEl.classList.add("hidden");
    editorContactEl.classList.add("hidden");

    if (section === "home") editorHomeEl.classList.remove("hidden");
    if (section === "about") editorAboutEl.classList.remove("hidden");
    if (section === "contact") editorContactEl.classList.remove("hidden");

    // Show the right page in the iframe (draft mode)
    setPreviewPage(section);
  });
});

// -------- Wire up buttons --------

if (saveBtn) {
  saveBtn.addEventListener("click", handleSaveDraft);
}
if (publishBtn) {
  publishBtn.addEventListener("click", handlePublish);
}
