// Optimized for large datasets (25,000+ species)
let currentDataset = 'aus_native_phenology_complete.csv';
let speciesData = [];
let filteredData = [];
let flowerChart, seedChart;
let filterTimeout;
let renderTimeout;
let isProcessing = false;

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthNames = {
    'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
    'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
    'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
};

// Cache for processed data
const dataCache = new Map();
const familyCache = new Map();

// Virtual scroll variables
let visibleSpecies = [];
let currentPage = 0;
const PAGE_SIZE = 50; // Show 50 species at a time
let totalPages = 0;

// Simple DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Show theme controls immediately
    document.querySelector('.theme-controls').style.display = 'flex';
    setupKeyboardShortcuts();
    checkSystemTheme();
    loadData();
});

// Check system theme preference
function checkSystemTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Don't override if user has manually set a theme
    if (!localStorage.getItem('theme-preference')) {
        if (prefersDark) {
            document.documentElement.classList.remove('light-theme');
            document.documentElement.classList.remove('dark-theme');
            // Let the CSS media query handle it
        } else {
            document.documentElement.classList.add('light-theme');
            document.documentElement.classList.remove('dark-theme');
        }
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't set a manual preference
        if (!localStorage.getItem('theme-preference')) {
            if (e.matches) {
                document.documentElement.classList.remove('light-theme');
                document.documentElement.classList.remove('dark-theme');
            } else {
                document.documentElement.classList.add('light-theme');
                document.documentElement.classList.remove('dark-theme');
            }
        }
    });
}

// Toggle theme manually
function toggleTheme() {
    // Remove high contrast if active
    if (document.documentElement.classList.contains('high-contrast')) {
        document.documentElement.classList.remove('high-contrast');
    }
    
    // Toggle between light, dark, and system default
    const currentTheme = localStorage.getItem('theme-preference');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (!currentTheme || currentTheme === 'system') {
        // First click: force light theme
        document.documentElement.classList.add('light-theme');
        document.documentElement.classList.remove('dark-theme');
        localStorage.setItem('theme-preference', 'light');
    } else if (currentTheme === 'light') {
        // Second click: force dark theme
        document.documentElement.classList.remove('light-theme');
        document.documentElement.classList.add('dark-theme');
        localStorage.setItem('theme-preference', 'dark');
    } else if (currentTheme === 'dark') {
        // Third click: back to system preference
        document.documentElement.classList.remove('light-theme');
        document.documentElement.classList.remove('dark-theme');
        localStorage.setItem('theme-preference', 'system');
    }
    
    // Update button text to show current mode
    updateThemeButtonText();
}

// Update theme button text
function updateThemeButtonText() {
    const themeButton = document.querySelector('.theme-toggle');
    if (!themeButton) return;
    
    const preference = localStorage.getItem('theme-preference') || 'system';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let modeText = '';
    if (preference === 'light') {
        modeText = '☀️ Light';
    } else if (preference === 'dark') {
        modeText = '🌑 Dark';
    } else {
        modeText = prefersDark ? '🌑 Dark (auto)' : '☀️ Light (auto)';
    }
    
    themeButton.innerHTML = `🌓 ${modeText}`;
}

// Toggle high contrast
function toggleContrast() {
    document.documentElement.classList.toggle('high-contrast');
    
    // Update contrast button text
    const contrastButton = document.querySelector('.contrast-toggle');
    if (contrastButton) {
        const isHighContrast = document.documentElement.classList.contains('high-contrast');
        contrastButton.innerHTML = isHighContrast ? '👁️ High Contrast On' : '👁️ High Contrast Off';
    }
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
        document.documentElement.classList.remove('dark-theme');
    } else if (savedTheme === 'dark') {
        document.documentElement.classList.remove('light-theme');
        document.documentElement.classList.add('dark-theme');
    } else {
        // System default
        document.documentElement.classList.remove('light-theme');
        document.documentElement.classList.remove('dark-theme');
    }
    
    // Load high contrast preference
    const savedContrast = localStorage.getItem('high-contrast');
    if (savedContrast === 'true') {
        document.documentElement.classList.add('high-contrast');
    }
    
    updateThemeButtonText();
    updateContrastButtonText();
    setupKeyboardShortcuts();
    checkSystemTheme();
    loadData();
});

// Update contrast button text
function updateContrastButtonText() {
    const contrastButton = document.querySelector('.contrast-toggle');
    if (contrastButton) {
        const isHighContrast = document.documentElement.classList.contains('high-contrast');
        contrastButton.innerHTML = isHighContrast ? '👁️ High Contrast On' : '👁️ High Contrast Off';
    }
}

// Save high contrast preference when toggled
function toggleContrast() {
    document.documentElement.classList.toggle('high-contrast');
    const isHighContrast = document.documentElement.classList.contains('high-contrast');
    localStorage.setItem('high-contrast', isHighContrast);
    updateContrastButtonText();
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('searchInput');
            if (document.activeElement === searchInput) {
                searchInput.blur();
            } else {
                clearFilters();
            }
        }
    });
}

// Show/hide loading with non-blocking UI
function showLoading(msg = 'Loading...') {
    const loadingEl = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');
    loadingText.textContent = msg;
    loadingEl.style.display = 'flex';
    // Don't add loading class to body - keep UI interactive
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Show message
function showMessage(msg, type = 'info') {
    const errorBox = document.getElementById('errorMsg');
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
    
    const colors = {
        info: { bg: 'var(--accent-light)', text: 'var(--accent-dark)', border: 'var(--accent-primary)' },
        warning: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', border: 'var(--warning-text)' },
        error: { bg: 'var(--error-bg)', text: 'var(--error-text)', border: 'var(--error-text)' }
    };
    
    errorBox.style.background = colors[type].bg;
    errorBox.style.color = colors[type].text;
    errorBox.style.borderLeftColor = colors[type].border;
    
    setTimeout(() => {
        errorBox.style.display = 'none';
    }, 3000);
}

// Load data with streaming parser
function loadData() {
    // Check cache first
    if (dataCache.has(currentDataset)) {
        const cached = dataCache.get(currentDataset);
        speciesData = cached.data;
        familyCache.set('all', cached.families);
        filteredData = [...speciesData];
        updateUI();
        hideLoading();
        showMessage(`Loaded ${speciesData.length} species from cache`, 'info');
        return;
    }
    
    showLoading(`Loading ${currentDataset}...`);
    
    // Use streaming parser for large files
    loadWithStreamingParser();
}

// Load with streaming parser (handles 25k+ records efficiently)
function loadWithStreamingParser() {
    const parsedData = [];
    const families = new Set();
    let rowCount = 0;
    let lastUpdate = Date.now();
    
    Papa.parse('data/' + currentDataset, {
        header: true,
        download: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        step: (results, parser) => {
            // Process each row as it comes in
            const row = results.data;
            if (row.scientific_name) {
                parsedData.push(row);
                if (row.family) families.add(row.family);
                rowCount++;
            }
            
            // Update progress every 500ms or every 1000 rows
            const now = Date.now();
            if (now - lastUpdate > 500 || rowCount % 1000 === 0) {
                document.getElementById('loadingText').textContent = 
                    `Loading... ${rowCount} records`;
                lastUpdate = now;
            }
            
            // Yield to UI every 100 rows
            if (rowCount % 100 === 0) {
                setTimeout(() => {}, 0);
            }
        },
        complete: () => {
            // Process complete dataset
            speciesData = parsedData;
            filteredData = [...speciesData];
            
            // Cache the data
            dataCache.set(currentDataset, {
                data: speciesData,
                families: Array.from(families).sort()
            });
            
            // Update UI
            updateFamilyFilter(Array.from(families).sort());
            updateUI();
            hideLoading();
            showMessage(`Loaded ${speciesData.length} species`, 'info');
        },
        error: (error) => {
            console.error('Parse error:', error);
            loadSampleData();
        },
        chunk: (results, parser) => {
            // Process chunks without blocking
            setTimeout(() => {}, 0);
        }
    });
}

// Sample data fallback
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
    updateFamilyFilter(['Myrtaceae', 'Proteaceae', 'Fabaceae']);
    updateUI();
    hideLoading();
    showMessage('Using sample data', 'warning');
}

// Update family filter (optimized)
function updateFamilyFilter(families) {
    const select = document.getElementById('familyFilter');
    const currentVal = select.value;
    
    // Use DocumentFragment for faster DOM updates
    const fragment = document.createDocumentFragment();
    const optionAll = document.createElement('option');
    optionAll.value = '';
    optionAll.textContent = 'All families';
    fragment.appendChild(optionAll);
    
    families.forEach(f => {
        const option = document.createElement('option');
        option.value = f;
        option.textContent = f;
        fragment.appendChild(option);
    });
    
    // Clear and append in one operation
    select.innerHTML = '';
    select.appendChild(fragment);
    
    if (currentVal && families.includes(currentVal)) {
        select.value = currentVal;
    }
}

// Change dataset
function changeDataset() {
    const newDataset = document.getElementById('datasetSelect').value;
    if (newDataset !== currentDataset) {
        currentDataset = newDataset;
        // Reset pagination
        currentPage = 0;
        loadData();
    }
}

// Apply filters (optimized for large datasets)
function applyFilters() {
    if (isProcessing) return;
    
    if (filterTimeout) clearTimeout(filterTimeout);
    
    filterTimeout = setTimeout(() => {
        isProcessing = true;
        
        const state = document.getElementById('stateFilter').value;
        const flowerMonth = document.getElementById('flowerMonth').value;
        const seedMonth = document.getElementById('seedMonth').value;
        const family = document.getElementById('familyFilter').value;
        const both = document.getElementById('bothDataFilter').checked;
        const search = document.getElementById('searchInput').value.toLowerCase();
        
        // Use setTimeout to not block UI
        setTimeout(() => {
            // For large datasets, use indexed filtering
            if (speciesData.length > 10000) {
                filterLargeDataset(state, flowerMonth, seedMonth, family, both, search);
            } else {
                filterSmallDataset(state, flowerMonth, seedMonth, family, both, search);
            }
        }, 10);
        
    }, 400); // Longer debounce for large datasets
}

// Filter small datasets
function filterSmallDataset(state, flowerMonth, seedMonth, family, both, search) {
    filteredData = speciesData.filter(row => {
        if (state && row.state !== state) return false;
        if (flowerMonth && row['flower_' + flowerMonth] !== 1) return false;
        if (seedMonth && row['seed_' + seedMonth] !== 1) return false;
        if (family && row.family !== family) return false;
        
        if (both) {
            let hasFlower = false, hasSeed = false;
            for (let m of months) {
                if (row['flower_' + m] === 1) hasFlower = true;
                if (row['seed_' + m] === 1) hasSeed = true;
                if (hasFlower && hasSeed) break;
            }
            if (!hasFlower || !hasSeed) return false;
        }
        
        if (search) {
            const sci = (row.scientific_name || '').toLowerCase();
            const com = (row.common_name || '').toLowerCase();
            if (!sci.includes(search) && !com.includes(search)) return false;
        }
        
        return true;
    });
    
    // Reset pagination
    currentPage = 0;
    isProcessing = false;
    updateUI();
}

// Filter large datasets with web worker
function filterLargeDataset(state, flowerMonth, seedMonth, family, both, search) {
    showLoading('Filtering...');
    
    const worker = new Worker('filter-worker.js');
    
    worker.postMessage({
        data: speciesData,
        state,
        flowerMonth,
        seedMonth,
        family,
        both,
        search,
        months
    });
    
    worker.onmessage = (e) => {
        if (e.data.error) {
            console.error('Worker error:', e.data.error);
            // Fallback to normal filtering
            filterSmallDataset(state, flowerMonth, seedMonth, family, both, search);
        } else {
            filteredData = e.data;
            currentPage = 0;
            isProcessing = false;
            hideLoading();
            updateUI();
            showMessage(`Found ${filteredData.length} species`, 'info');
        }
        worker.terminate();
    };
    
    // Timeout fallback
    setTimeout(() => {
        if (isProcessing) {
            worker.terminate();
            filterSmallDataset(state, flowerMonth, seedMonth, family, both, search);
        }
    }, 10000);
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

// Update UI with virtual scrolling
function updateUI() {
    updateStats();
    updateCharts();
    
    // Reset pagination for new data
    totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
    currentPage = 0;
    
    // Render first page
    renderSpeciesPage();
    
    // Setup scroll listener for virtual scrolling
    setupVirtualScrolling();
}

// Render a page of species
function renderSpeciesPage() {
    const start = currentPage * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, filteredData.length);
    visibleSpecies = filteredData.slice(start, end);
    
    updateSpeciesList();
    updateScrollIndicator();
}

// Update species list with current page
function updateSpeciesList() {
    const container = document.getElementById('speciesList');
    
    if (filteredData.length === 0) {
        container.innerHTML = '<div class="empty-state">No species found matching your filters</div>';
        document.getElementById('resultCount').textContent = '0';
        return;
    }
    
    let html = '';
    visibleSpecies.forEach((row, index) => {
        const flowerMonths = getActiveMonths(row, 'flower');
        const seedMonths = getActiveMonths(row, 'seed');
        const globalIndex = currentPage * PAGE_SIZE + index + 1;
        
        html += `
            <div class="species-item" data-index="${globalIndex}">
                <div class="species-name">${escapeHTML(row.scientific_name || 'Unnamed')}</div>
                <div class="species-details">
                    <span class="species-detail">🌿 ${escapeHTML(row.common_name || 'No common name')}</span>
                    <span class="species-detail">🔬 ${escapeHTML(row.family || 'Unknown family')}</span>
                    <span class="species-detail">📍 ${escapeHTML(row.state || 'Australia')}</span>
                </div>
                <div class="species-months">
                    ${flowerMonths.map(m => `<span class="month-tag" title="Flowering in ${monthNames[m]}">🌸${m}</span>`).join('')}
                    ${seedMonths.map(m => `<span class="month-tag" title="Seeding in ${monthNames[m]}">🌱${m}</span>`).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('resultCount').textContent = filteredData.length;
}

// Setup virtual scrolling
function setupVirtualScrolling() {
    const container = document.querySelector('.species-list');
    if (!container) return;
    
    let scrollTimeout;
    
    container.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(() => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            
            // Load next page when near bottom
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                if (currentPage < totalPages - 1) {
                    currentPage++;
                    renderSpeciesPage();
                }
            }
            
            // Load previous page when near top
            if (scrollTop < 200 && currentPage > 0) {
                currentPage--;
                renderSpeciesPage();
                // Maintain scroll position
                container.scrollTop = 200;
            }
        }, 100);
    });
}

// Update scroll indicator
function updateScrollIndicator() {
    const indicator = document.getElementById('scrollIndicator');
    if (!indicator) {
        const div = document.createElement('div');
        div.id = 'scrollIndicator';
        div.className = 'scroll-indicator';
        document.querySelector('.card:last-child').appendChild(div);
    }
    
    const start = currentPage * PAGE_SIZE + 1;
    const end = Math.min((currentPage + 1) * PAGE_SIZE, filteredData.length);
    document.getElementById('scrollIndicator').textContent = 
        `Showing ${start}-${end} of ${filteredData.length} species`;
}

// Helper: get active months (optimized)
function getActiveMonths(row, prefix) {
    const active = [];
    for (let m of months) {
        if (row[prefix + '_' + m] === 1) {
            active.push(m);
        }
    }
    return active;
}

// Escape HTML
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Update charts (optimized)
function updateCharts() {
    if (renderTimeout) clearTimeout(renderTimeout);
    
    renderTimeout = setTimeout(() => {
        const mode = document.getElementById('chartMode').value;
        const total = filteredData.length || 1;
        
        // Use Typed Arrays for better performance
        const flowerData = new Array(12).fill(0);
        const seedData = new Array(12).fill(0);
        
        // Count in one pass
        for (let row of filteredData) {
            for (let i = 0; i < months.length; i++) {
                if (row['flower_' + months[i]] === 1) flowerData[i]++;
                if (row['seed_' + months[i]] === 1) seedData[i]++;
            }
        }
        
        if (mode === 'percent') {
            for (let i = 0; i < 12; i++) {
                flowerData[i] = Math.round((flowerData[i] / total * 100) * 10) / 10;
                seedData[i] = Math.round((seedData[i] / total * 100) * 10) / 10;
            }
        }
        
        // Destroy old charts
        if (flowerChart) flowerChart.destroy();
        if (seedChart) seedChart.destroy();
        
        // Chart options (simplified for performance)
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Disable animations for performance
            plugins: { 
                legend: { display: false },
                tooltip: { enabled: true }
            },
            scales: { 
                y: { 
                    beginAtZero: true,
                    display: true,
                    grid: { color: 'rgba(128,128,128,0.1)' }
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
                        barPercentage: 0.9,
                        categoryPercentage: 0.9
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
                        barPercentage: 0.9,
                        categoryPercentage: 0.9
                    }] 
                },
                options: chartOptions
            }
        );
    }, 100);
}

// Update stats
function updateStats() {
    document.getElementById('speciesCount').textContent = filteredData.length;
}

// Export filtered data (in chunks)
function exportFilteredData() {
    const chunkSize = 5000;
    let exported = 0;
    
    showMessage(`Exporting ${filteredData.length} species...`, 'info');
    
    function exportNextChunk() {
        const chunk = filteredData.slice(exported, exported + chunkSize);
        const dataStr = JSON.stringify(chunk, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plant-data-part-${Math.floor(exported/chunkSize)+1}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        exported += chunkSize;
        
        if (exported < filteredData.length) {
            setTimeout(exportNextChunk, 100);
            showMessage(`Exported ${exported} of ${filteredData.length} species...`, 'info');
        } else {
            showMessage(`Export complete! ${filteredData.length} species exported in multiple files`, 'info');
        }
    }
    
    exportNextChunk();
}

// Toggle filters
function toggleFilters() {
    const content = document.getElementById('filterContent');
    const toggle = document.getElementById('filterToggle');
    content.classList.toggle('hidden');
    toggle.textContent = content.classList.contains('hidden') ? '▶' : '▼';
}

// Add CSS for scroll indicator
const style = document.createElement('style');
style.textContent = `
    .scroll-indicator {
        text-align: center;
        padding: 10px;
        font-size: 0.9rem;
        color: var(--text-secondary);
        border-top: 1px solid var(--border-color);
        margin-top: 10px;
    }
    
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
