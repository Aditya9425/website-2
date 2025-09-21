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

// Load user orders from Supabase (user-specific)
async function loadUserOrders() {
    const container = document.getElementById('ordersContainer');
    
    if (!currentUser || !currentUser.id) {
        console.error('No user ID found');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to load orders</h3>
                <p>Please login again to view your orders</p>
                <a href="auth.html" class="btn-primary">Login</a>
            </div>
        `;
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading your orders...</p>
        </div>
    `;
    
    try {
        console.log('🔍 Fetching orders for user:', currentUser.id);
        
        // Fetch only current user's orders from Supabase
        const { data: userOrders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }
        
        console.log('✅ Orders fetched from Supabase:', userOrders);
        
        // Use only Supabase orders (no localStorage fallback for security)
        const allOrders = userOrders || [];
        
        if (allOrders.length === 0) {
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
        
        // Display user's orders in card layout
        container.innerHTML = allOrders.map(order => {
            const orderDate = new Date(order.created_at).toLocaleDateString();
            const orderItems = order.items || [];
            const itemsCount = orderItems.length;
            const firstItem = orderItems[0];
            
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-info">
                            <h4>Order #${order.id.toString().slice(-8)}</h4>
                            <p class="order-date">${orderDate}</p>
                        </div>
                        <div class="order-status">
                            <span class="status-badge status-${order.status}">${order.status}</span>
                        </div>
                    </div>
                    
                    <div class="order-content">
                        <div class="order-items-preview">
                            ${firstItem ? `
                                <div class="item-preview">
                                    <img src="${firstItem.image || 'https://via.placeholder.com/60x80/FF6B6B/FFFFFF?text=Product'}" 
                                         alt="${firstItem.name}" 
                                         onerror="this.src='https://via.placeholder.com/60x80/FF6B6B/FFFFFF?text=Product'">
                                    <div class="item-info">
                                        <h5>${firstItem.name}</h5>
                                        <p>${itemsCount} item${itemsCount > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            ` : '<p>No items</p>'}
                        </div>
                        
                        <div class="order-summary">
                            <div class="order-total">
                                <span class="total-label">Total Amount</span>
                                <span class="total-amount">₹${order.total_amount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-actions">
                        <button class="btn-outline" onclick="viewOrderDetails('${order.id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Unable to load orders</h3>
                <p>There was an error loading your orders. Please try again later.</p>
                <button class="btn-primary" onclick="loadUserOrders()">Retry</button>
            </div>
        `;
    }
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

// View order details
function viewOrderDetails(orderId) {
    // Find order in database orders or localStorage
    const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = localOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found');
        return;
    }
    
    const orderDate = new Date(order.created_at || order.createdAt).toLocaleDateString();
    const orderTotal = order.total_amount || order.total;
    const shippingAddr = order.shipping_addr || order.address;
    
    const detailsHTML = `
        <div class="order-details-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Order Details - #${order.id}</h3>
                    <button onclick="closeOrderDetails()" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-info-section">
                        <h4>Order Information</h4>
                        <p><strong>Order ID:</strong> ${order.id}</p>
                        <p><strong>Date:</strong> ${orderDate}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status}</span></p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Razorpay'}</p>
                    </div>
                    
                    <div class="shipping-info-section">
                        <h4>Shipping Address</h4>
                        <p>${shippingAddr.firstName} ${shippingAddr.lastName}</p>
                        <p>${shippingAddr.addressLine1}</p>
                        ${shippingAddr.addressLine2 ? `<p>${shippingAddr.addressLine2}</p>` : ''}
                        <p>${shippingAddr.city}, ${shippingAddr.state} - ${shippingAddr.pincode}</p>
                        <p>Mobile: ${shippingAddr.mobile}</p>
                        <p>Email: ${shippingAddr.email}</p>
                    </div>
                    
                    <div class="items-section">
                        <h4>Items Ordered</h4>
                        ${order.items.map(item => {
                            let imageUrl = item.image;
                            if (imageUrl && !imageUrl.startsWith('http')) {
                                imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${imageUrl}`;
                            }
                            if (!imageUrl || imageUrl === 'undefined') {
                                imageUrl = `https://via.placeholder.com/80x100/FF6B6B/FFFFFF?text=${encodeURIComponent(item.name || 'Product')}`;
                            }
                            
                            return `
                                <div class="order-detail-item">
                                    <img src="${imageUrl}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/80x100/FF6B6B/FFFFFF?text=Product'">
                                    <div class="item-info">
                                        <h5>${item.name}</h5>
                                        <p>Price: ₹${item.price.toLocaleString()}</p>
                                        <p>Quantity: ${item.quantity}</p>
                                        <p><strong>Subtotal: ₹${(item.price * item.quantity).toLocaleString()}</strong></p>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="order-summary-section">
                        <h4>Order Summary</h4>
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>₹${(order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toLocaleString()}</span>
                        </div>
                        <div class="summary-row">
                            <span>Delivery Charges:</span>
                            <span>₹${(order.deliveryCharges || 0).toLocaleString()}</span>
                        </div>
                        <div class="summary-row total">
                            <span><strong>Total:</strong></span>
                            <span><strong>₹${orderTotal.toLocaleString()}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    const modalContainer = document.createElement('div');
    modalContainer.id = 'orderDetailsModal';
    modalContainer.innerHTML = detailsHTML;
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    document.body.appendChild(modalContainer);
    document.body.style.overflow = 'hidden';
}

// Close order details modal
function closeOrderDetails() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Make functions globally available
window.viewOrderDetails = viewOrderDetails;
window.closeOrderDetails = closeOrderDetails;

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page DOM loaded');
    
    if (!checkAuth()) {
        console.log('Authentication failed, redirecting...');
        return;
    }
    
    console.log('User authenticated, loading profile...');
    loadUserProfile();
    
    // Load orders initially if on orders section
    const currentSection = document.querySelector('.profile-section.active');
    if (currentSection && currentSection.id === 'ordersSection') {
        loadUserOrders();
    }
    
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