// Web Worker for parsing large CSV files
self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js');

self.onmessage = function(e) {
    const { file, dataset } = e.data;
    
    Papa.parse(file, {
        header: true,
        download: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        chunkSize: 1024 * 1024, // 1MB chunks
        worker: true, // Use PapaParse's own worker
        complete: (results) => {
            self.postMessage({
                data: results.data.filter(r => r.scientific_name),
                dataset: dataset
            });
        },
        error: (error) => {
            self.postMessage({ error: error.message });
        }
    });
};
