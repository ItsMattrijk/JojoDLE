// ========== COMPTEUR & PERSONNAGE D'HIER - JOJODLE ==========
// Inspiré de counter.js (PSGdle) — trick up+down pour lire sans modifier

const COUNTER_WORKSPACE = 'mf5s-team-3511';

// ── Clé du jour ───────────────────────────────────────────────────────────────
function getTodayKey(mode) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${mode}-${y}${m}${day}`;
}

// ── CounterAPI ────────────────────────────────────────────────────────────────
// Lire le compteur SANS l'incrémenter : up puis immédiatement down
async function fetchCounter(mode) {
    const key = getTodayKey(mode);
    try {
        const res = await fetch(`https://api.counterapi.dev/v1/${COUNTER_WORKSPACE}/${key}/up`);
        if (!res.ok) return 0;
        const data = await res.json();
        // Redescendre immédiatement pour ne pas fausser le compteur
        await fetch(`https://api.counterapi.dev/v1/${COUNTER_WORKSPACE}/${key}/down`);
        return data.count ?? data.value ?? 0;
    } catch {
        return 0;
    }
}

// Incrémenter (victoire du joueur)
async function incrementCounter(mode) {
    const key = getTodayKey(mode);
    try {
        const res = await fetch(`https://api.counterapi.dev/v1/${COUNTER_WORKSPACE}/${key}/up`);
        if (!res.ok) return 0;
        const data = await res.json();
        return data.count ?? data.value ?? 0;
    } catch {
        return 0;
    }
}

// Évite d'incrémenter plusieurs fois par jour (persisté en localStorage)
function getCountedKey(mode) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `jojoAlreadyCounted_${mode}_${y}${m}${day}`;
}

window.jojoIncrementCounter = async function(mode) {
    const modeKey = mode.toLowerCase();
    const storageKey = getCountedKey(modeKey);

    // Si déjà compté aujourd'hui (même après rechargement), on ne recompte pas
    if (localStorage.getItem(storageKey) === '1') return;
    localStorage.setItem(storageKey, '1');

    const newCount = await incrementCounter(modeKey);
    updateCounterDisplay(modeKey, newCount);
};

// ── Affichage du compteur ─────────────────────────────────────────────────────
function updateCounterDisplay(mode, count) {
    const el = document.getElementById(`players-counter-${mode}`);
    if (!el) return;
    if (count === 0) {
        el.innerHTML = `Sois le premier à trouver aujourd'hui !`;
    } else {
        const word = count > 1 ? 'personnes ont' : 'personne a';
        el.innerHTML = `<span class="players-count-number">${count.toLocaleString('fr-FR')}</span> ${word} déjà trouvé !`;
    }
}

// ── Personnage / Citation / OST d'hier ───────────────────────────────────────
// Offsets identiques à ceux des JS de chaque mode
const MODE_SEED_OFFSETS = {
    classique: 111111,  // classique.js : baseSeed + 111111
    stand:     777777,  // stand.js     : baseSeed + 777777
    citation:  0,       // citation.js  : baseSeed + 0
    ost:       0        // ost.js       : baseSeed + 0
};

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getYesterdaySeed(mode) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const baseSeed = yesterday.getFullYear() * 10000 + (yesterday.getMonth() + 1) * 100 + yesterday.getDate();
    const resetCounter = parseInt(localStorage.getItem(`jojoResetCounter_${mode}`) || '0');
    return baseSeed + MODE_SEED_OFFSETS[mode] + (resetCounter * 123456);
}

function getYesterdayItem(list, mode) {
    if (!list || list.length === 0) return null;
    const seed = getYesterdaySeed(mode);
    const index = Math.floor(seededRandom(seed) * list.length);
    return list[index];
}

// ── Bannière "d'hier" ─────────────────────────────────────────────────────────
function renderYesterdayBanner(elementId, item, mode) {
    const el = document.getElementById(elementId);
    if (!el || !item) return;

    let name = '???';
    let num = '';

    if (mode === 'citation') {
        // item est une citation → on affiche le perso lié
        const perso = (personnagesCitation || []).find(p => p.ID === item.perso_ID);
        name = perso ? perso.NOM : '???';
        num = perso ? (perso.Numero || perso.ID || '') : '';
    } else if (mode === 'ost') {
        // item est un OST → on affiche le nom du perso lié
        const perso = (personnagesOST || []).find(p => p.ID === item.PersonnageID);
        name = perso ? perso.NOM : (item.Nom || '???');
        num = perso ? (perso.Numero || perso.ID || '') : '';
    } else {
        // classique / stand → item est un perso
        name = item.NOM || '???';
        num = item.Numero || item.ID || '';
    }

    el.innerHTML = `Hier : ${num ? `<span class="yesterday-num">#${num}</span> ` : ''}<span class="yesterday-name">${name}</span>`;
}

// ── Init par mode ─────────────────────────────────────────────────────────────
// Attendu que les variables globales des modes soient prêtes, puis affiche compteur + hier
const _counterIntervals = {};

function initCounterForMode(mode) {
    const modeKey = mode.toLowerCase();

    // Détecter quand la liste est prête
    const isReady = {
        classique: () => typeof personnages !== 'undefined' && personnages.length > 0,
        stand:     () => typeof personnagesStand !== 'undefined' && personnagesStand.length > 0,
        citation:  () => typeof personnagesCitation !== 'undefined' && personnagesCitation.length > 0,
        ost:       () => typeof personnagesOST !== 'undefined' && personnagesOST.length > 0,
    };

    // Liste filtrée utilisée pour tirer le perso du jour (même logique que les JS de mode)
    const getFilteredList = {
        classique: () => personnages,
        stand:     () => personnagesStand,
        citation:  () => {
            // Même filtre que citation.js : citations dont le perso est dans les parties activées
            if (typeof citationsCitation === 'undefined') return [];
            const enabled = typeof enabledPartiesCitation !== 'undefined' ? enabledPartiesCitation : [1,2,3,4,5,6,7,8,9];
            return citationsCitation.filter(c => {
                const p = personnagesCitation.find(p => p.ID === c.perso_ID);
                return p && enabled.includes(p.PartieNumero);
            });
        },
        ost: () => {
            if (typeof ostsOST === 'undefined') return [];
            const enabled = typeof enabledPartiesOST !== 'undefined' ? enabledPartiesOST : [1,2,3,4,5,6,7,8,9];
            return ostsOST.filter(o => {
                const p = personnagesOST.find(p => p.ID === o.PersonnageID);
                return p && enabled.includes(p.PartieNumero);
            });
        },
    };

    const tryInit = setInterval(() => {
        if (!isReady[modeKey]?.()) return;
        clearInterval(tryInit);

        // Affichage immédiat du compteur
        fetchCounter(modeKey).then(count => updateCounterDisplay(modeKey, count));

        // Bannière d'hier
        const list = getFilteredList[modeKey]?.() || [];
        const item = getYesterdayItem(list, modeKey);
        renderYesterdayBanner(`yesterday-${modeKey}`, item, modeKey);

        // Rafraîchissement du compteur toutes les 30s
        if (_counterIntervals[modeKey]) clearInterval(_counterIntervals[modeKey]);
        _counterIntervals[modeKey] = setInterval(() => {
            fetchCounter(modeKey).then(count => updateCounterDisplay(modeKey, count));
        }, 30000);

    }, 300);
}

// Exposer pour que index.html puisse l'appeler via showMode()
window.initCounterForMode = initCounterForMode;