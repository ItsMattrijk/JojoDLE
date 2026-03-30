// ===== VARIABLES GLOBALES MODE STAND =====
let personnagesStand = [];
let personnagesSelectionnesStand = [];
let standDuJour = null;
let personnageDuJourStand = null;
let standsStand = [];

let userStatsStand = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    averageAttempts: 0,
    totalAttempts: 0
};

let enabledPartiesStand = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ===== SYSTÈME D'INDICES =====
let hintButtonsStand = {
    portee: { unlockAt: 4, visible: false, unlocked: false, revealed: false },
    apparition: { unlockAt: 7, visible: false, unlocked: false, revealed: false },
    explication: { unlockAt: 11, visible: false, unlocked: false, revealed: false }
};

// ===== CHARGEMENT DES DONNÉES =====
async function loadDataStand() {
    try {
        const [persoResponse, standResponse] = await Promise.all([
            fetch('assets/js/perso.json'),
            fetch('assets/js/stand.json')
        ]);
        
        if (!persoResponse.ok || !standResponse.ok) {
            throw new Error('Erreur de chargement des données');
        }
        
        personnagesStand = await persoResponse.json();
        standsStand = await standResponse.json();
        
        console.log(`${personnagesStand.length} personnages chargés`);
        console.log(`${standsStand.length} stands chargés`);
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
    }
}

// ===== UTILITAIRES =====
function getPersonnagePhotoUrlStand(perso) {
    if (perso.Photo && perso.Photo.startsWith('http')) return perso.Photo;
    if (perso.Photo) return perso.Photo;
    return `https://via.placeholder.com/80x80/FFD700/8B008B?text=${perso.NOM.charAt(0)}`;
}

function getDailySeedStand() {
    const today = new Date();
    const baseSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    const resetCounter = parseInt(localStorage.getItem('jojoResetCounter_stand') || '0');
    // Offset fixe pour différencier le mode stand du mode classique (qui utilise +111111)
    return baseSeed + 777777 + (resetCounter * 123456);
}
function seededRandomStand(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getTimeUntilMidnightStand() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
}

function updateCountdownStand() {
    const countdownElement = document.getElementById('countdown-timer-stand');
    if (countdownElement) countdownElement.textContent = getTimeUntilMidnightStand();
}

function removeAccentsStand(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ===== LOGIQUE DU JEU =====
function selectDailyStand() {
    if (standsStand.length === 0) {
        console.error('Aucun stand chargé');
        return null;
    }
    
    const filteredStands = standsStand.filter(stand => {
        if (!stand.Utilisateur) return false;
        const perso = personnagesStand.find(p => p.ID === stand.Utilisateur);
        return perso && enabledPartiesStand.includes(perso.PartieNumero);
    });
    
    console.log('🔍 Filtrage:', filteredStands.length, 'stands sur', standsStand.length);
    console.log('📚 Parties actives:', enabledPartiesStand);
    
    if (filteredStands.length === 0) {
        console.warn('⚠️ Aucun stand disponible - Réactivation de toutes les parties');
        enabledPartiesStand = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        saveEnabledPartiesStand();
        return selectDailyStand();
    }
    
    const seed = getDailySeedStand();
    const randomValue = seededRandomStand(seed);
    const index = Math.floor(randomValue * filteredStands.length);
    standDuJour = filteredStands[index];
    
    personnageDuJourStand = personnagesStand.find(p => p.ID === standDuJour.Utilisateur);
    
    console.log('✅ Stand du jour:', standDuJour.Nom, '- Utilisateur:', personnageDuJourStand?.NOM);
    return standDuJour;
}

function compareWithDailyStand(perso) {
    if (!personnageDuJourStand) return null;
    
    return {
        isCorrectPersonnage: perso.ID === personnageDuJourStand.ID
    };
}

// ===== SYSTÈME D'INDICES =====
function updateHintButtonsStand() {
    const attempts = personnagesSelectionnesStand.length;
    
    if (attempts >= 1) {
        hintButtonsStand.portee.visible = true;
        hintButtonsStand.apparition.visible = true;
        hintButtonsStand.explication.visible = true;
    }
    
    if (attempts >= 4) hintButtonsStand.portee.unlocked = true;
    if (attempts >= 7) hintButtonsStand.apparition.unlocked = true;
    if (attempts >= 11) hintButtonsStand.explication.unlocked = true;
    
    renderHintButtonsStand();
}

function toggleHintStand(hintType) {
    const config = hintButtonsStand[hintType];
    if (!config || !config.unlocked) return;
    
    config.revealed = !config.revealed;
    renderHintButtonsStand();
}

function renderHintButtonsStand() {
    const container = document.getElementById('card-hints-stand');
    if (!container) return;

    const attempts = personnagesSelectionnesStand.length;
    if (attempts >= 1) container.classList.add('visible');

    const hints = [
        {
            type: 'portee',
            icon: '📏',
            label: 'Portée',
            value: standDuJour?.Portée || 'N/A',
            unlockAt: 3
        },
        {
            type: 'apparition',
            icon: '📅',
            label: 'Apparition',
            value: standDuJour?.["Première Apparition"] || 'N/A',
            unlockAt: 6
        },
        {
            type: 'explication',
            icon: '📖',
            label: 'Description',
            value: standDuJour?.Description || 'N/A',
            unlockAt: 10
        }
    ];

    container.innerHTML = `
        <div class="card-hints-intro">— Indices —</div>
        <div class="hints-carousel-wrapper">
            <div class="hints-carousel-track">
                ${hints.map(hint => {
                    const config = hintButtonsStand[hint.type];
                    const isUnlocked = config.unlocked;
                    const isRevealed = config.revealed;
                    const attemptsNeeded = hint.unlockAt - attempts;
                    return `
                        <div class="card-hint-item ${isUnlocked ? 'unlocked' : ''} ${isRevealed ? 'revealed' : ''}"
                             data-hint="${hint.type}"
                             ${isUnlocked ? `onclick="toggleHintStand('${hint.type}')"` : ''}>
                            <span class="card-hint-icon">${hint.icon}</span>
                            <span class="card-hint-label">${hint.label}</span>
                            <span class="card-hint-lock">${isUnlocked ? '🔓' : '🔒'}</span>
                            ${!isUnlocked ? `<span class="card-hint-unlock-count">${attemptsNeeded > 0 ? attemptsNeeded + ' essai' + (attemptsNeeded > 1 ? 's' : '') : 'Bientôt...'}</span>` : ''}
                            <span class="card-hint-value">${hint.value}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="hints-carousel-dots"></div>
        </div>
    `;
    if (typeof buildHintsDots === 'function') buildHintsDots(container);
}


// ===== VICTOIRE =====
function showVictoryBoxStand() {
    if (document.getElementById('victory-box-stand')) return;

    if (typeof window.jojoIncrementCounter === 'function') {
        window.jojoIncrementCounter('stand');
    }
    
    const searchInput = document.getElementById('searchInputStand');
    searchInput.disabled = true;
    searchInput.placeholder = "Personnage trouvé ! Revenez demain...";
    
    const victoryHTML = `
        <div class="victory-container" id="victory-box-stand">
            <div class="box">
                <div class="title victory-title">🎉 VICTOIRE ! 🎉</div>
                <div class="victory-content">
                    <span class="victory-name-tag">Stand identifié</span>
                    <br>
                    <img src="${getPersonnagePhotoUrlStand(personnageDuJourStand)}" 
                         alt="${personnageDuJourStand.NOM}" 
                         class="victory-photo"
                         onerror="this.src='https://via.placeholder.com/150x150/FFD700/8B008B?text=${personnageDuJourStand.NOM.charAt(0)}'">
                    <div class="victory-text">
                        <strong>${standDuJour.Nom}</strong> appartient à<br>
                        <strong>${personnageDuJourStand.NOM}</strong>
                    </div>
                    <div class="victory-stats">
                        <div class="stat-item">
                            <span class="stat-label">Nombre d'essais</span>
                            <span class="stat-value">${personnagesSelectionnesStand.length}</span>
                        </div>
                        <div class="stat-item countdown-item">
                            <span class="stat-label">Stand suivant dans</span>
                            <span class="stat-value" id="countdown-timer-stand">${getTimeUntilMidnightStand()}</span>
                        </div>
                    </div>
                    <button class="next-mode-btn" onclick="switchToMode('Citation')">
                        <span class="next-mode-icon">💬</span>
                        Mode suivant : Citation
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const selectedContainer = document.getElementById('selectedPersonnagesStand');
    selectedContainer.insertAdjacentHTML('afterend', victoryHTML);
    
    setTimeout(() => {
        const victoryBox = document.getElementById('victory-box-stand');
        if (victoryBox) {
            victoryBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 150);
    
    setInterval(updateCountdownStand, 1000);
    saveGameStateStand();
    updateStatsOnWinStand();
}

// ===== RECHERCHE =====
function searchPersonnagesStand(query) {
    if (!query || query.length < 1) return [];
    
    const normalizedQuery = removeAccentsStand(query.toLowerCase());
    
    return personnagesStand.filter(perso => {
        const matchesSearch = removeAccentsStand(perso.NOM.toLowerCase()).includes(normalizedQuery);
        const notSelected = !personnagesSelectionnesStand.some(selected => selected.ID === perso.ID);
        const partieEnabled = enabledPartiesStand.includes(perso.PartieNumero);
        
        return matchesSearch && notSelected && partieEnabled;
    }).slice(0, 8);
}

function showSuggestionsStand(personnages) {
    const suggestionsContainer = document.getElementById('suggestionsStand');
    
    if (personnages.length === 0) {
        suggestionsContainer.innerHTML = '<div class="no-results">🔍 Aucun personnage trouvé</div>';
        suggestionsContainer.className = 'suggestions show';
        return;
    }

    suggestionsContainer.innerHTML = personnages.map(perso => `
        <div class="suggestion-item" data-perso-id="${perso.ID}">
            <img src="${getPersonnagePhotoUrlStand(perso)}" alt="${perso.NOM}" class="player-photo"
                 onerror="this.src='https://via.placeholder.com/50x50/FFD700/8B008B?text=${perso.NOM.charAt(0)}'">
            <div class="player-info">
                <div class="player-name">${perso.NOM}</div>
            </div>
        </div>
    `).join('');
    
    suggestionsContainer.className = 'suggestions show';

    document.querySelectorAll('#suggestionsStand .suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            selectPersonnageStand(parseInt(item.getAttribute('data-perso-id')));
        });
    });
}

function hideSuggestionsStand() {
    const suggestionsContainer = document.getElementById('suggestionsStand');
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.className = 'suggestions';
}

// ===== SÉLECTION DE PERSONNAGE =====
function selectPersonnageStand(persoId) {
    const perso = personnagesStand.find(p => p.ID === persoId);
    if (!perso || personnagesSelectionnesStand.some(s => s.ID === persoId)) return;

    personnagesSelectionnesStand.push(perso);
    const searchInput = document.getElementById('searchInputStand');
    searchInput.value = '';
    hideSuggestionsStand();

    const comparison = compareWithDailyStand(perso);
    const alreadyWon = document.getElementById('victory-box-stand') !== null;

    displaySelectedPersonnagesStand();
    updateHintButtonsStand();

    setTimeout(() => {
        const selectedContainer = document.getElementById('selectedPersonnagesStand');
        selectedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    if (comparison?.isCorrectPersonnage && !alreadyWon) {
        setTimeout(() => {
            showVictoryBoxStand();
        }, 1000);
    }

    saveGameStateStand();
}

// ===== AFFICHAGE =====
function displaySelectedPersonnagesStand() {
    const container = document.getElementById('selectedPersonnagesStand');
    
    if (personnagesSelectionnesStand.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="stand-guesses-list">';

    [...personnagesSelectionnesStand].reverse().forEach((perso, index) => {
        const c = compareWithDailyStand(perso);
        const isNewPerso = index === 0 ? ' new-guess' : '';
        const isCorrect = c?.isCorrectPersonnage ? 'correct-guess' : 'incorrect-guess';
        
        html += `
            <div class="stand-guess ${isNewPerso} ${isCorrect}">
                <img src="${getPersonnagePhotoUrlStand(perso)}" 
                     alt="${perso.NOM}" 
                     class="stand-guess-photo"
                     onerror="this.src='https://via.placeholder.com/80x80/FFD700/8B008B?text=${perso.NOM.charAt(0)}'">
                <div class="stand-guess-name">${perso.NOM}</div>
                <div class="stand-guess-status">${c?.isCorrectPersonnage ? '✅' : '❌'}</div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
    
    setTimeout(() => {
        const newGuess = container.querySelector('.stand-guess.new-guess');
        if (newGuess) {
            setTimeout(() => {
                newGuess.classList.remove('new-guess');
            }, 600);
        }
    }, 50);
}

// ===== ÉVÉNEMENTS =====
function initStandEvents() {
    const searchInput = document.getElementById('searchInputStand');
    const searchBtn = document.querySelector('#stand-mode .search-btn');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        query.length === 0 ? hideSuggestionsStand() : showSuggestionsStand(searchPersonnagesStand(query));
    });

    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim();
        if (query.length > 0) showSuggestionsStand(searchPersonnagesStand(query));
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSuggestionsStand();
            searchInput.blur();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const results = searchPersonnagesStand(searchInput.value.trim());
            if (results.length > 0) selectPersonnageStand(results[0].ID);
        }
    });

    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const results = searchPersonnagesStand(searchInput.value.trim());
        results.length === 1 ? selectPersonnageStand(results[0].ID) : showSuggestionsStand(results);
    });
}

// ===== SAUVEGARDE =====
function saveGameStateStand() {
    const state = {
        date: getDailySeedStand(),
        attempts: personnagesSelectionnesStand.map(p => p.ID),
        hasWon: document.getElementById('victory-box-stand') !== null
    };
    localStorage.setItem("jojoStandState", JSON.stringify(state));
}

function loadGameStateStand() {
    const saved = localStorage.getItem("jojoStandState");
    if (!saved) return;

    try {
        const state = JSON.parse(saved);

        if (state.date !== getDailySeedStand()) {
            localStorage.removeItem("jojoStandState");
            return;
        }

        if (personnageDuJourStand && !enabledPartiesStand.includes(personnageDuJourStand.PartieNumero)) {
            console.log('⚠️ Personnage sauvegardé dans partie désactivée, réinitialisation...');
            localStorage.removeItem("jojoStandState");
            selectDailyStand();
            return;
        }

        state.attempts.forEach(id => {
            const perso = personnagesStand.find(p => p.ID === id);
            if (perso) personnagesSelectionnesStand.push(perso);
        });

        displaySelectedPersonnagesStand();
        updateHintButtonsStand();

        if (state.hasWon) {
            showVictoryBoxStand();
        }
    } catch (e) {
        console.error("Erreur de chargement du state:", e);
        localStorage.removeItem("jojoStandState");
    }
}

// ===== STATISTIQUES =====
function loadUserStatsStand() {
    const saved = localStorage.getItem('jojoStatsStand');
    if (saved) {
        userStatsStand = JSON.parse(saved);
    }
}

function saveUserStatsStand() {
    localStorage.setItem('jojoStatsStand', JSON.stringify(userStatsStand));
}

function updateStatsOnWinStand() {
    userStatsStand.gamesPlayed++;
    userStatsStand.gamesWon++;
    userStatsStand.currentStreak++;
    userStatsStand.maxStreak = Math.max(userStatsStand.maxStreak, userStatsStand.currentStreak);
    userStatsStand.totalAttempts += personnagesSelectionnesStand.length;
    userStatsStand.averageAttempts = Math.round(userStatsStand.totalAttempts / userStatsStand.gamesWon * 10) / 10;
    saveUserStatsStand();
}

// ===== PARTIES =====
function loadEnabledPartiesStand() {
    const saved = localStorage.getItem('jojoEnabledPartiesStand');
    if (saved) {
        enabledPartiesStand = JSON.parse(saved);
    }
}

function saveEnabledPartiesStand() {
    localStorage.setItem('jojoEnabledPartiesStand', JSON.stringify(enabledPartiesStand));
}

// ===== INITIALISATION =====
async function initStandMode() {
    console.log("Initialisation du mode Stand...");
    
    await loadDataStand();
    loadEnabledPartiesStand();
    selectDailyStand();
    renderHintButtonsStand();
    loadGameStateStand();
    initStandEvents();
    
    // ✅ AJOUT : Exporter le stand pour qu'il soit accessible
    window.standDuJour = standDuJour;
    
    console.log("Mode Stand prêt !");
}

// ===== EXPORTS =====
window.initStandMode = initStandMode;
window.toggleHintStand = toggleHintStand;
window.standDuJour = standDuJour;
window.openStatsModalStand = openStatsModalStand;
window.closeStatsModalStand = closeStatsModalStand;
window.openPartiesModalStand = openPartiesModalStand;
window.closePartiesModalStand = closePartiesModalStand;
window.togglePartieStand = togglePartieStand;
window.applyPartiesFilterStand = applyPartiesFilterStand;
window.resetAllPartiesStand = resetAllPartiesStand;
window.openHelpModalStand = openHelpModalStand;
window.closeHelpModalStand = closeHelpModalStand;