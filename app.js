import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyDhlEUFF0m6slBF3XpoxDm9dR6a-9lpGDE",
    authDomain: "docmada-efabe.firebaseapp.com",
    projectId: "docmada-efabe",
    storageBucket: "docmada-efabe.firebasestorage.app",
    messagingSenderId: "47958453195",
    appId: "1:47958453195:web:ed1db0c34627743baaa44e",
    measurementId: "G-YHLHDH9MRN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const translations = {
    en: {
        announcement: "✨ Discover the future of automation",
        submitBtn: "Submit an AI (Paid)",
        heroTitle: "Find the perfect <span>AI tool</span> for your needs",
        heroSubtitle: "The ultimate curated directory of artificial intelligence tools updated daily.",
        searchPlaceholder: "Search by name, keyword, category...",
        catAll: "All Tools",
        catMarketing: "Marketing",
        catVideo: "Video",
        catCoding: "Coding",
        catDesign: "Design",
        visitBtn: "Visit ↗",
        loading: "Loading the ecosystem...",
        noResults: "No AI tools matching your criteria were found.",
        sponsored: "★ Sponsored"
    },
    fr: {
        announcement: "✨ Découvrez le futur de l'automatisation",
        submitBtn: "Soumettre une IA (Payant)",
        heroTitle: "Trouvez l'<span>outil IA</span> idéal pour vos besoins",
        heroSubtitle: "L'annuaire ultime des meilleures intelligences artificielles mis à jour quotidiennement.",
        searchPlaceholder: "Rechercher par nom, mot-clé, catégorie...",
        catAll: "Tous les outils",
        catMarketing: "Marketing",
        catVideo: "Vidéo",
        catCoding: "Code",
        catDesign: "Design",
        visitBtn: "Visiter ↗",
        loading: "Chargement de l'écosystème...",
        noResults: "Aucun outil IA ne correspond à vos critères.",
        sponsored: "★ Sponsorisé"
    }
};

let toolsData = [];
let activeCategory = "all";
let currentLang = "en";

const toolsGrid = document.getElementById('toolsGrid');
const searchInput = document.getElementById('searchInput');
const categoryButtons = document.querySelectorAll('.cat-btn');
const langButtons = document.querySelectorAll('.lang-btn');

function applyLanguage() {
    const t = translations[currentLang];
    document.getElementById('announcement').innerText = t.announcement;
    const submitBtn = document.getElementById('submitBtn');

if(submitBtn){
    submitBtn.innerText = t.submitBtn;
}
    document.getElementById('heroTitle').innerHTML = t.heroTitle;
    document.getElementById('heroSubtitle').innerText = t.heroSubtitle;
    searchInput.placeholder = t.searchPlaceholder;
    document.getElementById('catAll').innerText = t.catAll;
    
}

async function fetchTools() {
    const loadingState = document.getElementById("loadingState");
    
    try {
        const querySnapshot = await getDocs(collection(db, "tools"));
        
        toolsData = [];
        
        querySnapshot.forEach((doc) => {
            toolsData.push({ id: doc.id, ...doc.data() });
        });
        
        // IMPORTANT: cacher le loading
        if (loadingState) {
            loadingState.style.display = "none";
        }
        
        renderTools();
        
    } catch (error) {
        console.error(error);
        
        if (loadingState) {
            loadingState.style.display = "none";
        }
        
        toolsGrid.innerHTML =
            `<div class="error-state">Failed to sync with network. Check app.js config.</div>`;
    }
}
function renderTools() {
    const query = searchInput.value.toLowerCase();
    const t = translations[currentLang];
    
    const scoredTools = toolsData
    .map(tool => {
        const desc =
            currentLang === "fr"
                ? (tool.description_fr || tool.description || "")
                : (tool.description_en || tool.description || "");

        const name = (tool.name || "").toLowerCase();
        const description = desc.toLowerCase();
        const category = (tool.category || "").toLowerCase();
        const q = query.toLowerCase();

        let score = 0;

        // MATCH EXACT NOM (très fort)
        if (name === q) score += 100;

        // NOM contient recherche
        if (name.includes(q)) score += 50;

        // DESCRIPTION contient recherche
        if (description.includes(q)) score += 20;

        // catégorie match
        if (category.includes(q)) score += 30;

        // boost si commence par query
        if (name.startsWith(q)) score += 25;

        return { ...tool, score };
    })
    .filter(tool => {
        const matchesCategory =
            activeCategory === "all" ||
            (tool.category && tool.category.toLowerCase().includes(activeCategory.toLowerCase()));

        const matchesSearch = query === "" || tool.score > 0;

        return matchesCategory && matchesSearch;
    })
    .sort((a, b) => b.score - a.score);
    if (scoredTools.length === 0) {
        toolsGrid.innerHTML = `<div class="no-results">${t.noResults}</div>`;
        return;
    }

    toolsGrid.innerHTML = scoredTools.map(tool => {
        const descriptionText = currentLang === "fr" ? (tool.description_fr || tool.description) : (tool.description_en || tool.description);
        
        // Détermination dynamique de la classe CSS du prix
        let priceClass = "price-free";
        if(tool.priceType === "Freemium") priceClass = "price-freemium";
        if(tool.priceType === "Paid") priceClass = "price-paid";

        return `
            <div class="card">
                <div>
                    <div class="card-header">
                        <div class="badge-group">
                            <span class="badge ${priceClass}">${tool.priceType || 'Free'}</span>
                            <span class="badge" style="background: rgba(255,255,255,0.03); color: var(--text-muted);">${tool.category}</span>
                        </div>
                        ${tool.isFeatured ? `<span class="badge badge-featured">${t.sponsored}</span>` : ''}
                    </div>
                    <h3 class="card-title">${tool.name}</h3>
                    <p class="card-description">${descriptionText}</p>
                </div>
                <div class="card-footer">
                    <div></div>
                    <a href="${tool.url}" target="_blank" rel="noopener noreferrer" class="btn btn-card">
                        ${t.visitBtn}
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// Événements
langButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        langButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        currentLang = e.target.getAttribute('data-lang');
        applyLanguage();
        renderTools();
    });
});

searchInput.addEventListener('input', renderTools);
categoryButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        activeCategory = e.target.getAttribute('data-category');
        renderTools();
    });
});

applyLanguage();
fetchTools();


let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    document.getElementById("installPopup").classList.remove("hidden");
});

document.getElementById("installBtn").addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    await deferredPrompt.userChoice;

    deferredPrompt = null;
    document.getElementById("installPopup").classList.add("hidden");
});


document.getElementById("closeInstall").addEventListener("click", () => {
    document.getElementById("installPopup").classList.add("hidden");
});


if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log("SW registered"))
        .catch(err => console.log("SW error", err));
}
