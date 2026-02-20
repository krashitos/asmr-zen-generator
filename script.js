document.addEventListener('DOMContentLoaded', () => {
    const selectionPage = document.getElementById('selectionPage');
    const playerPage = document.getElementById('playerPage');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const themeCards = document.querySelectorAll('.theme-card');
    const customThemeInput = document.getElementById('customTheme');
    const customGenerateBtn = document.getElementById('customGenerateBtn');
    
    const backBtn = document.getElementById('backBtn');
    const sessionTitle = document.getElementById('sessionTitle');
    const sessionScript = document.getElementById('sessionScript');
    const layersList = document.getElementById('layersList');
    const mainPlayBtn = document.getElementById('mainPlayBtn');
    const dynamicBg = document.querySelector('.dynamic-bg');

    let currentSession = null;
    let audioElements = [];
    let isPlaying = false;

    // --- State Management ---
    const showPage = (pageId) => {
        selectionPage.classList.remove('active');
        playerPage.classList.remove('active');
        selectionPage.classList.add('hidden');
        playerPage.classList.add('hidden');

        const next = document.getElementById(pageId);
        next.classList.remove('hidden');
        setTimeout(() => next.classList.add('active'), 50);
    };

    // --- API and Fallback ---
    const startSession = async (theme) => {
        loadingOverlay.classList.remove('hidden');
        
        try {
            const response = await fetch('/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme })
            });

            if (!response.ok) throw new Error('API unstable');
            
            const data = await response.json();
            setupPlayer(data);
            showPage('playerPage');
        } catch (err) {
            console.warn('API Failed, using Local Fallback Session Generator');
            const fallbackData = generateLocalFallback(theme);
            setupPlayer(fallbackData);
            showPage('playerPage');
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    };

    const generateLocalFallback = (theme) => {
        return {
            "title": `Peaceful ${theme}`,
            "script": `Let the digital world fade away. Focus on the gentle presence of ${theme}. Breathe deeply and find your center.`,
            "layers": [
                { "name": "Soft Rain", "url": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Rain_on_the_roof.mp3", "initialVolume": 0.4 },
                { "name": "Nature Wind", "url": "https://upload.wikimedia.org/wikipedia/commons/b/b0/Forest_ambience_with_birds.mp3", "initialVolume": 0.2 }
            ],
            "colors": { "primary": "#1a1a2e", "secondary": "#16213e" }
        };
    };

    // --- Player Logic ---
    const setupPlayer = (session) => {
        currentSession = session;
        sessionTitle.innerText = session.title;
        sessionScript.innerText = session.script;
        layersList.innerHTML = '';
        stopAll();
        audioElements = [];

        dynamicBg.style.background = `radial-gradient(circle at 20% 30%, ${session.colors.primary} 0%, transparent 40%),
                                      radial-gradient(circle at 80% 70%, ${session.colors.secondary} 0%, transparent 40%)`;

        session.layers.forEach(layer => {
            const audio = new Audio(layer.url);
            audio.crossOrigin = "anonymous";
            audio.loop = true;
            audio.volume = layer.initialVolume;
            audioElements.push({ audio, name: layer.name });

            const row = document.createElement('div');
            row.className = 'layer-item';
            row.innerHTML = `
                <span class="layer-name">${layer.name}</span>
                <input type="range" min="0" max="1" step="0.01" value="${layer.initialVolume}" class="volume-slider">
                <span class="vol-val">${Math.round(layer.initialVolume * 100)}%</span>
            `;

            const slider = row.querySelector('.volume-slider');
            const volVal = row.querySelector('.vol-val');
            slider.addEventListener('input', (e) => {
                const val = e.target.value;
                audio.volume = val;
                volVal.innerText = `${Math.round(val * 100)}%`;
            });

            layersList.appendChild(row);
        });

        mainPlayBtn.innerText = 'Play All';
        isPlaying = false;
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioElements.forEach(item => item.audio.pause());
            mainPlayBtn.innerText = 'Play All';
        } else {
            audioElements.forEach(item => {
                const playPromise = item.audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => console.error("Audio blocked"));
                }
            });
            mainPlayBtn.innerText = 'Pause All';
        }
        isPlaying = !isPlaying;
    };

    const stopAll = () => {
        audioElements.forEach(item => {
            item.audio.pause();
            item.audio.currentTime = 0;
        });
    };

    themeCards.forEach(card => {
        card.addEventListener('click', () => startSession(card.dataset.theme));
    });

    customGenerateBtn.addEventListener('click', () => {
        const val = customThemeInput.value.trim();
        if (val) startSession(val);
    });

    backBtn.addEventListener('click', () => {
        stopAll();
        showPage('selectionPage');
    });

    mainPlayBtn.addEventListener('click', togglePlay);
});
