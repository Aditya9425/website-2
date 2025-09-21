// Global Variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Function to refresh cart from localStorage
function refreshCart() {
    const storedCart = localStorage.getItem('cart');
    
    if (storedCart) {
        try {
            cart = JSON.parse(storedCart);
        } catch (error) {
            cart = [];
        }
    } else {
        cart = [];
    }
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
        const { data, error } = await supabase
            .from('products')
            .select('*');
        
        if (error || !data || data.length === 0) {
            return null;
        }
        
        const mappedProducts = data.map(row => ({
            id: row.id,
            name: row.name,
            price: row.price,
            originalPrice: row.originalPrice || row.original_price,
            image: row.images && row.images.length > 0 ? row.images[0] : null,
            images: row.images || [],
            category: row.category,
            rating: row.rating || 4.5,
            description: row.description,
            colors: row.colors || ['Red', 'Blue', 'Green'],
            color_variants: row.color_variants || [],
            sizes: row.sizes || ['Free Size'],
            fabric: row.fabric,
            reviews: row.reviews || 50
        }));
        
        return mappedProducts;
        
    } catch (error) {
        return null;
    }
}

// Main fetch products function with fallback
async function fetchProducts() {
    try {
        const supabaseProducts = await fetchProductsFromSupabase();
        
        if (supabaseProducts && supabaseProducts.length > 0) {
            products = supabaseProducts;
        } else {
            throw new Error('No products from Supabase');
        }
    } catch (error) {
        products = [
            {
                id: 1,
                name: "Silk Banarasi Saree",
                price: 15000,
                originalPrice: 18000,
                image: "https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Silk+Banarasi",
                images: [
                    "https://via.placeholder.com/500x600/FF6B6B/FFFFFF?text=Silk+Banarasi+1",
                    "https://via.placeholder.com/500x600/FF4444/FFFFFF?text=Silk+Banarasi+2",
                    "https://via.placeholder.com/500x600/FF8888/FFFFFF?text=Silk+Banarasi+3"
                ],
                category: "silk",
                rating: 4.8,
                reviews: 156,
                description: "Exquisite Banarasi silk saree with intricate zari work",
                colors: ["Red", "Green", "Blue"],
                color_variants: [],
                sizes: ["Free Size"],
                fabric: "Silk"
            },
            {
                id: 2,
                name: "Cotton Handloom Saree",
                price: 2500,
                originalPrice: 3000,
                image: "https://via.placeholder.com/300x400/4ECDC4/FFFFFF?text=Cotton+Handloom",
                images: [
                    "https://via.placeholder.com/500x600/4ECDC4/FFFFFF?text=Cotton+Handloom+1",
                    "https://via.placeholder.com/500x600/44AAA4/FFFFFF?text=Cotton+Handloom+2"
                ],
                category: "cotton",
                rating: 4.5,
                reviews: 89,
                description: "Comfortable cotton handloom saree for daily wear",
                colors: ["White", "Beige", "Pink"],
                color_variants: [],
                sizes: ["Free Size"],
                fabric: "Cotton"
            },
            {
                id: 3,
                name: "Designer Georgette Saree",
                price: 8000,
                originalPrice: 10000,
                image: "https://via.placeholder.com/300x400/45B7D1/FFFFFF?text=Designer+Georgette",
                images: [
                    "https://via.placeholder.com/500x600/45B7D1/FFFFFF?text=Designer+Georgette+1",
                    "https://via.placeholder.com/500x600/3399BB/FFFFFF?text=Designer+Georgette+2",
                    "https://via.placeholder.com/500x600/5577CC/FFFFFF?text=Designer+Georgette+3",
                    "https://via.placeholder.com/500x600/6688DD/FFFFFF?text=Designer+Georgette+4"
                ],
                category: "designer",
                rating: 4.7,
                reviews: 203,
                description: "Elegant designer georgette saree with modern aesthetics",
                colors: ["Purple", "Teal", "Maroon"],
                color_variants: [],
                sizes: ["Free Size"],
                fabric: "Georgette"
            }
        ];
    }
    
    // Store products and load them
    loadProducts();
}

// Authentication functions
async function loginUser(email, password) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();
        
        if (error || !data) {
            throw new Error('Invalid email or password');
        }
        
        const userSession = {
            id: data.id,
            email: data.email,
            mobile: data.mobile,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('userSession', JSON.stringify(userSession));
        return { success: true, user: userSession };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signupUser(email, mobile, password) {
    try {
        const { data, error } = await supabase
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

function checkUserAuth() {
    const session = localStorage.getItem('userSession');
    const loginLink = document.getElementById('loginLink');
    const profileLink = document.getElementById('profileLink');
    const signOutBtn = document.getElementById('signOutBtn');
    const userName = document.getElementById('userName');
    
    if (session) {
        const user = JSON.parse(session);
        // Hide login link, show profile and sign out buttons
        if (loginLink) loginLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'flex';
        if (signOutBtn) signOutBtn.style.display = 'block';
        if (userName) userName.textContent = user.email.split('@')[0];
    } else {
        // Show login link, hide profile and sign out buttons
        if (loginLink) loginLink.style.display = 'flex';
        if (profileLink) profileLink.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('userSession');
    showNotification('Logged out successfully!');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    initializeMobileMenu();
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
    cart = cart.filter(item => item.id != productId);
    saveCart();
    updateCartCount();
    displayCartItems();
    showNotification('Removed from cart!');
}

function updateCartItemQuantity(productId, newQuantity) {
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

function showNotification(message, type = 'success') {
    // Create a notification with different types
    const notification = document.createElement('div');
    notification.textContent = message;
    
    let backgroundColor;
    switch (type) {
        case 'success':
            backgroundColor = '#28a745';
            break;
        case 'error':
            backgroundColor = '#dc3545';
            break;
        case 'warning':
            backgroundColor = '#ffc107';
            break;
        case 'info':
            backgroundColor = '#17a2b8';
            break;
        default:
            backgroundColor = '#28a745';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
        max-width: 400px;
        word-wrap: break-word;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, type === 'error' ? 5000 : 3000); // Show errors longer
}

// Load Products
function loadProducts() {
    displayProducts(products);
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
            
            const colorPalette = generateColorPalette(product);
            
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
                    ${colorPalette}
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
                if (!e.target.closest('.add-to-cart-btn') && !e.target.closest('.color-dot')) {
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
    
    cartItemsList.innerHTML = cart.map(item => {
        let imageUrl;
        if (item.image && item.image.startsWith('http')) {
            imageUrl = item.image;
        } else if (item.image) {
            imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${item.image}`;
        } else {
            imageUrl = `https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=${encodeURIComponent(item.name || 'Product')}`;
        }
        
        return `
        <div class="cart-item">
            <div class="cart-item-top">
                <img src="${imageUrl}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
                </div>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button class="quantity-btn qty-decrease" data-id="${item.id}">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" readonly>
                    <button class="quantity-btn qty-increase" data-id="${item.id}">+</button>
                </div>
                <button class="remove-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            <div class="cart-item-total">₹${(item.price * item.quantity).toLocaleString()}</div>
        </div>
        `;
    }).join('');
    
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
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            removeFromCart(productId);
        });
    });
    
    updateOrderSummary();
}

function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharges = 0;
    const total = subtotal + deliveryCharges;
    
    const summaryElements = document.querySelectorAll('#subtotal, #deliveryCharges, #total');
    
    if (summaryElements[0]) {
        summaryElements[0].textContent = `₹${subtotal.toLocaleString()}`;
    }
    if (summaryElements[1]) {
        summaryElements[1].textContent = `₹${deliveryCharges.toLocaleString()}`;
    }
    if (summaryElements[2]) {
        summaryElements[2].textContent = `₹${total.toLocaleString()}`;
    }
    
    const cartItemCount = document.getElementById('cartItemCount');
    if (cartItemCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartItemCount.textContent = totalItems;
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
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
            
            // Check if user is logged in
            const userSession = localStorage.getItem('userSession');
            if (!userSession) {
                alert('Please login to continue with checkout.');
                window.location.href = 'auth.html';
                return;
            }
            
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
    
    // Check if this is a buy now flow
    const urlParams = new URLSearchParams(window.location.search);
    const isBuyNow = urlParams.get('buyNow') === 'true';
    
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const payNowBtn = document.getElementById('payNowBtn');
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    
    // Setup the appropriate button based on checkout type
    const activeBtn = payNowBtn || placeOrderBtn;
    if (activeBtn) {
        console.log('Payment button found, setting up...');
        
        // Enable button if items exist
        updatePlaceOrderButtonState(isBuyNow);
        
        // Add click event listener
        activeBtn.addEventListener('click', () => handlePlaceOrderWithPayment(isBuyNow));
        
        // Add terms checkbox change listener
        const agreeTerms = document.getElementById('agreeTerms');
        if (agreeTerms) {
            agreeTerms.addEventListener('change', () => updatePlaceOrderButtonState(isBuyNow));
        }
    }
    
    // Setup payment method change handlers
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            const selectedMethod = e.target.value;
            console.log('Payment method changed to:', selectedMethod);
            togglePaymentForms(selectedMethod);
            updatePlaceOrderButtonState(isBuyNow);
        });
    });
    
    // Load order summary, address, and items
    loadCheckoutData();
    displayOrderItems(isBuyNow);
    
    console.log('Checkout page setup complete');
}

// Update place order button state based on validation
function updatePlaceOrderButtonState(isBuyNow = false) {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const payNowBtn = document.getElementById('payNowBtn');
    const activeBtn = payNowBtn || placeOrderBtn;
    
    if (!activeBtn) return;
    
    // Check if items exist based on flow type
    let hasItems = false;
    if (isBuyNow) {
        const buyNowItem = JSON.parse(localStorage.getItem('buyNowItem') || 'null');
        hasItems = !!buyNowItem;
    } else {
        hasItems = cart.length > 0;
    }
    
    // Check if address is provided
    const addressData = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    const hasAddress = !!addressData.firstName;
    
    // For Razorpay checkout, payment method is always available
    const hasPaymentMethod = true;
    
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
        shouldEnable,
        isBuyNow
    });
    
    // Update button state
    activeBtn.disabled = !shouldEnable;
    
    if (shouldEnable) {
        activeBtn.classList.remove('disabled');
        activeBtn.innerHTML = '<i class="fas fa-credit-card"></i> Pay Now with Razorpay';
    } else {
        activeBtn.classList.add('disabled');
        activeBtn.innerHTML = '<i class="fas fa-credit-card"></i> Complete All Steps to Pay';
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
    
    // Check if this is a buy now flow
    const urlParams = new URLSearchParams(window.location.search);
    const isBuyNow = urlParams.get('buyNow') === 'true';
    
    if (isBuyNow) {
        console.log('Buy Now flow detected');
        // For buy now, we don't need cart data
        const buyNowItem = JSON.parse(localStorage.getItem('buyNowItem') || 'null');
        if (!buyNowItem) {
            console.log('No buy now item found, redirecting to collections');
            window.location.href = 'collections.html';
            return;
        }
    } else {
        // Regular cart flow
        refreshCart();
        if (cart.length === 0) {
            console.log('Cart is empty, redirecting to collections');
            window.location.href = 'collections.html';
            return;
        }
    }
    
    const addressForm = document.getElementById('addressForm');
    const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');
    
    if (addressForm) {
        console.log('Address form found, setting up submit handler');
        addressForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAddressSubmit(isBuyNow);
        });
    }
    
    if (proceedToCheckoutBtn) {
        console.log('Proceed to checkout button found, setting up click handler');
        proceedToCheckoutBtn.addEventListener('click', () => {
            handleProceedToCheckout(isBuyNow);
        });
    }
    
    // Load order summary based on flow type
    if (isBuyNow) {
        updateBuyNowOrderSummary();
    } else {
        updateOrderSummary();
        const cartItemsContainer = document.getElementById('cartItemsList');
        if (cartItemsContainer) {
            displayCartItems();
        }
    }
}

// Handle address form submission
function handleAddressSubmit(isBuyNow = false) {
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
    
    // Navigate to checkout with appropriate flag
    const checkoutUrl = isBuyNow ? 'checkout.html?buyNow=true' : 'checkout.html';
    window.location.href = checkoutUrl;
}

// Handle proceed to checkout
function handleProceedToCheckout(isBuyNow = false) {
    // Check if user is logged in
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
        alert('Please login to continue with checkout.');
        window.location.href = 'auth.html';
        return;
    }
    
    const addressForm = document.getElementById('addressForm');
    
    if (isBuyNow) {
        const buyNowItem = JSON.parse(localStorage.getItem('buyNowItem') || 'null');
        if (!buyNowItem) {
            alert('No item selected for purchase!');
            window.location.href = 'collections.html';
            return;
        }
    } else {
        if (cart.length === 0) {
            alert('Your cart is empty! Please add items before checkout.');
            return;
        }
    }
    
    // Save address
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
    
    // Navigate to checkout
    const checkoutUrl = isBuyNow ? 'checkout.html?buyNow=true' : 'checkout.html';
    window.location.href = checkoutUrl;
}

// Load checkout data
function loadCheckoutData() {
    console.log('Loading checkout data...');
    
    // Check if this is a buy now flow
    const urlParams = new URLSearchParams(window.location.search);
    const isBuyNow = urlParams.get('buyNow') === 'true';
    
    if (isBuyNow) {
        console.log('Buy Now checkout flow');
        const buyNowItem = JSON.parse(localStorage.getItem('buyNowItem') || 'null');
        if (!buyNowItem) {
            console.log('No buy now item found, redirecting');
            window.location.href = 'collections.html';
            return;
        }
    } else {
        // Regular cart flow
        refreshCart();
        if (cart.length === 0) {
            console.log('Cart is empty, redirecting');
            window.location.href = 'cart.html';
            return;
        }
    }
    
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
    
    // Load order summary based on flow type
    if (isBuyNow) {
        updateBuyNowOrderSummary();
    } else {
        updateOrderSummary();
    }
}

// Legacy handlePlaceOrder function for backward compatibility
function handlePlaceOrder() {
    console.log('Legacy handlePlaceOrder called, redirecting to new function');
    // This function is kept for backward compatibility
    // In the new flow, this should not be called directly
    alert('Please use the Place Order button on the checkout page.');
}

// Save order to database
async function saveOrderToDatabase(order) {
    try {
        console.log('💾 Saving order to Supabase:', order);
        
        // Prepare order data for Supabase (UUID will be auto-generated)
        const orderData = {
            user_id: order.user_id,
            items: order.items,
            total_amount: order.total_amount,
            shipping_addr: order.shipping_addr,
            status: order.status || 'pending',
            payment_method: order.payment_method || 'razorpay'
        };
        
        console.log('📤 Inserting order data:', orderData);
        
        // Save to Supabase and get the generated UUID
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select('id, created_at, *')
            .single();
        
        if (error) {
            console.error('❌ Supabase insert error:', error);
            throw error;
        }
        
        console.log('✅ Order saved to Supabase with ID:', data.id);
        
        // Update the order object with the returned data including UUID
        order.id = data.id;
        order.created_at = data.created_at;
        
        showNotification('Order saved successfully!', 'success');
        
        return data;
        
    } catch (error) {
        console.error('❌ Error saving order to Supabase:', error);
        showNotification('Failed to save order. Please contact support immediately.', 'error');
        throw error;
    }
}

// Show order confirmation popup with actual order_id
function showOrderConfirmation(order) {
    console.log('✅ Showing order confirmation for order:', order.id);
    
    try {
        // Create and show confirmation popup with actual order_id
        const popup = document.createElement('div');
        popup.style.cssText = `
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
        `;
        
        popup.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <div style="color: #28a745; font-size: 60px; margin-bottom: 20px;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 style="color: #333; margin-bottom: 15px;">Order Placed Successfully!</h2>
                <p style="color: #666; margin-bottom: 20px; font-size: 16px;">
                    Your order has been placed successfully. Your Order ID is:
                </p>
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #28a745;
                ">
                    <strong style="color: #333; font-size: 18px;">${order.id}</strong>
                </div>
                <p style="color: #666; margin-bottom: 25px;">
                    Total Amount: <strong>₹${(order.total_amount || 0).toLocaleString()}</strong>
                </p>
                <button onclick="this.parentElement.parentElement.remove(); window.location.href='index.html';" 
                        style="
                            background: #FF6B6B;
                            color: white;
                            border: none;
                            padding: 12px 30px;
                            border-radius: 6px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: background 0.3s;
                        "
                        onmouseover="this.style.background='#FF5252'"
                        onmouseout="this.style.background='#FF6B6B'">
                    Continue Shopping
                </button>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
                window.location.href = 'index.html';
            }
        }, 10000);
        
    } catch (error) {
        console.error('❌ Error showing order confirmation:', error);
        // Fallback alert with order_id
        alert(`Your order has been placed successfully. Your Order ID is: ${order.id}`);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// Enhanced Razorpay integration using new backend
function initializeRazorpay(orderAmount, orderItems = null, isBuyNow = false) {
    console.log('Initializing Razorpay with amount:', orderAmount, 'isBuyNow:', isBuyNow);
    
    // Get customer details from address data
    const addressData = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    const customerDetails = {
        name: `${addressData.firstName || ''} ${addressData.lastName || ''}`.trim(),
        email: addressData.email || '',
        mobile: addressData.mobile || ''
    };
    
    // Prepare order data for new payment manager
    const orderData = {
        amount: orderAmount,
        items: orderItems || [],
        isBuyNow: isBuyNow,
        address: addressData,
        customerDetails: customerDetails
    };
    
    // Use new payment manager if available
    if (typeof paymentManager !== 'undefined') {
        paymentManager.initiatePayment(orderData);
    } else {
        // Fallback to old method
        initializeRazorpayCheckout(orderAmount, customerDetails);
    }
}
// Enhanced place order with payment integration
function handlePlaceOrderWithPayment(isBuyNow = false) {
    console.log('Handling place order with payment...', isBuyNow ? 'Buy Now flow' : 'Cart flow');
    
    // Check if user is logged in
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
        alert('Please login to place an order.');
        window.location.href = 'auth.html';
        return false;
    }
    
    let orderItems = [];
    let total = 0;
    
    if (isBuyNow) {
        // Buy Now flow - use buy now item
        const buyNowItem = JSON.parse(localStorage.getItem('buyNowItem') || 'null');
        if (!buyNowItem) {
            console.error('Buy now item validation failed');
            alert('No item selected for purchase!');
            window.location.href = 'collections.html';
            return false;
        }
        orderItems = [buyNowItem];
        const subtotal = buyNowItem.price * buyNowItem.quantity;
        const deliveryCharges = 0; // Set to 0 for testing
        total = subtotal + deliveryCharges;
    } else {
        // Regular cart flow
        refreshCart();
        if (!cart || cart.length === 0) {
            console.error('Cart validation failed - cart is empty');
            alert('Your cart is empty! Please add items before placing an order.');
            window.location.href = 'collections.html';
            return false;
        }
        orderItems = [...cart];
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryCharges = 0; // Set to 0 for testing
        total = subtotal + deliveryCharges;
    }
    
    // Validate address
    const addressData = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    if (!addressData.firstName) {
        console.error('Address validation failed - no address found');
        alert('Please provide delivery address first!');
        const addressUrl = isBuyNow ? 'address.html?buyNow=true' : 'address.html';
        window.location.href = addressUrl;
        return false;
    }
    
    // For simplified checkout (Razorpay only), skip payment method validation
    const paymentMethod = 'razorpay';
    
    console.log('Order validation passed. Total:', total);
    console.log('Order items:', orderItems.length);
    
    // Disable the button to prevent double clicks
    const activeBtn = document.getElementById('payNowBtn') || document.getElementById('placeOrderBtn');
    if (activeBtn) {
        activeBtn.disabled = true;
        activeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Order...';
    }
    
    try {
        // Initialize Razorpay payment
        initializeRazorpay(total, orderItems, isBuyNow);
    } catch (error) {
        console.error('Error in handlePlaceOrderWithPayment:', error);
        alert('There was an error processing your order. Please try again.');
        
        // Re-enable button
        if (activeBtn) {
            activeBtn.disabled = false;
            activeBtn.innerHTML = '<i class="fas fa-credit-card"></i> Pay Now with Razorpay';
        }
        return false;
    }
}

// Process order after payment (or for COD)
async function processOrder(total, paymentMethod, orderItems = null, isBuyNow = false, paymentId = null) {
    console.log('=== PROCESSING ORDER ===');
    console.log('Total:', total);
    console.log('Payment method:', paymentMethod);
    console.log('Is Buy Now:', isBuyNow);
    console.log('Payment ID:', paymentId);
    
    // Get user session
    const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
    const userId = userSession.id;
    
    if (!userId) {
        console.error('❌ No user ID found, cannot save order to database');
        alert('Please login to place an order.');
        window.location.href = 'auth.html';
        return null;
    }
    
    // Determine order items based on flow
    let items = [];
    if (isBuyNow) {
        const buyNowItem = orderItems || JSON.parse(localStorage.getItem('buyNowItem') || 'null');
        if (!buyNowItem) {
            console.error('❌ Buy now item is missing');
            alert('No item selected for purchase.');
            return null;
        }
        items = Array.isArray(buyNowItem) ? buyNowItem : [buyNowItem];
    } else {
        // Regular cart flow
        if (!cart || cart.length === 0) {
            console.error('❌ Cart is empty, cannot process order');
            alert('Your cart is empty. Please add items before placing an order.');
            return null;
        }
        items = [...cart];
    }
    
    console.log('📦 Order items:', items);
    
    const addressData = JSON.parse(localStorage.getItem('deliveryAddress') || '{}');
    
    // Validate address data
    if (!addressData.firstName) {
        console.error('❌ Address data is missing');
        alert('Delivery address is required. Please provide your address.');
        const addressUrl = isBuyNow ? 'address.html?buyNow=true' : 'address.html';
        window.location.href = addressUrl;
        return null;
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharges = 0;
    const calculatedTotal = subtotal + deliveryCharges;
    
    // Create order object with proper structure for Supabase
    const order = {
        user_id: userId.toString(), // Ensure string format
        items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            category: item.category
        })),
        total_amount: calculatedTotal,
        shipping_addr: {
            firstName: addressData.firstName,
            lastName: addressData.lastName,
            email: addressData.email,
            mobile: addressData.mobile,
            addressLine1: addressData.addressLine1,
            addressLine2: addressData.addressLine2 || '',
            city: addressData.city,
            state: addressData.state,
            pincode: addressData.pincode
        },
        status: paymentMethod === 'cod' ? 'pending' : 'confirmed',
        payment_method: paymentMethod,
        payment_id: paymentId // Store the payment ID from Razorpay
    };
    
    console.log('📋 Order created:', order);
    
    try {
        // Validate order data before saving
        if (!order.items || order.items.length === 0 || !order.total_amount) {
            throw new Error('Invalid order data - missing items or total amount');
        }
        
        // Save order to database and get the generated UUID
        const savedOrder = await saveOrderToDatabase(order);
        
        if (!savedOrder || !savedOrder.id) {
            throw new Error('Failed to save order to database');
        }
        
        console.log('✅ Order saved with ID:', savedOrder.id);
        
        // Clear appropriate storage after successful order
        if (isBuyNow) {
            localStorage.removeItem('buyNowItem');
            console.log('✅ Buy now item cleared');
        } else {
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            console.log('✅ Cart cleared');
        }
        
        // Return the saved order with the database-generated ID
        return savedOrder;
        
    } catch (error) {
        console.error('❌ Error processing order:', error);
        alert('There was an error processing your order. Please try again.');
        return null;
    }
}

// Display order items in the order review section
function displayOrderItems(isBuyNow = false) {
    console.log('Displaying order items...', isBuyNow ? 'Buy Now flow' : 'Cart flow');
    
    const orderItemsContainer = document.getElementById('orderItems');
    if (!orderItemsContainer) {
        console.log('Order items container not found');
        return;
    }
    
    let items = [];
    if (isBuyNow) {
        const buyNowItem = JSON.parse(localStorage.getItem('buyNowItem') || 'null');
        if (buyNowItem) {
            items = [buyNowItem];
        }
    } else {
        items = cart;
    }
    
    if (items.length === 0) {
        orderItemsContainer.innerHTML = '<p class="no-items">No items selected</p>';
        return;
    }
    
    const itemsHTML = items.map(item => `
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
    console.log('Order items displayed:', items.length, 'items');
}





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
    
    // Set up image gallery
    let imagesToShow = [];
    if (product.images && product.images.length > 0) {
        imagesToShow = product.images.map(img => {
            return img.startsWith('http') ? img : `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${img}`;
        });
    } else if (product.image) {
        const imageUrl = product.image.startsWith('http') ? product.image : `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${product.image}`;
        imagesToShow = [imageUrl];
    } else {
        imagesToShow = [`https://via.placeholder.com/400x500/FF6B6B/FFFFFF?text=${encodeURIComponent(product.name)}`];
    }
    
    displayModalImageGallery(imagesToShow, product.name);
    
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
    // Check if user is logged in
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
        alert('Please login to buy now.');
        window.location.href = 'auth.html';
        return;
    }
    
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('modalQuantity').value);
    // Store buy now item separately (don't add to cart)
    const buyNowItem = { ...currentProduct, quantity };
    localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
    
    closeProductModal();
    window.location.href = 'address.html?buyNow=true';
}

function buyNow(productId) {
    // Check if user is logged in
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
        alert('Please login to buy now.');
        window.location.href = 'auth.html';
        return;
    }
    
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    // Store buy now item separately (don't add to cart)
    const buyNowItem = { ...product, quantity: 1 };
    localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
    
    // Go directly to address page with buy now flag
    window.location.href = 'address.html?buyNow=true';
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
            
            const colorPalette = generateColorPalette(product);
            
            return `
            <div class="featured-card" data-product-id="${product.id}">
                <div class="featured-image" onclick="window.location.href='product.html?id=${product.id}'">
                    <img src="${imageUrl}" alt="${product.name}" loading="lazy">
                </div>
                <div class="featured-info">
                    <h3 class="featured-title">${product.name}</h3>
                    <div class="featured-price">₹${product.price.toLocaleString()}</div>
                    ${colorPalette}
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
function displayModalImageGallery(images, productName) {
    const mainImage = document.getElementById('mainProductImage');
    const thumbnailContainer = document.getElementById('modalThumbnails');
    
    // Set main image
    mainImage.src = images[0];
    mainImage.alt = productName;
    
    // Create thumbnails if more than one image
    if (images.length > 1) {
        thumbnailContainer.innerHTML = images.map((img, index) => `
            <img src="${img}" alt="${productName} ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeModalMainImage('${img}')">
        `).join('');
        thumbnailContainer.style.display = 'flex';
    } else {
        thumbnailContainer.style.display = 'none';
    }
}

function changeModalMainImage(imageUrl) {
    const mainImage = document.getElementById('mainProductImage');
    mainImage.src = imageUrl;
    
    // Update active thumbnail
    document.querySelectorAll('#modalThumbnails .thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
        if (thumb.src === imageUrl) {
            thumb.classList.add('active');
        }
    });
}

window.changeModalMainImage = changeModalMainImage;


// Generate color palette for products
function generateColorPalette(product) {
    if (!product.color_variants || product.color_variants.length === 0) {
        return '';
    }
    
    const colorDots = product.color_variants.map(variant => {
        const colorCode = variant.colorCode || getColorCode(variant.color.toLowerCase());
        
        return `
            <div class="color-dot" 
                 style="background-color: ${colorCode}" 
                 title="${variant.color}"
                 onclick="event.stopPropagation(); openColorVariant('${product.id}', '${variant.color}')">
            </div>
        `;
    }).join('');
    
    return `
        <div class="color-palette">
            <span class="color-label">Colors:</span>
            <div class="color-dots">
                ${colorDots}
            </div>
        </div>
    `;
}

// Get color code from color name
function getColorCode(colorName) {
    const colorMap = {
        'red': '#FF0000',
        'blue': '#0000FF',
        'green': '#008000',
        'yellow': '#FFFF00',
        'orange': '#FFA500',
        'purple': '#800080',
        'pink': '#FFC0CB',
        'black': '#000000',
        'white': '#FFFFFF',
        'gray': '#808080',
        'grey': '#808080',
        'brown': '#A52A2A',
        'maroon': '#800000',
        'navy': '#000080',
        'teal': '#008080',
        'olive': '#808000',
        'lime': '#00FF00',
        'aqua': '#00FFFF',
        'silver': '#C0C0C0',
        'gold': '#FFD700',
        'beige': '#F5F5DC',
        'cream': '#FFFDD0',
        'ivory': '#FFFFF0'
    };
    
    return colorMap[colorName] || '#CCCCCC';
}

// Open color variant
function openColorVariant(productId, color, variantImage) {
    console.log('Opening color variant:', productId, color, variantImage);
    
    // Navigate to product page with color parameter
    window.location.href = `product.html?id=${productId}&color=${encodeURIComponent(color)}`;
}

// Open product detail for color variant
function openProductDetailVariant(variantProduct) {
    currentProduct = variantProduct;
    
    // Populate modal with variant data
    document.getElementById('productTitle').textContent = variantProduct.name;
    document.getElementById('productPrice').textContent = `₹${variantProduct.price.toLocaleString()}`;
    document.getElementById('productOriginalPrice').textContent = variantProduct.originalPrice ? `₹${variantProduct.originalPrice.toLocaleString()}` : '';
    document.getElementById('productDescription').textContent = variantProduct.description || 'No description available';
    document.getElementById('productFabric').textContent = variantProduct.fabric || 'Not specified';
    document.getElementById('productCategory').textContent = variantProduct.category || 'General';
    document.getElementById('productStars').innerHTML = generateStars(variantProduct.rating);
    document.getElementById('productReviews').textContent = `${variantProduct.rating} (${variantProduct.reviews} reviews)`;
    
    // Set variant image
    let imageUrl;
    if (variantProduct.image && variantProduct.image.startsWith('http')) {
        imageUrl = variantProduct.image;
    } else if (variantProduct.image) {
        imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${variantProduct.image}`;
    } else {
        imageUrl = `https://via.placeholder.com/400x500/FF6B6B/FFFFFF?text=${encodeURIComponent(variantProduct.name)}`;
    }
    document.getElementById('mainProductImage').src = imageUrl;
    
    // Show selected color
    const colorsContainer = document.querySelector('#productColors .colors-list');
    colorsContainer.innerHTML = `<span class="selected-color">${variantProduct.selectedColor}</span>`;
    document.getElementById('productColors').style.display = 'block';
    
    // Show modal
    document.getElementById('productModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Update order summary for Buy Now flow
function updateBuyNowOrderSummary() {
    console.log('updateBuyNowOrderSummary called');
    
    const buyNowItem = JSON.parse(localStorage.getItem('buyNowItem') || 'null');
    if (!buyNowItem) {
        console.log('No buy now item found');
        return;
    }
    
    const subtotal = buyNowItem.price * buyNowItem.quantity;
    const deliveryCharges = 0; // Set to 0 for testing
    const total = subtotal + deliveryCharges;
    
    console.log('Buy Now calculated values - Subtotal:', subtotal, 'Delivery:', deliveryCharges, 'Total:', total);
    
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
    
    // Update item count
    const cartItemCount = document.getElementById('cartItemCount');
    if (cartItemCount) {
        cartItemCount.textContent = buyNowItem.quantity;
        console.log('Updated item count:', buyNowItem.quantity);
    }
}

window.logout = logout;
window.openColorVariant = openColorVariant;

// Mobile Menu Toggle Functionality
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const menuToggle = document.getElementById('mobileMenuToggle');
    
    if (navLinks && menuToggle) {
        if (navLinks.style.display === 'flex') {
            navLinks.style.display = 'none';
            navLinks.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        } else {
            navLinks.style.display = 'flex';
            navLinks.classList.add('active');
            menuToggle.innerHTML = '<i class="fas fa-times"></i>';
        }
    }
}

// Close mobile menu when clicking on a nav link
function closeMobileMenuOnNavClick() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navLinksContainer = document.getElementById('navLinks');
    const menuToggle = document.getElementById('mobileMenuToggle');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navLinksContainer.classList.remove('active');
                if (menuToggle) {
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });
}

// Initialize mobile menu on page load
function initializeMobileMenu() {
    // Close menu on nav link clicks
    closeMobileMenuOnNavClick();
    
    // Close menu when clicking outside
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
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const navLinks = document.getElementById('navLinks');
        const menuToggle = document.getElementById('mobileMenuToggle');
        if (navLinks && menuToggle) {
            if (window.innerWidth > 768) {
                navLinks.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    });
}

// Make functions globally available
window.toggleMobileMenu = toggleMobileMenu;

// Category filter functionality
function setupCategoryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productsGrid = document.getElementById('productsGrid');
    const sortSelect = document.getElementById('sortSelect');
    
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
    
    // Setup sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const sortValue = e.target.value;
            sortProducts(sortValue);
        });
    }
}

// Sort products function
function sortProducts(sortBy) {
    let sortedProducts = [...products];
    
    switch (sortBy) {
        case 'price-low-high':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high-low':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            sortedProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            sortedProducts.sort((a, b) => b.id - a.id);
            break;
        default:
            // Featured - keep original order
            break;
    }
    
    // Apply current category filter if any
    const activeFilter = document.querySelector('.filter-btn.active');
    if (activeFilter && activeFilter.dataset.category !== 'all') {
        const category = activeFilter.dataset.category;
        sortedProducts = sortedProducts.filter(p => {
            const productCategory = p.category ? p.category.toLowerCase() : '';
            const filterCategory = category.toLowerCase();
            
            if (filterCategory === 'bridal' || filterCategory === 'wedding') {
                return productCategory === 'bridal' || productCategory === 'wedding';
            }
            
            return productCategory === filterCategory || productCategory.includes(filterCategory);
        });
    }
    
    displayProducts(sortedProducts);
}

function filterProducts(category) {
    let filteredProducts;
    if (category === 'all') {
        filteredProducts = products;
    } else {
        filteredProducts = products.filter(p => {
            const productCategory = p.category ? p.category.toLowerCase() : '';
            const filterCategory = category.toLowerCase();
            
            // Handle specific category mappings
            if (filterCategory === 'bridal' || filterCategory === 'wedding') {
                return productCategory === 'bridal' || productCategory === 'wedding';
            }
            
            return productCategory === filterCategory || productCategory.includes(filterCategory);
        });
    }
    
    console.log('Filtering by category:', category);
    console.log('All products:', products);
    console.log('Filtered products:', filteredProducts);
    
    displayProducts(filteredProducts);
}

// New function to display products with Buy Now button
function displayProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (grid) {
        grid.innerHTML = productsToShow.map(product => {
            let imageUrl;
            if (product.image && product.image.startsWith('http')) {
                imageUrl = product.image;
            } else if (product.image) {
                imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${product.image}`;
            } else {
                imageUrl = `https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=${encodeURIComponent(product.name || 'Product')}`;
            }
            
            const colorPalette = generateColorPalette(product);
            
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
                    ${colorPalette}
                    <div class="action-buttons">
                        <button class="add-to-cart add-to-cart-btn" data-id="${product.id}" onclick="event.stopPropagation()">
                            Add to Cart
                        </button>
                        <button class="buy-now-btn" data-id="${product.id}" onclick="event.stopPropagation(); buyNow('${product.id}')">
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        // Re-attach event listeners
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.add-to-cart-btn') && !e.target.closest('.buy-now-btn') && !e.target.closest('.color-dot')) {
                    const productId = card.dataset.productId;
                    window.location.href = `product.html?id=${productId}`;
                }
            });
        });
        attachAddToCartListeners();
    }
}