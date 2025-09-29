// Mobile enhancements for checkout page
document.addEventListener('DOMContentLoaded', function() {
    // Prevent zoom on input focus for iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.style.fontSize = '16px';
            });
        });
    }
    
    // Smooth scroll to pay button when sections are clicked
    const clickableElements = document.querySelectorAll('[onclick*="scrollToPayNow"]');
    clickableElements.forEach(element => {
        element.addEventListener('touchstart', function(e) {
            e.preventDefault();
            scrollToPayNow();
        });
    });
    
    // Optimize touch interactions for payment button
    const payNowBtn = document.getElementById('payNowBtn');
    if (payNowBtn) {
        payNowBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        payNowBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    // Auto-hide address bar on mobile scroll
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down - hide address bar
            window.scrollTo(0, scrollTop + 1);
        }
        lastScrollTop = scrollTop;
    }, { passive: true });
});

// Enhanced scroll to pay now function
function scrollToPayNow() {
    const payNowSection = document.querySelector('.pay-now-section');
    if (payNowSection) {
        payNowSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end',
            inline: 'nearest'
        });
    }
}