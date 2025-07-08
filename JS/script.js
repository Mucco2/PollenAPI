// --- INGEN API-NØGLE NØDVENDIG MED OPEN-METEO ---

// Hvidovres GPS-koordinater
const hvidovreLocation = {
    latitude: 55.65,
    longitude: 12.47
};

// Funktion til at kalde Open-Meteo Air Quality API
async function fetchPollenData() {
    document.getElementById('location-date').textContent = `Henter data for Hvidovre...`;
    
    // Vi bygger URL'en med de pollentyper, vi vil have
    const pollenTyper = "alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen";
    const API_URL = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${hvidovreLocation.latitude}&longitude=${hvidovreLocation.longitude}&hourly=${pollenTyper}&domains=cams_europe`;

    try {
        // Et simpelt 'fetch'-kald uden headers eller nøgler
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error('Kunne ikke hente data fra Open-Meteo serveren.');
        }
        
        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Fejl under hentning af pollental:", error);
        document.getElementById('error-message').textContent = `Kunne ikke hente pollental. Tjek internetforbindelsen. (Fejl: ${error.message})`;
        document.getElementById('location-date').textContent = 'Hvidovre';
        return null;
    }
}

// Funktion til at konvertere et pollental (grains/m³) til en kategori
function getCategoryFromValue(value) {
    if (value <= 1) return "Low";
    if (value <= 50) return "Moderate";
    if (value <= 200) return "High";
    return "Very High";
}

// Funktion til at vise data på siden (tilpasset Open-Meteo's format)
function displayPollenInfo(pollenData) {
    const container = document.getElementById('pollen-cards-container');
    const locationDateEl = document.getElementById('location-date');
    container.innerHTML = '';

    const hourlyData = pollenData.hourly;
    const nu = new Date();
    // Vi runder ned til nærmeste time for at matche API'ens tidsstempler
    nu.setMinutes(0, 0, 0); 
    const nuISO = nu.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM

    // Find index for den nuværende time i API'ens tids-array
    const currentIndex = hourlyData.time.findIndex(time => time === nuISO);

    if (currentIndex === -1) {
        container.innerHTML = '<p class="text-center text-gray-600">Kunne ikke finde pollental for den nuværende time.</p>';
        return;
    }
    
    locationDateEl.textContent = `Hvidovre - Viser tal for kl. ${nu.getHours()}:00`;

    const pollenList = [];

    // Gå igennem alle pollentyper i svaret (undtagen 'time')
    for (const pollenType in hourlyData) {
        if (pollenType !== 'time') {
            const value = hourlyData[pollenType][currentIndex];
            // Tilføj kun til listen, hvis der er pollen i luften
            if (value > 0) {
                pollenList.push({
                    displayName: pollenType.replace('_pollen', '').replace(/^\w/, c => c.toUpperCase()),
                    category: getCategoryFromValue(value),
                    value: Math.round(value) // Afrund til nærmeste heltal
                });
            }
        }
    }

    const sortedPollen = pollenList.sort((a, b) => b.value - a.value);

    if (sortedPollen.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-600">Ingen pollen i luften lige nu. God dag!</p>';
        return;
    }

    sortedPollen.forEach(pollen => {
        const categoryClass = pollen.category.toLowerCase().replace(/\s+/g, '-');
        const card = document.createElement('div');
        card.className = `pollen-card ${categoryClass} bg-white p-5 rounded-lg shadow-md border-l-8 flex flex-col sm:flex-row items-start sm:items-center`;
        
        card.innerHTML = `
            <div class="flex-grow">
                <h2 class="text-2xl font-bold text-gray-800">${pollen.displayName}</h2>
                <p class="text-lg font-semibold text-gray-600">${pollen.category}</p>
            </div>
            <div class="mt-4 sm:mt-0 sm:ml-6 text-4xl font-bold">
                <span class="flex items-center justify-center bg-gray-100 rounded-full w-16 h-16 text-${categoryClass}">
                    ${pollen.value}
                </span>
            </div>`;
        container.appendChild(card);
    });
}

// Start processen når siden indlæses
window.onload = async () => {
    const livePollenData = await fetchPollenData();
    if (livePollenData && livePollenData.hourly) {
        displayPollenInfo(livePollenData);
    }
};
