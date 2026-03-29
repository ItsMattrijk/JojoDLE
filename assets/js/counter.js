// ========== COMPTEUR JOJODLE ==========

const JOJO_WORKSPACE = 'mf5s-team-3511';

function getTodayKey(mode) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `jojo-${mode}-${y}${m}${day}`;
}

async function fetchJojoCounter(mode) {
    const key = getTodayKey(mode);
    try {
        const res = await fetch(`https://api.counterapi.dev/v1/${JOJO_WORKSPACE}/${key}/up`);
        if (!res.ok) return 0;
        const data = await res.json();
        await fetch(`https://api.counterapi.dev/v1/${JOJO_WORKSPACE}/${key}/down`);
        return data.count ?? 0;
    } catch {
        return 0;
    }
}

async function incrementJojoCounter(mode) {
    const key = getTodayKey(mode);
    try {
        const res = await fetch(`https://api.counterapi.dev/v1/${JOJO_WORKSPACE}/${key}/up`);
        if (!res.ok) return 0;
        const data = await res.json();
        return data.count ?? 0;
    } catch {
        return 0;
    }
}

// Exposé globalement — appelé depuis classique.js, stand.js, etc.
window.jojoIncrementCounter = async function(mode) {
    const count = await incrementJojoCounter(mode);
    console.log(`✅ Compteur ${mode} : ${count} joueurs ont trouvé aujourd'hui`);
    return count;
};