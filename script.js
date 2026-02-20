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

    // --- API Calls ---
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
            console.error(err);
            alert('The Zen connection was interrupted. Using fallback...');
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    };

    // --- Player Logic ---
    const setupPlayer = (session) => {
        currentSession = session;
        sessionTitle.innerText = session.title;
        sessionScript.innerText = session.script;
        layersList.innerHTML = '';
        stopAll();
        audioElements = [];

        // Update background
        dynamicBg.style.background = `radial-gradient(circle at 20% 30%, ${session.colors.primary} 0%, transparent 40%),
                                      radial-gradient(circle at 80% 70%, ${session.colors.secondary} 0%, transparent 40%)`;

        session.layers.forEach(layer => {
            const audio = new Audio(layer.url);
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
            audioElements.forEach(item => item.audio.play().catch(e => console.log('Audio Blocked')));
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

    // --- Event Listeners ---
    themeCards.forEach(card => {
        card.addEventListener('click', () => {
            startSession(card.dataset.theme);
        });
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
