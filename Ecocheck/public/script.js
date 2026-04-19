// script.js - Complete Optimized Version with Minimal Website Link

let currentSearchTerm = '';

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌱 EcoCheck - Conscious Consumer Platform Loaded');
    initializeApp();
});

function initializeApp() {
    console.log('🌱 EcoCheck - Initializing...');
    
    // Check for reduced motion preference
    checkMotionPreference();
    
    // Initialize performance optimizations
    optimizeAnimations();
    
    initMobileFeatures();
    loadSustainableBrands();
    setupEventListeners();
    setupAnimations();
    checkUrlParams();
}

// New function to check motion preferences
function checkMotionPreference() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
        console.log('🎬 Reduced motion preference detected');
    }
}

// New function to optimize animations based on device
function optimizeAnimations() {
    const isLowEndDevice = checkIfLowEndDevice();
    
    if (isLowEndDevice || isMobileDevice()) {
        // Apply performance optimizations for low-end/mobile devices
        document.body.classList.add('perf-mode');
        
        // Reduce animation complexity
        const animatedElements = document.querySelectorAll('[class*="animation"], [class*="animate"]');
        animatedElements.forEach(el => {
            el.style.animationPlayState = 'paused';
        });
        
        console.log('📱 Performance mode activated for mobile/low-end device');
    }
}

// Helper function to detect low-end devices
function checkIfLowEndDevice() {
    // Check for low memory devices
    const isLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
    
    // Check for low-end processors (using User Agent hints)
    const userAgent = navigator.userAgent.toLowerCase();
    const isLowEndCPU = userAgent.includes('android go') || 
                       userAgent.includes('moto e') ||
                       userAgent.includes('redmi go');
    
    return isLowMemory || isLowEndCPU;
}

// Mobile-specific initialization
function initMobileFeatures() {
    // Prevent zoom on input focus (iOS)
    document.addEventListener('touchstart', function() {}, {passive: true});
    
    // Add mobile device class for CSS targeting
    if (isMobileDevice()) {
        document.body.classList.add('mobile-device');
        console.log('📱 Mobile device detected');
        
        // Further reduce animations on mobile
        reduceMobileAnimations();
    }
    
    // Setup touch-friendly interactions
    setupTouchInteractions();
    
    // Ensure placeholder is set
    const searchInput = document.getElementById('brandSearch');
    if (searchInput && !searchInput.getAttribute('placeholder')) {
        searchInput.setAttribute('placeholder', 'Search for brands like Patagonia, Allbirds...');
    }
}

// Reduce animations specifically for mobile
function reduceMobileAnimations() {
    // Reduce hero animation intensity
    const heroGlobe = document.querySelector('.earth-globe');
    const heroGlow = document.querySelector('.globe-glow');
    
    if (heroGlobe) {
        heroGlobe.style.animationDuration = '8s';
    }
    
    if (heroGlow) {
        heroGlow.style.animationDuration = '6s';
    }
    
    // Remove some animations on very low-end mobile
    if (window.innerWidth <= 480) {
        const impactIndicators = document.querySelectorAll('.impact-indicator');
        const ratingBubbles = document.querySelectorAll('.rating-bubble');
        
        impactIndicators.forEach(indicator => {
            indicator.style.animation = 'none';
        });
        
        ratingBubbles.forEach(bubble => {
            bubble.style.display = 'none';
        });
    }
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
}

function setupTouchInteractions() {
    // Better touch handling for cards
    const cards = document.querySelectorAll('.brand-card, .browse-card, .quick-search');
    cards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
            this.style.transition = 'transform 0.1s ease';
        });
        card.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Add this to setupEventListeners function
function setupEventListeners() {
    const brandSearch = document.getElementById('brandSearch');
    const searchButton = document.querySelector('.search-btn');
    
    // Enhanced search input handling
    brandSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBrand();
            // Mobile: hide keyboard after search
            if (isMobileDevice()) {
                this.blur();
            }
        }
    });
    
    // Clear search button state on input
    brandSearch.addEventListener('input', function(e) {
        currentSearchTerm = e.target.value.trim();
        toggleSearchButton();
    });
    
    // Add click handler for mobile search button
    searchButton.addEventListener('click', function(e) {
        e.preventDefault();
        searchBrand();
    });
    
    // Mobile-specific: prevent keyboard from hiding important content
    brandSearch.addEventListener('focus', function() {
        if (isMobileDevice()) {
            setTimeout(() => {
                // Scroll search into view on mobile
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Show search button prominently
                searchButton.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    searchButton.style.transform = 'scale(1)';
                }, 300);
            }, 300);
        }
    });
    
    // Add touch feedback for mobile search button
    searchButton.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.95)';
        this.style.opacity = '0.9';
    });
    
    searchButton.addEventListener('touchend', function() {
        this.style.transform = 'scale(1)';
        this.style.opacity = '1';
    });
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(handleOrientationChange, 300);
    });
    
    // Handle resize for mobile
    window.addEventListener('resize', debounce(function() {
        if (isMobileDevice()) {
            adjustMobileLayout();
        }
    }, 250));
}

function handleOrientationChange() {
    console.log('🔄 Orientation changed, adjusting layout...');
    // Recalculate any layout-dependent elements
    setupAnimations();
}

function adjustMobileLayout() {
    // Adjust layout for mobile screens
    const heroSection = document.querySelector('.hero-section');
    if (heroSection && window.innerWidth <= 768) {
        heroSection.style.minHeight = 'auto';
    }
}

function setupAnimations() {
    // Skip complex animations on mobile/low-end devices
    if (document.body.classList.contains('perf-mode') || 
        document.body.classList.contains('reduced-motion')) {
        setupSimpleAnimations();
        return;
    }

    // Only enable complex animations on capable devices
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Use transform3d for hardware acceleration
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translate3d(0, 0, 0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .brand-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translate3d(0, 20px, 0)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Simple animations for mobile/low-end devices
function setupSimpleAnimations() {
    const observerOptions = {
        threshold: 0.05,
        rootMargin: '0px 0px -10px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Simple fade in only
                entry.target.style.opacity = '1';
                // No transform animation for better performance
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .brand-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.4s ease';
        observer.observe(el);
    });
}

// Update the toggleSearchButton function to handle mobile specifically
function toggleSearchButton() {
    const searchButton = document.querySelector('.search-btn');
    const searchIcon = searchButton.querySelector('i');
    
    if (currentSearchTerm.length > 0) {
        searchButton.disabled = false;
        searchButton.classList.add('active');
        
        // On mobile, change icon to checkmark when there's text
        if (isMobileDevice() && searchIcon) {
            searchIcon.className = 'fas fa-check';
        }
    } else {
        searchButton.disabled = false; // Always enabled on mobile
        searchButton.classList.remove('active');
        
        // On mobile, revert to search icon
        if (isMobileDevice() && searchIcon) {
            searchIcon.className = 'fas fa-search';
        }
    }
}


function quickSearch(brandName) {
    document.getElementById('brandSearch').value = brandName;
    currentSearchTerm = brandName;
    toggleSearchButton();
    
    // Mobile: close keyboard if open
    if (isMobileDevice()) {
        document.getElementById('brandSearch').blur();
    }
    
    searchBrand();
}

async function searchBrand() {
    const brandName = document.getElementById('brandSearch').value.trim();
    const resultsSection = document.getElementById('resultsSection');
    const resultsDiv = document.getElementById('results');
    
    if (!brandName) {
        showAlert('Please enter a brand name to search', 'warning');
        return;
    }

    try {
        setSearchLoading(true);
        
        // Mobile: show loading state immediately
        if (isMobileDevice()) {
            resultsSection.style.display = 'block';
            resultsDiv.innerHTML = `
                <div class="card-body text-center p-4">
                    <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto;"></div>
                    <p class="mt-3 mb-0">Searching for "${brandName}"...</p>
                </div>
            `;
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        const response = await fetch(`/api/brands/search/${encodeURIComponent(brandName)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayBrandInfo(data);
        
    } catch (error) {
        console.error('Search error:', error);
        
        // Enhanced error message for mobile
        const errorMessage = isMobileDevice() 
            ? 'Search failed. Check your connection.'
            : 'Error searching for brand. Please check your connection and try again.';
            
        showAlert(errorMessage, 'danger');
        
        // Show error in results section
        if (resultsSection.style.display === 'block') {
            resultsDiv.innerHTML = `
                <div class="card-body text-center p-4">
                    <i class="fas fa-wifi fa-2x text-muted mb-3"></i>
                    <h4 class="text-muted">Connection Error</h4>
                    <p class="text-muted">Please check your internet connection and try again.</p>
                    <button class="btn btn-success" onclick="searchBrand()">
                        <i class="fas fa-redo me-2"></i>Try Again
                    </button>
                </div>
            `;
        }
    } finally {
        setSearchLoading(false);
    }
}

// Update the setSearchLoading function for mobile
function setSearchLoading(isLoading) {
    const searchButton = document.querySelector('.search-btn');
    const searchInput = document.getElementById('brandSearch');
    
    if (isLoading) {
        searchButton.disabled = true;
        searchInput.disabled = true;
        searchButton.innerHTML = '<div class="loading-spinner"></div>';
        
        // Mobile specific loading state
        if (isMobileDevice()) {
            searchButton.classList.add('loading');
            searchButton.style.opacity = '0.7';
        }
    } else {
        searchButton.disabled = false;
        searchInput.disabled = false;
        
        // Reset button content - different for mobile vs desktop
        if (isMobileDevice()) {
            searchButton.innerHTML = '<i class="fas fa-search"></i>';
        } else {
            searchButton.innerHTML = '<i class="fas fa-search me-2"></i><span>Check Impact</span>';
        }
        
        searchButton.classList.remove('loading');
        searchButton.style.opacity = '1';
    }
}


function displayBrandInfo(data) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsDiv = document.getElementById('results');
    
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    resultsSection.style.display = 'block';
    
    if (!data.found) {
        resultsDiv.innerHTML = `
            <div class="card-body text-center p-5">
                <div class="empty-state">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h3 class="text-muted">${data.message}</h3>
                    <p class="text-muted mb-4">We're constantly adding new brands to our database to help you make informed choices.</p>
                    <div class="suggestions">
                        <strong>Try searching for:</strong>
                        <div class="mt-2">
                            <span class="badge bg-light text-dark me-2 p-2" onclick="quickSearch('Patagonia')">Patagonia</span>
                            <span class="badge bg-light text-dark me-2 p-2" onclick="quickSearch('Allbirds')">Allbirds</span>
                            <span class="badge bg-light text-dark me-2 p-2" onclick="quickSearch('No Nasties')">No Nasties</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const sustainabilityClass = data.is_sustainable ? 'success' : 'danger';
    const sustainabilityText = data.is_sustainable ? 'Sustainable' : 'Not Sustainable';
    const ratingStars = data.sustainability_rating ? 
        '★'.repeat(data.sustainability_rating) + '☆'.repeat(5 - data.sustainability_rating) : '☆☆☆☆☆';
    
    const flagEmoji = getFlagEmoji(data.country);

    resultsDiv.innerHTML = `
        <div class="card-body p-3">
            <!-- Ultra Minimal Header -->
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h4 class="mb-1 text-eco-dark">${data.name}</h4>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-${sustainabilityClass}">${sustainabilityText}</span>
                        <small class="text-muted">${flagEmoji} ${data.country}</small>
                    </div>
                </div>
                ${data.website_url ? `
                    <a href="${data.website_url}" target="_blank" class="btn btn-sm btn-success">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                ` : ''}
            </div>
            <p class="text-muted small mb-3">${data.description}</p>
            
            <!-- Ultra Minimal Rating -->
            <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-3">
                <div class="text-center">
                    <div class="text-warning small" style="letter-spacing: 1px;">${ratingStars}</div>
                    <div><strong class="h5">${data.sustainability_rating}</strong><span class="text-muted">/5</span></div>
                </div>
                <span class="badge bg-${data.sustainability_rating >= 4 ? 'success' : data.sustainability_rating >= 3 ? 'warning' : 'danger'}">
                    ${data.sustainability_rating >= 4 ? 'Excellent' : data.sustainability_rating >= 3 ? 'Good' : 'Needs Improvement'}
                </span>
            </div>
            
            <!-- Compact Details -->
            <div class="sustainability-details-compact">
                <h6 class="text-eco-dark mb-2">Sustainability Details</h6>
                <p class="mb-2 small">${data.sustainability_details}</p>
                
                ${data.eco_certifications && data.eco_certifications !== 'None' ? `
                    <div class="certifications-compact mt-2">
                        <h6 class="text-eco-dark mb-1 small">Eco Certifications</h6>
                        <p class="mb-0 small text-muted">${data.eco_certifications}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

async function loadSustainableBrands() {
    try {
        const response = await fetch('/api/brands/sustainable');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const brands = await response.json();
        const limitedBrands = brands.slice(0, 3);
        displaySustainableBrands(limitedBrands);
        
    } catch (error) {
        console.error('Error loading sustainable brands:', error);
        showBrandsError();
    }
}

function displaySustainableBrands(brands) {
    const brandsListDiv = document.getElementById('sustainableBrandsList');
    
    if (brands.length === 0) {
        brandsListDiv.innerHTML = `
            <div class="col-12 text-center">
                <div class="empty-state">
                    <i class="fas fa-leaf fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No Sustainable Brands Found</h4>
                    <p class="text-muted">Check back soon as we add more eco-friendly brands to our database.</p>
                </div>
            </div>
        `;
        return;
    }
    
    brandsListDiv.innerHTML = brands.map(brand => {
        const flagEmoji = getFlagEmoji(brand.country);
        
        // Generate website button for sustainable brands
        const websiteButton = brand.website_url ? `
            <a href="${brand.website_url}" target="_blank" rel="noopener noreferrer" 
               class="btn btn-sm btn-outline-primary me-2" style="min-width: 44px;">
                <i class="fas fa-external-link-alt me-1"></i>Website
            </a>
        ` : '';
        
        return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="brand-card ${isMobileDevice() ? 'brand-card-mobile' : ''}">
                <h5>${brand.name}</h5>
                
                <div class="brand-geo mb-2">
                    <small class="text-muted">
                        ${flagEmoji} ${brand.country} • ${brand.region}
                    </small>
                </div>
                
                <p class="card-text">${brand.description || 'A brand committed to sustainability and environmental responsibility.'}</p>
                
                <div class="brand-meta">
                    <div class="rating-stars text-warning mb-3">
                        ${'★'.repeat(brand.sustainability_rating)}${'☆'.repeat(5-brand.sustainability_rating)}
                        <small class="text-muted ms-2">${brand.sustainability_rating}/5</small>
                    </div>
                    
                    <div class="brand-actions">
                        ${websiteButton}
                        <button class="btn btn-sm btn-outline-success" onclick="quickSearch('${brand.name.replace(/'/g, "\\'")}')" style="min-width: 44px;">
                            <i class="fas fa-search me-1"></i>Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function getFlagEmoji(country) {
    const flagEmojis = {
        'United States': '🇺🇸',
        'Canada': '🇨🇦',
        'United Kingdom': '🇬🇧',
        'China': '🇨🇳',
        'India': '🇮🇳'
    };
    return flagEmojis[country] || '🏴';
}

function showBrandsError() {
    const brandsListDiv = document.getElementById('sustainableBrandsList');
    brandsListDiv.innerHTML = `
        <div class="col-12 text-center">
            <div class="error-state">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h4 class="text-danger">Unable to Load Brands</h4>
                <p class="text-muted">Please check your connection and try refreshing the page.</p>
                <button class="btn btn-outline-primary" onclick="loadSustainableBrands()" style="min-width: 120px;">
                    <i class="fas fa-redo me-2"></i>Try Again
                </button>
            </div>
        </div>
    `;
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    
    if (searchParam) {
        document.getElementById('brandSearch').value = searchParam;
        currentSearchTerm = searchParam;
        toggleSearchButton();
        
        // Mobile: slight delay for better UX
        if (isMobileDevice()) {
            setTimeout(() => searchBrand(), 500);
        } else {
            searchBrand();
        }
    }
}

function showAlert(message, type) {
    const existingAlert = document.querySelector('.global-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `global-alert alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" style="min-width: 44px; min-height: 44px;"></button>
    `;

    // Mobile-optimized alert positioning
    if (isMobileDevice()) {
        alertDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            right: 10px;
            z-index: 9999;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border-radius: 12px;
            margin: 0;
        `;
    } else {
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.25);
            border-radius: 10px;
        `;
    }

    document.body.appendChild(alertDiv);

    // Auto-dismiss after delay
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Add CSS for website link icon
const websiteLinkStyles = `
    /* Website Link Icon */
    .website-link-icon {
        color: #3b82f6;
        transition: all 0.2s ease;
        opacity: 0.7;
    }
    
    .website-link-icon:hover {
        color: #2563eb;
        opacity: 1;
        transform: translateY(-1px);
    }
    
    .website-link-icon:active {
        transform: translateY(0);
    }
    
    /* Rating Display */
    .rating-display {
        padding: 1rem;
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(251, 191, 36, 0.05) 100%);
        border-radius: 12px;
        border-left: 4px solid #f59e0b;
    }
    
    /* Mobile Optimizations */
    @media (max-width: 768px) {
        .website-link-icon {
            font-size: 1.25rem !important;
        }
        
        .card-body {
            padding: 1.5rem !important;
        }
        
        h3 {
            font-size: 1.75rem;
        }
        
        .rating-display {
            padding: 1rem;
        }
        
        .text-warning.fs-2 {
            font-size: 1.5rem !important;
            letter-spacing: 2px !important;
        }
        
        .display-5 {
            font-size: 2.5rem;
        }
        
        .action-buttons .btn {
            width: 100%;
            margin-bottom: 0.5rem;
            justify-content: center;
        }
        
        .action-buttons .d-flex {
            flex-direction: column;
        }
    }
    
    @media (max-width: 576px) {
        .card-body {
            padding: 1.25rem !important;
        }
        
        h3 {
            font-size: 1.5rem;
        }
        
        .d-flex.align-items-center.mb-3 {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .website-link-icon {
            margin-left: 0 !important;
            margin-top: 0.5rem;
            align-self: flex-start;
        }
        
        .rating-display {
            text-align: center;
        }
    }
`;

// Inject website link styles only once
if (!document.querySelector('#website-link-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'website-link-styles';
    styleSheet.textContent = websiteLinkStyles;
    document.head.appendChild(styleSheet);
}

