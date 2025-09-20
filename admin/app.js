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

        // Color variant management
        document.getElementById('addColorVariant').addEventListener('click', () => {
            this.addColorVariant();
        });

        // Image input management
        document.getElementById('addImageBtn').addEventListener('click', () => {
            this.addImageInput();
        });

        // File input change handlers
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('product-image-input') || e.target.classList.contains('color-image-input')) {
                this.updateFileInputLabel(e.target);
            }
        });

        // Search and filter functionality
        const productSearch = document.getElementById('productSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (productSearch) {
            productSearch.addEventListener('input', () => {
                this.filterProducts();
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filterProducts();
            });
        }
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

        // Clear form and reset to default state
        this.resetProductForm();
        
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
            // Make first image required only for new products
            const firstImageInput = document.querySelector('.product-image-input');
            if (firstImageInput) {
                firstImageInput.required = true;
            }
            delete form.dataset.productId;
        }

        modal.style.display = 'flex';
    }

    closeProductModal() {
        document.getElementById('productModal').style.display = 'none';
        this.resetProductForm();
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
        
        // Show existing images
        this.showExistingImages(product.images || []);
        
        // Populate color variants
        this.populateColorVariants(product.color_variants || []);
        
        // Populate linked variants
        const linkedVariantsSelect = document.getElementById('linkedVariants');
        if (product.linked_variants && linkedVariantsSelect) {
            Array.from(linkedVariantsSelect.options).forEach(option => {
                option.selected = product.linked_variants.includes(option.value);
            });
        }
    }

    addColorVariant() {
        const container = document.getElementById('colorVariants');
        const variantCount = container.children.length + 1;
        const randomColor = this.getRandomColor();
        const variantItem = document.createElement('div');
        variantItem.className = 'color-variant-card';
        variantItem.innerHTML = `
            <div class="variant-header">
                <div class="variant-title">
                    <i class="fas fa-circle" style="color: ${randomColor};"></i>
                    <span>Color Variant ${variantCount}</span>
                </div>
                <button type="button" class="remove-variant-btn" onclick="removeColorVariant(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="variant-content">
                <div class="variant-basic-info">
                    <div class="form-group">
                        <label>Color Name</label>
                        <input type="text" placeholder="e.g., Red, Blue, Green" class="color-name" name="colorNames[]" required>
                    </div>
                    <div class="form-group">
                        <label>Color Code</label>
                        <input type="color" class="color-picker" name="colorCodes[]" value="${randomColor}">
                    </div>
                </div>
                <div class="variant-images">
                    <label>Images for this color</label>
                    <div class="color-image-inputs">
                        <div class="color-image-input-item">
                            <div class="file-input-wrapper">
                                <input type="file" accept="image/*" class="color-image-input" name="colorImages[]">
                                <div class="file-input-label">
                                    <i class="fas fa-image"></i>
                                    <span>Choose Image</span>
                                </div>
                            </div>
                            <button type="button" class="remove-color-image-btn" onclick="removeColorImageInput(this)" style="display: none;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="add-color-image-btn" onclick="addColorImageInput(this)">
                        <i class="fas fa-plus"></i> Add Image
                    </button>
                </div>
            </div>
        `;
        container.appendChild(variantItem);
        this.updateColorVariantEvents(variantItem);
        this.updateRemoveButtons();
    }

    updateRemoveButtons() {
        const items = document.querySelectorAll('.color-variant-card');
        items.forEach((item, index) => {
            const removeBtn = item.querySelector('.remove-variant-btn');
            if (removeBtn) {
                removeBtn.style.display = items.length > 1 ? 'inline-flex' : 'none';
            }
        });
        
        // Update image remove buttons
        this.updateImageRemoveButtons();
    }

    populateColorVariants(colorVariants) {
        const container = document.getElementById('colorVariants');
        container.innerHTML = '';
        
        if (colorVariants.length === 0) {
            // Add default empty variant
            this.addDefaultColorVariant();
            return;
        }
        
        colorVariants.forEach((variant, index) => {
            const variantItem = document.createElement('div');
            variantItem.className = 'color-variant-card';
            const existingImagesHTML = variant.images && variant.images.length > 0 ? 
                `<div class="existing-variant-images" style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                    ${variant.images.map(img => `
                        <div class="existing-variant-image" style="position: relative;">
                            <img src="${img}" alt="${variant.color}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 2px solid #e1e5e9;">
                            <span style="position: absolute; top: -5px; right: -5px; background: #28a745; color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px;">✓</span>
                        </div>
                    `).join('')}
                </div>` : '';
            
            variantItem.innerHTML = `
                <div class="variant-header">
                    <div class="variant-title">
                        <i class="fas fa-circle" style="color: ${variant.colorCode || '#FF0000'};"></i>
                        <span>Color Variant ${index + 1}</span>
                    </div>
                    <button type="button" class="remove-variant-btn" onclick="removeColorVariant(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="variant-content">
                    <div class="variant-basic-info">
                        <div class="form-group">
                            <label>Color Name</label>
                            <input type="text" placeholder="e.g., Red, Blue, Green" class="color-name" name="colorNames[]" value="${variant.color || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Color Code</label>
                            <input type="color" class="color-picker" name="colorCodes[]" value="${variant.colorCode || '#FF0000'}">
                        </div>
                    </div>
                    <div class="variant-images">
                        <label>Images for this color</label>
                        ${existingImagesHTML}
                        <div class="color-image-inputs">
                            <div class="color-image-input-item">
                                <div class="file-input-wrapper">
                                    <input type="file" accept="image/*" class="color-image-input" name="colorImages[]">
                                    <div class="file-input-label">
                                        <i class="fas fa-image"></i>
                                        <span>Choose Image</span>
                                    </div>
                                </div>
                                <button type="button" class="remove-color-image-btn" onclick="removeColorImageInput(this)" style="display: none;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <button type="button" class="add-color-image-btn" onclick="addColorImageInput(this)">
                            <i class="fas fa-plus"></i> Add Image
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(variantItem);
            this.updateColorVariantEvents(variantItem);
        });
        
        this.updateRemoveButtons();
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
            // Handle multiple image uploads from all input fields
            const imageInputs = document.querySelectorAll('.product-image-input');
            let imageUrls = [];
            const productName = formData.get('name');
            
            // Get existing images that weren't deleted
            if (productId) {
                const existingProduct = this.products.find(p => p.id == productId);
                const existingImages = existingProduct?.images || [];
                const deletedImages = this.getDeletedImages();
                imageUrls = existingImages.filter(img => !deletedImages.includes(img));
            }
            
            // Upload new images from all input fields
            for (const input of imageInputs) {
                if (input.files.length > 0) {
                    try {
                        const uploadPromises = Array.from(input.files).map(file => 
                            uploadImageToSupabase(file, productName)
                        );
                        const newUrls = await Promise.all(uploadPromises);
                        imageUrls.push(...newUrls);
                    } catch (error) {
                        alert('Failed to upload image');
                        return;
                    }
                }
            }
            
            // Validate images for new products only
            if (!productId && imageUrls.length === 0) {
                alert('Please select at least one image file');
                return;
            }
            
            // For existing products, ensure we have at least one image (existing or new)
            if (productId && imageUrls.length === 0) {
                alert('Product must have at least one image');
                return;
            }
            
            // Validate price
            const price = parseFloat(formData.get('price'));
            if (!price || price <= 0) {
                alert('Please enter a valid price greater than 0');
                return;
            }
            
            // Get selected linked variants as UUIDs
            const linkedVariantsSelect = document.getElementById('linkedVariants');
            const linkedVariants = Array.from(linkedVariantsSelect.selectedOptions).map(option => option.value);
            
            // Process color variants
            const colorVariants = await this.processColorVariants(productName);
            
            const productData = {
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
                stock: parseInt(formData.get('stock')) || 0,
                category: formData.get('category'),
                description: formData.get('description') || '',
                images: imageUrls,
                image: imageUrls[0] || null,
                fabric: formData.get('fabric') || 'Cotton',
                colors: colorVariants.map(v => v.color).filter(c => c),
                linked_variants: linkedVariants.length > 0 ? linkedVariants : null
            };
            
            // Always add color_variants (can be empty array)
            productData.color_variants = colorVariants;

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

    async processColorVariants(productName) {
        const colorVariants = [];
        const colorItems = document.querySelectorAll('.color-variant-card');
        
        for (const item of colorItems) {
            const colorName = item.querySelector('.color-name').value.trim();
            const colorCode = item.querySelector('.color-picker').value;
            const colorImageInputs = item.querySelectorAll('.color-image-input');
            
            if (colorName) {
                const colorImageUrls = [];
                
                // Process all image inputs for this color
                for (const input of colorImageInputs) {
                    if (input.files.length > 0) {
                        try {
                            const uploadPromises = Array.from(input.files).map(file => 
                                uploadImageToSupabase(file, `${productName}_${colorName}`)
                            );
                            const urls = await Promise.all(uploadPromises);
                            colorImageUrls.push(...urls);
                        } catch (error) {
                            console.error(`Failed to upload images for color ${colorName}:`, error);
                        }
                    }
                }
                
                // Always add color variant even without images
                colorVariants.push({
                    color: colorName,
                    colorCode: colorCode,
                    images: colorImageUrls
                });
            }
        }
        
        return colorVariants;
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
            // Fetch orders directly from Supabase
            const supabase = window.supabase.createClient(
                'https://jstvadizuzvwhabtfhfs.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdHZhZGl6dXp2d2hhYnRmaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjI3NjAsImV4cCI6MjA3MjIzODc2MH0.6btNpJfUh6Fd5PfoivIvu-f31Fj5IXl1vxBLsHz5ISw'
            );
            
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            this.orders = orders || [];
            console.log('Orders loaded from Supabase:', this.orders);
            this.displayOrders(this.orders);
            
        } catch (error) {
            console.error('Error loading orders:', error);
            // Show empty state with error message
            const tbody = document.getElementById('ordersTableBody');
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading orders</h3><p>Please check your connection and try again.</p></td></tr>';
        }
    }

    displayOrders(orders) {
        const tbody = document.getElementById('ordersTableBody');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No orders found</h3><p>Orders will appear here once customers start placing them.</p></td></tr>';
            return;
        }

        const ordersHTML = orders.map(order => {
            // Handle different date formats
            let orderDate = 'N/A';
            if (order.created_at) {
                orderDate = new Date(order.created_at).toLocaleDateString();
            } else if (order.createdAt) {
                if (order.createdAt.toDate) {
                    orderDate = new Date(order.createdAt.toDate()).toLocaleDateString();
                } else {
                    orderDate = new Date(order.createdAt).toLocaleDateString();
                }
            }
            
            // Get customer name from shipping address or customer details
            let customerName = 'N/A';
            if (order.shipping_addr) {
                customerName = `${order.shipping_addr.firstName || ''} ${order.shipping_addr.lastName || ''}`.trim();
            } else if (order.customerName) {
                customerName = order.customerName;
            }
            
            const totalAmount = order.total_amount || order.total || 0;
            const itemsCount = order.items ? order.items.length : 0;
            
            return `
                <tr>
                    <td>#${order.id.toString().slice(-8)}</td>
                    <td>${customerName}</td>
                    <td>${itemsCount} items</td>
                    <td>₹${totalAmount.toLocaleString()}</td>
                    <td>
                        <span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span>
                    </td>
                    <td>${orderDate}</td>
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
            `;
        }).join('');

        tbody.innerHTML = ordersHTML;
    }

    async updateOrderStatus(orderId, status) {
        try {
            // For now, just update locally and show message
            // In a full implementation, you'd update the database
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = status;
                this.displayOrders(this.orders);
                this.showMessage(`Order status updated to ${status}`, 'success');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            this.showMessage('Error updating order status', 'error');
        }
    }
    
    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            this.showMessage('Order not found', 'error');
            return;
        }
        
        // Create order details modal
        const modal = document.createElement('div');
        modal.id = 'orderDetailsModal';
        modal.style.cssText = `
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
        
        const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A';
        const customerName = order.shipping_addr ? `${order.shipping_addr.firstName || ''} ${order.shipping_addr.lastName || ''}`.trim() : 'N/A';
        const totalAmount = order.total_amount || order.total || 0;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>Order Details - #${order.id}</h2>
                    <button onclick="this.closest('#orderDetailsModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h3>Order Information</h3>
                        <p><strong>Order ID:</strong> ${order.id}</p>
                        <p><strong>Date:</strong> ${orderDate}</p>
                        <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
                        <p><strong>Total:</strong> ₹${totalAmount.toLocaleString()}</p>
                    </div>
                    
                    <div>
                        <h3>Customer Information</h3>
                        <p><strong>Name:</strong> ${customerName}</p>
                        ${order.shipping_addr ? `
                            <p><strong>Email:</strong> ${order.shipping_addr.email || 'N/A'}</p>
                            <p><strong>Mobile:</strong> ${order.shipping_addr.mobile || 'N/A'}</p>
                            <p><strong>Address:</strong><br>
                            ${order.shipping_addr.addressLine1 || ''}<br>
                            ${order.shipping_addr.addressLine2 ? order.shipping_addr.addressLine2 + '<br>' : ''}
                            ${order.shipping_addr.city || ''}, ${order.shipping_addr.state || ''} - ${order.shipping_addr.pincode || ''}</p>
                        ` : ''}
                    </div>
                </div>
                
                <div>
                    <h3>Items Ordered</h3>
                    <div style="border: 1px solid #ddd; border-radius: 5px;">
                        ${order.items ? order.items.map(item => `
                            <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
                                <img src="${item.image || 'https://via.placeholder.com/60x80'}" alt="${item.name}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
                                <div style="flex: 1;">
                                    <h4 style="margin: 0 0 5px 0;">${item.name}</h4>
                                    <p style="margin: 0; color: #666;">Price: ₹${item.price.toLocaleString()} × ${item.quantity}</p>
                                    <p style="margin: 5px 0 0 0; font-weight: bold;">Subtotal: ₹${(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            </div>
                        `).join('') : '<p>No items found</p>'}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
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

    addImageInput() {
        const container = document.getElementById('imageInputs');
        const inputItem = document.createElement('div');
        inputItem.className = 'image-input-item';
        inputItem.innerHTML = `
            <div class="file-input-wrapper">
                <input type="file" class="product-image-input" accept="image/*">
                <div class="file-input-label">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <span>Choose Image</span>
                </div>
            </div>
            <button type="button" class="remove-image-btn" onclick="removeImageInput(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(inputItem);
        this.updateImageRemoveButtons();
    }

    updateImageRemoveButtons() {
        const items = document.querySelectorAll('.image-input-item');
        items.forEach((item, index) => {
            const removeBtn = item.querySelector('.remove-image-btn');
            removeBtn.style.display = items.length > 1 ? 'inline-block' : 'none';
        });
    }

    showExistingImages(images) {
        const existingImagesDiv = document.getElementById('existingImages');
        const grid = existingImagesDiv.querySelector('.existing-images-grid');
        
        if (images.length > 0) {
            existingImagesDiv.style.display = 'block';
            grid.innerHTML = images.map((img, index) => `
                <div class="existing-image-item" data-image="${img}">
                    <img src="${img}" alt="Product image ${index + 1}">
                    <button type="button" class="delete-existing-image" onclick="window.adminPanel.markImageForDeletion('${img}', this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        } else {
            existingImagesDiv.style.display = 'none';
        }
    }

    markImageForDeletion(imageUrl, button) {
        const imageItem = button.closest('.existing-image-item');
        imageItem.style.opacity = '0.5';
        imageItem.dataset.deleted = 'true';
        button.innerHTML = '<i class="fas fa-undo"></i>';
        button.onclick = () => this.unmarkImageForDeletion(imageUrl, button);
    }

    unmarkImageForDeletion(imageUrl, button) {
        const imageItem = button.closest('.existing-image-item');
        imageItem.style.opacity = '1';
        delete imageItem.dataset.deleted;
        button.innerHTML = '<i class="fas fa-times"></i>';
        button.onclick = () => this.markImageForDeletion(imageUrl, button);
    }

    getDeletedImages() {
        const deletedItems = document.querySelectorAll('.existing-image-item[data-deleted="true"]');
        return Array.from(deletedItems).map(item => item.dataset.image);
    }

    // Reset product form to clean state
    resetProductForm() {
        const form = document.getElementById('productForm');
        form.reset();
        
        // Clear existing images
        const existingImages = document.getElementById('existingImages');
        existingImages.style.display = 'none';
        existingImages.querySelector('.existing-images-grid').innerHTML = '';
        
        // Reset image inputs to single input (required only for new products)
        const imageInputs = document.getElementById('imageInputs');
        imageInputs.innerHTML = `
            <div class="image-input-item">
                <div class="file-input-wrapper">
                    <input type="file" class="product-image-input" accept="image/*">
                    <div class="file-input-label">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Choose Image</span>
                    </div>
                </div>
                <button type="button" class="remove-image-btn" onclick="removeImageInput(this)" style="display: none;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Reset color variants to single variant
        this.resetColorVariants();
        
        // Clear linked variants
        const linkedVariants = document.getElementById('linkedVariants');
        if (linkedVariants) {
            Array.from(linkedVariants.options).forEach(option => {
                option.selected = false;
            });
        }
    }

    // Reset color variants to default state
    resetColorVariants() {
        const container = document.getElementById('colorVariants');
        container.innerHTML = '';
        this.addDefaultColorVariant();
    }

    // Add default color variant
    addDefaultColorVariant() {
        const container = document.getElementById('colorVariants');
        const variantItem = document.createElement('div');
        variantItem.className = 'color-variant-card';
        variantItem.innerHTML = `
            <div class="variant-header">
                <div class="variant-title">
                    <i class="fas fa-circle" style="color: #FF0000;"></i>
                    <span>Color Variant 1</span>
                </div>
                <button type="button" class="remove-variant-btn" onclick="removeColorVariant(this)" style="display: none;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="variant-content">
                <div class="variant-basic-info">
                    <div class="form-group">
                        <label>Color Name</label>
                        <input type="text" placeholder="e.g., Red, Blue, Green" class="color-name" name="colorNames[]" required>
                    </div>
                    <div class="form-group">
                        <label>Color Code</label>
                        <input type="color" class="color-picker" name="colorCodes[]" value="#FF0000">
                    </div>
                </div>
                <div class="variant-images">
                    <label>Images for this color</label>
                    <div class="color-image-inputs">
                        <div class="color-image-input-item">
                            <div class="file-input-wrapper">
                                <input type="file" accept="image/*" class="color-image-input" name="colorImages[]">
                                <div class="file-input-label">
                                    <i class="fas fa-image"></i>
                                    <span>Choose Image</span>
                                </div>
                            </div>
                            <button type="button" class="remove-color-image-btn" onclick="removeColorImageInput(this)" style="display: none;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="add-color-image-btn" onclick="addColorImageInput(this)">
                        <i class="fas fa-plus"></i> Add Image
                    </button>
                </div>
            </div>
        `;
        container.appendChild(variantItem);
        this.updateColorVariantEvents(variantItem);
    }

    // Get random color for new variants
    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Update color variant events
    updateColorVariantEvents(variantItem) {
        const colorPicker = variantItem.querySelector('.color-picker');
        const colorIcon = variantItem.querySelector('.variant-title i');
        
        if (colorPicker && colorIcon) {
            colorPicker.addEventListener('change', (e) => {
                colorIcon.style.color = e.target.value;
            });
        }
    }

    // Update file input label when file is selected
    updateFileInputLabel(input) {
        const wrapper = input.closest('.file-input-wrapper');
        if (wrapper) {
            const label = wrapper.querySelector('.file-input-label span');
            if (label && input.files.length > 0) {
                const fileName = input.files[0].name;
                label.textContent = fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName;
                wrapper.classList.add('file-selected');
            } else if (label) {
                label.textContent = input.classList.contains('product-image-input') ? 'Choose Image' : 'Choose Image';
                wrapper.classList.remove('file-selected');
            }
        }
    }

    // Update remove buttons for variants
    updateRemoveButtons() {
        const items = document.querySelectorAll('.color-variant-card');
        items.forEach((item, index) => {
            const removeBtn = item.querySelector('.remove-variant-btn');
            if (removeBtn) {
                removeBtn.style.display = items.length > 1 ? 'inline-flex' : 'none';
            }
        });
        
        // Update image remove buttons
        this.updateImageRemoveButtons();
    }

    // Renumber color variants after removal
    renumberColorVariants() {
        const items = document.querySelectorAll('.color-variant-card');
        items.forEach((item, index) => {
            const titleSpan = item.querySelector('.variant-title span');
            if (titleSpan) {
                titleSpan.textContent = `Color Variant ${index + 1}`;
            }
        });
    }

    // Filter products based on search and category
    filterProducts() {
        const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
        const selectedCategory = document.getElementById('categoryFilter')?.value || '';
        
        let filteredProducts = this.products;
        
        // Filter by search term
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description?.toLowerCase().includes(searchTerm) ||
                product.category?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filter by category
        if (selectedCategory) {
            filteredProducts = filteredProducts.filter(product => 
                product.category === selectedCategory
            );
        }
        
        this.displayProducts(filteredProducts);
    }
}

// Global function for removing color variants
function removeColorVariant(button) {
    const item = button.closest('.color-variant-card');
    const container = document.getElementById('colorVariants');
    
    if (container.children.length > 1) {
        item.remove();
        window.adminPanel.updateRemoveButtons();
        // Renumber remaining variants
        window.adminPanel.renumberColorVariants();
    }
}

// Global function for removing image inputs
function removeImageInput(button) {
    const item = button.closest('.image-input-item');
    const container = document.getElementById('imageInputs');
    
    if (container.children.length > 1) {
        item.remove();
        window.adminPanel.updateImageRemoveButtons();
    }
}

// Global function for adding color image inputs
function addColorImageInput(button) {
    const variantItem = button.closest('.color-variant-card');
    const container = variantItem.querySelector('.color-image-inputs');
    const inputItem = document.createElement('div');
    inputItem.className = 'color-image-input-item';
    inputItem.innerHTML = `
        <div class="file-input-wrapper">
            <input type="file" accept="image/*" class="color-image-input" name="colorImages[]">
            <div class="file-input-label">
                <i class="fas fa-image"></i>
                <span>Choose Image</span>
            </div>
        </div>
        <button type="button" class="remove-color-image-btn" onclick="removeColorImageInput(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(inputItem);
    updateColorImageRemoveButtons(variantItem);
}

// Global function for removing color image inputs
function removeColorImageInput(button) {
    const item = button.closest('.color-image-input-item');
    const variantItem = button.closest('.color-variant-card');
    const container = variantItem.querySelector('.color-image-inputs');
    
    if (container.children.length > 1) {
        item.remove();
        updateColorImageRemoveButtons(variantItem);
    }
}

// Update color image remove buttons visibility
function updateColorImageRemoveButtons(variantItem) {
    const items = variantItem.querySelectorAll('.color-image-input-item');
    items.forEach((item, index) => {
        const removeBtn = item.querySelector('.remove-color-image-btn');
        removeBtn.style.display = items.length > 1 ? 'inline-block' : 'none';
    });
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
// Close order modal
document.getElementById('closeOrderModal').addEventListener('click', () => {
    document.getElementById('orderModal').style.display = 'none';
});

