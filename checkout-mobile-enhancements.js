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
    
    // Remove automatic scrolling - now manual only
    
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
    
    // Removed auto-scroll functionality
});

// Manual scroll to pay now function (only when explicitly called)
function scrollToPayNow() {
    const payNowSection = document.querySelector('.pay-now-section');
    if (payNowSection) {
        payNowSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
        });
    }
}