# NotesBook — Simple GitHub Edition

This is a static GitHub Pages website. No MongoDB, Firebase, server or database is required.

## How it works
1. Open Admin.
2. Enter title and subject.
3. Select a PDF or image files.
4. The browser converts PDF pages into book-page images automatically.
5. The book is saved in that browser's local storage.
6. Students open it with a page-turn animation and generated page-turn sound.

## Important
Because this is a static site, uploads are stored in the browser using localStorage. They are NOT automatically uploaded to GitHub or visible on another phone/browser.

If you want the admin to upload once and have every student see the notes, a server/storage backend is required. This version intentionally avoids all of that.

## GitHub Pages
Upload `index.html`, `style.css`, `app.js` and the `README.md` to a GitHub repository. Enable Settings → Pages → Deploy from branch → main → /(root).

## Supported files
- PDF
- JPG/JPEG
- PNG
- WebP and other browser-readable image formats

For a PDF, pages are converted to images in the browser, so the student sees a book page instead of a PDF viewer or download control.

## Audio
The page-turn sound is synthesized in JavaScript, so no audio file is required. The reader has a sound toggle.
