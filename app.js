const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('btn-play');
const playIcon = playBtn.querySelector('i');
const prevBtn = document.getElementById('btn-prev');
const nextBtn = document.getElementById('btn-next');

// Multiple lists handling
const desktopSongListEl = document.getElementById('desktop-song-list');
const mobileSongListEl = document.getElementById('mobile-song-list');

// Search Inputs
const desktopSearchInput = document.getElementById('desktop-search-input');
const mobileSearchInput = document.getElementById('mobile-search-input');

// Stats Elements
const statCountEl = document.getElementById('stat-count');
const statSizeEl = document.getElementById('stat-size');
const statUpdateEl = document.getElementById('stat-update');
const desktopSongCountEl = document.getElementById('desktop-song-count');
const mobileSongCountEl = document.getElementById('mobile-song-count');

const currentTitleEl = document.getElementById('current-title');
const currentArtistEl = document.getElementById('current-artist');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume-slider');
const mobileMuteBtn = document.getElementById('mobile-mute-btn');

const settingsModal = document.getElementById('settings-modal');
const settingsModalContent = settingsModal.querySelector('div'); 
const mobileLibrary = document.getElementById('mobile-library');
const discViz = document.getElementById('disc-viz');

let allSongs = [];     // Full list
let filteredSongs = []; // Currently displayed list
let currentSongIndex = -1; // Index in ALL songs
let isPlaying = false;

// --- Initialization ---

async function init() {
    await fetchSongs();
    setupEventListeners();
    
    // Check for saved volume
    const savedVolume = localStorage.getItem('music_volume');
    if (savedVolume) {
        audioPlayer.volume = parseFloat(savedVolume);
        if (volumeSlider) volumeSlider.value = savedVolume;
    }
}

async function fetchSongs() {
    try {
        const response = await fetch('music_list.json');
        if (!response.ok) throw new Error('Music list not found');
        const data = await response.json();
        
        // Handle new object structure or old array
        if (Array.isArray(data)) {
            allSongs = data;
        } else {
            allSongs = data.songs || [];
            updateStats(data.stats);
        }
        
        filteredSongs = [...allSongs];
        renderSongLists();
        updateSongCountUI();
        
        if (allSongs.length > 0) {
            loadSong(0, false);
        }
    } catch (error) {
        console.error('Error fetching songs:', error);
        const errorMsg = `
            <div class="text-center text-gray-500 mt-10 px-4">
                <i class="fa-solid fa-triangle-exclamation text-2xl mb-2 opacity-50 text-red-400"></i>
                <p>Failed to load music list.</p>
                <p class="text-xs mt-2">Run <code class="bg-gray-800 px-1 rounded text-violet-300">npm run sync</code></p>
            </div>
        `;
        if (desktopSongListEl) desktopSongListEl.innerHTML = errorMsg;
        if (mobileSongListEl) mobileSongListEl.innerHTML = errorMsg;
    }
}

function updateStats(stats) {
    if (!stats) return;
    if (statCountEl) statCountEl.textContent = stats.totalSongs;
    if (statSizeEl) statSizeEl.textContent = stats.totalSize;
    if (statUpdateEl) statUpdateEl.textContent = stats.lastUpdated;
}

function updateSongCountUI() {
    const count = filteredSongs.length;
    const text = `${count} ${count === 1 ? 'song' : 'songs'}`;
    if (desktopSongCountEl) desktopSongCountEl.textContent = count;
    if (mobileSongCountEl) mobileSongCountEl.textContent = text;
}

// --- Search Logic ---

function filterSongs(query) {
    if (!query) {
        filteredSongs = [...allSongs];
    } else {
        const lower = query.toLowerCase();
        filteredSongs = allSongs.filter(song => song.toLowerCase().includes(lower));
    }
    renderSongLists();
    updateSongCountUI();
}

function renderSongLists() {
    // Helper to create song item
    const createItem = (song) => {
        // Find original index to play correct song
        const originalIndex = allSongs.indexOf(song);
        const title = song.replace(/\.(mp3|m4a|wav|ogg)$/i, '');
        const isActive = currentSongIndex === originalIndex;
        
        const div = document.createElement('div');
        div.className = `p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 group border ${isActive ? 'bg-white/10 border-violet-500/30' : 'border-transparent hover:bg-white/5 border-white/5'}`;
        div.onclick = () => {
            loadSong(originalIndex, true); 
            toggleMobileLibrary(false);
        };
        
        div.innerHTML = `
            <div class="w-10 h-10 shrink-0 rounded-lg bg-slate-800 flex items-center justify-center text-gray-400 ${isActive ? 'text-violet-400' : 'group-hover:text-white group-hover:bg-violet-600'} transition-colors relative overflow-hidden">
                 ${isActive && isPlaying 
                    ? '<div class="flex gap-0.5 items-end h-3"><div class="w-0.5 bg-violet-400 h-2 animate-[bounce_1s_infinite]"></div><div class="w-0.5 bg-violet-400 h-3 animate-[bounce_1.2s_infinite]"></div><div class="w-0.5 bg-violet-400 h-1 animate-[bounce_0.8s_infinite]"></div></div>'
                    : '<i class="fa-solid fa-music"></i>'
                }
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-white truncate text-left ${isActive ? 'text-violet-300' : ''}">${title}</h3>
                <p class="text-xs text-gray-500 truncate text-left">Local Audio</p>
            </div>
        `;
        return div;
    };

    if (desktopSongListEl) {
        desktopSongListEl.innerHTML = '';
        if (filteredSongs.length === 0) {
            desktopSongListEl.innerHTML = '<p class="text-gray-500 text-center text-sm py-4">No songs found.</p>';
        } else {
            filteredSongs.forEach(song => desktopSongListEl.appendChild(createItem(song)));
        }
    }
    
    if (mobileSongListEl) {
        mobileSongListEl.innerHTML = '';
        if (filteredSongs.length === 0) {
            mobileSongListEl.innerHTML = '<p class="text-gray-500 text-center text-sm py-4">No songs found.</p>';
        } else {
            filteredSongs.forEach(song => mobileSongListEl.appendChild(createItem(song)));
        }
    }
}

// --- Player Logic ---

function loadSong(index, autoPlay = true) {
    if (index < 0 || index >= allSongs.length) return;
    
    currentSongIndex = index;
    const songName = allSongs[index];
    const title = songName.replace(/\.(mp3|m4a|wav|ogg)$/i, '');
    
    currentTitleEl.textContent = title;
    // Guess artist
    if (title.includes('-')) {
        const parts = title.split('-');
        currentArtistEl.textContent = parts[0].trim();
    } else {
        currentArtistEl.textContent = "Music Verse Library";
    }
    
    const encodedName = encodeURIComponent(songName);
    audioPlayer.src = `music/${encodedName}`;
    
    renderSongLists(); // Update active state
    
    if (autoPlay) {
        playSong();
    }
    
    // Metadata
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: currentArtistEl.textContent,
            album: 'Music Verse',
            artwork: [{ src: 'https://cdn-icons-png.flaticon.com/512/3074/3074767.png', sizes: '512x512', type: 'image/png' }]
        });
        navigator.mediaSession.setActionHandler('play', playSong);
        navigator.mediaSession.setActionHandler('pause', pauseSong);
        navigator.mediaSession.setActionHandler('previoustrack', prevSong);
        navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    }
}

function playSong() {
    isPlaying = true;
    audioPlayer.play().catch(e => console.error("Playback error:", e));
    updatePlayButton();
    startVisualizer();
}

function pauseSong() {
    isPlaying = false;
    audioPlayer.pause();
    updatePlayButton();
    stopVisualizer();
}

function togglePlay() {
    if (isPlaying) {
        pauseSong();
    } else {
        if (currentSongIndex === -1 && allSongs.length > 0) {
            loadSong(0);
        } else if (currentSongIndex !== -1) {
            playSong();
        }
    }
}

function updatePlayButton() {
    if (isPlaying) {
        playIcon.className = 'fa-solid fa-pause text-2xl md:text-3xl';
    } else {
        playIcon.className = 'fa-solid fa-play text-2xl md:text-3xl pl-1';
    }
    renderSongLists();
}

function prevSong() {
    let newIndex = currentSongIndex - 1;
    if (newIndex < 0) newIndex = allSongs.length - 1;
    loadSong(newIndex);
}

function nextSong() {
    let newIndex = currentSongIndex + 1;
    if (newIndex >= allSongs.length) newIndex = 0;
    loadSong(newIndex);
}

// --- Events & UI ---

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

function startVisualizer() {
    if (discViz) {
        discViz.parentElement.classList.add('album-art-playing');
        discViz.classList.add('disc-spinning');
    }
}

function stopVisualizer() {
    if (discViz) {
        discViz.parentElement.classList.remove('album-art-playing');
        discViz.classList.remove('disc-spinning');
    }
}

window.downloadCurrentSong = function() {
    if (currentSongIndex === -1) {
        alert("Play a song first!");
        return;
    }
    const songName = allSongs[currentSongIndex];
    const link = document.createElement('a');
    link.href = `music/${songName}`;
    link.download = songName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.toggleMobileLibrary = function(forceState) {
    const isOpen = !mobileLibrary.classList.contains('translate-y-full');
    const newState = forceState !== undefined ? forceState : !isOpen;
    if (newState) {
        mobileLibrary.classList.remove('translate-y-full');
    } else {
        mobileLibrary.classList.add('translate-y-full');
    }
}

window.toggleSettingsModal = function() {
    const isHidden = settingsModal.classList.contains('hidden');
    if (isHidden) {
        settingsModal.classList.remove('hidden');
        setTimeout(() => {
            settingsModal.classList.remove('opacity-0');
            settingsModalContent.classList.remove('scale-95');
        }, 10);
    } else {
        settingsModal.classList.add('opacity-0');
        settingsModalContent.classList.add('scale-95');
        setTimeout(() => {
            settingsModal.classList.add('hidden');
        }, 300);
    }
};

window.copyCommand = function(id) {
    const el = document.getElementById(id);
    navigator.clipboard.writeText(el.innerText).then(() => {
        const btn = el.nextElementSibling;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check text-green-400"></i>';
        setTimeout(() => {
            btn.innerHTML = original;
        }, 2000);
    });
}

function setupEventListeners() {
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', nextSong);
    
    progressContainer.addEventListener('click', setProgress);
    
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audioPlayer.volume = e.target.value;
            localStorage.setItem('music_volume', e.target.value);
        });
    }

    if (mobileMuteBtn) {
        mobileMuteBtn.addEventListener('click', () => {
            if (audioPlayer.muted) {
                audioPlayer.muted = false;
                mobileMuteBtn.innerHTML = '<i class="fa-solid fa-volume-high text-lg"></i>';
                mobileMuteBtn.classList.remove('text-violet-400');
            } else {
                audioPlayer.muted = true;
                mobileMuteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark text-lg"></i>';
                mobileMuteBtn.classList.add('text-violet-400');
            }
        });
    }

    // Search
    const searchHandler = (e) => filterSongs(e.target.value);
    if (desktopSearchInput) desktopSearchInput.addEventListener('input', searchHandler);
    if (mobileSearchInput) mobileSearchInput.addEventListener('input', searchHandler);

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return; // Don't trigger if typing in search
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

// Start
init();
