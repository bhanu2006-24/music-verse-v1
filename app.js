const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('btn-play');
const playIcon = playBtn.querySelector('i');
const prevBtn = document.getElementById('btn-prev');
const nextBtn = document.getElementById('btn-next');

// Multiple lists handling
const desktopSongListEl = document.getElementById('desktop-song-list');
const mobileSongListEl = document.getElementById('mobile-song-list');

const currentTitleEl = document.getElementById('current-title');
const currentArtistEl = document.getElementById('current-artist');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume-slider');
const mobileMuteBtn = document.getElementById('mobile-mute-btn');

const downloadModal = document.getElementById('download-modal');
const downloadModalContent = downloadModal.querySelector('div'); // First child div
const songCountEl = document.getElementById('song-count');
const mobileLibrary = document.getElementById('mobile-library');
const discViz = document.getElementById('disc-viz');

let songs = [];
let currentSongIndex = -1;
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
        songs = data;
        renderSongLists();
        updateSongCount();
        
        // Auto-load first song but don't play
        if (songs.length > 0) {
            loadSong(0, false);
        }
    } catch (error) {
        console.error('Error fetching songs:', error);
        // Show error in lists
        const errorMsg = `
            <div class="text-center text-gray-500 mt-10 px-4">
                <i class="fa-solid fa-triangle-exclamation text-2xl mb-2 opacity-50 text-red-400"></i>
                <p>Failed to load music list.</p>
                <p class="text-xs mt-2">Did you run <code class="bg-gray-800 px-1 rounded text-violet-300">npm run sync</code>?</p>
            </div>
        `;
        if (desktopSongListEl) desktopSongListEl.innerHTML = errorMsg;
        if (mobileSongListEl) mobileSongListEl.innerHTML = errorMsg;
    }
}

function renderSongLists() {
    // Helper to create song item
    const createItem = (song, index) => {
        const title = song.replace(/\.(mp3|m4a|wav|ogg)$/i, '');
        const isActive = currentSongIndex === index;
        
        const div = document.createElement('div');
        div.className = `p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 group border ${isActive ? 'bg-white/10 border-violet-500/30' : 'border-transparent hover:bg-white/5 border-white/5'}`;
        div.onclick = () => {
            loadSong(index, true); 
            toggleMobileLibrary(false); // Close mobile menu on select
        };
        
        div.innerHTML = `
            <div class="w-10 h-10 shrink-0 rounded-lg bg-slate-800 flex items-center justify-center text-gray-400 ${isActive ? 'text-violet-400' : 'group-hover:text-white group-hover:bg-violet-600'} transition-colors relative overflow-hidden">
                ${isActive && isPlaying 
                    ? '<div class="flex gap-0.5 items-end h-3"><div class="w-0.5 bg-violet-400 h-2 animate-[bounce_1s_infinite]"></div><div class="w-0.5 bg-violet-400 h-3 animate-[bounce_1.2s_infinite]"></div><div class="w-0.5 bg-violet-400 h-1 animate-[bounce_0.8s_infinite]"></div></div>'
                    : '<i class="fa-solid fa-music"></i>'
                }
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-white truncate ${isActive ? 'text-violet-300' : ''}">${title}</h3>
                <p class="text-xs text-gray-500 truncate">Local Audio</p>
            </div>
        `;
        return div;
    };

    // Render both lists
    if (desktopSongListEl) {
        desktopSongListEl.innerHTML = '';
        songs.forEach((song, i) => desktopSongListEl.appendChild(createItem(song, i)));
    }
    
    if (mobileSongListEl) {
        mobileSongListEl.innerHTML = '';
        songs.forEach((song, i) => mobileSongListEl.appendChild(createItem(song, i)));
    }
}

function updateSongCount() {
    if (songCountEl) songCountEl.textContent = `${songs.length}`;
}

// --- Player Logic ---

function loadSong(index, autoPlay = true) {
    if (index < 0 || index >= songs.length) return;
    
    currentSongIndex = index;
    const songName = songs[index];
    const title = songName.replace(/\.(mp3|m4a|wav|ogg)$/i, '');
    
    currentTitleEl.textContent = title;
    // Try to guess artist from filename if formatted like "Artist - Title"
    if (title.includes('-')) {
        const parts = title.split('-');
        currentArtistEl.textContent = parts[0].trim();
    } else {
        currentArtistEl.textContent = "Music Verse Library";
    }
    
    const encodedName = encodeURIComponent(songName);
    audioPlayer.src = `music/${encodedName}`;
    
    renderSongLists(); // Update active state in UI
    
    if (autoPlay) {
        playSong();
    }
    
    // Metadata for lock screen
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: currentArtistEl.textContent,
            album: 'Music Verse',
            artwork: [
                { src: 'https://cdn-icons-png.flaticon.com/512/3074/3074767.png', sizes: '512x512', type: 'image/png' }
            ]
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
        if (currentSongIndex === -1 && songs.length > 0) {
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
    renderSongLists(); // Update active icon animation
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

// --- Visual Effects ---

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
        // Reset rotation occasionally or just let it stop
    }
}

// --- UI Actions ---

window.downloadCurrentSong = function() {
    if (currentSongIndex === -1) {
        alert("Play a song first!");
        return;
    }
    const songName = songs[currentSongIndex];
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
        const btn = el.nextElementSibling;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check text-green-400"></i>';
        setTimeout(() => {
            btn.innerHTML = original;
        }, 2000);
    });
}

// --- Event Listeners ---

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

// Start
init();
