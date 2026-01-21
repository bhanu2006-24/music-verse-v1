const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('btn-play');
const playIcon = playBtn.querySelector('i');
const prevBtn = document.getElementById('btn-prev');
const nextBtn = document.getElementById('btn-next');
const songListEl = document.getElementById('song-list');
const currentTitleEl = document.getElementById('current-title');
const currentArtistEl = document.getElementById('current-artist');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume-slider');

const downloadModal = document.getElementById('download-modal');
const downloadModalContent = document.getElementById('download-modal-content');
const songCountEl = document.getElementById('song-count');

let songs = [];
let currentSongIndex = -1;
let isPlaying = false;

// --- Initialization ---

async function init() {
    await fetchSongs();
    setupEventListeners();
}

async function fetchSongs() {
    try {
        // Fetch from the static JSON file instead of an API
        const response = await fetch('music_list.json');
        if (!response.ok) throw new Error('Music list not found');
        const data = await response.json();
        // Since the JSON is just filenames, we map them if needed, or use as is
        songs = data;
        renderSongList();
        updateSongCount();
    } catch (error) {
        console.error('Error fetching songs:', error);
        songListEl.innerHTML = `
            <div class="text-center text-gray-500 mt-10 px-4">
                <i class="fa-solid fa-triangle-exclamation text-2xl mb-2 opacity-50 text-red-400"></i>
                <p>Failed to load music list.</p>
                <p class="text-xs mt-2">Did you run <code class="bg-gray-800 px-1 rounded text-violet-300">npm run generate</code>?</p>
            </div>
        `;
    }
}

function renderSongList() {
    songListEl.innerHTML = '';
    
    if (songs.length === 0) {
        songListEl.innerHTML = `
            <div class="text-center text-gray-500 mt-10">
                <i class="fa-solid fa-music text-2xl mb-2 opacity-50"></i>
                <p>No music found.</p>
                <button onclick="toggleDownloadModal()" class="text-violet-400 hover:text-violet-300 text-xs mt-2 underline">Add some songs</button>
            </div>
        `;
        return;
    }

    songs.forEach((song, index) => {
        const div = document.createElement('div');
        div.className = `p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-3 group ${currentSongIndex === index ? 'bg-white/10 border border-violet-500/30' : 'border border-transparent'}`;
        div.onclick = () => loadSong(index);
        
        // Clean title
        const title = song.replace(/\.(mp3|m4a|wav|ogg)$/i, '');
        
        div.innerHTML = `
            <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-violet-600 transition-colors">
                <i class="fa-solid ${currentSongIndex === index && isPlaying ? 'fa-chart-simple fa-flip' : 'fa-music'}"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-white truncate ${currentSongIndex === index ? 'text-violet-300' : ''}">${title}</h3>
                <p class="text-xs text-gray-500 truncate">Local Audio</p>
            </div>
            ${currentSongIndex === index ? '<i class="fa-solid fa-volume-high text-violet-400 text-xs"></i>' : ''}
        `;
        songListEl.appendChild(div);
    });
}

function updateSongCount() {
    songCountEl.textContent = `${songs.length} song${songs.length !== 1 ? 's' : ''}`;
}

// --- Player Logic ---

function loadSong(index) {
    if (index < 0 || index >= songs.length) return;
    
    currentSongIndex = index;
    const songName = songs[index];
    const title = songName.replace(/\.(mp3|m4a|wav|ogg)$/i, '');
    
    currentTitleEl.textContent = title;
    currentArtistEl.textContent = "Playing from Library";
    
    // Set audio Source
    const encodedName = encodeURIComponent(songName);
    audioPlayer.src = `music/${encodedName}`;
    
    renderSongList(); 
    playSong();
    
    // Update navigator metadata if available
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: 'Music Verse',
            album: 'Local Library',
        });
    }
}

function playSong() {
    isPlaying = true;
    audioPlayer.play().catch(e => console.error("Playback error:", e));
    updatePlayButton();
}

function pauseSong() {
    isPlaying = false;
    audioPlayer.pause();
    updatePlayButton();
}

function togglePlay() {
    if (isPlaying) {
        pauseSong();
    } else {
        if (currentSongIndex === -1 && songs.length > 0) {
            loadSong(0);
        } else if (currentSongIndex !== -1) {
            playSong();
        }
    }
}

function updatePlayButton() {
    if (isPlaying) {
        playIcon.className = 'fa-solid fa-pause text-2xl';
    } else {
        playIcon.className = 'fa-solid fa-play text-2xl pl-1';
    }
    renderSongList();
}

function prevSong() {
    let newIndex = currentSongIndex - 1;
    if (newIndex < 0) newIndex = songs.length - 1;
    loadSong(newIndex);
}

function nextSong() {
    let newIndex = currentSongIndex + 1;
    if (newIndex >= songs.length) newIndex = 0;
    loadSong(newIndex);
}

function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    if (isNaN(duration)) return;
    
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
    
    currentTimeEl.textContent = formatTime(currentTime);
    durationEl.textContent = formatTime(duration);
}

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    
    if (isNaN(duration)) return;
    
    audioPlayer.currentTime = (clickX / width) * duration;
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// --- Event Listeners ---

function setupEventListeners() {
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', nextSong);
    
    progressContainer.addEventListener('click', setProgress);
    
    volumeSlider.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value;
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
        } else if (e.code === 'ArrowRight') {
            nextSong();
        } else if (e.code === 'ArrowLeft') {
            prevSong();
        }
    });
}

// --- Modal Logic ---

window.toggleDownloadModal = function() {
    const isHidden = downloadModal.classList.contains('hidden');
    if (isHidden) {
        downloadModal.classList.remove('hidden');
        setTimeout(() => {
            downloadModal.classList.remove('opacity-0');
            downloadModalContent.classList.remove('scale-95');
        }, 10);
    } else {
        downloadModal.classList.add('opacity-0');
        downloadModalContent.classList.add('scale-95');
        setTimeout(() => {
            downloadModal.classList.add('hidden');
        }, 300);
    }
};

window.copyCommand = function(id) {
    const el = document.getElementById(id);
    navigator.clipboard.writeText(el.innerText).then(() => {
        // Show temp tooltip or feedback
        const btn = el.nextElementSibling;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check text-green-400"></i>';
        setTimeout(() => {
            btn.innerHTML = original;
        }, 2000);
    });
}

// Start
init();
