let debounceTimer;
let fuse = null;
let allData = [];

// Endpoint directo
// const DATA_URL = 'https://botai.smartdataautomation.com/api_backend_ai/dinamic-db/report/119/portafolio_diageo';

// Endpoint de Railway (proxy Diageo)
const DATA_URL = 'https://productosdiageo-production.up.railway.app/api/diageo/portafolio';

async function loadData() {
    try {
        if (!allData.length) {
            const response = await fetch(DATA_URL);
            const json = await response.json();
            allData = json.result || [];
            initializeFuse();

            const searchInput = document.getElementById('searchInput');
            searchInput.disabled = false;
            searchInput.placeholder = 'Ingresa EAN o nombre del producto';
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
        document.getElementById('searchInput').placeholder = 'No disponible';
        document.getElementById('results').innerHTML = `
            <p style="color:red;"> No se pudo cargar la información.
            Es posible que los permisos de CORS o el servidor estén bloqueando la conexión.</p>`;
    }
}

function initializeFuse() {
    const options = {
        keys: ['EAN', 'NOMBRE PROD'],
        threshold: 0.3,
    };
    fuse = new Fuse(allData, options);
}

function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        if (searchInput.trim()) {
            performSearch(searchInput);
        } else {
            document.getElementById('results').innerHTML = '';
        }
    }, 300);
}

function performSearch(query) {
    if (!fuse) return;
    const results = fuse.search(query).map(result => result.item);
    renderResults(results);
}

// Formatea VALOR_UNIDAD con separador de miles
function formatValor(valor) {
    const num = Number(valor);
    return isNaN(num) ? 'N/A' : num.toLocaleString('es-CO');
}

function renderResults(results) {
    let output = `<h2>Resultados (${results.length} encontrados):</h2>`;

    if (results.length > 0) {
        results.forEach(result => {
            const nombre = result['NOMBRE PROD'] || 'Sin nombre';
            // "NA" significa que el producto no pertenece a ningún proyecto
            const proyecto = result.PROJECT && result.PROJECT !== 'NA' ? result.PROJECT : '';

            output += `
                <div class="result-item producto" role="region" aria-label="${nombre}">
                    <h3>
                        <i class="material-icons icon-tipo">local_bar</i>
                        ${nombre}
                    </h3>
                    <div class="tags">
                        ${proyecto ? `<span class="tag">${proyecto}</span>` : ''}
                    </div>
                    <ul>
                        <li><strong>EAN:</strong> ${result.EAN}
                            <i class="material-icons copy-icon" role="button" tabindex="0" aria-label="Copiar EAN" onclick="copyToClipboard('${result.EAN}')">content_copy</i>
                        </li>
                        <li><strong>Valor unidad:</strong> ${formatValor(result.VALOR_UNIDAD)}</li>
                    </ul>
                </div>
            `;
        });
    } else {
        output += '<p>No se encontraron resultados.</p>';
    }

    document.getElementById('results').innerHTML = output;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            alert('EAN copiado al portapapeles');
        })
        .catch(err => {
            alert('Error al copiar el EAN');
            console.error('Error:', err);
        });
}

function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('darkModeLabel').textContent = isDark ? '☀️ Modo claro' : '🌙 Modo oscuro';
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
}

window.onload = () => {
    const darkModeSetting = localStorage.getItem('darkMode');
    const isDark = darkModeSetting === 'enabled';
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('darkModeToggle').checked = isDark;
    document.getElementById('darkModeLabel').textContent = isDark ? '☀️ Modo claro' : '🌙 Modo oscuro';
};

loadData();
