// Supabase Configuration
const SUPABASE_URL = 'https://jstvadizuzvwhabtfhfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdHZhZGl6dXp2d2hhYnRmaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjI3NjAsImV4cCI6MjA3MjIzODc2MH0.6btNpJfUh6Fd5PfoivIvu-f31Fj5IXl1vxBLsHz5ISw';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// Check authentication and redirect if not logged in
function checkAuth() {
    const session = localStorage.getItem('userSession');
    if (!session) {
        window.location.href = 'auth.html';
        return false;
    }
    
    currentUser = JSON.parse(session);
    return true;
}

// Load user profile data
async function loadUserProfile() {
    console.log('Loading user profile...', currentUser);
    if (!currentUser) {
        console.log('No current user found');
        return;
    }
    
    // Show user email immediately from localStorage
    const profileNameEl = document.getElementById('profileName');
    const profileEmailEl = document.getElementById('profileEmail');
    
    if (profileNameEl) profileNameEl.textContent = currentUser.email.split('@')[0];
    if (profileEmailEl) profileEmailEl.textContent = currentUser.email;
    
    try {
        console.log('Fetching user data from database for:', currentUser.email);
        // Get data from Supabase
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', currentUser.email)
            .single();
            
        console.log('Database response:', { data, error });
            
        if (data && !error) {
            // Update profile display with database data
            const displayName = data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : data.email.split('@')[0];
            
            if (profileNameEl) profileNameEl.textContent = displayName;
            if (profileEmailEl) profileEmailEl.textContent = data.email;
            
            // Update form fields with database data
            const firstNameEl = document.getElementById('firstName');
            const lastNameEl = document.getElementById('lastName');
            const emailEl = document.getElementById('email');
            const mobileEl = document.getElementById('mobile');
            
            if (firstNameEl) firstNameEl.value = data.first_name || '';
            if (lastNameEl) lastNameEl.value = data.last_name || '';
            if (emailEl) emailEl.value = data.email;
            if (mobileEl) mobileEl.value = data.mobile || '';
            
            console.log('Profile loaded successfully');
        } else {
            console.log('User not found in database, using fallback');
            // Show fallback data
            if (profileNameEl) profileNameEl.textContent = currentUser.email.split('@')[0];
            if (profileEmailEl) profileEmailEl.textContent = currentUser.email;
            
            const emailEl = document.getElementById('email');
            if (emailEl) emailEl.value = currentUser.email;
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
        // Show error state with fallback
        if (profileNameEl) profileNameEl.textContent = currentUser.email.split('@')[0];
        if (profileEmailEl) profileEmailEl.textContent = currentUser.email;
        
        const emailEl = document.getElementById('email');
        if (emailEl) emailEl.value = currentUser.email;
    }
}

// Load user orders
function loadUserOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const userOrders = orders.filter(order => 
        order.address && order.address.email === currentUser.email
    );
    
    const container = document.getElementById('ordersContainer');
    
    if (userOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h3>No orders yet</h3>
                <p>Start shopping to see your orders here</p>
                <a href="collections.html" class="btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <h4>Order #${order.id}</h4>
                    <p>Placed on ${new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="order-status">
                    <span class="status-badge ${order.status}">${order.status}</span>
                </div>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="item-details">
                            <h5>${item.name}</h5>
                            <p>Qty: ${item.quantity} | ₹${item.price.toLocaleString()}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-footer">
                <div class="order-total">
                    <strong>Total: ₹${order.total.toLocaleString()}</strong>
                </div>
            </div>
        </div>
    `).join('');
}

// Toggle profile edit mode
function toggleEditMode(enable) {
    const form = document.getElementById('profileForm');
    const editableInputs = form.querySelectorAll('input:not(.readonly-field)');
    const actions = form.querySelector('.form-actions');
    const editBtn = document.getElementById('editProfileBtn');
    
    // Toggle readonly for editable inputs only
    editableInputs.forEach(input => {
        input.readOnly = !enable;
    });
    
    actions.style.display = enable ? 'flex' : 'none';
    editBtn.style.display = enable ? 'none' : 'inline-flex';
}

// Update user profile
async function updateUserProfile(formData) {
    try {
        // Update in database
        const { data, error } = await supabase
            .from('users')
            .update({
                first_name: formData.firstName,
                last_name: formData.lastName,
                mobile: formData.mobile
            })
            .eq('email', currentUser.email);
            
        if (error) {
            throw error;
        }
        
        showMessage('Profile updated successfully!', 'success');
        
        // Refresh profile data to show updated information
        await loadUserProfile();
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Failed to update profile. Please try again.', 'error');
    }
    
    toggleEditMode(false);
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        z-index: 10000;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// Switch profile sections
function switchSection(sectionName) {
    // Update nav links
    document.querySelectorAll('.profile-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update sections
    document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific data
        if (sectionName === 'orders') {
            loadUserOrders();
        }
    }
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page DOM loaded');
    
    if (!checkAuth()) {
        console.log('Authentication failed, redirecting...');
        return;
    }
    
    console.log('User authenticated, loading profile...');
    loadUserProfile();
    loadUserOrders();
    
    // Set initial readonly state
    toggleEditMode(false);
    
    // Navigation event listeners
    document.querySelectorAll('.profile-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });
    
    // Edit profile button
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        toggleEditMode(true);
    });
    
    // Cancel edit button
    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        toggleEditMode(false);
        loadUserProfile(); // Reset form
    });
    
    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            mobile: document.getElementById('mobile').value
        };
        
        updateUserProfile(formData);
    });
});