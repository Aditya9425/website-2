// Supabase Configuration
const SUPABASE_URL = 'https://jstvadizuzvwhabtfhfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdHZhZGl6dXp2d2hhYnRmaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjI3NjAsImV4cCI6MjA3MjIzODc2MH0.6btNpJfUh6Fd5PfoivIvu-f31Fj5IXl1vxBLsHz5ISw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Switch between login and signup tabs
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        tabs[1].classList.add('active');
    }
    
    // Clear messages
    clearMessages();
}

// Clear error and success messages
function clearMessages() {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginSuccess').style.display = 'none';
    document.getElementById('signupError').style.display = 'none';
    document.getElementById('signupSuccess').style.display = 'none';
}

// Show error message
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

// Show success message
function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();
    clearMessages();
    
    const email = document.getElementById('signupEmail').value;
    const mobile = document.getElementById('signupMobile').value;
    const password = document.getElementById('signupPassword').value;
    const signupBtn = document.getElementById('signupBtn');
    
    // Validate mobile number
    if (!/^[0-9]{10}$/.test(mobile)) {
        showError('signupError', 'Please enter a valid 10-digit mobile number');
        return;
    }
    
    signupBtn.disabled = true;
    signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    
    try {
        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('email, mobile')
            .or(`email.eq.${email},mobile.eq.${mobile}`)
            .single();
            
        if (existingUser) {
            if (existingUser.email === email) {
                showError('signupError', 'Email already registered. Please login or use a different email.');
            } else {
                showError('signupError', 'Mobile number already registered. Please login or use a different number.');
            }
            return;
        }
        
        // Insert new user
        const { data, error } = await supabase
            .from('users')
            .insert([{
                email: email,
                mobile: mobile,
                password: password, // In production, hash this password
                created_at: new Date().toISOString()
            }])
            .select();
            
        if (error) {
            throw error;
        }
        
        showSuccess('signupSuccess', 'Account created successfully! You can now login.');
        
        // Clear form
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupMobile').value = '';
        document.getElementById('signupPassword').value = '';
        
        // Switch to login tab after 2 seconds
        setTimeout(() => {
            switchTab('login');
        }, 2000);
        
    } catch (error) {
        console.error('Signup error:', error);
        showError('signupError', 'Failed to create account. Please try again.');
    } finally {
        signupBtn.disabled = false;
        signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up';
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    clearMessages();
    
    const emailOrMobile = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    try {
        // Check if input is email or mobile
        const isEmail = emailOrMobile.includes('@');
        const query = isEmail 
            ? supabase.from('users').select('*').eq('email', emailOrMobile)
            : supabase.from('users').select('*').eq('mobile', emailOrMobile);
            
        const { data: user, error } = await query.single();
        
        if (error || !user) {
            showError('loginError', 'Invalid email/mobile or password');
            return;
        }
        
        // Check password (in production, use proper password hashing)
        if (user.password !== password) {
            showError('loginError', 'Invalid email/mobile or password');
            return;
        }
        
        // Login successful
        showSuccess('loginSuccess', 'Login successful! Redirecting...');
        
        // Store user session
        localStorage.setItem('userSession', JSON.stringify({
            id: user.id,
            email: user.email,
            mobile: user.mobile,
            loginTime: new Date().toISOString()
        }));
        
        // Redirect to home page after 1 second
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showError('loginError', 'Login failed. Please try again.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
}

// Check if user is already logged in
function checkUserSession() {
    const session = localStorage.getItem('userSession');
    if (session) {
        // User is already logged in, redirect to home
        window.location.href = 'index.html';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
});