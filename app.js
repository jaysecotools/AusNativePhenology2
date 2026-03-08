let currentDataset = 'aus_native_phenology_complete.csv';
let speciesData = [];
let filteredData = [];
let flowerChart;
let seedChart;
let loadingTimeout;
let filterTimeout;
let loadStartTime;

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
});

function setupEventListeners() {
    // Debounced search input
    document.getElementById('searchInput').addEventListener('input', debounce(handleInstantFilter, 300));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading(message = 'Loading data...') {
    document.getElementById('loadingMessage').textContent = message;
    document.getElementById('loadingOverlay').style.display = 'flex';
    loadStartTime = performance.now();
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
    if (loadStartTime) {
        const loadTime = ((performance.now() - loadStartTime) / 1000).toFixed(2);
        document.getElementById('loadingTime').textContent = `Loaded in ${loadTime}s`;
    }
}

function showError(message, isWarning = false) {
    const errorToast = document.getElementById('errorToast');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorToast.style.backgroundColor = isWarning ? '#ff9800' : '#f44336';
    errorToast.style.display = 'flex';
    
    // Auto-hide after 5 seconds for warnings, 8 seconds for errors
    setTimeout(hideError, isWarning ? 5000 : 8000);
}

function hideError() {
    document.getElementById('errorToast').style.display = 'none';
}

function loadData() {
    showLoading(`Loading ${currentDataset}...`);
    
    const dataFile = 'data/' + currentDataset;
    
    Papa.parse(dataFile, {
        header: true,
        download: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                speciesData = results.data.filter(r => r.scientific_name);
                
                if (speciesData.length === 0) {
                    showError('No valid species data found in the file', true);
                } else {
                    filteredData = [...speciesData];
                    populateFamilyFilter();
                    updateUI();
                    showError(`Successfully loaded ${speciesData.length} species`, true);
                }
            } else {
                showError('The dataset is empty or could not be parsed correctly');
            }
            hideLoading();
        },
        
        error: function(error) {
            console.error('Parse error:', error);
            showError(`Failed to load dataset: ${error.message || 'Unknown error'}`);
            hideLoading();
            
            // Load sample data as fallback
            if (currentDataset !== 'sample_phenology_data.csv') {
                loadSampleData();
            }
        }
    });
}

function loadSampleData() {
    showLoading('Loading sample data as fallback...');
    
    // Create minimal sample data
    speciesData = [
        {
            scientific_name: "Eucalyptus camaldulensis",
            common_name: "River Red Gum",
            family: "Myrtaceae",
            state: "NSW",
            flower_Jan: 1, flower_Feb: 1, flower_Mar: 0, flower_Apr: 0, flower_May: 0, flower_Jun: 0,
            flower_Jul: 0, flower_Aug: 0, flower_Sep: 0, flower_Oct: 0, flower_Nov: 0, flower_Dec: 1,
            seed_Jan: 0, seed_Feb: 0, seed_Mar: 1, seed_Apr: 1, seed_May: 1, seed_Jun: 0,
            seed_Jul: 0, seed_Aug: 0, seed_Sep: 0, seed_Oct: 0, seed_Nov: 0, seed_Dec: 0
        },
        {
            scientific_name: "Banksia serrata",
            common_name: "Old Man Banksia",
            family: "Proteaceae",
            state: "VIC",
            flower_Jan: 0, flower_Feb: 0, flower_Mar: 0, flower_Apr: 0, flower_May: 0, flower_Jun: 0,
            flower_Jul: 0, flower_Aug: 1, flower_Sep: 1, flower_Oct: 1, flower_Nov: 0, flower_Dec: 0,
            seed_Jan: 0, seed_Feb: 0, seed_Mar: 0, seed_Apr: 0, seed_May: 0, seed_Jun: 0,
            seed_Jul: 0, seed_Aug: 0, seed_Sep: 0, seed_Oct: 0, seed_Nov: 1, seed_Dec: 1
        },
        {
            scientific_name: "Acacia pycnantha",
            common_name: "Golden Wattle",
            family: "Fabaceae",
            state: "ACT",
            flower_Jan: 0, flower_Feb: 0, flower_Mar: 0, flower_Apr: 0, flower_May: 0, flower_Jun: 0,
            flower_Jul: 1, flower_Aug: 1, flower_Sep: 1, flower_Oct: 0, flower_Nov: 0, flower_Dec: 0,
            seed_Jan: 0, seed_Feb: 0, seed_Mar: 0, seed_Apr: 0, seed_May: 0, seed_Jun: 0,
            seed_Jul: 0, seed_Aug: 0, seed_Sep: 0, seed_Oct: 1, seed_Nov: 1, seed_Dec: 1
        }
    ];
    
    filteredData = [...speciesData];
    populateFamilyFilter();
    updateUI();
    hideLoading();
    showError('Using sample data - please check your data files', true);
}

function changeDataset() {
    currentDataset = document.getElementById('datasetSelect').value;
    loadData();
}

function handleInstantFilter() {
    // Clear any pending filter timeout
    if (filterTimeout) {
        clearTimeout(filterTimeout);
    }
    
    // Use requestAnimationFrame for smooth UI updates
    filterTimeout = requestAnimationFrame(() => {
        applyFilters();
        updateFilterIndicator();
    });
}

function updateFilterIndicator() {
    const state = document.getElementById('stateFilter').value;
    const flowerMonth = document.getElementById('flowerMonth').value;
    const seedMonth = document.getElementById('seedMonth').value;
    const family = document.getElementById('familyFilter').value;
    const both = document.getElementById('bothDataFilter').checked;
    const search = document.getElementById('searchInput').value;
    
    const activeFilters = [state, flowerMonth, seedMonth, family].filter(f => f).length + 
                          (both ? 1 : 0) + (search ? 1 : 0);
    
    const indicator = document.getElementById('filterIndicator');
    if (activeFilters > 0) {
        indicator.textContent = `${activeFilters} active filter${activeFilters > 1 ? 's' : ''}`;
    } else {
        indicator.textContent = '';
    }
}

function clearAllFilters() {
    document.getElementById('stateFilter').value = '';
    document.getElementById('flowerMonth').value = '';
    document.getElementById('seedMonth').value = '';
    document.getElementById('familyFilter').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('bothDataFilter').checked = false;
    
    handleInstantFilter();
}

function populateFamilyFilter() {
    const families = [...new Set(speciesData.map(r => r.family).filter(Boolean))].sort();
    const select = document.getElementById('familyFilter');
    
    // Preserve current selection if possible
    const currentValue = select.value;
    
    while(select.options.length > 1) select.remove(1);
    
    families.forEach(f => {
        let option = document.createElement('option');
        option.value = f;
        option.textContent = f;
        select.appendChild(option);
    });
    
    // Try to restore previous selection
    if (currentValue && families.includes(currentValue)) {
        select.value = currentValue;
    }
}

function applyFilters() {
    const state = document.getElementById('stateFilter').value;
    const flowerMonth = document.getElementById('flowerMonth').value;
    const seedMonth = document.getElementById('seedMonth').value;
    const family = document.getElementById('familyFilter').value;
    const both = document.getElementById('bothDataFilter').checked;
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    filteredData = speciesData.filter(row => {
        if(state && row.state !== state) return false;
        if(flowerMonth && row['flower_' + flowerMonth] !== 1) return false;
        if(seedMonth && row['seed_' + seedMonth] !== 1) return false;
        if(family && row.family !== family) return false;
        
        if(both) {
            const hasFlower = months.some(m => row['flower_' + m] === 1);
            const hasSeed = months.some(m => row['seed_' + m] === 1);
            if(!hasFlower || !hasSeed) return false;
        }
        
        if(search) {
            const scientific = (row.scientific_name || '').toLowerCase();
            const common = (row.common_name || '').toLowerCase();
            if(!scientific.includes(search) && !common.includes(search)) return false;
        }
        
        return true;
    });
    
    updateUI();
}

function resetFilters() {
    document.getElementById('stateFilter').value = '';
    document.getElementById('flowerMonth').value = '';
    document.getElementById('seedMonth').value = '';
    document.getElementById('familyFilter').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('bothDataFilter').checked = false;
    
    filteredData = [...speciesData];
    updateUI();
    updateFilterIndicator();
}

function updateUI() {
    updateTable();
    updateCharts();
    updateStats();
}

function updateTable() {
    const tableBody = document.getElementById('tableBody');
    const fragment = document.createDocumentFragment();
    
    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        
        const flowerMonths = getActiveMonths(row, 'flower');
        const seedMonths = getActiveMonths(row, 'seed');
        
        tr.innerHTML = `
            <td><i>${escapeHTML(row.scientific_name || '')}</i></td>
            <td>${escapeHTML(row.common_name || '-')}</td>
            <td>${escapeHTML(row.family || '-')}</td>
            <td>${escapeHTML(row.state || 'Australia')}</td>
            <td class="month-cell">${formatMonths(flowerMonths)}</td>
            <td class="month-cell">${formatMonths(seedMonths)}</td>
        `;
        
        fragment.appendChild(tr);
    });
    
    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
    
    document.getElementById('resultCount').textContent = 
        `${filteredData.length} species (${((filteredData.length / speciesData.length) * 100).toFixed(1)}% of total)`;
}

function escapeHTML(str) {
    return String(str).replace(/[&<>"]/g, function(match) {
        if (match === '&') return '&amp;';
        if (match === '<') return '&lt;';
        if (match === '>') return '&gt;';
        if (match === '"') return '&quot;';
        return match;
    });
}

function getActiveMonths(row, prefix) {
    return months.filter(m => row[prefix + '_' + m] === 1);
}

function formatMonths(arr) {
    if(arr.length === 0) return '—';
    if(arr.length === 12) return 'All year';
    return arr.join(', ');
}

function updateCharts() {
    const mode = document.getElementById('chartMode').value;
    const yLabel = mode === "percent" ? "Percent of species" : "Number of species";
    const totalSpecies = filteredData.length;
    
    const flowerCounts = months.map(m => {
        const count = filteredData.filter(r => r['flower_' + m] === 1).length;
        return mode === "percent" ? (totalSpecies ? (count / totalSpecies * 100).toFixed(1) : 0) : count;
    });
    
    const seedCounts = months.map(m => {
        const count = filteredData.filter(r => r['seed_' + m] === 1).length;
        return mode === "percent" ? (totalSpecies ? (count / totalSpecies * 100).toFixed(1) : 0) : count;
    });
    
    // Destroy existing charts
    if(flowerChart) flowerChart.destroy();
    if(seedChart) seedChart.destroy();
    
    // Create new charts with optimized settings
    flowerChart = new Chart(
        document.getElementById('flowerChart'),
        {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    data: flowerCounts,
                    backgroundColor: 'rgba(76,175,80,0.7)',
                    hoverBackgroundColor: 'rgba(76,175,80,0.9)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                return mode === "percent" ? `${value}% of species` : `${value} species`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: yLabel }
                    }
                },
                animation: {
                    duration: 500 // Faster animations
                }
            }
        }
    );
    
    seedChart = new Chart(
        document.getElementById('seedChart'),
        {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    data: seedCounts,
                    backgroundColor: 'rgba(33,150,243,0.7)',
                    hoverBackgroundColor: 'rgba(33,150,243,0.9)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                return mode === "percent" ? `${value}% of species` : `${value} species`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: yLabel }
                    }
                },
                animation: {
                    duration: 500
                }
            }
        }
    );
}

function updateStats() {
    document.getElementById('speciesCount').textContent = filteredData.length;
    const percentage = speciesData.length ? ((filteredData.length / speciesData.length) * 100).toFixed(1) : 0;
    document.getElementById('filteredPercentage').textContent = `${percentage}%`;
}

function sortTable(columnIndex) {
    const keys = ['scientific_name', 'common_name', 'family', 'state'];
    
    filteredData.sort((a, b) => {
        const aVal = (a[keys[columnIndex]] || '').toLowerCase();
        const bVal = (b[keys[columnIndex]] || '').toLowerCase();
        return aVal.localeCompare(bVal);
    });
    
    updateTable();
}

function exportToCSV() {
    const headers = ['Scientific Name', 'Common Name', 'Family', 'State', 'Flowering Months', 'Seed Months'];
    const rows = filteredData.map(row => [
        row.scientific_name || '',
        row.common_name || '',
        row.family || '',
        row.state || 'Australia',
        getActiveMonths(row, 'flower').join(';'),
        getActiveMonths(row, 'seed').join(';')
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `plant_phenology_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showError('Export completed successfully!', true);
}
