// Chart.js Configuration and Initialization
let classDistributionChart = null;
let amountDistributionChart = null;
let correlationHeatmap = null;

function initCharts(data) {
    if (!data) {
        console.error('No data provided for charts');
        return;
    }
    
    if (document.getElementById('classDistributionChart')) {
        initClassDistributionChart(data);
    }
    
    if (document.getElementById('amountDistributionChart')) {
        initAmountDistributionChart(data);
    }
    
    if (document.getElementById('correlationHeatmap')) {
        initCorrelationHeatmap(data);
    }
}

function initClassDistributionChart(data) {
    const ctx = document.getElementById('classDistributionChart').getContext('2d');
    
    if (classDistributionChart) {
        classDistributionChart.destroy();
    }
    
    const chartData = {
        labels: ['Genuine', 'Fraudulent'],
        datasets: [{
            data: [data.genuineCount || 95, data.fraudulentCount || 5],
            backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: [
                'rgba(16, 185, 129, 1)',
                'rgba(239, 68, 68, 1)'
            ],
            borderWidth: 1,
            hoverOffset: 10
        }]
    };
    
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
                        font: { size: 12 }
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
                }
            },
            cutout: '70%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };
    
    if (typeof Chart !== 'undefined') {
        classDistributionChart = new Chart(ctx, config);
    }
}

function initAmountDistributionChart(data) {
    const ctx = document.getElementById('amountDistributionChart').getContext('2d');
    
    if (amountDistributionChart) {
        amountDistributionChart.destroy();
    }
    
    const amounts = Array(100).fill().map(() => Math.random() * 1000);
    const binCount = 10;
    const maxAmount = Math.max(...amounts);
    const binSize = maxAmount / binCount;
    const bins = Array(binCount).fill(0);
    const labels = [];
    
    for (let i = 0; i < binCount; i++) {
        const start = Math.floor(i * binSize);
        const end = Math.floor((i + 1) * binSize);
        labels.push(`$${start}-${end}`);
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
    
    const config = {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} transactions`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Amount Range ($)' },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Transactions' },
                    ticks: { precision: 0 }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    };
    
    if (typeof Chart !== 'undefined') {
        amountDistributionChart = new Chart(ctx, config);
    }
}

function initCorrelationHeatmap(data) {
    const ctx = document.getElementById('correlationHeatmap').getContext('2d');
    
    if (correlationHeatmap) {
        correlationHeatmap.destroy();
    }
    
    const features = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'];
    const correlationMatrix = [];
    
    for (let i = 0; i < features.length; i++) {
        correlationMatrix[i] = [];
        for (let j = 0; j < features.length; j++) {
            if (i === j) {
                correlationMatrix[i][j] = 1;
            } else if (i < j) {
                correlationMatrix[i][j] = Math.round((Math.random() * 2 - 1) * 100) / 100;
            } else {
                correlationMatrix[i][j] = correlationMatrix[j][i];
            }
        }
    }
    
    const dataPoints = [];
    const backgroundColors = [];
    
    for (let i = 0; i < features.length; i++) {
        for (let j = 0; j < features.length; j++) {
            const value = correlationMatrix[i][j];
            dataPoints.push({ x: j, y: i, v: value });
            
            let color;
            if (value > 0) {
                const intensity = Math.abs(value);
                color = `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
            } else if (value < 0) {
                const intensity = Math.abs(value);
                color = `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
            } else {
                color = 'rgba(156, 163, 175, 0.3)';
            }
            backgroundColors.push(color);
        }
    }
    
    const config = {
        type: 'bar',
        data: {
            labels: features,
            datasets: [{
                label: 'Correlation',
                data: dataPoints,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Feature Correlation Heatmap',
                    font: { size: 14, weight: 'bold' },
                    padding: { bottom: 10 }
                }
            }
        }
    };
    
    if (typeof Chart !== 'undefined') {
        correlationHeatmap = new Chart(ctx, config);
    }
}

window.chartUtils = {
    initCharts,
    initClassDistributionChart,
    initAmountDistributionChart,
    initCorrelationHeatmap
};

