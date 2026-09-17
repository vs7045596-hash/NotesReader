# NotesBook

A GitHub-only PCM notes website with:
- Physics / Chemistry / Maths sections
- Search
- Browser-only reading
- Realistic CSS page-turn animation
- Page-turn sound generated in the browser
- Mobile swipe controls
- Admin PDF upload through the GitHub Contents API
- GitHub Actions automatically converts PDFs into JPG pages
- `data/notes.json` is automatically updated

## 1. Create the repository

Create a GitHub repository and upload all files in this project.

Enable **Settings → Pages → Deploy from a branch → main / root**.

## 2. GitHub Actions permissions

Open **Settings → Actions → General** and under Workflow permissions choose:

**Read and write permissions**

The workflow needs this so it can commit generated page images and update `data/notes.json`.

## 3. Admin token

Create a GitHub fine-grained personal access token restricted to this repository.

Give it only:

**Repository permissions → Contents → Read and write**

Do not put the token into any project file.

The Admin page can remember the token locally on your device if you tick "Remember token on this device". This is convenient, but local browser storage is not a secure password vault. For a shared/public device, leave it unchecked.

## 4. Publishing

Open `admin.html`, enter owner/repository/token, choose the subject and upload a PDF.

The admin panel commits the PDF to:

`uploads/<subject>/<id>.pdf`

It also registers the note in `data/notes.json`.

The GitHub Actions workflow detects the PDF, uses Poppler's `pdftoppm` to render every page to JPG, and commits them under:

`notes/<subject>/<id>/`

Then the student reader displays those page images. No PDF download is offered by the student UI.

## Important

The GitHub Contents API has practical file-size limits. Keep individual PDFs reasonably small. Very large scans should be compressed before upload.

The site itself has no MongoDB, Firebase, Supabase, server, or separate database.
