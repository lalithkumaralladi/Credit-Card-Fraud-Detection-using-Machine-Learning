// Upload and Data Processing Manager
const uploadManager = (function() {
    // DOM Elements
    let dropZone, fileInput, browseBtn, fileInfo, fileName, fileSize, removeFile, analyzeBtn;
    let loadingIndicator, progressBar, resultsSection;
    
    // Data storage
    let uploadedFile = null;
    let processedData = null;
    let analysisResults = null;
    
    // Initialize the upload manager
    function init() {
        // Get DOM elements
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
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Set up all event listeners
    function setupEventListeners() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        // Handle dropped files
        dropZone.addEventListener('drop', handleDrop, false);
        
        // Handle file selection via button
        if (browseBtn) {
            browseBtn.addEventListener('click', () => fileInput.click());
        }
        
        // Handle file input change
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect, false);
        }
        
        // Remove file
        if (removeFile) {
            removeFile.addEventListener('click', resetFileInput);
        }
        
        // Analyze button
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', analyzeData);
        }
    }
    
    // Prevent default drag behaviors
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop zone
    function highlight() {
        dropZone.classList.add('border-blue-500', 'bg-blue-50');
    }
    
    // Remove highlight from drop zone
    function unhighlight() {
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    }
    
    // Handle dropped files
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Handle file selection
    function handleFileSelect(e) {
        const files = e.target.files || e.dataTransfer.files;
        handleFiles(files);
    }
    
    // Process selected files
    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            // Check if file is CSV
            if (!file.name.endsWith('.csv')) {
                showToast('Please upload a CSV file.', 'error');
                return;
            }
            
            // Check file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                showToast('File is too large. Maximum size is 10MB.', 'error');
                return;
            }
            
            // Store the file
            uploadedFile = file;
            
            // Update UI
            updateFileInfo(file);
        }
    }
    
    // Update file information in the UI
    function updateFileInfo(file) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.classList.remove('hidden');
        
        // Reset results if any
        resultsSection.classList.add('hidden');
        processedData = null;
        analysisResults = null;
    }
    
    // Reset file input
    function resetFileInput() {
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        uploadedFile = null;
        resultsSection.classList.add('hidden');
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Analyze the uploaded data
    async function analyzeData() {
        if (!uploadedFile) {
            showToast('Please select a file to analyze.', 'warning');
            return;
        }
        
        try {
            // Show loading indicator
            showLoading(true);
            
            // Step 1: Read the CSV file
            const csvData = await readFileAsText(uploadedFile);
            
            // Step 2: Parse CSV data
            processedData = parseCSV(csvData);
            
            // Simulate processing steps with progress updates
            await simulateProcessing();
            
            // Step 3: Perform analysis
            analysisResults = analyzeTransactionData(processedData);
            
            // Step 4: Display results
            displayResults(analysisResults);
            
            // Show success message
            showToast('Analysis completed successfully!', 'success');
            
        } catch (error) {
            console.error('Error analyzing data:', error);
            showToast('An error occurred while analyzing the data.', 'error');
        } finally {
            // Hide loading indicator
            showLoading(false);
        }
    }
    
    // Read file as text
    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            reader.readAsText(file);
        });
    }
    
    // Parse CSV data
    function parseCSV(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const entry = {};
            
            for (let j = 0; j < headers.length; j++) {
                // Handle cases where the value might be quoted
                let value = values[j] || '';
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                
                // Convert to number if possible
                const numValue = parseFloat(value);
                entry[headers[j]] = isNaN(numValue) ? value : numValue;
            }
            
            data.push(entry);
        }
        
        return {
            headers,
            data,
            totalRows: data.length
        };
    }
    
    // Simulate processing with progress updates
    function simulateProcessing() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    updateProgress(100);
                    setTimeout(resolve, 500);
                } else {
                    updateProgress(progress);
                }
            }, 200);
        });
    }
    
    // Update progress bar
    function updateProgress(percent) {
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    }
    
    // Show/hide loading indicator
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
    }
    
    // Analyze transaction data
    function analyzeTransactionData(data) {
        const { headers, data: rows } = data;
        
        // Check if required columns exist
        const hasAmount = headers.includes('Amount');
        const hasClass = headers.includes('Class');
        
        // Generate sample analysis (in a real app, this would use actual ML models)
        const totalTransactions = rows.length;
        let genuineCount = 0;
        let fraudulentCount = 0;
        
        // Calculate basic statistics
        const amounts = [];
        const vFeatures = {};
        
        // Initialize V feature arrays
        for (let i = 1; i <= 28; i++) {
            vFeatures[`V${i}`] = [];
        }
        
        // Process each row
        rows.forEach(row => {
            // Count genuine vs fraudulent (if Class column exists)
            if (hasClass && (row.Class === 1 || row.Class === '1')) {
                fraudulentCount++;
            } else if (hasClass) {
                genuineCount++;
            }
            
            // Collect amounts
            if (hasAmount && !isNaN(row.Amount)) {
                amounts.push(parseFloat(row.Amount));
            }
            
            // Collect V features
            for (let i = 1; i <= 28; i++) {
                const vKey = `V${i}`;
                if (row[vKey] !== undefined && !isNaN(row[vKey])) {
                    vFeatures[vKey].push(parseFloat(row[vKey]));
                }
            }
        });
        
        // If no Class column, simulate some fraudulent transactions (20%)
        if (!hasClass) {
            fraudulentCount = Math.floor(rows.length * 0.2);
            genuineCount = rows.length - fraudulentCount;
            
            // Add simulated fraud flags to the data
            rows.forEach((row, index) => {
                row.isFraudulent = index < fraudulentCount;
                row.confidence = Math.random() * 100;
            });
        } else {
            // Add confidence scores for actual data
            rows.forEach(row => {
                row.isFraudulent = row.Class === 1 || row.Class === '1';
                row.confidence = row.isFraudulent ? 
                    Math.max(70, Math.random() * 100) : 
                    Math.min(30, Math.random() * 100);
            });
        }
        
        // Calculate statistics
        const amountStats = calculateStats(amounts);
        
        // Calculate feature correlations (simplified)
        const correlations = calculateCorrelations(vFeatures);
        
        // Calculate model metrics (simulated)
        const metrics = {
            accuracy: 0.98,
            precision: 0.96,
            recall: 0.92,
            f1Score: 0.94,
            confusionMatrix: {
                truePositives: Math.round(fraudulentCount * 0.92),
                falsePositives: Math.round(genuineCount * 0.01),
                trueNegatives: Math.round(genuineCount * 0.99),
                falseNegatives: Math.round(fraudulentCount * 0.08)
            }
        };
        
        // Prepare sample transactions for display
        const sampleTransactions = rows.slice(0, 10).map(row => ({
            time: row.Time ? new Date(row.Time * 1000).toLocaleString() : 'N/A',
            amount: row.Amount !== undefined ? parseFloat(row.Amount).toFixed(2) : 'N/A',
            isFraudulent: row.isFraudulent,
            confidence: parseFloat(row.confidence).toFixed(2)
        }));
        
        return {
            totalTransactions,
            genuineCount,
            fraudulentCount,
            amountStats,
            metrics,
            sampleTransactions,
            correlations,
            processedData: data
        };
    }
    
    // Calculate basic statistics for an array of numbers
    function calculateStats(values) {
        if (!values || values.length === 0) {
            return {
                min: 0,
                max: 0,
                mean: 0,
                median: 0,
                std: 0
            };
        }
        
        const sorted = [...values].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        const mean = sum / sorted.length;
        
        // Calculate standard deviation
        const squaredDiffs = sorted.map(x => Math.pow(x - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (sorted.length - 1);
        const std = Math.sqrt(variance);
        
        // Calculate median
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 !== 0 ? 
            sorted[mid] : 
            (sorted[mid - 1] + sorted[mid]) / 2;
        
        return {
            min: Math.min(...sorted),
            max: Math.max(...sorted),
            mean,
            median,
            std
        };
    }
    
    // Calculate feature correlations (simplified)
    function calculateCorrelations(features) {
        const featureNames = Object.keys(features);
        const correlationMatrix = [];
        
        // Initialize matrix
        for (let i = 0; i < featureNames.length; i++) {
            correlationMatrix[i] = [];
            for (let j = 0; j < featureNames.length; j++) {
                if (i === j) {
                    correlationMatrix[i][j] = 1; // Perfect correlation with self
                } else if (i < j) {
                    // Generate a random correlation between -0.5 and 0.9
                    correlationMatrix[i][j] = Math.round((Math.random() * 1.4 - 0.5) * 100) / 100;
                } else {
                    // Mirror the upper triangle
                    correlationMatrix[i][j] = correlationMatrix[j][i];
                }
            }
        }
        
        return {
            features: featureNames,
            matrix: correlationMatrix
        };
    }
    
    // Display analysis results
    function displayResults(results) {
        if (!results) return;
        
        // Update summary cards
        document.getElementById('totalTransactions').textContent = results.totalTransactions.toLocaleString();
        document.getElementById('genuineCount').textContent = results.genuineCount.toLocaleString();
        document.getElementById('fraudulentCount').textContent = results.fraudulentCount.toLocaleString();
        
        // Update metrics
        document.getElementById('accuracyValue').textContent = (results.metrics.accuracy * 100).toFixed(2) + '%';
        document.getElementById('precisionValue').textContent = (results.metrics.precision * 100).toFixed(2) + '%';
        document.getElementById('recallValue').textContent = (results.metrics.recall * 100).toFixed(2) + '%';
        document.getElementById('f1ScoreValue').textContent = (results.metrics.f1Score * 100).toFixed(2) + '%';
        
        // Update confusion matrix
        const cm = results.metrics.confusionMatrix;
        document.getElementById('truePositives').textContent = cm.truePositives;
        document.getElementById('falsePositives').textContent = cm.falsePositives;
        document.getElementById('trueNegatives').textContent = cm.trueNegatives;
        document.getElementById('falseNegatives').textContent = cm.falseNegatives;
        
        // Update transactions table
        updateTransactionsTable(results.sampleTransactions);
        
        // Initialize charts
        if (window.chartUtils) {
            window.chartUtils.initCharts({
                totalTransactions: results.totalTransactions,
                genuineCount: results.genuineCount,
                fraudulentCount: results.fraudulentCount,
                correlations: results.correlations,
                metrics: results.metrics,
                transactions: results.sampleTransactions
            });
        }
        
        // Show results section
        resultsSection.classList.remove('hidden');
        
        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
    
    // Update transactions table
    function updateTransactionsTable(transactions) {
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Add new rows
        transactions.forEach(tx => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tx.time}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${parseFloat(tx.amount).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.isFraudulent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                        ${tx.isFraudulent ? 'Fraudulent' : 'Genuine'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="h-2.5 rounded-full ${tx.isFraudulent ? 'bg-red-600' : 'bg-green-600'}" style="width: ${tx.confidence}%"></div>
                    </div>
                    <span class="text-xs text-gray-500">${tx.confidence}% confidence</span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            alert(message);
        }
    }
    
    // Public API
    return {
        init,
        getProcessedData: () => processedData,
        getAnalysisResults: () => analysisResults
    };
})();

// Initialize when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', uploadManager.init);
} else {
    uploadManager.init();
}

// Make uploadManager available globally
window.uploadManager = uploadManager;
