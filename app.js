// Lightweight mobile version with PC enhancements
let currentDataset = 'aus_native_phenology_complete.csv';
let speciesData = [];
let filteredData = [];
let flowerChart, seedChart;
let filterTimeout;

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthNames = {
    'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
    'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
    'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
};

// Simple DOM ready
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupKeyboardShortcuts();
    checkSystemTheme();
});

// Check system theme preference
function checkSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.remove('light-theme');
    } else {
        document.documentElement.classList.add('light-theme');
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!document.documentElement.classList.contains('high-contrast')) {
            if (e.matches) {
                document.documentElement.classList.remove('light-theme');
            } else {
                document.documentElement.classList.add('light-theme');
            }
        }
    });
}

// Toggle theme manually
function toggleTheme() {
    if (document.documentElement.classList.contains('high-contrast')) {
        document.documentElement.classList.remove('high-contrast');
    }
    
    if (document.documentElement.classList.contains('light-theme')) {
        document.documentElement.classList.remove('light-theme');
    } else {
        document.documentElement.classList.add('light-theme');
    }
}

// Toggle high contrast
function toggleContrast() {
    document.documentElement.classList.toggle('high-contrast');
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Esc to clear filters
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('searchInput');
            if (document.activeElement === searchInput) {
                searchInput.blur();
            } else {
                clearFilters();
            }
        }
        
        // Alt + F to toggle filters
        if (e.altKey && e.key === 'f') {
            e.preventDefault();
            toggleFilters();
        }
    });
}

// Toggle filters
function toggleFilters() {
    const content = document.getElementById('filterContent');
    const toggle = document.getElementById('filterToggle');
    const header = document.querySelector('.filter-header');
    
    content.classList.toggle('hidden');
    const isHidden = content.classList.contains('hidden');
    toggle.textContent = isHidden ? '▶' : '▼';
    
    // Update ARIA attribute
    if (header) {
        header.setAttribute('aria-expanded', !isHidden);
    }
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
    errorBox.style.background = isWarning ? 'var(--warning-bg)' : 'var(--error-bg)';
    errorBox.style.color = isWarning ? 'var(--warning-text)' : 'var(--error-text)';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorBox.style.display = 'none';
    }, 5000);
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
                    showError(`Loaded ${speciesData.length} species`, true);
                }
            } else {
                loadSampleData();
            }
        },
        
        error: (error) => {
            console.error('Parse error:', error);
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
         flower_Jul:1,flower_Aug:1,flower_Sep:1,seed_Oct:1,seed_Nov:1,seed_Dec:1},
        {scientific_name:"Telopea speciosissima",common_name:"Waratah",family:"Proteaceae",state:"NSW",
         flower_Sep:1,flower_Oct:1,flower_Nov:1,seed_Dec:1,seed_Jan:1},
        {scientific_name:"Syzygium smithii",common_name:"Lilly Pilly",family:"Myrtaceae",state:"QLD",
         flower_Nov:1,flower_Dec:1,seed_Jan:1,seed_Feb:1}
    ];
    
    filteredData = [...speciesData];
    updateFamilyFilter();
    updateUI();
    hideLoading();
    showError('Using sample data - ' + speciesData.length + ' species loaded', true);
}

// Update family filter
function updateFamilyFilter() {
    const families = [...new Set(speciesData.map(r => r.family).filter(Boolean))].sort();
    const select = document.getElementById('familyFilter');
    const currentVal = select.value;
    
    select.innerHTML = '<option value="">All families</option>' + 
        families.map(f => `<option value="${f}">${f}</option>`).join('');
    
    if (currentVal && families.includes(currentVal)) {
        select.value = currentVal;
    }
}

// Change dataset
function changeDataset() {
    const newDataset = document.getElementById('datasetSelect').value;
    if (newDataset !== currentDataset) {
        currentDataset = newDataset;
        loadData();
    }
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
        
        // Announce filter results for screen readers
        const announcement = `Showing ${filteredData.length} species`;
        const statusEl = document.createElement('div');
        statusEl.setAttribute('role', 'status');
        statusEl.setAttribute('aria-live', 'polite');
        statusEl.className = 'sr-only';
        statusEl.textContent = announcement;
        document.body.appendChild(statusEl);
        setTimeout(() => statusEl.remove(), 1000);
        
    }, 250);
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

// Update species list
function updateSpeciesList() {
    const container = document.getElementById('speciesList');
    
    if (filteredData.length === 0) {
        container.innerHTML = '<div class="empty-state">No species found matching your filters</div>';
        document.getElementById('resultCount').textContent = '0';
        return;
    }
    
    let html = '';
    filteredData.forEach((row, index) => {
        const flowerMonths = getActiveMonths(row, 'flower');
        const seedMonths = getActiveMonths(row, 'seed');
        
        html += `
            <div class="species-item" tabindex="0" role="article" aria-label="Species: ${escapeHTML(row.scientific_name || '')}">
                <div class="species-name">${escapeHTML(row.scientific_name || 'Unnamed')}</div>
                <div class="species-details">
                    <span class="species-detail">🌿 ${escapeHTML(row.common_name || 'No common name')}</span>
                    <span class="species-detail">🔬 ${escapeHTML(row.family || 'Unknown family')}</span>
                    <span class="species-detail">📍 ${escapeHTML(row.state || 'Australia')}</span>
                </div>
                <div class="species-months">
                    ${flowerMonths.map(m => `<span class="month-tag" data-tooltip="Flowering in ${monthNames[m]}">🌸${m}</span>`).join('')}
                    ${seedMonths.map(m => `<span class="month-tag" data-tooltip="Seeding in ${monthNames[m]}">🌱${m}</span>`).join('')}
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
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Update charts
function updateCharts() {
    const mode = document.getElementById('chartMode').value;
    const total = filteredData.length || 1;
    
    const flowerData = months.map(m => {
        const count = filteredData.filter(r => r['flower_' + m] === 1).length;
        return mode === 'percent' ? Math.round((count / total * 100) * 10) / 10 : count;
    });
    
    const seedData = months.map(m => {
        const count = filteredData.filter(r => r['seed_' + m] === 1).length;
        return mode === 'percent' ? Math.round((count / total * 100) * 10) / 10 : count;
    });
    
    // Destroy old charts
    if (flowerChart) flowerChart.destroy();
    if (seedChart) seedChart.destroy();
    
    // Chart options with better styling
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.dataset.label || '';
                        const value = context.raw;
                        return mode === 'percent' ? `${value}% of species` : `${value} species`;
                    }
                }
            }
        },
        scales: { 
            y: { 
                beginAtZero: true,
                display: true,
                grid: {
                    color: 'rgba(128, 128, 128, 0.1)'
                },
                title: {
                    display: true,
                    text: mode === 'percent' ? 'Percentage (%)' : 'Number of species'
                }
            }
        }
    };
    
    flowerChart = new Chart(
        document.getElementById('flowerChart'),
        {
            type: 'bar',
            data: { 
                labels: months, 
                datasets: [{ 
                    data: flowerData, 
                    backgroundColor: '#4caf50',
                    hoverBackgroundColor: '#2e7d32',
                    borderRadius: 4
                }] 
            },
            options: chartOptions
        }
    );
    
    seedChart = new Chart(
        document.getElementById('seedChart'),
        {
            type: 'bar',
            data: { 
                labels: months, 
                datasets: [{ 
                    data: seedData, 
                    backgroundColor: '#2196f3',
                    hoverBackgroundColor: '#1976d2',
                    borderRadius: 4
                }] 
            },
            options: chartOptions
        }
    );
}

// Update stats
function updateStats() {
    document.getElementById('speciesCount').textContent = filteredData.length;
}

// Export filtered data
function exportFilteredData() {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plant-data-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showError(`Exported ${filteredData.length} species`, true);
}

// Add CSS for screen reader only elements
const style = document.createElement('style');
style.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0,0,0,0);
        border: 0;
    }
`;
document.head.appendChild(style);
