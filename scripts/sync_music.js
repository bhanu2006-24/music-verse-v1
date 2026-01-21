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
    
    // Filter and map songs
    let totalSizeBytes = 0;
    const songs = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        const isAudio = ['.mp3', '.m4a', '.wav', '.ogg'].includes(ext);
        if (isAudio) {
            const filePath = path.join(MUSIC_DIR, file);
            try {
                const stats = fs.statSync(filePath);
                totalSizeBytes += stats.size;
            } catch (e) {}
        }
        return isAudio;
    });

    // Format size
    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const data = {
        stats: {
            totalSongs: songs.length,
            totalSize: formatSize(totalSizeBytes),
            lastUpdated: new Date().toLocaleString()
        },
        songs: songs
    };

    // Write to JSON for Frontend
    fs.writeFileSync(LIST_FILE, JSON.stringify(data, null, 2));
    console.log(`✨ Library updated with ${songs.length} songs (${data.stats.totalSize})!`);
}

// Run
processDownloads();
