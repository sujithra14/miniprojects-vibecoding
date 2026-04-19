// server-simple.js - Simple working server without database
const express = require('express');
const cors = require('cors');
const path = require('path');
const brandsData = require('./brands-data'); // Import static data

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API Routes - SIMPLE STATIC DATA

// Search for brand
app.get('/api/brands/search/:name', (req, res) => {
    try {
        const brandName = req.params.name.toLowerCase();
        console.log('🔍 Searching for:', brandName);
        
        const brand = brandsData.find(b => 
            b.name.toLowerCase().includes(brandName)
        );
        
        if (brand) {
            console.log('✅ Found:', brand.name);
            res.json({ ...brand, found: true });
        } else {
            console.log('❌ Not found:', brandName);
            res.json({ 
                found: false, 
                message: `No sustainability data found for "${req.params.name}". Try searching for Patagonia, Allbirds, or Tentree.` 
            });
        }
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get sustainable brands
app.get('/api/brands/sustainable', (req, res) => {
    try {
        const sustainableBrands = brandsData.filter(brand => brand.is_sustainable);
        console.log('🌿 Returning sustainable brands:', sustainableBrands.length);
        res.json(sustainableBrands);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all brands (for admin)
app.get('/api/brands', (req, res) => {
    console.log('📊 Returning all brands:', brandsData.length);
    res.json(brandsData);
});

// Add new brand (simple in-memory - will reset on redeploy)
app.post('/api/brands', (req, res) => {
    try {
        const newBrand = {
            id: brandsData.length + 1,
            ...req.body,
            created_at: new Date().toISOString()
        };
        brandsData.push(newBrand);
        console.log('✅ Added new brand:', newBrand.name);
        res.json({ message: 'Brand added successfully', brand: newBrand });
    } catch (err) {
        console.error('Error adding brand:', err);
        res.status(500).json({ error: 'Error adding brand' });
    }
});

// Update brand
app.put('/api/brands/:id', (req, res) => {
    try {
        const brandId = parseInt(req.params.id);
        const brandIndex = brandsData.findIndex(b => b.id === brandId);
        
        if (brandIndex !== -1) {
            brandsData[brandIndex] = { ...brandsData[brandIndex], ...req.body };
            console.log('✅ Updated brand:', brandsData[brandIndex].name);
            res.json({ message: 'Brand updated successfully', brand: brandsData[brandIndex] });
        } else {
            res.status(404).json({ error: 'Brand not found' });
        }
    } catch (err) {
        console.error('Error updating brand:', err);
        res.status(500).json({ error: 'Error updating brand' });
    }
});

// Delete brand
app.delete('/api/brands/:id', (req, res) => {
    try {
        const brandId = parseInt(req.params.id);
        const brandIndex = brandsData.findIndex(b => b.id === brandId);
        
        if (brandIndex !== -1) {
            const deletedBrand = brandsData.splice(brandIndex, 1)[0];
            console.log('🗑️ Deleted brand:', deletedBrand.name);
            res.json({ message: 'Brand deleted successfully', brand: deletedBrand });
        } else {
            res.status(404).json({ error: 'Brand not found' });
        }
    } catch (err) {
        console.error('Error deleting brand:', err);
        res.status(500).json({ error: 'Error deleting brand' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        brands: brandsData.length,
        message: 'EcoCheck server is running!'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 ECOCHECK SIMPLE SERVER STARTED');
    console.log('='.repeat(50));
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🌱 ${brandsData.length} brands loaded in memory`);
    console.log('🔍 Try these searches:');
    console.log('   /api/brands/search/patagonia');
    console.log('   /api/brands/search/allbirds');
    console.log('   /api/brands/sustainable');
    console.log('📊 Admin: http://localhost:3000/admin');
    console.log('❤️  Health: http://localhost:3000/health');
    console.log('='.repeat(50));
});