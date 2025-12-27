/**
 * Authentication Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Check if already logged in
    let session = null;
    try {
        session = JSON.parse(localStorage.getItem('sms_session'));
    } catch (e) {
        console.warn('LocalStorage access error:', e);
    }

    // Workaround for Chrome/Edge 'file://' protocol where localStorage is not shared between pages
    // Also handles cases where localStorage might be cleared or inaccessible
    if (!session && (window.location.protocol === 'file:' || window.location.hostname === '')) {
        console.log('Running on local file system. Auto-creating demo session.');
        const user = { id: 1, name: 'Admin User', email: 'admin@school.com', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Admin+User' };
        session = {
            token: 'mock-jwt-token-demo',
            user: user,
            expiry: Date.now() + 3600000 * 24 // 24 hours
        };
        try {
            localStorage.setItem('sms_session', JSON.stringify(session));
        } catch (e) {
            console.warn('Could not save session to localStorage:', e);
        }
    }

    if (session && session.expiry > Date.now()) {
        if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/') && !window.location.pathname.includes('dashboard.html')) {
            // Only redirect to dashboard if we are strictly on login page
            // The previous check was a bit loose with '/'
            if (document.getElementById('loginForm')) {
                window.location.href = 'dashboard.html';
            }
        }
    } else {
        // Clear expired session
        localStorage.removeItem('sms_session');
        // Redirect to login if on protected page
        if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
            // If on file protocol, do NOT redirect, just let the auto-login above handle it (or fail gracefully)
            // This prevents the "logout loop" when navigating between files
            if (window.location.protocol !== 'file:' && window.location.hostname !== '') {
                window.location.href = 'index.html';
            }
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerText;

            try {
                btn.disabled = true;
                btn.innerText = 'Signing in...';

         

                const response = await API.login(email, password);

                if (response.success) {
                    Utils.showToast('Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            } catch (error) {
                Utils.showToast(error.message || 'Login failed', 'error');
                btn.disabled = false;
                btn.innerText = originalText;
            }
        });
    }
});

function logout() {
    API.logout().then(() => {
        window.location.href = 'index.html';
    });
}
