// Admin Email Configuration
const ADMIN_EMAIL = 'liad1111@gmail.com';

// Initialize Slick Carousel for Hero
$(document).ready(function(){
    // Hero Slider
    $('.hero').slick({
        rtl: true,
        dots: true,
        arrows: false,
        infinite: true,
        speed: 500,
        fade: true,
        cssEase: 'linear',
        autoplay: true,
        autoplaySpeed: 5000
    });
    
    // Testimonial Slider
    $('.testimonial-slider').slick({
        rtl: true,
        dots: true,
        arrows: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 6000
    });
    
    // Product Filter Buttons
    $('.filter-btn').on('click', function(){
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        
        // Here would go the actual filtering logic with AJAX
        // For demo purposes, we'll just show a loading effect
        $('.products-grid').fadeOut(300).fadeIn(500);
    });
    
    // Product Image Hover Effect
    $('.product-card').hover(
        function(){
            $(this).find('.product-actions').css('opacity', '1');
        },
        function(){
            $(this).find('.product-actions').css('opacity', '0');
        }
    );
    
    // Add to Cart Button Animation
    $('.add-to-cart').on('click', function(e){
        e.preventDefault();
        
        // Add to cart animation/logic would go here
        $(this).html('<i class="fas fa-check"></i> נוסף לסל');
        setTimeout(() => {
            $(this).html('הוסף לסל');
        }, 2000);
        
        // Update cart count
        let currentCount = parseInt($('.header-icon .badge').eq(1).text());
        $('.header-icon .badge').eq(1).text(currentCount + 1);
    });
    
    // Mobile Menu Toggle
    $('.mobile-menu-btn').on('click', function(){
        $('nav ul').slideToggle();
    });
    
    // Chat Widget Toggle
    $('.chat-button').on('click', function(){
        // In a real implementation, this would open a chat window
        // For this demo, we'll just redirect to WhatsApp
        window.open('https://wa.me/972123456789', '_blank');
    });
    
    // Newsletter Form Submit (prevent default for demo)
    $('.newsletter-form').on('submit', function(e){
        e.preventDefault();
        let email = $('.newsletter-input').val();
        if(email) {
            $(this).html('<p style="color: var(--success-color);">תודה שנרשמתם לניוזלטר שלנו!</p>');
        }
    });
    
    // Category Bubbles Animation
    $('.category-bubble').hover(
        function(){
            $(this).find('.bubble-icon').addClass('animate__animated animate__heartBeat');
        },
        function(){
            $(this).find('.bubble-icon').removeClass('animate__animated animate__heartBeat');
        }
    );
    
    // Category Bubble Click
    $('.category-bubble').on('click', function(){
        const category = $(this).data('category');
        window.location.href = `/category/${category}`;
    });
    
    // Auth System - Show/Hide Modals
    $(document).on('click', '.show-login', function(e){
        e.preventDefault();
        showAuthModal('login');
    });
    
    $(document).on('click', '.show-register', function(e){
        e.preventDefault();
        showAuthModal('register');
    });
    
    $('.close-auth, .auth-modal-bg').on('click', function(){
        hideAuthModal();
    });
    
    // Stop propagation on auth container click
    $('.auth-container').on('click', function(e){
        e.stopPropagation();
    });
    
    // Auth Tabs
    $('.auth-tab').on('click', function(){
        $('.auth-tab').removeClass('active');
        $(this).addClass('active');
        
        const target = $(this).data('target');
        $('.auth-form').removeClass('active');
        $(`#${target}`).addClass('active');
    });
    
    // Login Form Submit
    $('#login-form').on('submit', async function(e){
        e.preventDefault();
        clearAuthErrors();
        
        const email = $('#login-email').val();
        const password = $('#login-password').val();
        
        console.log('Login attempt:', email);
        
        try {
            const supabase = initSupabase();
            if (!supabase) {
                showAuthError('login', 'Unable to connect to authentication service');
                return;
            }
            
            // Show loading state
            $('#login-submit').prop('disabled', true).text('מעבד...');
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            const userData = {
                email: data.user.email,
                name: data.user.user_metadata && data.user.user_metadata.full_name ? data.user.user_metadata.full_name : data.user.email.split('@')[0],
                isVIP: data.user.user_metadata && data.user.user_metadata.isVIP ? data.user.user_metadata.isVIP : false
            };
            
            console.log('Login successful for:', userData.email);
            showNotification('התחברת בהצלחה!', 'success');
            hideAuthModal();
            updateUserUI(userData);
            
            // Save user data to localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Check if user is admin and open admin panel immediately
            if (email === ADMIN_EMAIL) {
                console.log('Admin user detected, opening admin panel...');
                // Ensure admin panel exists in DOM
                addAdminPanelToDOM();
                isAdmin = true;
                $('#admin-menu-item').show();
                
                // Open admin panel immediately
                setTimeout(() => {
                    console.log('Triggering admin panel open...');
                    openAdminPanel();
                }, 300);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showAuthError('login', error.message || 'Failed to login. Please check your credentials.');
        } finally {
            // Reset button state
            $('#login-submit').prop('disabled', false).text('התחברות');
        }
    });
    
    // Register Form Submit
    $('#register-form').on('submit', async function(e) {
        e.preventDefault();
        clearAuthErrors();
        
        const name = $('#register-name').val().trim();
        const email = $('#register-email').val().trim();
        const password = $('#register-password').val();
        const confirmPassword = $('#register-confirm').val();
        
        // Validate form data
        if (!name) {
            showAuthError('register', 'אנא הזן את שמך המלא');
            return;
        }
        
        // Basic email validation
        if (!isValidEmail(email)) {
            showAuthError('register', 'אנא הזן כתובת אימייל תקינה');
            return;
        }
        
        // Password validation
        if (password.length < 6) {
            showAuthError('register', 'הסיסמה חייבת להכיל לפחות 6 תווים');
            return;
        }
        
        if (password !== confirmPassword) {
            showAuthError('register', 'הסיסמאות אינן תואמות');
            return;
        }
        
        try {
            if (!checkNetworkConnection()) {
                showAuthError('register', 'אנא בדוק את חיבור האינטרנט שלך');
                return;
            }
            
            const supabase = initSupabase();
            if (!supabase) {
                showAuthError('register', 'לא ניתן להתחבר לשירות האימות');
                return;
            }
            
            // Show loading state
            $('#register-submit').prop('disabled', true).text('מעבד...');
            
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });
            
            if (error) {
                if (error.message.includes('User already registered')) {
                    throw new Error('כתובת האימייל כבר רשומה במערכת');
                } else if (error.message.includes('invalid')) {
                    throw new Error('כתובת האימייל אינה תקינה או אינה מורשית');
                } else {
                    throw error;
                }
            }
            
            showNotification('ההרשמה בוצעה בהצלחה! בדוק את האימייל שלך לאישור.', 'success');
            hideAuthModal();
            
        } catch (error) {
            console.error('Registration error:', error);
            showAuthError('register', error.message || 'הרשמה נכשלה. אנא נסה שוב מאוחר יותר.');
        } finally {
            // Reset button state
            $('#register-submit').prop('disabled', false).text('הרשם');
        }
    });
    
    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // Basic format validation
        if (!emailRegex.test(email)) {
            return false;
        }
        
        // Validate domain - example of additional checks
        const domain = email.split('@')[1];
        
        // Check for common disposable email domains if needed
        const disposableDomains = ['tempmail.com', 'throwawaymail.com', 'mailinator.com'];
        if (disposableDomains.includes(domain)) {
            return false;
        }
        
        return true;
    }
    
    // Logout Button
    $(document).on('click', '.logout-btn', async function(e){
        e.preventDefault();
        
        try {
            console.log('User logout requested');
            
            // Sign out from Supabase if available
            if (supabase) {
                try {
                    await supabase.auth.signOut();
                    console.log('Successfully signed out from Supabase');
                } catch (err) {
                    console.error('Error signing out from Supabase:', err);
                }
            }
            
            // Clear user data from localStorage
            localStorage.removeItem('user');
            // Also clear admin panel shown flag
            localStorage.removeItem('adminPanelShown');
            
            // Reset admin status
            isAdmin = false;
            
            // Clear user data from UI
            updateUserUI(null);
            
            // Hide admin panel if open
            if ($('#admin-panel').hasClass('active')) {
                closeAdminPanel();
            }
            
            // Show success message
            showNotification('התנתקת בהצלחה', 'success');
            
        } catch (err) {
            console.error('Error during logout:', err);
            showNotification('שגיאה בהתנתקות', 'error');
        }
    });
    
    // Check if user is logged in on page load
    checkUserLogin();
    
    // Initialize Product Detail Page functions if on that page
    if($('.product-details').length) {
        // Thumbnail click event
        $('.thumbnail').on('click', function(){
            $('.thumbnail').removeClass('active');
            $(this).addClass('active');
            
            let imgSrc = $(this).find('img').attr('src');
            $('.main-image img').attr('src', imgSrc);
        });
        
        // Quantity buttons
        $('.quantity-btn.plus').on('click', function(){
            let currentVal = parseInt($('.quantity-number').val());
            $('.quantity-number').val(currentVal + 1);
        });
        
        $('.quantity-btn.minus').on('click', function(){
            let currentVal = parseInt($('.quantity-number').val());
            if(currentVal > 1) {
                $('.quantity-number').val(currentVal - 1);
            }
        });
        
        // Tab switching
        $('.tab-btn').on('click', function(){
            $('.tab-btn').removeClass('active');
            $(this).addClass('active');
            
            let target = $(this).data('target');
            $('.tab-content').removeClass('active');
            $(target).addClass('active');
        });
        
        // Variation options
        $('.variation-option').on('click', function(){
            $(this).parent().find('.variation-option').removeClass('active');
            $(this).addClass('active');
        });
        
        // Color options
        $('.color-option').on('click', function(){
            $('.color-option').removeClass('active');
            $(this).addClass('active');
        });
        
        // Rating select
        $('.rating-select i').on('click', function(){
            let index = $(this).index();
            $('.rating-select i').removeClass('active');
            for(let i = 0; i <= index; i++) {
                $('.rating-select i').eq(i).addClass('active');
            }
        });
    }
    
    // Admin Product Upload System
    if($('.admin-product-form').length) {
        // Image preview
        $('#product-image').on('change', function(){
            const file = this.files[0];
            if(file) {
                let reader = new FileReader();
                reader.onload = function(event){
                    $('#image-preview').attr('src', event.target.result);
                }
                reader.readAsDataURL(file);
            }
        });
        
        // Add variation
        $('#add-variation').on('click', function(e){
            e.preventDefault();
            const variationHTML = `
                <div class="variation-row">
                    <select class="form-control">
                        <option value="color">צבע</option>
                        <option value="size">גודל</option>
                        <option value="material">חומר</option>
                    </select>
                    <input type="text" class="form-control" placeholder="ערך">
                    <input type="number" class="form-control" placeholder="מחיר">
                    <input type="number" class="form-control" placeholder="מלאי">
                    <button class="btn-remove-variation"><i class="fas fa-times"></i></button>
                </div>
            `;
            $('#variations-container').append(variationHTML);
        });
        
        // Remove variation
        $(document).on('click', '.btn-remove-variation', function(){
            $(this).closest('.variation-row').remove();
        });
        
        // Save product
        $('#save-product').on('click', function(e){
            e.preventDefault();
            // Here would go the logic to save the product to the database
            alert('המוצר נשמר בהצלחה!');
        });
    }

    // Initialize Supabase if available, otherwise continue without it
    try {
        initSupabase();
    } catch (err) {
        console.warn('Supabase initialization failed, proceeding without authentication:', err);
    }
});

// Auth Helper Functions
function showAuthModal(type = 'login') {
    console.log('Showing auth modal:', type);
    
    // Check if auth modal exists
    if ($('.auth-modal').length === 0) {
        console.error('Auth modal not found in HTML!');
        // להוסיף את המודל אם חסר
        addAuthModalToDOM();
    }
    
    $('.auth-modal').addClass('active');
    
    // Set active tab
    $('.auth-tab').removeClass('active');
    $(`.auth-tab[data-target="${type}-form"]`).addClass('active');
    
    // Show corresponding form
    $('.auth-form').removeClass('active');
    $(`#${type}-form`).addClass('active');
}

// Add auth modal to DOM if it doesn't exist
function addAuthModalToDOM() {
    const authModalHTML = `
    <div class="auth-modal">
        <div class="auth-modal-bg"></div>
        <div class="auth-container">
            <div class="auth-header">
                <div class="auth-tabs">
                    <div class="auth-tab active" data-target="login-form">התחברות</div>
                    <div class="auth-tab" data-target="register-form">הרשמה</div>
                </div>
                <button class="close-auth"><i class="fas fa-times"></i></button>
            </div>
            <div class="auth-content">
                <form id="login-form" class="auth-form active">
                    <div class="form-group">
                        <label for="login-email">אימייל</label>
                        <input type="email" id="login-email" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">סיסמה</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <div class="form-group checkbox">
                        <input type="checkbox" id="login-remember">
                        <label for="login-remember">זכור אותי</label>
                    </div>
                    <div class="auth-error" id="login-error"></div>
                    <button type="submit" id="login-submit" class="btn btn-primary">התחבר</button>
                    <div class="auth-meta">
                        <a href="#" class="forgot-password">שכחת סיסמה?</a>
                    </div>
                </form>
                <form id="register-form" class="auth-form">
                    <div class="form-group">
                        <label for="register-name">שם מלא</label>
                        <input type="text" id="register-name" required>
                    </div>
                    <div class="form-group">
                        <label for="register-email">אימייל</label>
                        <input type="email" id="register-email" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password">סיסמה</label>
                        <input type="password" id="register-password" required>
                    </div>
                    <div class="form-group">
                        <label for="register-confirm">אימות סיסמה</label>
                        <input type="password" id="register-confirm" required>
                    </div>
                    <div class="auth-error" id="register-error"></div>
                    <button type="submit" id="register-submit" class="btn btn-primary">הרשם</button>
                </form>
            </div>
        </div>
    </div>
    `;
    
    $('body').append(authModalHTML);
    
    // Reattach event handlers
    $('.close-auth, .auth-modal-bg').on('click', function(){
        hideAuthModal();
    });
    
    // Stop propagation on auth container click
    $('.auth-container').on('click', function(e){
        e.stopPropagation();
    });
    
    // Auth Tabs
    $('.auth-tab').on('click', function(){
        $('.auth-tab').removeClass('active');
        $(this).addClass('active');
        
        const target = $(this).data('target');
        $('.auth-form').removeClass('active');
        $(`#${target}`).addClass('active');
    });
}

function hideAuthModal() {
    $('.auth-modal').removeClass('active');
    clearAuthErrors();
}

function showAuthError(formType, message) {
    $(`#${formType}-error`).text(message).fadeIn();
}

function clearAuthErrors() {
    $('.auth-error').hide().text('');
}

function checkUserLogin() {
    const userData = localStorage.getItem('user');
    if(userData) {
        const parsedUserData = JSON.parse(userData);
        updateUserUI(parsedUserData);
        
        // Also check if user is admin based on localStorage data
        if(parsedUserData.email === ADMIN_EMAIL) {
            console.log('Admin user detected from localStorage');
            isAdmin = true;
            $('#admin-menu-item').show();
            
            // If admin menu item doesn't exist, add it
            addAdminPanelToDOM();
            addAdminMenuItemToNav();
            
            // Auto-open panel for admin users:
            setTimeout(() => {
                console.log('Auto-opening admin panel for admin user from localStorage');
                openAdminPanel();
            }, 500);
        }
    }
}

// Override updateUserUI function to include admin check
const originalUpdateUserUI = updateUserUI;
updateUserUI = function(userData) {
    // Call the original function
    originalUpdateUserUI(userData);
    
    // Check if user is admin
    if (userData && userData.email === ADMIN_EMAIL) {
        isAdmin = true;
        
        // Make sure admin panel elements exist in DOM
        addAdminPanelToDOM();
        addAdminStyles();
        addAdminMenuItemToNav();
        
        // Show admin menu item
        $('#admin-menu-item').show();
        
        // If this is first login as admin, show admin panel automatically
        if (localStorage.getItem('adminPanelShown') !== 'true') {
            openAdminPanel();
            localStorage.setItem('adminPanelShown', 'true');
        }
    } else {
        isAdmin = false;
        $('#admin-menu-item').hide();
    }
};

function updateUserUI(userData) {
    if(userData) {
        // User is logged in
        const { name, isVIP } = userData;
        
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
    } else {
        // User is logged out
        $('.auth-links').html(`
            <a href="#" class="show-login">התחברות</a>
            <a href="#" class="show-register">הרשמה</a>
        `);
    }
}

function showNotification(message, type = 'info') {
    const icon = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    }[type];
    
    const $notification = $(`
        <div class="notification ${type}">
            <i class="${icon}"></i>
            <p>${message}</p>
        </div>
    `);
    
    $('body').append($notification);
    
    setTimeout(() => {
        $notification.addClass('show');
    }, 10);
    
    setTimeout(() => {
        $notification.removeClass('show');
        setTimeout(() => {
            $notification.remove();
        }, 300);
    }, 3000);
}

// Product upload system functions
class ProductManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.tags = [];
        this.githubUser = null;
        this.githubRepo = null;
        this.githubToken = null;
        this.initGitHubConfig();
    }
    
    // Initialize GitHub configuration
    initGitHubConfig() {
        // Default GitHub config - should be set to your actual GitHub username and repo
        this.githubUser = "LiadPataou166"; 
        this.githubRepo = "extraction166"; 
        
        // Try to get from localStorage if available (for development purposes)
        const storedConfig = localStorage.getItem('githubConfig');
        if (storedConfig) {
            try {
                const config = JSON.parse(storedConfig);
                this.githubUser = config.user || this.githubUser;
                this.githubRepo = config.repo || this.githubRepo;
                
                // If token is stored, use it (for convenience during development)
                this.githubToken = config.token || null;
            } catch (e) {
                console.error('Error parsing GitHub config:', e);
            }
        }
        
        console.log(`GitHub config: ${this.githubUser}/${this.githubRepo}`);
    }
    
    // Ask for GitHub token if not already stored
    async ensureGitHubToken() {
        if (!this.githubToken) {
            const token = prompt("הכנס GitHub Personal Access Token עם הרשאות 'repo'. (הערה: אם אתה משתמש בדף זה לעתים קרובות, התוקן יישמר בינתיים להקלת השימוש)", "");
            if (token) {
                this.githubToken = token;
                
                // Save token to localStorage for convenience (with warning)
                const saveToken = confirm("האם ברצונך לשמור את הטוקן לשימוש עתידי? (אזהרה: לא מומלץ בסביבות ציבוריות)");
                if (saveToken) {
                    try {
                        const config = JSON.parse(localStorage.getItem('githubConfig') || '{}');
                        config.token = token;
                        localStorage.setItem('githubConfig', JSON.stringify(config));
                    } catch (e) {
                        console.error('Error saving GitHub token:', e);
                    }
                }
                
                return true;
            }
            return false;
        }
        return true;
    }
    
    // Add new product
    async addProduct(product) {
        // Generate unique ID
        product.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        console.log('Adding product with ID:', product.id);
        this.products.push(product);
        
        // Save to GitHub
        const success = await this.saveProductsToGitHub();
        if (success) {
            showNotification('המוצר נשמר בהצלחה לשרת!', 'success');
            
            // Update products display on homepage
            console.log('Calling displayProductsOnHomepage after adding product');
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                if (typeof displayProductsOnHomepage === 'function') {
                    displayProductsOnHomepage();
                } else {
                    console.warn('displayProductsOnHomepage function not found');
                }
            } else {
                console.log('Not on homepage, skipping displayProductsOnHomepage call');
            }
            
            return product.id;
        } else {
            showNotification('שגיאה בשמירת המוצר', 'error');
            return null;
        }
    }
    
    // Update existing product
    async updateProduct(productId, updatedData) {
        const index = this.products.findIndex(p => p.id === productId);
        if(index !== -1) {
            this.products[index] = { ...this.products[index], ...updatedData };
            
            // Save to GitHub
            const success = await this.saveProductsToGitHub();
            if (success) {
                showNotification('המוצר עודכן בהצלחה!', 'success');
                return true;
            } else {
                showNotification('שגיאה בעדכון המוצר', 'error');
                return false;
            }
        }
        return false;
    }
    
    // Delete product
    async deleteProduct(productId) {
        console.log('Deleting product with ID:', productId);
        this.products = this.products.filter(p => p.id !== productId);
        
        // Save to GitHub
        const success = await this.saveProductsToGitHub();
        if (success) {
            showNotification('המוצר נמחק בהצלחה!', 'success');
            return true;
        } else {
            showNotification('שגיאה במחיקת המוצר', 'error');
            return false;
        }
    }
    
    // Get product by ID
    getProduct(productId) {
        return this.products.find(p => p.id === productId);
    }
    
    // Get all products
    getAllProducts() {
        console.log('Getting all products, count:', this.products.length);
        return this.products;
    }
    
    // Load products from GitHub
    async loadProductsFromGitHub() {
        try {
            console.log('Loading products from GitHub...');
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/data/products.json`;
            
            // Show loading notification
            showNotification('טוען מוצרים מהשרת...', 'info');
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.warn(`GitHub API error (${response.status}): ${response.statusText}`);
                if (response.status === 404) {
                    // File doesn't exist, so create it
                    console.log('Creating products.json file on GitHub...');
                    const created = await this.saveProductsToGitHub();
                    if (created) {
                        showNotification('קובץ מוצרים חדש נוצר בהצלחה!', 'success');
                        
                        // Update the display if we're on the homepage
                        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                            if (typeof displayProductsOnHomepage === 'function') {
                                displayProductsOnHomepage();
                            }
                        }
                        
                        return true;
                    } else {
                        showNotification('שגיאה ביצירת קובץ מוצרים', 'error');
                        return false;
                    }
                }
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const data = await response.json();
            // GitHub returns base64 encoded content - decode it properly for UTF-8
            const content = this.base64ToUtf8(data.content);
            this.products = JSON.parse(content);
            console.log('Loaded products from GitHub, count:', this.products.length);
            
            // Save to localStorage for backup
            localStorage.setItem('products', JSON.stringify(this.products));
            
            showNotification('מוצרים נטענו בהצלחה!', 'success');
            
            // Update the display if we're on the homepage
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                if (typeof displayProductsOnHomepage === 'function') {
                    displayProductsOnHomepage();
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error loading products from GitHub:', error);
            
            // Try to load from localStorage as fallback
            const localData = localStorage.getItem('products');
            if (localData) {
                try {
                    this.products = JSON.parse(localData);
                    console.log(`Loaded ${this.products.length} products from localStorage fallback`);
                    showNotification('מוצרים נטענו מהגיבוי המקומי', 'warning');
                    
                    // Update the display if we're on the homepage
                    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                        if (typeof displayProductsOnHomepage === 'function') {
                            displayProductsOnHomepage();
                        }
                    }
                } catch (e) {
                    console.error('Error parsing products from localStorage:', e);
                    showNotification('שגיאה בטעינת מוצרים', 'error');
                }
            } else {
                showNotification('שגיאה בטעינת מוצרים מהשרת', 'error');
            }
            
            return false;
        }
    }

    // Check if a path exists in GitHub repository
    async checkGitHubPath(path) {
        try {
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/${path}`;
            const response = await fetch(apiUrl);
            return response.ok;
        } catch (error) {
            console.error(`Error checking GitHub path ${path}:`, error);
            return false;
        }
    }

    // Create a file in GitHub repository
    async createGitHubFile(path, content, message, token) {
        try {
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/${path}`;
            
            // Convert content to base64
            const base64Content = btoa(content);
            
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
            
            console.log(`Created GitHub file: ${path}`);
            return true;
        } catch (error) {
            console.error(`Error creating GitHub file ${path}:`, error);
            return false;
        }
    }
}

// Function to display products on homepage
function displayProductsOnHomepage() {
    try {
        console.log('Displaying products on homepage');
        const products = productManager.getAllProducts();
        console.log('Products to display:', products.length, products);
        
        // Find the products grid on homepage
        const $productsGrid = $('.products-grid');
        
        if ($productsGrid.length === 0) {
            console.warn('Products grid not found on homepage');
            return;
        }
        
        if (!products || products.length === 0) {
            console.warn('No products to display');
            $productsGrid.html(`<div class="empty-products">אין מוצרים להצגה</div>`);
            return;
        }
        
        let productsHTML = '';
        
        // Generate HTML for each product
        products.forEach(product => {
            console.log('Generating HTML for product:', product.name);
            const isOnSale = product.oldPrice && product.oldPrice > product.price;
            const salePercentage = isOnSale ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
            const badge = product.badge || (isOnSale ? 'sale' : '');
            
            productsHTML += `
                <div class="product-card" data-id="${product.id}">
                    <div class="product-image">
                        <img src="${product.image || 'https://via.placeholder.com/300x300?text=' + encodeURIComponent(product.name)}" alt="${product.name}">
                        ${badge ? `<div class="product-badge ${badge}">${getBadgeText(badge)}</div>` : ''}
                        <div class="product-actions">
                            <button class="quick-view-btn"><i class="fas fa-eye"></i></button>
                            <button class="wishlist-btn"><i class="far fa-heart"></i></button>
                        </div>
                    </div>
                    <div class="product-info">
                        <div class="product-category">${product.category || 'כללי'}</div>
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-rating">
                            ${getRatingStars(product.rating || 0)}
                            <span class="rating-count">(${product.ratingCount || 0})</span>
                        </div>
                        <div class="product-price ${isOnSale ? 'sale' : ''}">
                            ${isOnSale ? `<span class="old-price">₪${product.oldPrice.toFixed(2)}</span>` : ''}
                            <span class="current-price">₪${product.price.toFixed(2)}</span>
                            ${isOnSale ? `<span class="discount-badge">-${salePercentage}%</span>` : ''}
                        </div>
                        <button class="add-to-cart" data-id="${product.id}">הוסף לסל</button>
                    </div>
                </div>
            `;
        });
        
        // Update the products grid
        console.log('Updating products grid with HTML');
        $productsGrid.html(productsHTML);
        
        // Reinitialize product card event handlers
        console.log('Initializing product cards');
        initializeProductCards();
        
        console.log('Products displayed successfully');
    } catch (error) {
        console.error('Error displaying products on homepage:', error);
    }
}

// Supabase configuration
const SUPABASE_URL = 'https://ebkgbaetsgtzordvkcvf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia2diYWV0c2d0em9yZHZrY3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMjAzMTMsImV4cCI6MjA1NzY5NjMxM30.fype9g6RIKCYHJvXJN8b_kFFnkehACo3inpXa382GgI';
let supabase;

// Initialize Supabase client
function initSupabase() {
    console.log('מנסה להתחבר ל-Supabase...');
    
    try {
        // Check if Supabase is available (loaded through CDN)
        if (typeof window.supabase !== 'undefined') {
            // Create client using the Supabase library
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            supabase = client; // Set the global variable
            console.log('התחברות ל-Supabase בוצעה בהצלחה');
            return client;
        } else {
            console.warn('ספריית Supabase לא נטענה. בדוק שקובץ ה-CDN נטען כראוי');
            showNotification('שגיאה בהתחברות למסד הנתונים', 'error');
            return null;
        }
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        showNotification('שגיאה בהתחברות למסד הנתונים', 'error');
        return null;
    }
}

// Add admin panel to DOM if it doesn't exist
function addAdminPanelToDOM() {
    // Check if admin panel already exists
    if ($('#admin-panel').length > 0) {
        console.log('Admin panel already exists in DOM');
        return;
    }
    
    console.log('Adding admin panel to DOM');
    
    const adminPanelHTML = `
    <div id="admin-panel" class="admin-panel">
        <div class="admin-panel-bg"></div>
        <div class="admin-container">
            <div class="admin-header">
                <h2>פאנל ניהול</h2>
                <button class="close-admin-panel"><i class="fas fa-times"></i></button>
            </div>
            <div class="admin-sidebar">
                <div class="admin-menu-item active" data-target="dashboard-tab">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>לוח בקרה</span>
                </div>
                <div class="admin-menu-item" data-target="products-tab">
                    <i class="fas fa-box"></i>
                    <span>מוצרים</span>
                </div>
                <div class="admin-menu-item" data-target="categories-tab">
                    <i class="fas fa-tags"></i>
                    <span>קטגוריות</span>
                </div>
                <div class="admin-menu-item" data-target="orders-tab">
                    <i class="fas fa-shopping-cart"></i>
                    <span>הזמנות</span>
                </div>
                <div class="admin-menu-item" data-target="users-tab">
                    <i class="fas fa-users"></i>
                    <span>משתמשים</span>
                </div>
                <div class="admin-menu-item" data-target="settings-tab">
                    <i class="fas fa-cog"></i>
                    <span>הגדרות</span>
                </div>
            </div>
            <div class="admin-content">
                <!-- Dashboard Tab -->
                <div id="dashboard-tab" class="admin-tab active">
                    <h3>ברוך הבא לפאנל הניהול</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-box"></i></div>
                            <div class="stat-value">0</div>
                            <div class="stat-label">מוצרים</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-shopping-cart"></i></div>
                            <div class="stat-value">0</div>
                            <div class="stat-label">הזמנות</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-users"></i></div>
                            <div class="stat-value">0</div>
                            <div class="stat-label">משתמשים</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-shekel-sign"></i></div>
                            <div class="stat-value">₪0</div>
                            <div class="stat-label">הכנסות</div>
                        </div>
                    </div>
                </div>
                
                <!-- Products Tab -->
                <div id="products-tab" class="admin-tab">
                    <div class="admin-controls">
                        <h3>ניהול מוצרים</h3>
                        <button id="add-product-btn" class="admin-btn">הוסף מוצר חדש</button>
                    </div>
                    <div class="admin-table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>תמונה</th>
                                    <th>שם</th>
                                    <th>קטגוריה</th>
                                    <th>מחיר</th>
                                    <th>מלאי</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody id="product-list-body">
                                <!-- Products will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Categories Tab -->
                <div id="categories-tab" class="admin-tab">
                    <div class="admin-controls">
                        <h3>ניהול קטגוריות</h3>
                        <button id="add-category-btn" class="admin-btn">הוסף קטגוריה חדשה</button>
                    </div>
                    <div class="admin-table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>שם קטגוריה</th>
                                    <th>מספר מוצרים</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody id="category-list-body">
                                <!-- Categories will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Orders Tab -->
                <div id="orders-tab" class="admin-tab">
                    <div class="admin-controls">
                        <h3>ניהול הזמנות</h3>
                    </div>
                    <div class="admin-table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>מספר הזמנה</th>
                                    <th>לקוח</th>
                                    <th>תאריך</th>
                                    <th>סכום</th>
                                    <th>סטטוס</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody id="order-list-body">
                                <!-- Orders will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Users Tab -->
                <div id="users-tab" class="admin-tab">
                    <div class="admin-controls">
                        <h3>ניהול משתמשים</h3>
                    </div>
                    <div class="admin-table-container">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>שם</th>
                                    <th>אימייל</th>
                                    <th>סוג</th>
                                    <th>תאריך הצטרפות</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody id="user-list-body">
                                <!-- Users will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Settings Tab -->
                <div id="settings-tab" class="admin-tab">
                    <div class="admin-controls">
                        <h3>הגדרות אתר</h3>
                    </div>
                    <form id="site-settings-form" class="settings-form">
                        <div class="form-group">
                            <label for="site-title">כותרת האתר</label>
                            <input type="text" id="site-title" class="form-control" value="Liad Store">
                        </div>
                        <div class="form-group">
                            <label for="site-description">תיאור האתר</label>
                            <textarea id="site-description" class="form-control" rows="3">חנות מקוונת עם מגוון מוצרים</textarea>
                        </div>
                        <div class="form-group">
                            <label for="github-user">שם משתמש GitHub</label>
                            <input type="text" id="github-user" class="form-control" value="LiadPataou166">
                        </div>
                        <div class="form-group">
                            <label for="github-repo">שם מאגר GitHub</label>
                            <input type="text" id="github-repo" class="form-control" value="extraction166">
                        </div>
                        <button type="submit" class="btn btn-primary">שמור הגדרות</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Add Product Modal -->
    <div id="add-product-modal" class="admin-modal">
        <div class="admin-modal-bg"></div>
        <div class="admin-modal-container">
            <div class="admin-modal-header">
                <h3>הוסף מוצר חדש</h3>
                <button class="close-admin-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="admin-modal-content">
                <form id="add-product-form">
                    <div class="form-group">
                        <label for="product-name">שם המוצר</label>
                        <input type="text" id="product-name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="product-category">קטגוריה</label>
                        <select id="product-category" class="form-control" required>
                            <option value="">בחר קטגוריה</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="product-price">מחיר</label>
                        <input type="number" id="product-price" class="form-control" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="product-old-price">מחיר ישן (אופציונלי)</label>
                        <input type="number" id="product-old-price" class="form-control" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="product-stock">מלאי</label>
                        <input type="number" id="product-stock" class="form-control" value="1" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="product-badge">תג (אופציונלי)</label>
                        <select id="product-badge" class="form-control">
                            <option value="">ללא תג</option>
                            <option value="new">חדש</option>
                            <option value="sale">מבצע</option>
                            <option value="hot">חם</option>
                            <option value="vip">VIP</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="product-description">תיאור המוצר</label>
                        <textarea id="product-description" class="form-control" rows="4"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">שמור מוצר</button>
                </form>
            </div>
        </div>
    </div>
    
    <!-- Add Category Modal -->
    <div id="add-category-modal" class="admin-modal">
        <div class="admin-modal-bg"></div>
        <div class="admin-modal-container">
            <div class="admin-modal-header">
                <h3>הוסף קטגוריה חדשה</h3>
                <button class="close-admin-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="admin-modal-content">
                <form id="add-category-form">
                    <div class="form-group">
                        <label for="category-name">שם הקטגוריה</label>
                        <input type="text" id="category-name" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary">שמור קטגוריה</button>
                </form>
            </div>
        </div>
    </div>
    `;
    
    $('body').append(adminPanelHTML);
    
    // Add event handlers for admin panel
    $(document).on('click', '.admin-menu-item', function() {
        $('.admin-menu-item').removeClass('active');
        $(this).addClass('active');
        
        const targetTab = $(this).data('target');
        $('.admin-tab').removeClass('active');
        $(`#${targetTab}`).addClass('active');
    });
    
    $(document).on('click', '.close-admin-panel, .admin-panel-bg', function() {
        closeAdminPanel();
    });
    
    $(document).on('click', '.close-admin-modal, .admin-modal-bg', function() {
        $('.admin-modal').removeClass('active');
    });
    
    $(document).on('click', '#add-product-btn', function() {
        $('#add-product-modal').addClass('active');
        updateCategoryDropdown();
    });
    
    $(document).on('click', '#add-category-btn', function() {
        $('#add-category-modal').addClass('active');
    });
    
    // Handle add category form submission
    $(document).on('submit', '#add-category-form', async function(e) {
        e.preventDefault();
        
        const categoryName = $('#category-name').val();
        if (!categoryName) {
            showNotification('יש להזין שם קטגוריה', 'error');
            return;
        }
        
        // Add category through product manager
        const success = await productManager.addCategory(categoryName);
        if (success) {
            // Close modal
            $('#add-category-modal').removeClass('active');
            
            // Reset form
            $('#category-name').val('');
            
            // Refresh category list
            loadCategoriesData();
            
            // Update category dropdown in add product form
            updateCategoryDropdown();
            
            showNotification('הקטגוריה נוספה בהצלחה!', 'success');
        }
    });
    
    // Handle add product form submission
    $(document).on('submit', '#add-product-form', async function(e) {
        e.preventDefault();
        
        // Get form data
        const productName = $('#product-name').val();
        const productCategory = $('#product-category').val();
        const productPrice = parseFloat($('#product-price').val());
        const productOldPrice = parseFloat($('#product-old-price').val()) || null;
        const productStock = parseInt($('#product-stock').val());
        const productBadge = $('#product-badge').val() || null;
        const productDescription = $('#product-description').val();
        
        // Validate form data
        if (!productName || !productCategory || isNaN(productPrice) || isNaN(productStock)) {
            showNotification('אנא מלא את כל השדות הנדרשים', 'error');
            return;
        }
        
        // Show loading state
        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true).text('שומר מוצר...');
        
        try {
            // Create product object
            const newProduct = {
                name: productName,
                category: productCategory,
                price: productPrice,
                oldPrice: productOldPrice,
                stock: productStock,
                badge: productBadge,
                description: productDescription,
                image: 'https://via.placeholder.com/300x300?text=' + encodeURIComponent(productName),
                createdAt: new Date().toISOString()
            };
            
            // Add product through the product manager
            const productId = await productManager.addProduct(newProduct);
            
            if (productId) {
                // Close modal
                $('#add-product-modal').removeClass('active');
                
                // Reset form
                $('#add-product-form')[0].reset();
                
                // Refresh product list
                loadProductsData();
                
                // Update homepage products display
                if (typeof displayProductsOnHomepage === 'function') {
                    displayProductsOnHomepage();
                }
                
                showNotification('המוצר נוסף בהצלחה!', 'success');
            }
        } catch (error) {
            console.error('Error adding product:', error);
            showNotification('שגיאה בהוספת המוצר', 'error');
        } finally {
            // Reset button state
            $submitBtn.prop('disabled', false).text('שמור מוצר');
        }
    });
}

// Add admin styles to DOM
function addAdminStyles() {
    if ($('#admin-styles').length) {
        return; // Styles already added
    }
    
    const styles = `
    <style id="admin-styles">
        .admin-panel {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            display: none;
            font-family: var(--body-font);
        }
        
        .admin-panel.active {
            display: block;
        }
        
        .admin-panel-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
        }
        
        .admin-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            height: 90%;
            max-width: 1400px;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            background-color: var(--primary-color);
            color: white;
        }
        
        .admin-header h2 {
            margin: 0;
            font-size: 20px;
        }
        
        .close-admin-panel {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        }
        
        .admin-content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        
        .admin-sidebar {
            width: 200px;
            background-color: #f5f5f5;
            padding: 16px 0;
            border-right: 1px solid #ddd;
        }
        
        .admin-menu-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .admin-menu-item:hover {
            background-color: #e9e9e9;
        }
        
        .admin-menu-item.active {
            background-color: #e3f2fd;
            color: var(--primary-color);
            font-weight: bold;
        }
        
        .admin-menu-item i {
            margin-left: 12px;
            width: 20px;
            text-align: center;
        }
        
        .admin-tab {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            display: none;
        }
        
        .admin-tab.active {
            display: block;
        }
        
        .admin-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        
        .admin-btn {
            padding: 10px 16px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .admin-table-container {
            overflow-x: auto;
        }
        
        .admin-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .admin-table th, .admin-table td {
            padding: 12px 16px;
            text-align: right;
            border-bottom: 1px solid #ddd;
        }
        
        .admin-table th {
            background-color: #f9f9f9;
            font-weight: bold;
        }
        
        .action-btn {
            background: none;
            border: none;
            color: var(--primary-color);
            margin-right: 8px;
            cursor: pointer;
        }
        
        .action-btn.edit-btn:hover {
            color: var(--success-color);
        }
        
        .action-btn.delete-btn:hover {
            color: var(--danger-color);
        }
        
        .action-btn.view-btn:hover {
            color: var(--success-color);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 24px;
        }
        
        .stat-card {
            padding: 24px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .stat-icon {
            font-size: 36px;
            color: var(--primary-color);
            margin-bottom: 16px;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .stat-label {
            color: #666;
        }
        
        .admin-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: none;
        }
        
        .admin-modal.active {
            display: block;
        }
        
        .admin-modal-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
        }
        
        .admin-modal-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 600px;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .admin-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            background-color: var(--primary-color);
            color: white;
        }
        
        .admin-modal-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        .close-admin-modal {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        }
        
        .admin-modal-content {
            padding: 24px;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
        }
        
        .form-control {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: inherit;
        }
        
        textarea.form-control {
            resize: vertical;
        }
        
        .settings-form .form-group {
            margin-bottom: 20px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .status-badge.completed {
            background-color: #d4edda;
            color: #155724;
        }
        
        .status-badge.pending {
            background-color: #fff3cd;
            color: #856404;
        }
        
        .status-badge.cancelled {
            background-color: #f8d7da;
            color: #721c24;
        }
        
        /* Admin menu in main navigation */
        #admin-menu-item {
            display: none;
        }
    </style>
    `;
    
    $('head').append(styles);
}

// Add admin menu item to main navigation
function addAdminMenuItemToNav() {
    // Check if admin menu item already exists
    if ($('#admin-menu-item').length > 0) {
        return;
    }
    
    // Find the main navigation menu
    const $navMenu = $('.main-menu');
    if ($navMenu.length > 0) {
        // Create admin menu item
        const $adminMenuItem = $('<li id="admin-menu-item" style="display: none;"><a href="#"><i class="fas fa-cog"></i> פאנל ניהול</a></li>');
        
        // Add to menu
        $navMenu.append($adminMenuItem);
        
        // Add click event
        $adminMenuItem.on('click', function(e) {
            e.preventDefault();
            openAdminPanel();
        });
    } else {
        console.warn('Navigation menu not found, cannot add admin menu item');
    }
}

// Function to open admin panel
function openAdminPanel() {
    console.log('Opening admin panel...');
    $('#admin-panel').addClass('active');
    loadAdminPanelData();
    
    // Update category dropdown in add product form
    setTimeout(() => {
        updateCategoryDropdown();
    }, 300);
}

// Function to close admin panel
function closeAdminPanel() {
    $('#admin-panel').removeClass('active');
}

// Function to load data for admin panel
async function loadAdminPanelData() {
    try {
        // Show loading indicator
        $('#admin-panel .admin-content').append('<div id="admin-loading" class="admin-loading"><div class="spinner"></div><div>טוען נתונים...</div></div>');
        
        // Load products data
        await loadProductsData();
        
        // Load categories data
        await loadCategoriesData();
        
        // Load users data
        await loadUsersData();
        
        // Load orders data
        await loadOrdersData();
        
        // Hide loading indicator
        $('#admin-loading').remove();
    } catch (error) {
        console.error('Error loading admin data:', error);
        showNotification('שגיאה בטעינת נתוני הניהול', 'error');
        $('#admin-loading').remove();
    }
}

// Function to load products data
async function loadProductsData() {
    try {
        // Get real products from product manager
        const products = productManager.getAllProducts();
        const productListBody = $('#product-list-body');
        
        console.log('Loading products:', products);
        
        if (products.length === 0) {
            productListBody.html(`
                <tr>
                    <td colspan="6" class="text-center">אין מוצרים להצגה</td>
                </tr>
            `);
            return;
        }
        
        let productsHTML = '';
        
        // Use placeholder.com for placeholder images
        const placeholderImage = 'https://via.placeholder.com/50?text=Image';
        
        products.forEach(product => {
            productsHTML += `
                <tr>
                    <td><img src="${product.image || placeholderImage}" alt="${product.name}" width="50" height="50"></td>
                    <td>${product.name}</td>
                    <td>${product.category || 'ללא קטגוריה'}</td>
                    <td>₪${product.price}</td>
                    <td>${product.stock || 0}</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" data-id="${product.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        productListBody.html(productsHTML);
    } catch (error) {
        console.error('Error loading products data:', error);
        showNotification('שגיאה בטעינת נתוני המוצרים', 'error');
    }
}

// Function to load categories data
async function loadCategoriesData() {
    try {
        // Get real categories from product manager
        const categories = productManager.getAllCategories();
        const categoryListBody = $('#category-list-body');
        
        if (categories.length === 0) {
            categoryListBody.html(`
                <tr>
                    <td colspan="3" class="text-center">אין קטגוריות להצגה</td>
                </tr>
            `);
            return;
        }
        
        let categoriesHTML = '';
        
        categories.forEach((category, index) => {
            // Count products in this category
            const productsInCategory = productManager.filterProducts({ category: category }).length;
            
            categoriesHTML += `
                <tr>
                    <td>${category}</td>
                    <td>${productsInCategory}</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${index}"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" data-id="${index}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        categoryListBody.html(categoriesHTML);
    } catch (error) {
        console.error('Error loading categories data:', error);
        showNotification('שגיאה בטעינת נתוני הקטגוריות', 'error');
    }
}

// Function to load users data
async function loadUsersData() {
    try {
        // For demo, we'll just show the admin user
        const userListBody = $('#user-list-body');
        
        const userHTML = `
            <tr>
                <td>מנהל</td>
                <td>${ADMIN_EMAIL}</td>
                <td>מנהל</td>
                <td>${new Date().toLocaleDateString('he-IL')}</td>
                <td>
                    <button class="action-btn view-btn" data-id="admin"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `;
        
        userListBody.html(userHTML);
    } catch (error) {
        console.error('Error loading users data:', error);
        showNotification('שגיאה בטעינת נתוני המשתמשים', 'error');
    }
}

// Function to load orders data
async function loadOrdersData() {
    try {
        // For demo, show placeholder data
        const orderListBody = $('#order-list-body');
        
        orderListBody.html(`
            <tr>
                <td colspan="6" class="text-center">אין הזמנות להצגה</td>
            </tr>
        `);
    } catch (error) {
        console.error('Error loading orders data:', error);
        showNotification('שגיאה בטעינת נתוני ההזמנות', 'error');
    }
}

// Function to update category dropdown in the add product form
function updateCategoryDropdown() {
    try {
        console.log('Updating category dropdown');
        const categories = productManager.getAllCategories();
        const categorySelect = $('#product-category');
        
        // Clear current options (keep the default option)
        categorySelect.find('option:not(:first)').remove();
        
        // Add categories as options
        categories.forEach((category, index) => {
            categorySelect.append(`<option value="${category}">${category}</option>`);
        });
    } catch (error) {
        console.error('Error updating category dropdown:', error);
    }
}

// Helper function to get status class
function getStatusClass(status) {
    switch(status) {
        case 'הושלם':
            return 'completed';
        case 'בטיפול':
            return 'pending';
        case 'בוטל':
            return 'cancelled';
        default:
            return 'pending';
    }
}

// Get badge text based on badge type
function getBadgeText(badge) {
    switch (badge) {
        case 'new':
            return 'חדש';
        case 'sale':
            return 'מבצע';
        case 'hot':
            return 'חם';
        case 'vip':
            return 'VIP';
        default:
            return badge;
    }
}

// Get rating stars HTML
function getRatingStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Add half star if needed
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}
