// Upload and Data Processing Manager
const uploadManager = (function() {
    let dropZone, fileInput, browseBtn, fileInfo, fileName, fileSize, removeFile, analyzeBtn;
    let loadingIndicator, progressBar, resultsSection;
    let uploadedFile = null;
    let processedData = null;
    let analysisResults = null;
    
    function init() {
        dropZone = document.getElementById('dropZone');
        fileInput = document.getElementById('fileInput');
        browseBtn = document.getElementById('browseBtn');
        fileInfo = document.getElementById('fileInfo');
        fileName = document.getElementById('fileName');
        fileSize = document.getElementById('fileSize');
        removeFile = document.getElementById('removeFile');
        analyzeBtn = document.getElementById('analyzeBtn');
        loadingIndicator = document.getElementById('loadingIndicator');
        progressBar = document.getElementById('progressBar');
        resultsSection = document.getElementById('resultsSection');
        
        setupEventListeners();
    }
    
    function setupEventListeners() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            if (dropZone) {
                dropZone.addEventListener(eventName, preventDefaults, false);
            }
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            if (dropZone) dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            if (dropZone) dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        if (dropZone) dropZone.addEventListener('drop', handleDrop, false);
        if (browseBtn) browseBtn.addEventListener('click', () => fileInput && fileInput.click());
        if (fileInput) fileInput.addEventListener('change', handleFileSelect, false);
        if (removeFile) removeFile.addEventListener('click', resetFileInput);
        if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeData);
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        if (dropZone) {
            dropZone.classList.add('border-blue-500', 'bg-blue-50');
        }
    }
    
    function unhighlight() {
        if (dropZone) {
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        }
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    function handleFileSelect(e) {
        const files = e.target.files || e.dataTransfer.files;
        handleFiles(files);
    }
    
    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            if (!file.name.endsWith('.csv')) {
                showToast('Please upload a CSV file.', 'error');
                return;
            }
            
            const maxSize = 500 * 1024 * 1024; // 500MB
            if (file.size > maxSize) {
                showToast('File is too large. Maximum size is 500MB.', 'error');
                return;
            }
            
            uploadedFile = file;
            updateFileInfo(file);
        }
    }
    
    function updateFileInfo(file) {
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);
        if (fileInfo) fileInfo.classList.remove('hidden');
        if (resultsSection) resultsSection.classList.add('hidden');
        processedData = null;
        analysisResults = null;
    }
    
    function resetFileInput() {
        if (fileInput) fileInput.value = '';
        if (fileInfo) fileInfo.classList.add('hidden');
        uploadedFile = null;
        if (resultsSection) resultsSection.classList.add('hidden');
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    async function analyzeData() {
        if (!uploadedFile) {
            showToast('Please select a file to analyze.', 'warning');
            return;
        }
        
        try {
            showLoading(true);
            const startTime = Date.now();
            
            const formData = new FormData();
            formData.append('file', uploadedFile);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            const result = await response.json();
            
            if (result.status === 'success') {
                const endTime = Date.now();
                const processingTime = ((endTime - startTime) / 1000).toFixed(2);
                
                // Update processing speed
                const speedElement = document.getElementById('processingSpeed');
                if (speedElement) {
                    speedElement.textContent = processingTime + 's';
                }
                
                // Display results with graphs - pass entire result to access graphs
                displayResults(result);
                showToast(`Analysis completed in ${processingTime}s! All graphs generated.`, 'success');
            } else {
                throw new Error(result.message || 'Analysis failed');
            }
            
        } catch (error) {
            console.error('Error analyzing data:', error);
            let errorMsg = error.message || 'An error occurred while analyzing the data.';
            if (errorMsg.includes('File too large')) {
                errorMsg = 'File exceeds 500MB limit. Please use a smaller file.';
            } else if (errorMsg.includes('Required column')) {
                errorMsg = 'CSV file must contain Time, Amount, and Class columns.';
            }
            showToast(errorMsg, 'error');
        } finally {
            showLoading(false);
        }
    }
    
    function showLoading(show) {
        if (loadingIndicator) {
            loadingIndicator.classList.toggle('hidden', !show);
        }
        
        if (analyzeBtn) {
            analyzeBtn.disabled = show;
            analyzeBtn.innerHTML = show ? 
                '<i class="fas fa-spinner fa-spin mr-2"></i> Analyzing...' : 
                '<i class="fas fa-chart-line mr-2"></i> Analyze';
        }
        
        if (progressBar && show) {
            progressBar.style.width = '0%';
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                }
                progressBar.style.width = `${Math.min(100, progress)}%`;
            }, 200);
        }
    }
    
    function displayResults(result) {
        if (!result) return;
        
        // Handle both direct results and nested data structure
        const results = result.data || result;
        const totalTransactions = results.processed_rows || results.totalTransactions || 0;
        const classDist = results.class_distribution || {};
        const fraudulentCount = classDist['1'] || results.fraudulentCount || 0;
        const genuineCount = classDist['0'] || results.genuineCount || totalTransactions - fraudulentCount;
        
        if (document.getElementById('totalTransactions')) {
            document.getElementById('totalTransactions').textContent = totalTransactions.toLocaleString();
        }
        if (document.getElementById('genuineCount')) {
            document.getElementById('genuineCount').textContent = genuineCount.toLocaleString();
        }
        if (document.getElementById('fraudulentCount')) {
            document.getElementById('fraudulentCount').textContent = fraudulentCount.toLocaleString();
        }
        
        // Calculate percentages
        const genuinePercent = totalTransactions > 0 ? ((genuineCount / totalTransactions) * 100).toFixed(2) : 0;
        const fraudPercent = totalTransactions > 0 ? ((fraudulentCount / totalTransactions) * 100).toFixed(2) : 0;
        const riskScore = totalTransactions > 0 ? ((fraudulentCount / totalTransactions) * 100).toFixed(2) : 0;
        
        if (document.getElementById('genuinePercent')) {
            document.getElementById('genuinePercent').textContent = genuinePercent + '%';
        }
        if (document.getElementById('fraudPercent')) {
            document.getElementById('fraudPercent').textContent = fraudPercent + '%';
        }
        if (document.getElementById('riskScore')) {
            document.getElementById('riskScore').textContent = riskScore + '%';
        }
        
        const metrics = results.model_metrics || {};
        if (metrics.accuracy !== undefined) {
            if (document.getElementById('accuracyValue')) {
                document.getElementById('accuracyValue').textContent = (metrics.accuracy * 100).toFixed(2) + '%';
            }
            if (document.getElementById('precisionValue')) {
                document.getElementById('precisionValue').textContent = (metrics.precision * 100).toFixed(2) + '%';
            }
            if (document.getElementById('recallValue')) {
                document.getElementById('recallValue').textContent = (metrics.recall * 100).toFixed(2) + '%';
            }
            if (document.getElementById('f1ScoreValue')) {
                document.getElementById('f1ScoreValue').textContent = (metrics.f1_score * 100).toFixed(2) + '%';
            }
        }
        
        const cm = results.confusion_matrix || [];
        if (Array.isArray(cm) && cm.length === 2) {
            if (document.getElementById('truePositives')) {
                document.getElementById('truePositives').textContent = cm[1]?.[1] || 0;
            }
            if (document.getElementById('falsePositives')) {
                document.getElementById('falsePositives').textContent = cm[0]?.[1] || 0;
            }
            if (document.getElementById('trueNegatives')) {
                document.getElementById('trueNegatives').textContent = cm[0]?.[0] || 0;
            }
            if (document.getElementById('falseNegatives')) {
                document.getElementById('falseNegatives').textContent = cm[1]?.[0] || 0;
            }
        }
        
        // Display Python-generated graphs
        displayPythonGraphs(result.graphs || {});
        
        // Show results section
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }
    
    function displayPythonGraphs(graphs) {
        if (!graphs || Object.keys(graphs).length === 0) {
            console.warn('No graphs to display');
            return;
        }
        
        const graphMap = {
            'class_distribution': { imgId: 'classDistributionGraph', loadId: 'classDistributionLoading' },
            'amount_distribution': { imgId: 'amountDistributionGraph', loadId: 'amountDistributionLoading' },
            'confusion_matrix': { imgId: 'confusionMatrixGraph', loadId: 'confusionMatrixLoading' },
            'metrics_chart': { imgId: 'metricsChartGraph', loadId: 'metricsChartLoading' },
            'correlation_heatmap': { imgId: 'correlationHeatmapGraph', loadId: 'correlationHeatmapLoading' },
            'time_series': { imgId: 'timeSeriesGraph', loadId: 'timeSeriesLoading' }
        };
        
        let graphsLoaded = 0;
        
        Object.keys(graphMap).forEach(key => {
            if (graphs[key]) {
                const { imgId, loadId } = graphMap[key];
                const img = document.getElementById(imgId);
                const loading = document.getElementById(loadId);
                
                if (img && loading) {
                    img.onload = () => {
                        img.style.display = 'block';
                        loading.style.display = 'none';
                        graphsLoaded++;
                        if (graphsLoaded === Object.keys(graphs).length) {
                            console.log('All graphs loaded successfully');
                        }
                    };
                    img.onerror = () => {
                        loading.textContent = 'Graph failed to load';
                        loading.style.color = 'red';
                    };
                    img.src = 'data:image/png;base64,' + graphs[key];
                }
            }
        });
        
        // Show graphs section
        const graphsSection = document.getElementById('pythonGraphsSection');
        if (graphsSection && Object.keys(graphs).length > 0) {
            graphsSection.classList.remove('hidden');
            setTimeout(() => {
                graphsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 500);
        }
    }
    
    function showToast(message, type = 'info') {
        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            alert(message);
        }
    }
    
    return {
        init,
        getProcessedData: () => processedData,
        getAnalysisResults: () => analysisResults
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', uploadManager.init);
} else {
    uploadManager.init();
}

window.uploadManager = uploadManager;

