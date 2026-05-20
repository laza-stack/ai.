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
    document.getElementById('catMarketing').innerText = t.catMarketing;
    document.getElementById('catVideo').innerText = t.catVideo;
    document.getElementById('catCoding').innerText = t.catCoding;
    document.getElementById('catDesign').innerText = t.catDesign;
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
    
    const filteredTools = toolsData.filter(tool => {
        const desc = currentLang === "fr" ? (tool.description_fr || tool.description) : (tool.description_en || tool.description);
        const matchesSearch = tool.name.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
        const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    if (filteredTools.length === 0) {
        toolsGrid.innerHTML = `<div class="no-results">${t.noResults}</div>`;
        return;
    }

    toolsGrid.innerHTML = filteredTools.map(tool => {
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
                    <button class="upvote-btn">🔺 <span>${tool.votes || 0}</span></button>
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