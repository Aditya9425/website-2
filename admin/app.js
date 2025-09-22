// Hardcoded Supabase configuration for admin panel
const SUPABASE_URL = 'https://jstvadizuzvwhabtfhfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdHZhZGl6dXp2d2hhYnRmaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjI3NjAsImV4cCI6MjA3MjIzODc2MH0.6btNpJfUh6Fd5PfoivIvu-f31Fj5IXl1vxBLsHz5ISw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Upload image to Supabase Storage
async function uploadImageToSupabase(file, productName) {
    try {
        // Validate file
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('Please select a valid image file');
        }
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image size must be less than 5MB');
        }
        
        const timestamp = Date.now();
        const cleanProductName = productName.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${cleanProductName}_${timestamp}_${cleanFileName}`;
        
        console.log('Uploading image:', fileName);
        
        const { data, error } = await supabase.storage
            .from('Sarees')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('Supabase upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('Sarees')
            .getPublicUrl(fileName);
        
        console.log('Image uploaded successfully:', urlData.publicUrl);
        return urlData.publicUrl;
        
    } catch (error) {
        console.error('Image upload error:', error);
        throw error;
    }
}

// Admin Panel Application
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.products = [];
        this.orders = [];
        this.customers = [];
        this.feedbackData = [];
        this.charts = {};
        
        console.log('✅ Supabase client ready for admin panel');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
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
            console.log('Add Product button clicked');
            this.openProductModal();
        });

        // Feedback refresh button
        const refreshFeedbackBtn = document.getElementById('refreshFeedback');
        if (refreshFeedbackBtn) {
            refreshFeedbackBtn.addEventListener('click', () => {
                this.loadFeedback();
            });
        }

        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Product form submitted');
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
        // For admin panel, always show login first
        this.showLogin();
    }

    async handleLogin() {
        const username = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginError = document.getElementById('loginError');

        console.log('AdminPanel: Attempting admin login with:', username);

        try {
            const { data, error } = await supabase
                .from('admin')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single();
            
            if (error || !data) {
                throw new Error('Invalid username or password');
            }
            
            console.log('AdminPanel: Admin login successful');
            loginError.style.display = 'none';
            
            // Set current user and show dashboard
            this.currentUser = { id: data.id, email: data.username };
            this.showDashboard();
            this.loadDashboardData();
        } catch (error) {
            console.error('AdminPanel: Login error:', error);
            loginError.textContent = error.message || 'Invalid username or password';
            loginError.style.display = 'block';
        }
    }

    async handleLogout() {
        this.currentUser = null;
        this.showLogin();
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
        document.getElementById('adminEmail').textContent = this.currentUser.email || 'Admin';
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
            analytics: 'Analytics & Reports',
            feedback: 'Customer Feedback'
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
            case 'feedback':
                await this.loadFeedback();
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
        try {
            console.log('📊 Loading dashboard stats from Supabase...');
            
            // Fetch data from Supabase
            const [ordersResponse, productsResponse, usersResponse] = await Promise.all([
                supabase.from('orders').select('total_amount, status'),
                supabase.from('products').select('id'),
                supabase.from('users').select('id')
            ]);
            
            let totalRevenue = 0;
            let totalOrders = 0;
            
            if (ordersResponse.data) {
                totalOrders = ordersResponse.data.length;
                totalRevenue = ordersResponse.data
                    .filter(order => order.status !== 'cancelled')
                    .reduce((sum, order) => sum + (order.total_amount || 0), 0);
            }
            
            const totalProducts = productsResponse.data ? productsResponse.data.length : 0;
            const totalCustomers = usersResponse.data ? usersResponse.data.length : 0;
            
            console.log('✅ Dashboard stats loaded:', {
                totalOrders,
                totalRevenue,
                totalProducts,
                totalCustomers
            });
            
            return {
                totalOrders,
                totalRevenue,
                totalProducts,
                totalCustomers
            };
        } catch (error) {
            console.error('❌ Error getting dashboard stats:', error);
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
            console.log('🔄 Loading recent orders from Supabase...');
            
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (error) {
                console.error('❌ Error loading recent orders:', error);
                throw error;
            }
            
            console.log('✅ Recent orders loaded:', data);
            this.displayRecentOrders(data || []);
        } catch (error) {
            console.error('❌ Error loading recent orders:', error);
            // Show empty state
            const table = document.getElementById('recentOrdersTable');
            if (table) {
                table.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading orders</h3><p>Please check your connection.</p></div>';
            }
        }
    }

    displayRecentOrders(orders) {
        const table = document.getElementById('recentOrdersTable');
        
        if (orders.length === 0) {
            table.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No orders yet</h3><p>Orders will appear here once customers start placing them.</p></div>';
            return;
        }

        const ordersHTML = orders.map(order => {
            // Get customer name from shipping address
            let customerName = 'N/A';
            if (order.shipping_addr) {
                customerName = `${order.shipping_addr.firstName || ''} ${order.shipping_addr.lastName || ''}`.trim();
            }
            
            // Format date
            let orderDate = 'N/A';
            if (order.created_at) {
                orderDate = new Date(order.created_at).toLocaleDateString();
            }
            
            return `
                <div class="order-row">
                    <div class="order-id">#${order.id.toString().slice(-8)}</div>
                    <div class="order-customer">${customerName}</div>
                    <div class="order-total">₹${(order.total_amount || 0).toLocaleString()}</div>
                    <div class="order-status">
                        <span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span>
                    </div>
                    <div class="order-date">${orderDate}</div>
                </div>
            `;
        }).join('');

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
                const { data, error } = await supabase.from('products').select('*');
                if (error) throw error;
                this.products = data || [];
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
        console.log('openProductModal called with productId:', productId);
        
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        const form = document.getElementById('productForm');
        
        if (!modal) {
            console.error('Product modal not found!');
            this.showMessage('Error: Product modal not found', 'error');
            return;
        }
        
        if (!title) {
            console.error('Product modal title not found!');
        }
        
        if (!form) {
            console.error('Product form not found!');
        }

        // Clear form and reset to default state
        this.resetProductForm();
        
        // Populate linked variants dropdown
        this.populateLinkedVariantsDropdown(productId);

        if (productId) {
            if (title) title.textContent = 'Edit Product';
            const product = this.products.find(p => p.id === productId);
            if (product && form) {
                this.populateProductForm(product);
                form.dataset.productId = productId;
            }
        } else {
            if (title) title.textContent = 'Add New Product';
            if (form) delete form.dataset.productId;
        }

        console.log('Opening product modal');
        modal.style.display = 'flex';
        modal.style.zIndex = '9999';
        
        // Focus on first input for better UX
        setTimeout(() => {
            const firstInput = form?.querySelector('#productName');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
        
        console.log('Product modal display set to flex, z-index set to 9999');
    }

    closeProductModal() {
        console.log('Closing product modal');
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.style.display = 'none';
        }
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
            
            // Create existing images HTML with proper image display
            const existingImagesHTML = variant.images && variant.images.length > 0 ? 
                `<div class="existing-variant-images" style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                    <label style="width: 100%; font-weight: 500; margin-bottom: 5px; color: #333;">Existing Images:</label>
                    ${variant.images.map((img, imgIndex) => `
                        <div class="existing-variant-image" style="position: relative; display: inline-block;">
                            <img src="${img}" alt="${variant.color} - Image ${imgIndex + 1}" 
                                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid #28a745; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div style="display: none; width: 80px; height: 80px; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6c757d;">Image not found</div>
                            <span style="position: absolute; top: -8px; right: -8px; background: #28a745; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">✓</span>
                            <button type="button" onclick="this.closest('.existing-variant-image').remove()" 
                                    style="position: absolute; top: -8px; left: -8px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" 
                                    title="Remove this image">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>` : '';
            
            variantItem.innerHTML = `
                <div class="variant-header">
                    <div class="variant-title">
                        <i class="fas fa-circle" style="color: ${variant.colorCode || '#FF0000'};"></i>
                        <span>Color Variant ${index + 1} - ${variant.color || 'Unnamed'}</span>
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
                        <label style="font-weight: 600; margin-bottom: 10px; display: block;">Images for this color variant</label>
                        ${existingImagesHTML}
                        <div class="color-image-inputs" style="margin-top: ${variant.images && variant.images.length > 0 ? '15px' : '0px'};">
                            <label style="font-weight: 500; margin-bottom: 8px; display: block; color: #666;">Add new images:</label>
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
                        <button type="button" class="add-color-image-btn" onclick="addColorImageInput(this)" style="margin-top: 10px;">
                            <i class="fas fa-plus"></i> Add Another Image
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
            // Basic form validation
            const productName = formData.get('name')?.trim();
            const category = formData.get('category');
            const price = parseFloat(formData.get('price'));
            const stock = parseInt(formData.get('stock')) || 0;
            const description = formData.get('description')?.trim();
            
            console.log('Form data:', { productName, category, price, stock, description });
            
            if (!productName) {
                this.showMessage('Product name is required', 'error');
                return;
            }
            
            if (!category) {
                this.showMessage('Please select a category', 'error');
                return;
            }
            
            if (!price || price <= 0) {
                this.showMessage('Please enter a valid price greater than 0', 'error');
                return;
            }
            
            // Handle image uploads
            const imageInputs = document.querySelectorAll('.product-image-input');
            let imageUrls = [];
            
            // Get existing images that weren't deleted (for edit mode)
            if (productId) {
                const existingProduct = this.products.find(p => p.id == productId);
                const existingImages = existingProduct?.images || [];
                const deletedImages = this.getDeletedImages();
                imageUrls = existingImages.filter(img => !deletedImages.includes(img));
            }
            
                // Upload new images
            this.showMessage('Uploading images...', 'info');
            for (const input of imageInputs) {
                if (input.files.length > 0) {
                    try {
                        for (const file of input.files) {
                            const imageUrl = await uploadImageToSupabase(file, productName);
                            imageUrls.push(imageUrl);
                        }
                    } catch (error) {
                        console.error('Image upload error:', error);
                        this.showMessage(`Failed to upload image: ${error.message}`, 'error');
                        return;
                    }
                }
            }
            
            // For new products, allow without images for testing
            if (!productId && imageUrls.length === 0) {
                console.log('No images provided for new product, continuing anyway for testing');
                // this.showMessage('Please select at least one image for the product', 'error');
                // return;
            }
            
            // Get linked variants
            const linkedVariantsSelect = document.getElementById('linkedVariants');
            const linkedVariants = linkedVariantsSelect ? 
                Array.from(linkedVariantsSelect.selectedOptions).map(option => option.value) : [];
            
            // Process color variants with image uploads
            const colorVariants = [];
            const colorItems = document.querySelectorAll('.color-variant-card');
            
            for (const item of colorItems) {
                const colorName = item.querySelector('.color-name')?.value?.trim();
                const colorCode = item.querySelector('.color-picker')?.value;
                
                if (colorName) {
                    // Handle color variant images
                    const colorImageInputs = item.querySelectorAll('.color-image-input');
                    const colorImageUrls = [];
                    
                    // Get existing images for this variant (in edit mode)
                    const existingImages = item.querySelectorAll('.existing-variant-image img');
                    existingImages.forEach(img => {
                        if (!img.closest('.existing-variant-image').dataset.deleted) {
                            colorImageUrls.push(img.src);
                        }
                    });
                    
                    // Upload new color variant images
                    for (const input of colorImageInputs) {
                        if (input.files.length > 0) {
                            try {
                                for (const file of input.files) {
                                    const imageUrl = await uploadImageToSupabase(file, `${productName}_${colorName}`);
                                    colorImageUrls.push(imageUrl);
                                }
                            } catch (error) {
                                console.error('Color variant image upload error:', error);
                                this.showMessage(`Failed to upload image for ${colorName}: ${error.message}`, 'error');
                                return;
                            }
                        }
                    }
                    
                    colorVariants.push({
                        color: colorName,
                        colorCode: colorCode || '#FF0000',
                        images: colorImageUrls
                    });
                }
            }
            
            // Prepare product data
            const productData = {
                name: productName,
                price: price,
                stock: stock,
                category: category,
                description: description,
                images: imageUrls,
                image: imageUrls[0] || null,
                fabric: category, // Use category as fabric for simplicity
                colors: colorVariants.map(v => v.color).filter(c => c),
                color_variants: colorVariants,
                linked_variants: linkedVariants.length > 0 ? linkedVariants : null
            };
            
            console.log('Submitting product data:', productData);
            
            // Submit to Supabase directly
            const isEdit = !!productId;
            this.showMessage(`${isEdit ? 'Updating' : 'Adding'} product...`, 'info');
            
            if (isEdit) {
                const { data, error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', productId)
                    .select();
                
                if (error) {
                    console.error('Update error:', error);
                    throw new Error(`Failed to update product: ${error.message}`);
                }
                
                console.log('Product updated:', data);
            } else {
                const { data, error } = await supabase
                    .from('products')
                    .insert(productData)
                    .select();
                
                if (error) {
                    console.error('Insert error:', error);
                    throw new Error(`Failed to add product: ${error.message}`);
                }
                
                console.log('Product added:', data);
            }
            
            this.showMessage(`Product ${isEdit ? 'updated' : 'added'} successfully!`, 'success');
            this.closeProductModal();
            await this.loadProducts();
            
        } catch (error) {
            console.error('Error saving product:', error);
            let errorMessage = 'Failed to save product';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (error.code) {
                errorMessage = `Database error: ${error.code}`;
            }
            
            this.showMessage(`Error: ${errorMessage}`, 'error');
        }
    }

    async processColorVariants(productName) {
        const colorVariants = [];
        const colorItems = document.querySelectorAll('.color-variant-card');
        
        for (const item of colorItems) {
            const colorName = item.querySelector('.color-name')?.value?.trim();
            const colorCode = item.querySelector('.color-picker')?.value;
            
            if (colorName) {
                colorVariants.push({
                    color: colorName,
                    colorCode: colorCode || '#FF0000',
                    images: [] // Simplified - no separate color images for now
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
                const { error } = await supabase.from('products').delete().eq('id', productId);
                if (error) throw error;
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
            console.log('🔄 Loading orders from Supabase...');
            
            // Fetch orders directly from Supabase
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Supabase error loading orders:', error);
                throw error;
            }
            
            console.log('✅ Orders loaded from Supabase:', data);
            this.orders = data || [];
            this.displayOrders(this.orders);
            
        } catch (error) {
            console.error('❌ Error loading orders:', error);
            
            // Try fallback to localStorage
            try {
                const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                if (localOrders.length > 0) {
                    console.log('📱 Using orders from localStorage as fallback');
                    this.orders = localOrders;
                    this.displayOrders(this.orders);
                    return;
                }
            } catch (localError) {
                console.error('❌ Error loading from localStorage:', localError);
            }
            
            // Show empty state with error message
            const tbody = document.getElementById('ordersTableBody');
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading orders</h3><p>Please check your connection and try again.</p></td></tr>';
        }
    }

    displayOrders(orders) {
        const tbody = document.getElementById('ordersTableBody');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No orders found</h3><p>Orders will appear here once customers start placing them.</p></td></tr>';
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
            const paymentMethod = order.payment_method || 'N/A';
            const paymentId = order.payment_id || order.razorpay_payment_id || 'N/A';
            
            return `
                <tr>
                    <td>#${order.id.toString().slice(-8)}</td>
                    <td>${customerName}</td>
                    <td>${itemsCount} items</td>
                    <td>₹${totalAmount.toLocaleString()}</td>
                    <td>
                        <span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span>
                    </td>
                    <td>${paymentMethod}</td>
                    <td>${orderDate}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-primary btn-small" onclick="adminPanel.viewOrder('${order.id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-success btn-small" onclick="adminPanel.updateOrderStatus('${order.id}', 'confirmed')" title="Confirm Order">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-warning btn-small" onclick="adminPanel.updateOrderStatus('${order.id}', 'shipped')" title="Mark as Shipped">
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
            console.log(`🔄 Updating order ${orderId} status to ${status}`);
            
            // Update in Supabase
            const { data, error } = await supabase
                .from('orders')
                .update({ status: status })
                .eq('id', orderId)
                .select();
            
            if (error) {
                console.error('❌ Error updating order status in Supabase:', error);
                throw error;
            }
            
            console.log('✅ Order status updated in Supabase:', data);
            
            // Update local data
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = status;
                this.displayOrders(this.orders);
            }
            
            this.showMessage(`Order status updated to ${status}`, 'success');
            
            // Reload orders to ensure consistency
            setTimeout(() => {
                this.loadOrders();
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error updating order status:', error);
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
            console.log('🔄 Loading customers from orders...');
            
            // Fetch all orders to extract customer information
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Error loading orders for customers:', error);
                throw error;
            }
            
            // Extract unique customers from orders
            const customerMap = new Map();
            
            orders.forEach(order => {
                if (order.shipping_addr && order.user_id) {
                    const customerId = order.user_id;
                    const customerData = order.shipping_addr;
                    
                    if (!customerMap.has(customerId)) {
                        customerMap.set(customerId, {
                            id: customerId,
                            name: `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim(),
                            email: customerData.email || 'N/A',
                            phone: customerData.mobile || 'N/A',
                            address: {
                                line1: customerData.addressLine1 || '',
                                line2: customerData.addressLine2 || '',
                                city: customerData.city || '',
                                state: customerData.state || '',
                                pincode: customerData.pincode || ''
                            },
                            orderCount: 0,
                            totalSpent: 0,
                            firstOrderDate: order.created_at,
                            lastOrderDate: order.created_at
                        });
                    }
                    
                    const customer = customerMap.get(customerId);
                    customer.orderCount += 1;
                    customer.totalSpent += order.total_amount || 0;
                    
                    // Update last order date if this order is more recent
                    if (new Date(order.created_at) > new Date(customer.lastOrderDate)) {
                        customer.lastOrderDate = order.created_at;
                    }
                }
            });
            
            this.customers = Array.from(customerMap.values());
            console.log('✅ Customers loaded:', this.customers.length);
            this.displayCustomers(this.customers);
            
        } catch (error) {
            console.error('❌ Error loading customers:', error);
            const tbody = document.getElementById('customersTableBody');
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading customers</h3><p>Please check your connection and try again.</p></td></tr>';
        }
    }

    displayCustomers(customers) {
        const tbody = document.getElementById('customersTableBody');
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-users"></i><h3>No customers found</h3><p>Customer data will appear here once they start placing orders.</p></td></tr>';
            return;
        }

        const customersHTML = customers.map(customer => {
            const joinedDate = customer.firstOrderDate ? new Date(customer.firstOrderDate).toLocaleDateString() : 'N/A';
            
            return `
                <tr>
                    <td>${customer.name || 'N/A'}</td>
                    <td>${customer.email || 'N/A'}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>${customer.orderCount || 0}</td>
                    <td>₹${customer.totalSpent?.toLocaleString() || '0'}</td>
                    <td>${joinedDate}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-primary btn-small" onclick="adminPanel.viewCustomerDetails('${customer.id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = customersHTML;
    }

    // View customer details
    viewCustomerDetails(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            this.showMessage('Customer not found', 'error');
            return;
        }
        
        // Create customer details modal
        const modal = document.createElement('div');
        modal.id = 'customerDetailsModal';
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
        
        const fullAddress = `${customer.address.line1}${customer.address.line2 ? ', ' + customer.address.line2 : ''}, ${customer.address.city}, ${customer.address.state} - ${customer.address.pincode}`;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>Customer Details</h2>
                    <button onclick="this.closest('#customerDetailsModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h3>Personal Information</h3>
                        <p><strong>Name:</strong> ${customer.name}</p>
                        <p><strong>Email:</strong> ${customer.email}</p>
                        <p><strong>Phone:</strong> ${customer.phone}</p>
                        <p><strong>Customer ID:</strong> ${customer.id}</p>
                    </div>
                    
                    <div>
                        <h3>Order Statistics</h3>
                        <p><strong>Total Orders:</strong> ${customer.orderCount}</p>
                        <p><strong>Total Spent:</strong> ₹${customer.totalSpent.toLocaleString()}</p>
                        <p><strong>First Order:</strong> ${new Date(customer.firstOrderDate).toLocaleDateString()}</p>
                        <p><strong>Last Order:</strong> ${new Date(customer.lastOrderDate).toLocaleDateString()}</p>
                    </div>
                </div>
                
                <div>
                    <h3>Address Information</h3>
                    <p>${fullAddress}</p>
                </div>
                
                <div style="margin-top: 20px;">
                    <button onclick="adminPanel.viewCustomerOrders('${customer.id}')" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        View Customer Orders
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // View customer orders
    viewCustomerOrders(customerId) {
        // Close customer details modal
        const customerModal = document.getElementById('customerDetailsModal');
        if (customerModal) customerModal.remove();
        
        // Switch to orders section and filter by customer
        this.navigateToSection('orders');
        
        // Filter orders by customer ID
        const customerOrders = this.orders.filter(order => order.user_id === customerId);
        this.displayOrders(customerOrders);
        
        // Show filter info
        const customer = this.customers.find(c => c.id === customerId);
        this.showMessage(`Showing ${customerOrders.length} orders for ${customer?.name || 'customer'}`, 'info');
    }

    // Analytics Methods
    async loadAnalytics() {
        console.log('📊 Loading analytics data...');
        try {
            await this.loadSalesAnalytics();
            await this.loadCustomerAnalytics();
            await this.loadProductAnalytics();
            await this.loadMarketingAnalytics();
            this.initializeCharts();
        } catch (error) {
            console.error('❌ Error loading analytics:', error);
        }
    }

    // Feedback Methods
    async loadFeedback() {
        console.log('💬 Loading feedback data...');
        try {
            await this.fetchFeedbackData();
            this.renderFeedbackTable();
            this.updateFeedbackStats();
        } catch (error) {
            console.error('❌ Error loading feedback:', error);
            this.showFeedbackError('Failed to load feedback. Please try again.');
        }
    }

    async fetchFeedbackData() {
        try {
            this.showFeedbackLoading();
            
            const { data, error } = await supabase
                .from('feedbacks')
                .select('*')
                .order('submitted_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching feedback:', error);
                throw new Error(error.message);
            }
            
            this.feedbackData = data || [];
            console.log(`✅ Loaded ${this.feedbackData.length} feedback entries`);
            
        } catch (error) {
            console.error('Error fetching feedback:', error);
            throw error;
        }
    }

    showFeedbackLoading() {
        const tbody = document.getElementById('feedbackTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-row">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                            Loading feedback...
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    showFeedbackError(message) {
        const tbody = document.getElementById('feedbackTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="error-row">
                        <div class="error-message">
                            <i class="fas fa-exclamation-triangle"></i>
                            ${message}
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    renderFeedbackTable() {
        const tbody = document.getElementById('feedbackTableBody');
        if (!tbody) return;

        if (this.feedbackData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-row">
                        <div class="empty-state">
                            <i class="fas fa-comments"></i>
                            <p>No feedback received yet</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.feedbackData.map(feedback => {
            const submittedAt = new Date(feedback.submitted_at);
            const formattedDate = submittedAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <tr>
                    <td class="feedback-id">#${feedback.id}</td>
                    <td class="feedback-message">
                        <div class="message-content">
                            ${this.truncateMessage(feedback.message, 80)}
                        </div>
                    </td>
                    <td class="feedback-date">${formattedDate}</td>
                    <td class="feedback-actions">
                        <button class="btn-view" onclick="adminPanel.viewFeedback(${feedback.id})" title="View Full Message">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    truncateMessage(message, maxLength) {
        if (message.length <= maxLength) {
            return message;
        }
        return message.substring(0, maxLength) + '...';
    }

    updateFeedbackStats() {
        const totalFeedback = this.feedbackData.length;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentFeedback = this.feedbackData.filter(feedback => 
            new Date(feedback.submitted_at) >= sevenDaysAgo
        ).length;

        const totalElement = document.getElementById('totalFeedback');
        const recentElement = document.getElementById('recentFeedback');
        
        if (totalElement) totalElement.textContent = totalFeedback;
        if (recentElement) recentElement.textContent = recentFeedback;
    }

    viewFeedback(feedbackId) {
        const feedback = this.feedbackData.find(f => f.id === feedbackId);
        if (!feedback) return;

        const submittedAt = new Date(feedback.submitted_at);
        const formattedDate = submittedAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content feedback-modal">
                <div class="modal-header">
                    <h3>Feedback #${feedback.id}</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="feedback-details">
                    <div class="feedback-meta">
                        <div class="meta-item">
                            <strong>Submitted:</strong> ${formattedDate}
                        </div>
                        <div class="meta-item">
                            <strong>ID:</strong> #${feedback.id}
                        </div>
                    </div>
                    <div class="feedback-message-full">
                        <h4>Message:</h4>
                        <div class="message-text">${feedback.message}</div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-close" onclick="this.closest('.modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    initializeCharts() {
        this.createRevenueChart();
        this.createOrdersChart();
        this.createCustomerTypeChart();
        this.createTopCustomersChart();
        this.createTopProductsChart();
        this.createColorPreferenceChart();
        this.createPromoCodeChart();
        this.createTrafficSourceChart();
    }

    createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: [25000, 35000, 28000, 45000, 52000, 38000],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    createOrdersChart() {
        const ctx = document.getElementById('ordersChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Orders',
                        data: [12, 8, 15, 10, 18, 25, 20],
                        backgroundColor: '#4ECDC4'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    createCustomerTypeChart() {
        const ctx = document.getElementById('customerTypeChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['New Customers', 'Returning Customers', 'VIP Customers'],
                    datasets: [{
                        data: [45, 35, 20],
                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFD700']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    createTopCustomersChart() {
        const ctx = document.getElementById('topCustomersChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Priya S.', 'Anita M.', 'Sunita K.', 'Meera P.', 'Kavya R.'],
                    datasets: [{
                        label: 'Total Spent (₹)',
                        data: [25000, 18000, 15000, 12000, 10000],
                        backgroundColor: '#667eea'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    createTopProductsChart() {
        const ctx = document.getElementById('topProductsChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Silk Saree', 'Cotton Saree', 'Designer Saree', 'Wedding Saree'],
                    datasets: [{
                        label: 'Units Sold',
                        data: [45, 38, 25, 20],
                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFD700', '#98D8C8']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    createColorPreferenceChart() {
        const ctx = document.getElementById('colorPreferenceChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Red', 'Blue', 'Green', 'Pink', 'Yellow', 'Others'],
                    datasets: [{
                        data: [25, 20, 15, 12, 8, 20],
                        backgroundColor: ['#FF0000', '#0000FF', '#008000', '#FFC0CB', '#FFFF00', '#808080']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    createPromoCodeChart() {
        const ctx = document.getElementById('promoCodeChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['WELCOME10', 'FIRST20', 'FREEDEL', 'No Promo'],
                    datasets: [{
                        data: [30, 25, 15, 30],
                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFD700', '#E0E0E0']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    createTrafficSourceChart() {
        const ctx = document.getElementById('trafficSourceChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Direct', 'Social Media', 'Search Engine', 'Referral'],
                    datasets: [{
                        data: [40, 30, 20, 10],
                        backgroundColor: ['#667eea', '#f093fb', '#4facfe', '#43e97b']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    async loadSalesAnalytics() {
        try {
            // Load orders for sales analytics
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Populate detailed orders table
            const detailedOrdersTable = document.getElementById('detailedOrdersTable');
            if (detailedOrdersTable && orders) {
                detailedOrdersTable.innerHTML = orders.slice(0, 20).map(order => {
                    const customerName = order.shipping_addr ? 
                        `${order.shipping_addr.firstName || ''} ${order.shipping_addr.lastName || ''}`.trim() : 'N/A';
                    const itemsCount = order.items ? order.items.length : 0;
                    const totalQuantity = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
                    const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A';
                    
                    return `
                        <tr>
                            <td>#${order.id.toString().slice(-8)}</td>
                            <td>${customerName}</td>
                            <td>${itemsCount}</td>
                            <td>${totalQuantity}</td>
                            <td>₹${(order.total_amount || 0).toLocaleString()}</td>
                            <td>${orderDate}</td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Error loading sales analytics:', error);
        }
    }

    async loadCustomerAnalytics() {
        try {
            // Use existing customers data
            const customerDetailsTable = document.getElementById('customerDetailsTable');
            if (customerDetailsTable && this.customers) {
                customerDetailsTable.innerHTML = this.customers.slice(0, 15).map(customer => {
                    const lastOrderDate = customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A';
                    
                    return `
                        <tr>
                            <td>${customer.name || 'N/A'}</td>
                            <td>${customer.email || 'N/A'}</td>
                            <td>${customer.phone || 'N/A'}</td>
                            <td>${customer.orderCount || 0}</td>
                            <td>₹${(customer.totalSpent || 0).toLocaleString()}</td>
                            <td>${lastOrderDate}</td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Error loading customer analytics:', error);
        }
    }

    async loadProductAnalytics() {
        try {
            // Load products for analytics
            const { data: products, error } = await supabase
                .from('products')
                .select('*');
            
            if (error) throw error;
            
            // Populate product performance table
            const productPerformanceTable = document.getElementById('productPerformanceTable');
            if (productPerformanceTable && products) {
                productPerformanceTable.innerHTML = products.slice(0, 15).map(product => {
                    const stockStatus = (product.stock || 0) > 10 ? 'In Stock' : 
                                       (product.stock || 0) > 0 ? 'Low Stock' : 'Out of Stock';
                    const statusClass = (product.stock || 0) > 10 ? 'status-delivered' : 
                                       (product.stock || 0) > 0 ? 'status-pending' : 'status-cancelled';
                    
                    return `
                        <tr>
                            <td>${product.name || 'N/A'}</td>
                            <td>${product.category || 'N/A'}</td>
                            <td>0</td>
                            <td>₹0</td>
                            <td>${product.stock || 0}</td>
                            <td><span class="status-badge ${statusClass}">${stockStatus}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Error loading product analytics:', error);
        }
    }

    async loadMarketingAnalytics() {
        try {
            // Populate campaign performance table with sample data
            const campaignPerformanceTable = document.getElementById('campaignPerformanceTable');
            if (campaignPerformanceTable) {
                const sampleCampaigns = [
                    { name: 'Festival Sale', type: 'Discount', clicks: 1250, conversions: 85, revenue: 42500, roi: '240%' },
                    { name: 'New Collection', type: 'Product Launch', clicks: 890, conversions: 45, revenue: 22500, roi: '180%' },
                    { name: 'Social Media', type: 'Brand Awareness', clicks: 2100, conversions: 120, revenue: 60000, roi: '320%' }
                ];
                
                campaignPerformanceTable.innerHTML = sampleCampaigns.map(campaign => `
                    <tr>
                        <td>${campaign.name}</td>
                        <td>${campaign.type}</td>
                        <td>${campaign.clicks.toLocaleString()}</td>
                        <td>${campaign.conversions}</td>
                        <td>₹${campaign.revenue.toLocaleString()}</td>
                        <td>${campaign.roi}</td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading marketing analytics:', error);
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
        if (form) {
            form.reset();
            
            // Remove any existing product ID
            delete form.dataset.productId;
        }
        
        // Clear existing images
        const existingImages = document.getElementById('existingImages');
        if (existingImages) {
            existingImages.style.display = 'none';
            const grid = existingImages.querySelector('.existing-images-grid');
            if (grid) {
                grid.innerHTML = '';
            }
        }
        
        // Reset image inputs to single input
        const imageInputs = document.getElementById('imageInputs');
        if (imageInputs) {
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
        }
        
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
        const colorNameInput = variantItem.querySelector('.color-name');
        const variantTitle = variantItem.querySelector('.variant-title span');
        
        if (colorPicker && colorIcon) {
            colorPicker.addEventListener('change', (e) => {
                colorIcon.style.color = e.target.value;
            });
        }
        
        if (colorNameInput && variantTitle) {
            colorNameInput.addEventListener('input', (e) => {
                const variantNumber = variantTitle.textContent.match(/Color Variant (\d+)/)?.[1] || '1';
                const colorName = e.target.value.trim() || 'Unnamed';
                variantTitle.textContent = `Color Variant ${variantNumber} - ${colorName}`;
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

