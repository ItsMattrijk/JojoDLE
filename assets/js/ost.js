// ===== VARIABLES GLOBALES MODE OST =====
let personnagesOST = [];
let personnagesSelectionnesOST = [];
let ostDuJour = null;
let personnageDuJourOST = null;
let ostsOST = [];

let userStatsOST = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    averageAttempts: 0,
    totalAttempts: 0
};

let enabledPartiesOST = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ===== SYSTÈME D'INDICES - MODIFIÉ =====
let hintButtonsOST = {
    lieu: { unlockAt: 4, visible: false, unlocked: false, revealed: false },
    stand: { unlockAt: 7, visible: false, unlocked: false, revealed: false },
    partie: { unlockAt: 11, visible: false, unlocked: false, revealed: false }
};

// ===== CHARGEMENT DES DONNÉES =====
async function loadDataOST() {
    try {
        const [persoResponse, ostResponse] = await Promise.all([
            fetch('assets/js/perso.json'),
            fetch('assets/js/OST.json')
        ]);
        
        if (!persoResponse.ok || !ostResponse.ok) {
            throw new Error('Erreur de chargement des données');
        }
        
        personnagesOST = await persoResponse.json();
        ostsOST = await ostResponse.json();
        
        console.log(`${personnagesOST.length} personnages chargés`);
        console.log(`${ostsOST.length} OSTs chargés`);
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
    }
}

// ===== UTILITAIRES =====
function getPersonnagePhotoUrlOST(perso) {
    if (perso.Photo && perso.Photo.startsWith('http')) return perso.Photo;
    if (perso.Photo) return perso.Photo;
    return `https://via.placeholder.com/80x80/FFD700/8B008B?text=${perso.NOM.charAt(0)}`;
}

function getDailySeedOST() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function seededRandomOST(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getTimeUntilMidnightOST() {
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

function updateCountdownOST() {
    const countdownElement = document.getElementById('countdown-timer-ost');
    if (countdownElement) countdownElement.textContent = getTimeUntilMidnightOST();
}

function removeAccentsOST(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ===== LOGIQUE DU JEU =====
function selectDailyOST() {
    if (ostsOST.length === 0) {
        console.error('Aucun OST chargé');
        return null;
    }
    
    const filteredOSTs = ostsOST.filter(ost => {
        if (!ost.PersonnageID) return false;
        const perso = personnagesOST.find(p => p.ID === ost.PersonnageID);
        return perso && enabledPartiesOST.includes(perso.PartieNumero);
    });
    
    console.log('🔍 Filtrage:', filteredOSTs.length, 'OSTs sur', ostsOST.length);
    console.log('📚 Parties actives:', enabledPartiesOST);
    
    if (filteredOSTs.length === 0) {
        console.warn('⚠️ Aucun OST disponible - Réactivation de toutes les parties');
        enabledPartiesOST = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        saveEnabledPartiesOST();
        return selectDailyOST();
    }
    
    const seed = getDailySeedOST();
    const randomValue = seededRandomOST(seed);
    const index = Math.floor(randomValue * filteredOSTs.length);
    ostDuJour = filteredOSTs[index];
    
    personnageDuJourOST = personnagesOST.find(p => p.ID === ostDuJour.PersonnageID);
    
    console.log('✅ OST du jour:', ostDuJour.Nom, '- Utilisateur:', personnageDuJourOST?.NOM);
    return ostDuJour;
}

function compareWithDailyOST(perso) {
    if (!personnageDuJourOST) return null;
    
    return {
        isCorrectPersonnage: perso.ID === personnageDuJourOST.ID
    };
}

// ===== SYSTÈME D'INDICES - MODIFIÉ =====
function updateHintButtonsOST() {
    const attempts = personnagesSelectionnesOST.length;
    
    if (attempts >= 1) {
        hintButtonsOST.lieu.visible = true;
        hintButtonsOST.stand.visible = true;
        hintButtonsOST.partie.visible = true;
    }
    
    if (attempts >= 4) hintButtonsOST.lieu.unlocked = true;
    if (attempts >= 7) hintButtonsOST.stand.unlocked = true;
    if (attempts >= 11) hintButtonsOST.partie.unlocked = true;
    
    renderHintButtonsOST();
}

function toggleHintOST(hintType) {
    const config = hintButtonsOST[hintType];
    if (!config || !config.unlocked) return;
    
    config.revealed = !config.revealed;
    renderHintButtonsOST();
}

function renderHintButtonsOST() {
    const container = document.querySelector('#OST-mode .hint-buttons-container');
    if (!container) return;
    
    const attempts = personnagesSelectionnesOST.length;
    
    const hints = [
        {
            type: 'lieu',
            icon: '🌍',
            label: 'Apparition',
            value: personnageDuJourOST?.["Lieu d'apparition"] || 'N/A',
            unlockAt: 4
        },
        {
            type: 'stand',
            icon: '⭐',
            label: 'Stand',
            value: personnageDuJourOST?.Stand || 'N/A',
            unlockAt: 7
        },
        {
            type: 'partie',
            icon: '📚',
            label: 'Partie',
            value: ostDuJour?.Partie || 'N/A',
            unlockAt: 11
        }
    ];
    
    const previousStates = {};
    container.querySelectorAll('.hint-button').forEach(btn => {
        const type = btn.getAttribute('data-hint');
        previousStates[type] = {
            visible: btn.classList.contains('visible'),
            unlocked: btn.classList.contains('unlocked'),
            revealed: btn.classList.contains('active')
        };
    });
    
    container.innerHTML = hints.map(hint => {
        const config = hintButtonsOST[hint.type];
        const isVisible = config.visible;
        const isUnlocked = config.unlocked;
        const attemptsNeeded = hint.unlockAt - attempts;
        
        const wasVisible = previousStates[hint.type]?.visible || false;
        const isFirstReveal = isVisible && !wasVisible;
        
        return `
            <div class="hint-button ${isVisible ? 'visible' : ''} ${isUnlocked ? 'unlocked' : ''} ${config.revealed ? 'active' : ''} ${isFirstReveal ? 'first-reveal' : ''}" 
                 data-hint="${hint.type}"
                 ${isUnlocked ? `onclick="toggleHintOST('${hint.type}')"` : ''}>
                <div class="hint-icon">${hint.icon}</div>
                <div class="hint-label">${hint.label}</div>
                ${!isUnlocked ? `
                    <div class="hint-lock">
                        🔒
                        <span class="hint-unlock-text">
                            ${attemptsNeeded > 0 ? `${attemptsNeeded} essai${attemptsNeeded > 1 ? 's' : ''}` : 'Bientôt...'}
                        </span>
                    </div>
                ` : `
                    <div class="hint-value ${config.revealed ? 'revealed' : ''}">
                        ${hint.value}
                    </div>
                `}
            </div>
        `;
    }).join('');
    
    setTimeout(() => {
        container.querySelectorAll('.hint-button.first-reveal').forEach(btn => {
            btn.classList.remove('first-reveal');
        });
    }, 500);
}

// ===== VICTOIRE =====
function showVictoryBoxOST() {
    if (document.getElementById('victory-box-ost')) return;
    
    const searchInput = document.getElementById('searchInputOST');
    searchInput.disabled = true;
    searchInput.placeholder = "OST trouvé ! Revenez demain...";
    
    const victoryHTML = `
        <div class="victory-container" id="victory-box-ost">
            <div class="box">
                <div class="title victory-title">🎉 VICTOIRE ! 🎉</div>
                <div class="victory-content">
                    <img src="${getPersonnagePhotoUrlOST(personnageDuJourOST)}" 
                         alt="${personnageDuJourOST.NOM}" 
                         class="victory-photo"
                         onerror="this.src='https://via.placeholder.com/150x150/FFD700/8B008B?text=${personnageDuJourOST.NOM.charAt(0)}'">
                    <div class="victory-text">
                        Bravo ! L'OST appartient à <strong>${personnageDuJourOST.NOM}</strong> !
                    </div>
                    <div class="victory-stats">
                        <div class="stat-item">
                            <span class="stat-label">Nombre d'essais :</span>
                            <span class="stat-value">${personnagesSelectionnesOST.length}</span>
                        </div>
                        <div class="stat-item countdown-item">
                            <span class="stat-label">OST suivant dans : </span>
                            <span class="stat-value" id="countdown-timer-ost">${getTimeUntilMidnightOST()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const selectedContainer = document.getElementById('selectedPersonnagesOST');
    selectedContainer.insertAdjacentHTML('afterend', victoryHTML);
    
    setTimeout(() => {
        const victoryBox = document.getElementById('victory-box-ost');
        if (victoryBox) {
            victoryBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 150);
    
    setInterval(updateCountdownOST, 1000);
    saveGameStateOST();
    updateStatsOnWinOST();
}

// ===== RECHERCHE =====
function searchPersonnagesOST(query) {
    if (!query || query.length < 1) return [];
    
    const normalizedQuery = removeAccentsOST(query.toLowerCase());
    
    return personnagesOST.filter(perso => {
        const matchesSearch = removeAccentsOST(perso.NOM.toLowerCase()).includes(normalizedQuery);
        const notSelected = !personnagesSelectionnesOST.some(selected => selected.ID === perso.ID);
        const partieEnabled = enabledPartiesOST.includes(perso.PartieNumero);
        
        return matchesSearch && notSelected && partieEnabled;
    }).slice(0, 8);
}

function showSuggestionsOST(personnages) {
    const suggestionsContainer = document.getElementById('suggestionsOST');
    
    if (personnages.length === 0) {
        suggestionsContainer.innerHTML = '<div class="no-results">🔍 Aucun personnage trouvé</div>';
        suggestionsContainer.className = 'suggestions show';
        return;
    }

    suggestionsContainer.innerHTML = personnages.map(perso => `
        <div class="suggestion-item" data-perso-id="${perso.ID}">
            <img src="${getPersonnagePhotoUrlOST(perso)}" alt="${perso.NOM}" class="player-photo"
                 onerror="this.src='https://via.placeholder.com/50x50/FFD700/8B008B?text=${perso.NOM.charAt(0)}'">
            <div class="player-info">
                <div class="player-name">${perso.NOM}</div>
            </div>
        </div>
    `).join('');
    
    suggestionsContainer.className = 'suggestions show';

    document.querySelectorAll('#suggestionsOST .suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            selectPersonnageOST(parseInt(item.getAttribute('data-perso-id')));
        });
    });
}

function hideSuggestionsOST() {
    const suggestionsContainer = document.getElementById('suggestionsOST');
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.className = 'suggestions';
}

// ===== SÉLECTION DE PERSONNAGE =====
function selectPersonnageOST(persoId) {
    const perso = personnagesOST.find(p => p.ID === persoId);
    if (!perso || personnagesSelectionnesOST.some(s => s.ID === persoId)) return;

    personnagesSelectionnesOST.push(perso);
    const searchInput = document.getElementById('searchInputOST');
    searchInput.value = '';
    hideSuggestionsOST();

    const comparison = compareWithDailyOST(perso);
    const alreadyWon = document.getElementById('victory-box-ost') !== null;

    displaySelectedPersonnagesOST();
    updateHintButtonsOST();

    setTimeout(() => {
        const selectedContainer = document.getElementById('selectedPersonnagesOST');
        selectedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    if (comparison?.isCorrectPersonnage && !alreadyWon) {
        setTimeout(() => {
            showVictoryBoxOST();
        }, 1000);
    }

    saveGameStateOST();
}

// ===== AFFICHAGE =====
function displaySelectedPersonnagesOST() {
    const container = document.getElementById('selectedPersonnagesOST');
    
    if (personnagesSelectionnesOST.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="stand-guesses-list">';

    [...personnagesSelectionnesOST].reverse().forEach((perso, index) => {
        const c = compareWithDailyOST(perso);
        const isNewPerso = index === 0 ? ' new-guess' : '';
        const isCorrect = c?.isCorrectPersonnage ? 'correct-guess' : 'incorrect-guess';
        
        html += `
            <div class="stand-guess ${isNewPerso} ${isCorrect}">
                <img src="${getPersonnagePhotoUrlOST(perso)}" 
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
function initOSTEvents() {
    const searchInput = document.getElementById('searchInputOST');
    const searchBtn = document.querySelector('#OST-mode .search-btn');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        query.length === 0 ? hideSuggestionsOST() : showSuggestionsOST(searchPersonnagesOST(query));
    });

    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim();
        if (query.length > 0) showSuggestionsOST(searchPersonnagesOST(query));
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSuggestionsOST();
            searchInput.blur();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const results = searchPersonnagesOST(searchInput.value.trim());
            if (results.length > 0) selectPersonnageOST(results[0].ID);
        }
    });

    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const results = searchPersonnagesOST(searchInput.value.trim());
        results.length === 1 ? selectPersonnageOST(results[0].ID) : showSuggestionsOST(results);
    });
}

// ===== SAUVEGARDE =====
function saveGameStateOST() {
    const state = {
        date: getDailySeedOST(),
        attempts: personnagesSelectionnesOST.map(p => p.ID),
        hasWon: document.getElementById('victory-box-ost') !== null
    };
    localStorage.setItem("jojoOSTState", JSON.stringify(state));
}

function loadGameStateOST() {
    const saved = localStorage.getItem("jojoOSTState");
    if (!saved) return;

    try {
        const state = JSON.parse(saved);

        if (state.date !== getDailySeedOST()) {
            localStorage.removeItem("jojoOSTState");
            return;
        }

        if (personnageDuJourOST && !enabledPartiesOST.includes(personnageDuJourOST.PartieNumero)) {
            console.log('⚠️ Personnage sauvegardé dans partie désactivée, réinitialisation...');
            localStorage.removeItem("jojoOSTState");
            selectDailyOST();
            return;
        }

        state.attempts.forEach(id => {
            const perso = personnagesOST.find(p => p.ID === id);
            if (perso) personnagesSelectionnesOST.push(perso);
        });

        displaySelectedPersonnagesOST();
        updateHintButtonsOST();

        if (state.hasWon) {
            showVictoryBoxOST();
        }
    } catch (e) {
        console.error("Erreur de chargement du state:", e);
        localStorage.removeItem("jojoOSTState");
    }
}

// ===== STATISTIQUES =====
function loadUserStatsOST() {
    const saved = localStorage.getItem('jojoStatsOST');
    if (saved) {
        userStatsOST = JSON.parse(saved);
    }
}

function saveUserStatsOST() {
    localStorage.setItem('jojoStatsOST', JSON.stringify(userStatsOST));
}

function updateStatsOnWinOST() {
    userStatsOST.gamesPlayed++;
    userStatsOST.gamesWon++;
    userStatsOST.currentStreak++;
    userStatsOST.maxStreak = Math.max(userStatsOST.maxStreak, userStatsOST.currentStreak);
    userStatsOST.totalAttempts += personnagesSelectionnesOST.length;
    userStatsOST.averageAttempts = Math.round(userStatsOST.totalAttempts / userStatsOST.gamesWon * 10) / 10;
    saveUserStatsOST();
}

// ===== PARTIES =====
function loadEnabledPartiesOST() {
    const saved = localStorage.getItem('jojoEnabledPartiesOST');
    if (saved) {
        enabledPartiesOST = JSON.parse(saved);
    }
}

function saveEnabledPartiesOST() {
    localStorage.setItem('jojoEnabledPartiesOST', JSON.stringify(enabledPartiesOST));
}

// ===== FONCTIONS MODALES =====
function openStatsModalOST() {
    loadUserStatsOST();
    document.getElementById('stat-played-ost').textContent = userStatsOST.gamesPlayed;
    document.getElementById('stat-won-ost').textContent = userStatsOST.gamesWon;
    
    const winrate = userStatsOST.gamesPlayed > 0 
        ? Math.round((userStatsOST.gamesWon / userStatsOST.gamesPlayed) * 100) 
        : 0;
    document.getElementById('stat-winrate-ost').textContent = winrate + '%';
    
    document.getElementById('stat-current-streak-ost').textContent = userStatsOST.currentStreak;
    document.getElementById('stat-max-streak-ost').textContent = userStatsOST.maxStreak;
    document.getElementById('stat-avg-attempts-ost').textContent = userStatsOST.averageAttempts;
    
    document.getElementById('stats-modal-ost').style.display = 'flex';
}

function closeStatsModalOST() {
    document.getElementById('stats-modal-ost').style.display = 'none';
}

function openPartiesModalOST() {
    loadEnabledPartiesOST();
    
    document.querySelectorAll('.partie-checkbox-ost').forEach(checkbox => {
        const partieNum = parseInt(checkbox.value);
        checkbox.checked = enabledPartiesOST.includes(partieNum);
    });
    
    document.getElementById('parties-modal-ost').style.display = 'flex';
}

function closePartiesModalOST() {
    document.getElementById('parties-modal-ost').style.display = 'none';
}

function togglePartieOST(partieNum) {
    const index = enabledPartiesOST.indexOf(partieNum);
    if (index > -1) {
        enabledPartiesOST.splice(index, 1);
    } else {
        enabledPartiesOST.push(partieNum);
    }
}

function applyPartiesFilterOST() {
    if (enabledPartiesOST.length === 0) {
        alert('⚠️ Vous devez activer au moins une partie !');
        return;
    }
    
    saveEnabledPartiesOST();
    
    const partieNum = personnageDuJourOST?.PartieNumero || 0;
    
    if (!enabledPartiesOST.includes(partieNum)) {
        personnagesSelectionnesOST = [];
        hintButtonsOST = {
            lieu: { unlockAt: 4, visible: false, unlocked: false, revealed: false },
            stand: { unlockAt: 7, visible: false, unlocked: false, revealed: false },
            partie: { unlockAt: 11, visible: false, unlocked: false, revealed: false }
        };
        
        selectDailyOST();
        
        // NE PLUS afficher le nom de l'OST
        const audioSource = document.getElementById('ost-source');
        const audioPlayer = document.getElementById('ost-audio');
        audioSource.src = ostDuJour.Fichier;
        audioPlayer.load();
        
        displaySelectedPersonnagesOST();
        renderHintButtonsOST();
        
        const victoryBox = document.getElementById('victory-box-ost');
        if (victoryBox) victoryBox.remove();
        
        const searchInput = document.getElementById('searchInputOST');
        if (searchInput) {
            searchInput.disabled = false;
            searchInput.placeholder = "Entrez un nom de personnage...";
        }
        
        localStorage.removeItem('jojoOSTState');
        alert('✅ Filtres appliqués ! Nouvel OST');
    } else {
        alert('✅ Filtres appliqués ! L\'OST actuel correspond à vos critères.');
    }
    
    closePartiesModalOST();
}

function resetAllPartiesOST() {
    enabledPartiesOST = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    document.querySelectorAll('.partie-checkbox-ost').forEach(checkbox => {
        checkbox.checked = true;
    });
}

function openHelpModalOST() {
    document.getElementById('help-modal-ost').style.display = 'flex';
}

function closeHelpModalOST() {
    document.getElementById('help-modal-ost').style.display = 'none';
}

// ===== INITIALISATION =====
async function initOSTMode() {
    console.log("Initialisation du mode OST...");
    
    await loadDataOST();
    loadEnabledPartiesOST();
    selectDailyOST();
    
    // NE PLUS afficher le nom de l'OST
    const audioSource = document.getElementById('ost-source');
    const audioPlayer = document.getElementById('ost-audio');
    audioSource.src = ostDuJour.Fichier;
    audioPlayer.load();
    
    renderHintButtonsOST();
    loadGameStateOST();
    initOSTEvents();
    
    window.ostDuJour = ostDuJour;
    
    console.log("Mode OST prêt !");
}

// ===== EXPORTS =====
window.initOSTMode = initOSTMode;
window.toggleHintOST = toggleHintOST;
window.ostDuJour = ostDuJour;
window.openStatsModalOST = openStatsModalOST;
window.closeStatsModalOST = closeStatsModalOST;
window.openPartiesModalOST = openPartiesModalOST;
window.closePartiesModalOST = closePartiesModalOST;
window.togglePartieOST = togglePartieOST;
window.applyPartiesFilterOST = applyPartiesFilterOST;
window.resetAllPartiesOST = resetAllPartiesOST;
window.openHelpModalOST = openHelpModalOST;
window.closeHelpModalOST = closeHelpModalOST;