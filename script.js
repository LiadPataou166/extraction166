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

    // Save products to GitHub
    async saveProductsToGitHub() {
        try {
            console.log('Saving products to GitHub, count:', this.products.length);
            
            // First, try to get existing file to get its SHA
            let sha = null;
            try {
                const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/data/products.json`;
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    sha = data.sha;
                }
            } catch (error) {
                console.log('No existing products.json file found, will create new one');
            }
            
            // Ensure we have a GitHub token
            const hasToken = await this.ensureGitHubToken();
            if (!hasToken) {
                console.warn('No GitHub token provided, cannot save to GitHub');
                showNotification('נדרש GitHub Token לשמירת נתונים', 'warning');
                return false;
            }
            
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/data/products.json`;
            
            // UTF-8 safe base64 encoding (for Hebrew and other non-Latin1 characters)
            const jsonString = JSON.stringify(this.products, null, 2);
            const content = this.utf8ToBase64(jsonString);
            
            const body = {
                message: "Update products data",
                content: content,
                branch: "main"
            };
            
            if (sha) {
                body.sha = sha;
            }
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                console.error(`GitHub API error (${response.status}): ${response.statusText}`);
                const errorData = await response.json();
                console.error('Error details:', errorData);
                
                if (response.status === 401) {
                    // Token is invalid, clear it and try again
                    showNotification('GitHub Token לא תקין. אנא הכנס מחדש.', 'error');
                    this.githubToken = null;
                    localStorage.removeItem('githubToken');
                }
                
                return false;
            }
            
            console.log('Products saved to GitHub successfully');
            return true;
        } catch (error) {
            console.error('Error saving products to GitHub:', error);
            showNotification('שגיאה בשמירת מוצרים לשרת', 'error');
            return false;
        }
    }

    // Helper method to convert UTF-8 string to base64
    utf8ToBase64(str) {
        try {
            // First encode the string as UTF-8
            const utf8Encoder = new TextEncoder();
            const utf8Bytes = utf8Encoder.encode(str);
            
            // Convert UTF-8 bytes to base64 using a chunked approach
            // to avoid "Maximum call stack size exceeded" errors
            let binary = '';
            const bytes = new Uint8Array(utf8Bytes);
            const chunkSize = 1024;
            
            for (let i = 0; i < bytes.byteLength; i += chunkSize) {
                const chunk = bytes.slice(i, i + chunkSize);
                binary += String.fromCharCode.apply(null, chunk);
            }
            
            return btoa(binary);
        } catch (error) {
            console.error('Error in utf8ToBase64:', error);
            
            // Fallback method for very large strings
            try {
                // This is a more memory-intensive but safer approach
                let result = '';
                // Re-encode to make sure we have the encoder in scope
                const fallbackEncoder = new TextEncoder();
                const bytes = new Uint8Array(fallbackEncoder.encode(str));
                
                for (let i = 0; i < bytes.length; i++) {
                    result += String.fromCharCode(bytes[i]);
                }
                
                return btoa(result);
            } catch (fallbackError) {
                console.error('Fallback encoding also failed:', fallbackError);
                throw new Error('Failed to encode UTF-8 string to base64');
            }
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
    
    // Admin panel HTML
    const adminPanelHTML = `
        <div id="admin-panel">
            <div class="admin-panel-bg"></div>
            <div class="admin-container">
                <div class="admin-header">
                    <h2>פאנל ניהול</h2>
                    <button class="close-admin-panel"><i class="fas fa-times"></i></button>
                </div>
                <div class="admin-menu">
                    <div class="admin-menu-item active" data-target="products-tab">מוצרים</div>
                    <div class="admin-menu-item" data-target="categories-tab">קטגוריות</div>
                    <div class="admin-menu-item" data-target="users-tab">משתמשים</div>
                    <div class="admin-menu-item" data-target="orders-tab">הזמנות</div>
                    <div class="admin-menu-item" data-target="settings-tab">הגדרות</div>
                </div>
                <div class="admin-content">
                    <div id="products-tab" class="admin-tab active">
                        <div class="admin-tab-header">
                            <h3>ניהול מוצרים</h3>
                            <button id="add-product-btn" class="admin-btn">הוסף מוצר חדש</button>
                        </div>
                        <div class="admin-tab-content">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>תמונה</th>
                                        <th>שם מוצר</th>
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
                    
                    <div id="categories-tab" class="admin-tab">
                        <div class="admin-tab-header">
                            <h3>ניהול קטגוריות</h3>
                            <button id="add-category-btn" class="admin-btn">הוסף קטגוריה חדשה</button>
                        </div>
                        <div class="admin-tab-content">
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
                    
                    <div id="users-tab" class="admin-tab">
                        <div class="admin-tab-header">
                            <h3>ניהול משתמשים</h3>
                        </div>
                        <div class="admin-tab-content">
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
                    
                    <div id="orders-tab" class="admin-tab">
                        <div class="admin-tab-header">
                            <h3>ניהול הזמנות</h3>
                        </div>
                        <div class="admin-tab-content">
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
                    
                    <div id="settings-tab" class="admin-tab">
                        <div class="admin-tab-header">
                            <h3>הגדרות האתר</h3>
                        </div>
                        <div class="admin-tab-content">
                            <form id="site-settings-form">
                                <div class="form-group">
                                    <label for="site-title">כותרת האתר</label>
                                    <input type="text" id="site-title" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label for="site-description">תיאור האתר</label>
                                    <textarea id="site-description" class="form-control"></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="github-user">משתמש GitHub</label>
                                    <input type="text" id="github-user" class="form-control" value="${productManager.githubUser || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="github-repo">מאגר GitHub</label>
                                    <input type="text" id="github-repo" class="form-control" value="${productManager.githubRepo || ''}">
                                </div>
                                <button type="submit" class="btn btn-primary">שמור הגדרות</button>
                            </form>
                        </div>
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
                                <!-- Categories will be loaded here -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="product-price">מחיר</label>
                            <input type="number" id="product-price" class="form-control" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="product-old-price">מחיר קודם (למבצע)</label>
                            <input type="number" id="product-old-price" class="form-control" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label for="product-stock">מלאי</label>
                            <input type="number" id="product-stock" class="form-control" min="0" required>
                        </div>
                        <div class="form-group">
                            <label for="product-badge">תגית</label>
                            <select id="product-badge" class="form-control">
                                <option value="">ללא תגית</option>
                                <option value="new">חדש</option>
                                <option value="sale">מבצע</option>
                                <option value="hot">חם</option>
                                <option value="vip">VIP</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="product-description">תיאור המוצר</label>
                            <textarea id="product-description" class="form-control"></textarea>
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
    
    // Append to body
    $('body').append(adminPanelHTML);
}

// Add admin menu item to navigation
function addAdminMenuItemToNav() {
    // Check if admin menu item already exists
    if ($('#admin-menu-item').length > 0) {
        console.log('Admin menu item already exists');
        return;
    }
    
    // Find the navigation menu
    const $nav = $('nav ul');
    if ($nav.length > 0) {
        // Add admin menu item before the last item (usually About/Contact)
        const $adminMenuItem = $('<li id="admin-menu-item" style="display:none;"><a href="#"><i class="fas fa-cog"></i> פאנל ניהול</a></li>');
        
        // Add click event
        $adminMenuItem.on('click', function(e) {
            e.preventDefault();
            openAdminPanel();
        });
        
        // Add to navigation
        if ($nav.find('li').length > 0) {
            $nav.find('li').eq(-1).before($adminMenuItem);
        } else {
            $nav.append($adminMenuItem);
        }
        
        console.log('Admin menu item added to navigation');
    } else {
        console.warn('Navigation menu not found, cannot add admin menu item');
    }
}

// Add CSS styles for admin panel
function addAdminStyles() {
    // Check if admin styles already exist
    if ($('#admin-styles').length > 0) {
        console.log('Admin styles already exist');
        return;
    }
    
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.id = 'admin-styles';
    
    // Admin panel styles
    const styles = `
        /* Admin Panel Styles */
        #admin-panel {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: none;
            direction: rtl;
        }
        
        #admin-panel.active {
            display: block;
        }
        
        .admin-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            height: 90%;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background-color: var(--primary-color);
            color: #fff;
        }
        
        .admin-header h2 {
            margin: 0;
            font-size: 1.5rem;
        }
        
        .close-admin-panel {
            background: none;
            border: none;
            color: #fff;
            font-size: 1.2rem;
            cursor: pointer;
        }
        
        .admin-menu {
            display: flex;
            background-color: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
        }
        
        .admin-menu-item {
            padding: 15px 20px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .admin-menu-item.active {
            background-color: #fff;
            border-bottom: 3px solid var(--primary-color);
        }
        
        .admin-content {
            flex: 1;
            overflow: auto;
            padding: 20px;
        }
        
        .admin-tab {
            display: none;
        }
        
        .admin-tab.active {
            display: block;
        }
        
        .admin-tab-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .admin-tab-header h3 {
            margin: 0;
        }
        
        .admin-btn {
            background-color: var(--primary-color);
            color: #fff;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .admin-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .admin-table th, .admin-table td {
            padding: 12px 15px;
            text-align: right;
            border-bottom: 1px solid #dee2e6;
        }
        
        .admin-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        
        .admin-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1001;
            display: none;
            direction: rtl;
        }
        
        .admin-modal.active {
            display: block;
        }
        
        .admin-modal-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            max-width: 90%;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .admin-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background-color: var(--primary-color);
            color: #fff;
        }
        
        .admin-modal-header h3 {
            margin: 0;
            font-size: 1.2rem;
        }
        
        .close-admin-modal {
            background: none;
            border: none;
            color: #fff;
            font-size: 1.2rem;
            cursor: pointer;
        }
        
        .admin-modal-content {
            padding: 20px;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .action-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
            margin-right: 5px;
        }
        
        .edit-btn {
            color: var(--primary-color);
        }
        
        .delete-btn {
            color: var(--danger-color);
        }
        
        .view-btn {
            color: var(--info-color);
        }
        
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .status-badge.completed {
            background-color: var(--success-color);
            color: #fff;
        }
        
        .status-badge.pending {
            background-color: var(--warning-color);
            color: #000;
        }
        
        .status-badge.cancelled {
            background-color: var(--danger-color);
            color: #fff;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .form-control {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 1rem;
        }
        
        textarea.form-control {
            min-height: 100px;
        }
    `;
    
    // Add styles to the document
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
    
    console.log('Admin styles added');
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
            const productsInCategory = productManager.filterProducts ? 
                productManager.filterProducts({ category: category }).length : 0;
            
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

// Function to check if network is connected
function checkNetworkConnection() {
    if (!navigator.onLine) {
        showNotification('נראה שאתה לא מחובר לאינטרנט. אנא בדוק את החיבור שלך.', 'warning');
        return false;
    }
    return true;
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
