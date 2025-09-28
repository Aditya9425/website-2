// Direct Drag Scrolling with Infinite Loop
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('carouselContainer');
    const track = document.getElementById('featuredProducts');
    
    if (!container || !track) return;
    
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let animationId = null;
    
    // Clone products for infinite scroll
    function setupInfiniteScroll() {
        const products = track.children;
        if (products.length === 0) return;
        
        // Clone all products and append to create seamless loop
        const clones = [];
        for (let i = 0; i < products.length; i++) {
            const clone = products[i].cloneNode(true);
            clone.classList.add('cloned');
            clones.push(clone);
        }
        clones.forEach(clone => track.appendChild(clone));
        
        // Set initial position to show original products
        container.scrollLeft = 0;
    }
    
    // Handle infinite loop
    function handleInfiniteLoop() {
        const scrollWidth = track.scrollWidth;
        const containerWidth = container.clientWidth;
        const maxScroll = scrollWidth - containerWidth;
        const halfScroll = scrollWidth / 2;
        
        if (container.scrollLeft >= halfScroll) {
            container.scrollLeft = container.scrollLeft - halfScroll;
        } else if (container.scrollLeft <= 0) {
            container.scrollLeft = halfScroll;
        }
    }
    
    // Momentum scrolling
    function applyMomentum() {
        if (Math.abs(velocity) > 0.5 && !isDragging) {
            container.scrollLeft += velocity;
            velocity *= 0.95;
            handleInfiniteLoop();
            animationId = requestAnimationFrame(applyMomentum);
        } else {
            velocity = 0;
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        }
    }
    
    // Start drag
    function startDrag(clientX) {
        isDragging = true;
        startX = clientX;
        scrollLeft = container.scrollLeft;
        lastX = clientX;
        lastTime = Date.now();
        velocity = 0;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        container.style.cursor = 'grabbing';
        container.style.userSelect = 'none';
    }
    
    // Handle drag
    function handleDrag(clientX) {
        if (!isDragging) return;
        
        const currentTime = Date.now();
        const deltaTime = currentTime - lastTime;
        const deltaX = clientX - lastX;
        
        if (deltaTime > 0) {
            velocity = deltaX / deltaTime * 16; // Convert to per-frame velocity
        }
        
        const x = clientX - startX;
        container.scrollLeft = scrollLeft - x;
        handleInfiniteLoop();
        
        lastX = clientX;
        lastTime = currentTime;
    }
    
    // End drag
    function endDrag() {
        if (!isDragging) return;
        
        isDragging = false;
        container.style.cursor = 'grab';
        container.style.userSelect = '';
        
        // Apply momentum
        if (Math.abs(velocity) > 1) {
            applyMomentum();
        }
    }
    
    // Mouse events
    container.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrag(e.clientX);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            handleDrag(e.clientX);
        }
    });
    
    document.addEventListener('mouseup', endDrag);
    
    // Touch events
    container.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrag(e.touches[0].clientX);
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            e.preventDefault();
            handleDrag(e.touches[0].clientX);
        }
    }, { passive: false });
    
    document.addEventListener('touchend', endDrag);
    
    // Prevent context menu on long press
    container.addEventListener('contextmenu', (e) => {
        if (isDragging) e.preventDefault();
    });
    
    // Initialize after products are loaded
    const observer = new MutationObserver(() => {
        if (track.children.length > 0) {
            setupInfiniteScroll();
            observer.disconnect();
        }
    });
    
    observer.observe(track, { childList: true });
    
    // If products already exist
    if (track.children.length > 0) {
        setupInfiniteScroll();
    }
});