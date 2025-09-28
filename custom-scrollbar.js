// Water-like Smooth Scrollbar for Featured Sarees
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('carouselContainer');
    const thumb = document.getElementById('scrollbarThumb');
    const track = document.querySelector('.scrollbar-track');
    const wrapper = document.querySelector('.carousel-wrapper');
    
    if (!container || !thumb || !track || !wrapper) return;
    
    let isDragging = false;
    let isHovering = false;
    let autoScrollInterval = null;
    let scrollVelocity = 0;
    let lastScrollTime = 0;
    let animationFrame = null;
    
    // Enhanced smooth scrolling configuration
    const config = {
        autoScrollSpeed: 0.5,
        hoverScrollSpeed: 2,
        smoothFactor: 0.15,
        velocityDecay: 0.95,
        snapThreshold: 50
    };
    
    // Make container focusable
    container.setAttribute('tabindex', '0');
    
    // Smooth position update with easing
    function updateThumbPosition() {
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth - container.clientWidth;
        const trackWidth = track.clientWidth;
        const thumbWidth = thumb.clientWidth;
        
        if (scrollWidth > 0) {
            const position = (scrollLeft / scrollWidth) * (trackWidth - thumbWidth);
            const clampedPosition = Math.max(0, Math.min(position, trackWidth - thumbWidth));
            thumb.style.transform = `translateX(${clampedPosition}px)`;
        }
    }
    
    // Water-like momentum scrolling
    function applyMomentum() {
        if (Math.abs(scrollVelocity) > 0.1 && !isDragging) {
            container.scrollLeft += scrollVelocity;
            scrollVelocity *= config.velocityDecay;
            animationFrame = requestAnimationFrame(applyMomentum);
        } else {
            scrollVelocity = 0;
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
        }
    }
    
    // Smooth auto-scroll on hover
    function startAutoScroll(direction) {
        if (autoScrollInterval) clearInterval(autoScrollInterval);
        
        autoScrollInterval = setInterval(() => {
            if (isHovering && !isDragging) {
                const scrollAmount = direction * config.hoverScrollSpeed;
                container.scrollLeft += scrollAmount;
                scrollVelocity = scrollAmount * 0.3; // Add momentum
            }
        }, 16); // 60fps
    }
    
    function stopAutoScroll() {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    }
    
    // Enhanced hover effects
    track.addEventListener('mouseenter', () => {
        isHovering = true;
        track.style.transform = 'scaleY(1.5)';
        thumb.style.transform += ' scaleY(1.2)';
    });
    
    track.addEventListener('mouseleave', () => {
        isHovering = false;
        stopAutoScroll();
        track.style.transform = 'scaleY(1)';
        thumb.style.transform = thumb.style.transform.replace(' scaleY(1.2)', '');
    });
    
    // Smooth hover scrolling
    track.addEventListener('mousemove', (e) => {
        if (!isHovering || isDragging) return;
        
        const trackRect = track.getBoundingClientRect();
        const mouseX = e.clientX - trackRect.left;
        const trackCenter = trackRect.width / 2;
        const distance = mouseX - trackCenter;
        const normalizedDistance = distance / trackCenter; // -1 to 1
        
        if (Math.abs(normalizedDistance) > 0.1) {
            startAutoScroll(normalizedDistance * config.autoScrollSpeed);
        } else {
            stopAutoScroll();
        }
    });
    
    // Enhanced drag functionality
    function startDrag(clientX) {
        isDragging = true;
        stopAutoScroll();
        const trackRect = track.getBoundingClientRect();
        const thumbRect = thumb.getBoundingClientRect();
        const offsetX = clientX - thumbRect.left;
        
        function handleDrag(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            const currentTime = Date.now();
            const deltaTime = currentTime - lastScrollTime;
            
            const trackRect = track.getBoundingClientRect();
            const newX = e.clientX - trackRect.left - offsetX;
            const trackWidth = track.clientWidth;
            const thumbWidth = thumb.clientWidth;
            const maxX = trackWidth - thumbWidth;
            
            const clampedX = Math.max(0, Math.min(newX, maxX));
            const scrollRatio = clampedX / maxX;
            const newScrollLeft = scrollRatio * (container.scrollWidth - container.clientWidth);
            
            // Calculate velocity for momentum
            if (deltaTime > 0) {
                const deltaScroll = newScrollLeft - container.scrollLeft;
                scrollVelocity = deltaScroll / deltaTime * 16; // Convert to per-frame velocity
            }
            
            container.scrollLeft = newScrollLeft;
            lastScrollTime = currentTime;
        }
        
        function stopDrag() {
            if (isDragging) {
                isDragging = false;
                document.removeEventListener('mousemove', handleDrag);
                document.removeEventListener('mouseup', stopDrag);
                document.removeEventListener('touchmove', handleDrag);
                document.removeEventListener('touchend', stopDrag);
                
                // Apply momentum after drag
                if (Math.abs(scrollVelocity) > 1) {
                    applyMomentum();
                }
            }
        }
        
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', handleDrag);
        document.addEventListener('touchend', stopDrag);
        
        lastScrollTime = Date.now();
    }
    
    // Mouse and touch events
    thumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrag(e.clientX);
    });
    
    thumb.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrag(e.touches[0].clientX);
    });
    
    // Track click for instant navigation
    track.addEventListener('click', (e) => {
        if (e.target === thumb || isDragging) return;
        
        const trackRect = track.getBoundingClientRect();
        const clickX = e.clientX - trackRect.left;
        const trackWidth = track.clientWidth;
        const scrollRatio = clickX / trackWidth;
        const targetScrollLeft = scrollRatio * (container.scrollWidth - container.clientWidth);
        
        // Smooth scroll to clicked position
        const startScrollLeft = container.scrollLeft;
        const distance = targetScrollLeft - startScrollLeft;
        const duration = 500;
        const startTime = Date.now();
        
        function animateScroll() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            container.scrollLeft = startScrollLeft + (distance * easeProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        }
        
        animateScroll();
    });
    
    // Smooth scroll event handling
    let scrollTimeout;
    container.addEventListener('scroll', () => {
        updateThumbPosition();
        
        // Clear existing timeout
        if (scrollTimeout) clearTimeout(scrollTimeout);
        
        // Add momentum effect on manual scroll
        if (!isDragging && !autoScrollInterval) {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastScrollTime;
            
            if (deltaTime > 0 && deltaTime < 100) {
                const deltaScroll = container.scrollLeft - (container.lastScrollLeft || 0);
                scrollVelocity = deltaScroll * 0.1;
                
                scrollTimeout = setTimeout(() => {
                    if (Math.abs(scrollVelocity) > 0.5) {
                        applyMomentum();
                    }
                }, 50);
            }
            
            container.lastScrollLeft = container.scrollLeft;
            lastScrollTime = currentTime;
        }
    });
    
    // Keyboard navigation with smooth scrolling
    container.addEventListener('keydown', (e) => {
        const cardWidth = 320;
        const gap = 30;
        const scrollAmount = cardWidth + gap;
        
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            smoothScrollBy(-scrollAmount);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            smoothScrollBy(scrollAmount);
        }
    });
    
    function smoothScrollBy(amount) {
        const startScrollLeft = container.scrollLeft;
        const targetScrollLeft = startScrollLeft + amount;
        const duration = 300;
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 2);
            
            container.scrollLeft = startScrollLeft + (amount * easeProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        animate();
    }
    
    // Initialize
    updateThumbPosition();
    
    // Handle resize
    window.addEventListener('resize', () => {
        updateThumbPosition();
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        stopAutoScroll();
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    });
});