/**
 * Admin Panel System
 * A consolidated, robust implementation for the admin panel functionality
 */

// Admin configuration
const ADMIN_EMAIL = 'liad1111@gmail.com';
let isAdmin = false;

// Single source of truth for admin panel state
const AdminPanel = {
    // State
    isInitialized: false,
    isOpen: false,
    
    // Initialize the admin panel once
    init() {
        if (this.isInitialized) return;
        
        console.log('Initializing admin panel system');
        this.createAdminPanel();
        this.createAdminMenuItem();
        this.addAdminStyles();
        this.attachEventHandlers();
        this.isInitialized = true;
    },
    
    // Create the admin panel DOM structure
    createAdminPanel() {
        // Remove any existing admin panels first (cleanup)
        $('#admin-panel').remove();
        
        const adminPanelHTML = `
        <div id="admin-panel" class="admin-panel">
            <div class="admin-panel-header">
                <h2>פאנל ניהול</h2>
                <button id="close-admin-panel" class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="admin-panel-content">
                <div class="admin-tabs">
                    <button class="admin-tab-btn active" data-target="products-tab">מוצרים</button>
                    <button class="admin-tab-btn" data-target="orders-tab">הזמנות</button>
                    <button class="admin-tab-btn" data-target="users-tab">משתמשים</button>
                    <button class="admin-tab-btn" data-target="settings-tab">הגדרות</button>
                </div>
                <div class="admin-tab-content">
                    <div id="products-tab" class="admin-tab-pane active">
                        <div class="admin-actions">
                            <button id="add-product-btn" class="btn btn-primary">הוסף מוצר חדש</button>
                            <button id="refresh-products-btn" class="btn">רענן מוצרים</button>
                        </div>
                        <div id="admin-products-grid" class="admin-products-grid">
                            <!-- Products will be loaded here -->
                            <div class="loading">טוען מוצרים...</div>
                        </div>
                    </div>
                    <div id="orders-tab" class="admin-tab-pane">
                        <h3>ניהול הזמנות</h3>
                        <p>פונקציונליות זו תהיה זמינה בקרוב.</p>
                    </div>
                    <div id="users-tab" class="admin-tab-pane">
                        <h3>ניהול משתמשים</h3>
                        <p>פונקציונליות זו תהיה זמינה בקרוב.</p>
                    </div>
                    <div id="settings-tab" class="admin-tab-pane">
                        <h3>הגדרות האתר</h3>
                        <div class="settings-form">
                            <div class="form-group">
                                <label>שם האתר</label>
                                <input type="text" id="site-name" placeholder="שם האתר">
                            </div>
                            <div class="form-group">
                                <label>לוגו האתר (URL)</label>
                                <input type="text" id="site-logo" placeholder="כתובת תמונת הלוגו">
                            </div>
                            <button id="save-settings" class="btn btn-primary">שמור הגדרות</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        $('body').append(adminPanelHTML);
    },
    
    // Create admin menu item
    createAdminMenuItem() {
        // Remove any existing admin menu items first (cleanup)
        $('#admin-menu-item').remove();
        
        const adminMenuItem = `<li id="admin-menu-item" style="display:none;"><a href="#" id="open-admin-panel-link">פאנל ניהול</a></li>`;
        $('nav ul').append(adminMenuItem);
    },
    
    // Add admin styles
    addAdminStyles() {
        // Remove any existing admin styles first (cleanup)
        $('#admin-styles').remove();
        
        const adminStyles = `
        <style id="admin-styles">
            .admin-panel {
                position: fixed;
                top: 0;
                right: -100%;
                width: 90%;
                max-width: 1000px;
                height: 100vh;
                background: white;
                box-shadow: -5px 0 15px rgba(0,0,0,0.2);
                z-index: 1000;
                transition: right 0.3s ease;
                overflow-y: auto;
                padding: 20px;
                direction: rtl;
            }
            
            .admin-panel.active {
                right: 0;
            }
            
            .admin-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            
            .admin-tabs {
                display: flex;
                margin-bottom: 20px;
                border-bottom: 1px solid #eee;
            }
            
            .admin-tab-btn {
                padding: 10px 15px;
                background: none;
                border: none;
                cursor: pointer;
                margin-right: 5px;
                border-bottom: 2px solid transparent;
            }
            
            .admin-tab-btn.active {
                border-bottom: 2px solid var(--primary-color);
                font-weight: bold;
            }
            
            .admin-tab-pane {
                display: none;
            }
            
            .admin-tab-pane.active {
                display: block;
            }
            
            .admin-actions {
                margin-bottom: 20px;
                display: flex;
                gap: 10px;
            }
            
            .admin-products-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .admin-product-card {
                border: 1px solid #eee;
                border-radius: 5px;
                padding: 10px;
                position: relative;
            }
            
            .admin-product-image {
                height: 150px;
                width: 100%;
                object-fit: cover;
                margin-bottom: 10px;
                border-radius: 3px;
            }
            
            .admin-product-actions {
                display: flex;
                justify-content: space-between;
                margin-top: 10px;
            }
            
            .loading {
                text-align: center;
                padding: 20px;
                color: #888;
            }
            
            /* Product Form Styles */
            .product-form-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1100;
                display: none;
            }
            
            .product-form-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                background: white;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                z-index: 1101;
                direction: rtl;
            }
            
            .product-form-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            
            .product-form {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .form-full-width {
                grid-column: 1 / span 2;
            }
            
            .product-image-preview {
                width: 100%;
                height: 200px;
                object-fit: contain;
                border: 1px dashed #ccc;
                margin-top: 10px;
            }
            
            .product-form-actions {
                grid-column: 1 / span 2;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }
        </style>
        `;
        
        $('head').append(adminStyles);
    },
    
    // Attach event handlers
    attachEventHandlers() {
        // Close admin panel button
        $(document).on('click', '#close-admin-panel', () => this.close());
        
        // Open admin panel link
        $(document).on('click', '#open-admin-panel-link', (e) => {
            e.preventDefault();
            this.open();
        });
        
        // Tab switching in admin panel
        $(document).on('click', '.admin-tab-btn', function() {
            $('.admin-tab-btn').removeClass('active');
            $(this).addClass('active');
            
            const target = $(this).data('target');
            $('.admin-tab-pane').removeClass('active');
            $(`#${target}`).addClass('active');
        });
        
        // Add product button
        $(document).on('click', '#add-product-btn', () => {
            ProductForm.show();
        });
        
        // Refresh products button
        $(document).on('click', '#refresh-products-btn', () => {
            this.loadProducts();
        });
        
        // Edit product button
        $(document).on('click', '.btn-edit-product', function() {
            const productId = $(this).data('id');
            ProductForm.show(productId);
        });
        
        // Delete product button
        $(document).on('click', '.btn-delete-product', function() {
            const productId = $(this).data('id');
            if (confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
                AdminPanel.deleteProduct(productId);
            }
        });
    },
    
    // Open the admin panel
    open() {
        if (!this.isInitialized) {
            this.init();
        }
        
        $('#admin-panel').addClass('active');
        this.isOpen = true;
        this.loadProducts();
    },
    
    // Close the admin panel
    close() {
        $('#admin-panel').removeClass('active');
        this.isOpen = false;
    },
    
    // Load products for admin panel
    loadProducts() {
        console.log('Loading products for admin panel');
        
        // Clear any previous content and show loading state
        $('#admin-products-grid').html('<div class="loading">טוען מוצרים...</div>');
        
        // Ensure ProductManager exists
        if (typeof productManager === 'undefined' || !productManager) {
            console.log('Creating new ProductManager instance');
            window.productManager = new ProductManager();
        }
        
        // Load products from GitHub
        productManager.loadProductsFromGitHub()
            .then(success => {
                if (success) {
                    this.displayProducts();
                } else {
                    $('#admin-products-grid').html('<div class="error">שגיאה בטעינת מוצרים</div>');
                }
            })
            .catch(error => {
                console.error('Error loading products:', error);
                $('#admin-products-grid').html(`<div class="error">שגיאה בטעינת מוצרים: ${error.message}</div>`);
            });
    },
    
    // Display products in admin panel
    displayProducts() {
        const products = productManager.getAllProducts();
        
        if (!products || products.length === 0) {
            $('#admin-products-grid').html('<div class="empty">אין מוצרים להצגה</div>');
            return;
        }
        
        let productsHTML = '';
        
        products.forEach(product => {
            productsHTML += `
                <div class="admin-product-card" data-id="${product.id}">
                    <img src="${product.image || 'https://via.placeholder.com/300x300?text=' + encodeURIComponent(product.name)}" 
                         alt="${product.name}" class="admin-product-image">
                    <h4>${product.name}</h4>
                    <p>מחיר: ₪${product.price ? product.price.toFixed(2) : '0.00'}</p>
                    <p>קטגוריה: ${product.category || 'כללי'}</p>
                    <div class="admin-product-actions">
                        <button class="btn-edit-product" data-id="${product.id}">עריכה</button>
                        <button class="btn-delete-product" data-id="${product.id}">מחיקה</button>
                    </div>
                </div>
            `;
        });
        
        $('#admin-products-grid').html(productsHTML);
    },
    
    // Delete product
    deleteProduct(productId) {
        if (typeof productManager === 'undefined' || !productManager) {
            showNotification('מנהל המוצרים לא מאותחל', 'error');
            return;
        }
        
        productManager.deleteProduct(productId).then(success => {
            if (success) {
                this.displayProducts();
                
                // Also update homepage products if we're on the homepage
                if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                    if (typeof displayProductsOnHomepage === 'function') {
                        displayProductsOnHomepage();
                    }
                }
            }
        });
    }
};

// Product Form System
const ProductForm = {
    // State
    currentProductId: null,
    
    // Show product form (create or edit)
    show(productId = null) {
        this.currentProductId = productId;
        
        // Create form if it doesn't exist
        if ($('.product-form-overlay').length === 0) {
            this.createForm();
        }
        
        // Update form title
        const title = productId ? 'עריכת מוצר' : 'הוספת מוצר חדש';
        $('.product-form-title').text(title);
        
        // Clear form fields
        this.clearForm();
        
        // Load product data if editing
        if (productId) {
            this.loadProductData(productId);
        }
        
        // Show form
        $('.product-form-overlay').fadeIn(200);
    },
    
    // Hide product form
    hide() {
        $('.product-form-overlay').fadeOut(200);
        this.currentProductId = null;
    },
    
    // Create product form
    createForm() {
        const formHTML = `
        <div class="product-form-overlay">
            <div class="product-form-container">
                <div class="product-form-header">
                    <h3 class="product-form-title">הוספת מוצר חדש</h3>
                    <button class="close-form-btn"><i class="fas fa-times"></i></button>
                </div>
                <form id="product-form" class="product-form">
                    <div class="form-group">
                        <label for="product-name">שם המוצר</label>
                        <input type="text" id="product-name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="product-price">מחיר</label>
                        <input type="number" id="product-price" class="form-control" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="product-category">קטגוריה</label>
                        <input type="text" id="product-category" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="product-old-price">מחיר ישן (למבצע)</label>
                        <input type="number" id="product-old-price" class="form-control" step="0.01" min="0">
                    </div>
                    <div class="form-group form-full-width">
                        <label for="product-image-url">כתובת תמונה (URL)</label>
                        <input type="text" id="product-image-url" class="form-control">
                        <img id="product-image-preview" class="product-image-preview" src="https://via.placeholder.com/300x200?text=תצוגה+מקדימה">
                    </div>
                    <div class="form-group form-full-width">
                        <label for="product-description">תיאור המוצר</label>
                        <textarea id="product-description" class="form-control" rows="4"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="product-stock">מלאי</label>
                        <input type="number" id="product-stock" class="form-control" min="0" value="1">
                    </div>
                    <div class="form-group">
                        <label for="product-badge">תג מיוחד</label>
                        <select id="product-badge" class="form-control">
                            <option value="">ללא תג</option>
                            <option value="new">חדש</option>
                            <option value="sale">מבצע</option>
                            <option value="hot">חם</option>
                            <option value="out-of-stock">אזל מהמלאי</option>
                        </select>
                    </div>
                    <div class="product-form-actions">
                        <button type="button" class="btn cancel-product-btn">ביטול</button>
                        <button type="submit" class="btn btn-primary save-product-btn">שמור מוצר</button>
                    </div>
                </form>
            </div>
        </div>
        `;
        
        $('body').append(formHTML);
        
        // Attach event handlers
        $('.close-form-btn, .cancel-product-btn').on('click', () => this.hide());
        
        // Image preview update
        $('#product-image-url').on('input', function() {
            const url = $(this).val();
            if (url) {
                $('#product-image-preview').attr('src', url);
            } else {
                $('#product-image-preview').attr('src', 'https://via.placeholder.com/300x200?text=תצוגה+מקדימה');
            }
        });
        
        // Form submit
        $('#product-form').on('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
    },
    
    // Clear form fields
    clearForm() {
        $('#product-name').val('');
        $('#product-price').val('');
        $('#product-category').val('');
        $('#product-old-price').val('');
        $('#product-image-url').val('');
        $('#product-description').val('');
        $('#product-stock').val('1');
        $('#product-badge').val('');
        $('#product-image-preview').attr('src', 'https://via.placeholder.com/300x200?text=תצוגה+מקדימה');
    },
    
    // Load product data for editing
    loadProductData(productId) {
        if (typeof productManager === 'undefined' || !productManager) {
            showNotification('מנהל המוצרים לא מאותחל', 'error');
            return;
        }
        
        const product = productManager.getProduct(productId);
        if (!product) {
            showNotification('המוצר לא נמצא', 'error');
            return;
        }
        
        $('#product-name').val(product.name || '');
        $('#product-price').val(product.price || '');
        $('#product-category').val(product.category || '');
        $('#product-old-price').val(product.oldPrice || '');
        $('#product-image-url').val(product.image || '');
        $('#product-description').val(product.description || '');
        $('#product-stock').val(product.stock || 1);
        $('#product-badge').val(product.badge || '');
        
        // Update image preview
        if (product.image) {
            $('#product-image-preview').attr('src', product.image);
        }
    },
    
    // Save product
    saveProduct() {
        if (typeof productManager === 'undefined' || !productManager) {
            showNotification('מנהל המוצרים לא מאותחל', 'error');
            return;
        }
        
        // Get form data
        const productData = {
            name: $('#product-name').val(),
            price: parseFloat($('#product-price').val()),
            category: $('#product-category').val(),
            description: $('#product-description').val(),
            image: $('#product-image-url').val(),
            stock: parseInt($('#product-stock').val(), 10) || 0
        };
        
        // Optional fields
        const oldPrice = $('#product-old-price').val();
        if (oldPrice) {
            productData.oldPrice = parseFloat(oldPrice);
        }
        
        const badge = $('#product-badge').val();
        if (badge) {
            productData.badge = badge;
        }
        
        // Add defaults for rating
        productData.rating = productData.rating || 0;
        productData.ratingCount = productData.ratingCount || 0;
        
        if (this.currentProductId) {
            // Update existing product
            productManager.updateProduct(this.currentProductId, productData)
                .then(success => {
                    if (success) {
                        AdminPanel.displayProducts();
                        
                        // Also update homepage products if we're on the homepage
                        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                            if (typeof displayProductsOnHomepage === 'function') {
                                displayProductsOnHomepage();
                            }
                        }
                        
                        this.hide();
                    }
                });
        } else {
            // Create new product
            productManager.addProduct(productData)
                .then(productId => {
                    if (productId) {
                        AdminPanel.displayProducts();
                        
                        // Also update homepage products if we're on the homepage
                        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                            if (typeof displayProductsOnHomepage === 'function') {
                                displayProductsOnHomepage();
                            }
                        }
                        
                        this.hide();
                    }
                });
        }
    }
};

// Initialize admin system when the user logs in and is identified as admin
function checkAdminStatus(userData) {
    if (userData && userData.email === ADMIN_EMAIL) {
        isAdmin = true;
        
        // Initialize admin panel
        AdminPanel.init();
        
        // Show admin menu item
        $('#admin-menu-item').show();
        
        // Auto-open panel for first login
        if (localStorage.getItem('adminPanelShown') !== 'true') {
            setTimeout(() => {
                AdminPanel.open();
                localStorage.setItem('adminPanelShown', 'true');
            }, 500);
        }
        
        return true;
    } else {
        isAdmin = false;
        $('#admin-menu-item').hide();
        return false;
    }
}

// Update the ProductManager class to improve GitHub connectivity
class ImprovedProductManager extends ProductManager {
    constructor() {
        super();
        this.saveAttemptCount = 0;
    }
    
    // Override saveProductsToGitHub with improved error handling and retry logic
    async saveProductsToGitHub() {
        try {
            console.log('Saving products to GitHub...');
            
            // Get existing file info (sha) first
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/data/products.json`;
            let sha = null;
            
            // Make sure we have a GitHub token
            const hasToken = await this.ensureGitHubToken();
            if (!hasToken) {
                console.error('No GitHub token available, cannot save products');
                showNotification('חסר טוקן גישה לשמירת מוצרים', 'error');
                return false;
            }
            
            // Check if data directory exists
            const dataDirectoryExists = await this.checkGitHubPath('data');
            if (!dataDirectoryExists) {
                console.log('Data directory does not exist, creating it...');
                const created = await this.createGitHubDirectory('data', 'Create data directory', this.githubToken);
                if (!created) {
                    showNotification('שגיאה ביצירת תיקיית נתונים', 'error');
                    return false;
                }
            }
            
            // Try to get existing file
            try {
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    sha = data.sha;
                    console.log('Existing products file found, sha:', sha);
                } else if (response.status !== 404) {
                    console.error(`GitHub API error (${response.status}): ${response.statusText}`);
                }
            } catch (error) {
                console.warn('Error checking for existing products file:', error);
                // Continue anyway to try to create the file
            }
            
            // Prepare content
            const content = JSON.stringify(this.products, null, 2);
            
            // Base64 encode content
            const base64Content = btoa(unescape(encodeURIComponent(content)));
            
            // Prepare request body
            const body = {
                message: 'Update products data',
                content: base64Content,
                branch: 'main'
            };
            
            // If we have a sha, it means we're updating an existing file
            if (sha) {
                body.sha = sha;
            }
            
            // Make the request
            const saveResponse = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });
            
            if (!saveResponse.ok) {
                const errorData = await saveResponse.json();
                console.error(`GitHub API error (${saveResponse.status}): ${saveResponse.statusText}`, errorData);
                
                // Try to handle specific errors
                if (saveResponse.status === 401) {
                    showNotification('הטוקן שסופק אינו תקף', 'error');
                    
                    // Clear token to prompt for a new one next time
                    this.githubToken = null;
                    this.clearStoredToken();
                    
                    return false;
                } else if (saveResponse.status === 409) {
                    console.warn('Conflict when saving to GitHub, retrying...');
                    
                    // Increment attempt counter
                    this.saveAttemptCount++;
                    
                    // Retry up to 3 times
                    if (this.saveAttemptCount < 3) {
                        // Wait a bit before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return await this.saveProductsToGitHub();
                    } else {
                        showNotification('לא ניתן לשמור את המוצרים עקב התנגשות', 'error');
                        this.saveAttemptCount = 0;
                        return false;
                    }
                } else {
                    showNotification(`שגיאה בשמירת מוצרים: ${errorData.message || 'שגיאה לא ידועה'}`, 'error');
                    return false;
                }
            }
            
            console.log('Products saved successfully to GitHub');
            
            // Reset attempt counter
            this.saveAttemptCount = 0;
            
            // Save to localStorage as backup
            localStorage.setItem('products', JSON.stringify(this.products));
            
            return true;
        } catch (error) {
            console.error('Error saving products to GitHub:', error);
            showNotification('שגיאה בשמירת מוצרים', 'error');
            return false;
        }
    }
    
    // Create a directory in GitHub
    async createGitHubDirectory(path, message, token) {
        try {
            // In GitHub, you create a directory by creating a file in that directory
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/${path}/.gitkeep`;
            
            // Base64 encode an empty content
            const base64Content = btoa('');
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    content: base64Content,
                    branch: 'main'
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`GitHub API error (${response.status}): ${response.statusText}`, errorData);
                return false;
            }
            
            console.log(`Created GitHub directory: ${path}`);
            return true;
        } catch (error) {
            console.error(`Error creating GitHub directory ${path}:`, error);
            return false;
        }
    }
    
    // Clear stored token from localStorage
    clearStoredToken() {
        try {
            const config = JSON.parse(localStorage.getItem('githubConfig') || '{}');
            delete config.token;
            localStorage.setItem('githubConfig', JSON.stringify(config));
        } catch (e) {
            console.error('Error clearing GitHub token:', e);
        }
    }
}

// Replace the current updateUserUI function with a cleaner version
function updateUserUI(userData) {
    if (userData) {
        // User is logged in
        const { name, isVIP, email } = userData;
        
        // Update header
        $('.auth-links').html(`
            <div class="user-dropdown">
                <span class="user-greeting">שלום, ${name}</span>
                ${isVIP ? '<span class="vip-badge">VIP</span>' : ''}
                <i class="fas fa-chevron-down"></i>
                <div class="user-menu">
                    <div class="user-menu-item">
                        <a href="/profile" class="user-menu-link">
                            <i class="fas fa-user"></i>
                            הפרופיל שלי
                        </a>
                    </div>
                    <div class="user-menu-item">
                        <a href="/orders" class="user-menu-link">
                            <i class="fas fa-box"></i>
                            ההזמנות שלי
                        </a>
                    </div>
                    <div class="user-menu-item">
                        <a href="/wishlist" class="user-menu-link">
                            <i class="fas fa-heart"></i>
                            המועדפים שלי
                        </a>
                    </div>
                    ${isVIP ? `
                    <div class="user-menu-item">
                        <a href="/vip" class="user-menu-link">
                            <i class="fas fa-crown"></i>
                            הטבות VIP
                        </a>
                    </div>
                    ` : ''}
                    <div class="user-menu-item">
                        <a href="#" class="user-menu-link logout-btn">
                            <i class="fas fa-sign-out-alt"></i>
                            התנתקות
                        </a>
                    </div>
                </div>
            </div>
        `);
        
        // Check for admin status
        checkAdminStatus(userData);
    } else {
        // User is logged out
        $('.auth-links').html(`
            <a href="#" class="show-login">התחברות</a>
            <a href="#" class="show-register">הרשמה</a>
        `);
        
        // Update admin status
        isAdmin = false;
        $('#admin-menu-item').hide();
    }
}

// Function to initialize the improved admin system
function initImprovedAdminSystem() {
    console.log('Initializing improved admin system');
    
    // Remove any existing admin panels and related elements
    $('#admin-panel').remove();
    $('#admin-menu-item').remove();
    $('#admin-styles').remove();
    
    // Check for user login and admin status
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const parsedUserData = JSON.parse(userData);
            updateUserUI(parsedUserData);
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
    
    // Replace the ProductManager with the improved version
    if (typeof productManager !== 'undefined' && productManager) {
        console.log('Replacing existing ProductManager with ImprovedProductManager');
        
        // Create new manager with same products
        const products = productManager.getAllProducts();
        window.productManager = new ImprovedProductManager();
        productManager.products = products;
    } else {
        console.log('Creating new ImprovedProductManager instance');
        window.productManager = new ImprovedProductManager();
    }
}

// Initialize the improved admin system when the document is ready
$(document).ready(function() {
    // Call our initialization function after a short delay to ensure other scripts have loaded
    setTimeout(initImprovedAdminSystem, 500);
});