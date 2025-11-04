// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const showRegisterForm = document.getElementById('showRegisterForm');
const showLoginForm = document.getElementById('showLoginForm');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const googleLogin = document.getElementById('googleLogin');

// Show/Hide Modals
const showModal = (modal) => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

const hideModal = (modal) => {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
};

// Event Listeners
if (loginBtn) loginBtn.addEventListener('click', () => showModal(loginModal));
if (registerBtn) registerBtn.addEventListener('click', () => showModal(registerModal));
if (closeLoginModal) closeLoginModal.addEventListener('click', () => hideModal(loginModal));
if (closeRegisterModal) closeRegisterModal.addEventListener('click', () => hideModal(registerModal));
if (showRegisterForm) showRegisterForm.addEventListener('click', () => {
    hideModal(loginModal);
    showModal(registerModal);
});
if (showLoginForm) showLoginForm.addEventListener('click', () => {
    hideModal(registerModal);
    showModal(loginModal);
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) hideModal(loginModal);
    if (e.target === registerModal) hideModal(registerModal);
});

// Form Submission: Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log('User logged in:', user);
            hideModal(loginModal);
            showDashboard();
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message);
        }
    });
}

// Form Submission: Register
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            await db.collection('users').doc(user.uid).set({
                firstName,
                lastName,
                email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('User registered:', user);
            hideModal(registerModal);
            showDashboard();
        } catch (error) {
            console.error('Registration error:', error);
            alert(error.message);
        }
    });
}

// Google Sign In
if (googleLogin) {
    googleLogin.addEventListener('click', async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        try {
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if user is new
            if (result.additionalUserInfo.isNewUser) {
                const name = user.displayName.split(' ');
                await db.collection('users').doc(user.uid).set({
                    firstName: name[0],
                    lastName: name.length > 1 ? name.slice(1).join(' ') : '',
                    email: user.email,
                    photoURL: user.photoURL,
                    provider: 'google',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Update last login time
                await db.collection('users').doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            console.log('Google sign in successful:', user);
            hideModal(loginModal);
            showDashboard();
        } catch (error) {
            console.error('Google sign in error:', error);
            alert(error.message);
        }
    });
}

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user);
        updateUIForAuth(user);
        // Redirect to dashboard if not already there
        if (!window.location.href.includes('dashboard.html')) {
            // showDashboard();
        }
    } else {
        // User is signed out
        console.log('User is signed out');
        updateUIForUnauth();
        // If not on the home page, redirect to home
        if (window.location.pathname !== '/') {
            // window.location.href = '/';
        }
    }
});

// Update UI based on auth state
function updateUIForAuth(user) {
    // Hide login/register buttons
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    
    // Show user profile and logout button
    const userNav = document.createElement('div');
    userNav.className = 'flex items-center space-x-4';
    userNav.innerHTML = `
        <div class="relative group">
            <button class="flex items-center space-x-2 focus:outline-none">
                <img src="${user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" 
                     alt="Profile" 
                     class="w-8 h-8 rounded-full border-2 border-white">
                <span class="text-white font-medium">${user.displayName || 'User'}</span>
                <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                <div class="border-t border-gray-100 my-1"></div>
                <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Sign out</a>
            </div>
        </div>
    `;
    
    const navContainer = document.querySelector('nav .hidden.md\:flex');
    if (navContainer) {
        // Remove existing user nav if it exists
        const existingUserNav = document.querySelector('.user-nav');
        if (existingUserNav) {
            navContainer.removeChild(existingUserNav);
        }
        
        // Add new user nav
        userNav.classList.add('user-nav');
        navContainer.appendChild(userNav);
        
        // Add logout event listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                auth.signOut().then(() => {
                    console.log('User signed out');
                }).catch((error) => {
                    console.error('Sign out error:', error);
                });
            });
        }
    }
}

function updateUIForUnauth() {
    // Show login/register buttons
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    
    // Remove user nav if it exists
    const userNav = document.querySelector('.user-nav');
    if (userNav) {
        userNav.remove();
    }
}

// Show dashboard function
function showDashboard() {
    // Hide hero section and show dashboard
    const heroSection = document.getElementById('hero');
    const dashboardSection = document.getElementById('dashboard');
    const aboutSection = document.getElementById('about');
    
    if (heroSection) heroSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');
    if (aboutSection) aboutSection.classList.add('hidden');
    
    // Update active nav link
    updateActiveNav('dashboardLink');
    
    // Initialize dashboard components
    initFileUpload();
}

// Update active navigation link
function updateActiveNav(activeId) {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.classList.remove('bg-blue-500', 'text-white');
        if (link.id === activeId) {
            link.classList.add('bg-blue-500', 'text-white');
        }
    });
}

// Initialize file upload functionality
function initFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFile = document.getElementById('removeFile');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    let currentFile = null;
    
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
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    // Handle file input change
    if (fileInput) {
        fileInput.addEventListener('change', handleFiles, false);
    }
    
    // Remove file
    if (removeFile) {
        removeFile.addEventListener('click', () => {
            resetFileInput();
        });
    }
    
    // Analyze button click
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeData);
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropZone.classList.add('border-blue-500', 'bg-blue-50');
    }
    
    function unhighlight() {
        dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files } });
    }
    
    function handleFiles(e) {
        const files = e.target.files;
        
        if (files.length > 0) {
            const file = files[0];
            
            // Check if file is CSV
            if (!file.name.endsWith('.csv')) {
                alert('Please upload a CSV file.');
                return;
            }
            
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File is too large. Maximum size is 10MB.');
                return;
            }
            
            currentFile = file;
            
            // Update UI
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            fileInfo.classList.remove('hidden');
            
            // Reset file input to allow re-uploading the same file
            fileInput.value = '';
        }
    }
    
    function resetFileInput() {
        currentFile = null;
        fileInput.value = '';
        fileInfo.classList.add('hidden');
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    async function analyzeData() {
        if (!currentFile) {
            alert('Please select a file to analyze.');
            return;
        }
        
        try {
            // Show loading state
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Analyzing...';
            
            // Simulate API call (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // For demo purposes, we'll use sample data
            const sampleData = {
                totalTransactions: 1000,
                fraudulentCount: 50,
                genuineCount: 950,
                transactions: Array(10).fill().map((_, i) => ({
                    time: `2023-${String(i+1).padStart(2, '0')}-01 12:00:00`,
                    amount: (Math.random() * 1000).toFixed(2),
                    isFraudulent: Math.random() > 0.7,
                    confidence: (Math.random() * 100).toFixed(2)
                }))
            };
            
            // Update UI with results
            updateResults(sampleData);
            
            // Show results section
            document.getElementById('resultsSection').classList.remove('hidden');
            
            // Scroll to results
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error analyzing data:', error);
            alert('An error occurred while analyzing the data. Please try again.');
        } finally {
            // Reset button state
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analyze Transactions';
        }
    }
    
    function updateResults(data) {
        // Update summary cards
        document.getElementById('totalTransactions').textContent = data.totalTransactions.toLocaleString();
        document.getElementById('fraudulentCount').textContent = data.fraudulentCount.toLocaleString();
        document.getElementById('genuineCount').textContent = data.genuineCount.toLocaleString();
        
        // Update transactions table
        const tbody = document.getElementById('transactionsTableBody');
        tbody.innerHTML = '';
        
        data.transactions.forEach(tx => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tx.time}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${tx.amount}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.isFraudulent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                        ${tx.isFraudulent ? 'Fraudulent' : 'Genuine'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${tx.confidence}%"></div>
                    </div>
                    <span class="text-xs text-gray-500">${tx.confidence}% confidence</span>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Initialize charts (will be implemented in charts.js)
        initCharts(data);
    }
}

// Navigation links
document.addEventListener('DOMContentLoaded', () => {
    // Home link
    const homeLink = document.getElementById('homeLink');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            const heroSection = document.getElementById('hero');
            const dashboardSection = document.getElementById('dashboard');
            const aboutSection = document.getElementById('about');
            
            if (heroSection) heroSection.classList.remove('hidden');
            if (dashboardSection) dashboardSection.classList.add('hidden');
            if (aboutSection) aboutSection.classList.add('hidden');
            
            updateActiveNav('homeLink');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Dashboard link
    const dashboardLink = document.getElementById('dashboardLink');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            showDashboard();
        });
    }
    
    // About link
    const aboutLink = document.getElementById('aboutLink');
    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            const heroSection = document.getElementById('hero');
            const dashboardSection = document.getElementById('dashboard');
            const aboutSection = document.getElementById('about');
            
            if (heroSection) heroSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.add('hidden');
            if (aboutSection) aboutSection.classList.remove('hidden');
            
            updateActiveNav('aboutLink');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Get Started button in hero section
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            // If user is logged in, show dashboard, else show login modal
            if (auth.currentUser) {
                showDashboard();
            } else {
                showModal(loginModal);
            }
        });
    }
    
    // Get Started button in about section
    const getStartedAboutBtn = document.getElementById('getStartedAboutBtn');
    if (getStartedAboutBtn) {
        getStartedAboutBtn.addEventListener('click', () => {
            // If user is logged in, show dashboard, else show register modal
            if (auth.currentUser) {
                showDashboard();
            } else {
                showModal(registerModal);
            }
        });
    }
    
    // Check if user is on dashboard page
    if (window.location.pathname.includes('dashboard') || window.location.hash === '#dashboard') {
        // Check auth state
        auth.onAuthStateChanged((user) => {
            if (user) {
                showDashboard();
            } else {
                // Redirect to home if not authenticated
                window.location.href = '/';
            }
        });
    }
});
