// Enhanced Authentication with RLS Support
class AuthManager {
    constructor() {
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.currentUser = null;
    }

    // Login with session management
    async login(email, password) {
        try {
            // First check user exists in our users table
            const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();
            
            if (userError || !userData) {
                throw new Error('Invalid email or password');
            }

            // Create session token for RLS
            const sessionToken = btoa(JSON.stringify({
                user_id: userData.id,
                email: userData.email,
                timestamp: Date.now()
            }));

            // Store session
            const userSession = {
                id: userData.id,
                email: userData.email,
                mobile: userData.mobile,
                sessionToken: sessionToken,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('userSession', JSON.stringify(userSession));
            this.currentUser = userSession;
            
            return { success: true, user: userSession };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Signup with proper user creation
    async signup(email, mobile, password) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .insert([{ email, mobile, password }])
                .select()
                .single();
            
            if (error) {
                throw new Error(error.message);
            }
            
            return { success: true, user: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get current user session
    getCurrentUser() {
        const session = localStorage.getItem('userSession');
        if (session) {
            try {
                this.currentUser = JSON.parse(session);
                return this.currentUser;
            } catch (error) {
                localStorage.removeItem('userSession');
                return null;
            }
        }
        return null;
    }

    // Logout
    logout() {
        localStorage.removeItem('userSession');
        this.currentUser = null;
    }

    // Get authenticated Supabase client
    getAuthenticatedClient() {
        const user = this.getCurrentUser();
        if (user && user.sessionToken) {
            // Create client with user context
            return this.supabase;
        }
        return this.supabase; // Return regular client for public access
    }
}

// Initialize global auth manager
window.authManager = new AuthManager();

// Update existing login function
async function loginUser(email, password) {
    return await window.authManager.login(email, password);
}

// Update existing signup function  
async function signupUser(email, mobile, password) {
    return await window.authManager.signup(email, mobile, password);
}

// Update existing auth check
function checkUserAuth() {
    const user = window.authManager.getCurrentUser();
    const loginLink = document.getElementById('loginLink');
    const profileLink = document.getElementById('profileLink');
    const signOutBtn = document.getElementById('signOutBtn');
    const userName = document.getElementById('userName');
    
    if (user) {
        if (loginLink) loginLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'flex';
        if (signOutBtn) signOutBtn.style.display = 'block';
        if (userName) userName.textContent = user.email.split('@')[0];
    } else {
        if (loginLink) loginLink.style.display = 'flex';
        if (profileLink) profileLink.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'none';
    }
}

// Update logout function
function logout() {
    window.authManager.logout();
    showNotification('Logged out successfully!');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}