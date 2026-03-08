// Lightweight mobile version
let currentDataset = 'aus_native_phenology_complete.csv';
let speciesData = [];
let filteredData = [];
let flowerChart, seedChart;
let filterTimeout;

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Simple DOM ready
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

// Toggle filters
function toggleFilters() {
    const content = document.getElementById('filterContent');
    const toggle = document.getElementById('filterToggle');
    content.classList.toggle('hidden');
    toggle.textContent = content.classList.contains('hidden') ? '▶' : '▼';
}

// Show/hide loading
function showLoading(msg = 'Loading...') {
    document.getElementById('loadingText').textContent = msg;
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Show error
function showError(msg, isWarning = false) {
    const errorBox = document.getElementById('errorMsg');
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
    errorBox.style.background = isWarning ? '#fff3e0' : '#ffebee';
    errorBox.style.color = isWarning ? '#e65100' : '#c62828';
    setTimeout(() => {
        errorBox.style.display = 'none';
    }, 4000);
}

// Load data
function loadData() {
    showLoading(`Loading ${currentDataset}...`);
    
    Papa.parse('data/' + currentDataset, {
        header: true,
        download: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        
        complete: (results) => {
            if (results.data && results.data.length > 0) {
                speciesData = results.data.filter(r => r.scientific_name);
                if (speciesData.length === 0) {
                    loadSampleData();
                } else {
                    filteredData = [...speciesData];
                    updateFamilyFilter();
                    updateUI();
                    hideLoading();
                }
            } else {
                loadSampleData();
            }
        },
        
        error: () => {
            loadSampleData();
        }
    });
}

// Sample data (lightweight)
function loadSampleData() {
    speciesData = [
        {scientific_name:"Eucalyptus camaldulensis",common_name:"River Red Gum",family:"Myrtaceae",state:"NSW",
         flower_Jan:1,flower_Feb:1,flower_Dec:1,seed_Mar:1,seed_Apr:1,seed_May:1},
        {scientific_name:"Banksia serrata",common_name:"Old Man Banksia",family:"Proteaceae",state:"VIC",
         flower_Aug:1,flower_Sep:1,flower_Oct:1,seed_Nov:1,seed_Dec:1},
        {scientific_name:"Acacia pycnantha",common_name:"Golden Wattle",family:"Fabaceae",state:"ACT",
         flower_Jul:1,flower_Aug:1,flower_Sep:1,seed_Oct:1,seed_Nov:1,seed_Dec:1}
    ];
    
    filteredData = [...speciesData];
    updateFamilyFilter();
    updateUI();
    hideLoading();
    showError('Using sample data', true);
}

// Update family filter
function updateFamilyFilter() {
    const families = [...new Set(speciesData.map(r => r.family).filter(Boolean))].sort();
    const select = document.getElementById('familyFilter');
    const currentVal = select.value;
    
    select.innerHTML = '<option value="">All</option>' + 
        families.map(f => `<option value="${f}">${f}</option>`).join('');
    
    if (currentVal && families.includes(currentVal)) {
        select.value = currentVal;
    }
}

// Change dataset
function changeDataset() {
    currentDataset = document.getElementById('datasetSelect').value;
    loadData();
}

// Apply filters (debounced)
function applyFilters() {
    if (filterTimeout) clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        const state = document.getElementById('stateFilter').value;
        const flowerMonth = document.getElementById('flowerMonth').value;
        const seedMonth = document.getElementById('seedMonth').value;
        const family = document.getElementById('familyFilter').value;
        const both = document.getElementById('bothDataFilter').checked;
        const search = document.getElementById('searchInput').value.toLowerCase();
        
        filteredData = speciesData.filter(row => {
            if (state && row.state !== state) return false;
            if (flowerMonth && row['flower_' + flowerMonth] !== 1) return false;
            if (seedMonth && row['seed_' + seedMonth] !== 1) return false;
            if (family && row.family !== family) return false;
            
            if (both) {
                const hasFlower = months.some(m => row['flower_' + m] === 1);
                const hasSeed = months.some(m => row['seed_' + m] === 1);
                if (!hasFlower || !hasSeed) return false;
            }
            
            if (search) {
                const sci = (row.scientific_name || '').toLowerCase();
                const com = (row.common_name || '').toLowerCase();
                if (!sci.includes(search) && !com.includes(search)) return false;
            }
            
            return true;
        });
        
        updateUI();
    }, 250); // Debounce for performance
}

// Clear filters
function clearFilters() {
    document.getElementById('stateFilter').value = '';
    document.getElementById('flowerMonth').value = '';
    document.getElementById('seedMonth').value = '';
    document.getElementById('familyFilter').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('bothDataFilter').checked = false;
    applyFilters();
}

// Update UI
function updateUI() {
    updateSpeciesList();
    updateCharts();
    updateStats();
}

// Update species list (simplified card view instead of table)
function updateSpeciesList() {
    const container = document.getElementById('speciesList');
    
    if (filteredData.length === 0) {
        container.innerHTML = '<div class="empty-state">No species found</div>';
        document.getElementById('resultCount').textContent = '0';
        return;
    }
    
    let html = '';
    filteredData.forEach(row => {
        const flowerMonths = getActiveMonths(row, 'flower');
        const seedMonths = getActiveMonths(row, 'seed');
        
        html += `
            <div class="species-item">
                <div class="species-name">${escapeHTML(row.scientific_name || '')}</div>
                <div class="species-details">
                    <span class="species-detail">${escapeHTML(row.common_name || '-')}</span>
                    <span class="species-detail">${escapeHTML(row.family || '-')}</span>
                    <span class="species-detail">${escapeHTML(row.state || 'Aus')}</span>
                </div>
                <div class="species-months">
                    ${flowerMonths.map(m => `<span class="month-tag">🌸${m}</span>`).join('')}
                    ${seedMonths.map(m => `<span class="month-tag">🌱${m}</span>`).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('resultCount').textContent = filteredData.length;
}

// Helper: get active months
function getActiveMonths(row, prefix) {
    return months.filter(m => row[prefix + '_' + m] === 1);
}

// Escape HTML
function escapeHTML(str) {
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Update charts (simplified)
function updateCharts() {
    const mode = document.getElementById('chartMode').value;
    const total = filteredData.length || 1;
    
    const flowerData = months.map(m => {
        const count = filteredData.filter(r => r['flower_' + m] === 1).length;
        return mode === 'percent' ? (count / total * 100).toFixed(1) : count;
    });
    
    const seedData = months.map(m => {
        const count = filteredData.filter(r => r['seed_' + m] === 1).length;
        return mode === 'percent' ? (count / total * 100).toFixed(1) : count;
    });
    
    // Destroy old charts
    if (flowerChart) flowerChart.destroy();
    if (seedChart) seedChart.destroy();
    
    // Create new charts (simplified options)
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, display: false } }
    };
    
    flowerChart = new Chart(
        document.getElementById('flowerChart'),
        {
            type: 'bar',
            data: { labels: months, datasets: [{ data: flowerData, backgroundColor: '#4caf50' }] },
            options: chartOptions
        }
    );
    
    seedChart = new Chart(
        document.getElementById('seedChart'),
        {
            type: 'bar',
            data: { labels: months, datasets: [{ data: seedData, backgroundColor: '#2196f3' }] },
            options: chartOptions
        }
    );
}

// Update stats
function updateStats() {
    document.getElementById('speciesCount').textContent = filteredData.length;
}
