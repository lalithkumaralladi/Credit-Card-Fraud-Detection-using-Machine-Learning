// Main Application Logic

document.addEventListener('DOMContentLoaded', function() {
    // Initialize any third-party libraries or plugins
    initTooltips();
    initModals();
    initSidebar();
    
    // Check authentication status
    checkAuthStatus();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data if needed
    loadInitialData();
});

// Initialize tooltips
function initTooltips() {
    // Initialize any tooltip libraries if needed
    // Example using Tippy.js or similar
    if (typeof tippy !== 'undefined') {
        tippy('[data-tippy-content]');
    }
}

// Initialize modals
function initModals() {
    // This is handled in auth.js, but can be extended here
}

// Initialize sidebar/dashboard navigation
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            sidebar.classList.toggle('transform');
            sidebar.classList.toggle('translate-x-0');
        });
    }
    
    // Add active class to current nav item
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('bg-blue-50', 'text-blue-700');
            link.setAttribute('aria-current', 'page');
        }
    });
}

// Check authentication status
function checkAuthStatus() {
    // This is handled in auth.js
    // We can add additional checks here if needed
}

// Set up event listeners
function setupEventListeners() {
    // Add any additional event listeners here
    
    // Example: Handle theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Example: Handle file download buttons
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', downloadReport);
    }
    
    const downloadProcessedCsvBtn = document.getElementById('downloadProcessedCsvBtn');
    if (downloadProcessedCsvBtn) {
        downloadProcessedCsvBtn.addEventListener('click', downloadProcessedCsv);
    }
    
    // Handle pagination
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    if (prevPageBtn) prevPageBtn.addEventListener('click', goToPrevPage);
    if (nextPageBtn) nextPageBtn.addEventListener('click', goToNextPage);
}

// Toggle between light and dark theme
function toggleTheme() {
    const html = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
}

// Check for saved user preference for theme
function checkThemePreference() {
    const theme = localStorage.getItem('theme') || 'light';
    const themeToggle = document.getElementById('themeToggle');
    
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    } else {
        document.documentElement.classList.remove('dark');
        if (themeToggle) {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
}

// Download report as PDF
function downloadReport() {
    // Show loading state
    const downloadBtn = document.getElementById('downloadReportBtn');
    const originalText = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Preparing Report...';
    
    // In a real app, this would generate a PDF report
    setTimeout(() => {
        // Create a sample report
        const reportContent = {
            title: 'Credit Card Fraud Detection Report',
            date: new Date().toLocaleDateString(),
            totalTransactions: document.getElementById('totalTransactions').textContent,
            fraudulentCount: document.getElementById('fraudulentCount').textContent,
            genuineCount: document.getElementById('genuineCount').textContent,
            // Add more data as needed
        };
        
        // Create a download link for the report
        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportContent, null, 2))}`;
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', `fraud-detection-report-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        // Reset button
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalText;
        
        // Show success message
        showToast('Report downloaded successfully!', 'success');
    }, 1500);
}

// Download processed CSV
function downloadProcessedCsv() {
    const downloadBtn = document.getElementById('downloadProcessedCsvBtn');
    const originalText = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Preparing CSV...';
    
    // In a real app, this would generate a CSV from the processed data
    setTimeout(() => {
        // Sample CSV data (replace with actual data)
        const headers = ['Time', 'Amount', 'Is Fraudulent', 'Confidence'];
        const rows = [
            ['2023-01-01 12:00:00', '125.50', 'No', '92.5%'],
            ['2023-01-01 12:05:30', '2499.99', 'Yes', '87.3%'],
            // Add more sample data
        ];
        
        // Convert to CSV
        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.join(',') + '\n';
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `processed-transactions-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Reset button
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalText;
        
        // Show success message
        showToast('CSV downloaded successfully!', 'success');
    }, 1000);
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'fixed bottom-4 right-4 z-50 space-y-2';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `flex items-center p-4 w-full max-w-xs text-gray-500 bg-white rounded-lg shadow-lg border-l-4 ${getToastBorderColor(type)}`;
    toast.role = 'alert';
    
    // Add icon based on type
    const iconClass = getToastIcon(type);
    toast.innerHTML = `
        <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${getToastTextColor(type)} rounded-lg">
            <i class="${iconClass}"></i>
        </div>
        <div class="ml-3 text-sm font-normal">${message}</div>
        <button type="button" class="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8" data-dismiss-target="#toast-default" aria-label="Close">
            <span class="sr-only">Close</span>
            <i class="fas fa-times w-4 h-4"></i>
        </button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
            toast.remove();
            
            // Remove container if no more toasts
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    }, 5000);
    
    // Add click handler to close button
    const closeButton = toast.querySelector('button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            toast.remove();
            
            // Remove container if no more toasts
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        });
    }
}

// Helper function to get toast border color based on type
function getToastBorderColor(type) {
    switch (type) {
        case 'success':
            return 'border-green-500';
        case 'error':
            return 'border-red-500';
        case 'warning':
            return 'border-yellow-500';
        case 'info':
        default:
            return 'border-blue-500';
    }
}

// Helper function to get toast text color based on type
function getToastTextColor(type) {
    switch (type) {
        case 'success':
            return 'text-green-500';
        case 'error':
            return 'text-red-500';
        case 'warning':
            return 'text-yellow-500';
        case 'info':
        default:
            return 'text-blue-500';
    }
}

// Helper function to get toast icon based on type
function getToastIcon(type) {
    switch (type) {
        case 'success':
            return 'fas fa-check-circle text-xl';
        case 'error':
            return 'fas fa-exclamation-circle text-xl';
        case 'warning':
            return 'fas fa-exclamation-triangle text-xl';
        case 'info':
        default:
            return 'fas fa-info-circle text-xl';
    }
}

// Pagination functions
let currentPage = 1;
const itemsPerPage = 10;

getCurrentPageItems = () => {
    // In a real app, this would fetch the current page of items from your data
    // For now, we'll return a sample array
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Sample data - replace with actual data from your application
    const allItems = Array(100).fill().map((_, i) => ({
        id: i + 1,
        time: `2023-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${String(i % 24).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}:00`,
        amount: (Math.random() * 1000).toFixed(2),
        isFraudulent: Math.random() > 0.8,
        confidence: (Math.random() * 100).toFixed(2)
    }));
    
    return {
        items: allItems.slice(startIndex, endIndex),
        total: allItems.length
    };
};

updatePagination = () => {
    const { items, total } = getCurrentPageItems();
    const totalPages = Math.ceil(total / itemsPerPage);
    
    // Update pagination info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, total);
    
    document.getElementById('startItem').textContent = startItem;
    document.getElementById('endItem').textContent = endItem;
    document.getElementById('totalItems').textContent = total;
    
    // Update pagination buttons
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
    
    // Update table with current page items
    updateTable(items);
};

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
    }
}

function goToNextPage() {
    const { total } = getCurrentPageItems();
    const totalPages = Math.ceil(total / itemsPerPage);
    
    if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
    }
}

function updateTable(items) {
    const tbody = document.getElementById('transactionsTableBody');
    
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Add new rows
    items.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.time}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${item.amount}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isFraudulent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                    ${item.isFraudulent ? 'Fraudulent' : 'Genuine'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${item.confidence}%"></div>
                </div>
                <span class="text-xs text-gray-500">${item.confidence}% confidence</span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load initial data
function loadInitialData() {
    // Check for saved theme preference
    checkThemePreference();
    
    // Initialize pagination if on dashboard
    if (document.getElementById('dashboard')) {
        updatePagination();
    }
}

// Export functions that need to be accessible from other files
window.app = {
    showToast,
    updatePagination,
    goToPrevPage,
    goToNextPage
};

// Make sure the DOM is fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // DOM is ready, app.js is already handling initialization
    });
} else {
    // DOM is already ready
}

