// script.js (PORTAL)
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

// For now, one test site.
// Later: pull from URL or user document.
const CURRENT_SITE_ID = "test-site-1";

// DOM references
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

const saveBtn = document.getElementById("save-btn");
const saveStatusEl = document.getElementById("save-status");

// Tabs
const tabButtons = document.querySelectorAll(".editor-tab");
const editorHomeEl = document.getElementById("editor-home");
const editorAboutEl = document.getElementById("editor-about");
const editorContactEl = document.getElementById("editor-contact");
const previewHomeEl = document.getElementById("preview-home");
const previewAboutEl = document.getElementById("preview-about");
const previewContactEl = document.getElementById("preview-contact");


// Preview elements
const previewHeadlineEl = document.getElementById("preview-headline");
const previewSubtextEl = document.getElementById("preview-subtext");
const previewButtonEl = document.getElementById("preview-button");
const previewAboutHeadingEl = document.getElementById("preview-about-heading");
const previewAboutBodyEl = document.getElementById("preview-about-body");
const previewContactHeadingEl = document.getElementById(
  "preview-contact-heading"
);
const previewContactBodyEl = document.getElementById("preview-contact-body");
const previewContactButtonEl = document.getElementById(
  "preview-contact-button"
);

const previewFrameEl = document.getElementById("site-preview");
const previewPageLabelEl = document.getElementById("preview-page-label");

// 🔽 change this to your real client-site URL on GitHub Pages
const CLIENT_SITE_BASE_URL =
  "http://127.0.0.1:5500/client-site-template/";

function siteDocRef(siteId) {
  return doc(db, "sites", siteId);
}

// ------- Auth state handling -------

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showLogin();
    return;
  }

  userEmailEl.textContent = user.email || "";
  showEditor();
  await loadSite(CURRENT_SITE_ID);

  // default preview to Home page
  setPreviewPage("home");
});


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

// ------- Login / logout -------

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

logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// ------- Load site content -------

async function loadSite(siteId) {
  saveStatusEl.textContent = "Loading…";
  try {
    const ref = siteDocRef(siteId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();

      // Home hero
      const hero = data.hero || {};
      heroHeadlineEl.value = hero.headline || "";
      heroSubtextEl.value = hero.subtext || "";
      heroButtonTextEl.value = hero.buttonText || "";

      // About
      const about = data.about || {};
      aboutHeadingEl.value = about.heading || "";
      aboutBodyEl.value = about.body || "";

      // Contact
      const contact = data.contact || {};
      contactHeadingEl.value = contact.heading || "";
      contactBodyEl.value = contact.body || "";
      contactButtonTextEl.value = contact.buttonText || "";

      updatePreview();
      saveStatusEl.textContent = "";
    } else {
      // No content yet, clear fields and preview
      heroHeadlineEl.value = "";
      heroSubtextEl.value = "";
      heroButtonTextEl.value = "";
      aboutHeadingEl.value = "";
      aboutBodyEl.value = "";
      contactHeadingEl.value = "";
      contactBodyEl.value = "";
      contactButtonTextEl.value = "";
      updatePreview();
      saveStatusEl.textContent = "";
    }
  } catch (err) {
    console.error(err);
    saveStatusEl.textContent = "Error loading content";
  }
}

// ------- Save content -------

saveBtn.addEventListener("click", async () => {
  saveStatusEl.textContent = "Saving…";
  saveBtn.disabled = true;

  try {
    const ref = siteDocRef(CURRENT_SITE_ID);

  await setDoc(
    ref,
    {
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
    },
    { merge: true }
  );

  saveStatusEl.textContent = "Saved";

  // 🔁 Refresh iframe to show latest data
  if (previewFrameEl && previewFrameEl.src) {
    // reassign the same src to trigger a reload
    const currentSrc = previewFrameEl.src;
    previewFrameEl.src = currentSrc;
  }


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

// ------- Preview updates -------

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

  const ah = aboutHeadingEl.value.trim();
  const ab = aboutBodyEl.value.trim();
  previewAboutHeadingEl.textContent = ah || "About section heading";
  previewAboutBodyEl.textContent =
    ab || "This is where your About section text will appear.";

  const ch = contactHeadingEl.value.trim();
  const cb = contactBodyEl.value.trim();
  const cbBtn = contactButtonTextEl.value.trim();
  previewContactHeadingEl.textContent = ch || "Contact section heading";
  previewContactBodyEl.textContent =
    cb || "This is where your Contact section text will appear.";
  previewContactButtonEl.textContent = cbBtn || "Contact button";
}

heroHeadlineEl.addEventListener("input", updatePreview);
heroSubtextEl.addEventListener("input", updatePreview);
heroButtonTextEl.addEventListener("input", updatePreview);
aboutHeadingEl.addEventListener("input", updatePreview);
aboutBodyEl.addEventListener("input", updatePreview);
contactHeadingEl.addEventListener("input", updatePreview);
contactBodyEl.addEventListener("input", updatePreview);
contactButtonTextEl.addEventListener("input", updatePreview);

// ------- Tabs behavior -------

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.dataset.section; // "home" | "about" | "contact"

    // Activate tab
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Show matching editor section
    editorHomeEl.classList.add("hidden");
    editorAboutEl.classList.add("hidden");
    editorContactEl.classList.add("hidden");

    if (section === "home") editorHomeEl.classList.remove("hidden");
    if (section === "about") editorAboutEl.classList.remove("hidden");
    if (section === "contact") editorContactEl.classList.remove("hidden");

    // Show matching page in iframe
    setPreviewPage(section);
  });
});

