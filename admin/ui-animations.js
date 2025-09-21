// Enhanced UI Animations and Interactions

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeUIEnhancements();
});

function initializeUIEnhancements() {
    // Add stagger animation to cards
    addStaggerAnimation();
    
    // Add ripple effect to buttons
    addRippleEffect();
    
    // Add smooth scrolling
    addSmoothScrolling();
    
    // Add chart animations
    enhanceChartAnimations();
    
    // Add table row animations
    enhanceTableAnimations();
    
    // Add form field animations
    enhanceFormAnimations();
    
    // Add loading states
    addLoadingStates();
}

// Stagger animation for cards
function addStaggerAnimation() {
    const cards = document.querySelectorAll('.stats-card, .chart-card, .analytics-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-fade-in-up');
    });
}

// Enhanced ripple effect for buttons
function addRippleEffect() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-success, .btn-warning, .btn-danger, .btn-save, .login-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Smooth scrolling for navigation
function addSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Add smooth transition effect
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Enhanced chart animations
function enhanceChartAnimations() {
    // Override Chart.js default animations
    if (typeof Chart !== 'undefined') {
        Chart.defaults.animation = {
            duration: 2000,
            easing: 'easeInOutQuart'
        };
        
        Chart.defaults.animations = {
            colors: {
                type: 'color',
                duration: 1000,
                from: 'transparent'
            },
            x: {
                type: 'number',
                easing: 'easeInOutQuart',
                duration: 2000,
                from: NaN
            },
            y: {
                type: 'number',
                easing: 'easeInOutQuart',
                duration: 2000,
                from: (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y
            }
        };
        
        Chart.defaults.hover = {
            animationDuration: 400
        };
        
        Chart.defaults.responsiveAnimationDuration = 1000;
    }
}

// Enhanced table animations
function enhanceTableAnimations() {
    const tables = document.querySelectorAll('.data-table, .analytics-table');
    
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        
        // Add intersection observer for table rows
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 50);
                }
            });
        }, { threshold: 0.1 });
        
        rows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            row.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(row);
        });
    });
}

// Enhanced form animations
function enhanceFormAnimations() {
    const formGroups = document.querySelectorAll('.form-group');
    
    formGroups.forEach(group => {
        const input = group.querySelector('input, select, textarea');
        const label = group.querySelector('label');
        
        if (input && label) {
            // Add floating label effect
            input.addEventListener('focus', function() {
                label.style.transform = 'translateY(-8px) scale(0.9)';
                label.style.color = '#667eea';
            });
            
            input.addEventListener('blur', function() {
                if (!this.value) {
                    label.style.transform = '';
                    label.style.color = '';
                }
            });
            
            // Add input validation animations
            input.addEventListener('invalid', function() {
                this.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    this.style.animation = '';
                }, 500);
            });
        }
    });
}

// Add loading states
function addLoadingStates() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
                
                // Remove loading state after 3 seconds (fallback)
                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    });
}

// Add CSS classes for animations
const style = document.createElement('style');
style.textContent = `
    .animate-fade-in-up {
        animation: fadeInUp 0.6s ease-out both;
    }
    
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .loading {
        position: relative;
        color: transparent !important;
    }
    
    .loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        top: 50%;
        left: 50%;
        margin-left: -8px;
        margin-top: -8px;
        border-radius: 50%;
        border: 2px solid transparent;
        border-top-color: #ffffff;
        animation: spin 1s ease infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Enhanced hover effects */
    .nav-link, .btn-primary, .btn-success, .btn-warning, .btn-danger, .stats-card, .chart-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Smooth focus transitions */
    input:focus, select:focus, textarea:focus {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Enhanced table row hover */
    .data-table tbody tr:hover, .analytics-table tbody tr:hover {
        transition: all 0.2s ease;
    }
    
    /* Modal entrance animation */
    .modal {
        animation: modalFadeIn 0.3s ease-out;
    }
    
    @keyframes modalFadeIn {
        from {
            opacity: 0;
            backdrop-filter: blur(0px);
        }
        to {
            opacity: 1;
            backdrop-filter: blur(10px);
        }
    }
    
    /* Card entrance stagger */
    .stats-card:nth-child(1) { animation-delay: 0.1s; }
    .stats-card:nth-child(2) { animation-delay: 0.2s; }
    .stats-card:nth-child(3) { animation-delay: 0.3s; }
    .stats-card:nth-child(4) { animation-delay: 0.4s; }
    
    /* Enhanced button press effect */
    .btn-primary:active, .btn-success:active, .btn-warning:active, .btn-danger:active {
        transform: scale(0.98);
        transition: transform 0.1s ease;
    }
    
    /* Smooth sidebar toggle */
    .sidebar {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Enhanced status badge hover */
    .status-badge:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
`;

document.head.appendChild(style);

// Add intersection observer for section animations
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

// Observe all major sections
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.analytics-section, .content-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        sectionObserver.observe(section);
    });
});

// Enhanced chart hover effects
document.addEventListener('DOMContentLoaded', function() {
    const chartCards = document.querySelectorAll('.chart-card');
    chartCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
        });
    });
});

// Add smooth page transitions
function addPageTransitions() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Fade out current section
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection) {
                activeSection.style.opacity = '0';
                activeSection.style.transform = 'translateX(-30px)';
                
                setTimeout(() => {
                    activeSection.classList.remove('active');
                    
                    // Fade in new section
                    const targetSection = document.getElementById(this.dataset.section + 'Section');
                    if (targetSection) {
                        targetSection.classList.add('active');
                        targetSection.style.opacity = '0';
                        targetSection.style.transform = 'translateX(30px)';
                        
                        setTimeout(() => {
                            targetSection.style.opacity = '1';
                            targetSection.style.transform = 'translateX(0)';
                        }, 50);
                    }
                }, 200);
            }
        });
    });
}

// Initialize page transitions
document.addEventListener('DOMContentLoaded', addPageTransitions);