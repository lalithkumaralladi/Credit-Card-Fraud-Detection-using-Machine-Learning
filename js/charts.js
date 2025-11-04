// Chart.js Configuration and Initialization

// Global chart instances
let classDistributionChart = null;
let amountDistributionChart = null;
let correlationHeatmap = null;
let precisionRecallChart = null;

// Initialize all charts
function initCharts(data) {
    if (!data) {
        console.error('No data provided for charts');
        return;
    }
    
    // Initialize charts if their containers exist
    if (document.getElementById('classDistributionChart')) {
        initClassDistributionChart(data);
    }
    
    if (document.getElementById('amountDistributionChart')) {
        initAmountDistributionChart(data);
    }
    
    if (document.getElementById('correlationHeatmap')) {
        initCorrelationHeatmap(data);
    }
    
    if (document.getElementById('precisionRecallChart')) {
        initPrecisionRecallChart(data);
    }
}

// Initialize Class Distribution Chart (Pie/Donut)
function initClassDistributionChart(data) {
    const ctx = document.getElementById('classDistributionChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (classDistributionChart) {
        classDistributionChart.destroy();
    }
    
    // Sample data - replace with actual data from your application
    const chartData = {
        labels: ['Genuine', 'Fraudulent'],
        datasets: [{
            data: [data.genuineCount || 95, data.fraudulentCount || 5],
            backgroundColor: [
                'rgba(16, 185, 129, 0.8)', // Green for genuine
                'rgba(239, 68, 68, 0.8)'   // Red for fraudulent
            ],
            borderColor: [
                'rgba(16, 185, 129, 1)',
                'rgba(239, 68, 68, 1)'
            ],
            borderWidth: 1,
            hoverOffset: 10
        }]
    };
    
    // Chart configuration
    const config = {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Transaction Class Distribution',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 10
                    }
                }
            },
            cutout: '70%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };
    
    // Create the chart
    classDistributionChart = new Chart(ctx, config);
}

// Initialize Amount Distribution Chart (Histogram)
function initAmountDistributionChart(data) {
    const ctx = document.getElementById('amountDistributionChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (amountDistributionChart) {
        amountDistributionChart.destroy();
    }
    
    // Sample data - replace with actual data from your application
    const amounts = Array(100).fill().map(() => Math.random() * 1000);
    
    // Create bins for the histogram
    const binCount = 10;
    const maxAmount = Math.max(...amounts);
    const binSize = maxAmount / binCount;
    
    const bins = Array(binCount).fill(0);
    const labels = [];
    
    for (let i = 0; i < binCount; i++) {
        const start = Math.floor(i * binSize);
        const end = Math.floor((i + 1) * binSize);
        labels.push(`$${start}-${end}`);
        
        // Count values in this bin
        bins[i] = amounts.filter(amount => amount >= start && amount < end).length;
    }
    
    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Number of Transactions',
            data: bins,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.9,
            categoryPercentage: 0.8
        }]
    };
    
    // Chart configuration
    const config = {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} transactions`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Transaction Amount Distribution',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 10
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Amount Range ($)'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Transactions'
                    },
                    ticks: {
                        precision: 0
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    };
    
    // Create the chart
    amountDistributionChart = new Chart(ctx, config);
}

// Initialize Correlation Heatmap
function initCorrelationHeatmap(data) {
    const ctx = document.getElementById('correlationHeatmap').getContext('2d');
    
    // Destroy existing chart if it exists
    if (correlationHeatmap) {
        correlationHeatmap.destroy();
    }
    
    // Sample correlation matrix - replace with actual data from your application
    const features = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'];
    const correlationMatrix = [];
    
    // Generate a sample correlation matrix
    for (let i = 0; i < features.length; i++) {
        correlationMatrix[i] = [];
        for (let j = 0; j < features.length; j++) {
            if (i === j) {
                correlationMatrix[i][j] = 1; // Perfect correlation with self
            } else if (i < j) {
                // Generate a random correlation between -1 and 1
                correlationMatrix[i][j] = Math.round((Math.random() * 2 - 1) * 100) / 100;
            } else {
                // Mirror the upper triangle
                correlationMatrix[i][j] = correlationMatrix[j][i];
            }
        }
    }
    
    // Chart configuration
    const config = {
        type: 'matrix',
        data: {
            datasets: [{
                data: [],
                backgroundColor: [],
                                borderWidth: 1,
                borderColor: '#fff',
                width: ({ chart }) => (chart.chartArea.width / features.length) * 0.95,
                height: ({ chart }) => (chart.chartArea.height / features.length) * 0.95
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const row = context[0].row;
                            const column = context[0].column;
                            return `${features[row]} & ${features[column]}`;
                        },
                        label: function(context) {
                            const value = context.raw.v;
                            return `Correlation: ${value}`;
                        }
                    }
                },
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Feature Correlation Heatmap',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 10
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    labels: features,
                    offset: true,
                    ticks: {
                        display: true
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    type: 'category',
                    labels: [...features].reverse(),
                    offset: true,
                    ticks: {
                        display: true
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            }
        }
    };
    
    // Generate data for the heatmap
    const dataPoints = [];
    const backgroundColors = [];
    
    for (let i = 0; i < features.length; i++) {
        for (let j = 0; j < features.length; j++) {
            const value = correlationMatrix[i][j];
            
            dataPoints.push({
                x: j,
                y: i,
                v: value
            });
            
            // Color based on correlation value
            let color;
            if (value > 0) {
                // Positive correlation (green)
                const intensity = Math.abs(value);
                color = `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`; // Green with opacity
            } else if (value < 0) {
                // Negative correlation (red)
                const intensity = Math.abs(value);
                color = `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`; // Red with opacity
            } else {
                // Zero correlation (gray)
                color = 'rgba(156, 163, 175, 0.3)';
            }
            
            backgroundColors.push(color);
        }
    }
    
    // Update chart data
    config.data.datasets[0].data = dataPoints;
    config.data.datasets[0].backgroundColor = backgroundColors;
    
    // Create the chart
    correlationHeatmap = new Chart(ctx, config);
}

// Initialize Precision-Recall Curve
function initPrecisionRecallChart(data) {
    const ctx = document.getElementById('precisionRecallChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (precisionRecallChart) {
        precisionRecallChart.destroy();
    }
    
    // Sample precision-recall data - replace with actual data from your model
    const precision = [0.95, 0.94, 0.93, 0.92, 0.91, 0.90, 0.89, 0.88, 0.87, 0.86];
    const recall = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    
    // Calculate F1 score for each point
    const f1Scores = precision.map((p, i) => (2 * p * recall[i]) / (p + recall[i]));
    
    const chartData = {
        labels: recall.map((r, i) => `Recall: ${r.toFixed(1)}`),
        datasets: [
            {
                label: 'Precision',
                data: precision,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                yAxisID: 'y'
            },
            {
                label: 'F1 Score',
                data: f1Scores,
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                yAxisID: 'y'
            }
        ]
    };
    
    // Chart configuration
    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20
                    }
                },
                title: {
                    display: true,
                    text: 'Precision-Recall Curve',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 0.9,
                            yMax: 0.9,
                            borderColor: 'rgba(239, 68, 68, 0.5)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            label: {
                                content: 'High Precision',
                                enabled: true,
                                position: 'left',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)'
                            }
                        },
                        line2: {
                            type: 'line',
                            xMin: 0.8,
                            xMax: 0.8,
                            borderColor: 'rgba(59, 130, 246, 0.5)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            label: {
                                content: 'High Recall',
                                enabled: true,
                                position: 'bottom',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)'
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Recall'
                    },
                    min: 0,
                    max: 1,
                    ticks: {
                        stepSize: 0.1
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Score'
                    },
                    min: 0,
                    max: 1,
                    ticks: {
                        stepSize: 0.1
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    };
    
    // Create the chart
    precisionRecallChart = new Chart(ctx, config);
}

// Export functions that need to be accessible from other files
window.chartUtils = {
    initCharts,
    initClassDistributionChart,
    initAmountDistributionChart,
    initCorrelationHeatmap,
    initPrecisionRecallChart
};

// Initialize charts when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize charts if data is available
        if (window.chartData) {
            initCharts(window.chartData);
        }
    });
} else {
    // DOM is already ready
    if (window.chartData) {
        initCharts(window.chartData);
    }
}
