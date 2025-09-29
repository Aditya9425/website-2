/* ===== SEARCH MOBILE FUNCTIONALITY FIX ===== */

// Enhanced search functionality for mobile devices
document.addEventListener('DOMContentLoaded', function() {
    // Only run if search elements exist
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchBtn || !searchResults) {
        return;
    }
    
    // Mobile-specific search enhancements
    if (window.innerWidth <= 768) {
        initializeMobileSearch();
    }
    
    // Re-initialize on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            initializeMobileSearch();
        }
    });
});

function initializeMobileSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;
    
    // Prevent iOS zoom on input focus
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        searchInput.style.fontSize = '16px';
        searchInput.addEventListener('focus', function() {
            this.style.fontSize = '16px';
        });
    }
    
    // Enhanced touch handling for mobile
    searchInput.addEventListener('touchstart', function(e) {
        e.stopPropagation();
    }, { passive: true });
    
    // Improved search results positioning for mobile
    function positionSearchResults() {
        if (window.innerWidth <= 768) {
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer && searchResults) {
                const rect = searchContainer.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                
                // Position results to fit within viewport
                searchResults.style.position = 'fixed';
                searchResults.style.top = (rect.bottom + 10) + 'px';
                searchResults.style.left = '15px';
                searchResults.style.right = '15px';
                searchResults.style.width = 'auto';
                searchResults.style.maxWidth = (viewportWidth - 30) + 'px';
                searchResults.style.zIndex = '1002';
            }
        }
    }
    
    // Position results when they're shown
    const originalDisplayResults = window.displaySearchResults;
    if (originalDisplayResults) {
        window.displaySearchResults = function(results, query) {
            originalDisplayResults(results, query);
            setTimeout(positionSearchResults, 10);
        };
    }
    
    // Enhanced touch handling for search result items
    function enhanceSearchResultItems() {
        const resultItems = document.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
            // Remove existing listeners to prevent duplicates
            item.removeEventListener('touchend', handleResultItemTouch);
            item.addEventListener('touchend', handleResultItemTouch, { passive: false });
        });
    }
    
    function handleResultItemTouch(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Add visual feedback
        this.style.backgroundColor = 'rgba(252, 108, 133, 0.1)';
        
        setTimeout(() => {
            this.style.backgroundColor = '';
            // Trigger the navigation
            if (this.onclick) {
                this.onclick();
            } else {
                // Fallback navigation
                const productId = this.dataset.productId;
                if (productId) {
                    window.location.href = `product.html?id=${productId}`;
                }
            }
        }, 150);
    }
    
    // Override the original search result display to add mobile enhancements
    const originalPerformSearch = window.performSearch;
    if (originalPerformSearch) {
        window.performSearch = function(query) {
            originalPerformSearch(query);
            setTimeout(() => {
                positionSearchResults();
                enhanceSearchResultItems();
            }, 50);
        };
    }
    
    // Enhanced hide search results for mobile
    function hideSearchResultsMobile() {
        if (searchResults) {
            searchResults.style.display = 'none';
            // Reset positioning
            if (window.innerWidth <= 768) {
                searchResults.style.position = 'absolute';
                searchResults.style.top = 'calc(100% + 10px)';
                searchResults.style.left = '15px';
                searchResults.style.right = '15px';
            }
        }
    }
    
    // Override the original hide function
    if (window.hideSearchResults) {
        const originalHideResults = window.hideSearchResults;
        window.hideSearchResults = function() {
            if (window.innerWidth <= 768) {
                hideSearchResultsMobile();
            } else {
                originalHideResults();
            }
        };
    }
    
    // Enhanced outside click handling for mobile
    document.addEventListener('touchstart', function(e) {
        const searchContainer = document.querySelector('.search-container');
        const searchResults = document.getElementById('searchResults');
        
        if (searchContainer && searchResults && 
            !searchContainer.contains(e.target) && 
            !searchResults.contains(e.target)) {
            hideSearchResultsMobile();
        }
    }, { passive: true });
    
    // Prevent search results from closing when scrolling within them
    if (searchResults) {
        searchResults.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        }, { passive: true });
        
        searchResults.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, { passive: true });
    }
    
    // Enhanced keyboard handling for mobile
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Blur the input to hide mobile keyboard
            this.blur();
            
            // Perform search
            const query = this.value.trim();
            if (query && window.performSearch) {
                window.performSearch(query);
            }
        }
    });
    
    // Auto-hide keyboard when search results are shown
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'style' && 
                searchResults.style.display === 'block') {
                // Small delay to ensure results are rendered
                setTimeout(() => {
                    if (document.activeElement === searchInput) {
                        searchInput.blur();
                    }
                }, 100);
            }
        });
    });
    
    observer.observe(searchResults, { 
        attributes: true, 
        attributeFilter: ['style'] 
    });
}

// Utility function to check if device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

// Enhanced navigation function for mobile
function navigateToProductMobile(productId) {
    // Add loading state
    const searchResults = document.getElementById('searchResults');
    if (searchResults && isMobileDevice()) {
        searchResults.innerHTML = '<div class="search-loading">Loading...</div>';
    }
    
    // Hide search results
    if (window.hideSearchResults) {
        window.hideSearchResults();
    }
    
    // Clear search input on mobile after selection
    const searchInput = document.getElementById('searchInput');
    if (searchInput && isMobileDevice()) {
        searchInput.blur();
        searchInput.value = '';
    }
    
    // Navigate to product
    window.location.href = `product.html?id=${productId}`;
}

// Override the global navigation function if it exists
if (window.navigateToProduct) {
    const originalNavigateToProduct = window.navigateToProduct;
    window.navigateToProduct = function(productId) {
        if (isMobileDevice()) {
            navigateToProductMobile(productId);
        } else {
            originalNavigateToProduct(productId);
        }
    };
}

// Add CSS for loading state
const style = document.createElement('style');
style.textContent = `
    .search-loading {
        text-align: center;
        padding: 20px;
        color: #666;
        font-style: italic;
    }
    
    @media (max-width: 768px) {
        .search-result-item {
            -webkit-tap-highlight-color: rgba(252, 108, 133, 0.2);
            tap-highlight-color: rgba(252, 108, 133, 0.2);
        }
        
        .search-results {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
        }
    }
`;
document.head.appendChild(style);

// Export functions for global use
window.initializeMobileSearch = initializeMobileSearch;
window.navigateToProductMobile = navigateToProductMobile;
window.isMobileDevice = isMobileDevice;