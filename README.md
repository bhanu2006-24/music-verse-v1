# Music Verse v1

A premium, glassmorphism-inspired music gallery and player. Built for aesthetics and simplicity.

**[🌐 Live Demo](https://bhanu2006-24.github.io/music-verse-v1/)**

## 🚀 Features

- **Premium UI**: Glassmorphism design, smooth animations, and responsive layout.
- **Mobile First**: Fully optimized for touch devices with a dedicated mobile library view.
- **Static Architecture**: Hosted 100% free on GitHub Pages. No backend required.
- **CLI Tools**: Built-in scripts to download music and sync your library.

## 🛠️ Setup & Usage

### 1. Run Locally

To run the project on your machine and manage your music library:

1.  **Install**: `npm install`
2.  **Add Music**:
    - Open `downloads.json`
    - Add YouTube URLs to the `videos` or `playlists` arrays.
3.  **Sync**: Run `npm run sync` to download music and update the library.
4.  **Start**: `npm run dev`
5.  **View**: Open `http://localhost:3000`

### 2. Live Deployment

The project is deployed at: **https://bhanu2006-24.github.io/music-verse-v1/**

_Note: Since the live site is static, you cannot add music directly from the web interface. You must run the sync command locally, push the changes to GitHub, and the live site will update._

## 📚 API & Documentation

The application provides a read-only public API for accessing the music library.

**Endpoint**:
`GET /music_verse-v1/music_list.json` (Live)
`GET /music_list.json` (Local)

**Response Format**:

```json
{
  "stats": {
    "totalSongs": 2,
    "totalSize": "14 MB"
  },
  "songs": ["Song Name 1.mp3", "Song Name 2.mp3"]
}
```

You can use this endpoint to build your own clients or integrations.

## 📂 Project Structure

- `music/`: Stores downloaded audio files.
- `scripts/`: Contains logic for downloading and syncing music.
- `index.html`: The main application entry point.
- `downloads.json`: Configuration file for your music sources.

## 📄 License

ISC
