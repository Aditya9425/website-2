// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://jstvadizuzvwhabtfhfs.supabase.co', 
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdHZhZGl6dXp2d2hhYnRmaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjI3NjAsImV4cCI6MjA3MjIzODc2MH0.6btNpJfUh6Fd5PfoivIvu-f31Fj5IXl1vxBLsHz5ISw' // 
};

// Upload image to Supabase Storage
async function uploadImageToSupabase(file, productName) {
    const timestamp = Date.now();
    const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${file.name}`;
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/object/Sarees/${fileName}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
            'apikey': SUPABASE_CONFIG.anonKey
        },
        body: formData
    });
    
    if (!response.ok) {
        throw new Error('Failed to upload image');
    }
    
    return `${SUPABASE_CONFIG.url}/storage/v1/object/public/Sarees/${fileName}`;
}

// Admin Panel Application
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.products = [];
        this.orders = [];
        this.customers = [];
        this.charts = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
        // this.initializeCharts(); // Commented out for testing without Chart.js
    }

    // Supabase helper method
    async supabaseRequest(endpoint, method = 'GET', data = null) {
        const url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;
        const options = {
            method,
            mode: 'cors',
            headers: {
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            options.headers['Prefer'] = 'return=representation';
        }
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase error details:', errorText);
            throw new Error(`Supabase ${method} failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        // DELETE requests often return 204 No Content with no JSON
        if (method === 'DELETE' || response.status === 204) {
            return null;
        }
        
        return await response.json();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(link.dataset.section);
            });
        });

        // Product management
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.openProductModal();
        });

        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProductSubmit();
        });

        document.getElementById('closeProductModal').addEventListener('click', () => {
            this.closeProductModal();
        });

        document.getElementById('cancelProductBtn').addEventListener('click', () => {
            this.closeProductModal();
        });
    }

    async checkAuthState() {
        try {
            const { auth } = window.firebaseServices;
            auth.onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = user;
                    this.showDashboard();
                    this.loadDashboardData();
                } else {
                    this.showLogin();
                }
            });
        } catch (error) {
            console.error('Auth state check error:', error);
            this.showLogin();
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginError = document.getElementById('loginError');

        console.log('AdminPanel: Attempting login with:', email, password);

        try {
            const { auth } = window.firebaseServices;
            console.log('AdminPanel: Got auth service, calling signInWithEmailAndPassword');
            await auth.signInWithEmailAndPassword(email, password);
            console.log('AdminPanel: Login successful, hiding error');
            loginError.style.display = 'none';
        } catch (error) {
            console.error('AdminPanel: Login error:', error);
            // Handle both Firebase error codes and generic errors
            if (error.code) {
                loginError.textContent = this.getErrorMessage(error.code);
            } else {
                loginError.textContent = error.message || 'An error occurred during login.';
            }
            loginError.style.display = 'block';
        }
    }

    async handleLogout() {
        try {
            const { auth } = window.firebaseServices;
            await auth.signOut();
            this.currentUser = null;
            this.showLogin();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/user-disabled': 'This account has been disabled.'
        };
        return errorMessages[errorCode] || 'An error occurred during login.';
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'flex';
        document.getElementById('adminEmail').textContent = this.currentUser.email;
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    }

    navigateToSection(section) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        // Show selected section
        document.getElementById(`${section}Section`).classList.add('active');
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        const titles = {
            dashboard: 'Dashboard',
            products: 'Product Management',
            orders: 'Order Management',
            customers: 'Customer Management',
            analytics: 'Analytics & Reports'
        };
        pageTitle.textContent = titles[section] || 'Dashboard';

        // Load section data
        this.loadSectionData(section);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'products':
                await this.loadProducts();
                break;
            case 'orders':
                await this.loadOrders();
                break;
            case 'customers':
                await this.loadCustomers();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
        }
    }

    // initializeCharts() {
    //     // Initialize Chart.js charts
    //     this.initializeRevenueChart();
    //     this.initializeProductsChart();
    // }

    // initializeRevenueChart() {
    //     const ctx = document.getElementById('revenueChart');
    //     if (ctx) {
    //         this.charts.revenue = new Chart(ctx, {
    //             type: 'line',
    //             data: {
    //                 labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    //                 datasets: [{
    //                     label: 'Revenue',
    //                     data: [0, 0, 0, 0, 0, 0],
    //                     borderColor: '#667eea',
    //                     backgroundColor: 'rgba(102, 126, 234, 0.1)',
    //                     tension: 0.4
    //             }]
    //         },
    //         options: {
    //             responsive: true,
    //             maintainAspectRatio: false
    //         }
    //     });
    // }

    // initializeProductsChart() {
    //     const ctx = document.getElementById('productsChart');
    //     if (ctx) {
    //         this.charts.products = new Chart(ctx, {
    //             type: 'dodge',
    //                 data: {
    //                     labels: ['Silk', 'Cotton', 'Georgette', 'Chiffon', 'Designer', 'Wedding'],
    //                     datasets: [{
    //                         data: [0, 0, 0, 0, 0, 0],
    //                         backgroundColor: [
    //                             '#667eea',
    //                             '#f093fb',
    //                             '#4facfe',
    //                             '#43e97b',
    //                             '#f093fb',
    //                             '#4facfe'
    //                         ]
    //                     }]
    //                 },
    //                 options: {
    //                     responsive: true,
    //                     maintainAspectRatio: false
    //                 }
    //             });
    //         }
    //     }

    async loadDashboardData() {
        try {
            const stats = await this.getDashboardStats();
            this.updateDashboardStats(stats);
            this.loadRecentOrders();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async getDashboardStats() {
        const { db } = window.firebaseServices;
        
        try {
            const [ordersSnapshot, productsSnapshot, customersSnapshot] = await Promise.all([
                db.collection('orders').get(),
                db.collection('products').get(),
                db.collection('customers').get()
            ]);

            let totalRevenue = 0;
            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                if (order.status !== 'cancelled') {
                    totalRevenue += order.total || 0;
                }
            });

            return {
                totalOrders: ordersSnapshot.size,
                totalRevenue: totalRevenue,
                totalProducts: productsSnapshot.size,
                totalCustomers: customersSnapshot.size
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return { totalOrders: 0, totalRevenue: 0, totalProducts: 0, totalCustomers: 0 };
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('totalOrders').textContent = stats.totalOrders;
        document.getElementById('totalRevenue').textContent = `₹${stats.totalRevenue.toLocaleString()}`;
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('totalCustomers').textContent = stats.totalCustomers;
    }

    async loadRecentOrders() {
        try {
            const { db } = window.firebaseServices;
            const snapshot = await db.collection('orders')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();

            const orders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.displayRecentOrders(orders);
        } catch (error) {
            console.error('Error loading recent orders:', error);
        }
    }

    displayRecentOrders(orders) {
        const table = document.getElementById('recentOrdersTable');
        
        if (orders.length === 0) {
            table.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No orders yet</h3><p>Orders will appear here once customers start placing them.</p></div>';
            return;
        }

        const ordersHTML = orders.map(order => `
            <div class="order-row">
                <div class="order-id">#${order.id.slice(-8)}</div>
                <div class="order-customer">${order.customerName || 'N/A'}</div>
                <div class="order-total">₹${order.total?.toLocaleString() || '0'}</div>
                <div class="order-status">
                    <span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span>
                </div>
                <div class="order-date">${new Date(order.createdAt?.toDate()).toLocaleDateString()}</div>
            </div>
        `).join('');

        table.innerHTML = ordersHTML;
    }



    // Product Management Methods
    async loadProducts() {
        try {
            // Try Flask backend first
            try {
                const response = await fetch('http://localhost:5000/products', {
                    mode: 'cors'
                });
                const result = await response.json();
                
                if (result.success) {
                    this.products = result.data;
                    this.displayProducts(this.products);
                    return;
                }
            } catch (flaskError) {
                console.warn('Flask backend unavailable, trying direct Supabase:', flaskError);
                
                // Direct Supabase fetch
                const supabaseData = await this.supabaseRequest('products?select=*');
                this.products = supabaseData;
                this.displayProducts(this.products);
                return;
            }
            
            // If we get here, neither worked
            this.products = [];
            this.displayProducts([]);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showMessage(`Error loading products: ${error.message}`, 'error');
            this.products = [];
            this.displayProducts([]);
        }
    }

    displayProducts(products) {
        const tbody = document.getElementById('productsTableBody');
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-tshirt"></i><h3>No products found</h3><p>Add your first product to get started.</p></td></tr>';
            return;
        }

        const productsHTML = products.map(product => `
            <tr>
                <td>
                    ${product.images && product.images[0] ? 
                        `<img src="${product.images[0]}" alt="${product.name || 'Product'}" width="50" height="50" style="object-fit: cover; border-radius: 4px;">` : 
                        '<span style="color: #999;">No Image</span>'}
                </td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>₹${product.price?.toLocaleString() || '0'}</td>
                <td>${product.stock || 0}</td>
                <td>
                    <span class="status-badge ${(product.stock || 0) > 0 ? 'status-delivered' : 'status-cancelled'}">
                        ${(product.stock || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-primary btn-small" onclick="window.adminPanel.editProduct('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger btn-small" onclick="window.adminPanel.deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                        ${product.linked_variants && product.linked_variants.length > 0 ? 
                            `<div class="linked-variants">
                                ${product.linked_variants.map(variantId => {
                                    const variant = this.products.find(p => p.id === variantId);
                                    return variant ? `<button class="variant-btn" onclick="window.adminPanel.editProduct('${variantId}')" title="${variant.name}">${variant.name.substring(0,10)}...</button>` : '';
                                }).join('')}
                            </div>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = productsHTML;
    }

    openProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        const form = document.getElementById('productForm');

        // Populate linked variants dropdown
        this.populateLinkedVariantsDropdown(productId);

        if (productId) {
            title.textContent = 'Edit Product';
            const product = this.products.find(p => p.id === productId);
            if (product) {
                this.populateProductForm(product);
                form.dataset.productId = productId;
            }
        } else {
            title.textContent = 'Add New Product';
            form.reset();
            delete form.dataset.productId;
        }

        modal.style.display = 'flex';
    }

    closeProductModal() {
        document.getElementById('productModal').style.display = 'none';
        document.getElementById('productForm').reset();
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id == productId);
        if (product) {
            this.openProductModal(productId);
        }
    }

    populateProductForm(product) {
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productStock').value = product.stock || 0;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productColors').value = (product.colors || []).join(', ');
        // Note: File input cannot be pre-populated for security reasons
        
        // Populate linked variants
        const linkedVariantsSelect = document.getElementById('linkedVariants');
        if (product.linked_variants && linkedVariantsSelect) {
            Array.from(linkedVariantsSelect.options).forEach(option => {
                option.selected = product.linked_variants.includes(option.value);
            });
        }
    }

    populateLinkedVariantsDropdown(excludeProductId = null) {
        const select = document.getElementById('linkedVariants');
        if (!select) return;
        
        select.innerHTML = '';
        
        this.products.forEach(product => {
            if (product.id != excludeProductId) {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (₹${product.price})`;
                select.appendChild(option);
            }
        });
    }

    async handleProductSubmit() {
        const form = document.getElementById('productForm');
        const productId = form.dataset.productId;
        const formData = new FormData(form);
        
        try {
            // Handle multiple image uploads
            const imageFiles = document.getElementById('productImages').files;
            let imageUrls = [];
            const productName = formData.get('name');
            
            // For editing, keep existing images if no new files uploaded
            if (productId && imageFiles.length === 0) {
                const existingProduct = this.products.find(p => p.id == productId);
                imageUrls = existingProduct?.images || [];
            }
            
            // Upload new images if files selected
            if (imageFiles.length > 0) {
                try {
                    const uploadPromises = Array.from(imageFiles).map(file => 
                        uploadImageToSupabase(file, productName)
                    );
                    imageUrls = await Promise.all(uploadPromises);
                } catch (error) {
                    alert('Failed to upload image');
                    return;
                }
            }
            
            // Validate images for new products
            if (!productId && imageUrls.length === 0) {
                alert('Please select at least one image file');
                return;
            }
            
            // Get selected linked variants as UUIDs
            const linkedVariantsSelect = document.getElementById('linkedVariants');
            const linkedVariants = Array.from(linkedVariantsSelect.selectedOptions).map(option => option.value);
            
            const productData = {
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
                stock: parseInt(formData.get('stock')) || 0,
                category: formData.get('category'),
                description: formData.get('description') || '',
                images: imageUrls,
                image: imageUrls[0] || null,
                fabric: formData.get('fabric') || 'Cotton',
                colors: formData.get('colors') ? formData.get('colors').split(',').map(c => c.trim()) : [],
                linked_variants: linkedVariants.length > 0 ? linkedVariants : null
            };

            // Try Flask backend first, fallback to direct Supabase
            const isEdit = !!productId;
            const method = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `products/${productId}` : 'products';
            
            try {
                const response = await fetch(`http://localhost:5000/${endpoint}`, {
                    method: method,
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productData)
                });
                const result = await response.json();
                
                if (result.success) {
                    this.showMessage(`Product ${isEdit ? 'updated' : 'added'} successfully!`, 'success');
                    this.closeProductModal();
                    this.loadProducts();
                    return;
                }
            } catch (flaskError) {
                console.warn('Flask backend unavailable, trying direct Supabase:', flaskError);
                
                // Direct Supabase request
                if (isEdit) {
                    console.log('Updating product with data:', productData);
                    const supabaseResult = await this.supabaseRequest(`products?id=eq.${productId}`, 'PATCH', productData);
                    console.log('Update result:', supabaseResult);
                } else {
                    const supabaseResult = await this.supabaseRequest('products', 'POST', productData);
                }
                this.showMessage(`Product ${isEdit ? 'updated' : 'added'} successfully via Supabase!`, 'success');
                this.closeProductModal();
                this.loadProducts();
                return;
            }
            
            this.showMessage(result.error || 'Failed to add product', 'error');
        } catch (error) {
            console.error('Error saving product:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
        }
    }

    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('adminMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'adminMessage';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(messageEl);
        }

        // Set message and style based on type
        messageEl.textContent = message;
        messageEl.style.backgroundColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff';
        messageEl.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.display = 'none';
            }
        }, 3000);
    }

    async updateProduct(productId, productData) {
        const { db } = window.firebaseServices;
        await db.collection('Admin Panel database').doc(productId).update(productData);
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            // Try Flask backend first
            try {
                const response = await fetch(`http://localhost:5000/products/${productId}`, {
                    method: 'DELETE',
                    mode: 'cors'
                });
                
                if (response.ok) {
                    this.showMessage('Product deleted successfully!', 'success');
                    this.loadProducts();
                    return;
                }
            } catch (flaskError) {
                console.warn('Flask backend unavailable, trying Supabase:', flaskError);
                
                // Direct Supabase delete
                await this.supabaseRequest(`products?id=eq.${productId}`, 'DELETE');
                this.showMessage('Product deleted successfully!', 'success');
                this.loadProducts();
                return;
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showMessage(`Error deleting product: ${error.message}`, 'error');
        }
    }

    // Order Management Methods
    async loadOrders() {
        try {
            const { db } = window.firebaseServices;
            const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
            
            this.orders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.displayOrders(this.orders);
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    displayOrders(orders) {
        const tbody = document.getElementById('ordersTableBody');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No orders found</h3><p>Orders will appear here once customers start placing them.</p></td></tr>';
            return;
        }

        const ordersHTML = orders.map(order => `
            <tr>
                <td>#${order.id.slice(-8)}</td>
                <td>${order.customerName || 'N/A'}</td>
                <td>${order.items?.length || 0} items</td>
                <td>₹${order.total?.toLocaleString() || '0'}</td>
                <td>
                    <span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span>
                </td>
                <td>${new Date(order.createdAt?.toDate()).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-primary btn-small" onclick="adminPanel.viewOrder('${order.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-success btn-small" onclick="adminPanel.updateOrderStatus('${order.id}', 'confirmed')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-warning btn-small" onclick="adminPanel.updateOrderStatus('${order.id}', 'shipped')">
                            <i class="fas fa-shipping-fast"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = ordersHTML;
    }

    async updateOrderStatus(orderId, status) {
        try {
            const { db } = window.firebaseServices;
            await db.collection('orders').doc(orderId).update({
                status: status,
                updatedAt: new Date()
            });
            
            this.loadOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    }

    // Customer Management Methods
    async loadCustomers() {
        try {
            const { db } = window.firebaseServices;
            const snapshot = await db.collection('customers').get();
            
            this.customers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.displayCustomers(this.customers);
        } catch (error) {
            console.error('Error loading customers:', error);
        }
    }

    displayCustomers(customers) {
        const tbody = document.getElementById('customersTableBody');
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-users"></i><h3>No customers found</h3><p>Customer data will appear here once they start placing orders.</p></td></tr>';
            return;
        }

        const customersHTML = customers.map(customer => `
            <tr>
                <td>${customer.name || 'N/A'}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>${customer.orderCount || 0}</td>
                <td>₹${customer.totalSpent?.toLocaleString() || '0'}</td>
                <td>${new Date(customer.joinedAt?.toDate()).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-primary btn-small">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = customersHTML;
    }

    // Analytics Methods
    async loadAnalytics() {
        // Load basic analytics data
        this.loadInventoryStatus();
    }

    async loadInventoryStatus() {
        const inventoryStatus = document.getElementById('inventoryStatus');
        
        try {
            const { db } = window.firebaseServices;
            const snapshot = await db.collection('products').get();
            
            let lowStock = 0;
            let outOfStock = 0;
            let totalProducts = snapshot.size;
            
            snapshot.forEach(doc => {
                const product = doc.data();
                if (product.stock === 0) {
                    outOfStock++;
                } else if (product.stock < 10) {
                    lowStock++;
                }
            });

            inventoryStatus.innerHTML = `
                <div class="inventory-item">
                    <div class="inventory-label">Total Products</div>
                    <div class="inventory-value">${totalProducts}</div>
                </div>
                <div class="inventory-item">
                    <div class="inventory-label">Low Stock (< 10)</div>
                    <div class="inventory-value warning">${lowStock}</div>
                </div>
                <div class="inventory-item">
                    <div class="inventory-label">Out of Stock</div>
                    <div class="inventory-value danger">${outOfStock}</div>
                </div>
            `;
        } catch (error) {
            inventoryStatus.innerHTML = '<p>Error loading inventory status</p>';
        }
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
// Close order modal
document.getElementById('closeOrderModal').addEventListener('click', () => {
    document.getElementById('orderModal').style.display = 'none';
});

