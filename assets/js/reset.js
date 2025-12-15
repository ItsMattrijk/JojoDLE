// ===== SYSTÈME DE CODE SECRET POUR RESET =====

// Configuration du code secret
const SECRET_CODE = "jojodle";
let codeBuffer = "";
let codeTimeout = null;

// Fonction pour écouter les touches
function initSecretCode() {
    document.addEventListener('keydown', (e) => {
        // Ignorer si on est dans un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Ajouter la touche au buffer
        codeBuffer += e.key.toLowerCase();

        // Réinitialiser le timeout
        clearTimeout(codeTimeout);
        codeTimeout = setTimeout(() => {
            codeBuffer = "";
        }, 2000); // 2 secondes pour taper le code

        // Vérifier si le code secret a été tapé
        if (codeBuffer.includes(SECRET_CODE)) {
            codeBuffer = "";
            activateResetMode();
        }
    });

    console.log("%c🔐 Code secret activé ! Tape 'jojodle' n'importe où pour réinitialiser les jeux", "color: #FFD700; font-size: 14px; font-weight: bold;");
}

// Fonction pour activer le mode reset
function activateResetMode() {
    // Créer la modal de confirmation
    const modalHTML = `
        <div id="reset-modal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 500px;">
                <span class="modal-close" onclick="closeResetModal()">&times;</span>
                <h2 class="modal-title">🔓 MODE ADMINISTRATEUR</h2>
                <div class="reset-content" style="text-align: center; padding: 1rem;">
                    <p style="color: white; font-size: 1.1rem; margin-bottom: 1.5rem;">
                        ⚠️ Vous êtes sur le point de réinitialiser tous les jeux !
                    </p>
                    <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 2rem;">
                        Cela vous permettra de rejouer autant de fois que vous voulez aujourd'hui.
                    </p>
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <button class="modal-btn" style="background: linear-gradient(135deg, #FF1493, #8B008B);" onclick="resetGame('classique')">
                            🎯 Reset Classique
                        </button>
                        <button class="modal-btn" style="background: linear-gradient(135deg, #FFD700, #FFA500);" onclick="resetGame('stand')">
                            ⭐ Reset Stand
                        </button>
                        <button class="modal-btn" style="background: linear-gradient(135deg, #8A00FF, #FF00D4);" onclick="resetGame('citation')">
                            💬 Reset Citation
                        </button>
                        <button class="modal-btn" style="background: linear-gradient(135deg, #00E5FF, #0033FF);" onclick="resetGame('ost')">
                            🎵 Reset OST
                        </button>
                    </div>
                    <div style="margin-top: 2rem;">
                        <button class="modal-btn primary" onclick="resetAllGames()">
                            🔄 Réinitialiser TOUT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Supprimer l'ancienne modal si elle existe
    const oldModal = document.getElementById('reset-modal');
    if (oldModal) oldModal.remove();

    // Ajouter la nouvelle modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Animation d'apparition
    const modal = document.getElementById('reset-modal');
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

// Fonction pour fermer la modal
function closeResetModal() {
    const modal = document.getElementById('reset-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

// ===== FONCTION POUR INCRÉMENTER LE COMPTEUR DE RESET =====
function incrementResetCounter(mode) {
    const key = `jojoResetCounter_${mode}`;
    let counter = parseInt(localStorage.getItem(key) || '0');
    counter++;
    localStorage.setItem(key, counter.toString());
    return counter;
}

function getResetCounter(mode) {
    const key = `jojoResetCounter_${mode}`;
    return parseInt(localStorage.getItem(key) || '0');
}

// Fonction pour reset un jeu spécifique
function resetGame(mode) {
    const confirmReset = confirm(`Voulez-vous vraiment réinitialiser le mode ${mode.toUpperCase()} ?`);
    if (!confirmReset) return;

    const modeKeys = {
        classique: 'jojoClassiqueState',
        stand: 'jojoStandState',
        citation: 'jojoCitationState',
        ost: 'jojoOSTState'
    };

    // Incrémenter le compteur de reset pour changer le seed
    incrementResetCounter(mode);

    // Supprimer le state du mode
    localStorage.removeItem(modeKeys[mode]);

    console.log(`✅ Mode ${mode} réinitialisé avec compteur: ${getResetCounter(mode)}`);
    showSuccessMessage(`Mode ${mode} réinitialisé !`);

    // Fermer la modal
    closeResetModal();

    // Recharger le mode approprié
    setTimeout(() => {
        regenerateMode(mode);
    }, 300);
}

// ===== FONCTION POUR RÉGÉNÉRER CHAQUE MODE =====
function regenerateMode(mode) {
    switch(mode) {
        case 'classique':
            if (typeof selectDailyPersonnage === 'function') {
                // Réinitialiser les variables
                if (window.personnagesSelectionnes) {
                    window.personnagesSelectionnes = [];
                }
                
                // Sélectionner un nouveau personnage
                selectDailyPersonnage();
                
                // Réinitialiser les indices
                if (window.hintButtonsClassique) {
                    window.hintButtonsClassique = {
                        apparition: { unlockAt: 5, visible: false, unlocked: false, revealed: false },
                        etat_vital: { unlockAt: 9, visible: false, unlocked: false, revealed: false },
                        stand_info: { unlockAt: 13, visible: false, unlocked: false, revealed: false }
                    };
                }
                
                // Réafficher
                if (typeof renderPersonnagesResponsive === 'function') {
                    renderPersonnagesResponsive();
                }
                if (typeof renderHintButtonsClassique === 'function') {
                    renderHintButtonsClassique();
                }
                
                // Supprimer la victory box si elle existe
                const victoryBox = document.getElementById('victory-box-classique');
                if (victoryBox) victoryBox.remove();
                
                // Réactiver l'input
                const searchInput = document.getElementById('searchInputClassique');
                if (searchInput) {
                    searchInput.disabled = false;
                    searchInput.placeholder = "Entrez un nom de personnage...";
                    searchInput.value = "";
                }
                
                showSuccessMessage('Nouveau personnage généré !');
            }
            break;
            
        case 'stand':
            if (typeof selectDailyStand === 'function') {
                // Réinitialiser les variables
                if (window.personnagesSelectionnesStand) {
                    window.personnagesSelectionnesStand = [];
                }
                
                // Sélectionner un nouveau stand
                selectDailyStand();
                
                // Mettre à jour l'affichage du nom du stand
                if (window.standDuJour) {
                    const standNameEl = document.getElementById('stand-name');
                    if (standNameEl) {
                        standNameEl.textContent = window.standDuJour.Nom;
                    }
                }
                
                // Réinitialiser les indices
                if (window.hintButtonsStand) {
                    window.hintButtonsStand = {
                        portee: { unlockAt: 4, visible: false, unlocked: false, revealed: false },
                        apparition: { unlockAt: 7, visible: false, unlocked: false, revealed: false },
                        explication: { unlockAt: 11, visible: false, unlocked: false, revealed: false }
                    };
                }
                
                // Réafficher
                if (typeof displaySelectedPersonnagesStand === 'function') {
                    displaySelectedPersonnagesStand();
                }
                if (typeof renderHintButtonsStand === 'function') {
                    renderHintButtonsStand();
                }
                
                // Supprimer la victory box
                const victoryBox = document.getElementById('victory-box-stand');
                if (victoryBox) victoryBox.remove();
                
                // Réactiver l'input
                const searchInput = document.getElementById('searchInputStand');
                if (searchInput) {
                    searchInput.disabled = false;
                    searchInput.placeholder = "Entrez un nom de personnage...";
                    searchInput.value = "";
                }
                
                showSuccessMessage('Nouveau Stand généré !');
            }
            break;
            
        case 'citation':
            if (typeof selectDailyCitation === 'function') {
                // Réinitialiser les variables
                if (window.personnagesSelectionnesCitation) {
                    window.personnagesSelectionnesCitation = [];
                }
                
                // Sélectionner une nouvelle citation
                selectDailyCitation();
                
                // Mettre à jour l'affichage de la citation
                if (window.citationDuJour) {
                    const citationEl = document.getElementById('citation-text');
                    if (citationEl) {
                        citationEl.textContent = window.citationDuJour.citation;
                    }
                }
                
                // Réinitialiser les indices
                if (window.hintButtonsCitation) {
                    window.hintButtonsCitation = {
                        partie: { unlockAt: 4, visible: false, unlocked: false, revealed: false },
                        apparition: { unlockAt: 7, visible: false, unlocked: false, revealed: false },
                        stand: { unlockAt: 11, visible: false, unlocked: false, revealed: false }
                    };
                }
                
                // Réafficher
                if (typeof displaySelectedPersonnagesCitation === 'function') {
                    displaySelectedPersonnagesCitation();
                }
                if (typeof renderHintButtonsCitation === 'function') {
                    renderHintButtonsCitation();
                }
                
                // Supprimer la victory box
                const victoryBox = document.getElementById('victory-box-citation');
                if (victoryBox) victoryBox.remove();
                
                // Réactiver l'input
                const searchInput = document.getElementById('searchInputCitation');
                if (searchInput) {
                    searchInput.disabled = false;
                    searchInput.placeholder = "Entrez un nom de personnage...";
                    searchInput.value = "";
                }
                
                showSuccessMessage('Nouvelle citation générée !');
            }
            break;
            
        case 'ost':
            if (typeof selectDailyOST === 'function') {
                // Réinitialiser les variables
                if (window.personnagesSelectionnesOST) {
                    window.personnagesSelectionnesOST = [];
                }
                
                // Sélectionner un nouvel OST
                selectDailyOST();
                
                // Mettre à jour le lecteur audio
                if (window.ostDuJour) {
                    const audioSource = document.getElementById('ost-source');
                    const audioPlayer = document.getElementById('ost-audio');
                    if (audioSource && audioPlayer) {
                        audioSource.src = window.ostDuJour.Fichier;
                        audioPlayer.load();
                    }
                }
                
                // Réinitialiser les indices
                if (window.hintButtonsOST) {
                    window.hintButtonsOST = {
                        lieu: { unlockAt: 4, visible: false, unlocked: false, revealed: false },
                        stand: { unlockAt: 7, visible: false, unlocked: false, revealed: false },
                        partie: { unlockAt: 11, visible: false, unlocked: false, revealed: false }
                    };
                }
                
                // Réafficher
                if (typeof displaySelectedPersonnagesOST === 'function') {
                    displaySelectedPersonnagesOST();
                }
                if (typeof renderHintButtonsOST === 'function') {
                    renderHintButtonsOST();
                }
                
                // Supprimer la victory box
                const victoryBox = document.getElementById('victory-box-ost');
                if (victoryBox) victoryBox.remove();
                
                // Réactiver l'input
                const searchInput = document.getElementById('searchInputOST');
                if (searchInput) {
                    searchInput.disabled = false;
                    searchInput.placeholder = "Entrez un nom de personnage...";
                    searchInput.value = "";
                }
                
                showSuccessMessage('Nouvel OST généré !');
            }
            break;
    }
}

// Fonction pour tout réinitialiser
function resetAllGames() {
    const confirmReset = confirm('Voulez-vous vraiment réinitialiser TOUS les jeux ?');
    if (!confirmReset) return;

    // Incrémenter tous les compteurs
    incrementResetCounter('classique');
    incrementResetCounter('stand');
    incrementResetCounter('citation');
    incrementResetCounter('ost');

    // Supprimer tous les states
    localStorage.removeItem('jojoClassiqueState');
    localStorage.removeItem('jojoStandState');
    localStorage.removeItem('jojoCitationState');
    localStorage.removeItem('jojoOSTState');

    console.log('✅ Tous les jeux réinitialisés');
    showSuccessMessage('Tous les jeux réinitialisés !');
    
    closeResetModal();

    // Recharger la page après 1 seconde
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Fonction pour afficher un message de succès
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #00FF00, #00CC00);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        font-weight: bold;
        font-size: 1.1rem;
        box-shadow: 0 8px 25px rgba(0, 255, 0, 0.5);
        z-index: 99999;
        animation: slideInRight 0.5s ease-out;
    `;
    successDiv.textContent = `✅ ${message}`;
    document.body.appendChild(successDiv);

    // Supprimer après 3 secondes
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => successDiv.remove(), 500);
    }, 3000);
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .reset-content .modal-btn {
        padding: 0.8rem 1.5rem;
        font-size: 0.9rem;
        font-weight: bold;
        color: white;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }

    .reset-content .modal-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    }

    .reset-content .modal-btn.primary {
        background: linear-gradient(135deg, #00FF00, #00CC00);
        padding: 1rem 2rem;
        font-size: 1rem;
    }
`;
document.head.appendChild(style);

// Exporter les fonctions
window.closeResetModal = closeResetModal;
window.resetGame = resetGame;
window.resetAllGames = resetAllGames;

// Initialiser le système au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecretCode);
} else {
    initSecretCode();
}

console.log("%c🎮 Système de reset activé !", "color: #FFD700; font-size: 16px; font-weight: bold;");
console.log("%cTape 'jojodle' n'importe où pour ouvrir le menu de reset", "color: #FF1493; font-size: 14px;");