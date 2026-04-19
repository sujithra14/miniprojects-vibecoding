const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'cc_admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'conscious_consumer',
  password: process.env.DB_PASSWORD || 'password123',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

// Admin security configuration
const adminConfig = {
  password: process.env.ADMIN_PASSWORD || 'eco2024',
  secretPath: process.env.ADMIN_SECRET_PATH || 'manage-brands',
  allowedIPs: process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : []
};

// Admin authentication middleware
const requireAdminAuth = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const providedPassword = req.query.password || 
                         (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  
  console.log('🔐 Admin auth check:', { 
    path: req.path, 
    clientIP, 
    providedPassword: providedPassword ? '***' : 'none'
  });
  
  // Allow access if:
  // 1. Correct password provided, OR
  // 2. IP is in allowed list
  const isAuthenticated = providedPassword === adminConfig.password ||
                        adminConfig.allowedIPs.includes(clientIP);
  
  if (isAuthenticated) {
    console.log('✅ Admin access granted');
    next();
  } else {
    console.log('❌ Admin access denied - showing login page');
    // Show elegant login page
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Access - EcoCheck</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
          body { 
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
          }
          .login-card {
            border: none;
            border-radius: 20px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.1);
          }
          .password-input {
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            padding: 1rem;
            font-size: 1.1rem;
          }
          .password-input:focus {
            border-color: #10b981;
            box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.25);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
              <div class="card login-card">
                <div class="card-body p-5">
                  <div class="text-center mb-4">
                    <i class="fas fa-lock fa-3x text-success mb-3"></i>
                    <h2>Admin Portal</h2>
                    <p class="text-muted">Enter the admin password to continue</p>
                  </div>
                  
                  <form id="loginForm">
                    <div class="mb-3">
                      <div class="input-group">
                        <input type="password" 
                               class="form-control password-input" 
                               id="password" 
                               placeholder="Enter admin password" 
                               required>
                        <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                          <i class="fas fa-eye"></i>
                        </button>
                      </div>
                    </div>
                    <button type="submit" class="btn btn-success btn-lg w-100">
                      <i class="fas fa-unlock me-2"></i>Access Admin Portal
                    </button>
                  </form>
                  
                  <div class="mt-4 text-center">
                    <small class="text-muted">
                      <i class="fas fa-info-circle me-1"></i>
                      Contact the website administrator if you need access
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <script>
          document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value;
            // Redirect to admin with password in URL
            window.location.href = '/admin?password=' + encodeURIComponent(password);
          });

          // Toggle password visibility
          document.getElementById('togglePassword').addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
              passwordInput.type = 'text';
              icon.className = 'fas fa-eye-slash';
            } else {
              passwordInput.type = 'password';
              icon.className = 'fas fa-eye';
            }
          });

          // Focus on password input
          document.getElementById('password').focus();
        </script>
      </body>
      </html>
    `);
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Custom static file serving - exclude admin routes
app.use((req, res, next) => {
  if (req.path === '/admin' || req.path === '/data-viewer') {
    next();
  } else {
    express.static('public')(req, res, next);
  }
});

// Create tables
const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        sustainability_rating INTEGER CHECK (sustainability_rating >= 1 AND sustainability_rating <= 5),
        is_sustainable BOOLEAN DEFAULT false,
        eco_certifications TEXT,
        sustainability_details TEXT,
        website_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Brands table created/verified');

    // Insert sample data
    await insertSampleData();
  } catch (err) {
    console.error('Error creating tables:', err);
  }
};

// Insert sample data
const insertSampleData = async () => {
  const sampleBrands = [
    {
      name: 'Patagonia',
      description: 'Outdoor clothing and gear company',
      sustainability_rating: 5,
      is_sustainable: true,
      eco_certifications: 'B Corp, Fair Trade Certified',
      sustainability_details: 'Uses recycled materials, repairs clothing, donates to environmental causes',
      website_url: 'https://www.patagonia.com'
    },
    {
      name: 'Allbirds',
      description: 'Sustainable footwear company',
      sustainability_rating: 4,
      is_sustainable: true,
      eco_certifications: 'B Corp',
      sustainability_details: 'Uses renewable materials, carbon-neutral shipping',
      website_url: 'https://www.allbirds.com'
    },
    {
      name: 'Tentree',
      description: 'Apparel company that plants trees',
      sustainability_rating: 5,
      is_sustainable: true,
      eco_certifications: 'B Corp',
      sustainability_details: 'Plants 10 trees for every item purchased, uses sustainable materials',
      website_url: 'https://www.tentree.com'
    },
    {
      name: 'Fast Fashion Co',
      description: 'Generic fast fashion brand',
      sustainability_rating: 1,
      is_sustainable: false,
      eco_certifications: 'None',
      sustainability_details: 'Known for poor labor conditions and high environmental impact',
      website_url: 'https://example.com'
    }
  ];

  for (const brand of sampleBrands) {
    try {
      await pool.query(
        `INSERT INTO brands (name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (name) DO NOTHING`,
        [brand.name, brand.description, brand.sustainability_rating, brand.is_sustainable, 
         brand.eco_certifications, brand.sustainability_details, brand.website_url]
      );
    } catch (err) {
      console.log('Error inserting brand:', brand.name, err);
    }
  }
  console.log('✅ Sample data inserted');
};

// Initialize database
createTables();

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Protected admin routes
app.get('/admin', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/data-viewer', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'data-viewer.html'));
});

// Public API routes
app.get('/api/brands/search/:name', async (req, res) => {
  try {
    const brandName = req.params.name.toLowerCase();
    const result = await pool.query(
      "SELECT * FROM brands WHERE LOWER(name) LIKE $1",
      [`%${brandName}%`]
    );
    
    if (result.rows.length > 0) {
      res.json({ ...result.rows[0], found: true });
    } else {
      res.json({ 
        found: false, 
        message: `No sustainability data found for "${req.params.name}"` 
      });
    }
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/brands/sustainable', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM brands WHERE is_sustainable = true ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sustainable brands:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Protected API routes
app.get('/api/brands', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM brands ORDER BY name");
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/brands', async (req, res) => {
  try {
    const { name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url } = req.body;
    
    const result = await pool.query(
      `INSERT INTO brands (name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url]
    );
    
    res.json({ message: 'Brand added successfully', brand: result.rows[0] });
  } catch (err) {
    console.error('Error adding brand:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/brands/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url } = req.body;
    
    const result = await pool.query(
      `UPDATE brands 
       SET name = $1, description = $2, sustainability_rating = $3, is_sustainable = $4, 
           eco_certifications = $5, sustainability_details = $6, website_url = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 
       RETURNING *`,
      [name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url, id]
    );
    
    if (result.rows.length > 0) {
      res.json({ message: 'Brand updated successfully', brand: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Brand not found' });
    }
  } catch (err) {
    console.error('Error updating brand:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/brands/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM brands WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length > 0) {
      res.json({ message: 'Brand deleted successfully' });
    } else {
      res.status(404).json({ error: 'Brand not found' });
    }
  } catch (err) {
    console.error('Error deleting brand:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Data viewer API
app.get('/api/data-viewer', requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM brands ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🔧 Admin panel: http://localhost:${PORT}/admin (password: ${adminConfig.password})`);
  console.log(`📊 Data viewer: http://localhost:${PORT}/data-viewer (password: ${adminConfig.password})`);
  console.log('🔐 Password protection is ACTIVE');
});
// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const { Pool } = require('pg');

// const app = express();
// const PORT = 3000;

// // PostgreSQL connection
// const pool = new Pool({
//     user: 'cc_admin',
//     host: 'localhost',
//     database: 'conscious_consumer',
//     password: 'password123',
//     port: 5432,
// });

// // Test database connection
// pool.connect((err, client, release) => {
//     if (err) {
//         console.error('Error connecting to database:', err);
//     } else {
//         console.log('✅ Connected to PostgreSQL database');
//         release();
//     }
// });

// // Admin security configuration
// const adminConfig = {
//     password: process.env.ADMIN_PASSWORD || 'eco2024',
//     secretPath: process.env.ADMIN_SECRET_PATH || 'manage-brands',
//     allowedIPs: process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : []
// };

// // Admin authentication middleware
// const requireAdminAuth = (req, res, next) => {
//     const clientIP = req.ip || req.connection.remoteAddress;
//     const providedPassword = req.query.password || 
//                            (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
    
//     console.log('🔐 Admin auth check:', { 
//         path: req.path, 
//         clientIP, 
//         providedPassword: providedPassword ? '***' : 'none',
//         expected: adminConfig.password 
//     });
    
//     // Allow access if:
//     // 1. Correct password provided, OR
//     // 2. IP is in allowed list, OR  
//     // 3. Not in production mode
//     const isAuthenticated = providedPassword === adminConfig.password ||
//                           adminConfig.allowedIPs.includes(clientIP) ||
//                           process.env.NODE_ENV !== 'production';
    
//     if (isAuthenticated) {
//         console.log('✅ Admin access granted');
//         next();
//     } else {
//         console.log('❌ Admin access denied - showing login page');
//         // Show elegant login page
//         res.send(`
//             <!DOCTYPE html>
//             <html lang="en">
//             <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>Admin Access - EcoCheck</title>
//                 <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
//                 <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
//                 <style>
//                     body { 
//                         background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
//                         min-height: 100vh;
//                         display: flex;
//                         align-items: center;
//                     }
//                     .login-card {
//                         border: none;
//                         border-radius: 20px;
//                         box-shadow: 0 20px 50px rgba(0,0,0,0.1);
//                     }
//                     .password-input {
//                         border: 2px solid #e5e7eb;
//                         border-radius: 10px;
//                         padding: 1rem;
//                         font-size: 1.1rem;
//                     }
//                     .password-input:focus {
//                         border-color: #10b981;
//                         box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.25);
//                     }
//                 </style>
//             </head>
//             <body>
//                 <div class="container">
//                     <div class="row justify-content-center">
//                         <div class="col-md-6 col-lg-5">
//                             <div class="card login-card">
//                                 <div class="card-body p-5">
//                                     <div class="text-center mb-4">
//                                         <i class="fas fa-lock fa-3x text-success mb-3"></i>
//                                         <h2>Admin Portal</h2>
//                                         <p class="text-muted">Enter the admin password to continue</p>
//                                     </div>
                                    
//                                     <form id="loginForm">
//                                         <div class="mb-3">
//                                             <div class="input-group">
//                                                 <input type="password" 
//                                                        class="form-control password-input" 
//                                                        id="password" 
//                                                        placeholder="Enter admin password" 
//                                                        required>
//                                                 <button class="btn btn-outline-secondary" type="button" id="togglePassword">
//                                                     <i class="fas fa-eye"></i>
//                                                 </button>
//                                             </div>
//                                         </div>
//                                         <button type="submit" class="btn btn-success btn-lg w-100">
//                                             <i class="fas fa-unlock me-2"></i>Access Admin Portal
//                                         </button>
//                                     </form>
                                    
//                                     <div class="mt-4 text-center">
//                                         <small class="text-muted">
//                                             <i class="fas fa-info-circle me-1"></i>
//                                             Contact the website administrator if you need access
//                                         </small>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <script>
//                     document.getElementById('loginForm').addEventListener('submit', function(e) {
//                         e.preventDefault();
//                         const password = document.getElementById('password').value;
//                         // Redirect to admin with password in URL
//                         window.location.href = '/admin?password=' + encodeURIComponent(password);
//                     });

//                     // Toggle password visibility
//                     document.getElementById('togglePassword').addEventListener('click', function() {
//                         const passwordInput = document.getElementById('password');
//                         const icon = this.querySelector('i');
                        
//                         if (passwordInput.type === 'password') {
//                             passwordInput.type = 'text';
//                             icon.className = 'fas fa-eye-slash';
//                         } else {
//                             passwordInput.type = 'password';
//                             icon.className = 'fas fa-eye';
//                         }
//                     });

//                     // Focus on password input
//                     document.getElementById('password').focus();
//                 </script>
//             </body>
//             </html>
//         `);
//     }
// };

// // Middleware
// app.use(cors());
// app.use(express.json());

// // IMPORTANT: Only serve static files for non-admin routes
// app.use((req, res, next) => {
//     // If it's an admin route, don't serve static files
//     if (req.path === '/admin' || req.path === '/data-viewer') {
//         next();
//     } else {
//         express.static('public')(req, res, next);
//     }
// });

// // Create tables
// const createTables = async () => {
//     try {
//         await pool.query(`
//             CREATE TABLE IF NOT EXISTS brands (
//                 id SERIAL PRIMARY KEY,
//                 name VARCHAR(100) UNIQUE NOT NULL,
//                 description TEXT,
//                 sustainability_rating INTEGER CHECK (sustainability_rating >= 1 AND sustainability_rating <= 5),
//                 is_sustainable BOOLEAN DEFAULT false,
//                 eco_certifications TEXT,
//                 sustainability_details TEXT,
//                 website_url VARCHAR(255),
//                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//             )
//         `);
//         console.log('✅ Brands table created/verified');

//         // Insert sample data
//         await insertSampleData();
//     } catch (err) {
//         console.error('Error creating tables:', err);
//     }
// };

// // Insert sample data
// const insertSampleData = async () => {
//     const sampleBrands = [
//         {
//             name: 'Patagonia',
//             description: 'Outdoor clothing and gear company',
//             sustainability_rating: 5,
//             is_sustainable: true,
//             eco_certifications: 'B Corp, Fair Trade Certified',
//             sustainability_details: 'Uses recycled materials, repairs clothing, donates to environmental causes',
//             website_url: 'https://www.patagonia.com'
//         },
//         {
//             name: 'Allbirds',
//             description: 'Sustainable footwear company',
//             sustainability_rating: 4,
//             is_sustainable: true,
//             eco_certifications: 'B Corp',
//             sustainability_details: 'Uses renewable materials, carbon-neutral shipping',
//             website_url: 'https://www.allbirds.com'
//         },
//         {
//             name: 'Fast Fashion Co',
//             description: 'Generic fast fashion brand',
//             sustainability_rating: 1,
//             is_sustainable: false,
//             eco_certifications: 'None',
//             sustainability_details: 'Known for poor labor conditions and high environmental impact',
//             website_url: 'https://example.com'
//         }
//     ];

//     for (const brand of sampleBrands) {
//         try {
//             await pool.query(
//                 `INSERT INTO brands (name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url) 
//                  VALUES ($1, $2, $3, $4, $5, $6, $7) 
//                  ON CONFLICT (name) DO NOTHING`,
//                 [brand.name, brand.description, brand.sustainability_rating, brand.is_sustainable, 
//                  brand.eco_certifications, brand.sustainability_details, brand.website_url]
//             );
//         } catch (err) {
//             console.log('Error inserting brand:', brand.name, err);
//         }
//     }
//     console.log('✅ Sample data inserted');
// };

// // Initialize database
// createTables();

// // Routes

// // Home page
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Protected admin routes
// app.get('/admin', requireAdminAuth, (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'admin.html'));
// });

// app.get('/data-viewer', requireAdminAuth, (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'data-viewer.html'));
// });

// // Search for a brand
// app.get('/api/brands/search/:name', async (req, res) => {
//     try {
//         const brandName = req.params.name.toLowerCase();
//         const result = await pool.query(
//             "SELECT * FROM brands WHERE LOWER(name) LIKE $1",
//             [`%${brandName}%`]
//         );
        
//         if (result.rows.length > 0) {
//             res.json({ ...result.rows[0], found: true });
//         } else {
//             res.json({ 
//                 found: false, 
//                 message: `No sustainability data found for "${req.params.name}"` 
//             });
//         }
//     } catch (err) {
//         console.error('Search error:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

// // Get all sustainable brands
// app.get('/api/brands/sustainable', async (req, res) => {
//     try {
//         const result = await pool.query(
//             "SELECT * FROM brands WHERE is_sustainable = true ORDER BY name"
//         );
//         res.json(result.rows);
//     } catch (err) {
//         console.error('Error fetching sustainable brands:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

// // Get all brands (for admin)
// app.get('/api/brands', requireAdminAuth, async (req, res) => {
//     try {
//         const result = await pool.query("SELECT * FROM brands ORDER BY name");
//         res.json(result.rows);
//     } catch (err) {
//         console.error('Error fetching brands:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

// // Add new brand
// app.post('/api/brands', requireAdminAuth, async (req, res) => {
//     try {
//         const { name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url } = req.body;
        
//         const result = await pool.query(
//             `INSERT INTO brands (name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url) 
//              VALUES ($1, $2, $3, $4, $5, $6, $7) 
//              RETURNING *`,
//             [name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url]
//         );
        
//         res.json({ message: 'Brand added successfully', brand: result.rows[0] });
//     } catch (err) {
//         console.error('Error adding brand:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

// // Update brand
// app.put('/api/brands/:id', requireAdminAuth, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url } = req.body;
        
//         const result = await pool.query(
//             `UPDATE brands 
//              SET name = $1, description = $2, sustainability_rating = $3, is_sustainable = $4, 
//                  eco_certifications = $5, sustainability_details = $6, website_url = $7, updated_at = CURRENT_TIMESTAMP
//              WHERE id = $8 
//              RETURNING *`,
//             [name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url, id]
//         );
        
//         if (result.rows.length > 0) {
//             res.json({ message: 'Brand updated successfully', brand: result.rows[0] });
//         } else {
//             res.status(404).json({ error: 'Brand not found' });
//         }
//     } catch (err) {
//         console.error('Error updating brand:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

// // Delete brand
// app.delete('/api/brands/:id', requireAdminAuth, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const result = await pool.query("DELETE FROM brands WHERE id = $1 RETURNING *", [id]);
        
//         if (result.rows.length > 0) {
//             res.json({ message: 'Brand deleted successfully' });
//         } else {
//             res.status(404).json({ error: 'Brand not found' });
//         }
//     } catch (err) {
//         console.error('Error deleting brand:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });
// // Debug routes - add this before app.listen
// app.get('/api/debug/brands', async (req, res) => {
//     try {
//         console.log('🔧 DEBUG: Checking brands table');
//         const result = await pool.query("SELECT * FROM brands ORDER BY name");
//         console.log('🔧 DEBUG: Found brands:', result.rows);
//         res.json({ 
//             success: true, 
//             count: result.rows.length,
//             brands: result.rows 
//         });
//     } catch (err) {
//         console.error('🔧 DEBUG: Error:', err);
//         res.status(500).json({ error: err.message });
//     }
// });

// app.get('/api/debug/tables', async (req, res) => {
//     try {
//         console.log('🔧 DEBUG: Checking all tables');
//         const result = await pool.query(`
//             SELECT table_name 
//             FROM information_schema.tables 
//             WHERE table_schema = 'public'
//         `);
//         console.log('🔧 DEBUG: Tables found:', result.rows);
//         res.json({ tables: result.rows });
//     } catch (err) {
//         console.error('🔧 DEBUG: Error:', err);
//         res.status(500).json({ error: err.message });
//     }
// });

// // Start server
// app.listen(PORT, () => {
//     console.log(`✅ Server running at http://localhost:${PORT}`);
//     console.log(`🔧 Admin panel: http://localhost:${PORT}/admin (password: eco2024)`);
//     console.log(`📊 Data viewer: http://localhost:${PORT}/data-viewer (password: eco2024)`);
//     console.log('🔐 Password protection is ACTIVE');
// });
// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const { Pool } = require('pg');

// const app = express();
// const PORT = 3000;

// // PostgreSQL connection
// const pool = new Pool({
//     user: 'cc_admin',
//     host: 'localhost',
//     database: 'conscious_consumer',
//     password: 'password123',
//     port: 5432,
// });

// // Test database connection
// pool.connect((err, client, release) => {
//     if (err) {
//         console.error('Error connecting to database:', err);
//     } else {
//         console.log('✅ Connected to PostgreSQL database');
//         release();
//     }
// });

// // Admin security configuration
// const adminConfig = {
//     password: process.env.ADMIN_PASSWORD || 'eco2024',
//     secretPath: process.env.ADMIN_SECRET_PATH || 'manage-brands',
//     allowedIPs: process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : []
// };

// // Admin authentication middleware
// const requireAdminAuth = (req, res, next) => {
//     const clientIP = req.ip || req.connection.remoteAddress;
//     const providedPassword = req.query.password || 
//                            (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
    
//     console.log('🔐 Admin auth check:', { 
//         path: req.path, 
//         clientIP, 
//         providedPassword: providedPassword ? '***' : 'none',
//         expected: adminConfig.password 
//     });
    
//     // Allow access if:
//     // 1. Correct password provided, OR
//     // 2. IP is in allowed list, OR  
//     // 3. Not in production mode
//     // const isAuthenticated = providedPassword === adminConfig.password ||
//     //                       adminConfig.allowedIPs.includes(clientIP) ||
//     //                       process.env.NODE_ENV !== 'production';
//     const isAuthenticated = providedPassword === adminConfig.password ||
//                       adminConfig.allowedIPs.includes(clientIP);
    
//     if (isAuthenticated) {
//         console.log('✅ Admin access granted');
//         next();
//     } else {
//         console.log('❌ Admin access denied - showing login page');
//         // Show elegant login page
//         res.send(`
//             <!DOCTYPE html>
//             <html lang="en">
//             <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>Admin Access - EcoCheck</title>
//                 <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
//                 <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
//                 <style>
//                     body { 
//                         background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
//                         min-height: 100vh;
//                         display: flex;
//                         align-items: center;
//                     }
//                     .login-card {
//                         border: none;
//                         border-radius: 20px;
//                         box-shadow: 0 20px 50px rgba(0,0,0,0.1);
//                     }
//                     .password-input {
//                         border: 2px solid #e5e7eb;
//                         border-radius: 10px;
//                         padding: 1rem;
//                         font-size: 1.1rem;
//                     }
//                     .password-input:focus {
//                         border-color: #10b981;
//                         box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.25);
//                     }
//                 </style>
//             </head>
//             <body>
//                 <div class="container">
//                     <div class="row justify-content-center">
//                         <div class="col-md-6 col-lg-5">
//                             <div class="card login-card">
//                                 <div class="card-body p-5">
//                                     <div class="text-center mb-4">
//                                         <i class="fas fa-lock fa-3x text-success mb-3"></i>
//                                         <h2>Admin Portal</h2>
//                                         <p class="text-muted">Enter the admin password to continue</p>
//                                     </div>
                                    
//                                     <form id="loginForm">
//                                         <div class="mb-3">
//                                             <div class="input-group">
//                                                 <input type="password" 
//                                                        class="form-control password-input" 
//                                                        id="password" 
//                                                        placeholder="Enter admin password" 
//                                                        required>
//                                                 <button class="btn btn-outline-secondary" type="button" id="togglePassword">
//                                                     <i class="fas fa-eye"></i>
//                                                 </button>
//                                             </div>
//                                         </div>
//                                         <button type="submit" class="btn btn-success btn-lg w-100">
//                                             <i class="fas fa-unlock me-2"></i>Access Admin Portal
//                                         </button>
//                                     </form>
                                    
//                                     <div class="mt-4 text-center">
//                                         <small class="text-muted">
//                                             <i class="fas fa-info-circle me-1"></i>
//                                             Contact the website administrator if you need access
//                                         </small>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <script>
//                     document.getElementById('loginForm').addEventListener('submit', function(e) {
//                         e.preventDefault();
//                         const password = document.getElementById('password').value;
//                         // Redirect to admin with password in URL
//                         window.location.href = '/admin?password=' + encodeURIComponent(password);
//                     });

//                     // Toggle password visibility
//                     document.getElementById('togglePassword').addEventListener('click', function() {
//                         const passwordInput = document.getElementById('password');
//                         const icon = this.querySelector('i');
                        
//                         if (passwordInput.type === 'password') {
//                             passwordInput.type = 'text';
//                             icon.className = 'fas fa-eye-slash';
//                         } else {
//                             passwordInput.type = 'password';
//                             icon.className = 'fas fa-eye';
//                         }
//                     });

//                     // Focus on password input
//                     document.getElementById('password').focus();
//                 </script>
//             </body>
//             </html>
//         `);
//     }
// };

// // Middleware
// app.use(cors());
// app.use(express.json());

// // IMPORTANT: Only serve static files for non-admin routes
// app.use((req, res, next) => {
//     // If it's an admin route, don't serve static files
//     if (req.path === '/admin' || req.path === '/data-viewer') {
//         next();
//     } else {
//         express.static('public')(req, res, next);
//     }
// });

// // Create tables
// const createTables = async () => {
//     try {
//         await pool.query(`
//             CREATE TABLE IF NOT EXISTS brands (
//                 id SERIAL PRIMARY KEY,
//                 name VARCHAR(100) UNIQUE NOT NULL,
//                 description TEXT,
//                 sustainability_rating INTEGER CHECK (sustainability_rating >= 1 AND sustainability_rating <= 5),
//                 is_sustainable BOOLEAN DEFAULT false,
//                 eco_certifications TEXT,
//                 sustainability_details TEXT,
//                 website_url VARCHAR(255),
//                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//             )
//         `);
//         console.log('✅ Brands table created/verified');

//         // Insert sample data
//         await insertSampleData();
//     } catch (err) {
//         console.error('Error creating tables:', err);
//     }
// };

// // Insert sample data
// const insertSampleData = async () => {
//     const sampleBrands = [
//         {
//             name: 'Patagonia',
//             description: 'Outdoor clothing and gear company',
//             sustainability_rating: 5,
//             is_sustainable: true,
//             eco_certifications: 'B Corp, Fair Trade Certified',
//             sustainability_details: 'Uses recycled materials, repairs clothing, donates to environmental causes',
//             website_url: 'https://www.patagonia.com'
//         },
//         {
//             name: 'Allbirds',
//             description: 'Sustainable footwear company',
//             sustainability_rating: 4,
//             is_sustainable: true,
//             eco_certifications: 'B Corp',
//             sustainability_details: 'Uses renewable materials, carbon-neutral shipping',
//             website_url: 'https://www.allbirds.com'
//         },
//         {
//             name: 'Fast Fashion Co',
//             description: 'Generic fast fashion brand',
//             sustainability_rating: 1,
//             is_sustainable: false,
//             eco_certifications: 'None',
//             sustainability_details: 'Known for poor labor conditions and high environmental impact',
//             website_url: 'https://example.com'
//         }
//     ];

//     for (const brand of sampleBrands) {
//         try {
//             await pool.query(
//                 `INSERT INTO brands (name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url) 
//                  VALUES ($1, $2, $3, $4, $5, $6, $7) 
//                  ON CONFLICT (name) DO NOTHING`,
//                 [brand.name, brand.description, brand.sustainability_rating, brand.is_sustainable, 
//                  brand.eco_certifications, brand.sustainability_details, brand.website_url]
//             );
//         } catch (err) {
//             console.log('Error inserting brand:', brand.name, err);
//         }
//     }
//     console.log('✅ Sample data inserted');
// };

// // Initialize database
// createTables();

// // Routes

// // Home page
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Protected admin routes - MUST COME BEFORE static file handling
// app.get('/admin', requireAdminAuth, (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'admin.html'));
// });

// app.get('/data-viewer', requireAdminAuth, (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'data-viewer.html'));
// });

// // Search for a brand
// app.get('/api/brands/search/:name', async (req, res) => {
//     try {
//         const brandName = req.params.name.toLowerCase();
//         const result = await pool.query(
//             "SELECT * FROM brands WHERE LOWER(name) LIKE $1",
//             [`%${brandName}%`]
//         );
        
//         if (result.rows.length > 0) {
//             res.json({ ...result.rows[0], found: true });
//         } else {
//             res.json({ 
//                 found: false, 
//                 message: `No sustainability data found for "${req.params.name}"` 
//             });
//         }
//     } catch (err) {
//         console.error('Search error:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

// // Get all sustainable brands
// app.get('/api/brands/sustainable', async (req, res) => {
//     try {
//         const result = await pool.query(
//             "SELECT * FROM brands WHERE is_sustainable = true ORDER BY name"
//         );
//         res.json(result.rows);
//     } catch (err) {
//         console.error('Error fetching sustainable brands:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

// // Get all brands (for admin)
// app.get('/api/brands', requireAdminAuth, async (req, res) => {
//     try {
//         const result = await pool.query("SELECT * FROM brands ORDER BY name");
//         res.json(result.rows);
//     } catch (err) {
//         console.error('Error fetching brands:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

// // Add new brand
// app.post('/api/brands', requireAdminAuth, async (req, res) => {
//     try {
//         const { name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url } = req.body;
        
//         const result = await pool.query(
//             `INSERT INTO brands (name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url) 
//              VALUES ($1, $2, $3, $4, $5, $6, $7) 
//              RETURNING *`,
//             [name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url]
//         );
        
//         res.json({ message: 'Brand added successfully', brand: result.rows[0] });
//     } catch (err) {
//         console.error('Error adding brand:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

// // Update brand
// app.put('/api/brands/:id', requireAdminAuth, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url } = req.body;
        
//         const result = await pool.query(
//             `UPDATE brands 
//              SET name = $1, description = $2, sustainability_rating = $3, is_sustainable = $4, 
//                  eco_certifications = $5, sustainability_details = $6, website_url = $7, updated_at = CURRENT_TIMESTAMP
//              WHERE id = $8 
//              RETURNING *`,
//             [name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url, id]
//         );
        
//         if (result.rows.length > 0) {
//             res.json({ message: 'Brand updated successfully', brand: result.rows[0] });
//         } else {
//             res.status(404).json({ error: 'Brand not found' });
//         }
//     } catch (err) {
//         console.error('Error updating brand:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

// // Delete brand
// app.delete('/api/brands/:id', requireAdminAuth, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const result = await pool.query("DELETE FROM brands WHERE id = $1 RETURNING *", [id]);
        
//         if (result.rows.length > 0) {
//             res.json({ message: 'Brand deleted successfully' });
//         } else {
//             res.status(404).json({ error: 'Brand not found' });
//         }
//     } catch (err) {
//         console.error('Error deleting brand:', err);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

// // Simple traffic tracking
// let trafficStats = {
//     totalVisits: 0,
//     searches: 0,
//     uniqueVisitors: new Set(),
//     startDate: new Date()
// };

// // Track visits
// app.use((req, res, next) => {
//     // Don't track admin or API calls
//     if (!req.path.startsWith('/admin') && !req.path.startsWith('/api') && req.path === '/') {
//         trafficStats.totalVisits++;
//         trafficStats.uniqueVisitors.add(req.ip);
//     }
//     next();
// });

// // Track searches
// app.get('/api/brands/search/:name', async (req, res) => {
//     trafficStats.searches++;
//     // ... your existing search code
// });

// // Add traffic stats to admin panel
// app.get('/api/traffic', requireAdminAuth, (req, res) => {
//     res.json({
//         totalVisits: trafficStats.totalVisits,
//         totalSearches: trafficStats.searches,
//         uniqueVisitors: trafficStats.uniqueVisitors.size,
//         averageSearchesPerVisit: trafficStats.searches / Math.max(trafficStats.totalVisits, 1),
//         uptime: Date.now() - trafficStats.startDate.getTime()
//     });
// });

// // Start server
// app.listen(PORT, () => {
//     console.log(`✅ Server running at http://localhost:${PORT}`);
//     console.log(`🔧 Admin panel: http://localhost:${PORT}/admin (password: eco2024)`);
//     console.log(`📊 Data viewer: http://localhost:${PORT}/data-viewer (password: eco2024)`);
//     console.log('🔐 Password protection is ACTIVE');
// });
// // const express = require('express');
// // const cors = require('cors');
// // const path = require('path');
// // const { Pool } = require('pg');

// // const app = express();
// // const PORT = 3000;

// // // Middleware
// // app.use(cors());
// // app.use(express.json());
// // app.use(express.static('public'));

// // // PostgreSQL connection
// // const pool = new Pool({
// //     user: 'cc_admin',
// //     host: 'localhost',
// //     database: 'conscious_consumer',
// //     password: 'password123',
// //     port: 5432,
// // });

// // // Test database connection
// // pool.connect((err, client, release) => {
// //     if (err) {
// //         console.error('Error connecting to database:', err);
// //     } else {
// //         console.log('✅ Connected to PostgreSQL database');
// //         release();
// //     }
// // });

// // // Admin security configuration
// // const adminConfig = {
// //     password: process.env.ADMIN_PASSWORD || 'eco2024',
// //     secretPath: process.env.ADMIN_SECRET_PATH || 'manage-brands',
// //     allowedIPs: process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : []
// // };

// // // Admin authentication middleware
// // const requireAdminAuth = (req, res, next) => {
// //     const clientIP = req.ip || req.connection.remoteAddress;
// //     const providedPassword = req.query.password || 
// //                            (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
    
// //     // Allow access if:
// //     // 1. Correct password provided, OR
// //     // 2. IP is in allowed list, OR  
// //     // 3. Not in production mode
// //     const isAuthenticated = providedPassword === adminConfig.password ||
// //                           adminConfig.allowedIPs.includes(clientIP) ||
// //                           process.env.NODE_ENV !== 'production';
    
// //     if (isAuthenticated) {
// //         next();
// //     } else {
// //         // Show elegant login page
// //         res.send(`
// //             <!DOCTYPE html>
// //             <html lang="en">
// //             <head>
// //                 <meta charset="UTF-8">
// //                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
// //                 <title>Admin Access - EcoCheck</title>
// //                 <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
// //                 <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
// //                 <style>
// //                     body { 
// //                         background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
// //                         min-height: 100vh;
// //                         display: flex;
// //                         align-items: center;
// //                     }
// //                     .login-card {
// //                         border: none;
// //                         border-radius: 20px;
// //                         box-shadow: 0 20px 50px rgba(0,0,0,0.1);
// //                     }
// //                     .password-input {
// //                         border: 2px solid #e5e7eb;
// //                         border-radius: 10px;
// //                         padding: 1rem;
// //                         font-size: 1.1rem;
// //                     }
// //                     .password-input:focus {
// //                         border-color: #10b981;
// //                         box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.25);
// //                     }
// //                 </style>
// //             </head>
// //             <body>
// //                 <div class="container">
// //                     <div class="row justify-content-center">
// //                         <div class="col-md-6 col-lg-5">
// //                             <div class="card login-card">
// //                                 <div class="card-body p-5">
// //                                     <div class="text-center mb-4">
// //                                         <i class="fas fa-lock fa-3x text-success mb-3"></i>
// //                                         <h2>Admin Portal</h2>
// //                                         <p class="text-muted">Enter the admin password to continue</p>
// //                                     </div>
                                    
// //                                     <form id="loginForm">
// //                                         <div class="mb-3">
// //                                             <div class="input-group">
// //                                                 <input type="password" 
// //                                                        class="form-control password-input" 
// //                                                        id="password" 
// //                                                        placeholder="Enter admin password" 
// //                                                        required>
// //                                                 <button class="btn btn-outline-secondary" type="button" id="togglePassword">
// //                                                     <i class="fas fa-eye"></i>
// //                                                 </button>
// //                                             </div>
// //                                         </div>
// //                                         <button type="submit" class="btn btn-success btn-lg w-100">
// //                                             <i class="fas fa-unlock me-2"></i>Access Admin Portal
// //                                         </button>
// //                                     </form>
                                    
// //                                     <div class="mt-4 text-center">
// //                                         <small class="text-muted">
// //                                             <i class="fas fa-info-circle me-1"></i>
// //                                             Contact the website administrator if you need access
// //                                         </small>
// //                                     </div>
// //                                 </div>
// //                             </div>
// //                         </div>
// //                     </div>
// //                 </div>

// //                 <script>
// //                     document.getElementById('loginForm').addEventListener('submit', function(e) {
// //                         e.preventDefault();
// //                         const password = document.getElementById('password').value;
// //                         // Redirect to admin with password in URL
// //                         window.location.href = '/admin?password=' + encodeURIComponent(password);
// //                     });

// //                     // Toggle password visibility
// //                     document.getElementById('togglePassword').addEventListener('click', function() {
// //                         const passwordInput = document.getElementById('password');
// //                         const icon = this.querySelector('i');
                        
// //                         if (passwordInput.type === 'password') {
// //                             passwordInput.type = 'text';
// //                             icon.className = 'fas fa-eye-slash';
// //                         } else {
// //                             passwordInput.type = 'password';
// //                             icon.className = 'fas fa-eye';
// //                         }
// //                     });

// //                     // Focus on password input
// //                     document.getElementById('password').focus();
// //                 </script>
// //             </body>
// //             </html>
// //         `);
// //     }
// // };

// // // Protected admin routes
// // app.get('/admin', requireAdminAuth, (req, res) => {
// //     res.sendFile(path.join(__dirname, 'public', 'admin.html'));
// // });

// // app.get('/data-viewer', requireAdminAuth, (req, res) => {
// //     res.sendFile(path.join(__dirname, 'public', 'data-viewer.html'));
// // });




// // // Create tables
// // const createTables = async () => {
// //     try {
// //         await pool.query(`
// //             CREATE TABLE IF NOT EXISTS brands (
// //                 id SERIAL PRIMARY KEY,
// //                 name VARCHAR(100) UNIQUE NOT NULL,
// //                 description TEXT,
// //                 sustainability_rating INTEGER CHECK (sustainability_rating >= 1 AND sustainability_rating <= 5),
// //                 is_sustainable BOOLEAN DEFAULT false,
// //                 eco_certifications TEXT,
// //                 sustainability_details TEXT,
// //                 website_url VARCHAR(255),
// //                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
// //                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// //             )
// //         `);
// //         console.log('✅ Brands table created/verified');

// //         // Insert sample data
// //         await insertSampleData();
// //     } catch (err) {
// //         console.error('Error creating tables:', err);
// //     }
// // };

// // // Insert sample data
// // const insertSampleData = async () => {
// //     const sampleBrands = [
// //         {
// //             name: 'Patagonia',
// //             description: 'Outdoor clothing and gear company',
// //             sustainability_rating: 5,
// //             is_sustainable: true,
// //             eco_certifications: 'B Corp, Fair Trade Certified',
// //             sustainability_details: 'Uses recycled materials, repairs clothing, donates to environmental causes',
// //             website_url: 'https://www.patagonia.com'
// //         },
// //         {
// //             name: 'Allbirds',
// //             description: 'Sustainable footwear company',
// //             sustainability_rating: 4,
// //             is_sustainable: true,
// //             eco_certifications: 'B Corp',
// //             sustainability_details: 'Uses renewable materials, carbon-neutral shipping',
// //             website_url: 'https://www.allbirds.com'
// //         },
// //         {
// //             name: 'Fast Fashion Co',
// //             description: 'Generic fast fashion brand',
// //             sustainability_rating: 1,
// //             is_sustainable: false,
// //             eco_certifications: 'None',
// //             sustainability_details: 'Known for poor labor conditions and high environmental impact',
// //             website_url: 'https://example.com'
// //         }
// //     ];

// //     for (const brand of sampleBrands) {
// //         try {
// //             await pool.query(
// //                 `INSERT INTO brands (name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url) 
// //                  VALUES ($1, $2, $3, $4, $5, $6, $7) 
// //                  ON CONFLICT (name) DO NOTHING`,
// //                 [brand.name, brand.description, brand.sustainability_rating, brand.is_sustainable, 
// //                  brand.eco_certifications, brand.sustainability_details, brand.website_url]
// //             );
// //         } catch (err) {
// //             console.log('Error inserting brand:', brand.name, err);
// //         }
// //     }
// //     console.log('✅ Sample data inserted');
// // };

// // // Initialize database
// // createTables();

// // // Routes

// // // Search for a brand
// // app.get('/api/brands/search/:name', async (req, res) => {
// //     try {
// //         const brandName = req.params.name.toLowerCase();
// //         const result = await pool.query(
// //             "SELECT * FROM brands WHERE LOWER(name) LIKE $1",
// //             [`%${brandName}%`]
// //         );
        
// //         if (result.rows.length > 0) {
// //             res.json({ ...result.rows[0], found: true });
// //         } else {
// //             res.json({ 
// //                 found: false, 
// //                 message: `No sustainability data found for "${req.params.name}"` 
// //             });
// //         }
// //     } catch (err) {
// //         console.error('Search error:', err);
// //         res.status(500).json({ error: 'Database error' });
// //     }
// // });

// // // Get all sustainable brands
// // app.get('/api/brands/sustainable', async (req, res) => {
// //     try {
// //         const result = await pool.query(
// //             "SELECT * FROM brands WHERE is_sustainable = true ORDER BY name"
// //         );
// //         res.json(result.rows);
// //     } catch (err) {
// //         console.error('Error fetching sustainable brands:', err);
// //         res.status(500).json({ error: 'Database error' });
// //     }
// // });

// // // Get all brands (for admin)
// // app.get('/api/brands', async (req, res) => {
// //     try {
// //         const result = await pool.query("SELECT * FROM brands ORDER BY name");
// //         res.json(result.rows);
// //     } catch (err) {
// //         console.error('Error fetching brands:', err);
// //         res.status(500).json({ error: 'Database error' });
// //     }
// // });

// // // Add new brand
// // app.post('/api/brands', requireAdminAuth, async (req, res) => {
// //     try {
// //         const { name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url } = req.body;
        
// //         const result = await pool.query(
// //             `INSERT INTO brands (name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url) 
// //              VALUES ($1, $2, $3, $4, $5, $6, $7) 
// //              RETURNING *`,
// //             [name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url]
// //         );
        
// //         res.json({ message: 'Brand added successfully', brand: result.rows[0] });
// //     } catch (err) {
// //         console.error('Error adding brand:', err);
// //         res.status(500).json({ error: 'Database error' });
// //     }
// // });

// // // Update brand
// // app.put('/api/brands/:id', requireAdminAuth, async (req, res) => {
// //     try {
// //         const { id } = req.params;
// //         const { name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url } = req.body;
        
// //         const result = await pool.query(
// //             `UPDATE brands 
// //              SET name = $1, description = $2, sustainability_rating = $3, is_sustainable = $4, 
// //                  eco_certifications = $5, sustainability_details = $6, website_url = $7, updated_at = CURRENT_TIMESTAMP
// //              WHERE id = $8 
// //              RETURNING *`,
// //             [name, description, sustainability_rating, is_sustainable, eco_certifications, sustainability_details, website_url, id]
// //         );
        
// //         if (result.rows.length > 0) {
// //             res.json({ message: 'Brand updated successfully', brand: result.rows[0] });
// //         } else {
// //             res.status(404).json({ error: 'Brand not found' });
// //         }
// //     } catch (err) {
// //         console.error('Error updating brand:', err);
// //         res.status(500).json({ error: 'Database error' });
// //     }
// // });

// // // Delete brand
// // app.delete('/api/brands/:id', requireAdminAuth, async (req, res) => {
// //     try {
// //         const { id } = req.params;
// //         const result = await pool.query("DELETE FROM brands WHERE id = $1 RETURNING *", [id]);
        
// //         if (result.rows.length > 0) {
// //             res.json({ message: 'Brand deleted successfully' });
// //         } else {
// //             res.status(404).json({ error: 'Brand not found' });
// //         }
// //     } catch (err) {
// //         console.error('Error deleting brand:', err);
// //         res.status(500).json({ error: 'Database error' });
// //     }
// // });


// // // Start server
// // app.listen(PORT, () => {
// //     console.log(`✅ Server running at http://localhost:${PORT}`);
// //     console.log(`🔧 Admin panel: http://localhost:${PORT}/admin`);
// // });

// //static data
// // const express = require('express');
// // const cors = require('cors');
// // const path = require('path');

// // const app = express();
// // const PORT = 3000;

// // // Middleware
// // app.use(cors());
// // app.use(express.json());
// // app.use(express.static('public'));

// // // In-memory data (no database needed!)
// // const brands = [
// //     {
// //         id: 1,
// //         name: 'Patagonia',
// //         description: 'Outdoor clothing and gear company',
// //         sustainability_rating: 5,
// //         is_sustainable: true,
// //         eco_certifications: 'B Corp, Fair Trade Certified',
// //         sustainability_details: 'Uses recycled materials, repairs clothing, donates to environmental causes',
// //         website_url: 'https://www.patagonia.com'
// //     },
// //     {
// //         id: 2,
// //         name: 'Allbirds',
// //         description: 'Sustainable footwear company',
// //         sustainability_rating: 4,
// //         is_sustainable: true,
// //         eco_certifications: 'B Corp',
// //         sustainability_details: 'Uses renewable materials, carbon-neutral shipping',
// //         website_url: 'https://www.allbirds.com'
// //     },
// //     {
// //         id: 3,
// //         name: 'Fast Fashion Co',
// //         description: 'Generic fast fashion brand',
// //         sustainability_rating: 1,
// //         is_sustainable: false,
// //         eco_certifications: 'None',
// //         sustainability_details: 'Known for poor labor conditions and high environmental impact',
// //         website_url: 'https://example.com'
// //     },
// //     {
// //         id: 4,
// //         name: 'Tentree',
// //         description: 'Apparel company that plants trees',
// //         sustainability_rating: 5,
// //         is_sustainable: true,
// //         eco_certifications: 'B Corp',
// //         sustainability_details: 'Plants 10 trees for every item purchased, uses sustainable materials',
// //         website_url: 'https://www.tentree.com'
// //     },
// //     {
// //         id: 5,
// //         name: 'Test',
// //         description: 'Apparel company that plants trees',
// //         sustainability_rating: 5,
// //         is_sustainable: true,
// //         eco_certifications: 'B Corp',
// //         sustainability_details: 'Plants 10 trees for every item purchased, uses sustainable materials',
// //         website_url: 'https://www.tentree.com'
// //     }
// // ];

// // // Routes
// // app.get('/', (req, res) => {
// //     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// // });

// // // Search for a brand
// // app.get('/api/brands/search/:name', (req, res) => {
// //     const brandName = req.params.name.toLowerCase();
// //     const brand = brands.find(b => b.name.toLowerCase().includes(brandName));
    
// //     if (brand) {
// //         res.json({...brand, found: true});
// //     } else {
// //         res.json({ 
// //             found: false, 
// //             message: `No sustainability data found for "${req.params.name}"` 
// //         });
// //     }
// // });

// // // Get all sustainable brands
// // app.get('/api/brands/sustainable', (req, res) => {
// //     const sustainableBrands = brands.filter(b => b.is_sustainable);
// //     res.json(sustainableBrands);
// // });

// // // Get all brands (for testing)
// // app.get('/api/brands', (req, res) => {
// //     res.json(brands);
// // });

// // // Start server
// // app.listen(PORT, () => {
// //     console.log(`✅ Server running at http://localhost:${PORT}`);
// //     console.log('📊 Sample brands loaded in memory');
// //     console.log('🌱 Try searching for: Patagonia, Allbirds, Tentree, Fast Fashion Co');
// // });
