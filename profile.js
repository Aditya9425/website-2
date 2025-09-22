// Use existing Supabase client from main.js
// const supabase is already declared in main.js

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

// Load user orders from Supabase (user-specific with RLS)
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
        console.log('🔍 Fetching orders for user ID:', currentUser.id);
        console.log('🔍 User object:', currentUser);
        
        // First, check if orders table exists and has data
        const { data: allOrders, error: testError } = await supabase
            .from('orders')
            .select('user_id')
            .limit(5);
        
        console.log('📊 Sample orders in database:', allOrders);
        
        // Fetch ONLY current user's orders from Supabase
        const { data: userOrders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }
        
        console.log('✅ Orders fetched from Supabase:', userOrders?.length || 0, 'orders');
        console.log('📋 User orders data:', userOrders);
        
        // Use fetched orders directly
        const secureOrders = userOrders || [];
        
        if (secureOrders.length === 0) {
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
        
        // Display compact mobile-friendly orders
        container.innerHTML = secureOrders.map(order => {
            const orderDate = new Date(order.created_at).toLocaleDateString();
            const orderItems = order.items || [];
            const itemsCount = orderItems.length;
            const firstItem = orderItems[0];
            const shortId = order.id.slice(-8);
            
            return `
                <div style="
                    background: white;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border-left: 4px solid #FF6B6B;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div>
                            <h4 style="margin: 0; font-size: 14px; color: #333;">#${shortId}</h4>
                            <p style="margin: 0; font-size: 12px; color: #666;">${orderDate}</p>
                        </div>
                        <span style="
                            background: ${order.status === 'confirmed' ? '#28a745' : '#ffc107'};
                            color: white;
                            padding: 4px 8px;
                            border-radius: 12px;
                            font-size: 11px;
                            text-transform: uppercase;
                        ">${order.status}</span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        ${firstItem ? `
                            <img src="${firstItem.image || 'https://via.placeholder.com/40x50/FF6B6B/FFFFFF?text=P'}" 
                                 style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px;"
                                 onerror="this.src='https://via.placeholder.com/40x50/FF6B6B/FFFFFF?text=P'">
                            <div style="flex: 1;">
                                <h5 style="margin: 0; font-size: 13px; color: #333;">${firstItem.name}</h5>
                                <p style="margin: 0; font-size: 11px; color: #666;">${itemsCount} item${itemsCount > 1 ? 's' : ''}</p>
                            </div>
                        ` : '<p style="margin: 0; font-size: 12px; color: #999;">No items</p>'}
                        <div style="text-align: right;">
                            <div style="font-weight: bold; color: #FF6B6B; font-size: 14px;">₹${order.total_amount.toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <button onclick="viewOrderDetails('${order.id}')" style="
                        width: 100%;
                        background: #f8f9fa;
                        border: 1px solid #dee2e6;
                        color: #495057;
                        padding: 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-eye"></i> View Details
                    </button>
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
    if (!form) return;
    
    const editableInputs = form.querySelectorAll('input:not(.readonly-field)');
    const actions = form.querySelector('.form-actions');
    const editBtn = document.getElementById('editProfileBtn');
    
    editableInputs.forEach(input => {
        input.readOnly = !enable;
    });
    
    if (actions) actions.style.display = enable ? 'flex' : 'none';
    if (editBtn) editBtn.style.display = enable ? 'none' : 'inline-flex';
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

// View order details (fetch from Supabase for security)
async function viewOrderDetails(orderId) {
    try {
        // Fetch order details from Supabase
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', currentUser.id)
            .single();
        
        if (error || !order) {
            alert('Order not found or access denied');
            return;
        }
        
        showOrderDetailsModal(order);
        
    } catch (error) {
        console.error('Error fetching order details:', error);
        alert('Unable to load order details. Please try again.');
    }
}

// Show order details modal
function showOrderDetailsModal(order) {
    const orderDate = new Date(order.created_at).toLocaleDateString();
    const orderTotal = order.total_amount;
    const shippingAddr = order.shipping_addr;
    
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
                                <div style="display: flex; gap: 10px; padding: 8px; border-bottom: 1px solid #eee;">
                                    <img src="${imageUrl}" alt="${item.name}" 
                                         style="width: 50px; height: 60px; object-fit: cover; border-radius: 4px;"
                                         onerror="this.src='https://via.placeholder.com/50x60/FF6B6B/FFFFFF?text=P'">
                                    <div style="flex: 1;">
                                        <h5 style="margin: 0 0 4px 0; font-size: 14px;">${item.name}</h5>
                                        <p style="margin: 0; font-size: 12px; color: #666;">₹${item.price.toLocaleString()} × ${item.quantity}</p>
                                        <p style="margin: 4px 0 0 0; font-weight: bold; color: #FF6B6B;">₹${(item.price * item.quantity).toLocaleString()}</p>
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
        padding: 10px;
    `;
    
    // Add mobile-friendly modal styles
    const modalContent = modalContainer.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
        `;
    }
    
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

// Mobile Menu Toggle Functionality
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const menuToggle = document.getElementById('mobileMenuToggle');
    
    if (navLinks && menuToggle) {
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        } else {
            navLinks.classList.add('active');
            menuToggle.innerHTML = '<i class="fas fa-times"></i>';
        }
    }
}

// Close mobile menu when clicking outside
function initializeMobileMenu() {
    document.addEventListener('click', (e) => {
        const navLinks = document.getElementById('navLinks');
        const menuToggle = document.getElementById('mobileMenuToggle');
        const navbar = document.querySelector('.navbar');
        
        if (navLinks && menuToggle && navbar) {
            if (!navbar.contains(e.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    });
    
    // Close menu on nav link clicks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const navLinks = document.getElementById('navLinks');
            const menuToggle = document.getElementById('mobileMenuToggle');
            if (navLinks && menuToggle) {
                navLinks.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });
}

// Make functions globally available
window.viewOrderDetails = viewOrderDetails;
window.closeOrderDetails = closeOrderDetails;
window.toggleMobileMenu = toggleMobileMenu;

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page DOM loaded');
    
    // Initialize mobile menu
    initializeMobileMenu();
    
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
    
    // Set initial readonly state (if form exists)
    if (document.getElementById('profileForm')) {
        toggleEditMode(false);
    }
    
    // Navigation event listeners
    document.querySelectorAll('.profile-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });
    
    // Edit profile button (if exists)
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            toggleEditMode(true);
        });
    }
    
    // Cancel edit button (if exists)
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            toggleEditMode(false);
            loadUserProfile();
        });
    }
    
    // Profile form submission (if exists)
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                mobile: document.getElementById('mobile').value
            };
            
            updateUserProfile(formData);
        });
    }
});