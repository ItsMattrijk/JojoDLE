// ===== VARIABLES GLOBALES MODE CITATION =====
let personnagesCitation = [];
let personnagesSelectionnesCitation = [];
let citationDuJour = null;
let personnageDuJourCitation = null;
let citationsCitation = [];

let userStatsCitation = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    averageAttempts: 0,
    totalAttempts: 0
};

let enabledPartiesCitation = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ===== CHARGEMENT DES DONNÉES =====
async function loadDataCitation() {
    try {
        const persoResponse = await fetch('assets/js/perso.json');
        
        if (!persoResponse.ok) {
            throw new Error('Erreur de chargement des données');
        }
        
        personnagesCitation = await persoResponse.json();
        
        // Créer des citations fictives pour la démo
        citationsCitation = [
            { ID: 1, Citation: "Yare Yare Daze...", PersonnageID: 1, Contexte: "Expression emblématique de Jotaro" },
            { ID: 2, Citation: "You thought your first kiss would be with JoJo, but it was me, Dio!", PersonnageID: 2, Contexte: "Scène iconique avec Erina" },
            { ID: 3, Citation: "What did you just say about my hair?!", PersonnageID: 3, Contexte: "Réaction violente de Josuke" },
            { ID: 4, Citation: "I, Giorno Giovanna, have a dream.", PersonnageID: 4, Contexte: "Déclaration de Giorno" },
            { ID: 5, Citation: "Your next line is...", PersonnageID: 5, Contexte: "Technique de prédiction de Joseph" },
            { ID: 6, Citation: "Stone Free!", PersonnageID: 6, Contexte: "Invocation du Stand de Jolyne" },
            { ID: 7, Citation: "Polnareff Land!", PersonnageID: 7, Contexte: "Rêve de Polnareff" },
            { ID: 8, Citation: "My name is Yoshikage Kira. I'm 33 years old.", PersonnageID: 9, Contexte: "Présentation de Kira" },
            { ID: 9, Citation: "Arrivederci.", PersonnageID: 10, Contexte: "Phrase signature de Bucciarati" },
            { ID: 10, Citation: "I refuse!", PersonnageID: 11, Contexte: "Refus catégorique de Rohan" }
        ];
        
        console.log(`${personnagesCitation.length} personnages chargés`);
        console.log(`${citationsCitation.length} citations chargées`);
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
    }
}

// ===== UTILITAIRES =====
function getPersonnagePhotoUrlCitation(perso) {
    if (perso.Photo && perso.Photo.startsWith('http')) return perso.Photo;
    if (perso.Photo) return perso.Photo;
    return `https://via.placeholder.com/80x80/FFD700/8B008B?text=${perso.NOM.charAt(0)}`;
}

function getDailySeedCitation() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function seededRandomCitation(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getTimeUntilMidnightCitation() {
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

function updateCountdownCitation() {
    const countdownElement = document.getElementById('countdown-timer-citation');
    if (countdownElement) countdownElement.textContent = getTimeUntilMidnightCitation();
}

function removeAccentsCitation(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ===== LOGIQUE DU JEU =====
function selectDailyCitation() {
    if (citationsCitation.length === 0) {
        console.error('Aucune citation chargée');
        return null;
    }
    
    const filteredCitations = citationsCitation.filter(citation => {
        const perso = personnagesCitation.find(p => p.ID === citation.PersonnageID);
        return perso && enabledPartiesCitation.includes(perso.PartieNumero);
    });
    
    console.log('🔍 Filtrage:', filteredCitations.length, 'citations sur', citationsCitation.length);
    
    if (filteredCitations.length === 0) {
        console.warn('⚠️ Aucune citation disponible - Réactivation de toutes les parties');
        enabledPartiesCitation = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        saveEnabledPartiesCitation();
        return selectDailyCitation();
    }
    
    const seed = getDailySeedCitation();
    const randomValue = seededRandomCitation(seed);
    const index = Math.floor(randomValue * filteredCitations.length);
    citationDuJour = filteredCitations[index];
    
    personnageDuJourCitation = personnagesCitation.find(p => p.ID === citationDuJour.PersonnageID);
    
    console.log('✅ Citation du jour:', citationDuJour.Citation, '- Personnage:', personnageDuJourCitation?.NOM);
    return citationDuJour;
}

function compareWithDailyCitation(perso) {
    if (!personnageDuJourCitation) return null;
    
    return {
        isCorrectPersonnage: perso.ID === personnageDuJourCitation.ID
    };
}

// ===== VICTOIRE =====
function showVictoryBoxCitation() {
    if (document.getElementById('victory-box-citation')) return;
    
    const searchInput = document.getElementById('searchInputCitation');
    searchInput.disabled = true;
    searchInput.placeholder = "Citation trouvée ! Revenez demain...";
    
    const victoryHTML = `
        <div class="victory-container" id="victory-box-citation">
            <div class="box">
                <div class="title victory-title">🎉 VICTOIRE ! 🎉</div>
                <div class="victory-content">
                    <img src="${getPersonnagePhotoUrlCitation(personnageDuJourCitation)}" 
                         alt="${personnageDuJourCitation.NOM}" 
                         class="victory-photo"
                         onerror="this.src='https://via.placeholder.com/150x150/FFD700/8B008B?text=${personnageDuJourCitation.NOM.charAt(0)}'">
                    <div class="victory-text">
                        Bravo ! Cette citation appartient à <strong>${personnageDuJourCitation.NOM}</strong> !
                    </div>
                    <div class="victory-stats">
                        <div class="stat-item">
                            <span class="stat-label">Nombre d'essais :</span>
                            <span class="stat-value">${personnagesSelectionnesCitation.length}</span>
                        </div>
                        <div class="stat-item countdown-item">
                            <span class="stat-label">Citation suivante dans : </span>
                            <span class="stat-value" id="countdown-timer-citation">${getTimeUntilMidnightCitation()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const selectedContainer = document.getElementById('selectedPersonnagesCitation');
    selectedContainer.insertAdjacentHTML('afterend', victoryHTML);
    
    setTimeout(() => {
        const victoryBox = document.getElementById('victory-box-citation');
        if (victoryBox) {
            victoryBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 150);
    
    setInterval(updateCountdownCitation, 1000);
    saveGameStateCitation();
    updateStatsOnWinCitation();
}

// ===== RECHERCHE =====
function searchPersonnagesCitation(query) {
    if (!query || query.length < 1) return [];
    
    const normalizedQuery = removeAccentsCitation(query.toLowerCase());
    
    return personnagesCitation.filter(perso => {
        const matchesSearch = removeAccentsCitation(perso.NOM.toLowerCase()).includes(normalizedQuery);
        const notSelected = !personnagesSelectionnesCitation.some(selected => selected.ID === perso.ID);
        const partieEnabled = enabledPartiesCitation.includes(perso.PartieNumero);
        
        return matchesSearch && notSelected && partieEnabled;
    }).slice(0, 8);
}

function showSuggestionsCitation(personnages) {
    const suggestionsContainer = document.getElementById('suggestionsCitation');
    
    if (personnages.length === 0) {
        suggestionsContainer.innerHTML = '<div class="no-results">🔍 Aucun personnage trouvé</div>';
        suggestionsContainer.className = 'suggestions show';
        return;
    }

    suggestionsContainer.innerHTML = personnages.map(perso => `
        <div class="suggestion-item" data-perso-id="${perso.ID}">
            <img src="${getPersonnagePhotoUrlCitation(perso)}" alt="${perso.NOM}" class="player-photo"
                 onerror="this.src='https://via.placeholder.com/50x50/FFD700/8B008B?text=${perso.NOM.charAt(0)}'">
            <div class="player-info">
                <div class="player-name">${perso.NOM}</div>
            </div>
        </div>
    `).join('');
    
    suggestionsContainer.className = 'suggestions show';

    document.querySelectorAll('#suggestionsCitation .suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            selectPersonnageCitation(parseInt(item.getAttribute('data-perso-id')));
        });
    });
}

function hideSuggestionsCitation() {
    const suggestionsContainer = document.getElementById('suggestionsCitation');
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.className = 'suggestions';
}

// ===== SÉLECTION DE PERSONNAGE =====
function selectPersonnageCitation(persoId) {
    const perso = personnagesCitation.find(p => p.ID === persoId);
    if (!perso || personnagesSelectionnesCitation.some(s => s.ID === persoId)) return;

    personnagesSelectionnesCitation.push(perso);
    const searchInput = document.getElementById('searchInputCitation');
    searchInput.value = '';
    hideSuggestionsCitation();

    const comparison = compareWithDailyCitation(perso);
    const alreadyWon = document.getElementById('victory-box-citation') !== null;

    displaySelectedPersonnagesCitation();
    updateHintButtonsCitation();

    setTimeout(() => {
        const selectedContainer = document.getElementById('selectedPersonnagesCitation');
        selectedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    if (comparison?.isCorrectPersonnage && !alreadyWon) {
        setTimeout(() => {
            showVictoryBoxCitation();
        }, 1000);
    }

    saveGameStateCitation();
}

// ===== AFFICHAGE =====
function displaySelectedPersonnagesCitation() {
    const container = document.getElementById('selectedPersonnagesCitation');
    
    if (personnagesSelectionnesCitation.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="stand-guesses-list">';

    [...personnagesSelectionnesCitation].reverse().forEach((perso, index) => {
        const c = compareWithDailyCitation(perso);
        const isNewPerso = index === 0 ? ' new-guess' : '';
        const isCorrect = c?.isCorrectPersonnage ? 'correct-guess' : 'incorrect-guess';
        
        html += `
            <div class="stand-guess ${isNewPerso} ${isCorrect}">
                <img src="${getPersonnagePhotoUrlCitation(perso)}" 
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
function initCitationEvents() {
    const searchInput = document.getElementById('searchInputCitation');
    const searchBtn = document.querySelector('#Citation-mode .search-btn');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        query.length === 0 ? hideSuggestionsCitation() : showSuggestionsCitation(searchPersonnagesCitation(query));
    });

    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim();
        if (query.length > 0) showSuggestionsCitation(searchPersonnagesCitation(query));
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSuggestionsCitation();
            searchInput.blur();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const results = searchPersonnagesCitation(searchInput.value.trim());
            if (results.length > 0) selectPersonnageCitation(results[0].ID);
        }
    });

    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const results = searchPersonnagesCitation(searchInput.value.trim());
        results.length === 1 ? selectPersonnageCitation(results[0].ID) : showSuggestionsCitation(results);
    });
}

// ===== SAUVEGARDE =====
function saveGameStateCitation() {
    const state = {
        date: getDailySeedCitation(),
        attempts: personnagesSelectionnesCitation.map(p => p.ID),
        hasWon: document.getElementById('victory-box-citation') !== null
    };
    localStorage.setItem("jojoCitationState", JSON.stringify(state));
}

function loadGameStateCitation() {
    const saved = localStorage.getItem("jojoCitationState");
    if (!saved) return;

    try {
        const state = JSON.parse(saved);

        if (state.date !== getDailySeedCitation()) {
            localStorage.removeItem("jojoCitationState");
            return;
        }

        if (personnageDuJourCitation && !enabledPartiesCitation.includes(personnageDuJourCitation.PartieNumero)) {
            console.log('⚠️ Personnage sauvegardé dans partie désactivée, réinitialisation...');
            localStorage.removeItem("jojoCitationState");
            selectDailyCitation();
            return;
        }

        state.attempts.forEach(id => {
            const perso = personnagesCitation.find(p => p.ID === id);
            if (perso) personnagesSelectionnesCitation.push(perso);
        });

        displaySelectedPersonnagesCitation();
        updateHintButtonsCitation();

        if (state.hasWon) {
            showVictoryBoxCitation();
        }
    } catch (e) {
        console.error("Erreur de chargement du state:", e);
        localStorage.removeItem("jojoCitationState");
    }
}

// ===== STATISTIQUES =====
function loadUserStatsCitation() {
    const saved = localStorage.getItem('jojoStatsCitation');
    if (saved) {
        userStatsCitation = JSON.parse(saved);
    }
}

function saveUserStatsCitation() {
    localStorage.setItem('jojoStatsCitation', JSON.stringify(userStatsCitation));
}

function updateStatsOnWinCitation() {
    userStatsCitation.gamesPlayed++;
    userStatsCitation.gamesWon++;
    userStatsCitation.currentStreak++;
    userStatsCitation.maxStreak = Math.max(userStatsCitation.maxStreak, userStatsCitation.currentStreak);
    userStatsCitation.totalAttempts += personnagesSelectionnesCitation.length;
    userStatsCitation.averageAttempts = Math.round(userStatsCitation.totalAttempts / userStatsCitation.gamesWon * 10) / 10;
    saveUserStatsCitation();
}

// ===== PARTIES =====
function loadEnabledPartiesCitation() {
    const saved = localStorage.getItem('jojoEnabledPartiesCitation');
    if (saved) {
        enabledPartiesCitation = JSON.parse(saved);
    }
}

function saveEnabledPartiesCitation() {
    localStorage.setItem('jojoEnabledPartiesCitation', JSON.stringify(enabledPartiesCitation));
}

// ===== FONCTIONS MODALES =====
function openStatsModalCitation() {
    loadUserStatsCitation();
    document.getElementById('stat-played-citation').textContent = userStatsCitation.gamesPlayed;
    document.getElementById('stat-won-citation').textContent = userStatsCitation.gamesWon;
    
    const winrate = userStatsCitation.gamesPlayed > 0 
        ? Math.round((userStatsCitation.gamesWon / userStatsCitation.gamesPlayed) * 100) 
        : 0;
    document.getElementById('stat-winrate-citation').textContent = winrate + '%';
    
    document.getElementById('stat-current-streak-citation').textContent = userStatsCitation.currentStreak;
    document.getElementById('stat-max-streak-citation').textContent = userStatsCitation.maxStreak;
    document.getElementById('stat-avg-attempts-citation').textContent = userStatsCitation.averageAttempts;
    
    document.getElementById('stats-modal-citation').style.display = 'flex';
}

function closeStatsModalCitation() {
    document.getElementById('stats-modal-citation').style.display = 'none';
}

function openPartiesModalCitation() {
    loadEnabledPartiesCitation();
    
    document.querySelectorAll('.partie-checkbox-citation').forEach(checkbox => {
        const partieNum = parseInt(checkbox.value);
        checkbox.checked = enabledPartiesCitation.includes(partieNum);
    });
    
    document.getElementById('parties-modal-citation').style.display = 'flex';
}

function closePartiesModalCitation() {
    document.getElementById('parties-modal-citation').style.display = 'none';
}

function togglePartieCitation(partieNum) {
    const index = enabledPartiesCitation.indexOf(partieNum);
    if (index > -1) {
        enabledPartiesCitation.splice(index, 1);
    } else {
        enabledPartiesCitation.push(partieNum);
    }
}

function applyPartiesFilterCitation() {
    if (enabledPartiesCitation.length === 0) {
        alert('⚠️ Vous devez activer au moins une partie !');
        return;
    }
    
    saveEnabledPartiesCitation();
    
    const partieNum = personnageDuJourCitation?.PartieNumero || 0;
    
    if (!enabledPartiesCitation.includes(partieNum)) {
        personnagesSelectionnesCitation = [];
        hintButtonsCitation = {
            partie: { unlockAt: 4, visible: false, unlocked: false, revealed: false },
            apparition: { unlockAt: 7, visible: false, unlocked: false, revealed: false },
            contexte: { unlockAt: 11, visible: false, unlocked: false, revealed: false }
        };
        
        selectDailyCitation();
        document.getElementById('citation-text').textContent = citationDuJour.Citation;
        
        displaySelectedPersonnagesCitation();
        renderHintButtonsCitation();
        
        const victoryBox = document.getElementById('victory-box-citation');
        if (victoryBox) victoryBox.remove();
        
        const searchInput = document.getElementById('searchInputCitation');
        if (searchInput) {
            searchInput.disabled = false;
            searchInput.placeholder = "Entrez un nom de personnage...";
        }
        
        localStorage.removeItem('jojoCitationState');
        alert('✅ Filtres appliqués ! Nouvelle citation');
    } else {
        alert('✅ Filtres appliqués ! La citation actuelle correspond à vos critères.');
    }
    
    closePartiesModalCitation();
}

function resetAllPartiesCitation() {
    enabledPartiesCitation = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    document.querySelectorAll('.partie-checkbox-citation').forEach(checkbox => {
        checkbox.checked = true;
    });
}

function openHelpModalCitation() {
    document.getElementById('help-modal-citation').style.display = 'flex';
}

function closeHelpModalCitation() {
    document.getElementById('help-modal-citation').style.display = 'none';
}

// ===== INITIALISATION =====
async function initCitationMode() {
    console.log("Initialisation du mode Citation...");
    
    await loadDataCitation();
    loadEnabledPartiesCitation();
    selectDailyCitation();
    
    // Afficher la citation
    document.getElementById('citation-text').textContent = citationDuJour.Citation;
    
    renderHintButtonsCitation();
    loadGameStateCitation();
    initCitationEvents();
    
    console.log("Mode Citation prêt !");
}

// ===== EXPORTS =====
window.initCitationMode = initCitationMode;
window.toggleHintCitation = toggleHintCitation;
window.openStatsModalCitation = openStatsModalCitation;
window.closeStatsModalCitation = closeStatsModalCitation;
window.openPartiesModalCitation = openPartiesModalCitation;
window.closePartiesModalCitation = closePartiesModalCitation;
window.togglePartieCitation = togglePartieCitation;
window.applyPartiesFilterCitation = applyPartiesFilterCitation;
window.resetAllPartiesCitation = resetAllPartiesCitation;
window.openHelpModalCitation = openHelpModalCitation;
window.closeHelpModalCitation = closeHelpModalCitation;