# Image Uploader (Express + EJS + Multer + Cloudinary + MongoDB)

A small web app where users upload an image, it gets stored on **Cloudinary**
(image hosting), and a record of it (filename, Cloudinary URL, Cloudinary
ID) is saved to **MongoDB**. The page also shows a gallery of everything
uploaded so far, with a delete option.

## How the pieces fit together

- **Express** — the web server; handles routes (`/`, `/upload`, `/delete/:id`).
- **EJS** — the templating engine that renders `views/index.ejs` into HTML.
- **Multer** — reads the uploaded file out of the incoming form (`multipart/form-data`)
  and hands it to your route as `req.file`.
- **Cloudinary** — where the actual image file lives. You never store images
  on your own server permanently — you upload them to Cloudinary and just
  keep the URL.
- **Mongoose / MongoDB** — stores metadata about each upload (filename,
  Cloudinary's `public_id`, the image URL) so you can list, and later delete,
  uploads.

### Request flow for an upload
1. Browser submits the form → `POST /upload` with the file attached.
2. Multer reads the file into memory (`req.file.buffer`) — nothing is
   written to disk.
3. The buffer is streamed straight to Cloudinary (`cloudinary.uploader.upload_stream`).
4. Cloudinary returns a `secure_url` and `public_id`.
5. Those are saved to MongoDB via the `Image` model.
6. The page re-renders showing the new image plus the full gallery.

## Project structure

```
project/
├── server.js              # App entry point — wires everything together
├── config/
│   ├── db.js               # MongoDB connection
│   └── cloudinary.js       # Cloudinary configuration
├── models/
│   └── Image.js             # Mongoose schema for uploaded images
├── routes/
│   └── upload.js            # /, /upload, /delete/:id routes
├── views/
│   └── index.ejs            # Upload form + gallery
├── public/
│   └── css/style.css        # Styling
├── .env.example             # Template for your secrets
├── .gitignore
└── package.json
```

The original version had everything in one `server.js` file. Splitting it up
this way is the standard pattern once an Express app grows past a toy demo —
each file has one job, so it's easier to find and change things later.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create your `.env` file**
   ```bash
   cp .env.example .env
   ```
   Then fill in your real MongoDB URI and Cloudinary credentials.

3. **Run it**
   ```bash
   npm start
   ```
   or, for auto-restart on file changes during development:
   ```bash
   npm run dev
   ```

4. Visit `http://localhost:3000`.

## What changed from your original version, and why

1. **🔴 Secrets moved out of the code (most important change).**
   Your original `server.js` had your real Cloudinary API secret and MongoDB
   password typed directly into the file. Anyone who sees that file — a
   classmate, a GitHub repo, a screenshot — now has full access to your
   database and Cloudinary account. All credentials now come from a `.env`
   file (via the `dotenv` package), which is listed in `.gitignore` so it's
   never committed.

   **Because those specific credentials were already exposed to me, please
   rotate them now**: regenerate your Cloudinary API secret in the
   Cloudinary dashboard, and change your MongoDB Atlas database user's
   password. Update your new `.env` with the new values afterward.

2. **Fixed a bug: `file.originalname` was `undefined`.**
   In your `/upload` route, `file` was `req.file.path` (a string), so
   `file.originalname` didn't exist. It's now `req.file.originalname`,
   read before the file object goes out of scope.

3. **No more leftover files on disk.**
   The original used `multer.diskStorage`, saving every upload to
   `./public/uploads` *and* to Cloudinary — meaning the same image lived in
   two places, and your server's disk would slowly fill up. Multer now uses
   `memoryStorage`, and the file is streamed directly to Cloudinary and
   never written to disk at all.

4. **File validation.**
   Uploads are now limited to actual image files (`fileFilter`) and capped
   at 5MB (`limits.fileSize`), so a bad or huge upload can't crash the
   server or fill your Cloudinary storage.

5. **A gallery + delete.**
   The homepage now lists every image that's been uploaded (pulled from
   MongoDB) with a delete button per image, which removes it from both
   Cloudinary and MongoDB — so the app is  now actually usable beyond a
   single upload.

6. **Centralized error handling.**
   Routes now pass errors to `next(err)`, caught by one error-handling
   middleware in `server.js`, instead of unhandled promise rejections
   crashing the server or hanging the request.

7. **`package.json` version numbers corrected.**
   A few packages were pinned to versions that don't exist on npm (e.g.
   `ejs ^6.0.1`, `mongoose ^9.9.5`, `express ^5.2.1` — these version lines
   aren't real published releases). I set them to real, current stable
   versions (Express 4, EJS 3, Mongoose 8) so `npm install` won't fail. If
   you specifically want to experiment with Express 5, that's fine too —
   just know it has some behavioral differences from Express 4.

## Ideas if you want to keep going

- Add pagination to the gallery once you have a lot of images.
- Let users add a caption/title when uploading (extra form field → extra
  schema field).
- Add simple authentication so only you can delete images.
- Show upload progress on the frontend (would need a bit of client-side JS).
