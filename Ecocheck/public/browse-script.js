let allBrands = [];
let currentFilter = 'all';
let currentSearchTerm = '';
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;

let activeFilters = {
    categories: [],
    certifications: [],
    minRating: 0,
    ratingFilterType: 'exact',
    priceRange: null
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌱 Browse Brands Page Loaded');
    initializeBrowsePage();
});

function initializeBrowsePage() {
    loadAllBrands();
    setupBrowseEventListeners();
    setupPaginationListeners();
}

function setupBrowseEventListeners() {
    const browseSearch = document.getElementById('browseSearch');
    
    browseSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            currentPage = 1;
            filterBrands();
        }
    });
    
    browseSearch.addEventListener('input', function(e) {
        currentSearchTerm = e.target.value.trim();
    });
    
    setupFilterModal();
}

function setupPaginationListeners() {
    // Previous page button
    const prevPageBtn = document.getElementById('prevPageBtn');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', goToPreviousPage);
    }
    
    // Next page button
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', goToNextPage);
    }
    
    // Page number buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('page-number')) {
            const pageNum = parseInt(e.target.dataset.page);
            if (pageNum !== currentPage) {
                currentPage = pageNum;
                filterBrands();
                scrollToBrandsGrid();
            }
        }
    });
}

function setupFilterModal() {
    const ratingSlider = document.getElementById('ratingFilter');
    const ratingValue = document.getElementById('ratingValue');
    const applyFiltersBtn = document.getElementById('applyFilters');
    
    if (ratingSlider && ratingValue) {
        ratingSlider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            ratingValue.textContent = value === 0 ? 'All' : value + '★';
        });
        
        // Set initial display
        ratingValue.textContent = 'All';
    }
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
}

function applyFilters() {
    console.log('Applying filters...');
    
    // Get rating filter type
    const ratingTypeRadio = document.querySelector('input[name="ratingFilterType"]:checked');
    if (ratingTypeRadio) {
        activeFilters.ratingFilterType = ratingTypeRadio.value;
    }
    
    // Get minimum rating
    const ratingSlider = document.getElementById('ratingFilter');
    if (ratingSlider) {
        const ratingValue = parseFloat(ratingSlider.value);
        activeFilters.minRating = ratingValue;
        console.log(`Rating filter: ${activeFilters.ratingFilterType} ${ratingValue}★`);
    }
    
    // Get certifications
    activeFilters.certifications = [];
    document.querySelectorAll('#filterForm input[type="checkbox"]:checked').forEach(checkbox => {
        const value = checkbox.value;
        if (['bcorp', 'organic', 'fairtrade', 'vegan'].includes(value)) {
            activeFilters.certifications.push(value);
        }
    });
    
    console.log('Active Filters:', activeFilters);
    
    // Apply the filters
    currentPage = 1;
    filterBrands();
    
    // Show filter indicator
    showFilterIndicator(activeFilters);
    
    // Close modal
    const filterModal = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
    if (filterModal) {
        filterModal.hide();
    }
}

function showFilterIndicator(filters) {
    // Remove existing indicator
    const existingIndicator = document.querySelector('.active-filters-wrapper');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Build filter description
    let filterDescriptions = [];
    let filterTypes = []; // Track what type each filter is
    
    if (filters.minRating > 0) {
        let ratingDesc = `${filters.minRating}★`;
        if (filters.ratingFilterType === 'lessEqual') {
            ratingDesc = `≤ ${filters.minRating}★`;
        } else if (filters.ratingFilterType === 'greaterEqual') {
            ratingDesc = `≥ ${filters.minRating}★`;
        }
        filterDescriptions.push(ratingDesc);
        filterTypes.push('rating');
    }
    
    if (filters.certifications.length > 0) {
        filterDescriptions.push(`${filters.certifications.length} cert(s)`);
        filterTypes.push('certifications');
    }
    
    const filterCount = filterDescriptions.length;
    
    if (filterCount > 0) {
        // Create minimalistic container
        const indicator = document.createElement('div');
        indicator.className = 'active-filters-wrapper';
        
        // Build chips HTML with data attributes
        let chipsHTML = '';
        filterDescriptions.forEach((desc, index) => {
            chipsHTML += `
                <div class="filter-chip" data-filter-type="${filterTypes[index]}">
                    <span class="chip-label">${desc}</span>
                    <button class="chip-remove" data-filter-index="${index}" aria-label="Remove ${desc} filter">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            `;
        });
        
        indicator.innerHTML = `
            <div class="filters-header">
                <span class="filters-count">${filterCount} filter${filterCount > 1 ? 's' : ''} applied</span>
                <button id="clearAllFilters" class="clear-all-btn">Clear all</button>
            </div>
            <div class="filter-chips">
                ${chipsHTML}
            </div>
        `;
        
        // Insert after the search container
        const searchContainer = document.querySelector('.search-filter-container');
        
        if (searchContainer) {
            searchContainer.parentNode.insertBefore(indicator, searchContainer.nextSibling);
            
            // Add event listeners immediately
            addFilterIndicatorListeners(indicator, filters);
        }
    }
}

// Separate function to add listeners
function addFilterIndicatorListeners(indicator, filters) {
    // Clear all button
    const clearAllBtn = indicator.querySelector('#clearAllFilters');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearAllFilters();
        });
    }
    
    // Individual chip remove buttons
    const chipRemoveBtns = indicator.querySelectorAll('.chip-remove');
    chipRemoveBtns.forEach((btn) => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Important: prevent event bubbling
            
            const filterType = this.closest('.filter-chip').dataset.filterType;
            removeSingleFilter(filterType);
        });
    });
}

// New improved removeSingleFilter function
function removeSingleFilter(filterType) {
    console.log(`Removing filter type: ${filterType}`);
    
    // Remove specific filter
    if (filterType === 'rating') {
        activeFilters.minRating = 0;
        
        // Also reset the rating slider in the modal
        const ratingSlider = document.getElementById('ratingFilter');
        const ratingValue = document.getElementById('ratingValue');
        if (ratingSlider && ratingValue) {
            ratingSlider.value = 0;
            ratingValue.textContent = 'All';
        }
        
        // Reset rating filter type
        const exactRadio = document.querySelector('input[name="ratingFilterType"][value="exact"]');
        if (exactRadio) {
            exactRadio.checked = true;
            activeFilters.ratingFilterType = 'exact';
        }
        
    } else if (filterType === 'certifications') {
        activeFilters.certifications = [];
        
        // Uncheck certification checkboxes in the modal
        document.querySelectorAll('#filterForm input[type="checkbox"]:checked').forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    console.log('Active filters after removal:', activeFilters);
    
    // Re-filter brands without calling applyFilters()
    currentPage = 1;
    filterBrands();
    
    // Update the filter indicator
    showFilterIndicator(activeFilters);
}
// function showFilterIndicator(filters) {
//     // Remove existing indicator
//     const existingIndicator = document.querySelector('.active-filters-indicator');
//     if (existingIndicator) {
//         existingIndicator.remove();
//     }
    
//     // Build filter description
//     let filterDescriptions = [];
    
//     if (filters.minRating > 0) {
//         let ratingDesc = `${filters.minRating}★`;
//         if (filters.ratingFilterType === 'lessEqual') {
//             ratingDesc = `≤ ${filters.minRating}★`;
//         } else if (filters.ratingFilterType === 'greaterEqual') {
//             ratingDesc = `≥ ${filters.minRating}★`;
//         }
//         filterDescriptions.push(ratingDesc); // Simplified - just show stars
//     }
    
//     if (filters.certifications.length > 0) {
//         filterDescriptions.push(`${filters.certifications.length} cert(s)`);
//     }
    
//     const filterCount = filterDescriptions.length;
    
//     if (filterCount > 0) {
//         // Create minimalistic container
//         const indicator = document.createElement('div');
//         indicator.className = 'active-filters-wrapper';
        
//         indicator.innerHTML = `
//             <div class="filters-header">
//                 <span class="filters-count">${filterCount} filter${filterCount > 1 ? 's' : ''} applied</span>
//                 <button id="clearAllFilters" class="clear-all-btn">Clear all</button>
//             </div>
//             <div class="filter-chips">
//                 ${filterDescriptions.map(desc => `
//                     <div class="filter-chip">
//                         <span class="chip-label">${desc}</span>
//                         <button class="chip-remove" aria-label="Remove ${desc} filter">
//                             <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//                                 <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
//                             </svg>
//                         </button>
//                     </div>
//                 `).join('')}
//             </div>
//         `;
        
//         // Insert after the search container
//         const searchContainer = document.querySelector('.search-filter-container');
        
//         if (searchContainer) {
//             searchContainer.parentNode.insertBefore(indicator, searchContainer.nextSibling);
            
//             // Add event listeners to close buttons
//             setTimeout(() => {
//                 // Clear all button
//                 const clearAllBtn = document.getElementById('clearAllFilters');
//                 if (clearAllBtn) {
//                     clearAllBtn.addEventListener('click', clearAllFilters);
//                 }
                
//                 // Individual chip remove buttons
//                 const chipRemoveBtns = indicator.querySelectorAll('.chip-remove');
//                 chipRemoveBtns.forEach((btn, index) => {
//                     btn.addEventListener('click', function() {
//                         removeSingleFilter(index, filters);
//                     });
//                 });
//             }, 100);
//         }
//     }
// }

// // New function to remove individual filters
// function removeSingleFilter(index, currentFilters) {
//     // Determine which filter to remove based on index
//     if (index === 0 && currentFilters.minRating > 0) {
//         // Remove rating filter
//         currentFilters.minRating = 0;
//     } else if (index === 1 || (index === 0 && !currentFilters.minRating)) {
//         // Remove certifications
//         currentFilters.certifications = [];
//     }
    
//     // Re-apply filters and update UI
//     applyFilters();
//     showFilterIndicator(currentFilters);
// }
function clearAllFilters(e) {
    if (e) e.preventDefault();
    if (e) e.stopPropagation(); // Add this line
    
    console.log('Clearing all filters...');
    
    // Reset ALL filter variables
    activeFilters = {
        categories: [],
        certifications: [],
        minRating: 0,
        ratingFilterType: 'exact',
        priceRange: null
    };
    
    currentSearchTerm = '';
    currentPage = 1;
    currentFilter = 'all';
    
    // Reset the form in the modal
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.reset();
        
        // Reset rating slider
        const ratingSlider = document.getElementById('ratingFilter');
        const ratingValue = document.getElementById('ratingValue');
        if (ratingSlider && ratingValue) {
            ratingSlider.value = 0;
            ratingValue.textContent = 'All';
        }
        
        // Reset rating filter type to default
        const exactRadio = document.querySelector('input[name="ratingFilterType"][value="exact"]');
        if (exactRadio) {
            exactRadio.checked = true;
        }
    }
    
    // Reset the search input
    const browseSearch = document.getElementById('browseSearch');
    if (browseSearch) {
        browseSearch.value = '';
    }
    
    // Remove filter indicator
    const indicator = document.querySelector('.active-filters-wrapper');
    if (indicator) {
        indicator.remove();
    }
    
    // Reset sort dropdown to default
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.value = 'name';
    }
    
    // Filter brands (this will show all brands since filters are cleared)
    filterBrands();
    
    console.log('All filters cleared successfully');
}
// function clearAllFilters(e) {
//     if (e) e.preventDefault();
    
//     console.log('Clearing all filters...');
    
//     // Reset ALL filter variables
//     activeFilters = {
//         categories: [],
//         certifications: [],
//         minRating: 0,
//         ratingFilterType: 'exact',
//         priceRange: null
//     };
    
//     currentSearchTerm = '';
//     currentPage = 1;
//     currentFilter = 'all';
    
//     // Reset the form in the modal
//     const filterForm = document.getElementById('filterForm');
//     if (filterForm) {
//         filterForm.reset();
        
//         // Reset rating slider
//         const ratingSlider = document.getElementById('ratingFilter');
//         const ratingValue = document.getElementById('ratingValue');
//         if (ratingSlider && ratingValue) {
//             ratingSlider.value = 0;
//             ratingValue.textContent = 'All';
//         }
        
//         // Reset rating filter type to default
//         const exactRadio = document.querySelector('input[name="ratingFilterType"][value="exact"]');
//         if (exactRadio) {
//             exactRadio.checked = true;
//         }
//     }
    
//     // Reset the search input
//     const browseSearch = document.getElementById('browseSearch');
//     if (browseSearch) {
//         browseSearch.value = '';
//     }
    
//     // Remove filter indicator
//     const indicator = document.querySelector('.active-filters-indicator');
//     if (indicator) {
//         indicator.remove();
//     }
    
//     // Reset sort dropdown to default
//     const sortSelect = document.getElementById('sortSelect');
//     if (sortSelect) {
//         sortSelect.value = 'name';
//     }
    
//     // SHOW ALL BRANDS
//     console.log('Displaying ALL brands:', allBrands.length);
//     displayBrands(allBrands);
    
//     console.log('All filters cleared successfully');
// }

function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        filterBrands();
        scrollToBrandsGrid();
    }
}

function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        filterBrands();
        scrollToBrandsGrid();
    }
}

function scrollToBrandsGrid() {
    const brandsGrid = document.getElementById('brandsGrid');
    if (brandsGrid) {
        brandsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

async function loadAllBrands() {
    try {
        console.log('Loading brands from API...');
        const response = await fetch('/api/brands');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allBrands = await response.json();
        console.log(`Loaded ${allBrands.length} brands`);
        
        // Show all brands initially
        displayBrands(allBrands);
        
    } catch (error) {
        console.error('Error loading brands:', error);
        showBrowseError();
    }
}

function filterBrands() {
    console.log('Filtering brands with criteria:', activeFilters);
    
    let filteredBrands = [...allBrands];
    
    // Apply search filter
    if (currentSearchTerm) {
        filteredBrands = filteredBrands.filter(brand => 
            brand.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
            (brand.description && brand.description.toLowerCase().includes(currentSearchTerm.toLowerCase()))
        );
        console.log(`After search "${currentSearchTerm}": ${filteredBrands.length} brands`);
    }
    
    // Apply rating filter based on type
    if (activeFilters.minRating > 0) {
        const ratingValue = activeFilters.minRating;
        const originalCount = filteredBrands.length;
        
        filteredBrands = filteredBrands.filter(brand => {
            const rating = brand.sustainability_rating || 0;
            
            switch (activeFilters.ratingFilterType) {
                case 'exact':
                    return rating === ratingValue;
                case 'lessEqual':
                    return rating <= ratingValue;
                case 'greaterEqual':
                    return rating >= ratingValue;
                default:
                    return true;
            }
        });
        
        console.log(`After rating filter ${activeFilters.ratingFilterType} ${ratingValue}★: ${filteredBrands.length} brands (was ${originalCount})`);
    }
    
    // Apply certifications filter
    if (activeFilters.certifications.length > 0) {
        const originalCount = filteredBrands.length;
        
        filteredBrands = filteredBrands.filter(brand => {
            if (!brand.eco_certifications || brand.eco_certifications === 'None') {
                return false;
            }
            const brandCerts = brand.eco_certifications.toLowerCase();
            return activeFilters.certifications.some(cert => 
                brandCerts.includes(cert.toLowerCase())
            );
        });
        
        console.log(`After certifications filter: ${filteredBrands.length} brands (was ${originalCount})`);
    }
    
    // Apply sustainability filter
    if (currentFilter === 'sustainable') {
        const originalCount = filteredBrands.length;
        filteredBrands = filteredBrands.filter(brand => brand.is_sustainable);
        console.log(`After sustainable filter: ${filteredBrands.length} brands (was ${originalCount})`);
    } else if (currentFilter === 'non-sustainable') {
        const originalCount = filteredBrands.length;
        filteredBrands = filteredBrands.filter(brand => !brand.is_sustainable);
        console.log(`After non-sustainable filter: ${filteredBrands.length} brands (was ${originalCount})`);
    }
    
    console.log(`Total filtered: ${filteredBrands.length} brands`);
    
    // Apply sorting
    const sortValue = document.getElementById('sortSelect').value;
    sortBrands(filteredBrands, sortValue);
}

function sortBrands(brandsToSort = null, sortValue = null) {
    const sortSelect = document.getElementById('sortSelect');
    const sortBy = sortValue || sortSelect.value;
    
    let brands = brandsToSort || [...allBrands];
    
    switch (sortBy) {
        case 'name':
            brands.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'rating-desc':
            brands.sort((a, b) => (b.sustainability_rating || 0) - (a.sustainability_rating || 0));
            break;
        case 'rating-asc':
            brands.sort((a, b) => (a.sustainability_rating || 0) - (b.sustainability_rating || 0));
            break;
    }
    
    displayBrands(brands);
}

function displayBrands(brands) {
    const brandsGrid = document.getElementById('brandsGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noResults = document.getElementById('noResults');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');
    
    loadingSpinner.style.display = 'none';
    
    // If no brands array provided, use allBrands
    if (!brands) {
        brands = [...allBrands];
    }
    
    // Calculate pagination
    totalPages = Math.ceil(brands.length / itemsPerPage);
    
    // Ensure current page is valid
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    } else if (totalPages === 0) {
        currentPage = 1;
    }
    
    // Calculate start and end indices
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, brands.length);
    const currentPageBrands = brands.slice(startIndex, endIndex);
    
    // Update pagination info
    if (paginationInfo) {
        if (brands.length > 0) {
            paginationInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${brands.length} brands`;
        } else {
            paginationInfo.textContent = 'No brands found';
        }
    }
    
    // Show/hide no results message
    if (brands.length === 0) {
        noResults.style.display = 'block';
        brandsGrid.innerHTML = '';
        
        // Hide pagination when no results
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }
        return;
    } else {
        noResults.style.display = 'none';
    }
    
    // Display brands for current page
    brandsGrid.innerHTML = currentPageBrands.map(brand => {
        const starRating = '★'.repeat(Math.floor(brand.sustainability_rating || 0)) + 
                          '☆'.repeat(5 - Math.floor(brand.sustainability_rating || 0));
        
        const flagEmoji = getFlagEmoji(brand.country);
        
        return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="brand-card browse-card">
                <div class="brand-header">
                    <h5 class="brand-name">${brand.name}</h5>
                    <span class="sustainability-badge badge-${brand.is_sustainable ? 'success' : 'danger'}">
                        <i class="fas ${brand.is_sustainable ? 'fa-leaf' : 'fa-industry'} me-1"></i>
                        ${brand.is_sustainable ? 'Sustainable' : 'Not Sustainable'}
                    </span>
                </div>
                
                <!-- Geo Information with Flag Emoji -->
                <div class="brand-geo mb-2">
                    <small class="text-muted">
                        ${flagEmoji} ${brand.country} • ${brand.region}
                    </small>
                </div>
                
                <p class="brand-description">${brand.description || 'A brand committed to environmental responsibility.'}</p>
                
                <div class="brand-details">
                    <div class="rating-section mb-2">
                        <div class="rating-stars text-warning mb-1">
                            ${starRating}
                        </div>
                        <div class="rating-text">
                            <strong>${brand.sustainability_rating || 0}/5</strong>
                            <span class="text-muted"> sustainability rating</span>
                        </div>
                    </div>
                </div>
                
                <div class="brand-actions mt-3">
                    ${brand.website_url ? `
                        <a href="${brand.website_url}" target="_blank" class="btn btn-sm btn-outline-primary me-2">
                            <i class="fas fa-external-link-alt me-1"></i>Website
                        </a>
                    ` : ''}
                    <button class="btn btn-sm btn-success" onclick="viewBrandDetails('${brand.name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-search me-1"></i>Details
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    updatePaginationControls();
}

function updatePaginationControls() {
    const paginationControls = document.getElementById('paginationControls');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageNumbers = document.getElementById('pageNumbers');
    
    // Hide pagination if no pages OR only 1 page
    if (totalPages <= 1) {
        if (paginationControls) {
            paginationControls.style.display = 'none';
        }
        return;
    }
    
    // Show pagination controls
    if (paginationControls) {
        paginationControls.style.display = 'flex';
    }
    
    // Update previous button
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage === 1;
        prevPageBtn.classList.toggle('disabled', currentPage === 1);
    }
    
    // Update next button
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage === totalPages;
        nextPageBtn.classList.toggle('disabled', currentPage === totalPages);
    }
    
    // Generate page numbers
    if (pageNumbers) {
        let pageNumbersHTML = '';
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                pageNumbersHTML += `
                    <button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-secondary'} page-number" data-page="${i}">
                        ${i}
                    </button>
                `;
            }
        } else {
            // Show limited pages with ellipsis
            const half = Math.floor(maxVisiblePages / 2);
            let start = currentPage - half;
            let end = currentPage + half;
            
            if (start < 1) {
                start = 1;
                end = maxVisiblePages;
            }
            
            if (end > totalPages) {
                end = totalPages;
                start = totalPages - maxVisiblePages + 1;
            }
            
            // First page
            if (start > 1) {
                pageNumbersHTML += `
                    <button class="btn btn-sm ${1 === currentPage ? 'btn-primary' : 'btn-outline-secondary'} page-number" data-page="1">
                        1
                    </button>
                `;
                
                if (start > 2) {
                    pageNumbersHTML += `<span class="mx-1">...</span>`;
                }
            }
            
            // Middle pages
            for (let i = Math.max(1, start); i <= Math.min(end, totalPages); i++) {
                if (i === 1 && start > 1) continue; // Already added
                if (i === totalPages && end < totalPages) continue; // Will add later
                
                pageNumbersHTML += `
                    <button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-secondary'} page-number" data-page="${i}">
                        ${i}
                    </button>
                `;
            }
            
            // Last page if not already shown
            if (end < totalPages) {
                if (end < totalPages - 1) {
                    pageNumbersHTML += `<span class="mx-1">...</span>`;
                }
                
                pageNumbersHTML += `
                    <button class="btn btn-sm ${totalPages === currentPage ? 'btn-primary' : 'btn-outline-secondary'} page-number" data-page="${totalPages}">
                        ${totalPages}
                    </button>
                `;
            }
        }
        
        pageNumbers.innerHTML = pageNumbersHTML;
    }
}

function setFilter(filter) {
    currentFilter = filter;
    currentPage = 1;
    
    // Update active filter button
    document.querySelectorAll('.filter-section .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    filterBrands();
}

function changeItemsPerPage() {
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
        itemsPerPage = parseInt(itemsPerPageSelect.value);
        currentPage = 1;
        filterBrands();
        updatePaginationControls();
    }
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

function viewBrandDetails(brandName) {
    showBrandModal(brandName);
}

async function showBrandModal(brandName) {
    try {
        const modalBody = document.getElementById('brandModalBody');
        const visitWebsiteBtn = document.getElementById('visitWebsiteBtn');
        const modalTitle = document.getElementById('brandModalLabel');
        
        modalTitle.textContent = `Brand Details - ${brandName}`;
        modalBody.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading ${brandName} details...</p>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('brandModal'));
        modal.show();
        
        const response = await fetch(`/api/brands/search/${encodeURIComponent(brandName)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.found) {
            modalBody.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                    <h5>Brand Not Found</h5>
                    <p class="text-muted">Unable to load details for ${brandName}.</p>
                </div>
            `;
            visitWebsiteBtn.style.display = 'none';
            return;
        }
        
        displayBrandInModal(data, modalBody, visitWebsiteBtn);
        
    } catch (error) {
        console.error('Error loading brand details:', error);
        const modalBody = document.getElementById('brandModalBody');
        modalBody.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                <h5>Error Loading Details</h5>
                <p class="text-muted">Please check your connection and try again.</p>
            </div>
        `;
    }
}

function displayBrandInModal(data, modalBody, visitWebsiteBtn) {
    const sustainabilityClass = data.is_sustainable ? 'success' : 'danger';
    const sustainabilityText = data.is_sustainable ? 'Sustainable' : 'Not Sustainable';
    
    // Get the flag emoji
    const flagEmoji = getFlagEmoji(data.country);
    
    // Create star rating
    const ratingValue = data.sustainability_rating || 3;
    const starRating = '★'.repeat(Math.floor(ratingValue)) + 
                      '☆'.repeat(5 - Math.floor(ratingValue));

    modalBody.innerHTML = `
        <div class="single-column-modal">
            <!-- Single Brand Name Header -->
            <h2 class="mb-4">${data.name}</h2>
            
            <!-- Sustainability Badge and Country -->
            <div class="mb-3">
                <div class="d-flex align-items-center mb-2">
                    <span class="badge bg-${sustainabilityClass} me-2">
                        <strong>${sustainabilityText}</strong>
                    </span>
                    <span class="text-muted">
                        ${flagEmoji} ${data.country}
                    </span>
                </div>
                <p class="mb-0">${data.description || 'Casual and semi-formal fashion brand, part of Aditya Birla Fashion & Retail'}</p>
            </div>
            
            <hr class="my-4">
            
            <!-- Sustainability Details -->
            <div class="sustainability-details mb-4">
                <h5 class="mb-3">Sustainability Details</h5>
                <p class="mb-3">${data.sustainability_details || 'Known for smart-casual apparel; some sustainable capsule collections, but overall fast-fashion leaning with group-level ESG initiatives'}</p>
            </div>
            
            <!-- Eco Certifications -->
            <div class="eco-certifications mb-4">
                <h5 class="mb-3">Eco Certifications</h5>
                <p class="mb-0">${data.eco_certifications || 'Covered by ABFRL sustainability framework'}</p>
            </div>
            
            <!-- Sustainability Rating -->
            <div class="sustainability-rating mb-4">
                <h5 class="mb-3">Sustainability rating</h5>
                <div class="d-flex align-items-center">
                    <div class="text-warning me-3" style="font-size: 1.5rem;">
                        ${starRating}
                    </div>
                    <div>
                        <span class="h5">${ratingValue}/5 sustainability rating</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup website button
    if (data.website_url) {
        visitWebsiteBtn.style.display = 'inline-block';
        visitWebsiteBtn.onclick = () => {
            window.open(data.website_url, '_blank');
        };
    } else {
        visitWebsiteBtn.style.display = 'none';
    }
}

function showBrowseError() {
    const brandsGrid = document.getElementById('brandsGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    loadingSpinner.style.display = 'none';
    
    brandsGrid.innerHTML = `
        <div class="col-12 text-center">
            <div class="error-state">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h4 class="text-danger">Unable to Load Brands</h4>
                <p class="text-muted">Please check your connection and try refreshing the page.</p>
                <button class="btn btn-outline-primary" onclick="loadAllBrands()">
                    <i class="fas fa-redo me-2"></i>Try Again
                </button>
            </div>
        </div>
    `;
}

