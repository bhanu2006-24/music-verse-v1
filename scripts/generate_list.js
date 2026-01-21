const fs = require('fs');
const path = require('path');

const MUSIC_DIR = path.join(__dirname, '../music');
const OUTPUT_FILE = path.join(__dirname, '../music_list.json');

// Ensure music directory exists
if (!fs.existsSync(MUSIC_DIR)) {
    fs.mkdirSync(MUSIC_DIR);
}

// Read directory
const files = fs.readdirSync(MUSIC_DIR);

// Filter for audio files
const songs = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.mp3', '.m4a', '.wav', '.ogg'].includes(ext);
});

// Write to JSON
const jsonContent = JSON.stringify(songs, null, 2);
fs.writeFileSync(OUTPUT_FILE, jsonContent);

console.log(`✅ Generated music list with ${songs.length} songs.`);
console.log(`Pushed to: ${OUTPUT_FILE}`);
