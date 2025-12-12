// ===== VARIABLES GLOBALES MODE CLASSIQUE =====
let personnages = [];
let personnagesSelectionnes = [];
let personnageDuJour = null;
let stands = [];
let citationInitialized = false;
let ostInitialized = false;

let userStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    averageAttempts: 0,
    totalAttempts: 0
};

let enabledParties = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // Par défaut toutes les parties sont activées

// ===== SYSTÈME D'INDICES =====
let hintButtonsClassique = {
    apparition: { unlockAt: 5, visible: false, unlocked: false, revealed: false },
    etat_vital: { unlockAt: 9, visible: false, unlocked: false, revealed: false },
    stand_info: { unlockAt: 13, visible: false, unlocked: false, revealed: false }
};

// ===== CHARGEMENT DES DONNÉES =====
async function loadPersonnages() {
    try {
        const [persoResponse, standResponse] = await Promise.all([
            fetch('assets/js/perso.json'),
            fetch('assets/js/stand.json')
        ]);
        
        if (!persoResponse.ok || !standResponse.ok) {
            throw new Error('Erreur de chargement des données');
        }
        
        personnages = await persoResponse.json();
        stands = await standResponse.json();
        
        console.log(`${personnages.length} personnages chargés`);
        console.log(`${stands.length} stands chargés`);
        
        // AJOUTEZ CES VÉRIFICATIONS :
        console.log('🔍 Vérification des PartieNumero:');
        let hasError = false;
        personnages.forEach(p => {
            if (!p.PartieNumero) {
                console.error(`❌ ${p.NOM} n'a pas de PartieNumero!`);
                hasError = true;
            }
        });
        
        if (!hasError) {
            console.log('✅ Tous les personnages ont un PartieNumero');
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
    }
}

// ===== UTILITAIRES =====
function getPersonnagePhotoUrl(perso) {
    if (perso.Photo && perso.Photo.startsWith('http')) return perso.Photo;
    if (perso.Photo) return perso.Photo;
    return `https://via.placeholder.com/80x80/FFD700/8B008B?text=${perso.NOM.charAt(0)}`;
}

function getDailySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getTimeUntilMidnight() {
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

function updateCountdown() {
    const countdownElement = document.getElementById('countdown-timer-classique');
    if (countdownElement) countdownElement.textContent = getTimeUntilMidnight();
}

function getArrowIcon(direction) {
    if (!direction) return '';
    const path = direction === 'up' 
        ? 'M12 5L12 19M12 5L6 11M12 5L18 11' 
        : 'M12 19L12 5M12 19L18 13M12 19L6 13';
    return `<span class="arrow-indicator"><svg viewBox="0 0 24 24" fill="none"><path d="${path}" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
}

function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ===== LOGIQUE DU JEU =====
function selectDailyPersonnage() {
    if (personnages.length === 0) {
        console.error('Aucun personnage chargé');
        return null;
    }
    
    // NE PAS recharger depuis localStorage, utiliser la variable globale
    
    // Filtrer les personnages selon les parties activées
    const filteredPersonnages = personnages.filter(p => {
        return enabledParties.includes(p.PartieNumero);
    });
    
    console.log('🔍 Filtrage:', filteredPersonnages.length, 'personnages sur', personnages.length);
    console.log('📚 Parties actives:', enabledParties);
    
    if (filteredPersonnages.length === 0) {
        console.warn('⚠️ Aucun personnage disponible - Réactivation de toutes les parties');
        enabledParties = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        saveEnabledParties();
        // Refiltrer avec toutes les parties
        return selectDailyPersonnage();
    }
    
    const seed = getDailySeed();
    const randomValue = seededRandom(seed);
    const index = Math.floor(randomValue * filteredPersonnages.length);
    personnageDuJour = filteredPersonnages[index];
    
    console.log('✅ Personnage du jour:', personnageDuJour.NOM, '- Partie', personnageDuJour.PartieNumero);
    return personnageDuJour;
}

function compareWithDailyPersonnage(perso) {
    if (!personnageDuJour) return null;
    
    const compareValue = (val1, val2) => {
        // Convertir "Inconnu" en 0
        const num1 = val1 === "Inconnu" ? 0 : parseInt(val1);
        const num2 = val2 === "Inconnu" ? 0 : parseInt(val2);
        
        // Si les deux sont invalides (NaN), comparer les textes
        if (isNaN(num1) && isNaN(num2)) {
            return {
                status: val1 === val2 ? 'correct' : 'incorrect',
                direction: null
            };
        }
        
        // Maintenant num1 et num2 sont toujours des nombres (0 si "Inconnu")
        return {
            status: num1 === num2 ? 'correct' : 'incorrect',
            direction: num1 < num2 ? 'up' : (num1 > num2 ? 'down' : null)
        };
    };
    
    return {
        genre: perso.Genre === personnageDuJour.Genre ? 'correct' : 'incorrect',
        origine: perso.Origine === personnageDuJour.Origine ? 'correct' : 'incorrect',
        stand: perso.Stand === personnageDuJour.Stand ? 'correct' : 'incorrect',
        naissance: compareValue(perso.Naissance, personnageDuJour.Naissance),
        poids: compareValue(perso.Poids, personnageDuJour.Poids),
        taille: compareValue(perso.Taille, personnageDuJour.Taille),
        lieu_apparition: perso["Lieu d'apparition"] === personnageDuJour["Lieu d'apparition"] ? 'correct' : 'incorrect',
        partie: perso.Partie === personnageDuJour.Partie ? 'correct' : 'incorrect',
        isCorrectPersonnage: perso.ID === personnageDuJour.ID
    };
}


// ===== SYSTÈME D'INDICES =====
function updateHintButtonsClassique() {
    const attempts = personnagesSelectionnes.length;
    
    if (attempts >= 1) {
        hintButtonsClassique.apparition.visible = true;
        hintButtonsClassique.etat_vital.visible = true;
        hintButtonsClassique.stand_info.visible = true;
    }
    
    if (attempts >= 5) hintButtonsClassique.apparition.unlocked = true;
    if (attempts >= 9) hintButtonsClassique.etat_vital.unlocked = true;
    if (attempts >= 13) hintButtonsClassique.stand_info.unlocked = true;
    
    renderHintButtonsClassique();
}

function toggleHintClassique(hintType) {
    const config = hintButtonsClassique[hintType];
    if (!config || !config.unlocked) return;
    
    config.revealed = !config.revealed;
    renderHintButtonsClassique();
}

function renderHintButtonsClassique() {
    const container = document.querySelector('#classique-mode .hint-buttons-container');
    if (!container) return;
    
    const attempts = personnagesSelectionnes.length;
    
    // Récupérer les infos du Stand si nécessaire
    let standInfo = 'N/A';
    if (personnageDuJour && personnageDuJour.NomStand) {
        const stand = stands.find(s => s.ID === personnageDuJour.NomStand);
        if (stand) {
            standInfo = `${stand.Nom}`;
        }
    }
    
    const hints = [
        {
            type: 'apparition',
            icon: '📅',
            label: 'Apparition',
            value: personnageDuJour?.Apparition || 'N/A',
            unlockAt: 5
        },
        {
            type: 'etat_vital',
            icon: '💀',
            label: 'État Vital',
            value: personnageDuJour?.EtatVital || 'N/A',
            unlockAt: 9
        },
        {
            type: 'stand_info',
            icon: '⭐',
            label: 'Stand',
            value: standInfo,
            unlockAt: 13
        }
    ];
    
    // CORRECTION: Sauvegarder les états précédents pour éviter l'animation
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
        const config = hintButtonsClassique[hint.type];
        const isVisible = config.visible;
        const isUnlocked = config.unlocked;
        const attemptsNeeded = hint.unlockAt - attempts;
        
        // Déterminer si c'est la première fois que le bouton devient visible
        const wasVisible = previousStates[hint.type]?.visible || false;
        const isFirstReveal = isVisible && !wasVisible;
        
        return `
            <div class="hint-button ${isVisible ? 'visible' : ''} ${isUnlocked ? 'unlocked' : ''} ${config.revealed ? 'active' : ''} ${isFirstReveal ? 'first-reveal' : ''}" 
                 data-hint="${hint.type}"
                 ${isUnlocked ? `onclick="toggleHintClassique('${hint.type}')"` : ''}>
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
                    <div class="hint-value ${config.revealed ? 'revealed' : ''} ${hint.type === 'stand_info' ? 'hint-value-long' : ''}">
                        ${hint.value}
                    </div>
                `}
            </div>
        `;
    }).join('');
    
    // CORRECTION: Supprimer la classe first-reveal après l'animation
    setTimeout(() => {
        container.querySelectorAll('.hint-button.first-reveal').forEach(btn => {
            btn.classList.remove('first-reveal');
        });
    }, 500);
}


// ===== VICTOIRE =====
function showVictoryBoxClassique() {
    if (document.getElementById('victory-box-classique')) return;
    
    const searchInput = document.getElementById('searchInputClassique');
    searchInput.disabled = true;
    searchInput.placeholder = "Personnage trouvé ! Revenez demain...";
    
    // Suppression du délai
    const victoryHTML = `
        <div class="victory-container" id="victory-box-classique">
            <div class="box">
                <div class="title victory-title">🎉 VICTOIRE ! 🎉</div>
                <div class="victory-content">
                    <img src="${getPersonnagePhotoUrl(personnageDuJour)}" 
                         alt="${personnageDuJour.NOM}" 
                         class="victory-photo"
                         onerror="this.src='https://via.placeholder.com/150x150/FFD700/8B008B?text=${personnageDuJour.NOM.charAt(0)}'">
                    <div class="victory-text">
                        Bravo ! Vous avez trouvé <strong>${personnageDuJour.NOM}</strong> !
                    </div>
                    <div class="victory-stats">
                        <div class="stat-item">
                            <span class="stat-label">Nombre d'essais :</span>
                            <span class="stat-value">${personnagesSelectionnes.length}</span>
                        </div>
                        <div class="stat-item countdown-item">
                            <span class="stat-label">Personnage suivant dans : </span>
                            <span class="stat-value" id="countdown-timer-classique">${getTimeUntilMidnight()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const selectedContainer = document.getElementById('selectedPersonnagesClassique');
    selectedContainer.insertAdjacentHTML('afterend', victoryHTML);
    
    // Scroll immédiat
    setTimeout(() => {
        const victoryBox = document.getElementById('victory-box-classique');
        if (victoryBox) {
            victoryBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 150);
    
    setInterval(updateCountdown, 1000);
    saveGameStateClassique();
    updateStatsOnWin();
}

// ===== RECHERCHE =====
function searchPersonnages(query) {
    if (!query || query.length < 1) return [];
    
    const normalizedQuery = removeAccents(query.toLowerCase());
    
    return personnages.filter(perso => {
        // Vérifier que le personnage correspond à la recherche
        const matchesSearch = removeAccents(perso.NOM.toLowerCase()).includes(normalizedQuery);
        
        // Vérifier que le personnage n'est pas déjà sélectionné
        const notSelected = !personnagesSelectionnes.some(selected => selected.ID === perso.ID);
        
        // Vérifier que le personnage est dans une partie activée
        const partieEnabled = enabledParties.includes(perso.PartieNumero);
        
        return matchesSearch && notSelected && partieEnabled;
    }).slice(0, 8);
}
function showSuggestionsClassique(personnages) {
    const suggestionsContainer = document.getElementById('suggestionsClassique');
    
    if (personnages.length === 0) {
        suggestionsContainer.innerHTML = '<div class="no-results">🔍 Aucun personnage trouvé</div>';
        suggestionsContainer.className = 'suggestions show';
        return;
    }

    suggestionsContainer.innerHTML = personnages.map(perso => `
        <div class="suggestion-item" data-perso-id="${perso.ID}">
            <img src="${getPersonnagePhotoUrl(perso)}" alt="${perso.NOM}" class="player-photo"
                 onerror="this.src='https://via.placeholder.com/50x50/FFD700/8B008B?text=${perso.NOM.charAt(0)}'">
            <div class="player-info">
                <div class="player-name">${perso.NOM}</div>
            </div>
        </div>
    `).join('');
    
    suggestionsContainer.className = 'suggestions show';

    document.querySelectorAll('#suggestionsClassique .suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            selectPersonnage(parseInt(item.getAttribute('data-perso-id')));
        });
    });
}

function hideSuggestionsClassique() {
    const suggestionsContainer = document.getElementById('suggestionsClassique');
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.className = 'suggestions';
}

// ===== SÉLECTION DE PERSONNAGE =====
function selectPersonnage(persoId) {
    const perso = personnages.find(p => p.ID === persoId);
    if (!perso || personnagesSelectionnes.some(s => s.ID === persoId)) return;

    personnagesSelectionnes.push(perso);
    const searchInput = document.getElementById('searchInputClassique');
    searchInput.value = '';
    hideSuggestionsClassique();

    const comparison = compareWithDailyPersonnage(perso);
    const alreadyWon = document.getElementById('victory-box-classique') !== null;

    renderPersonnagesResponsive();
    updateHintButtonsClassique();

    setTimeout(() => {
        const selectedContainer = document.getElementById('selectedPersonnagesClassique');
        selectedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    if (comparison?.isCorrectPersonnage && !alreadyWon) {
        setTimeout(() => {
            showVictoryBoxClassique();
        }, 3000);
    }

    saveGameStateClassique();
}

// ===== AFFICHAGE =====
function displaySelectedPersonnages() {
    const container = document.getElementById('selectedPersonnagesClassique');
    
    if (personnagesSelectionnes.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <div class="categories-header">
            <div class="category-header-item">Personnage</div>
            <div class="category-header-item">Genre</div>
            <div class="category-header-item">Origine</div>
            <div class="category-header-item">Stand</div>
            <div class="category-header-item">Naissance</div>
            <div class="category-header-item">Poids</div>
            <div class="category-header-item">Taille</div>
            <div class="category-header-item">Apparition</div>
            <div class="category-header-item">Partie</div>
        </div>
        <div id="personnages-list">
    `;

    [...personnagesSelectionnes].reverse().forEach((perso, index) => {
        const c = compareWithDailyPersonnage(perso);
        const isNewPerso = index === 0 ? ' new-player' : '';
        
        html += `
            <div class="selected-player${isNewPerso}">
                <div class="player-categories">
                    <div class="category">
                        <div class="category-content">
                            <img src="${getPersonnagePhotoUrl(perso)}" alt="${perso.NOM}" class="player-main-photo"
                                 onerror="this.src='https://via.placeholder.com/80x80/FFD700/8B008B?text=${perso.NOM.charAt(0)}'">
                            <span class="player-name-main">${perso.NOM}</span>
                        </div>
                    </div>
                    <div class="category ${c.genre}">
                        <div class="category-content">
                            <span class="category-value">${perso.Genre}</span>
                        </div>
                    </div>
                    <div class="category ${c.origine}">
                        <div class="category-content">
                            <span class="category-value">${perso.Origine}</span>
                        </div>
                    </div>
                    <div class="category ${c.stand}">
                        <div class="category-content">
                            <span class="category-value">${perso.Stand}</span>
                        </div>
                    </div>
                    <div class="category ${c.naissance.status}">
                        <div class="category-content">
                            ${c.naissance.direction ? getArrowIcon(c.naissance.direction) : ''}
                            <span class="category-value">${perso.Naissance}</span>
                        </div>
                    </div>
                    <div class="category ${c.poids.status}">
                        <div class="category-content">
                            ${c.poids.direction ? getArrowIcon(c.poids.direction) : ''}
                            <span class="category-value">${perso.Poids}</span>
                        </div>
                    </div>
                    <div class="category ${c.taille.status}">
                        <div class="category-content">
                            ${c.taille.direction ? getArrowIcon(c.taille.direction) : ''}
                            <span class="category-value">${perso.Taille}</span>
                        </div>
                    </div>
                    <div class="category ${c.lieu_apparition}">
                        <div class="category-content">
                            <span class="category-value">${perso["Lieu d'apparition"]}</span>
                        </div>
                    </div>
                    <div class="category ${c.partie}">
                        <div class="category-content">
                            <span class="category-value">${perso.Partie}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
    
setTimeout(() => {
    document.querySelectorAll('.category-value, .category-header-item').forEach(el => {
        const textLength = el.textContent.trim().length;
        el.setAttribute('data-length', textLength);
    });

    autoResizeCategoryText();

    // Retirer la classe après que TOUTE l'animation soit terminée
    const newPersoEl = document.querySelector('#selectedPersonnagesClassique .selected-player.new-player');
    if (newPersoEl) {
        setTimeout(() => {
            newPersoEl.classList.remove('new-player');
        }, 2600); // 1 seconde = temps pour que toutes les catégories apparaissent
    }
}, 50);
}

function autoResizeCategoryText() {
    document.querySelectorAll(".category-value").forEach(el => {
        let maxWidth = el.parentElement.offsetWidth - 8; // marge
        let fontSize = 16; // taille max en px pour desktop
        
        // Ajuster la taille de base selon la largeur d'écran
        if (window.innerWidth <= 768) {
            fontSize = 12; // mobile
        } else if (window.innerWidth <= 1024) {
            fontSize = 14; // tablette
        }
        
        el.style.fontSize = fontSize + "px";

        // Réduire jusqu'à ce que ça rentre
        while (el.scrollWidth > maxWidth && fontSize > 6) {
            fontSize -= 0.5;
            el.style.fontSize = fontSize + "px";
        }
    });
}

function displaySelectedPersonnagesMobile() {
    const container = document.getElementById('selectedPersonnagesClassique');
    
    if (personnagesSelectionnes.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = `
      <div class="carousel-wrapper">
        <div class="carousel-scroll-hint">
          ← Défiler Horizontalement pour voir plus →
        </div>
        <div class="carousel-container">
          <div class="carousel-track">
            <div class="categories-header">
              <div class="category-header-item">Personnage</div>
              <div class="category-header-item">Genre</div>
              <div class="category-header-item">Origine</div>
              <div class="category-header-item">Stand</div>
              <div class="category-header-item">Naissance</div>
              <div class="category-header-item">Poids</div>
              <div class="category-header-item">Taille</div>
              <div class="category-header-item">Lieu</div>
              <div class="category-header-item">Partie</div>
            </div>
    `;

    [...personnagesSelectionnes].reverse().forEach((perso, index) => {
        const c = compareWithDailyPersonnage(perso) || {};
        const isNewPerso = index === 0 ? ' new-player' : '';

        html += `
          <div class="player-categories${isNewPerso}">
            <div class="category">
              <div class="category-content">
                <img src="${getPersonnagePhotoUrl(perso)}" alt="${perso.NOM}" class="player-main-photo"
                     onerror="this.src='https://via.placeholder.com/100x100/FFD700/8B008B?text=${(perso.NOM||'').charAt(0)}'">
                <span class="player-name-main">${perso.NOM ?? '—'}</span>
              </div>
            </div>

            <div class="category ${c.genre ?? ''}">
              <div class="category-content">
                <span class="category-value">${perso.Genre ?? '—'}</span>
              </div>
            </div>

            <div class="category ${c.origine ?? ''}">
              <div class="category-content">
                <span class="category-value">${perso.Origine ?? '—'}</span>
              </div>
            </div>

            <div class="category ${c.stand ?? ''}">
              <div class="category-content">
                <span class="category-value">${perso.Stand ?? '—'}</span>
              </div>
            </div>

            <div class="category ${c.naissance?.status ?? ''}">
              <div class="category-content">
                ${c.naissance?.direction ? getArrowIcon(c.naissance.direction) : ''}
                <span class="category-value">${perso.Naissance ?? '—'}</span>
              </div>
            </div>

            <div class="category ${c.poids?.status ?? ''}">
              <div class="category-content">
                ${c.poids?.direction ? getArrowIcon(c.poids.direction) : ''}
                <span class="category-value">${perso.Poids ?? '—'}</span>
              </div>
            </div>

            <div class="category ${c.taille?.status ?? ''}">
              <div class="category-content">
                ${c.taille?.direction ? getArrowIcon(c.taille.direction) : ''}
                <span class="category-value">${perso.Taille ?? '—'}</span>
              </div>
            </div>

            <div class="category ${c.lieu_apparition ?? ''}">
              <div class="category-content">
                <span class="category-value">${perso["Lieu d'apparition"] ?? '—'}</span>
              </div>
            </div>

            <div class="category ${c.partie ?? ''}">
              <div class="category-content">
                <span class="category-value">${perso.Partie ?? '—'}</span>
              </div>
            </div>
          </div>
        `;
    });

    html += `
          </div>
        </div>
        <div class="carousel-scrollbar">
          <div class="carousel-scrollbar-thumb"></div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    setTimeout(() => {
        document.querySelectorAll('.category-value, .category-header-item').forEach(el => {
            const textLength = el.textContent.trim().length;
            el.setAttribute('data-length', textLength);
        });

        autoResizeCategoryText();
        initCarouselScrollbar();
        
        const newPersoEl = document.querySelector('#selectedPersonnagesClassique .player-categories.new-player');
        if (newPersoEl) {
            setTimeout(() => {
                newPersoEl.classList.remove('new-player');
            }, 1000); // Uniformiser avec le desktop
        }
        
    }, 50);
}

function initCarouselScrollbar() {
    const carouselContainer = document.querySelector('.carousel-container');
    const scrollbar = document.querySelector('.carousel-scrollbar-thumb');
    
    if (!carouselContainer || !scrollbar) return;
    
    // Calculer la largeur du thumb
    const updateThumbWidth = () => {
        const thumbWidth = (carouselContainer.clientWidth / carouselContainer.scrollWidth) * 100;
        scrollbar.style.width = `${Math.max(thumbWidth, 10)}%`;
    };
    
    // Mettre à jour la position du thumb lors du scroll
    const updateThumbPosition = () => {
        const scrollPercentage = carouselContainer.scrollLeft / 
            (carouselContainer.scrollWidth - carouselContainer.clientWidth);
        const maxScroll = 100 - parseFloat(scrollbar.style.width);
        scrollbar.style.left = `${scrollPercentage * maxScroll}%`;
    };
    
    // Initialiser
    updateThumbWidth();
    updateThumbPosition();
    
    // Événements
    carouselContainer.addEventListener('scroll', updateThumbPosition);
    window.addEventListener('resize', () => {
        updateThumbWidth();
        updateThumbPosition();
    });
    
    // Masquer l'indice de défilement après le premier scroll
    let hasScrolled = false;
    carouselContainer.addEventListener('scroll', () => {
        if (!hasScrolled) {
            hasScrolled = true;
            const hint = document.querySelector('.carousel-scroll-hint');
            if (hint) {
                hint.style.transition = 'opacity 0.5s ease';
                hint.style.opacity = '0';
                setTimeout(() => hint.style.display = 'none', 500);
            }
        }
    }, { once: false });
}

function renderPersonnagesResponsive() {
    const victoryBox = document.getElementById('victory-box-classique');
    const victoryHTML = victoryBox ? victoryBox.outerHTML : null;
    
    if (window.innerWidth <= 768) {
        displaySelectedPersonnagesMobile();
    } else {
        displaySelectedPersonnages();
    }
    
    if (victoryHTML && !document.getElementById('victory-box-classique')) {
        const container = document.getElementById('selectedPersonnagesClassique');
        container.insertAdjacentHTML('afterend', victoryHTML);
        setInterval(updateCountdown, 1000);
    }
}

// Ajouter un listener pour le redimensionnement
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        renderPersonnagesResponsive();
        autoResizeCategoryText();
    }, 250);
});

function renderPersonnagesResponsive() {
    const victoryBox = document.getElementById('victory-box-classique');
    const victoryHTML = victoryBox ? victoryBox.outerHTML : null;
    
    if (window.innerWidth <= 768) {
        displaySelectedPersonnagesMobile();
    } else {
        displaySelectedPersonnages();
    }
    
    if (victoryHTML && !document.getElementById('victory-box-classique')) {
        const container = document.getElementById('selectedPersonnagesClassique');
        container.insertAdjacentHTML('afterend', victoryHTML);
        setInterval(updateCountdown, 1000);
    }
}

function autoResizeCategoryText() {
    document.querySelectorAll(".category-value").forEach(el => {
        let maxWidth = el.parentElement.offsetWidth - 4; // marge
        let fontSize = 12; // taille max en px
        el.style.fontSize = fontSize + "px";

        // Réduire jusqu'à ce que ça rentre
        while (el.scrollWidth > maxWidth && fontSize > 8) {
            fontSize -= 0.5;
            el.style.fontSize = fontSize + "px";
        }
    });
}



// ===== ÉVÉNEMENTS =====
function initClassiqueEvents() {
    const searchInput = document.getElementById('searchInputClassique');
    const searchBtn = document.querySelector('#classique-mode .search-btn');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        query.length === 0 ? hideSuggestionsClassique() : showSuggestionsClassique(searchPersonnages(query));
    });

    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim();
        if (query.length > 0) showSuggestionsClassique(searchPersonnages(query));
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSuggestionsClassique();
            searchInput.blur();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const results = searchPersonnages(searchInput.value.trim());
            if (results.length > 0) selectPersonnage(results[0].ID);
        }
    });

    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const results = searchPersonnages(searchInput.value.trim());
        results.length === 1 ? selectPersonnage(results[0].ID) : showSuggestionsClassique(results);
    });
}


// ===== SAUVEGARDE =====
function saveGameStateClassique() {
    const state = {
        date: getDailySeed(),
        attempts: personnagesSelectionnes.map(p => p.ID),
        hasWon: document.getElementById('victory-box-classique') !== null
    };
    localStorage.setItem("jojoClassiqueState", JSON.stringify(state));
}

function loadGameStateClassique() {
    const saved = localStorage.getItem("jojoClassiqueState");
    if (!saved) return;

    try {
        const state = JSON.parse(saved);

        // Vérifier que c'est le même jour
        if (state.date !== getDailySeed()) {
            localStorage.removeItem("jojoClassiqueState");
            return;
        }

        // Vérifier que le personnage du jour est dans une partie activée
        if (personnageDuJour && !enabledParties.includes(personnageDuJour.PartieNumero)) {
            console.log('⚠️ Personnage sauvegardé dans partie désactivée, réinitialisation...');
            localStorage.removeItem("jojoClassiqueState");
            selectDailyPersonnage();
            return;
        }

        // Charger les tentatives
        state.attempts.forEach(id => {
            const perso = personnages.find(p => p.ID === id);
            if (perso) personnagesSelectionnes.push(perso);
        });

        renderPersonnagesResponsive();
        updateHintButtonsClassique();

        if (state.hasWon) {
            showVictoryBoxClassique();
        }
    } catch (e) {
        console.error("Erreur de chargement du state:", e);
        localStorage.removeItem("jojoClassiqueState");
    }
}

// ===== INITIALISATION =====
async function initClassiqueMode() {
    console.log("Initialisation du mode Classique...");
    
    await loadPersonnages();
    
    // Charger les parties activées depuis localStorage
    loadEnabledParties();
    console.log('📚 Parties chargées depuis localStorage:', enabledParties);
    
    // Sélectionner le personnage du jour
    selectDailyPersonnage();
    
    // Rendre les boutons d'indices
    renderHintButtonsClassique();
    
    // Charger l'état de la partie sauvegardée
    loadGameStateClassique();
    
    // Initialiser les événements
    initClassiqueEvents();
    
    console.log("Mode Classique prêt !");
}



// ===== POINT D'ENTRÉE : appelé depuis index.html =====
window.initClassiqueMode = initClassiqueMode;
window.toggleHintClassique = toggleHintClassique;


function switchToMode(mode) {
    // Fermer tous les dropdowns
    document.querySelectorAll('.modes-dropdown').forEach(d => d.classList.remove('show'));
    
    if (mode === 'classique') {
        showHome();
        setTimeout(() => showMode('classique'), 100);
    } else if (mode === 'stand') {
        showHome();
        setTimeout(() => showMode('stand'), 100);
    }
}

// ===== GESTION DES STATISTIQUES =====
function loadUserStats() {
    const saved = localStorage.getItem('jojoStats');
    if (saved) {
        userStats = JSON.parse(saved);
    }
}

function saveUserStats() {
    localStorage.setItem('jojoStats', JSON.stringify(userStats));
}

function updateStatsOnWin() {
    userStats.gamesPlayed++;
    userStats.gamesWon++;
    userStats.currentStreak++;
    userStats.maxStreak = Math.max(userStats.maxStreak, userStats.currentStreak);
    userStats.totalAttempts += personnagesSelectionnes.length;
    userStats.averageAttempts = Math.round(userStats.totalAttempts / userStats.gamesWon * 10) / 10;
    saveUserStats();
}

function updateStatsOnLoss() {
    userStats.currentStreak = 0;
    saveUserStats();
}

function openStatsModal() {
    loadUserStats();

    document.getElementById('stat-played-classique').textContent = userStats.gamesPlayed;
    document.getElementById('stat-won-classique').textContent = userStats.gamesWon;

    const winrate = userStats.gamesPlayed > 0 
        ? Math.round((userStats.gamesWon / userStats.gamesPlayed) * 100) 
        : 0;

    document.getElementById('stat-winrate-classique').textContent = winrate + '%';
    document.getElementById('stat-current-streak-classique').textContent = userStats.currentStreak;
    document.getElementById('stat-max-streak-classique').textContent = userStats.maxStreak;
    document.getElementById('stat-avg-attempts-classique').textContent = userStats.averageAttempts;

    document.getElementById('stats-modal-classique').style.display = 'flex';
}

function closeStatsModal() {
    document.getElementById('stats-modal-classique').style.display = 'none';
}


// ===== GESTION DES PARTIES =====
function loadEnabledParties() {
    const saved = localStorage.getItem('jojoEnabledParties');
    if (saved) {
        enabledParties = JSON.parse(saved);
    }
}

function saveEnabledParties() {
    localStorage.setItem('jojoEnabledParties', JSON.stringify(enabledParties));
}


function debugParties() {
    console.log('=== DEBUG PARTIES ===');
    console.log('📚 Parties activées:', enabledParties);
    console.log('🎯 Personnage du jour:', personnageDuJour?.NOM, '- Partie', personnageDuJour?.PartieNumero);
    console.log('✅ Personnage du jour dans partie activée:', enabledParties.includes(personnageDuJour?.PartieNumero));
    
    console.log('\n📋 Personnages disponibles pour la recherche:');
    const available = personnages.filter(p => enabledParties.includes(p.PartieNumero));
    available.forEach(p => {
        console.log(`  ${p.NOM} - Partie ${p.PartieNumero}`);
    });
    console.log(`Total: ${available.length}/${personnages.length} personnages`);
    
    console.log('\n🚫 Personnages masqués (parties désactivées):');
    const hidden = personnages.filter(p => !enabledParties.includes(p.PartieNumero));
    hidden.forEach(p => {
        console.log(`  ${p.NOM} - Partie ${p.PartieNumero}`);
    });
}


function testSearch(query) {
    console.log(`\n🔍 Recherche: "${query}"`);
    const results = searchPersonnages(query);
    console.log('Résultats:', results.length);
    results.forEach(p => {
        console.log(`  - ${p.NOM} (Partie ${p.PartieNumero})`);
    });
    return results;
}


// ===== GESTION DES PARTIES MODE CLASSIQUE =====
function togglePartieClassique(partieNum) {
    const index = enabledParties.indexOf(partieNum);
    if (index > -1) {
        enabledParties.splice(index, 1);
    } else {
        enabledParties.push(partieNum);
    }
}

function applyPartiesFilterClassique() {
    if (enabledParties.length === 0) {
        alert('⚠️ Vous devez activer au moins une partie !');
        return;
    }
    
    console.log('📚 Application des filtres - Parties actives:', enabledParties);
    
    saveEnabledParties();
    
    const partieNum = personnageDuJour?.PartieNumero || 0;
    console.log('🎯 Personnage actuel:', personnageDuJour?.NOM, '- Partie', partieNum);
    
    if (!enabledParties.includes(partieNum)) {
        console.log('🔄 Personnage dans partie désactivée, sélection d\'un nouveau...');
        
        personnagesSelectionnes = [];
        hintButtonsClassique = {
            apparition: { unlockAt: 5, visible: false, unlocked: false, revealed: false },
            etat_vital: { unlockAt: 9, visible: false, unlocked: false, revealed: false },
            stand_info: { unlockAt: 13, visible: false, unlocked: false, revealed: false }
        };
        
        selectDailyPersonnage();
        
        renderPersonnagesResponsive();
        renderHintButtonsClassique();
        
        const victoryBox = document.getElementById('victory-box-classique');
        if (victoryBox) victoryBox.remove();
        
        const searchInput = document.getElementById('searchInputClassique');
        if (searchInput) {
            searchInput.disabled = false;
            searchInput.placeholder = "Entrez un nom de personnage...";
        }
        
        localStorage.removeItem('jojoClassiqueState');
        
        alert(`✅ Filtres appliqués ! Nouveau personnage`);
    } else {
        console.log('✅ Personnage OK avec les filtres');
        alert('✅ Filtres appliqués ! Le personnage actuel correspond à vos critères.');
    }
    
    closePartiesModal();
}

function resetAllPartiesClassique() {
    enabledParties = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    document.querySelectorAll('.partie-checkbox-classique').forEach(checkbox => {
        checkbox.checked = true;
    });
}

function openPartiesModal() {
    loadEnabledParties();
    
    document.querySelectorAll('.partie-checkbox-classique').forEach(checkbox => {
        const partieNum = parseInt(checkbox.value);
        checkbox.checked = enabledParties.includes(partieNum);
    });
    
    document.getElementById('parties-modal-classique').style.display = 'flex';
}

function closePartiesModal() {
    document.getElementById('parties-modal-classique').style.display = 'none';
}


// ===== GESTION MODAL AIDE =====
function openHelpModal() {
    document.getElementById('help-modal-classique').style.display = 'flex';
}

function closeHelpModal() {
    document.getElementById('help-modal-classique').style.display = 'none';
}

// ===== GESTION MODAL À PROPOS =====
function openAboutModal() {
    document.getElementById('about-modal').style.display = 'flex';
}

function closeAboutModal() {
    document.getElementById('about-modal').style.display = 'none';
}

// ===== FERMETURE DES MODALS AU CLIC EN DEHORS =====
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// ===== MODIFICATION DE selectDailyPersonnage() =====
// Remplacer la fonction existante par celle-ci :
function selectDailyPersonnage() {
    if (personnages.length === 0) {
        console.error('Aucun personnage chargé');
        return null;
    }
    
    loadEnabledParties();
    
    // Filtrer les personnages selon les parties activées
    const filteredPersonnages = personnages.filter(p => 
        enabledParties.includes(parseInt(p.PartieNumero))
    );
    
    if (filteredPersonnages.length === 0) {
        console.warn('Aucun personnage disponible avec les parties sélectionnées - Réactivation de toutes les parties');
        // Réinitialiser toutes les parties
        enabledParties = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        saveEnabledParties();
        // Utiliser TOUS les personnages maintenant
        const seed = getDailySeed();
        const randomValue = seededRandom(seed);
        const index = Math.floor(randomValue * personnages.length);
        personnageDuJour = personnages[index];
        console.log('Personnage du jour (après réinitialisation):', personnageDuJour);
        return personnageDuJour;
    }
    
    const seed = getDailySeed();
    const randomValue = seededRandom(seed);
    const index = Math.floor(randomValue * filteredPersonnages.length);
    personnageDuJour = filteredPersonnages[index];
    
    console.log('Personnage du jour:', personnageDuJour);
    console.log('Parties activées:', enabledParties);
    return personnageDuJour;
}

// ===== FONCTIONS MODALES POUR LE MODE STAND =====

function openStatsModalStand() {
    loadUserStatsStand();
    document.getElementById('stat-played-stand').textContent = userStatsStand.gamesPlayed;
    document.getElementById('stat-won-stand').textContent = userStatsStand.gamesWon;
    
    const winrate = userStatsStand.gamesPlayed > 0 
        ? Math.round((userStatsStand.gamesWon / userStatsStand.gamesPlayed) * 100) 
        : 0;
    document.getElementById('stat-winrate-stand').textContent = winrate + '%';
    
    document.getElementById('stat-current-streak-stand').textContent = userStatsStand.currentStreak;
    document.getElementById('stat-max-streak-stand').textContent = userStatsStand.maxStreak;
    document.getElementById('stat-avg-attempts-stand').textContent = userStatsStand.averageAttempts;
    
    document.getElementById('stats-modal-stand').style.display = 'flex';
}

function closeStatsModalStand() {
    document.getElementById('stats-modal-stand').style.display = 'none';
}

function openPartiesModalStand() {
    loadEnabledPartiesStand();
    
    document.querySelectorAll('.partie-checkbox-stand').forEach(checkbox => {
        const partieNum = parseInt(checkbox.value);
        checkbox.checked = enabledPartiesStand.includes(partieNum);
    });
    
    document.getElementById('parties-modal-stand').style.display = 'flex';
}

function closePartiesModalStand() {
    document.getElementById('parties-modal-stand').style.display = 'none';
}

function togglePartieStand(partieNum) {
    const index = enabledPartiesStand.indexOf(partieNum);
    if (index > -1) {
        enabledPartiesStand.splice(index, 1);
    } else {
        enabledPartiesStand.push(partieNum);
    }
}

function applyPartiesFilterStand() {
    if (enabledPartiesStand.length === 0) {
        alert('⚠️ Vous devez activer au moins une partie !');
        return;
    }
    
    console.log('📚 Application des filtres - Parties actives:', enabledPartiesStand);
    
    saveEnabledPartiesStand();
    
    const partieNum = personnageDuJourStand?.PartieNumero || 0;
    console.log('🎯 Stand actuel:', standDuJour?.Nom, '- Partie', partieNum);
    
    if (!enabledPartiesStand.includes(partieNum)) {
        console.log('🔄 Stand dans partie désactivée, sélection d\'un nouveau...');
        
        personnagesSelectionnesStand = [];
        hintButtonsStand = {
            portee: { unlockAt: 4, visible: false, unlocked: false, revealed: false },
            apparition: { unlockAt: 7, visible: false, unlocked: false, revealed: false },
            explication: { unlockAt: 11, visible: false, unlocked: false, revealed: false }
        };
        
        selectDailyStand();
        
        // Mettre à jour l'affichage du stand
        document.getElementById('stand-name').textContent = standDuJour.Nom;
        
        displaySelectedPersonnagesStand();
        renderHintButtonsStand();
        
        const victoryBox = document.getElementById('victory-box-stand');
        if (victoryBox) victoryBox.remove();
        
        const searchInput = document.getElementById('searchInputStand');
        if (searchInput) {
            searchInput.disabled = false;
            searchInput.placeholder = "Entrez un nom de personnage...";
        }
        
        localStorage.removeItem('jojoStandState');
        
        alert(`✅ Filtres appliqués ! Nouveau Stand`);
    } else {
        console.log('✅ Stand OK avec les filtres');
        alert('✅ Filtres appliqués ! Le stand actuel correspond à vos critères.');
    }
    
    closePartiesModalStand();
}

function resetAllPartiesStand() {
    enabledPartiesStand = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    document.querySelectorAll('.partie-checkbox-stand').forEach(checkbox => {
        checkbox.checked = true;
    });
}

function openHelpModalStand() {
    document.getElementById('help-modal-stand').style.display = 'flex';
}

function closeHelpModalStand() {
    document.getElementById('help-modal-stand').style.display = 'none';
}


// ===== GESTION DU MENU DÉROULANT MODES=====
function toggleModesDropdown(event) {
    console.log('🔍 toggleModesDropdown appelé');
    
    // Empêcher la propagation pour éviter la fermeture immédiate
    if (event) {
        event.stopPropagation();
    }
    
    // Fermer tous les dropdowns d'abord
    document.querySelectorAll('.modes-dropdown').forEach(d => d.classList.remove('show'));
    
    // Détecter quel mode est actif
    const classiqueMode = document.getElementById('classique-mode');
    const standMode = document.getElementById('stand-mode');
    const citationMode = document.getElementById('Citation-mode');
    const ostMode = document.getElementById('OST-mode');
    
    let dropdownToOpen = null;
    
    if (classiqueMode && classiqueMode.classList.contains('active')) {
        dropdownToOpen = document.getElementById('modes-dropdown');
        console.log('📂 Mode Classique détecté - ouverture modes-dropdown');
    } else if (standMode && standMode.classList.contains('active')) {
        dropdownToOpen = document.getElementById('modes-dropdown-stand');
        console.log('📂 Mode Stand détecté - ouverture modes-dropdown-stand');
    } else if (citationMode && citationMode.classList.contains('active')) {
        dropdownToOpen = document.getElementById('modes-dropdown-citation');
        console.log('📂 Mode Citation détecté - ouverture modes-dropdown-citation');
    } else if (ostMode && ostMode.classList.contains('active')) {
        dropdownToOpen = document.getElementById('modes-dropdown-ost');
        console.log('📂 Mode OST détecté - ouverture modes-dropdown-ost');
    } else {
        console.error('❌ Aucun mode actif trouvé');
        console.log('Classique:', classiqueMode?.classList.contains('active'));
        console.log('Stand:', standMode?.classList.contains('active'));
        console.log('Citation:', citationMode?.classList.contains('active'));
        console.log('OST:', ostMode?.classList.contains('active'));
        return;
    }
    
    // Ouvrir le bon dropdown
    if (dropdownToOpen) {
        dropdownToOpen.classList.add('show');
        console.log('✅ Dropdown ouvert:', dropdownToOpen.id);
        
        // Fermer au clic extérieur
        setTimeout(() => {
            const closeHandler = function(e) {
                if (!e.target.closest('.menu-btn')) {
                    console.log('🔒 Fermeture des dropdowns');
                    document.querySelectorAll('.modes-dropdown').forEach(d => d.classList.remove('show'));
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 100);
    } else {
        console.error('❌ dropdownToOpen est null');
    }
}

// ===== EXPORTS DES FONCTIONS MODE CLASSIQUE =====
window.openStatsModal = openStatsModal;
window.closeStatsModal = closeStatsModal;
window.toggleModesDropdown = toggleModesDropdown;
window.switchToMode = switchToMode;
window.openPartiesModal = openPartiesModal;
window.closePartiesModal = closePartiesModal;
window.togglePartieClassique = togglePartieClassique;  // ✅ Correction ici
window.applyPartiesFilterClassique = applyPartiesFilterClassique;  // ✅ Correction ici
window.resetAllPartiesClassique = resetAllPartiesClassique;  // ✅ Correction ici
window.openHelpModal = openHelpModal;
window.closeHelpModal = closeHelpModal;
window.openAboutModal = openAboutModal;
window.closeAboutModal = closeAboutModal;
window.debugParties = debugParties;
window.testSearch = testSearch;

// ===== EXPORTS DES FONCTIONS MODE STAND =====
window.openStatsModalStand = openStatsModalStand;
window.closeStatsModalStand = closeStatsModalStand;
window.openPartiesModalStand = openPartiesModalStand;
window.closePartiesModalStand = closePartiesModalStand;
window.togglePartieStand = togglePartieStand;
window.applyPartiesFilterStand = applyPartiesFilterStand;
window.resetAllPartiesStand = resetAllPartiesStand;
window.openHelpModalStand = openHelpModalStand;
window.closeHelpModalStand = closeHelpModalStand;