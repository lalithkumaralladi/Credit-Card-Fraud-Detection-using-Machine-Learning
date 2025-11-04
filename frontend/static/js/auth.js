// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAAAl3Twr4VNZwBZw3lJFGsVqwHI6dnY0w",
    authDomain: "bank-management-system-b6ff4.firebaseapp.com",
    projectId: "bank-management-system-b6ff4",
    storageBucket: "bank-management-system-b6ff4.appspot.com",
    messagingSenderId: "1050913410699",
    appId: "1:1050913410699:web:bank-management-system-b6ff4"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

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
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
};

const hideModal = (modal) => {
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
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
    if (loginModal && e.target === loginModal) hideModal(loginModal);
    if (registerModal && e.target === registerModal) hideModal(registerModal);
});

// Form Submission: Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (auth) {
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                console.log('User logged in:', user);
                hideModal(loginModal);
                if (typeof showDashboard === 'function') showDashboard();
            } catch (error) {
                console.error('Login error:', error);
                alert(error.message);
            }
        } else {
            alert('Firebase not configured. Please configure Firebase credentials.');
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
        
        if (auth && db) {
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                await db.collection('users').doc(user.uid).set({
                    firstName,
                    lastName,
                    email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('User registered:', user);
                hideModal(registerModal);
                if (typeof showDashboard === 'function') showDashboard();
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message);
            }
        } else {
            alert('Firebase not configured. Please configure Firebase credentials.');
        }
    });
}

// Google Sign In
if (googleLogin && auth) {
    googleLogin.addEventListener('click', async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        try {
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            if (result.additionalUserInfo.isNewUser && db) {
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
            } else if (db) {
                await db.collection('users').doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            console.log('Google sign in successful:', user);
            hideModal(loginModal);
            if (typeof showDashboard === 'function') showDashboard();
        } catch (error) {
            console.error('Google sign in error:', error);
            alert(error.message);
        }
    });
}

// Auth State Observer
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User is signed in:', user);
            updateUIForAuth(user);
        } else {
            console.log('User is signed out');
            updateUIForUnauth();
        }
    });
}

// Update UI based on auth state
function updateUIForAuth(user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    
    const navContainer = document.querySelector('nav .hidden.md\\:flex');
    if (navContainer) {
        const existingUserNav = document.querySelector('.user-nav');
        if (existingUserNav) {
            existingUserNav.remove();
        }
        
        const userNav = document.createElement('div');
        userNav.className = 'flex items-center space-x-4 user-nav';
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
                    <a href="#" id="navProfileBtn" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                    <div class="border-t border-gray-100 my-1"></div>
                    <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Sign out</a>
                </div>
            </div>
        `;
        navContainer.appendChild(userNav);
        
        // Profile modal open handler
        const navProfileBtn = document.getElementById('navProfileBtn');
        if (navProfileBtn) {
            navProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const profileModal = document.getElementById('profileModal');
                if (profileModal) {
                    const nameEl = document.getElementById('profileName');
                    const emailEl = document.getElementById('profileEmail');
                    const avatarEl = document.getElementById('profileAvatar');
                    if (nameEl) nameEl.textContent = user.displayName || 'User';
                    if (emailEl) emailEl.textContent = user.email || '';
                    if (avatarEl) avatarEl.src = user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                    profileModal.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                }
            });
        }

        // Profile modal close handler
        const closeProfileModal = document.getElementById('closeProfileModal');
        if (closeProfileModal) {
            closeProfileModal.addEventListener('click', () => {
                const profileModal = document.getElementById('profileModal');
                if (profileModal) {
                    profileModal.classList.add('hidden');
                    document.body.style.overflow = 'auto';
                }
            });
        }
        const closeProfileModal2 = document.getElementById('closeProfileModal2');
        if (closeProfileModal2) {
            closeProfileModal2.addEventListener('click', () => {
                const profileModal = document.getElementById('profileModal');
                if (profileModal) {
                    profileModal.classList.add('hidden');
                    document.body.style.overflow = 'auto';
                }
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && auth) {
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
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    
    const userNav = document.querySelector('.user-nav');
    if (userNav) {
        userNav.remove();
    }
}

// Show dashboard function
function showDashboard() {
    const heroSection = document.getElementById('hero');
    const dashboardSection = document.getElementById('dashboard');
    const aboutSection = document.getElementById('about');
    
    if (heroSection) heroSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');
    if (aboutSection) aboutSection.classList.add('hidden');
    
    updateActiveNav('dashboardLink');
    
    if (typeof initFileUpload === 'function') {
        initFileUpload();
    }
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

// Navigation links
document.addEventListener('DOMContentLoaded', () => {
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
    
    const dashboardLink = document.getElementById('dashboardLink');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            showDashboard();
        });
    }
    
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
    
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            if (auth && auth.currentUser) {
                showDashboard();
            } else {
                showModal(loginModal);
            }
        });
    }
    
    const getStartedAboutBtn = document.getElementById('getStartedAboutBtn');
    if (getStartedAboutBtn) {
        getStartedAboutBtn.addEventListener('click', () => {
            if (auth && auth.currentUser) {
                showDashboard();
            } else {
                showModal(registerModal);
            }
        });
    }
    
    // Profile button in nav (always visible on Home)
    const profileNavBtn = document.getElementById('profileNavBtn');
    if (profileNavBtn) {
        profileNavBtn.addEventListener('click', () => {
            if (auth && auth.currentUser) {
                const user = auth.currentUser;
                const profileModal = document.getElementById('profileModal');
                if (profileModal) {
                    const nameEl = document.getElementById('profileName');
                    const emailEl = document.getElementById('profileEmail');
                    const avatarEl = document.getElementById('profileAvatar');
                    if (nameEl) nameEl.textContent = user.displayName || 'User';
                    if (emailEl) emailEl.textContent = user.email || '';
                    if (avatarEl) avatarEl.src = user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                    profileModal.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                }
            } else {
                // Prompt login if not authenticated
                showModal(loginModal);
            }
        });
    }
});

