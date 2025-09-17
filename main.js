// Global Variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];

console.log('Initial cart loaded:', cart);
console.log('Cart length:', cart.length);

// Function to refresh cart from localStorage
function refreshCart() {
    const storedCart = localStorage.getItem('cart');
    console.log('Stored cart in localStorage:', storedCart);
    
    if (storedCart) {
        try {
            cart = JSON.parse(storedCart);
            console.log('Cart refreshed from localStorage:', cart);
        } catch (error) {
            console.error('Error parsing cart from localStorage:', error);
            cart = [];
        }
    } else {
        console.log('No cart found in localStorage, using empty array');
        cart = [];
    }
    
    console.log('Final cart state:', cart);
    console.log('Cart length:', cart.length);
}

// Supabase Configuration
const SUPABASE_URL = 'https://jstvadizuzvwhabtfhfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdHZhZGl6dXp2d2hhYnRmaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjI3NjAsImV4cCI6MjA3MjIzODc2MH0.6btNpJfUh6Fd5PfoivIvu-f31Fj5IXl1vxBLsHz5ISw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Products will be loaded from Supabase
let products = [];

// Fetch products from Supabase
async function fetchProductsFromSupabase() {
    try {
        console.log('🔄 Fetching products from Supabase...');
        console.log('Supabase URL:', SUPABASE_URL);
        console.log('Supabase client:', supabase);
        
        const { data, error } = await supabase
            .from('products')
            .select('*');
        
        console.log('Supabase response - data:', data);
        console.log('Supabase response - error:', error);
        
        if (error) {
            console.error('❌ Supabase error:', error);
            return null;
        }
        
        if (!data || data.length === 0) {
            console.warn('⚠️ No products found in Supabase');
            return null;
        }
        
        console.log('✅ Raw data from Supabase:', data);
        
        const mappedProducts = data.map(row => ({
            id: row.id,
            name: row.name,
            price: row.price,
            originalPrice: row.originalPrice || row.original_price,
            image: row.images && row.images.length > 0 ? row.images[0] : null,
            category: row.category,
            rating: row.rating || 4.5,
            description: row.description,
            colors: row.colors || ['Red', 'Blue', 'Green'],
            sizes: row.sizes || ['Free Size'],
            fabric: row.fabric,
            reviews: row.reviews || 50
        }));
        
        console.log('✅ Mapped products:', mappedProducts);
        return mappedProducts;
        
    } catch (error) {
        console.error('❌ Error fetching from Supabase:', error);
        return null;
    }
}

// Main fetch products function with fallback
async function fetchProducts() {
    console.log('🚀 Starting fetchProducts...');
    
    try {
        console.log('🔍 Attempting to fetch from Supabase...');
        const supabaseProducts = await fetchProductsFromSupabase();
        
        if (supabaseProducts && supabaseProducts.length > 0) {
            products = supabaseProducts;
            console.log('✅ Products loaded from Supabase:', products.length);
            console.log('Products:', products);
        } else {
            console.warn('⚠️ No products from Supabase, using fallback');
            throw new Error('No products from Supabase');
        }
    } catch (error) {
        console.error('❌ Supabase failed, using fallback products:', error);
        products = [
            {
                id: 1,
                name: "Silk Banarasi Saree",
                price: 15000,
                originalPrice: 18000,
                image: "https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Silk+Banarasi",
                category: "silk",
                rating: 4.8,
                reviews: 156,
                description: "Exquisite Banarasi silk saree with intricate zari work",
                colors: ["Red", "Green", "Blue"],
                sizes: ["Free Size"],
                fabric: "Silk"
            },
            {
                id: 2,
                name: "Cotton Handloom Saree",
                price: 2500,
                originalPrice: 3000,
                image: "https://via.placeholder.com/300x400/4ECDC4/FFFFFF?text=Cotton+Handloom",
                category: "cotton",
                rating: 4.5,
                reviews: 89,
                description: "Comfortable cotton handloom saree for daily wear",
                colors: ["White", "Beige", "Pink"],
                sizes: ["Free Size"],
                fabric: "Cotton"
            },
            {
                id: 3,
                name: "Designer Georgette Saree",
                price: 8000,
                originalPrice: 10000,
                image: "https://via.placeholder.com/300x400/45B7D1/FFFFFF?text=Designer+Georgette",
                category: "designer",
                rating: 4.7,
                reviews: 203,
                description: "Elegant designer georgette saree with modern aesthetics",
                colors: ["Purple", "Teal", "Maroon"],
                sizes: ["Free Size"],
                fabric: "Georgette"
            }
        ];
    }
    
    // Store products and load them
    loadProducts();
}

// Check user authentication status
function checkUserAuth() {
    const session = localStorage.getItem('userSession');
    const loginLink = document.getElementById('loginLink');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (session && loginLink && userMenu) {
        const user = JSON.parse(session);
        loginLink.style.display = 'none';
        userMenu.style.display = 'block';
        if (userName) {
            userName.textContent = `Welcome, ${user.email.split('@')[0]}!`;
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('userSession');
    window.location.reload();
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing...');
    
    // Check user authentication
    checkUserAuth();
    
    await fetchProducts();
    updateCartCount();
    loadTrendingProducts();
    loadFeaturedProducts();
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'collections.html') {
        setupCategoryFilters();
    } else if (currentPage === 'cart.html' || currentPage === '') {
        setupCartPage();
    } else if (currentPage === 'address.html') {
        setupAddressPage();
    } else if (currentPage === 'checkout.html') {
        setupCheckoutPage();
    }
});

// Attach event listeners to Add to Cart buttons
function attachAddToCartListeners() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => addToCart(button));
    });
}

// Cart Functions
function addToCart(button) {
    const productId = button.getAttribute('data-id');
    console.log('🛒 Adding to cart - productId:', productId);
    console.log('🛒 Available products:', products);
    
    const product = products.find(p => p.id.toString() === productId);
    console.log('🛒 Found product:', product);
    
    if (product) {
        const existingItem = cart.find(item => item.id.toString() === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
        updateCartCount();
        showNotification('Added to cart!');
    } else {
        console.error('❌ Product not found for ID:', productId);
    }
}

function removeFromCart(productId) {
    console.log('Removing from cart:', productId);
    cart = cart.filter(item => item.id != productId);
    saveCart();
    updateCartCount();
    displayCartItems();
    showNotification('Removed from cart!');
}

function updateCartItemQuantity(productId, newQuantity) {
    console.log('Updating quantity:', productId, newQuantity);
    const item = cart.find(item => item.id == productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart();
            updateCartCount();
            displayCartItems();
        }
    }
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartCount();
    displayCartItems();
    showNotification('Cart cleared!');
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10000;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Load Products
function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if (grid) {
        grid.innerHTML = products.map(product => {
            let imageUrl;
            if (product.image && product.image.startsWith('http')) {
                imageUrl = product.image;
            } else if (product.image) {
                imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${product.image}`;
            } else {
                imageUrl = `https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=${encodeURIComponent(product.name || 'Product')}`;
            }
            
            return `
            <div class="product-card" data-product-id="${product.id}">
                <img src="${imageUrl}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">₹${product.price.toLocaleString()}</div>
                    <div class="product-rating">
                        <div class="stars">
                            ${generateStars(product.rating)}
                        </div>
                        <span>${product.rating} (${product.reviews})</span>
                    </div>
                    <button class="add-to-cart add-to-cart-btn" data-id="${product.id}" onclick="event.stopPropagation()">
                        Add to Cart
                    </button>
                </div>
            </div>
            `;
        }).join('');
        
        // Add click listeners
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.add-to-cart-btn')) {
                    const productId = card.dataset.productId;
                    window.location.href = `product.html?id=${productId}`;
                }
            });
        });
        attachAddToCartListeners();
    }
}

function loadTrendingProducts() {
    const grid = document.getElementById('trendingProducts');
    if (grid) {
        const trending = products.slice(0, 4);
        grid.innerHTML = trending.map(product => {
            let imageUrl;
            if (product.image && product.image.startsWith('http')) {
                imageUrl = product.image;
            } else if (product.image) {
                imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${product.image}`;
            } else {
                imageUrl = `https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=${encodeURIComponent(product.name || 'Product')}`;
            }
            
            return `
            <div class="product-card" data-product-id="${product.id}">
                <img src="${imageUrl}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">₹${product.price.toLocaleString()}</div>
                    <div class="product-rating">
                        <div class="stars">
                            ${generateStars(product.rating)}
                        </div>
                        <span>${product.rating} (${product.reviews})</span>
                    </div>
                    <button class="add-to-cart add-to-cart-btn" data-id="${product.id}" onclick="event.stopPropagation()">
                        Add to Cart
                    </button>
                </div>
            </div>
            `;
        }).join('');
        
        // Add click listeners
        document.querySelectorAll('#trendingProducts .product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.add-to-cart-btn')) {
                    const productId = card.dataset.productId;
                    window.location.href = `product.html?id=${productId}`;
                }
            });
        });
        attachAddToCartListeners();
    }
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

// Cart Display
function displayCartItems() {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    const cartItemCount = document.getElementById('cartItemCount');
    
    if (!cartItemsList) return;
    
    if (cart.length === 0) {
        cartItemsList.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartItemCount) cartItemCount.textContent = '0';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    cartItemsList.style.display = 'block';
    
    if (cartItemCount) cartItemCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    cartItemsList.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="qty-decrease" data-id="${item.id}">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="qty-increase" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-item-btn" data-id="${item.id}">Remove</button>
                </div>
            </div>
            <div class="cart-item-total">
                ₹${(item.price * item.quantity).toLocaleString()}
            </div>
        </div>
    `).join('');
    
    // Add event listeners to the buttons
    document.querySelectorAll('.qty-decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            const item = cart.find(item => item.id == productId);
            if (item) {
                updateCartItemQuantity(productId, item.quantity - 1);
            }
        });
    });
    
    document.querySelectorAll('.qty-increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            const item = cart.find(item => item.id == productId);
            if (item) {
                updateCartItemQuantity(productId, item.quantity + 1);
            }
        });
    });
    
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            removeFromCart(productId);
        });
    });
    
    updateOrderSummary();
}

function updateOrderSummary() {
    console.log('updateOrderSummary called with cart:', cart);
    console.log('Cart length:', cart.length);
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharges = subtotal > 999 ? 0 : 200;
    const total = subtotal + deliveryCharges;
    
    console.log('Calculated values - Subtotal:', subtotal, 'Delivery:', deliveryCharges, 'Total:', total);
    
    const summaryElements = document.querySelectorAll('#subtotal, #deliveryCharges, #total');
    console.log('Found summary elements:', summaryElements.length);
    
    if (summaryElements[0]) {
        summaryElements[0].textContent = `₹${subtotal.toLocaleString()}`;
        console.log('Updated subtotal element');
    }
    if (summaryElements[1]) {
        summaryElements[1].textContent = `₹${deliveryCharges.toLocaleString()}`;
        console.log('Updated delivery charges element');
    }
    if (summaryElements[2]) {
        summaryElements[2].textContent = `₹${total.toLocaleString()}`;
        console.log('Updated total element');
    }
    
    // Also update cart item count if present
    const cartItemCount = document.getElementById('cartItemCount');
    if (cartItemCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartItemCount.textContent = totalItems;
        console.log('Updated cart item count:', totalItems);
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        console.log('Checkout button found, cart length:', cart.length);
        checkoutBtn.disabled = cart.length === 0;
        console.log('Checkout button disabled:', checkoutBtn.disabled);
    } else {
        console.log('Checkout button not found');
    }
}

// View Product
function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Setup cart page interactions
function setupCartPage() {
    console.log('Setting up cart page...');
    
    // Refresh cart from localStorage to ensure we have latest data
    refreshCart();
    
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        console.log('Clear cart button found, adding event listener');
        clearCartBtn.addEventListener('click', clearCart);
    } else {
        console.log('Clear cart button not found');
    }
    
    // Setup checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        console.log('Checkout button found, setting up click handler');
        checkoutBtn.onclick = () => {
            console.log('Checkout button clicked, cart length:', cart.length);
            if (cart.length > 0) {
                console.log('Navigating to address page');
                window.location.href = 'address.html';
            } else {
                console.log('Cart is empty, cannot checkout');
                alert('Your cart is empty! Please add items before checkout.');
            }
        };
    } else {
        console.log('Checkout button not found');
    }
    
    // Load cart items and update display
    console.log('Loading cart items...');
    displayCartItems();
    updateOrderSummary();
}

// Setup checkout page interactions
function setupCheckoutPage() {
    console.log('Setting up checkout page...');
    
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    
    if (placeOrderBtn) {
        console.log('Place order button found, setting up...');
        
        // Enable place order button if cart has items
        updatePlaceOrderButtonState();
        
        // Add click event listener
        placeOrderBtn.addEventListener('click', handlePlaceOrderWithPayment);
        
        // Add terms checkbox change listener
        const agreeTerms = document.getElementById('agreeTerms');
        if (agreeTerms) {
            agreeTerms.addEventListener('change', updatePlaceOrderButtonState);
        }
    } else {
        console.log('Place order button not found');
    }
    
    // Setup payment method change handlers
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            const selectedMethod = e.target.value;
            console.log('Payment method changed to:', selectedMethod);
            // Show/hide payment forms based on selection
            togglePaymentForms(selectedMethod);
            // Update button state when payment method changes
            updatePlaceOrderButtonState();
        });
    });
    
    // Load order summary, address, and items
    loadCheckoutData();
    displayOrderItems();
    
    console.log('Checkout page setup complete');
}

// Update place order button state based on validation
function updatePlaceOrderButtonState() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (!placeOrderBtn) return;
    
    // Check if cart has items
    const hasItems = cart.length > 0;
    
    // Check if address is provided
    const addressData = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    const hasAddress = !!addressData.firstName;
    
    // Check if payment method is selected
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const hasPaymentMethod = !!paymentMethod;
    
    // Check if terms are agreed
    const agreeTerms = document.getElementById('agreeTerms');
    const hasAgreedTerms = agreeTerms ? agreeTerms.checked : true;
    
    // Determine if button should be enabled
    const shouldEnable = hasItems && hasAddress && hasPaymentMethod && hasAgreedTerms;
    
    console.log('Button state check:', {
        hasItems,
        hasAddress,
        hasPaymentMethod,
        hasAgreedTerms,
        shouldEnable
    });
    
    // Update button state
    placeOrderBtn.disabled = !shouldEnable;
    
    if (shouldEnable) {
        placeOrderBtn.classList.remove('disabled');
        placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Place Order Securely';
    } else {
        placeOrderBtn.classList.add('disabled');
        placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Complete All Steps to Place Order';
    }
}

// Toggle payment forms based on selection
function togglePaymentForms(selectedMethod) {
    // Hide all payment forms
    const forms = ['cardPaymentForm', 'upiPaymentForm', 'netbankingPaymentForm'];
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) form.style.display = 'none';
    });
    
    // Show selected form
    switch (selectedMethod) {
        case 'card':
            const cardForm = document.getElementById('cardPaymentForm');
            if (cardForm) cardForm.style.display = 'block';
            break;
        case 'upi':
            const upiForm = document.getElementById('upiPaymentForm');
            if (upiForm) upiForm.style.display = 'block';
            break;
        case 'netbanking':
            const netbankingForm = document.getElementById('netbankingPaymentForm');
            if (netbankingForm) netbankingForm.style.display = 'block';
            break;
        case 'razorpay':
            // Razorpay doesn't need a form, it opens the payment gateway
            console.log('Razorpay selected - will open payment gateway');
            break;
        default:
            console.log('No specific form for payment method:', selectedMethod);
    }
}

// Handle address form submission

// Setup address page interactions
function setupAddressPage() {
    console.log('Setting up address page...');
    
    // Refresh cart from localStorage to ensure we have latest data
    refreshCart();
    
    const addressForm = document.getElementById('addressForm');
    const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');
    
    if (addressForm) {
        console.log('Address form found, setting up submit handler');
        addressForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAddressSubmit();
        });
    } else {
        console.log('Address form not found');
    }
    
    if (proceedToCheckoutBtn) {
        console.log('Proceed to checkout button found, setting up click handler');
        proceedToCheckoutBtn.addEventListener('click', () => {
            console.log('Proceed to checkout clicked, cart length:', cart.length);
            if (cart.length > 0) {
                // Save address to localStorage
                const formData = new FormData(addressForm);
                const addressData = {
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    email: formData.get('email'),
                    mobile: formData.get('mobile'),
                    addressLine1: formData.get('addressLine1'),
                    addressLine2: formData.get('addressLine2'),
                    city: formData.get('city'),
                    state: formData.get('state'),
                    pincode: formData.get('pincode')
                };
                localStorage.setItem('deliveryAddress', JSON.stringify(addressData));
                
                console.log('Address saved, navigating to checkout...');
                // Navigate to checkout
                window.location.href = 'checkout.html';
            } else {
                console.log('Cart is empty, showing alert');
                alert('Your cart is empty! Please add items before checkout.');
            }
        });
    } else {
        console.log('Proceed to checkout button not found');
    }
    
    // Load order summary
    console.log('Loading order summary on address page...');
    updateOrderSummary();
    
    // Also display cart items if the container exists
    const cartItemsContainer = document.getElementById('cartItemsList');
    if (cartItemsContainer) {
        console.log('Cart items container found, displaying items...');
        displayCartItems();
    } else {
        console.log('Cart items container not found on address page');
    }
}

// Handle address form submission
function handleAddressSubmit() {
    const formData = new FormData(document.getElementById('addressForm'));
    const addressData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        mobile: formData.get('mobile'),
        addressLine1: formData.get('addressLine1'),
        addressLine2: formData.get('addressLine2'),
        city: formData.get('city'),
        state: formData.get('state'),
        pincode: formData.get('pincode')
    };
    
    // Save to localStorage
    localStorage.setItem('deliveryAddress', JSON.stringify(addressData));
    
    // Navigate to checkout
    window.location.href = 'checkout.html';
}

// Load checkout data
function loadCheckoutData() {
    console.log('Loading checkout data...');
    
    // Refresh cart from localStorage to ensure we have latest data
    refreshCart();
    
    // Load address from localStorage
    const addressData = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    if (addressData.firstName) {
        const addressDisplay = document.getElementById('addressDisplay');
        if (addressDisplay) {
            addressDisplay.innerHTML = `
                <div class="address-info">
                    <h4>${addressData.firstName} ${addressData.lastName}</h4>
                    <p>${addressData.addressLine1}</p>
                    ${addressData.addressLine2 ? `<p>${addressData.addressLine2}</p>` : ''}
                    <p>${addressData.city}, ${addressData.state} - ${addressData.pincode}</p>
                    <p>Mobile: ${addressData.mobile}</p>
                    <p>Email: ${addressData.email}</p>
                </div>
            `;
        }
    }
    
    // Load order summary
    updateOrderSummary();
}

// Legacy handlePlaceOrder function for backward compatibility
function handlePlaceOrder() {
    console.log('Legacy handlePlaceOrder called, redirecting to new function');
    // This function is kept for backward compatibility
    // In the new flow, this should not be called directly
    alert('Please use the Place Order button on the checkout page.');
}

// Show order confirmation modal
function showOrderConfirmation(order) {
    console.log('Showing order confirmation for order:', order.id);
    
    try {
        // Update modal content
        const orderNumber = document.getElementById('orderNumber');
        const orderTotal = document.getElementById('orderTotal');
        
        if (orderNumber) orderNumber.textContent = order.id;
        if (orderTotal) orderTotal.textContent = `₹${order.total.toLocaleString()}`;
        
        // Show modal
        const modal = document.getElementById('orderConfirmationModal');
        if (modal) {
            modal.style.display = 'block';
            
            // Auto-hide modal after 10 seconds and redirect
            setTimeout(() => {
                modal.style.display = 'none';
                window.location.href = 'index.html';
            }, 10000);
        } else {
            // Fallback if modal doesn't exist
            alert(`Order placed successfully!\n\nOrder ID: ${order.id}\nTotal Amount: ₹${order.total.toLocaleString()}\n\nThank you for shopping with us!`);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error showing order confirmation:', error);
        // Fallback confirmation
        alert(`Order placed successfully!\n\nOrder ID: ${order.id}\nTotal Amount: ₹${order.total.toLocaleString()}`);
        window.location.href = 'index.html';
    }
}

// Mock Razorpay integration for testing
function initializeRazorpay(orderAmount) {
    console.log('Initializing Razorpay with amount:', orderAmount);
    
    // For testing purposes, create a mock payment flow
    const options = {
        key: 'rzp_test_MOCK_KEY', // Mock key for testing
        amount: orderAmount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'Shagun Saree Baran',
        description: 'Saree Purchase',
        image: 'https://via.placeholder.com/150x50/667eea/FFFFFF?text=Shagun+Saree',
        handler: function(response) {
            console.log('Payment successful:', response);
            alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);
            // Proceed with order placement
            processOrder(orderAmount, 'razorpay');
        },
        prefill: {
            name: 'Test Customer',
            email: 'test@example.com',
            contact: '9999999999'
        },
        theme: {
            color: '#667eea'
        }
    };
    
    // For testing, simulate payment success after 2 seconds
    setTimeout(() => {
        console.log('Simulating successful payment for testing');
        alert('Payment simulation successful! Proceeding with order...');
        processOrder(orderAmount, 'razorpay');
    }, 2000);
    
    // In real implementation, you would call:
    // const rzp = new Razorpay(options);
    // rzp.open();
}
// Enhanced place order with payment integration
function handlePlaceOrderWithPayment() {
    console.log('Handling place order with payment...');
    
    // Refresh cart from localStorage to ensure we have latest data
    refreshCart();
    
    // Validate cart
    if (!cart || cart.length === 0) {
        console.error('Cart validation failed - cart is empty');
        alert('Your cart is empty! Please add items before placing an order.');
        window.location.href = 'collections.html';
        return false;
    }
    
    // Validate address
    const addressData = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    if (!addressData.firstName) {
        console.error('Address validation failed - no address found');
        alert('Please provide delivery address first!');
        window.location.href = 'address.html';
        return false;
    }
    
    // Validate payment method
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (!paymentMethod) {
        console.error('Payment method validation failed - no method selected');
        alert('Please select a payment method!');
        return false;
    }
    
    // Validate terms and conditions
    const agreeTerms = document.getElementById('agreeTerms');
    if (agreeTerms && !agreeTerms.checked) {
        console.error('Terms validation failed - terms not agreed');
        alert('Please agree to the Terms and Conditions to continue.');
        return false;
    }
    
    // Calculate order total
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharges = subtotal > 999 ? 0 : 200;
    const total = subtotal + deliveryCharges;
    
    console.log('Order validation passed. Total:', total);
    console.log('Payment method:', paymentMethod);
    console.log('Cart items:', cart.length);
    
    // Disable the button to prevent double clicks
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Order...';
    }
    
    try {
        // Initialize payment based on method
        if (paymentMethod === 'razorpay') {
            initializeRazorpay(total);
        } else {
            // For other payment methods, proceed directly
            const result = processOrder(total, paymentMethod);
            if (!result) {
                // Re-enable button if order failed
                if (placeOrderBtn) {
                    placeOrderBtn.disabled = false;
                    placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Place Order Securely';
                }
            }
            return result;
        }
    } catch (error) {
        console.error('Error in handlePlaceOrderWithPayment:', error);
        alert('There was an error processing your order. Please try again.');
        
        // Re-enable button
        if (placeOrderBtn) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Place Order Securely';
        }
        return false;
    }
}

// Process order after payment (or for COD)
function processOrder(total, paymentMethod) {
    console.log('=== PROCESSING ORDER ===');
    console.log('Total:', total);
    console.log('Payment method:', paymentMethod);
    console.log('Cart items:', cart);
    console.log('Cart length:', cart.length);
    
    // Validate cart is not empty
    if (!cart || cart.length === 0) {
        console.error('Cart is empty, cannot process order');
        alert('Your cart is empty. Please add items before placing an order.');
        return false;
    }
    
    const addressData = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    console.log('Address data:', addressData);
    
    // Validate address data
    if (!addressData.firstName) {
        console.error('Address data is missing');
        alert('Delivery address is required. Please provide your address.');
        window.location.href = 'address.html';
        return false;
    }
    
    // Create order object
    const order = {
        id: 'ORD' + Date.now(),
        items: [...cart], // Create a copy of cart items
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        deliveryCharges: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) > 999 ? 0 : 200,
        total: total,
        address: { ...addressData }, // Create a copy of address data
        paymentMethod: paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'confirmed',
        createdAt: new Date().toISOString()
    };
    
    console.log('Order created:', order);
    
    try {
        // Validate order data before saving
        if (!order.id || !order.items || order.items.length === 0 || !order.total) {
            throw new Error('Invalid order data');
        }
        
        // Save order to localStorage (in real app, this would go to backend)
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log('Order saved to localStorage');
        
        // Clear cart after successful order
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        console.log('Cart cleared');
        
        // Show order confirmation
        showOrderConfirmation(order);
        console.log('Order confirmation shown');
        
        return true;
    } catch (error) {
        console.error('Error processing order:', error);
        alert('There was an error processing your order. Please try again.');
        return false;
    }
}

// Display order items in the order review section
function displayOrderItems() {
    console.log('Displaying order items...');
    
    const orderItemsContainer = document.getElementById('orderItems');
    if (!orderItemsContainer) {
        console.log('Order items container not found');
        return;
    }
    
    if (cart.length === 0) {
        orderItemsContainer.innerHTML = '<p class="no-items">No items in cart</p>';
        return;
    }
    
    const itemsHTML = cart.map(item => `
        <div class="order-item">
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="item-details">
                <h4 class="item-name">${item.name}</h4>
                <div class="item-meta">
                    <span class="item-price">₹${item.price.toLocaleString()}</span>
                    <span class="item-quantity">Qty: ${item.quantity}</span>
                </div>
            </div>
            <div class="item-total">
                ₹${(item.price * item.quantity).toLocaleString()}
            </div>
        </div>
    `).join('');
    
    orderItemsContainer.innerHTML = itemsHTML;
    console.log('Order items displayed:', cart.length, 'items');
}

// Test function to debug order placement
function testOrderPlacement() {
    console.log('=== TESTING ORDER PLACEMENT ===');
    console.log('Current cart:', cart);
    console.log('Cart length:', cart.length);
    
    // Add a test item if cart is empty
    if (cart.length === 0) {
        console.log('Cart is empty, adding test item');
        cart.push({
            id: 'test-1',
            name: 'Test Saree',
            price: 1000,
            image: 'test.jpg',
            quantity: 1
        });
        saveCart();
        console.log('Test item added to cart');
    }
    
    // Test address
    const addressData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        mobile: '9999999999',
        addressLine1: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
    };
    localStorage.setItem('deliveryAddress', JSON.stringify(addressData));
    console.log('Test address saved');
    
    // Test order placement
    console.log('Testing order placement...');
    const result = processOrder(1200, 'cod');
    console.log('Order placement result:', result);
    
    return result;
}

// Make test function available globally
window.testOrderPlacement = testOrderPlacement;

// Test Supabase connection
async function testSupabaseConnection() {
    console.log('🧪 Testing Supabase connection...');
    console.log('URL:', SUPABASE_URL);
    console.log('Key:', SUPABASE_ANON_KEY ? 'Present' : 'Missing');
    
    try {
        const { data, error } = await supabase
            .from('products')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('❌ Supabase test failed:', error);
            return false;
        }
        
        console.log('✅ Supabase connection successful');
        return true;
    } catch (err) {
        console.error('❌ Supabase test error:', err);
        return false;
    }
}

// Make test function available globally
window.testSupabaseConnection = testSupabaseConnection;

// Product Detail Modal Functions
let currentProduct = null;

function openProductDetail(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    currentProduct = product;
    
    // Populate modal
    document.getElementById('productTitle').textContent = product.name;
    document.getElementById('productPrice').textContent = `₹${product.price.toLocaleString()}`;
    document.getElementById('productOriginalPrice').textContent = product.originalPrice ? `₹${product.originalPrice.toLocaleString()}` : '';
    document.getElementById('productDescription').textContent = product.description || 'No description available';
    document.getElementById('productFabric').textContent = product.fabric || 'Not specified';
    document.getElementById('productCategory').textContent = product.category || 'General';
    document.getElementById('productStars').innerHTML = generateStars(product.rating);
    document.getElementById('productReviews').textContent = `${product.rating} (${product.reviews} reviews)`;
    
    // Set image
    let imageUrl;
    if (product.image && product.image.startsWith('http')) {
        imageUrl = product.image;
    } else if (product.image) {
        imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${product.image}`;
    } else {
        imageUrl = `https://via.placeholder.com/400x500/FF6B6B/FFFFFF?text=${encodeURIComponent(product.name)}`;
    }
    document.getElementById('mainProductImage').src = imageUrl;
    
    // Show colors
    const colorsContainer = document.querySelector('#productColors .colors-list');
    if (product.colors && product.colors.length > 0) {
        colorsContainer.innerHTML = product.colors.map(color => 
            `<span class="color-tag">${color}</span>`
        ).join('');
        document.getElementById('productColors').style.display = 'block';
    } else {
        document.getElementById('productColors').style.display = 'none';
    }
    
    // Show modal
    document.getElementById('productModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentProduct = null;
}

function increaseQuantity() {
    const input = document.getElementById('modalQuantity');
    input.value = parseInt(input.value) + 1;
}

function decreaseQuantity() {
    const input = document.getElementById('modalQuantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

function addToCartFromModal() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('modalQuantity').value);
    const existingItem = cart.find(item => item.id == currentProduct.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...currentProduct, quantity });
    }
    
    saveCart();
    updateCartCount();
    showNotification(`Added ${quantity} item(s) to cart!`);
    closeProductModal();
}

function buyNowFromModal() {
    if (!currentProduct) return;
    
    addToCartFromModal();
    window.location.href = 'address.html';
}

function buyNow(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    // Add to cart
    const existingItem = cart.find(item => item.id == productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    updateCartCount();
    
    // Go directly to address page first, then checkout
    window.location.href = 'address.html';
}

// Enhanced cart count animation
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.animation = 'bounce 0.5s ease-out';
        setTimeout(() => {
            el.style.animation = '';
        }, 500);
    });
}

function loadFeaturedProducts() {
    const grid = document.getElementById('featuredProducts');
    if (grid) {
        const featured = products.slice(0, 3);
        grid.innerHTML = featured.map(product => {
            let imageUrl;
            if (product.image && product.image.startsWith('http')) {
                imageUrl = product.image;
            } else if (product.image) {
                imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${product.image}`;
            } else {
                imageUrl = `https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=${encodeURIComponent(product.name || 'Product')}`;
            }
            
            return `
            <div class="featured-card" data-product-id="${product.id}">
                <div class="featured-image" onclick="window.location.href='product.html?id=${product.id}'">
                    <img src="${imageUrl}" alt="${product.name}" loading="lazy">
                </div>
                <div class="featured-info">
                    <h3 class="featured-title">${product.name}</h3>
                    <div class="featured-price">₹${product.price.toLocaleString()}</div>
                    <div class="featured-buttons">
                        <button class="add-to-cart-btn" data-id="${product.id}" onclick="event.stopPropagation(); addToCart(this)">
                            Add to Cart
                        </button>
                        <button class="buy-now-btn" onclick="event.stopPropagation(); buyNow('${product.id}')">
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }
}

// Make functions globally available
window.openProductDetail = openProductDetail;
window.closeProductModal = closeProductModal;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.addToCartFromModal = addToCartFromModal;
window.buyNowFromModal = buyNowFromModal;
window.buyNow = buyNow;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.clearCart = clearCart;

// Debug function
window.testModal = function() {
    console.log('Testing modal...');
    openProductDetail(1);
};
window.logout = logout;

// Category filter functionality
function setupCategoryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productsGrid = document.getElementById('productsGrid');
    
    if (!filterBtns.length || !productsGrid) return;
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const category = btn.dataset.category;
            filterProducts(category);
        });
    });
}

function filterProducts(category) {
    let filteredProducts;
    if (category === 'all') {
        filteredProducts = products;
    } else {
        filteredProducts = products.filter(p => {
            const productCategory = p.category ? p.category.toLowerCase() : '';
            const filterCategory = category.toLowerCase();
            return productCategory === filterCategory || productCategory.includes(filterCategory);
        });
    }
    
    console.log('Filtering by category:', category);
    console.log('All products:', products);
    console.log('Filtered products:', filteredProducts);
    
    const grid = document.getElementById('productsGrid');
    if (grid) {
        grid.innerHTML = filteredProducts.map(product => {
            let imageUrl;
            if (product.image && product.image.startsWith('http')) {
                imageUrl = product.image;
            } else if (product.image) {
                imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${product.image}`;
            } else {
                imageUrl = `https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=${encodeURIComponent(product.name || 'Product')}`;
            }
            
            return `
            <div class="product-card" data-product-id="${product.id}">
                <img src="${imageUrl}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">₹${product.price.toLocaleString()}</div>
                    <div class="product-rating">
                        <div class="stars">
                            ${generateStars(product.rating)}
                        </div>
                        <span>${product.rating} (${product.reviews})</span>
                    </div>
                    <button class="add-to-cart add-to-cart-btn" data-id="${product.id}" onclick="event.stopPropagation()">
                        Add to Cart
                    </button>
                </div>
            </div>
            `;
        }).join('');
        
        // Re-attach event listeners
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.add-to-cart-btn')) {
                    const productId = card.dataset.productId;
                    window.location.href = `product.html?id=${productId}`;
                }
            });
        });
        attachAddToCartListeners();
    }
}