// Web Worker for filtering large datasets
self.onmessage = function(e) {
    const { data, state, flowerMonth, seedMonth, family, both, search, months } = e.data;
    
    try {
        const filtered = [];
        const searchLower = search ? search.toLowerCase() : '';
        
        // Process in chunks to avoid memory issues
        const chunkSize = 5000;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            
            for (let row of chunk) {
                // Apply filters
                if (state && row.state !== state) continue;
                if (flowerMonth && row['flower_' + flowerMonth] !== 1) continue;
                if (seedMonth && row['seed_' + seedMonth] !== 1) continue;
                if (family && row.family !== family) continue;
                
                if (both) {
                    let hasFlower = false, hasSeed = false;
                    for (let m of months) {
                        if (row['flower_' + m] === 1) hasFlower = true;
                        if (row['seed_' + m] === 1) hasSeed = true;
                        if (hasFlower && hasSeed) break;
                    }
                    if (!hasFlower || !hasSeed) continue;
                }
                
                if (searchLower) {
                    const sci = (row.scientific_name || '').toLowerCase();
                    const com = (row.common_name || '').toLowerCase();
                    if (!sci.includes(searchLower) && !com.includes(searchLower)) continue;
                }
                
                filtered.push(row);
            }
            
            // Yield occasionally
            if (i % 10000 === 0) {
                setTimeout(() => {}, 0);
            }
        }
        
        self.postMessage(filtered);
    } catch (error) {
        self.postMessage({ error: error.message });
    }
};
