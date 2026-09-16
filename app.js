import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

const KEY = "notesbook_books_v2";

let books = JSON.parse(localStorage.getItem(KEY) || "[]");
let current = null;
let currentPage = 0;
let soundOn = true;
let turning = false;
let touchX = 0;

const $ = (id) => document.getElementById(id);

function save() {
  localStorage.setItem(KEY, JSON.stringify(books));
}

function showHome() {
  hideAll();
  $("home").classList.remove("hidden");
  renderLibrary();
  window.scrollTo(0, 0);
}

function showAdmin() {
  hideAll();
  $("admin").classList.remove("hidden");
  renderAdmin();
}

function hideAll() {
  ["home", "admin", "reader"].forEach((id) => {
    const el = $(id);
    if (el) el.classList.add("hidden");
  });
}

window.showHome = showHome;
window.showAdmin = showAdmin;

// -------------------------
// LIBRARY
// -------------------------

function renderLibrary() {
  const noteCount = $("noteCount");
  const notesGrid = $("notesGrid");

  if (!noteCount || !notesGrid) return;

  noteCount.textContent =
    `${books.length} book${books.length === 1 ? "" : "s"}`;

  if (!books.length) {
    notesGrid.innerHTML = `
      <div class="empty">
        No notes uploaded yet. Open Admin and upload your first PDF.
      </div>
    `;
    return;
  }

  notesGrid.innerHTML = books
    .map(
      (b, i) => `
        <article class="noteCard" onclick="openReader(${i})">
          <h3>${esc(b.title)}</h3>
          <p>
            ${esc(b.subject)}
            ${b.desc ? " · " + esc(b.desc) : ""}
          </p>
          <span>Open book →</span>
        </article>
      `
    )
    .join("");
}

// -------------------------
// ADMIN
// -------------------------

function renderAdmin() {
  const adminBooks = $("adminBooks");

  if (!adminBooks) return;

  if (!books.length) {
    adminBooks.innerHTML = `
      <div class="empty">No books yet.</div>
    `;
    return;
  }

  adminBooks.innerHTML = books
    .map(
      (b, i) => `
        <div class="adminRow">
          <div>
            <strong>${esc(b.title)}</strong>
            <span>
              ${esc(b.subject)} · ${b.pages.length} pages
            </span>
          </div>

          <button class="delete" onclick="removeBook(${i})">
            Delete
          </button>
        </div>
      `
    )
    .join("");
}

window.removeBook = (i) => {
  if (!books[i]) return;

  if (confirm("Delete this book?")) {
    books.splice(i, 1);
    save();
    renderAdmin();
    renderLibrary();
  }
};

// -------------------------
// FILE INPUT
// -------------------------

const fileInput = $("fileInput");

if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    const files = [...e.target.files];

    $("fileInfo").textContent = files.length
      ? files.map((f) => f.name).join(" · ")
      : "No file selected";
  });
}

// -------------------------
// CREATE BOOK
// -------------------------

async function createBook() {
  const files = [...$("fileInput").files];

  const title = $("bookTitle").value.trim();
  const subject = $("bookSubject").value.trim();
  const desc = $("bookDesc").value.trim();

  if (!title || !subject || !files.length) {
    $("status").textContent =
      "Please add a title, subject and file.";
    return;
  }

  $("uploadBtn").disabled = true;
  $("status").textContent = "Preparing your book…";

  try {
    const pages = [];

    for (const file of files) {
      if (file.type === "application/pdf") {
        const pdfPages = await pdfToPages(file);
        pages.push(...pdfPages);
      } else if (file.type.startsWith("image/")) {
        const image = await imageToData(file);
        pages.push(image);
      }
    }

    if (!pages.length) {
      throw new Error("No readable pages found.");
    }

    const book = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now().toString(),

      title,
      subject,
      desc,
      pages
    };

    books.unshift(book);

    save();

    $("status").textContent =
      `Done — ${pages.length} pages created.`;

    $("bookTitle").value = "";
    $("bookSubject").value = "";
    $("bookDesc").value = "";
    $("fileInput").value = "";
    $("fileInfo").textContent = "No file selected";

    renderAdmin();
    renderLibrary();

  } catch (error) {
    console.error(error);

    $("status").textContent =
      "Could not create book: " + error.message;

  } finally {
    $("uploadBtn").disabled = false;
  }
}

window.createBook = createBook;

// -------------------------
// PDF → PAGES
// -------------------------

async function pdfToPages(file) {
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: buffer
  });

  const pdf = await loadingTask.promise;

  const output = [];

  for (let n = 1; n <= pdf.numPages; n++) {
    $("status").textContent =
      `Making page ${n} of ${pdf.numPages}…`;

    const page = await pdf.getPage(n);

    const baseViewport = page.getViewport({
      scale: 1
    });

    const maxWidth = 1500;

    const scale = Math.min(
      2.2,
      maxWidth / baseViewport.width
    );

    const viewport = page.getViewport({
      scale
    });

    const canvas = document.createElement("canvas");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const context = canvas.getContext("2d", {
      alpha: false
    });

    if (!context) {
      throw new Error("Could not create canvas.");
    }

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    output.push(
      canvas.toDataURL("image/jpeg", 0.88)
    );

    // Help mobile browsers by releasing the canvas
    canvas.width = 1;
    canvas.height = 1;
  }

  return output;
}

// -------------------------
// IMAGE → DATA
// -------------------------

function imageToData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Could not read image."));
    };

    reader.readAsDataURL(file);
  });
}

// -------------------------
// READER
// -------------------------

function openReader(index) {
  if (!books[index]) return;

  current = books[index];
  currentPage = 0;

  hideAll();

  $("reader").classList.remove("hidden");

  $("readerTitle").textContent = current.title;
  $("readerSubject").textContent = current.subject;

  drawPage();

  window.scrollTo(0, 0);
}

window.openReader = openReader;

function closeReader() {
  showHome();
}

window.closeReader = closeReader;

// -------------------------
// DRAW PAGE
// -------------------------

function drawPage() {
  if (!current || !current.pages.length) return;

  const url = current.pages[currentPage];

  const container = $("currentPage");

  const image = new Image();

  image.onload = () => {
    container.innerHTML = "";

    image.className = "pageImg";

    image.alt =
      `${current.title} - Page ${currentPage + 1}`;

    image.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    `;

    container.appendChild(image);

    $("pageText").textContent =
      `${currentPage + 1} / ${current.pages.length}`;

    $("progress").style.width =
      `${((currentPage + 1) / current.pages.length) * 100}%`;

    $("prevBtn").disabled =
      currentPage === 0;

    $("nextBtn").disabled =
      currentPage === current.pages.length - 1;
  };

  image.onerror = () => {
    container.innerHTML = `
      <div class="empty">
        Could not display this page.
      </div>
    `;
  };

  image.src = url;
}

// -------------------------
// PAGE TURN
// -------------------------

function turn(direction) {
  if (turning || !current) return;

  const target = currentPage + direction;

  if (
    target < 0 ||
    target >= current.pages.length
  ) {
    return;
  }

  turning = true;

  const page = $("currentPage");

  page.classList.remove(
    "flipNext",
    "flipPrev"
  );

  // Force browser reflow
  void page.offsetWidth;

  page.classList.add(
    direction > 0
      ? "flipNext"
      : "flipPrev"
  );

  playTurn();

  setTimeout(() => {
    currentPage = target;

    page.classList.remove(
      "flipNext",
      "flipPrev"
    );

    drawPage();

    turning = false;
  }, 520);
}

window.turn = turn;

// -------------------------
// PAGE TURN SOUND
// -------------------------

function playTurn() {
  if (!soundOn) return;

  try {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) return;

    const audioContext = new AudioContext();

    const duration = 0.22;
    const sampleRate = audioContext.sampleRate;

    const buffer =
      audioContext.createBuffer(
        1,
        Math.floor(sampleRate * duration),
        sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const progress = i / data.length;

      data[i] =
        (Math.random() * 2 - 1) *
        (1 - progress) *
        0.1;
    }

    const source =
      audioContext.createBufferSource();

    const filter =
      audioContext.createBiquadFilter();

    const gain =
      audioContext.createGain();

    source.buffer = buffer;

    filter.type = "bandpass";
    filter.frequency.value = 1700;
    filter.Q.value = 0.7;

    gain.gain.setValueAtTime(
      0.001,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.06,
      audioContext.currentTime + 0.03
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    source
      .connect(filter)
      .connect(gain)
      .connect(audioContext.destination);

    source.start();

    source.stop(
      audioContext.currentTime +
      duration +
      0.01
    );

  } catch (error) {
    console.warn(
      "Page-turn sound unavailable:",
      error
    );
  }
}

// -------------------------
// SOUND TOGGLE
// -------------------------

function toggleSound() {
  soundOn = !soundOn;

  if ($("soundBtn")) {
    $("soundBtn").textContent =
      soundOn ? "🔊" : "🔇";
  }
}

window.toggleSound = toggleSound;

// -------------------------
// BUTTONS
// -------------------------

if ($("nextPage")) {
  $("nextPage").onclick = () => turn(1);
}

if ($("nextBtn")) {
  $("nextBtn").onclick = () => turn(1);
}

if ($("prevBtn")) {
  $("prevBtn").onclick = () => turn(-1);
}

if ($("currentPage")) {
  $("currentPage").onclick = () => turn(1);
}

// -------------------------
// MOBILE SWIPE
// -------------------------

if ($("book")) {
  $("book").addEventListener(
    "touchstart",
    (event) => {
      touchX =
        event.changedTouches[0].clientX;
    },
    {
      passive: true
    }
  );

  $("book").addEventListener(
    "touchend",
    (event) => {
      const endX =
        event.changedTouches[0].clientX;

      const difference = endX - touchX;

      if (Math.abs(difference) > 45) {
        turn(
          difference < 0 ? 1 : -1
        );
      }
    },
    {
      passive: true
    }
  );
}

// -------------------------
// KEYBOARD
// -------------------------

document.addEventListener(
  "keydown",
  (event) => {
    const reader = $("reader");

    if (
      !reader ||
      reader.classList.contains("hidden")
    ) {
      return;
    }

    if (event.key === "ArrowRight") {
      turn(1);
    }

    if (event.key === "ArrowLeft") {
      turn(-1);
    }

    if (event.key === "Escape") {
      closeReader();
    }
  }
);

// -------------------------
// HTML ESCAPE
// -------------------------

function esc(value) {
  return String(value).replace(
    /[&<>"']/g,
    (match) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[match]
  );
}

// -------------------------
// START
// -------------------------

renderLibrary();
