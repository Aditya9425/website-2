// Admin Panel Configuration
console.log('🔧 Loading admin config...');

// Simple admin authentication
window.firebaseServices = {
    auth: {
        signInWithEmailAndPassword: async (email, password) => {
            console.log('🔐 Attempting login with:', email);
            // Simple admin check
            if (email === 'admin@shagunsaree.com' && password === 'admin123') {
                const user = { email: email, uid: 'admin-user' };
                console.log('✅ Login successful for:', email);
                // Store login state
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminEmail', email);
                return Promise.resolve({ user });
            } else {
                console.log('❌ Invalid credentials for:', email);
                throw new Error('Invalid email or password');
            }
        },
        signOut: async () => {
            console.log('🚪 Signing out...');
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminEmail');
            return Promise.resolve();
        },
        getCurrentUser: () => {
            const isLoggedIn = localStorage.getItem('adminLoggedIn');
            const email = localStorage.getItem('adminEmail');
            if (isLoggedIn === 'true' && email) {
                return { email: email, uid: 'admin-user' };
            }
            return null;
        }
    }
};

console.log('✅ Admin config loaded successfully');