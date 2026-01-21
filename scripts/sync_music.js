const fs = require('fs');
const path = require('path');
const ytDlp = require('yt-dlp-exec');

const CONFIG_FILE = path.join(__dirname, '../downloads.json');
const MUSIC_DIR = path.join(__dirname, '../music');
const LIST_FILE = path.join(__dirname, '../music_list.json');

// Ensure music directory exists
if (!fs.existsSync(MUSIC_DIR)) {
    fs.mkdirSync(MUSIC_DIR);
}

async function processDownloads() {
    if (!fs.existsSync(CONFIG_FILE)) {
        console.error('❌ downloads.json not found! Please create it.');
        return;
    }

    let config;
    try {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
        console.error('❌ Error parsing downloads.json:', e.message);
        return;
    }

    const videos = config.videos || [];
    const playlists = config.playlists || [];

    if (videos.length === 0 && playlists.length === 0) {
        console.log('⚠️ No URLs found in downloads.json');
        return;
    }

    console.log(`🎵 Found ${videos.length} videos and ${playlists.length} playlists to process...`);

    // Process Single Videos
    for (const url of videos) {
        await download(url, false);
    }

    // Process Playlists
    for (const url of playlists) {
        await download(url, true);
    }

    generateList();
}

async function download(url, isPlaylist) {
    try {
        console.log(`\n⬇️  Processing [${isPlaylist ? 'Playlist' : 'Single'}]: ${url}`);
        
        const outputTemplate = path.join(MUSIC_DIR, '%(title)s.%(ext)s');

        const options = {
            extractAudio: true,
            audioFormat: 'mp3',
            output: outputTemplate,
            ignoreErrors: true,
            noOverwrites: true, 
            continue: true,
        };

        if (isPlaylist) {
            options.yesPlaylist = true;
        } else {
            options.noPlaylist = true;
        }

        await ytDlp(url, options);
        
        console.log('✅ Done.');
    } catch (error) {
        console.error(`❌ Failed to download ${url}:`, error.message);
    }
}

function generateList() {
    console.log('\n📝 Updating library list...');
    
    // Read directory
    let files = [];
    try {
        files = fs.readdirSync(MUSIC_DIR);
    } catch (e) {
        files = [];
    }
    
    // Filter for audio files
    const songs = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp3', '.m4a', '.wav', '.ogg'].includes(ext);
    });

    // Write to JSON for Frontend
    fs.writeFileSync(LIST_FILE, JSON.stringify(songs, null, 2));
    console.log(`✨ Library updated with ${songs.length} songs!`);
}

// Run
processDownloads();
