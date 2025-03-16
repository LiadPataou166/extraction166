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
                        return true;
                    } else {
                        showNotification('שגיאה ביצירת קובץ מוצרים', 'error');
                        return false;
                    }
                }
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const data = await response.json();
            // GitHub returns base64 encoded content
            const content = atob(data.content);
            this.products = JSON.parse(content);
            console.log('Loaded products from GitHub, count:', this.products.length);
            showNotification('מוצרים נטענו בהצלחה!', 'success');
            return true;
        } catch (error) {
            console.error('Error loading products from GitHub:', error);
            showNotification('שגיאה בטעינת מוצרים מהשרת', 'error');
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
            const content = btoa(JSON.stringify(this.products, null, 2)); // Convert to base64
            
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
    
    // Load categories from GitHub
    async loadCategoriesFromGitHub() {
        try {
            console.log('Loading categories from GitHub...');
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/data/categories.json`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.warn(`GitHub API error (${response.status}): ${response.statusText}`);
                if (response.status === 404) {
                    // File doesn't exist, so create it
                    console.log('Creating categories.json file on GitHub...');
                    const created = await this.saveCategoriesToGitHub();
                    if (created) {
                        showNotification('קובץ קטגוריות חדש נוצר בהצלחה!', 'success');
                        return true;
                    } else {
                        showNotification('שגיאה ביצירת קובץ קטגוריות', 'error');
                        return false;
                    }
                }
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const data = await response.json();
            // GitHub returns base64 encoded content
            const content = atob(data.content);
            this.categories = JSON.parse(content);
            console.log('Loaded categories from GitHub, count:', this.categories.length);
            return true;
        } catch (error) {
            console.error('Error loading categories from GitHub:', error);
            showNotification('שגיאה בטעינת קטגוריות מהשרת', 'error');
            return false;
        }
    }
    
    // Save categories to GitHub
    async saveCategoriesToGitHub() {
        try {
            console.log('Saving categories to GitHub, count:', this.categories.length);
            
            // First, try to get existing file to get its SHA
            let sha = null;
            try {
                const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/data/categories.json`;
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    sha = data.sha;
                }
            } catch (error) {
                console.log('No existing categories.json file found, will create new one');
            }
            
            // Ensure we have a GitHub token
            const hasToken = await this.ensureGitHubToken();
            if (!hasToken) {
                console.warn('No GitHub token provided, cannot save to GitHub');
                showNotification('נדרש GitHub Token לשמירת נתונים', 'warning');
                return false;
            }
            
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/data/categories.json`;
            const content = btoa(JSON.stringify(this.categories, null, 2)); // Convert to base64
            
            const body = {
                message: "Update categories data",
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
                return false;
            }
            
            console.log('Categories saved to GitHub successfully');
            return true;
        } catch (error) {
            console.error('Error saving categories to GitHub:', error);
            showNotification('שגיאה בשמירת קטגוריות לשרת', 'error');
            return false;
        }
    }
    
    // Add category
    async addCategory(category) {
        console.log('Adding category:', category);
        if(!this.categories.includes(category)) {
            this.categories.push(category);
            
            // Save to GitHub
            const success = await this.saveCategoriesToGitHub();
            if (success) {
                showNotification('הקטגוריה נוספה בהצלחה!', 'success');
                return true;
            } else {
                showNotification('שגיאה בהוספת קטגוריה', 'error');
                return false;
            }
        }
        return false;
    }
    
    // Get all categories
    getAllCategories() {
        console.log('Getting all categories, count:', this.categories.length);
        return this.categories;
    }
    
    // Add tag
    async addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            // Could save tags to GitHub too if needed
            return true;
        }
        return false;
    }
    
    // Get all tags
    getAllTags() {
        return this.tags;
    }
    
    // Filter products
    filterProducts(filters) {
        let filteredProducts = [...this.products];
        
        // Filter by category
        if(filters.category) {
            filteredProducts = filteredProducts.filter(p => p.category === filters.category);
        }
        
        // Filter by price range
        if(filters.minPrice !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice);
        }
        
        if(filters.maxPrice !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice);
        }
        
        // Filter by tags
        if(filters.tags && filters.tags.length > 0) {
            filteredProducts = filteredProducts.filter(p => {
                return filters.tags.every(tag => p.tags && p.tags.includes(tag));
            });
        }
        
        // Search by keyword
        if(filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            filteredProducts = filteredProducts.filter(p => {
                return p.name.toLowerCase().includes(keyword) || 
                       (p.description && p.description.toLowerCase().includes(keyword));
            });
        }
        
        // Sort products
        if(filters.sortBy) {
            switch(filters.sortBy) {
                case 'price-low':
                    filteredProducts.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    filteredProducts.sort((a, b) => b.price - a.price);
                    break;
                case 'newest':
                    filteredProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                    break;
                case 'rating':
                    filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;
            }
        }
        
        return filteredProducts;
    }
}

// VIP Membership System
class MembershipManager {
    constructor() {
        this.members = [];
        this.benefits = [
            {
                id: 'discount',
                name: 'הנחה קבועה',
                description: 'הנחה קבועה של 10% על כל המוצרים',
                value: 10
            },
            {
                id: 'free_shipping',
                name: 'משלוח חינם',
                description: 'משלוח חינם בכל הזמנה ללא מינימום',
                value: true
            },
            {
                id: 'monthly_gift',
                name: 'מתנה חודשית',
                description: 'מתנה ייחודית בכל חודש',
                value: true
            },
            {
                id: 'exclusive_products',
                name: 'מוצרים בלעדיים',
                description: 'גישה למוצרים בלעדיים לחברי VIP בלבד',
                value: true
            }
        ];
    }
    
    // Register new member
    registerMember(userData) {
        // Check if user already exists
        if(this.members.some(m => m.email === userData.email)) {
            return { success: false, message: 'משתמש קיים במערכת' };
        }
        
        // Generate member ID
        const memberId = 'VIP' + Date.now().toString().substr(-6);
        
        // Create member object
        const newMember = {
            id: memberId,
            ...userData,
            joinDate: new Date(),
            membershipExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            pointsBalance: 100, // Welcome points
            transactions: []
        };
        
        this.members.push(newMember);
        this.saveMembers();
        
        return { 
            success: true, 
            message: 'ההרשמה בוצעה בהצלחה', 
            memberId
        };
    }
    
    // Get member by ID
    getMember(memberId) {
        return this.members.find(m => m.id === memberId);
    }
    
    // Get member by email
    getMemberByEmail(email) {
        return this.members.find(m => m.email === email);
    }
    
    // Update member data
    updateMember(memberId, updatedData) {
        const index = this.members.findIndex(m => m.id === memberId);
        if(index !== -1) {
            this.members[index] = { ...this.members[index], ...updatedData };
            this.saveMembers();
            return true;
        }
        return false;
    }
    
    // Add points to member
    addPoints(memberId, points, reason) {
        const member = this.getMember(memberId);
        if(member) {
            member.pointsBalance += points;
            member.transactions.push({
                date: new Date(),
                type: 'credit',
                points,
                reason
            });
            this.saveMembers();
            return member.pointsBalance;
        }
        return null;
    }
    
    // Redeem points
    redeemPoints(memberId, points, benefit) {
        const member = this.getMember(memberId);
        if(member && member.pointsBalance >= points) {
            member.pointsBalance -= points;
            member.transactions.push({
                date: new Date(),
                type: 'debit',
                points,
                reason: `נוצל עבור: ${benefit}`
            });
            this.saveMembers();
            return member.pointsBalance;
        }
        return null;
    }
    
    // Check if membership is valid
    isMembershipValid(memberId) {
        const member = this.getMember(memberId);
        if(member) {
            return new Date(member.membershipExpiry) > new Date();
        }
        return false;
    }
    
    // Renew membership
    renewMembership(memberId, yearsToAdd = 1) {
        const member = this.getMember(memberId);
        if(member) {
            const currentExpiry = new Date(member.membershipExpiry);
            const newExpiry = new Date();
            
            // If membership already expired, extend from current date
            if(currentExpiry < new Date()) {
                newExpiry.setFullYear(newExpiry.getFullYear() + yearsToAdd);
            } else {
                // If membership is still valid, extend from expiry date
                newExpiry.setTime(currentExpiry.getTime());
                newExpiry.setFullYear(newExpiry.getFullYear() + yearsToAdd);
            }
            
            member.membershipExpiry = newExpiry;
            this.saveMembers();
            return true;
        }
        return false;
    }
    
    // Get all VIP benefits
    getAllBenefits() {
        return this.benefits;
    }
    
    // Save members to localStorage
    saveMembers() {
        localStorage.setItem('vipMembers', JSON.stringify(this.members));
    }
    
    // Load members from localStorage
    loadMembers() {
        const storedMembers = localStorage.getItem('vipMembers');
        if(storedMembers) {
            this.members = JSON.parse(storedMembers);
        }
    }
}

// Shopping Cart System
class CartManager {
    constructor() {
        this.items = [];
        this.loadCart();
    }
    
    // Add item to cart
    addItem(product, quantity = 1, variations = {}) {
        // Check if product with same variations already exists
        const existingItemIndex = this.items.findIndex(item => {
            if(item.productId !== product.id) return false;
            
            // Check if variations match
            const existingVarsKeys = Object.keys(item.variations || {});
            const newVarsKeys = Object.keys(variations || {});
            
            if(existingVarsKeys.length !== newVarsKeys.length) return false;
            
            return existingVarsKeys.every(key => 
                item.variations[key] === variations[key]
            );
        });
        
        if(existingItemIndex !== -1) {
            // Update quantity of existing item
            this.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            this.items.push({
                id: Date.now().toString(36),
                productId: product.id,
                name: product.name,
                price: product.price,
                salePrice: product.salePrice,
                image: product.image,
                quantity,
                variations
            });
        }
        
        this.saveCart();
        return this.items.length;
    }
    
    // Update item quantity
    updateQuantity(itemId, quantity) {
        const index = this.items.findIndex(item => item.id === itemId);
        if(index !== -1) {
            if(quantity <= 0) {
                // Remove item if quantity is 0 or negative
                this.removeItem(itemId);
            } else {
                this.items[index].quantity = quantity;
                this.saveCart();
            }
            return true;
        }
        return false;
    }
    
    // Remove item from cart
    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveCart();
        return this.items.length;
    }
    
    // Clear cart
    clearCart() {
        this.items = [];
        this.saveCart();
    }
    
    // Get all items
    getItems() {
        return this.items;
    }
    
    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => {
            const price = item.salePrice || item.price;
            return total + (price * item.quantity);
        }, 0);
    }
    
    // Get item count
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }
    
    // Apply discount (for VIP members)
    applyDiscount(percentage) {
        const discountFactor = 1 - (percentage / 100);
        return this.getTotal() * discountFactor;
    }
    
    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.items));
    }
    
    // Load cart from localStorage
    loadCart() {
        const storedCart = localStorage.getItem('shoppingCart');
        if(storedCart) {
            this.items = JSON.parse(storedCart);
        }
    }
}

// Initialize managers
console.log('Initializing product manager, membership manager, and cart manager...');
const productManager = new ProductManager();
const membershipManager = new MembershipManager();
const cartManager = new CartManager();

// Load data from storage
console.log('Loading data from storage...');
(async function loadAllData() {
    try {
        // First load from GitHub
        console.log('Loading products and categories from GitHub...');
        await productManager.loadProductsFromGitHub();
        await productManager.loadCategoriesFromGitHub();
        
        // Initialize Supabase if possible
        try {
            initSupabase();
        } catch (error) {
            console.warn('Failed to initialize Supabase:', error);
        }
        
        // Check user login status
        checkUserLogin();
        
        // Update cart badge on page load
        const cartCount = cartManager.getItemCount();
        $('.header-icon .badge').eq(1).text(cartCount);
        
        // Update UI with loaded data
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            // Refresh product listings on homepage if present
            if (typeof displayProducts === 'function') {
                displayProducts();
            }
        }
        
        // Update admin panel data if it's open
        if ($('#admin-panel').hasClass('active')) {
            loadAdminPanelData();
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('שגיאה בטעינת נתונים מהשרת', 'error');
    }
})();

// Supabase configuration
const SUPABASE_URL = 'https://ebkgbaetsgtzordvkcvf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia2diYWV0c2d0em9yZHZrY3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMjAzMTMsImV4cCI6MjA1NzY5NjMxM30.fype9g6RIKCYHJvXJN8b_kFFnkehACo3inpXa382GgI';
let supabase;

// Initialize Supabase client
function initSupabase() {
    console.log('מנסה להתחבר ל-Supabase...');
    
    try {
        // Access the Supabase library from the global window object
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabase = client; // Set the global variable
        return client;
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        showNotification('Failed to connect to database service', 'error');
        return null;
    }
}

// Add this function to detect network issues
function checkNetworkConnection() {
    if (!navigator.onLine) {
        showNotification('You appear to be offline. Please check your internet connection.', 'warning');
        return false;
    }
    return true;
}

// Add this function to check if an email is allowed before attempting to register
async function checkEmailAllowed(email) {
    try {
        const response = await fetch('https://api.email-validator.net/api/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                EmailAddress: email,
                APIKey: 'your-email-validation-api-key', // Get a free API key or remove this
            }),
        });
        
        const result = await response.json();
        
        if (result.status === 'valid') {
            return true;
        } else {
            console.warn('Email validation issue:', result.info);
            return false;
        }
    } catch (error) {
        console.error('Email validation error:', error);
        return true; // Fallback to allow if the service is unavailable
    }
}

// Admin Panel System
// Check if user is admin when logged in
let isAdmin = false;
const ADMIN_EMAIL = 'liad1111@gmail.com';

// Function to show admin panel
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

// Function to check if user is authenticated with Supabase
async function checkUserAuth() {
    try {
        if (supabase) {
            console.log('Checking user authentication status...');
            supabase.auth.getSession().then(({ data, error }) => {
                if (error) {
                    console.error('Auth error:', error);
                    return;
                }
                
                if (data && data.session) {
                    // User is logged in
                    const user = data.session.user;
                    console.log('User authenticated:', user.email);
                    const userData = {
                        email: user.email,
                        name: user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : user.email.split('@')[0],
                        isVIP: user.user_metadata && user.user_metadata.isVIP ? user.user_metadata.isVIP : false
                    };
                    
                    updateUserUI(userData);
                    
                    // Check if user is admin
                    if (user.email === ADMIN_EMAIL) {
                        console.log('Admin user detected in checkUserAuth');
                        isAdmin = true;
                        $('#admin-menu-item').show();
                        
                        // Open admin panel automatically
                        addAdminPanelToDOM();
                        setTimeout(() => {
                            openAdminPanel();
                        }, 500);
                    }
                } else {
                    // Fallback to local storage check
                    checkUserLogin();
                }
            }).catch(err => {
                console.error('Error checking auth:', err);
                // Fallback to local storage check
                checkUserLogin();
            });
        } else {
            // If Supabase is not available, fallback to local storage
            checkUserLogin();
        }
    } catch (err) {
        console.error('Error in checkUserAuth:', err);
        // Fallback to local storage check
        checkUserLogin();
    }
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
        // Get real members from membership manager
        const members = membershipManager.members;
        const userListBody = $('#user-list-body');
        
        // Try to get Supabase users if available - note: admin API requires admin privileges
        let supabaseUsers = [];
        if (supabase) {
            try {
                // Note: This may fail with 403 for non-admin users
                const { data, error } = await supabase.auth.admin.listUsers();
                if (!error && data) {
                    supabaseUsers = data.users || [];
                }
            } catch (error) {
                console.log('Unable to fetch Supabase users (requires admin access):', error);
                // This is expected for non-admin users, so we continue with local data
            }
        }
        
        // Combine users from Supabase and local membership
        let combinedUsers = [];
        
        // First add the admin
        combinedUsers.push({
            name: 'מנהל',
            email: ADMIN_EMAIL,
            type: 'מנהל',
            joinDate: new Date(),
            id: 'admin'
        });
        
        // Then add members from membership manager
        members.forEach(member => {
            if (member.email !== ADMIN_EMAIL) {
                combinedUsers.push({
                    name: member.name || 'לקוח רשום',
                    email: member.email,
                    type: member.isVIP ? 'VIP' : 'רגיל',
                    joinDate: member.joinDate || new Date(),
                    id: member.id
                });
            }
        });
        
        if (combinedUsers.length === 0) {
            userListBody.html(`
                <tr>
                    <td colspan="5" class="text-center">אין משתמשים להצגה</td>
                </tr>
            `);
            return;
        }
        
        let usersHTML = '';
        
        combinedUsers.forEach(user => {
            const formattedDate = new Date(user.joinDate).toLocaleDateString('he-IL');
            usersHTML += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.type}</td>
                    <td>${formattedDate}</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" data-id="${user.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        userListBody.html(usersHTML);
    } catch (error) {
        console.error('Error loading users data:', error);
        showNotification('שגיאה בטעינת נתוני המשתמשים', 'error');
    }
}

// Function to load orders data
async function loadOrdersData() {
    try {
        // Get orders from localStorage
        let orders = [];
        const storedOrders = localStorage.getItem('orders');
        if (storedOrders) {
            orders = JSON.parse(storedOrders);
        }
        
        const orderListBody = $('#order-list-body');
        
        if (orders.length === 0) {
            // If no orders, show a placeholder row with sample data
            orderListBody.html(`
                <tr>
                    <td colspan="6" class="text-center">אין הזמנות להצגה</td>
                </tr>
            `);
            
            // Create sample order in localStorage if needed for testing
            if (!localStorage.getItem('orders')) {
                const sampleOrders = [
                    {
                        id: 'ORD' + Date.now(),
                        customer: {
                            name: 'לקוח לדוגמה',
                            email: ADMIN_EMAIL
                        },
                        date: new Date(),
                        total: 299.99,
                        status: 'בטיפול',
                        items: [
                            {
                                productId: 'sample1',
                                name: 'מוצר לדוגמה',
                                price: 149.99,
                                quantity: 2
                            }
                        ]
                    }
                ];
                localStorage.setItem('orders', JSON.stringify(sampleOrders));
            }
            
            return;
        }
        
        let ordersHTML = '';
        
        orders.forEach(order => {
            const formattedDate = new Date(order.date).toLocaleDateString('he-IL');
            const statusClass = getStatusClass(order.status);
            
            ordersHTML += `
                <tr>
                    <td>#${order.id}</td>
                    <td>${order.customer?.name || 'לקוח'}</td>
                    <td>${formattedDate}</td>
                    <td>₪${order.total.toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                    <td>
                        <button class="action-btn view-btn" data-id="${order.id}"><i class="fas fa-eye"></i></button>
                        <button class="action-btn delete-btn" data-id="${order.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        orderListBody.html(ordersHTML);
    } catch (error) {
        console.error('Error loading orders data:', error);
        showNotification('שגיאה בטעינת נתוני ההזמנות', 'error');
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

// Function to open add product modal
function openAddProductModal() {
    $('#add-product-modal').addClass('active');
}

// Function to close add product modal
function closeAddProductModal() {
    $('#add-product-modal').removeClass('active');
}

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
            closeAddProductModal();
            
            // Reset form
            $('#add-product-form')[0].reset();
            
            // Refresh product list
            loadProductsData();
            
            showNotification('המוצר נוסף בהצלחה!', 'success');
        } else {
            showNotification('שגיאה בהוספת המוצר', 'error');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('שגיאה בהוספת המוצר: ' + error.message, 'error');
    } finally {
        // Reset button
        $submitBtn.prop('disabled', false).text('הוסף מוצר');
    }
});

// Handle adding new categories
$(document).on('click', '#add-category-btn', async function() {
    const newCategory = prompt('הזן שם קטגוריה חדשה:');
    if (newCategory && newCategory.trim()) {
        // Show loading notification
        showNotification('מוסיף קטגוריה...', 'info');
        
        try {
            // Add category
            const success = await productManager.addCategory(newCategory.trim());
            
            if (success) {
                // Reload categories data
                loadCategoriesData();
                
                // Update category dropdown
                updateCategoryDropdown();
            }
        } catch (error) {
            console.error('Error adding category:', error);
            showNotification('שגיאה בהוספת קטגוריה', 'error');
        }
    }
});

// Add admin panel HTML to the DOM if it doesn't exist
function addAdminPanelToDOM() {
    // Only add if it doesn't exist
    if($('#admin-panel').length === 0) {
        console.log('Adding admin panel to DOM...');
        
        $('body').append(`
            <!-- Admin Panel -->
            <div id="admin-panel" class="admin-panel">
                <div class="admin-panel-bg"></div>
                <div class="admin-container">
                    <div class="admin-sidebar">
                        <div class="admin-header">
                            <h3>פאנל ניהול</h3>
                            <button class="close-admin-panel"><i class="fas fa-times"></i></button>
                        </div>
                        <ul class="admin-menu">
                            <li class="admin-menu-item active" data-target="products-tab">
                                <i class="fas fa-box-open"></i>
                                <span>מוצרים</span>
                            </li>
                            <li class="admin-menu-item" data-target="categories-tab">
                                <i class="fas fa-tags"></i>
                                <span>קטגוריות</span>
                            </li>
                            <li class="admin-menu-item" data-target="users-tab">
                                <i class="fas fa-users"></i>
                                <span>משתמשים</span>
                            </li>
                            <li class="admin-menu-item" data-target="orders-tab">
                                <i class="fas fa-shopping-cart"></i>
                                <span>הזמנות</span>
                            </li>
                            <li class="admin-menu-item" data-target="settings-tab">
                                <i class="fas fa-cog"></i>
                                <span>הגדרות</span>
                            </li>
                        </ul>
                    </div>
                    <div class="admin-content">
                        <!-- Products Tab -->
                        <div id="products-tab" class="admin-tab active">
                            <div class="admin-tab-header">
                                <h2>ניהול מוצרים</h2>
                                <div class="admin-actions">
                                    <div class="search-box">
                                        <input type="text" id="product-search" placeholder="חיפוש מוצרים...">
                                        <i class="fas fa-search"></i>
                                    </div>
                                    <button id="add-product-btn" class="admin-btn"><i class="fas fa-plus"></i> הוסף מוצר</button>
                                </div>
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
                                        <!-- Product rows will be added here dynamically -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Categories Tab -->
                        <div id="categories-tab" class="admin-tab">
                            <div class="admin-tab-header">
                                <h2>ניהול קטגוריות</h2>
                                <div class="admin-actions">
                                    <button id="add-category-btn" class="admin-btn"><i class="fas fa-plus"></i> הוסף קטגוריה</button>
                                </div>
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
                                        <!-- Category rows will be added here dynamically -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Users Tab -->
                        <div id="users-tab" class="admin-tab">
                            <div class="admin-tab-header">
                                <h2>ניהול משתמשים</h2>
                                <div class="admin-actions">
                                    <div class="search-box">
                                        <input type="text" id="user-search" placeholder="חיפוש משתמשים...">
                                        <i class="fas fa-search"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="admin-table-container">
                                <table class="admin-table">
                                    <thead>
                                        <tr>
                                            <th>שם</th>
                                            <th>אימייל</th>
                                            <th>סוג משתמש</th>
                                            <th>תאריך הצטרפות</th>
                                            <th>פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody id="user-list-body">
                                        <!-- User rows will be added here dynamically -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Orders Tab -->
                        <div id="orders-tab" class="admin-tab">
                            <div class="admin-tab-header">
                                <h2>ניהול הזמנות</h2>
                                <div class="admin-actions">
                                    <div class="search-box">
                                        <input type="text" id="order-search" placeholder="חיפוש הזמנות...">
                                        <i class="fas fa-search"></i>
                                    </div>
                                </div>
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
                                        <!-- Order rows will be added here dynamically -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Settings Tab -->
                        <div id="settings-tab" class="admin-tab">
                            <div class="admin-tab-header">
                                <h2>הגדרות אתר</h2>
                            </div>
                            <div class="admin-form-container">
                                <form id="site-settings-form">
                                    <div class="form-group">
                                        <label for="site-title">כותרת האתר</label>
                                        <input type="text" id="site-title" value="חנות אקסטרים אונליין">
                                    </div>
                                    <div class="form-group">
                                        <label for="site-description">תיאור האתר</label>
                                        <textarea id="site-description" rows="3">החנות המובילה למוצרי אקסטרים ברשת</textarea>
                                    </div>
                                    <div class="form-group">
                                        <label for="github-user">שם משתמש GitHub</label>
                                        <input type="text" id="github-user" value="${productManager?.githubUser || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label for="github-repo">שם מאגר GitHub</label>
                                        <input type="text" id="github-repo" value="${productManager?.githubRepo || ''}">
                                    </div>
                                    <button type="submit" class="admin-btn">שמור הגדרות</button>
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
                                <input type="text" id="product-name" required>
                            </div>
                            <div class="form-group">
                                <label for="product-category">קטגוריה</label>
                                <select id="product-category" required>
                                    <option value="">בחר קטגוריה</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <div class="form-group half">
                                    <label for="product-price">מחיר (₪)</label>
                                    <input type="number" id="product-price" min="0" step="0.01" required>
                                </div>
                                <div class="form-group half">
                                    <label for="product-old-price">מחיר קודם (₪) - אופציונלי</label>
                                    <input type="number" id="product-old-price" min="0" step="0.01">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group half">
                                    <label for="product-stock">מלאי</label>
                                    <input type="number" id="product-stock" min="0" required>
                                </div>
                                <div class="form-group half">
                                    <label for="product-badge">תווית (חדש/מבצע) - אופציונלי</label>
                                    <select id="product-badge">
                                        <option value="">ללא תווית</option>
                                        <option value="new">חדש</option>
                                        <option value="sale">מבצע</option>
                                        <option value="hot">חם</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="product-description">תיאור המוצר</label>
                                <textarea id="product-description" rows="4" required></textarea>
                            </div>
                            <button type="submit" class="admin-btn">הוסף מוצר</button>
                        </form>
                    </div>
                </div>
            </div>
        `);
    }
}

// Add CSS for admin loading spinner
function addAdminStyles() {
    // Only add if it doesn't exist
    if($('#admin-styles').length === 0) {
        console.log('Adding admin styles...');
        
        $('head').append(`
            <style id="admin-styles">
                /* Admin Loading Spinner */
                .admin-loading {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255,255,255,0.8);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                
                .admin-loading .spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 15px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `);
    }
}

// Add admin menu item to the navigation
function addAdminMenuItemToNav() {
    // Only add if it doesn't exist
    if($('#admin-menu-item').length === 0) {
        console.log('Adding admin menu item to navigation...');
        
        // Find the navigation menu
        const $nav = $('nav ul');
        if($nav.length > 0) {
            // Add admin menu item
            $nav.append(`
                <li id="admin-menu-item" style="display: none;">
                    <a href="#" id="open-admin-btn">
                        <i class="fas fa-cog"></i>
                        פאנל ניהול
                    </a>
                </li>
            `);
            
            // Add click event to open admin panel
            $(document).on('click', '#open-admin-btn', function(e) {
                e.preventDefault();
                openAdminPanel();
            });
        } else {
            console.warn('Navigation menu not found, cannot add admin menu item');
        }
    }
}

// Document ready event handlers for admin panel
$(document).ready(function() {
    // Add admin panel elements to DOM
    addAdminPanelToDOM();
    addAdminStyles();
    addAdminMenuItemToNav();
    
    // Admin panel tab switching
    $(document).on('click', '.admin-menu-item', function() {
        // Remove active class from all menu items and tabs
        $('.admin-menu-item').removeClass('active');
        $('.admin-tab').removeClass('active');
        
        // Add active class to clicked menu item
        $(this).addClass('active');
        
        // Show corresponding tab
        const targetTab = $(this).data('target');
        $(`#${targetTab}`).addClass('active');
    });
    
    // Close admin panel button
    $(document).on('click', '.close-admin-panel', function() {
        closeAdminPanel();
    });
    
    // Close admin panel when clicking outside
    $(document).on('click', '.admin-panel-bg', function() {
        closeAdminPanel();
    });
    
    // Close admin modal (for add product, etc.)
    $(document).on('click', '.close-admin-modal, .admin-modal-bg', function() {
        $('.admin-modal').removeClass('active');
    });
    
    // Open add product modal
    $(document).on('click', '#add-product-btn', function() {
        openAddProductModal();
    });
});

// Save site settings form
$(document).on('submit', '#site-settings-form', async function(e) {
    e.preventDefault();
    
    const siteTitle = $('#site-title').val();
    const siteDescription = $('#site-description').val();
    const githubUser = $('#github-user').val();
    const githubRepo = $('#github-repo').val();
    
    // Disable submit button to prevent double submission
    const $submitBtn = $(this).find('button[type="submit"]');
    $submitBtn.prop('disabled', true).text('שומר...');
    
    try {
        // Save GitHub settings to localStorage for next time
        if (githubUser && githubRepo) {
            const githubConfig = {
                user: githubUser,
                repo: githubRepo
            };
            localStorage.setItem('githubConfig', JSON.stringify(githubConfig));
            
            // Update product manager config
            productManager.githubUser = githubUser;
            productManager.githubRepo = githubRepo;
            
            showNotification('הגדרות GitHub נשמרו בהצלחה!', 'success');
            
            // Initialize GitHub repository structure
            const repoInitialized = await initGitHubRepository();
            if (repoInitialized) {
                showNotification('מבנה מאגר GitHub אותחל בהצלחה!', 'success');
                
                // Try to load data from GitHub with new settings
                await productManager.loadProductsFromGitHub();
                await productManager.loadCategoriesFromGitHub();
                
                // Refresh admin panel data
                await loadAdminPanelData();
            }
        }
        
        showNotification('הגדרות האתר נשמרו בהצלחה!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('שגיאה בשמירת ההגדרות: ' + error.message, 'error');
    } finally {
        // Re-enable submit button
        $submitBtn.prop('disabled', false).text('שמור הגדרות');
    }
});

// Initialize GitHub repository structure
async function initGitHubRepository() {
    try {
        if (!productManager.githubUser || !productManager.githubRepo) {
            console.log('GitHub configuration missing, skipping repository initialization');
            return false;
        }
        
        console.log('Checking GitHub repository structure...');
        
        // Check if data folder exists, if not create it with initial files
        const dataFolderCheck = await checkGitHubPath('data');
        if (!dataFolderCheck) {
            // We'll need to ask for a GitHub token to create folders
            const githubToken = prompt("To initialize GitHub repository structure, please enter your GitHub Personal Access Token with 'repo' permissions.", "");
            if (!githubToken) {
                console.warn('No GitHub token provided, cannot initialize repository');
                return false;
            }
            
            // Create 'data' folder with README
            await createGitHubFile('data/README.md', 
                '# Data Directory\n\nThis directory contains JSON data files for the store:\n\n' +
                '- products.json - Store products\n' +
                '- categories.json - Product categories\n', 
                'Initialize data directory', 
                githubToken);
                
            // Create empty products.json
            await createGitHubFile('data/products.json', 
                '[]', 
                'Initialize empty products database', 
                githubToken);
                
            // Create empty categories.json
            await createGitHubFile('data/categories.json', 
                '[]', 
                'Initialize empty categories database', 
                githubToken);
                
            console.log('GitHub repository structure initialized');
            return true;
        }
        
        return true;
    } catch (error) {
        console.error('Error initializing GitHub repository:', error);
        return false;
    }
}

// Check if a path exists in GitHub repository
async function checkGitHubPath(path) {
    try {
        const apiUrl = `https://api.github.com/repos/${productManager.githubUser}/${productManager.githubRepo}/contents/${path}`;
        const response = await fetch(apiUrl);
        return response.ok;
    } catch (error) {
        console.error(`Error checking GitHub path ${path}:`, error);
        return false;
    }
}

// Create a file in GitHub repository
async function createGitHubFile(path, content, message, token) {
    try {
        const apiUrl = `https://api.github.com/repos/${productManager.githubUser}/${productManager.githubRepo}/contents/${path}`;
        
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
