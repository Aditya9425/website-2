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
        console.error('Error fetching products:', error);
        return null;
    }
}

// Fallback products for when Supabase is not available
const fallbackProducts = [
    {
        id: '1',
        name: "Silk Banarasi Saree",
        price: 15000,
        originalPrice: 18000,
        image: "https://via.placeholder.com/500x600/FF6B6B/FFFFFF?text=Silk+Banarasi",
        images: [
            "https://via.placeholder.com/500x600/FF6B6B/FFFFFF?text=Silk+Banarasi+1",
            "https://via.placeholder.com/500x600/FF4444/FFFFFF?text=Silk+Banarasi+2",
            "https://via.placeholder.com/500x600/FF8888/FFFFFF?text=Silk+Banarasi+3"
        ],
        category: "silk",
        rating: 4.8,
        description: "Exquisite Banarasi silk saree with intricate zari work. Perfect for weddings and special occasions.",
        colors: ["Red", "Green", "Blue"],
        sizes: ["Free Size"],
        fabric: "Silk",
        reviews: 156
    },
    {
        id: '2',
        name: "Cotton Handloom Saree",
        price: 2500,
        originalPrice: 3000,
        image: "https://via.placeholder.com/500x600/4ECDC4/FFFFFF?text=Cotton+Handloom",
        category: "cotton",
        rating: 4.5,
        description: "Comfortable cotton handloom saree for daily wear. Breathable and elegant.",
        colors: ["White", "Beige", "Pink"],
        sizes: ["Free Size"],
        fabric: "Cotton",
        reviews: 89
    },
    {
        id: '3',
        name: "Designer Georgette Saree",
        price: 8000,
        originalPrice: 10000,
        image: "https://via.placeholder.com/500x600/45B7D1/FFFFFF?text=Designer+Georgette",
        category: "designer",
        rating: 4.7,
        description: "Elegant designer georgette saree with modern aesthetics and traditional charm.",
        colors: ["Purple", "Teal", "Maroon"],
        sizes: ["Free Size"],
        fabric: "Georgette",
        reviews: 203
    }
];

// Load products on page load
async function loadProducts() {
    try {
        const supabaseProducts = await fetchProductsFromSupabase();
        if (supabaseProducts && supabaseProducts.length > 0) {
            products = supabaseProducts;
        } else {
            products = fallbackProducts;
        }
        
        // Display products if on collections page
        if (typeof displayProducts === 'function') {
            displayProducts(products);
        }
        
        // Load featured products if on home page
        if (typeof loadFeaturedProducts === 'function') {
            loadFeaturedProducts();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        products = fallbackProducts;
    }
}

// Load featured products for home page
function loadFeaturedProducts() {
    const featuredContainer = document.getElementById('featuredProducts');
    if (!featuredContainer) return;
    
    // Take first 6 products as featured
    const featuredProducts = products.slice(0, 6);
    
    featuredContainer.innerHTML = featuredProducts.map(product => {
        let imageUrl;
        if (product.image && product.image.startsWith('http')) {
            imageUrl = product.image;
        } else if (product.image) {
            imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${product.image}`;
        } else {
            imageUrl = `https://via.placeholder.com/350x450/FF6B6B/FFFFFF?text=${encodeURIComponent(product.name)}`;
        }
        
        return `
            <div class="featured-card" data-product-id="${product.id}">
                <img src="${imageUrl}" alt="${product.name}" class="featured-image">
                <div class="featured-info">
                    <h3 class="featured-name">${product.name}</h3>
                    <div class="featured-price">₹${product.price.toLocaleString()}</div>
                    <div class="featured-rating">
                        <div class="stars">${generateStars(product.rating)}</div>
                        <span>${product.rating} (${product.reviews})</span>
                    </div>
                    <div class="product-actions">
                        <button class="action-btn add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${product.id}); window.location.href='cart.html';">Add to Cart</button>
                        <button class="action-btn buy-now-btn" onclick="event.stopPropagation(); buyNow(${product.id});">Buy Now</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click event listeners to featured cards
    document.querySelectorAll('.featured-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const productId = card.dataset.productId;
            window.location.href = `product.html?id=${productId}`;
        });
    });
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

// Cart functions
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id == productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id != productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
}

function clearCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Buy Now function
function buyNow(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    // Check if user is logged in
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
        alert('Please login to buy now.');
        window.location.href = 'auth.html';
        return;
    }
    
    // Store buy now item separately (don't add to cart)
    const buyNowItem = { ...product, quantity: 1 };
    localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
    
    // Go directly to address page with buy now flag
    window.location.href = 'address.html?buyNow=true';
}

// User authentication functions
function checkAuthStatus() {
    const userSession = localStorage.getItem('userSession');
    const loginLink = document.getElementById('loginLink');
    const profileLink = document.getElementById('profileLink');
    const signOutBtn = document.getElementById('signOutBtn');
    
    if (userSession) {
        try {
            const user = JSON.parse(userSession);
            if (loginLink) loginLink.style.display = 'none';
            if (profileLink) {
                profileLink.style.display = 'flex';
                const userName = document.getElementById('userName');
                if (userName) userName.textContent = user.name || 'Profile';
            }
            if (signOutBtn) signOutBtn.style.display = 'block';
        } catch (error) {
            console.error('Error parsing user session:', error);
            localStorage.removeItem('userSession');
        }
    } else {
        if (loginLink) loginLink.style.display = 'flex';
        if (profileLink) profileLink.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('userSession');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Feedback Modal Functions
function openFeedbackForm() {
    console.log('openFeedbackForm called'); // Debug log
    const modal = document.getElementById('feedbackModal');
    console.log('Modal element:', modal); // Debug log
    
    if (modal) {
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        console.log('Modal should be visible now'); // Debug log
        
        // Focus on textarea for better UX
        setTimeout(() => {
            const textarea = document.getElementById('feedbackText');
            if (textarea) {
                textarea.focus();
            }
        }, 100);
    } else {
        console.error('Feedback modal not found!');
    }
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
        // Clear form
        const form = document.getElementById('feedbackForm');
        if (form) {
            form.reset();
        }
    }
}

async function submitFeedback(event) {
    event.preventDefault();
    
    const textarea = document.getElementById('feedbackText');
    const feedback = textarea.value.trim();
    
    if (!feedback) {
        alert('Please enter your feedback before submitting.');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('.feedback-btn-submit');
    const cancelBtn = document.querySelector('.feedback-btn-cancel');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;
    
    try {
        // Save feedback to Supabase
        const { data, error } = await supabase
            .from('feedbacks')
            .insert([
                { message: feedback }
            ]);
        
        if (error) {
            console.error('Error saving feedback:', error);
            alert('Sorry, there was an error submitting your feedback. Please try again.');
            return;
        }
        
        console.log('Feedback saved successfully:', data);
        
        // Show success message
        alert('Thank you for your feedback! We\'ll review it and work on improvements.');
        
        // Close modal
        closeFeedbackModal();
        
    } catch (error) {
        console.error('Error saving feedback:', error);
        alert('Sorry, there was an error submitting your feedback. Please try again.');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        if (cancelBtn) cancelBtn.disabled = false;
    }
}

// Close modal when clicking outside of it
document.addEventListener('click', function(event) {
    const modal = document.getElementById('feedbackModal');
    if (modal && event.target === modal) {
        closeFeedbackModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeFeedbackModal();
    }
});

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

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    refreshCart();
    updateCartCount();
    checkAuthStatus();
    loadProducts();
    
    // Initialize mobile menu
    const menuToggle = document.getElementById('mobileMenuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
});

// Display products on collections page
function displayProducts(productsToDisplay) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    // Get category from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    // Filter products by category if specified
    let filteredProducts = productsToDisplay;
    if (categoryParam && categoryParam !== 'all') {
        filteredProducts = productsToDisplay.filter(p => p.category === categoryParam);
        
        // Update category filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === categoryParam) {
                btn.classList.add('active');
            }
        });
        
        // Update page header
        const pageHeader = document.querySelector('.page-header h1');
        if (pageHeader) {
            const categoryName = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);
            pageHeader.textContent = categoryName + ' Sarees';
        }
    }
    
    // Generate HTML for products
    productsGrid.innerHTML = filteredProducts.map(product => {
        let imageUrl;
        if (product.image && product.image.startsWith('http')) {
            imageUrl = product.image;
        } else if (product.image) {
            imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${product.image}`;
        } else {
            imageUrl = `https://via.placeholder.com/350x450/FF6B6B/FFFFFF?text=${encodeURIComponent(product.name)}`;
        }
        
        return `
            <div class="product-card" data-product-id="${product.id}" data-category="${product.category}">
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image">
                    <div class="product-actions">
                        <button class="action-btn add-to-cart-btn" onclick="addToCart('${product.id}'); window.location.href='cart.html'; event.stopPropagation();">
                            Add to Cart
                        </button>
                        <button class="action-btn buy-now-btn" onclick="buyNow('${product.id}'); event.stopPropagation();">
                            Buy Now
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">₹${product.price.toLocaleString()}</span>
                        ${product.originalPrice ? `<span class="original-price">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                    </div>
                    <div class="product-rating">
                        <div class="stars">${generateStars(product.rating)}</div>
                        <span>${product.rating} (${product.reviews})</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click event to product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const productId = card.dataset.productId;
            window.location.href = `product.html?id=${productId}`;
        });
    });
    
    // Add filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update page header
            const pageHeader = document.querySelector('.page-header h1');
            if (pageHeader) {
                if (category === 'all') {
                    pageHeader.textContent = 'All Sarees';
                } else {
                    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                    pageHeader.textContent = categoryName + ' Sarees';
                }
            }
            
            // Filter products
            if (category === 'all') {
                displayProducts(productsToDisplay);
            } else {
                const filtered = productsToDisplay.filter(p => p.category === category);
                productsGrid.innerHTML = filtered.length > 0 
                    ? filtered.map(product => {
                        let imageUrl;
                        if (product.image && product.image.startsWith('http')) {
                            imageUrl = product.image;
                        } else if (product.image) {
                            imageUrl = `https://jstvadizuzvwhabtfhfs.supabase.co/storage/v1/object/public/Sarees/${product.image}`;
                        } else {
                            imageUrl = `https://via.placeholder.com/350x450/FF6B6B/FFFFFF?text=${encodeURIComponent(product.name)}`;
                        }
                        
                        return `
                            <div class="product-card" data-product-id="${product.id}" data-category="${product.category}">
                                <div class="product-image-container">
                                    <img src="${imageUrl}" alt="${product.name}" class="product-image">
                                    <div class="product-actions">
                                        <button class="action-btn add-to-cart-btn" onclick="addToCart('${product.id}'); window.location.href='cart.html'; event.stopPropagation();">
                                            Add to Cart
                                        </button>
                                        <button class="action-btn buy-now-btn" onclick="buyNow('${product.id}'); event.stopPropagation();">
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                                <div class="product-info">
                                    <h3 class="product-name">${product.name}</h3>
                                    <div class="product-price">
                                        <span class="current-price">₹${product.price.toLocaleString()}</span>
                                        ${product.originalPrice ? `<span class="original-price">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                                    </div>
                                    <div class="product-rating">
                                        <div class="stars">${generateStars(product.rating)}</div>
                                        <span>${product.rating} (${product.reviews})</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')
                    : '<div class="no-products">No products found in this category.</div>';
            }
        });
    });
}

// Make functions globally available
window.openFeedbackForm = openFeedbackForm;
window.closeFeedbackModal = closeFeedbackModal;
window.submitFeedback = submitFeedback;
window.toggleMobileMenu = toggleMobileMenu;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.buyNow = buyNow;
window.logout = logout;
window.displayProducts = displayProducts;
