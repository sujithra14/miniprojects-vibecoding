// Admin JavaScript
let allBrands = [];

// Helper function to get password from URL
function getPasswordFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('password') || 'eco2024'; // Fallback to default
}

// Helper function for API calls with password
async function fetchWithAuth(url, options = {}) {
    try {
        const password = getPasswordFromURL();
        const authUrl = `${url}${url.includes('?') ? '&' : '?'}password=${encodeURIComponent(password)}`;
        
        console.log('🔐 Making authenticated request to:', url);
        
        const response = await fetch(authUrl, options);
        
        console.log('🔐 Response status:', response.status, response.statusText);
        
        if (response.status === 401 || response.status === 403) {
            throw new Error('Authentication failed - please check your password');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        console.error('🔐 Fetch error:', error);
        throw error;
    }
}

// Show/hide sections
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(sectionName).style.display = 'block';
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load data if needed
    if (sectionName === 'brands') {
        loadBrandsTable();
    } else if (sectionName === 'dashboard') {
        loadDashboardStats();
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        console.log('🔄 Loading dashboard stats...');

        const response = await fetchWithAuth('/api/brands');
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        allBrands = await response.json();
        console.log('✅ Real data loaded:', allBrands);
        
        if (allBrands.length === 0) {
            console.warn('⚠️ No brands found in database');
        }
        
        updateDashboardStats();
        
    } catch (error) {
        console.error('❌ Error loading dashboard stats:', error);
        
        // Show detailed error message
        const dashboardSection = document.getElementById('dashboard');
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger alert-dismissible fade show mt-3';
        errorAlert.innerHTML = `
            <strong>Error loading data:</strong> ${error.message}
            <br><small>Check browser console for details</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        dashboardSection.appendChild(errorAlert);
        
        // Clear stats to show loading failed
        document.getElementById('totalBrands').textContent = '0';
        document.getElementById('sustainableBrands').textContent = '0';
        document.getElementById('nonSustainableBrands').textContent = '0';
        document.getElementById('avgRating').textContent = '0';
    }
}
// async function loadDashboardStats() {
//     try {
//         console.log('🔄 Loading dashboard stats...');
        
//         // Load real data from API with authentication
//         const response = await fetchWithAuth('/api/brands');
        
//         if (!response.ok) {
//             throw new Error(`API error: ${response.status}`);
//         }
        
//         allBrands = await response.json();
//         console.log('✅ Real data loaded:', allBrands.length, 'brands');
        
//         updateDashboardStats();
        
//     } catch (error) {
//         console.error('❌ Error loading dashboard stats:', error);
        
//         // Show error message
//         const dashboardSection = document.getElementById('dashboard');
//         dashboardSection.innerHTML += `
//             <div class="alert alert-danger alert-dismissible fade show mt-3" role="alert">
//                 <strong>Error loading data:</strong> ${error.message}
//                 <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
//             </div>
//         `;
        
//         // Clear stats to show loading failed
//         document.getElementById('totalBrands').textContent = '0';
//         document.getElementById('sustainableBrands').textContent = '0';
//         document.getElementById('nonSustainableBrands').textContent = '0';
//         document.getElementById('avgRating').textContent = '0';
//     }
// }

// Update dashboard statistics with current allBrands data
function updateDashboardStats() {
    const totalBrands = allBrands.length;
    const sustainableBrands = allBrands.filter(brand => brand.is_sustainable).length;
    const nonSustainableBrands = totalBrands - sustainableBrands;
    const avgRating = totalBrands > 0 
        ? (allBrands.reduce((sum, brand) => sum + brand.sustainability_rating, 0) / totalBrands).toFixed(1)
        : 0;
    
    // Update brand stats
    document.getElementById('totalBrands').textContent = totalBrands;
    document.getElementById('sustainableBrands').textContent = sustainableBrands;
    document.getElementById('nonSustainableBrands').textContent = nonSustainableBrands;
    document.getElementById('avgRating').textContent = avgRating;
}
// Load brands table - FIXED VERSION
async function loadBrandsTable() {
    try {
        console.log("Loading brands table...");
        
        // Load real data from API with authentication
        const response = await fetchWithAuth("/api/brands");
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const brands = await response.json();
        console.log("Brands data loaded:", brands);
        
        const tbody = document.getElementById('brandsTable');
        
        if (brands.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        <i class="fas fa-box-open fa-2x mb-2"></i>
                        <br>
                        No brands found. Add your first brand!
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = brands.map(brand => `
            <tr>
                <td><strong>${brand.name}</strong></td>
                <td>
                    <span class="badge ${brand.is_sustainable ? 'bg-success' : 'bg-danger'}">
                        ${brand.is_sustainable ? 'Yes' : 'No'}
                    </span>
                </td>
                <td>
                    <span class="text-warning">${'★'.repeat(brand.sustainability_rating)}${'☆'.repeat(5 - brand.sustainability_rating)}</span>
                </td>
                <td>${brand.eco_certifications || 'None'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editBrand(${brand.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBrand(${brand.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error("Error loading brands table:", error);
        const tbody = document.getElementById('brandsTable');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <br>
                    Error loading brands: ${error.message}
                </td>
            </tr>
        `;
    }
}

// // Load brands table
// async function loadBrandsTable() {
//     try {
//         console.log('🔄 Loading brands table...');
        
//         // Load real data from API with authentication
//         const response = await fetchWithAuth('/api/brands');
        
//         if (!response.ok) {
//             throw new Error(`API error: ${response.status}`);
//         }
        
//         const brands = await response.json();
//         console.log('✅ Brands data loaded:', brands);
        
//         const tbody = document.getElementById('brandsTable');
        
//         if (brands.length === 0) {
//             tbody.innerHTML = `
//                 <tr>
//                     <td colspan="5" class="text-center text-muted py-4">
//                         <i class="fas fa-inbox fa-2x mb-2"></i><br>
//                         No brands found. Add your first brand!
//                     </td>
//                 </tr>
//             `;
//             return;
//         }
        
//         tbody.innerHTML = brands.map(brand => `
//             <tr>
//                 <td><strong>${brand.name}</strong></td>
//                 <td>
//                     <span class="badge ${brand.is_sustainable ? 'bg-success' : 'bg-danger'}">
//                         ${brand.is_sustainable ? 'Yes' : 'No'}
//                     </span>
//                 </td>
//                 <td>
//                     <span class="text-warning">${'★'.repeat(brand.sustainability_rating)}${'☆'.repeat(5-brand.sustainability_rating)}</span>
//                 </td>
//                 <td>${brand.eco_certifications || 'None'}</td>
//                 <td>
//                     <button class="btn btn-sm btn-outline-primary me-1" onclick="editBrand(${brand.id})">
//                         <i class="fas fa-edit"></i>
//                     </button>
//                     <button class="btn btn-sm btn-outline-danger" onclick="deleteBrand(${brand.id})">
//                         <i class="fas fa-trash"></i>
//                     </button>
//                 </td>
//             </tr>
//         `).join('');
        
//     } catch (error) {
//         console.error('Error loading brands table:', error);
        
//         const tbody = document.getElementById('brandsTable');
//         tbody.innerHTML = `
//             <tr>
//                 <td colspan="5" class="text-center text-danger py-4">
//                     <i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>
//                     Error loading brands: ${error.message}<br>
//                     <small>Please check your authentication and try again.</small>
//                 </td>
//             </tr>
//         `;
//     }
// }

// Add new brand
document.getElementById('addBrandForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const brandData = {
        name: document.getElementById('brandName').value,
        description: document.getElementById('brandDescription').value,
        sustainability_rating: parseInt(document.getElementById('sustainabilityRating').value),
        is_sustainable: document.getElementById('isSustainable').value === 'true',
        eco_certifications: document.getElementById('ecoCertifications').value,
        sustainability_details: document.getElementById('sustainabilityDetails').value,
        website_url: document.getElementById('websiteUrl').value
    };
    
    try {
        console.log('🔄 Adding new brand:', brandData);
        
        // Save to API with authentication
        const response = await fetchWithAuth('/api/brands', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(brandData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add brand');
        }
        
        const result = await response.json();
        console.log('✅ Brand added successfully:', result);
        
        // Show success message
        showAlert('Brand added successfully!', 'success');
        
        // Reset form and refresh
        document.getElementById('addBrandForm').reset();
        loadDashboardStats();
        loadBrandsTable();
        
    } catch (error) {
        console.error('Error adding brand:', error);
        showAlert('Error adding brand: ' + error.message, 'danger');
    }
});

// Edit brand - open modal
async function editBrand(brandId) {
    try {
        console.log('🔄 Loading brand for edit:', brandId);
        
        // Load fresh data from API with authentication
        const response = await fetchWithAuth('/api/brands');
        if (!response.ok) throw new Error('Failed to load brands');
        
        const brands = await response.json();
        const brand = brands.find(b => b.id === brandId);
        
        if (brand) {
            document.getElementById('editBrandId').value = brand.id;
            document.getElementById('editBrandName').value = brand.name;
            document.getElementById('editWebsiteUrl').value = brand.website_url || '';
            document.getElementById('editBrandDescription').value = brand.description || '';
            document.getElementById('editSustainabilityRating').value = brand.sustainability_rating;
            document.getElementById('editIsSustainable').value = brand.is_sustainable.toString();
            document.getElementById('editEcoCertifications').value = brand.eco_certifications || '';
            document.getElementById('editSustainabilityDetails').value = brand.sustainability_details || '';
            
            const modal = new bootstrap.Modal(document.getElementById('editBrandModal'));
            modal.show();
        } else {
            throw new Error('Brand not found');
        }
    } catch (error) {
        console.error('Error loading brand for edit:', error);
        showAlert('Error loading brand data: ' + error.message, 'danger');
    }
}

// Update brand
async function updateBrand() {
    const brandId = parseInt(document.getElementById('editBrandId').value);
    const brandData = {
        name: document.getElementById('editBrandName').value,
        description: document.getElementById('editBrandDescription').value,
        sustainability_rating: parseInt(document.getElementById('editSustainabilityRating').value),
        is_sustainable: document.getElementById('editIsSustainable').value === 'true',
        eco_certifications: document.getElementById('editEcoCertifications').value,
        sustainability_details: document.getElementById('editSustainabilityDetails').value,
        website_url: document.getElementById('editWebsiteUrl').value
    };
    
    try {
        console.log('🔄 Updating brand:', brandId, brandData);
        
        // Update via API with authentication
        const response = await fetchWithAuth(`/api/brands/${brandId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(brandData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update brand');
        }
        
        const result = await response.json();
        console.log('✅ Brand updated successfully:', result);
        
        showAlert('Brand updated successfully!', 'success');
        
        bootstrap.Modal.getInstance(document.getElementById('editBrandModal')).hide();
        loadDashboardStats();
        loadBrandsTable();
        
    } catch (error) {
        console.error('Error updating brand:', error);
        showAlert('Error updating brand: ' + error.message, 'danger');
    }
}

// Delete brand
async function deleteBrand(brandId) {
    if (confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
        try {
            console.log('🔄 Deleting brand:', brandId);
            
            // Delete via API with authentication
            const response = await fetchWithAuth(`/api/brands/${brandId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete brand');
            }
            
            const result = await response.json();
            console.log('✅ Brand deleted successfully:', result);
            
            showAlert('Brand deleted successfully!', 'success');
            
            loadDashboardStats();
            loadBrandsTable();
            
        } catch (error) {
            console.error('Error deleting brand:', error);
            showAlert('Error deleting brand: ' + error.message, 'danger');
        }
    }
}

// Helper function to show alerts
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Check if we have authentication
function checkAuthentication() {
    const password = getPasswordFromURL();
    if (!password || password === 'eco2024') {
        console.log('⚠️ Using default password. For production, set a secure password.');
    }
}

// Initialize admin portal
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Admin portal loaded');
    checkAuthentication();
    loadDashboardStats();
    
    // Add event listener for Enter key in search
    document.getElementById('brandName')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('addBrandForm').dispatchEvent(new Event('submit'));
        }
    });
});

// // Admin JavaScript
// let allBrands = [];

// // Helper function to get password from URL
// function getPasswordFromURL() {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get('password') || '';
// }

// // Helper function for API calls with password
// async function fetchWithAuth(url, options = {}) {
//     const password = getPasswordFromURL();
//     const authUrl = `${url}${url.includes('?') ? '&' : '?'}password=${encodeURIComponent(password)}`;
    
//     return fetch(authUrl, options);
// }

// // Show/hide sections
// function showSection(sectionName) {
//     // Hide all sections
//     document.querySelectorAll('.section').forEach(section => {
//         section.style.display = 'none';
//     });
    
//     // Show selected section
//     document.getElementById(sectionName).style.display = 'block';
    
//     // Update active nav link
//     document.querySelectorAll('.nav-link').forEach(link => {
//         link.classList.remove('active');
//     });
//     event.target.classList.add('active');
    
//     // Load data if needed
//     if (sectionName === 'brands') {
//         loadBrandsTable();
//     } else if (sectionName === 'dashboard') {
//         loadDashboardStats();
//     }
// }

// // Load dashboard statistics
// async function loadDashboardStats() {
//     try {
//         console.log('🔄 Loading dashboard stats...');
        
//         // Load real data from API with authentication
//         const response = await fetchWithAuth('/api/brands');
        
//         if (!response.ok) {
//             throw new Error(`API error: ${response.status}`);
//         }
        
//         allBrands = await response.json();
//         console.log('✅ Real data loaded:', allBrands.length, 'brands');
        
//         updateDashboardStats();
        
//     } catch (error) {
//         console.error('❌ Error loading dashboard stats:', error);
//         alert('Error loading data from server. Please check if you are authenticated.');
        
//         // Clear stats to show loading failed
//         document.getElementById('totalBrands').textContent = '0';
//         document.getElementById('sustainableBrands').textContent = '0';
//         document.getElementById('nonSustainableBrands').textContent = '0';
//         document.getElementById('avgRating').textContent = '0';
//     }
// }

// // Update dashboard statistics with current allBrands data
// function updateDashboardStats() {
//     const totalBrands = allBrands.length;
//     const sustainableBrands = allBrands.filter(brand => brand.is_sustainable).length;
//     const nonSustainableBrands = totalBrands - sustainableBrands;
//     const avgRating = totalBrands > 0 
//         ? (allBrands.reduce((sum, brand) => sum + brand.sustainability_rating, 0) / totalBrands).toFixed(1)
//         : 0;
    
//     // Update brand stats
//     document.getElementById('totalBrands').textContent = totalBrands;
//     document.getElementById('sustainableBrands').textContent = sustainableBrands;
//     document.getElementById('nonSustainableBrands').textContent = nonSustainableBrands;
//     document.getElementById('avgRating').textContent = avgRating;
// }

// // Load brands table
// async function loadBrandsTable() {
//     try {
//         // Load real data from API with authentication
//         const response = await fetchWithAuth('/api/brands');
        
//         if (!response.ok) {
//             throw new Error(`API error: ${response.status}`);
//         }
        
//         const brands = await response.json();
        
//         const tbody = document.getElementById('brandsTable');
        
//         if (brands.length === 0) {
//             tbody.innerHTML = `
//                 <tr>
//                     <td colspan="5" class="text-center text-muted py-4">
//                         <i class="fas fa-inbox fa-2x mb-2"></i><br>
//                         No brands found. Add your first brand!
//                     </td>
//                 </tr>
//             `;
//             return;
//         }
        
//         tbody.innerHTML = brands.map(brand => `
//             <tr>
//                 <td><strong>${brand.name}</strong></td>
//                 <td>
//                     <span class="badge ${brand.is_sustainable ? 'bg-success' : 'bg-danger'}">
//                         ${brand.is_sustainable ? 'Yes' : 'No'}
//                     </span>
//                 </td>
//                 <td>
//                     <span class="text-warning">${'★'.repeat(brand.sustainability_rating)}${'☆'.repeat(5-brand.sustainability_rating)}</span>
//                 </td>
//                 <td>${brand.eco_certifications || 'None'}</td>
//                 <td>
//                     <button class="btn btn-sm btn-outline-primary me-1" onclick="editBrand(${brand.id})">
//                         <i class="fas fa-edit"></i>
//                     </button>
//                     <button class="btn btn-sm btn-outline-danger" onclick="deleteBrand(${brand.id})">
//                         <i class="fas fa-trash"></i>
//                     </button>
//                 </td>
//             </tr>
//         `).join('');
        
//     } catch (error) {
//         console.error('Error loading brands table:', error);
        
//         const tbody = document.getElementById('brandsTable');
//         tbody.innerHTML = `
//             <tr>
//                 <td colspan="5" class="text-center text-danger py-4">
//                     <i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>
//                     Error loading brands. Please check server connection.
//                 </td>
//             </tr>
//         `;
//     }
// }

// // Add new brand
// document.getElementById('addBrandForm').addEventListener('submit', async function(e) {
//     e.preventDefault();
    
//     const brandData = {
//         name: document.getElementById('brandName').value,
//         description: document.getElementById('brandDescription').value,
//         sustainability_rating: parseInt(document.getElementById('sustainabilityRating').value),
//         is_sustainable: document.getElementById('isSustainable').value === 'true',
//         eco_certifications: document.getElementById('ecoCertifications').value,
//         sustainability_details: document.getElementById('sustainabilityDetails').value,
//         website_url: document.getElementById('websiteUrl').value
//     };
    
//     try {
//         // Save to API with authentication
//         const response = await fetchWithAuth('/api/brands', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(brandData)
//         });
        
//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.error || 'Failed to add brand');
//         }
        
//         const result = await response.json();
//         alert('Brand added successfully!');
        
//         // Reset form and refresh
//         document.getElementById('addBrandForm').reset();
//         loadDashboardStats();
//         loadBrandsTable();
        
//     } catch (error) {
//         console.error('Error adding brand:', error);
//         alert('Error adding brand: ' + error.message);
//     }
// });

// // Edit brand - open modal
// async function editBrand(brandId) {
//     try {
//         // Load fresh data from API with authentication
//         const response = await fetchWithAuth('/api/brands');
//         if (!response.ok) throw new Error('Failed to load brands');
        
//         const brands = await response.json();
//         const brand = brands.find(b => b.id === brandId);
        
//         if (brand) {
//             document.getElementById('editBrandId').value = brand.id;
//             document.getElementById('editBrandName').value = brand.name;
//             document.getElementById('editWebsiteUrl').value = brand.website_url || '';
//             document.getElementById('editBrandDescription').value = brand.description || '';
//             document.getElementById('editSustainabilityRating').value = brand.sustainability_rating;
//             document.getElementById('editIsSustainable').value = brand.is_sustainable.toString();
//             document.getElementById('editEcoCertifications').value = brand.eco_certifications || '';
//             document.getElementById('editSustainabilityDetails').value = brand.sustainability_details || '';
            
//             const modal = new bootstrap.Modal(document.getElementById('editBrandModal'));
//             modal.show();
//         } else {
//             throw new Error('Brand not found');
//         }
//     } catch (error) {
//         console.error('Error loading brand for edit:', error);
//         alert('Error loading brand data: ' + error.message);
//     }
// }

// // Update brand
// async function updateBrand() {
//     const brandId = parseInt(document.getElementById('editBrandId').value);
//     const brandData = {
//         name: document.getElementById('editBrandName').value,
//         description: document.getElementById('editBrandDescription').value,
//         sustainability_rating: parseInt(document.getElementById('editSustainabilityRating').value),
//         is_sustainable: document.getElementById('editIsSustainable').value === 'true',
//         eco_certifications: document.getElementById('editEcoCertifications').value,
//         sustainability_details: document.getElementById('editSustainabilityDetails').value,
//         website_url: document.getElementById('editWebsiteUrl').value
//     };
    
//     try {
//         // Update via API with authentication
//         const response = await fetchWithAuth(`/api/brands/${brandId}`, {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(brandData)
//         });
        
//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.error || 'Failed to update brand');
//         }
        
//         const result = await response.json();
//         alert('Brand updated successfully!');
        
//         bootstrap.Modal.getInstance(document.getElementById('editBrandModal')).hide();
//         loadDashboardStats();
//         loadBrandsTable();
        
//     } catch (error) {
//         console.error('Error updating brand:', error);
//         alert('Error updating brand: ' + error.message);
//     }
// }

// // Delete brand
// async function deleteBrand(brandId) {
//     if (confirm('Are you sure you want to delete this brand?')) {
//         try {
//             // Delete via API with authentication
//             const response = await fetchWithAuth(`/api/brands/${brandId}`, {
//                 method: 'DELETE'
//             });
            
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.error || 'Failed to delete brand');
//             }
            
//             const result = await response.json();
//             alert('Brand deleted successfully!');
            
//             loadDashboardStats();
//             loadBrandsTable();
            
//         } catch (error) {
//             console.error('Error deleting brand:', error);
//             alert('Error deleting brand: ' + error.message);
//         }
//     }
// }

// // Initialize admin portal
// document.addEventListener('DOMContentLoaded', function() {
//     console.log('🔧 Admin portal loaded');
//     loadDashboardStats();
// });
// // // Admin JavaScript
// // let allBrands = [];

// // // Show/hide sections
// // function showSection(sectionName) {
// //     // Hide all sections
// //     document.querySelectorAll('.section').forEach(section => {
// //         section.style.display = 'none';
// //     });
    
// //     // Show selected section
// //     document.getElementById(sectionName).style.display = 'block';
    
// //     // Update active nav link
// //     document.querySelectorAll('.nav-link').forEach(link => {
// //         link.classList.remove('active');
// //     });
// //     event.target.classList.add('active');
    
// //     // Load data if needed
// //     if (sectionName === 'brands') {
// //         loadBrandsTable();
// //     } else if (sectionName === 'dashboard') {
// //         loadDashboardStats();
// //     }
// // }

// // // Load dashboard statistics
// // async function loadDashboardStats() {
// //     try {
// //         const response = await fetch('/api/brands');
// //         allBrands = await response.json();
        
// //         const totalBrands = allBrands.length;
// //         const sustainableBrands = allBrands.filter(brand => brand.is_sustainable).length;
// //         const nonSustainableBrands = totalBrands - sustainableBrands;
// //         const avgRating = totalBrands > 0 
// //             ? (allBrands.reduce((sum, brand) => sum + brand.sustainability_rating, 0) / totalBrands).toFixed(1)
// //             : 0;
        
// //         // Update brand stats
// //         document.getElementById('totalBrands').textContent = totalBrands;
// //         document.getElementById('sustainableBrands').textContent = sustainableBrands;
// //         document.getElementById('nonSustainableBrands').textContent = nonSustainableBrands;
// //         document.getElementById('avgRating').textContent = avgRating;
        
// //     } catch (error) {
// //         console.error('Error loading dashboard stats:', error);
// //         alert('Error loading dashboard statistics');
// //     }
// // }

// // // Load brands table
// // async function loadBrandsTable() {
// //     try {
// //         const response = await fetch('/api/brands');
// //         const brands = await response.json();
        
// //         const tbody = document.getElementById('brandsTable');
// //         tbody.innerHTML = brands.map(brand => `
// //             <tr>
// //                 <td><strong>${brand.name}</strong></td>
// //                 <td>
// //                     <span class="badge ${brand.is_sustainable ? 'bg-success' : 'bg-danger'}">
// //                         ${brand.is_sustainable ? 'Yes' : 'No'}
// //                     </span>
// //                 </td>
// //                 <td>
// //                     <span class="text-warning">${'★'.repeat(brand.sustainability_rating)}${'☆'.repeat(5-brand.sustainability_rating)}</span>
// //                 </td>
// //                 <td>${brand.eco_certifications || 'None'}</td>
// //                 <td>
// //                     <button class="btn btn-sm btn-outline-primary me-1" onclick="editBrand(${brand.id})">
// //                         <i class="fas fa-edit"></i>
// //                     </button>
// //                     <button class="btn btn-sm btn-outline-danger" onclick="deleteBrand(${brand.id})">
// //                         <i class="fas fa-trash"></i>
// //                     </button>
// //                 </td>
// //             </tr>
// //         `).join('');
        
// //     } catch (error) {
// //         console.error('Error loading brands table:', error);
// //         alert('Error loading brands');
// //     }
// // }

// // // Add new brand
// // document.getElementById('addBrandForm').addEventListener('submit', async function(e) {
// //     e.preventDefault();
    
// //     const brandData = {
// //         name: document.getElementById('brandName').value,
// //         description: document.getElementById('brandDescription').value,
// //         sustainability_rating: parseInt(document.getElementById('sustainabilityRating').value),
// //         is_sustainable: document.getElementById('isSustainable').value === 'true',
// //         eco_certifications: document.getElementById('ecoCertifications').value,
// //         sustainability_details: document.getElementById('sustainabilityDetails').value,
// //         website_url: document.getElementById('websiteUrl').value
// //     };
    
// //     try {
// //         const response = await fetch('/api/brands', {
// //             method: 'POST',
// //             headers: {
// //                 'Content-Type': 'application/json'
// //             },
// //             body: JSON.stringify(brandData)
// //         });
        
// //         const result = await response.json();
        
// //         if (response.ok) {
// //             alert('Brand added successfully!');
// //             document.getElementById('addBrandForm').reset();
// //             // Refresh dashboard and brands table
// //             loadDashboardStats();
// //             loadBrandsTable();
// //         } else {
// //             alert('Error adding brand: ' + result.error);
// //         }
// //     } catch (error) {
// //         console.error('Error adding brand:', error);
// //         alert('Error adding brand');
// //     }
// // });

// // // Edit brand - open modal
// // async function editBrand(brandId) {
// //     try {
// //         const response = await fetch('/api/brands');
// //         const brands = await response.json();
// //         const brand = brands.find(b => b.id === brandId);
        
// //         if (brand) {
// //             document.getElementById('editBrandId').value = brand.id;
// //             document.getElementById('editBrandName').value = brand.name;
// //             document.getElementById('editWebsiteUrl').value = brand.website_url || '';
// //             document.getElementById('editBrandDescription').value = brand.description || '';
// //             document.getElementById('editSustainabilityRating').value = brand.sustainability_rating;
// //             document.getElementById('editIsSustainable').value = brand.is_sustainable.toString();
// //             document.getElementById('editEcoCertifications').value = brand.eco_certifications || '';
// //             document.getElementById('editSustainabilityDetails').value = brand.sustainability_details || '';
            
// //             const modal = new bootstrap.Modal(document.getElementById('editBrandModal'));
// //             modal.show();
// //         }
// //     } catch (error) {
// //         console.error('Error loading brand for edit:', error);
// //         alert('Error loading brand data');
// //     }
// // }

// // // Update brand
// // async function updateBrand() {
// //     const brandId = document.getElementById('editBrandId').value;
// //     const brandData = {
// //         name: document.getElementById('editBrandName').value,
// //         description: document.getElementById('editBrandDescription').value,
// //         sustainability_rating: parseInt(document.getElementById('editSustainabilityRating').value),
// //         is_sustainable: document.getElementById('editIsSustainable').value === 'true',
// //         eco_certifications: document.getElementById('editEcoCertifications').value,
// //         sustainability_details: document.getElementById('editSustainabilityDetails').value,
// //         website_url: document.getElementById('editWebsiteUrl').value
// //     };
    
// //     try {
// //         const response = await fetch(`/api/brands/${brandId}`, {
// //             method: 'PUT',
// //             headers: {
// //                 'Content-Type': 'application/json'
// //             },
// //             body: JSON.stringify(brandData)
// //         });
        
// //         const result = await response.json();
        
// //         if (response.ok) {
// //             alert('Brand updated successfully!');
// //             bootstrap.Modal.getInstance(document.getElementById('editBrandModal')).hide();
// //             loadDashboardStats();
// //             loadBrandsTable();
// //         } else {
// //             alert('Error updating brand: ' + result.error);
// //         }
// //     } catch (error) {
// //         console.error('Error updating brand:', error);
// //         alert('Error updating brand');
// //     }
// // }

// // // Delete brand
// // async function deleteBrand(brandId) {
// //     if (confirm('Are you sure you want to delete this brand?')) {
// //         try {
// //             const response = await fetch(`/api/brands/${brandId}`, {
// //                 method: 'DELETE'
// //             });
            
// //             const result = await response.json();
            
// //             if (response.ok) {
// //                 alert('Brand deleted successfully!');
// //                 loadDashboardStats();
// //                 loadBrandsTable();
// //             } else {
// //                 alert('Error deleting brand: ' + result.error);
// //             }
// //         } catch (error) {
// //             console.error('Error deleting brand:', error);
// //             alert('Error deleting brand');
// //         }
// //     }
// // }

// // // Initialize admin portal
// // document.addEventListener('DOMContentLoaded', function() {
// //     console.log('🔧 Admin portal loaded');
// //     loadDashboardStats();
// // });
// // // // Admin JavaScript
// // // let allBrands = [];

// // // // Show/hide sections
// // // function showSection(sectionName) {
// // //     // Hide all sections
// // //     document.querySelectorAll('.section').forEach(section => {
// // //         section.style.display = 'none';
// // //     });
    
// // //     // Show selected section
// // //     document.getElementById(sectionName).style.display = 'block';
    
// // //     // Update active nav link
// // //     document.querySelectorAll('.nav-link').forEach(link => {
// // //         link.classList.remove('active');
// // //     });
// // //     event.target.classList.add('active');
    
// // //     // Load data if needed
// // //     if (sectionName === 'brands') {
// // //         loadBrandsTable();
// // //     } else if (sectionName === 'dashboard') {
// // //         loadDashboardStats();
// // //     }
// // // }

// // // // Load dashboard statistics
// // // async function loadDashboardStats() {
// // //     try {
// // //         console.log('🔄 Loading dashboard stats...');
        
// // //         // Load real data from API
// // //         const response = await fetch('/api/brands');
        
// // //         if (!response.ok) {
// // //             throw new Error(`API error: ${response.status}`);
// // //         }
        
// // //         allBrands = await response.json();
// // //         console.log('✅ Real data loaded:', allBrands.length, 'brands');
        
// // //         updateDashboardStats();
// // //         await loadTrafficStats();
        
// // //     } catch (error) {
// // //         console.error('❌ Error loading dashboard stats:', error);
// // //         alert('Error loading data from server. Please check if the server is running.');
        
// // //         // Clear stats to show loading failed
// // //         document.getElementById('totalBrands').textContent = '0';
// // //         document.getElementById('sustainableBrands').textContent = '0';
// // //         document.getElementById('nonSustainableBrands').textContent = '0';
// // //         document.getElementById('avgRating').textContent = '0';
// // //     }
// // // }

// // // // Update dashboard statistics with current allBrands data
// // // function updateDashboardStats() {
// // //     const totalBrands = allBrands.length;
// // //     const sustainableBrands = allBrands.filter(brand => brand.is_sustainable).length;
// // //     const nonSustainableBrands = totalBrands - sustainableBrands;
// // //     const avgRating = totalBrands > 0 
// // //         ? (allBrands.reduce((sum, brand) => sum + brand.sustainability_rating, 0) / totalBrands).toFixed(1)
// // //         : 0;
    
// // //     // Update brand stats
// // //     document.getElementById('totalBrands').textContent = totalBrands;
// // //     document.getElementById('sustainableBrands').textContent = sustainableBrands;
// // //     document.getElementById('nonSustainableBrands').textContent = nonSustainableBrands;
// // //     document.getElementById('avgRating').textContent = avgRating;
// // // }

// // // // Load traffic stats
// // // async function loadTrafficStats() {
// // //     try {
// // //         const response = await fetch('/api/traffic');
        
// // //         if (!response.ok) {
// // //             throw new Error('Traffic API not available');
// // //         }
        
// // //         const stats = await response.json();
        
// // //         document.getElementById('totalVisits').textContent = stats.totalVisits?.toLocaleString() || '0';
// // //         document.getElementById('totalSearches').textContent = stats.totalSearches?.toLocaleString() || '0';
// // //         document.getElementById('uniqueVisitors').textContent = stats.uniqueVisitors?.toLocaleString() || '0';
// // //         document.getElementById('avgSearches').textContent = stats.averageSearchesPerVisit?.toFixed(1) || '0';
        
// // //     } catch (error) {
// // //         console.error('Error loading traffic stats:', error);
// // //         // Set zeros if traffic API fails
// // //         document.getElementById('totalVisits').textContent = '0';
// // //         document.getElementById('totalSearches').textContent = '0';
// // //         document.getElementById('uniqueVisitors').textContent = '0';
// // //         document.getElementById('avgSearches').textContent = '0';
// // //     }
// // // }

// // // // Load brands table
// // // async function loadBrandsTable() {
// // //     try {
// // //         // Load real data from API
// // //         const response = await fetch('/api/brands');
        
// // //         if (!response.ok) {
// // //             throw new Error(`API error: ${response.status}`);
// // //         }
        
// // //         const brands = await response.json();
        
// // //         const tbody = document.getElementById('brandsTable');
        
// // //         if (brands.length === 0) {
// // //             tbody.innerHTML = `
// // //                 <tr>
// // //                     <td colspan="5" class="text-center text-muted py-4">
// // //                         <i class="fas fa-inbox fa-2x mb-2"></i><br>
// // //                         No brands found. Add your first brand!
// // //                     </td>
// // //                 </tr>
// // //             `;
// // //             return;
// // //         }
        
// // //         tbody.innerHTML = brands.map(brand => `
// // //             <tr>
// // //                 <td><strong>${brand.name}</strong></td>
// // //                 <td>
// // //                     <span class="badge ${brand.is_sustainable ? 'bg-success' : 'bg-danger'}">
// // //                         ${brand.is_sustainable ? 'Yes' : 'No'}
// // //                     </span>
// // //                 </td>
// // //                 <td>
// // //                     <span class="text-warning">${'★'.repeat(brand.sustainability_rating)}${'☆'.repeat(5-brand.sustainability_rating)}</span>
// // //                 </td>
// // //                 <td>${brand.eco_certifications || 'None'}</td>
// // //                 <td>
// // //                     <button class="btn btn-sm btn-outline-primary me-1" onclick="editBrand(${brand.id})">
// // //                         <i class="fas fa-edit"></i>
// // //                     </button>
// // //                     <button class="btn btn-sm btn-outline-danger" onclick="deleteBrand(${brand.id})">
// // //                         <i class="fas fa-trash"></i>
// // //                     </button>
// // //                 </td>
// // //             </tr>
// // //         `).join('');
        
// // //     } catch (error) {
// // //         console.error('Error loading brands table:', error);
        
// // //         const tbody = document.getElementById('brandsTable');
// // //         tbody.innerHTML = `
// // //             <tr>
// // //                 <td colspan="5" class="text-center text-danger py-4">
// // //                     <i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>
// // //                     Error loading brands. Please check server connection.
// // //                 </td>
// // //             </tr>
// // //         `;
// // //     }
// // // }

// // // // Add new brand
// // // document.getElementById('addBrandForm').addEventListener('submit', async function(e) {
// // //     e.preventDefault();
    
// // //     const brandData = {
// // //         name: document.getElementById('brandName').value,
// // //         description: document.getElementById('brandDescription').value,
// // //         sustainability_rating: parseInt(document.getElementById('sustainabilityRating').value),
// // //         is_sustainable: document.getElementById('isSustainable').value === 'true',
// // //         eco_certifications: document.getElementById('ecoCertifications').value,
// // //         sustainability_details: document.getElementById('sustainabilityDetails').value,
// // //         website_url: document.getElementById('websiteUrl').value
// // //     };
    
// // //     try {
// // //         // Save to API
// // //         const response = await fetch('/api/brands', {
// // //             method: 'POST',
// // //             headers: {
// // //                 'Content-Type': 'application/json'
// // //             },
// // //             body: JSON.stringify(brandData)
// // //         });
        
// // //         if (!response.ok) {
// // //             const errorData = await response.json();
// // //             throw new Error(errorData.error || 'Failed to add brand');
// // //         }
        
// // //         const result = await response.json();
// // //         alert('Brand added successfully!');
        
// // //         // Reset form and refresh
// // //         document.getElementById('addBrandForm').reset();
// // //         loadDashboardStats();
// // //         loadBrandsTable();
        
// // //     } catch (error) {
// // //         console.error('Error adding brand:', error);
// // //         alert('Error adding brand: ' + error.message);
// // //     }
// // // });

// // // // Edit brand - open modal
// // // async function editBrand(brandId) {
// // //     try {
// // //         // Load fresh data from API
// // //         const response = await fetch('/api/brands');
// // //         if (!response.ok) throw new Error('Failed to load brands');
        
// // //         const brands = await response.json();
// // //         const brand = brands.find(b => b.id === brandId);
        
// // //         if (brand) {
// // //             document.getElementById('editBrandId').value = brand.id;
// // //             document.getElementById('editBrandName').value = brand.name;
// // //             document.getElementById('editWebsiteUrl').value = brand.website_url || '';
// // //             document.getElementById('editBrandDescription').value = brand.description || '';
// // //             document.getElementById('editSustainabilityRating').value = brand.sustainability_rating;
// // //             document.getElementById('editIsSustainable').value = brand.is_sustainable.toString();
// // //             document.getElementById('editEcoCertifications').value = brand.eco_certifications || '';
// // //             document.getElementById('editSustainabilityDetails').value = brand.sustainability_details || '';
            
// // //             const modal = new bootstrap.Modal(document.getElementById('editBrandModal'));
// // //             modal.show();
// // //         } else {
// // //             throw new Error('Brand not found');
// // //         }
// // //     } catch (error) {
// // //         console.error('Error loading brand for edit:', error);
// // //         alert('Error loading brand data: ' + error.message);
// // //     }
// // // }

// // // // Update brand
// // // async function updateBrand() {
// // //     const brandId = parseInt(document.getElementById('editBrandId').value);
// // //     const brandData = {
// // //         name: document.getElementById('editBrandName').value,
// // //         description: document.getElementById('editBrandDescription').value,
// // //         sustainability_rating: parseInt(document.getElementById('editSustainabilityRating').value),
// // //         is_sustainable: document.getElementById('editIsSustainable').value === 'true',
// // //         eco_certifications: document.getElementById('editEcoCertifications').value,
// // //         sustainability_details: document.getElementById('editSustainabilityDetails').value,
// // //         website_url: document.getElementById('editWebsiteUrl').value
// // //     };
    
// // //     try {
// // //         // Update via API
// // //         const response = await fetch(`/api/brands/${brandId}`, {
// // //             method: 'PUT',
// // //             headers: {
// // //                 'Content-Type': 'application/json'
// // //             },
// // //             body: JSON.stringify(brandData)
// // //         });
        
// // //         if (!response.ok) {
// // //             const errorData = await response.json();
// // //             throw new Error(errorData.error || 'Failed to update brand');
// // //         }
        
// // //         const result = await response.json();
// // //         alert('Brand updated successfully!');
        
// // //         bootstrap.Modal.getInstance(document.getElementById('editBrandModal')).hide();
// // //         loadDashboardStats();
// // //         loadBrandsTable();
        
// // //     } catch (error) {
// // //         console.error('Error updating brand:', error);
// // //         alert('Error updating brand: ' + error.message);
// // //     }
// // // }

// // // // Delete brand
// // // async function deleteBrand(brandId) {
// // //     if (confirm('Are you sure you want to delete this brand?')) {
// // //         try {
// // //             // Delete via API
// // //             const response = await fetch(`/api/brands/${brandId}`, {
// // //                 method: 'DELETE'
// // //             });
            
// // //             if (!response.ok) {
// // //                 const errorData = await response.json();
// // //                 throw new Error(errorData.error || 'Failed to delete brand');
// // //             }
            
// // //             const result = await response.json();
// // //             alert('Brand deleted successfully!');
            
// // //             loadDashboardStats();
// // //             loadBrandsTable();
            
// // //         } catch (error) {
// // //             console.error('Error deleting brand:', error);
// // //             alert('Error deleting brand: ' + error.message);
// // //         }
// // //     }
// // // }

// // // // Initialize admin portal
// // // document.addEventListener('DOMContentLoaded', function() {
// // //     console.log('🔧 Admin portal loaded');
// // //     loadDashboardStats();
// // // });
// // // // // Admin JavaScript
// // // // let allBrands = [];

// // // // // Show/hide sections
// // // // function showSection(sectionName) {
// // // //     // Hide all sections
// // // //     document.querySelectorAll('.section').forEach(section => {
// // // //         section.style.display = 'none';
// // // //     });
    
// // // //     // Show selected section
// // // //     document.getElementById(sectionName).style.display = 'block';
    
// // // //     // Update active nav link
// // // //     document.querySelectorAll('.nav-link').forEach(link => {
// // // //         link.classList.remove('active');
// // // //     });
// // // //     event.target.classList.add('active');
    
// // // //     // Load data if needed
// // // //     if (sectionName === 'brands') {
// // // //         loadBrandsTable();
// // // //     } else if (sectionName === 'dashboard') {
// // // //         loadDashboardStats();
// // // //     }
// // // // }

// // // // // Load dashboard statistics
// // // // async function loadDashboardStats() {
// // // //     try {
// // // //         console.log('🔄 Loading dashboard stats...');
        
// // // //         // Try to load real data first
// // // //         const response = await fetch('/api/brands');
        
// // // //         // Check if response is valid JSON
// // // //         const contentType = response.headers.get('content-type');
// // // //         if (!response.ok || !contentType || !contentType.includes('application/json')) {
// // // //             throw new Error('API not available');
// // // //         }
        
// // // //         allBrands = await response.json();
// // // //         console.log('✅ Real data loaded:', allBrands);
        
// // // //         await updateDashboardStats();
// // // //         await loadTrafficStats();
        
// // // //     } catch (error) {
// // // //         console.warn('❌ Using demo data:', error.message);
// // // //         loadDemoData();
// // // //     }
// // // // }

// // // // // Load demo data when API is not available
// // // // function loadDemoData() {
// // // //     console.log('📊 Loading demo data...');
    
// // // //     // Demo brands data
// // // //     allBrands = [
// // // //         { 
// // // //             id: 1, 
// // // //             name: "EcoFriendly Co", 
// // // //             sustainability_rating: 5, 
// // // //             is_sustainable: true,
// // // //             eco_certifications: "B Corp, Organic",
// // // //             description: "Sustainable clothing brand",
// // // //             website_url: "https://ecofriendly.co"
// // // //         },
// // // //         { 
// // // //             id: 2, 
// // // //             name: "Green Living", 
// // // //             sustainability_rating: 4, 
// // // //             is_sustainable: true,
// // // //             eco_certifications: "Fair Trade",
// // // //             description: "Eco-friendly home products",
// // // //             website_url: "https://greenliving.com"
// // // //         },
// // // //         { 
// // // //             id: 3, 
// // // //             name: "Sustainable Goods", 
// // // //             sustainability_rating: 3, 
// // // //             is_sustainable: true,
// // // //             eco_certifications: "Recycled Materials",
// // // //             description: "Everyday sustainable products",
// // // //             website_url: "https://sustainablegoods.org"
// // // //         },
// // // //         { 
// // // //             id: 4, 
// // // //             name: "Standard Corp", 
// // // //             sustainability_rating: 2, 
// // // //             is_sustainable: false,
// // // //             eco_certifications: "",
// // // //             description: "Traditional manufacturing",
// // // //             website_url: "https://standardcorp.com"
// // // //         },
// // // //         { 
// // // //             id: 5, 
// // // //             name: "Nature First", 
// // // //             sustainability_rating: 5, 
// // // //             is_sustainable: true,
// // // //             eco_certifications: "B Corp, Carbon Neutral",
// // // //             description: "Organic food products",
// // // //             website_url: "https://naturefirst.com"
// // // //         }
// // // //     ];
    
// // // //     updateDashboardStats();
    
// // // //     // Demo traffic data
// // // //     document.getElementById('totalVisits').textContent = '1,247';
// // // //     document.getElementById('totalSearches').textContent = '5,892';
// // // //     document.getElementById('uniqueVisitors').textContent = '843';
// // // //     document.getElementById('avgSearches').textContent = '4.7';
    
// // // //     console.log('✅ Demo data loaded successfully');
// // // // }

// // // // // Update dashboard statistics with current allBrands data
// // // // function updateDashboardStats() {
// // // //     const totalBrands = allBrands.length;
// // // //     const sustainableBrands = allBrands.filter(brand => brand.is_sustainable).length;
// // // //     const nonSustainableBrands = totalBrands - sustainableBrands;
// // // //     const avgRating = totalBrands > 0 
// // // //         ? (allBrands.reduce((sum, brand) => sum + brand.sustainability_rating, 0) / totalBrands).toFixed(1)
// // // //         : 0;
    
// // // //     // Update brand stats
// // // //     document.getElementById('totalBrands').textContent = totalBrands;
// // // //     document.getElementById('sustainableBrands').textContent = sustainableBrands;
// // // //     document.getElementById('nonSustainableBrands').textContent = nonSustainableBrands;
// // // //     document.getElementById('avgRating').textContent = avgRating;
// // // // }

// // // // // Load traffic stats
// // // // async function loadTrafficStats() {
// // // //     try {
// // // //         const response = await fetch('/api/traffic');
        
// // // //         const contentType = response.headers.get('content-type');
// // // //         if (!response.ok || !contentType || !contentType.includes('application/json')) {
// // // //             throw new Error('Traffic API not available');
// // // //         }
        
// // // //         const stats = await response.json();
        
// // // //         document.getElementById('totalVisits').textContent = stats.totalVisits?.toLocaleString() || '0';
// // // //         document.getElementById('totalSearches').textContent = stats.totalSearches?.toLocaleString() || '0';
// // // //         document.getElementById('uniqueVisitors').textContent = stats.uniqueVisitors?.toLocaleString() || '0';
// // // //         document.getElementById('avgSearches').textContent = stats.averageSearchesPerVisit?.toFixed(1) || '0';
        
// // // //     } catch (error) {
// // // //         console.warn('Traffic stats not available, using demo data');
// // // //         // Demo values are set in loadDemoData()
// // // //     }
// // // // }

// // // // // Load brands table
// // // // async function loadBrandsTable() {
// // // //     try {
// // // //         // Try to load real data first
// // // //         const response = await fetch('/api/brands');
// // // //         const contentType = response.headers.get('content-type');
        
// // // //         let brands;
// // // //         if (!response.ok || !contentType || !contentType.includes('application/json')) {
// // // //             console.log('Using demo data for brands table');
// // // //             brands = allBrands.length > 0 ? allBrands : loadDemoData();
// // // //         } else {
// // // //             brands = await response.json();
// // // //         }
        
// // // //         const tbody = document.getElementById('brandsTable');
// // // //         tbody.innerHTML = brands.map(brand => `
// // // //             <tr>
// // // //                 <td><strong>${brand.name}</strong></td>
// // // //                 <td>
// // // //                     <span class="badge ${brand.is_sustainable ? 'bg-success' : 'bg-danger'}">
// // // //                         ${brand.is_sustainable ? 'Yes' : 'No'}
// // // //                     </span>
// // // //                 </td>
// // // //                 <td>
// // // //                     <span class="text-warning">${'★'.repeat(brand.sustainability_rating)}${'☆'.repeat(5-brand.sustainability_rating)}</span>
// // // //                 </td>
// // // //                 <td>${brand.eco_certifications || 'None'}</td>
// // // //                 <td>
// // // //                     <button class="btn btn-sm btn-outline-primary me-1" onclick="editBrand(${brand.id})">
// // // //                         <i class="fas fa-edit"></i>
// // // //                     </button>
// // // //                     <button class="btn btn-sm btn-outline-danger" onclick="deleteBrand(${brand.id})">
// // // //                         <i class="fas fa-trash"></i>
// // // //                     </button>
// // // //                 </td>
// // // //             </tr>
// // // //         `).join('');
        
// // // //     } catch (error) {
// // // //         console.error('Error loading brands table:', error);
// // // //         alert('Error loading brands');
// // // //     }
// // // // }

// // // // // Add new brand
// // // // document.getElementById('addBrandForm').addEventListener('submit', async function(e) {
// // // //     e.preventDefault();
    
// // // //     const brandData = {
// // // //         name: document.getElementById('brandName').value,
// // // //         description: document.getElementById('brandDescription').value,
// // // //         sustainability_rating: parseInt(document.getElementById('sustainabilityRating').value),
// // // //         is_sustainable: document.getElementById('isSustainable').value === 'true',
// // // //         eco_certifications: document.getElementById('ecoCertifications').value,
// // // //         sustainability_details: document.getElementById('sustainabilityDetails').value,
// // // //         website_url: document.getElementById('websiteUrl').value
// // // //     };
    
// // // //     try {
// // // //         // Try to save to API
// // // //         const response = await fetch('/api/brands', {
// // // //             method: 'POST',
// // // //             headers: {
// // // //                 'Content-Type': 'application/json'
// // // //             },
// // // //             body: JSON.stringify(brandData)
// // // //         });
        
// // // //         // Check if API is available
// // // //         const contentType = response.headers.get('content-type');
// // // //         if (response.ok && contentType && contentType.includes('application/json')) {
// // // //             const result = await response.json();
// // // //             alert('Brand added successfully to database!');
// // // //         } else {
// // // //             throw new Error('API not available');
// // // //         }
        
// // // //     } catch (error) {
// // // //         console.warn('API not available, adding to demo data:', error);
        
// // // //         // Add to demo data
// // // //         const newBrand = {
// // // //             id: allBrands.length > 0 ? Math.max(...allBrands.map(b => b.id)) + 1 : 1,
// // // //             ...brandData
// // // //         };
// // // //         allBrands.push(newBrand);
        
// // // //         alert('Brand added to demo data (API not available)');
// // // //     }
    
// // // //     // Reset form and refresh
// // // //     document.getElementById('addBrandForm').reset();
// // // //     loadDashboardStats();
// // // //     loadBrandsTable();
// // // // });

// // // // // Edit brand - open modal
// // // // async function editBrand(brandId) {
// // // //     try {
// // // //         // Use current allBrands data (could be demo or real)
// // // //         const brand = allBrands.find(b => b.id === brandId);
        
// // // //         if (brand) {
// // // //             document.getElementById('editBrandId').value = brand.id;
// // // //             document.getElementById('editBrandName').value = brand.name;
// // // //             document.getElementById('editWebsiteUrl').value = brand.website_url || '';
// // // //             document.getElementById('editBrandDescription').value = brand.description || '';
// // // //             document.getElementById('editSustainabilityRating').value = brand.sustainability_rating;
// // // //             document.getElementById('editIsSustainable').value = brand.is_sustainable.toString();
// // // //             document.getElementById('editEcoCertifications').value = brand.eco_certifications || '';
// // // //             document.getElementById('editSustainabilityDetails').value = brand.sustainability_details || '';
            
// // // //             const modal = new bootstrap.Modal(document.getElementById('editBrandModal'));
// // // //             modal.show();
// // // //         }
// // // //     } catch (error) {
// // // //         console.error('Error loading brand for edit:', error);
// // // //         alert('Error loading brand data');
// // // //     }
// // // // }

// // // // // Update brand
// // // // async function updateBrand() {
// // // //     const brandId = parseInt(document.getElementById('editBrandId').value);
// // // //     const brandData = {
// // // //         name: document.getElementById('editBrandName').value,
// // // //         description: document.getElementById('editBrandDescription').value,
// // // //         sustainability_rating: parseInt(document.getElementById('editSustainabilityRating').value),
// // // //         is_sustainable: document.getElementById('editIsSustainable').value === 'true',
// // // //         eco_certifications: document.getElementById('editEcoCertifications').value,
// // // //         sustainability_details: document.getElementById('editSustainabilityDetails').value,
// // // //         website_url: document.getElementById('editWebsiteUrl').value
// // // //     };
    
// // // //     try {
// // // //         // Try to update via API
// // // //         const response = await fetch(`/api/brands/${brandId}`, {
// // // //             method: 'PUT',
// // // //             headers: {
// // // //                 'Content-Type': 'application/json'
// // // //             },
// // // //             body: JSON.stringify(brandData)
// // // //         });
        
// // // //         const contentType = response.headers.get('content-type');
// // // //         if (response.ok && contentType && contentType.includes('application/json')) {
// // // //             const result = await response.json();
// // // //             alert('Brand updated successfully in database!');
// // // //         } else {
// // // //             throw new Error('API not available');
// // // //         }
        
// // // //     } catch (error) {
// // // //         console.warn('API not available, updating demo data:', error);
        
// // // //         // Update demo data
// // // //         const brandIndex = allBrands.findIndex(b => b.id === brandId);
// // // //         if (brandIndex !== -1) {
// // // //             allBrands[brandIndex] = { id: brandId, ...brandData };
// // // //             alert('Brand updated in demo data (API not available)');
// // // //         }
// // // //     }
    
// // // //     bootstrap.Modal.getInstance(document.getElementById('editBrandModal')).hide();
// // // //     loadDashboardStats();
// // // //     loadBrandsTable();
// // // // }

// // // // // Delete brand
// // // // async function deleteBrand(brandId) {
// // // //     if (confirm('Are you sure you want to delete this brand?')) {
// // // //         try {
// // // //             // Try to delete via API
// // // //             const response = await fetch(`/api/brands/${brandId}`, {
// // // //                 method: 'DELETE'
// // // //             });
            
// // // //             const contentType = response.headers.get('content-type');
// // // //             if (response.ok && contentType && contentType.includes('application/json')) {
// // // //                 const result = await response.json();
// // // //                 alert('Brand deleted successfully from database!');
// // // //             } else {
// // // //                 throw new Error('API not available');
// // // //             }
            
// // // //         } catch (error) {
// // // //             console.warn('API not available, deleting from demo data:', error);
            
// // // //             // Delete from demo data
// // // //             allBrands = allBrands.filter(brand => brand.id !== brandId);
// // // //             alert('Brand deleted from demo data (API not available)');
// // // //         }
        
// // // //         loadDashboardStats();
// // // //         loadBrandsTable();
// // // //     }
// // // // }

// // // // // Initialize admin portal
// // // // document.addEventListener('DOMContentLoaded', function() {
// // // //     console.log('🔧 Admin portal loaded');
// // // //     loadDashboardStats();
// // // // });
// // // // // Admin JavaScript
// // // // let allBrands = [];

// // // // // Show/hide sections
// // // // function showSection(sectionName) {
// // // //     // Hide all sections
// // // //     document.querySelectorAll('.section').forEach(section => {
// // // //         section.style.display = 'none';
// // // //     });
    
// // // //     // Show selected section
// // // //     document.getElementById(sectionName).style.display = 'block';
    
// // // //     // Update active nav link
// // // //     document.querySelectorAll('.nav-link').forEach(link => {
// // // //         link.classList.remove('active');
// // // //     });
// // // //     event.target.classList.add('active');
    
// // // //     // Load data if needed
// // // //     if (sectionName === 'brands') {
// // // //         loadBrandsTable();
// // // //     } else if (sectionName === 'dashboard') {
// // // //         loadDashboardStats();
// // // //     }
// // // // }

// // // // // Load dashboard statistics
// // // // async function loadDashboardStats() {
// // // //     try {
// // // //         // Load brands data
// // // //         const response = await fetch('/api/brands');
// // // //         allBrands = await response.json();
        
// // // //         const totalBrands = allBrands.length;
// // // //         const sustainableBrands = allBrands.filter(brand => brand.is_sustainable).length;
// // // //         const nonSustainableBrands = totalBrands - sustainableBrands;
// // // //         const avgRating = totalBrands > 0 
// // // //             ? (allBrands.reduce((sum, brand) => sum + brand.sustainability_rating, 0) / totalBrands).toFixed(1)
// // // //             : 0;
        
// // // //         // Update brand stats
// // // //         document.getElementById('totalBrands').textContent = totalBrands;
// // // //         document.getElementById('sustainableBrands').textContent = sustainableBrands;
// // // //         document.getElementById('nonSustainableBrands').textContent = nonSustainableBrands;
// // // //         document.getElementById('avgRating').textContent = avgRating;

// // // //         // ✅ ADD THIS LINE: Load traffic stats
// // // //         await loadTrafficStats();
        
// // // //     } catch (error) {
// // // //         console.error('Error loading dashboard stats:', error);
// // // //         alert('Error loading dashboard statistics');
// // // //     }
// // // // }

// // // // // Load traffic stats - MAKE SURE THIS FUNCTION EXISTS
// // // // async function loadTrafficStats() {
// // // //     try {
// // // //         const response = await fetch('/api/traffic');
// // // //         const stats = await response.json();
        
// // // //         // Update traffic stats in your HTML
// // // //         document.getElementById('totalVisits').textContent = stats.totalVisits.toLocaleString();
// // // //         document.getElementById('totalSearches').textContent = stats.totalSearches.toLocaleString();
// // // //         document.getElementById('uniqueVisitors').textContent = stats.uniqueVisitors.toLocaleString();
// // // //         document.getElementById('avgSearches').textContent = stats.averageSearchesPerVisit.toFixed(1);
// // // //     } catch (error) {
// // // //         console.error('Error loading traffic stats:', error);
// // // //         // Don't show alert for traffic stats - they're less critical
// // // //     }
// // // // }


// // // // // Load brands table
// // // // async function loadBrandsTable() {
// // // //     try {
// // // //         const response = await fetch('/api/brands');
// // // //         const brands = await response.json();
        
// // // //         const tbody = document.getElementById('brandsTable');
// // // //         tbody.innerHTML = brands.map(brand => `
// // // //             <tr>
// // // //                 <td><strong>${brand.name}</strong></td>
// // // //                 <td>
// // // //                     <span class="badge ${brand.is_sustainable ? 'bg-success' : 'bg-danger'}">
// // // //                         ${brand.is_sustainable ? 'Yes' : 'No'}
// // // //                     </span>
// // // //                 </td>
// // // //                 <td>
// // // //                     <span class="text-warning">${'★'.repeat(brand.sustainability_rating)}${'☆'.repeat(5-brand.sustainability_rating)}</span>
// // // //                 </td>
// // // //                 <td>${brand.eco_certifications || 'None'}</td>
// // // //                 <td>
// // // //                     <button class="btn btn-sm btn-outline-primary me-1" onclick="editBrand(${brand.id})">
// // // //                         <i class="fas fa-edit"></i>
// // // //                     </button>
// // // //                     <button class="btn btn-sm btn-outline-danger" onclick="deleteBrand(${brand.id})">
// // // //                         <i class="fas fa-trash"></i>
// // // //                     </button>
// // // //                 </td>
// // // //             </tr>
// // // //         `).join('');
        
// // // //     } catch (error) {
// // // //         console.error('Error loading brands table:', error);
// // // //         alert('Error loading brands');
// // // //     }
// // // // }

// // // // // Add new brand
// // // // document.getElementById('addBrandForm').addEventListener('submit', async function(e) {
// // // //     e.preventDefault();
    
// // // //     const brandData = {
// // // //         name: document.getElementById('brandName').value,
// // // //         description: document.getElementById('brandDescription').value,
// // // //         sustainability_rating: parseInt(document.getElementById('sustainabilityRating').value),
// // // //         is_sustainable: document.getElementById('isSustainable').value === 'true',
// // // //         eco_certifications: document.getElementById('ecoCertifications').value,
// // // //         sustainability_details: document.getElementById('sustainabilityDetails').value,
// // // //         website_url: document.getElementById('websiteUrl').value
// // // //     };
    
// // // //     try {
// // // //         const response = await fetch('/api/brands', {
// // // //             method: 'POST',
// // // //             headers: {
// // // //                 'Content-Type': 'application/json'
// // // //             },
// // // //             body: JSON.stringify(brandData)
// // // //         });
        
// // // //         const result = await response.json();
        
// // // //         if (response.ok) {
// // // //             alert('Brand added successfully!');
// // // //             document.getElementById('addBrandForm').reset();
// // // //             // Refresh dashboard and brands table
// // // //             loadDashboardStats();
// // // //             loadBrandsTable();
// // // //         } else {
// // // //             alert('Error adding brand: ' + result.error);
// // // //         }
// // // //     } catch (error) {
// // // //         console.error('Error adding brand:', error);
// // // //         alert('Error adding brand');
// // // //     }
// // // // });

// // // // // Edit brand - open modal
// // // // async function editBrand(brandId) {
// // // //     try {
// // // //         const response = await fetch('/api/brands');
// // // //         const brands = await response.json();
// // // //         const brand = brands.find(b => b.id === brandId);
        
// // // //         if (brand) {
// // // //             document.getElementById('editBrandId').value = brand.id;
// // // //             document.getElementById('editBrandName').value = brand.name;
// // // //             document.getElementById('editWebsiteUrl').value = brand.website_url || '';
// // // //             document.getElementById('editBrandDescription').value = brand.description || '';
// // // //             document.getElementById('editSustainabilityRating').value = brand.sustainability_rating;
// // // //             document.getElementById('editIsSustainable').value = brand.is_sustainable.toString();
// // // //             document.getElementById('editEcoCertifications').value = brand.eco_certifications || '';
// // // //             document.getElementById('editSustainabilityDetails').value = brand.sustainability_details || '';
            
// // // //             const modal = new bootstrap.Modal(document.getElementById('editBrandModal'));
// // // //             modal.show();
// // // //         }
// // // //     } catch (error) {
// // // //         console.error('Error loading brand for edit:', error);
// // // //         alert('Error loading brand data');
// // // //     }
// // // // }

// // // // // Update brand
// // // // async function updateBrand() {
// // // //     const brandId = document.getElementById('editBrandId').value;
// // // //     const brandData = {
// // // //         name: document.getElementById('editBrandName').value,
// // // //         description: document.getElementById('editBrandDescription').value,
// // // //         sustainability_rating: parseInt(document.getElementById('editSustainabilityRating').value),
// // // //         is_sustainable: document.getElementById('editIsSustainable').value === 'true',
// // // //         eco_certifications: document.getElementById('editEcoCertifications').value,
// // // //         sustainability_details: document.getElementById('editSustainabilityDetails').value,
// // // //         website_url: document.getElementById('editWebsiteUrl').value
// // // //     };
    
// // // //     try {
// // // //         const response = await fetch(`/api/brands/${brandId}`, {
// // // //             method: 'PUT',
// // // //             headers: {
// // // //                 'Content-Type': 'application/json'
// // // //             },
// // // //             body: JSON.stringify(brandData)
// // // //         });
        
// // // //         const result = await response.json();
        
// // // //         if (response.ok) {
// // // //             alert('Brand updated successfully!');
// // // //             bootstrap.Modal.getInstance(document.getElementById('editBrandModal')).hide();
// // // //             loadDashboardStats();
// // // //             loadBrandsTable();
// // // //         } else {
// // // //             alert('Error updating brand: ' + result.error);
// // // //         }
// // // //     } catch (error) {
// // // //         console.error('Error updating brand:', error);
// // // //         alert('Error updating brand');
// // // //     }
// // // // }

// // // // // Delete brand
// // // // async function deleteBrand(brandId) {
// // // //     if (confirm('Are you sure you want to delete this brand?')) {
// // // //         try {
// // // //             const response = await fetch(`/api/brands/${brandId}`, {
// // // //                 method: 'DELETE'
// // // //             });
            
// // // //             const result = await response.json();
            
// // // //             if (response.ok) {
// // // //                 alert('Brand deleted successfully!');
// // // //                 loadDashboardStats();
// // // //                 loadBrandsTable();
// // // //             } else {
// // // //                 alert('Error deleting brand: ' + result.error);
// // // //             }
// // // //         } catch (error) {
// // // //             console.error('Error deleting brand:', error);
// // // //             alert('Error deleting brand');
// // // //         }
// // // //     }
// // // // }





// // // // // Initialize admin portal
// // // // document.addEventListener('DOMContentLoaded', function() {
// // // //     console.log('🔧 Admin portal loaded');
// // // //     loadDashboardStats();
// // // // });