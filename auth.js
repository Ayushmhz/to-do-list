// Authentication Logic
const authOverlay = document.getElementById('auth-overlay');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authError = document.getElementById('auth-error');
const regError = document.getElementById('reg-error');
const regErrorMsg = document.getElementById('reg-error-msg');
const regSuccess = document.getElementById('reg-success');
const userDisplay = document.getElementById('user-display');
const mainApp = document.getElementById('main-app');

const switchToLogin = document.getElementById('switch-to-login');
const switchToSignup = document.getElementById('switch-to-signup');
const logoutBtn = document.getElementById('logout-btn');

// Input fields for clearing errors
const regInputs = [
    document.getElementById('reg-username'),
    document.getElementById('reg-email'),
    document.getElementById('reg-password')
];
const loginInputs = [
    document.getElementById('login-username'),
    document.getElementById('login-password')
];

// State
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Initialize Auth
document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultAdmin();
    checkSession();
});

function initializeDefaultAdmin() {
    try {
        let users = [];
        const rawData = localStorage.getItem('users');
        if (rawData) {
            users = JSON.parse(rawData);
            if (!Array.isArray(users)) users = [];
        }

        const adminExists = users.some(u => u.username.toLowerCase() === 'admin_00');

        if (!adminExists) {
            users.push({
                username: 'Admin_00',
                email: 'admin@system.com',
                password: 'admin123'
            });
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Default admin initialized.');
        }
    } catch (e) {
        console.error('Admin Init Error:', e);
        // Fallback to fresh list with only admin
        localStorage.setItem('users', JSON.stringify([{
            username: 'Admin_00', email: 'admin@system.com', password: 'admin123'
        }]));
    }
}

function checkSession() {
    if (currentUser) {
        document.body.classList.remove('auth-mode');
        mainApp.classList.remove('hidden');
        userDisplay.textContent = `Hello, ${currentUser.username}`;
    } else {
        document.body.classList.add('auth-mode');
        mainApp.classList.add('hidden');
    }
}

// Switch Forms
switchToLogin.addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authTitle.textContent = 'Welcome Back';
    authSubtitle.textContent = 'Enter your credentials to continue';

    // Clear everything
    authError.classList.add('hidden');
    regError.classList.add('hidden');
    regSuccess.classList.add('hidden');
    signupForm.reset();
});

switchToSignup.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    authTitle.textContent = 'Create Account';
    authSubtitle.textContent = 'Join us to manage your tasks efficiently';

    // Clear everything
    authError.classList.add('hidden');
    regError.classList.add('hidden');
    regSuccess.classList.add('hidden');
    loginForm.reset();
});

// Real-time Error Clearing
regInputs.forEach(input => {
    input.addEventListener('input', () => regError.classList.add('hidden'));
});

loginInputs.forEach(input => {
    input.addEventListener('input', () => authError.classList.add('hidden'));
});

// Helper to show errors
function showError(type, message) {
    if (type === 'reg') {
        regErrorMsg.textContent = message;
        regError.classList.remove('hidden');
        regSuccess.classList.add('hidden');
    } else {
        const span = authError.querySelector('span');
        if (span) span.textContent = message;
        authError.classList.remove('hidden');
        regSuccess.classList.add('hidden');
    }
}

// Registration
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    // 1. Basic Empty Check (Backup for 'required' attribute)
    if (!username || !email || !password) {
        showError('reg', 'All fields are required.');
        return;
    }

    // 2. Username Length Validation
    if (username.length < 3) {
        showError('reg', 'Username must be at least 3 characters long.');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];

    // 3. Duplicate Username Check
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        showError('reg', 'Username already exists!');
        return;
    }

    // 4. Duplicate Email Check
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        showError('reg', 'Email already registered!');
        return;
    }

    // Success - No errors
    regError.classList.add('hidden');
    const newUser = { username, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Redirect to Login instead of auto-login
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authTitle.textContent = 'Welcome Back';
    authSubtitle.textContent = 'Please log in with your new account';
    regSuccess.classList.remove('hidden');

    signupForm.reset();
});

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        showError('login', 'Please enter your credentials.');
        return;
    }

    if (loginUser(username, password)) {
        authError.classList.add('hidden');
        regSuccess.classList.add('hidden');
    } else {
        showError('login', 'Access Denied: Invalid username or password');
    }
});

function loginUser(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (user) {
        currentUser = { username: user.username, email: user.email };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        checkSession();
        // Trigger app reload/init
        if (window.initializeAppData) window.initializeAppData();
        return true;
    }
    return false;
}

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    currentUser = null;
    checkSession();
});
// Password Visibility Toggle
document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const targetId = toggle.getAttribute('data-target');
        const input = document.getElementById(targetId);

        if (input.type === 'password') {
            input.type = 'text';
            toggle.classList.remove('fa-eye-slash');
            toggle.classList.add('fa-eye');
        } else {
            input.type = 'password';
            toggle.classList.remove('fa-eye');
            toggle.classList.add('fa-eye-slash');
        }
    });
});

// Password Change Logic
const changePasswordForm = document.getElementById('change-password-form');
const passError = document.getElementById('pass-error');
const passErrorMsg = document.getElementById('pass-error-msg');
const passSuccess = document.getElementById('pass-success');

if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentPass = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;

        const user = JSON.parse(localStorage.getItem('currentUser'));
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.username === user.username);

        if (userIndex === -1) return;

        if (users[userIndex].password !== currentPass) {
            passErrorMsg.textContent = 'Incorrect current password.';
            passError.classList.remove('hidden');
            passSuccess.classList.add('hidden');
            return;
        }

        if (newPass.length < 6) {
            passErrorMsg.textContent = 'New password must be at least 6 characters.';
            passError.classList.remove('hidden');
            passSuccess.classList.add('hidden');
            return;
        }

        // Update password
        users[userIndex].password = newPass;
        localStorage.setItem('users', JSON.stringify(users));

        passError.classList.add('hidden');
        passSuccess.classList.remove('hidden');
        changePasswordForm.reset();

        setTimeout(() => passSuccess.classList.add('hidden'), 3000);
    });
}
