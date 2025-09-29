// Optimized Smooth Scrolling for Featured Sarees
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('carouselContainer');
    const track = document.getElementById('featuredProducts');
    
    if (!container || !track) return;
    
    let isScrolling = false;
    let scrollTimeout;
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    
    // Create navigation buttons
    function createNavigationButtons() {
        const wrapper = container.parentElement;
        if (!wrapper || wrapper.querySelector('.carousel-nav')) return;
        
        const leftBtn = document.createElement('button');
        leftBtn.className = 'carousel-nav carousel-nav-left';
        leftBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        leftBtn.setAttribute('aria-label', 'Previous products');
        
        const rightBtn = document.createElement('button');
        rightBtn.className = 'carousel-nav carousel-nav-right';
        rightBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        rightBtn.setAttribute('aria-label', 'Next products');
        
        wrapper.appendChild(leftBtn);
        wrapper.appendChild(rightBtn);
        
        // Navigation functionality
        leftBtn.addEventListener('click', () => scrollCarousel('left'));
        rightBtn.addEventListener('click', () => scrollCarousel('right'));
        
        // Update button visibility
        updateNavigationButtons();
        container.addEventListener('scroll', updateNavigationButtons);
    }
    
    // Scroll carousel smoothly
    function scrollCarousel(direction) {
        const cardWidth = 350 + 30; // card width + gap
        const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time
        
        const currentScroll = container.scrollLeft;
        const targetScroll = direction === 'left' 
            ? Math.max(0, currentScroll - scrollAmount)
            : Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount);
        
        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
    }
    
    // Update navigation button states
    function updateNavigationButtons() {
        const leftBtn = document.querySelector('.carousel-nav-left');
        const rightBtn = document.querySelector('.carousel-nav-right');
        
        if (!leftBtn || !rightBtn) return;
        
        const isAtStart = container.scrollLeft <= 0;
        const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 1;
        
        leftBtn.style.opacity = isAtStart ? '0.5' : '1';
        leftBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';
        
        rightBtn.style.opacity = isAtEnd ? '0.5' : '1';
        rightBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
    }
    
    // Optimize scrolling performance
    function handleScrollStart() {
        if (!isScrolling) {
            isScrolling = true;
            container.classList.add('scrolling');
            
            // Disable smooth scroll behavior during manual scrolling for better performance
            container.style.scrollBehavior = 'auto';
        }
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
            container.classList.remove('scrolling');
            container.style.scrollBehavior = 'smooth';
        }, 150);
    }
    
    // Enhanced touch/mouse drag support
    function initializeDragScroll() {
        // Mouse events
        container.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            container.classList.add('no-select');
            e.preventDefault();
        });
        
        container.addEventListener('mouseleave', () => {
            isDragging = false;
            container.classList.remove('no-select');
        });
        
        container.addEventListener('mouseup', () => {
            isDragging = false;
            container.classList.remove('no-select');
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
            handleScrollStart();
        });
        
        // Touch events for mobile
        let touchStartX = 0;
        let touchScrollLeft = 0;
        
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchScrollLeft = container.scrollLeft;
            container.classList.add('no-select');
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            const touchX = e.touches[0].clientX;
            const walk = (touchStartX - touchX) * 1.5;
            container.scrollLeft = touchScrollLeft + walk;
            handleScrollStart();
        }, { passive: true });
        
        container.addEventListener('touchend', () => {
            container.classList.remove('no-select');
        }, { passive: true });
    }
    
    // Keyboard navigation
    function initializeKeyboardNavigation() {
        container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                scrollCarousel('left');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                scrollCarousel('right');
            }
        });
        
        // Make container focusable
        container.setAttribute('tabindex', '0');
    }
    
    // Auto-scroll functionality (optional)
    function initializeAutoScroll() {
        let autoScrollInterval;
        let isUserInteracting = false;
        
        function startAutoScroll() {
            if (window.innerWidth > 768) { // Only on desktop
                autoScrollInterval = setInterval(() => {
                    if (!isUserInteracting && !isDragging) {
                        const maxScroll = container.scrollWidth - container.clientWidth;
                        if (container.scrollLeft >= maxScroll) {
                            container.scrollTo({ left: 0, behavior: 'smooth' });
                        } else {
                            scrollCarousel('right');
                        }
                    }
                }, 4000);
            }
        }
        
        function stopAutoScroll() {
            clearInterval(autoScrollInterval);
        }
        
        // Pause auto-scroll on user interaction
        ['mouseenter', 'touchstart', 'focus'].forEach(event => {
            container.addEventListener(event, () => {
                isUserInteracting = true;
                stopAutoScroll();
            });
        });
        
        ['mouseleave', 'touchend', 'blur'].forEach(event => {
            container.addEventListener(event, () => {
                isUserInteracting = false;
                setTimeout(startAutoScroll, 2000); // Resume after 2 seconds
            });
        });
        
        // Start auto-scroll initially
        setTimeout(startAutoScroll, 3000);
    }
    
    // Initialize all functionality
    function initialize() {
        // Wait for products to load
        const observer = new MutationObserver(() => {
            if (track.children.length > 0) {
                createNavigationButtons();
                initializeDragScroll();
                initializeKeyboardNavigation();
                initializeAutoScroll();
                
                // Add scroll event listener for performance optimization
                container.addEventListener('scroll', handleScrollStart, { passive: true });
                
                observer.disconnect();
            }
        });
        
        observer.observe(track, { childList: true });
        
        // If products already exist
        if (track.children.length > 0) {
            createNavigationButtons();
            initializeDragScroll();
            initializeKeyboardNavigation();
            initializeAutoScroll();
            container.addEventListener('scroll', handleScrollStart, { passive: true });
        }
    }
    
    // Start initialization
    initialize();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        updateNavigationButtons();
    });
});