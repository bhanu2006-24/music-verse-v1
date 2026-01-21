const fs = require('fs');
const path = require('path');
const ytDlp = require('yt-dlp-exec');

const MUSIC_DIR = path.join(__dirname, '../music');

// Ensure music directory exists
if (!fs.existsSync(MUSIC_DIR)) {
    fs.mkdirSync(MUSIC_DIR);
}

const args = process.argv.slice(2);
const url = args.find(arg => arg.startsWith('http'));
const isPlaylist = args.includes('--playlist') || args.includes('-p');

if (!url) {
    console.log('Usage: node scripts/download_music.js <youtube_url> [--playlist]');
    process.exit(1);
}

console.log(`🎵 Starting download for: ${url}`);
console.log(`📂 Mode: ${isPlaylist ? 'Playlist' : 'Single Song'}`);
console.log('⏳ This may take a moment...');

const outputTemplate = path.join(MUSIC_DIR, '%(title)s.%(ext)s');

const options = {
    extractAudio: true,
    audioFormat: 'mp3',
    output: outputTemplate,
    noPlaylist: !isPlaylist,  // Toggle playlist support
};

ytDlp(url, options)
.then(output => {
    console.log('✅ Download complete!');
    console.log('👉 Run "npm run generate" to update your music list.');
})
.catch(err => {
    console.error('❌ Download failed:', err.message);
});
