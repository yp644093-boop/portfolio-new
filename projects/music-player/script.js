const tracks = [
    { id: 1, title: "Pinnak", artist: "Sambata", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", artwork: "https://images.unsplash.com/photo-1518291410114-6d9bde7f707f?q=80&w=400&h=400&auto=format&fit=crop" },
    { id: 2, title: "Palti Fire", artist: "Sambata", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", artwork: "https://images.unsplash.com/photo-1541530766023-e18e8071e621?q=80&w=400&h=400&auto=format&fit=crop" },
    { id: 3, title: "Hood Life", artist: "Sambata (ft. Riar Saab)", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", artwork: "https://images.unsplash.com/photo-1605722243979-fe0be8158232?q=80&w=400&h=400&auto=format&fit=crop" },
    { id: 4, title: "PROUD", artist: "Sambata & Karan Kanchan", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", artwork: "https://images.unsplash.com/photo-1508919895539-4556f297b2d5?q=80&w=400&h=400&auto=format&fit=crop" },
    { id: 5, title: "Vazan (Red Bull 64 Bars)", artist: "Sambata & Karan Kanchan", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", artwork: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&h=400&auto=format&fit=crop" },
    { id: 6, title: "Cash Flow", artist: "Sambata & Riar Saab", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&h=400&auto=format&fit=crop" },
    { id: 7, title: "Black Money", artist: "Sambata & Loka", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", artwork: "https://images.unsplash.com/photo-1514525253344-f81aba3e2341?q=80&w=400&h=400&auto=format&fit=crop" },
    { id: 8, title: "Ethereal Echoes", artist: "Stellar Rhythm", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", artwork: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&h=400&auto=format&fit=crop" }
];

let currentTrackIndex = 0;
let isPlaying = false;
let isMuted = false;
let lastVolume = 0.8;
let isShuffle = false;
let repeatMode = 'off';
let currentView = 'all'; // 'all' or 'liked'
let likedTrackIds = JSON.parse(localStorage.getItem('likedTrackIds')) || [];

// Visualizer State
let audioCtx, analyser, dataArray, canvasCtx, animationId;

// DOM Elements
const audio = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const trackArtwork = document.getElementById('track-artwork');
const footerTitle = document.getElementById('footer-title');
const footerArtist = document.getElementById('footer-artist');
const miniArtwork = document.getElementById('mini-artwork');
const artworkContainer = document.getElementById('artwork-container');
const playlistItems = document.getElementById('playlist-items');
const volumeSlider = document.getElementById('volume-slider');
const muteBtn = document.getElementById('mute-btn');
const volHighIcon = document.getElementById('vol-high-icon');
const volMutedIcon = document.getElementById('vol-muted-icon');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const repeatBadge = document.getElementById('repeat-badge');
const searchInput = document.getElementById('playlist-search');
const canvas = document.getElementById('visualizer');
const likeBtnMain = document.getElementById('like-btn-main');
const likeIconEmpty = document.getElementById('like-icon-empty');
const likeIconFilled = document.getElementById('like-icon-filled');
const viewTitle = document.getElementById('view-title');

// Sidebar Links
const navHome = document.getElementById('nav-home');
const navSearchTrigger = document.getElementById('nav-search-trigger');
const navLibrary = document.getElementById('nav-library');

function init() {
    canvasCtx = canvas.getContext('2d');
    loadTrack(currentTrackIndex);
    renderPlaylist();
    setupEventListeners();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW failed:', err));
        });
    }
}

function loadTrack(index) {
    const track = tracks[index];
    audio.crossOrigin = "anonymous";
    audio.src = track.src;
    
    // Update Hero View
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    trackArtwork.src = track.artwork;
    
    // Update Footer Bar
    footerTitle.textContent = track.title;
    footerArtist.textContent = track.artist;
    miniArtwork.src = track.artwork;
    
    // Update Like state
    updateLikeUI(track.id);

    progressBar.value = 0;
    currentTimeEl.textContent = "0:00";
    
    document.querySelectorAll('.playlist-item').forEach((item, i) => {
        const trackId = parseInt(item.dataset.id);
        item.classList.toggle('active', trackId === track.id);
    });

    if (isPlaying) audio.play().catch(e => console.log("Play error:", e));
}

function updateLikeUI(id) {
    const isLiked = likedTrackIds.includes(id);
    likeIconEmpty.style.display = isLiked ? 'none' : 'block';
    likeIconFilled.style.display = isLiked ? 'block' : 'none';
}

function toggleLike() {
    const track = tracks[currentTrackIndex];
    if (likedTrackIds.includes(track.id)) {
        likedTrackIds = likedTrackIds.filter(id => id !== track.id);
    } else {
        likedTrackIds.push(track.id);
    }
    localStorage.setItem('likedTrackIds', JSON.stringify(likedTrackIds));
    updateLikeUI(track.id);
    if (currentView === 'liked') renderPlaylist();
}

function togglePlay() {
    if (isPlaying) pauseTrack();
    else {
        playTrack();
        if (!audioCtx) initVisualizer();
    }
}

function playTrack() {
    isPlaying = true;
    audio.play();
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
}

function pauseTrack() {
    isPlaying = false;
    audio.pause();
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
}

function prevTrack() {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrackIndex);
}

function nextTrack() {
    if (isShuffle) {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * tracks.length); } while (newIndex === currentTrackIndex);
        currentTrackIndex = newIndex;
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    }
    loadTrack(currentTrackIndex);
}

function updateProgress() {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressBar.value = percent;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration);
    }
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

function filterPlaylist() {
    renderPlaylist(searchInput.value.toLowerCase());
}

function renderPlaylist(filter = "") {
    playlistItems.innerHTML = '';
    const filteredTracks = tracks.filter(track => {
        const matchesSearch = !filter || track.title.toLowerCase().includes(filter) || track.artist.toLowerCase().includes(filter);
        const matchesView = currentView === 'all' || likedTrackIds.includes(track.id);
        return matchesSearch && matchesView;
    });

    filteredTracks.forEach((track) => {
        const li = document.createElement('li');
        const trackIndex = tracks.findIndex(t => t.id === track.id);
        li.className = `playlist-item ${trackIndex === currentTrackIndex ? 'active' : ''}`;
        li.dataset.id = track.id;
        li.innerHTML = `
            <img class="track-thumb" src="${track.artwork}" alt="">
            <div class="item-info">
                <div class="item-title">${track.title}</div>
                <div class="item-artist">${track.artist}</div>
            </div>
            ${likedTrackIds.includes(track.id) ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="#ff4b2b"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' : ''}
        `;
        li.addEventListener('click', () => {
            currentTrackIndex = trackIndex;
            loadTrack(currentTrackIndex);
            playTrack();
            if (!audioCtx) initVisualizer();
        });
        playlistItems.appendChild(li);
    });
}

function switchView(view) {
    currentView = view;
    viewTitle.textContent = view === 'all' ? 'All Tracks' : 'Liked Songs';
    navHome.classList.toggle('active', view === 'all');
    navLibrary.classList.toggle('active', view === 'liked');
    renderPlaylist();
}

function initVisualizer() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser); analyser.connect(audioCtx.destination);
    analyser.fftSize = 64;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    draw();
}

function draw() {
    animationId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    const width = canvas.width = artworkContainer.offsetWidth;
    const height = canvas.height = artworkContainer.offsetHeight;
    canvasCtx.clearRect(0, 0, width, height);
    const barWidth = (width / dataArray.length);
    for(let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.5;
        canvasCtx.fillStyle = `rgba(139, 92, 246, ${dataArray[i]/255})`;
        canvasCtx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
    }
}

function setupEventListeners() {
    playPauseBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => { if(repeatMode==='one'){audio.currentTime=0;playTrack();} else nextTrack(); });
    progressBar.addEventListener('input', () => audio.currentTime = (progressBar.value / 100) * audio.duration);
    volumeSlider.addEventListener('input', () => { audio.volume = volumeSlider.value / 100; lastVolume = audio.volume; });
    muteBtn.addEventListener('click', () => { isMuted = !isMuted; audio.volume = isMuted ? 0 : lastVolume; volMutedIcon.style.display = isMuted ? 'block' : 'none'; volHighIcon.style.display = isMuted ? 'none' : 'block'; });
    shuffleBtn.addEventListener('click', () => { isShuffle = !isShuffle; shuffleBtn.classList.toggle('active', isShuffle); });
    repeatBtn.addEventListener('click', () => { repeatMode = repeatMode === 'off' ? 'all' : (repeatMode === 'all' ? 'one' : 'off'); repeatBtn.classList.toggle('active', repeatMode !== 'off'); repeatBadge.style.display = repeatMode === 'one' ? 'block' : 'none'; });
    searchInput.addEventListener('input', filterPlaylist);
    likeBtnMain.addEventListener('click', toggleLike);
    
    navHome.addEventListener('click', () => { switchView('all'); searchInput.value = ''; filterPlaylist(); });
    navLibrary.addEventListener('click', () => switchView('liked'));
    navSearchTrigger.addEventListener('click', () => searchInput.focus());

    window.addEventListener('keydown', (e) => {
        if(e.code === 'Space') { e.preventDefault(); togglePlay(); }
        if(e.code === 'ArrowRight') audio.currentTime += 5;
        if(e.code === 'ArrowLeft') audio.currentTime -= 5;
    });
}

init();
