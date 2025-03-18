// Admin Email Configuration
const ADMIN_EMAIL = 'liad1111@gmail.com';
let adminPanelInitialized = false; // Track if admin panel is initialized
let isAdmin = false; // Global flag for admin status

// Initialize Slick Carousel for Hero
$(document).ready(function(){
    console.log('Document ready - initializing...');
    
    // Initialize product manager
    if (typeof productManager === 'undefined') {
        window.productManager = new ProductManager();
    }
    
    // Load and display categories in main menu
    loadCategories();
    
    // Load and display products on homepage
    loadAndDisplayProducts();
    
    // Initialize admin panel immediately if we need to show it
    addAdminStyles();
    
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
            
            // Save user data to localStorage
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Check if user is admin and open admin panel immediately
            if (email === ADMIN_EMAIL) {
                console.log('Admin user detected, opening admin panel...');
                // Ensure admin panel exists in DOM
                addAdminPanelToDOM();
                isAdmin = true;
                userData.isAdmin = true;
                localStorage.setItem('userData', JSON.stringify(userData)); // עדכון המידע בלוקל סטורג'
                
                // וידוא שכפתור המנהל קיים ועובד
                fixAdminButton();
                
                // עדכון ממשק המשתמש
                updateUserUI(userData);
                
                // פתיחת הפאנל מנהל
                openAdminPanel();
            } else {
                // עדכון ממשק המשתמש ללא פתיחת פאנל מנהל
                updateUserUI(userData);
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

    // Add this to your document ready function
    console.log('Looking for products grid:', $('.products-grid').length ? 'Found' : 'Not found');

    // Initialize ProductManager and load products for homepage
    if ($('.products-grid').length > 0) {
        console.log('Found products grid on homepage, initializing ProductManager...');
        
        // Initialize ProductManager if it doesn't exist
        if (typeof productManager === 'undefined' || !productManager) {
            console.log('Creating ProductManager for homepage...');
            window.productManager = new ProductManager();
            
            // Load products from GitHub and display on homepage
            productManager.loadProductsFromGitHub().then(success => {
                if (success) {
                    console.log('Successfully loaded products for homepage display');
                    displayProductsOnHomepage();
                } else {
                    console.error('Failed to load products for homepage');
                    $('.products-grid').html('<div class="error">שגיאה בטעינת מוצרים</div>');
                }
            }).catch(error => {
                console.error('Error loading products for homepage:', error);
            });
        } else {
            // ProductManager exists, just display products
            console.log('ProductManager already exists, displaying products on homepage');
            displayProductsOnHomepage();
        }
    }

    // Add necessary styles for admin panel and forms
    addAdminStyles();
    addProductFormStyles();
    addVIPStyles();

    // Setup sidebar toggles
    setupSidebarToggles();

    // תיקון לבעיית העלמות תפריט הקטגוריות וחלקים אחרים
    $(document).ready(function() {
        // וידוא הצגת תפריט הקטגוריות
        $('.categories-dropdown, .navbar-nav, .mega-menu, .navbar-categories').css({
            'display': 'block',
            'visibility': 'visible',
            'opacity': '1'
        });
        
        // טיפול בתפריט נפתח בלחיצה
        $('.navbar-nav .dropdown').off('click.fixDropdown').on('click.fixDropdown', function(e) {
            if (!$(e.target).is('a')) {
                e.stopPropagation();
                $(this).find('.dropdown-menu').toggle();
            }
        });
        
        // וידוא הצגת סרגלים
        if ($('.product-sidebar, .system-sidebar').length) {
            console.log('Fixing sidebars visibility');
            $('.product-sidebar, .system-sidebar').each(function() {
                const $sidebar = $(this);
                // שמירה על CSS קיים שקשור לפוזישן ומיקום
                const origPosition = $sidebar.css('position');
                const origTransform = $sidebar.css('transform');
                
                // רק הצגה ללא שינוי פרמטרים אחרים
                $sidebar.css({
                    'display': 'block',
                    'visibility': 'visible',
                    'opacity': '1'
                });
                
                // החזרת פרמטרים מקוריים אם היו מוגדרים
                if (origPosition) $sidebar.css('position', origPosition);
                if (origTransform) $sidebar.css('transform', origTransform);
            });
        }
        
        // וידוא הצגת אזורי VIP, צ'אט וכו'
        $('.vip-club, .chatbot-section, .promo-section, .contact-section').css({
            'display': 'block',
            'visibility': 'visible',
            'opacity': '1'
        });
        
        // תיקון פריסת המוצרים אם יש בעיה
        if ($('.products-grid, .products-row').length) {
            $('.products-grid, .products-row').css({
                'display': 'grid',
                'grid-template-columns': 'repeat(auto-fill, minmax(250px, 1fr))',
                'gap': '20px'
            });
        }
    });

    // תיקון לפריסת תפריט קטגוריות פתוח
    function fixCategoriesMenu() {
        console.log('Fixing categories menu display');
        
        // Handle menu items with submenus
        $('.menu-item-has-children').each(function() {
            // Remove previous event listeners to avoid duplicates
            $(this).off('mouseenter mouseleave');
            
            // Add event listeners for desktop hover effect
            if (window.innerWidth > 768) {
                $(this).on('mouseenter', function() {
                    $(this).find('.sub-menu').css({
                        'visibility': 'visible',
                        'opacity': '1',
                        'transform': 'translateY(0)',
                        'display': 'block'
                    });
                });
                
                $(this).on('mouseleave', function() {
                    $(this).find('.sub-menu').css({
                        'visibility': 'hidden',
                        'opacity': '0',
                        'transform': 'translateY(10px)'
                    });
                });
            }
        });
        
        // Mobile menu toggle
        $('.has-submenu').off('click').on('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                $(this).parent().toggleClass('active');
                $(this).parent().find('.sub-menu').slideToggle(300);
            }
        });
        
        // Display categories in menu - move here to ensure it happens after menu structure is fixed
        if (productManager && productManager.categories) {
            displayCategoriesInMainMenu(productManager.categories);
        } else {
            // Load categories if they're not already available
            loadCategories().then(() => {
                if (productManager && productManager.categories) {
                    displayCategoriesInMainMenu(productManager.categories);
                }
            });
        }
    }

    // הפעלת התיקון לאחר טעינה
    $(window).on('load', function() {
        // Run menu fixes after a short delay to ensure all elements are loaded
        setTimeout(fixCategoriesMenu, 500);
    });
});

// DOM Ready - נקודת הכניסה לקוד
$(document).ready(function() {
    // תיקון הצגת אלמנטים
    fixVisibility();
    
    // תיקון כפתור פאנל מנהל
    fixAdminButton();
    
    // תיקון תפריט קטגוריות
    fixCategoriesMenu();
    
    // ווידא שהלינק להרשמה מעוצב נכון
    styleRegisterButton();
});

// פונקציה לתיקון הצגת אלמנטים
function fixVisibility() {
    // וידוא שכל האזורים החשובים מוצגים
    $('.puffiz-category-section, .vip-club, .newsletter').css({
        'display': 'block',
        'visibility': 'visible',
        'opacity': '1',
        'max-height': 'none',
        'overflow': 'visible'
    });
    
    // וידוא שכל תתי-האלמנטים מוצגים
    $('.puffiz-header, .puffiz-title, .puffiz-subtitle, .puffiz-divider, .puffiz-grid, .puffiz-grid-2x2, .puffiz-category-item, .puffiz-overlay, .puffiz-content, .puffiz-category-title').css({
        'display': 'block',
        'visibility': 'visible',
        'opacity': '1'
    });
    
    // תיקון מיוחד לגריד
    $('.puffiz-grid-2x2').css({
        'display': 'grid'
    });
    
    // וידוא שאזור ה-VIP מוצג כראוי
    $('.vip-content, .vip-title, .vip-subtitle, .vip-features, .vip-feature, .vip-feature-icon, .vip-feature-title, .vip-feature-text, .btn-vip').css({
        'display': 'block',
        'visibility': 'visible',
        'opacity': '1'
    });
    
    // תיקון מיוחד לגריד של ה-VIP
    $('.vip-features').css({
        'display': 'grid'
    });
    
    // וידוא שאזור הניוזלטר מוצג כראוי
    $('.newsletter-content, .newsletter-title, .newsletter-text, .newsletter-form, .newsletter-input, .newsletter-btn').css({
        'display': 'block',
        'visibility': 'visible',
        'opacity': '1'
    });
    
    // תיקון מיוחד לטופס הניוזלטר
    $('.newsletter-form').css({
        'display': 'flex'
    });
}

// פונקציה לתיקון כפתור פאנל מנהל
function fixAdminButton() {
    console.log("מפעיל תיקון כפתור מנהל");
    // בדיקה אם המשתמש הוא מנהל
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    
    // הצג את כפתור המנהל רק אם המשתמש הוא מנהל
    if (userData && (userData.isAdmin || userData.email === ADMIN_EMAIL)) {
        console.log("המשתמש הוא מנהל, מציג כפתור פאנל ניהול");
        
        // וידוא שהכפתור של פאנל המנהל מוצג ולחיץ
        $('#admin-menu-item, .admin-link, .admin-panel-btn').css({
            'display': 'block !important',
            'visibility': 'visible !important',
            'opacity': '1 !important',
            'cursor': 'pointer !important',
            'pointer-events': 'auto !important'
        });
        
        // בדוק אם כפתור מנהל כבר קיים בתפריט, אם לא - צור אותו
        if ($('#admin-menu-item').length === 0) {
            console.log("יוצר כפתור פאנל ניהול");
            // הוסף כפתור לתפריט הראשי
            $('.main-nav').append('<li id="admin-menu-item" class="menu-item"><a href="#" class="admin-panel-btn">פאנל ניהול</a></li>');
        }
        
        // הצג את כפתור המנהל הקבוע
        $('#fixed-admin-button').show();
        
        // הוספת אירוע לחיצה מחדש לכל כפתורי פאנל המנהל
        $('.admin-panel-btn').off('click').on('click', function(e) {
            e.preventDefault();
            openAdminPanel();
            return false;
        });
        
        // הסר כל מאזיני אירועים ישנים וודא שהכפתור מוצג
        $('#admin-menu-item').show().css('display', 'block !important');
    } else {
        console.log("המשתמש אינו מנהל, מסתיר כפתור פאנל ניהול");
        $('#admin-menu-item, .admin-link, .admin-panel-btn').css({
            'display': 'none',
            'visibility': 'hidden',
            'opacity': '0'
        });
        
        // הסתר את כפתור המנהל הקבוע
        $('#fixed-admin-button').hide();
    }
}

// פונקציה לעיצוב כפתור הרשמה
function styleRegisterButton() {
    // עיצוב לינק הרשמה
    $('a.show-register').css({
        'display': 'inline-block',
        'padding': '8px 15px',
        'margin': '0 10px',
        'background-color': '#ff3a6b',
        'color': 'white',
        'border-radius': '5px',
        'text-decoration': 'none',
        'font-weight': 'bold',
        'transition': 'all 0.3s ease',
        'box-shadow': '0 2px 5px rgba(0,0,0,0.1)',
        'text-align': 'center'
    });
    
    // הוספת אפקט hover
    $('a.show-register').hover(
        function() {
            $(this).css({
                'background-color': '#e62d5b',
                'transform': 'translateY(-2px)',
                'box-shadow': '0 4px 8px rgba(0,0,0,0.2)'
            });
        },
        function() {
            $(this).css({
                'background-color': '#ff3a6b',
                'transform': 'translateY(0)',
                'box-shadow': '0 2px 5px rgba(0,0,0,0.1)'
            });
        }
    );
    
    // וידוא שהלינק מוביל להרשמה ולא להתחברות
    $('a.show-register').attr('onclick', 'showAuthModal("register"); return false;');
}

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
    try {
        // For demo purposes, check localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const loggedIn = userData && userData.name && userData.email;
        
        if (loggedIn) {
            // For testing purposes, let's check for VIP status and initialize if not present
            if (userData.isVIP === undefined) {
                userData.isVIP = false;
                localStorage.setItem('userData', JSON.stringify(userData));
            }
            
            // Check for admin status and initialize if not present
            if (userData.isAdmin === undefined || userData.email === ADMIN_EMAIL) {
                userData.isAdmin = userData.email === ADMIN_EMAIL;
                localStorage.setItem('userData', JSON.stringify(userData));
            }
            
            // Make sure admin panel elements exist in DOM if user is admin
            if (userData.isAdmin || userData.email === ADMIN_EMAIL) {
                addAdminPanelToDOM();
                addAdminStyles();
                addAdminMenuItemToNav();
            }
            
            updateUserUI(userData);
            return true;
        }
        
        // Not logged in
        $('.auth-links').html(`
            <a href="#" class="show-login">התחברות</a>
            <a href="#" class="show-register">הרשמה</a>
        `);
        
        // Attach event handlers
        $(document).on('click', '.show-login', function(e) {
            e.preventDefault();
            showAuthModal('login');
        });
        
        $(document).on('click', '.show-register', function(e) {
            e.preventDefault();
            showAuthModal('register');
        });
        
        // Style registration button
        styleRegisterButton();
        
        return false;
    } catch (error) {
        console.error('Error checking login status:', error);
        return false;
    }
}

// Function to check network connection
function checkNetworkConnection() {
    return navigator.onLine;
}

// Update updateUserUI function to include admin check
function updateUserUI(userData) {
    if(userData) {
        // User is logged in
        const { name, isVIP, email } = userData;
        
        // Show user info in header
        const userInfoHTML = `
            <div class="user-info">
                <span class="user-name">${name}</span>
                ${isVIP ? '<span class="vip-badge">VIP</span>' : ''}
                <a href="#" class="logout-btn"><i class="fas fa-sign-out-alt"></i> התנתק</a>
                <div class="user-menu">
                    <a href="#" class="user-menu-link"><i class="fas fa-user"></i> פרופיל</a>
                    <a href="#" class="user-menu-link"><i class="fas fa-shopping-bag"></i> הזמנות</a>
                    <a href="#" class="user-menu-link"><i class="fas fa-heart"></i> מועדפים</a>
                    ${isVIP ? `
                    <a href="#vip" class="user-menu-link">
                        <i class="fas fa-gem"></i>
                        הטבות VIP
                    </a>
                    ` : `
                    <a href="#" class="user-menu-link join-vip-btn">
                        <i class="fas fa-crown"></i>
                        הצטרף ל-VIP
                    </a>
                    `}
                </div>
            </div>
        `;
        
        $('.auth-links').html(userInfoHTML);
        
        // Show admin panel button if this is an admin user
        if (userData.isAdmin || email === ADMIN_EMAIL) {
            $('#admin-menu-item').show();
            
            // וידוא שכפתור המנהל עובד
            fixAdminButton();
        } else {
            $('#admin-menu-item').hide();
        }
        
        // Attach event handler for logout
        $('.logout-btn').on('click', function(e) {
            e.preventDefault();
            // Clear user data
            localStorage.removeItem('userData');
            // Reload the page to update UI
            location.reload();
        });
        
        // Attach event handler for VIP signup
        $('.join-vip-btn').on('click', function(e) {
            e.preventDefault();
            showVIPSignupForm();
        });
    } else {
        // User is logged out
        $('.auth-links').html(`
            <a href="#" class="show-login">התחברות</a>
            <a href="#" class="show-register">הרשמה</a>
        `);
        
        // Hide admin menu if user was admin
        isAdmin = false;
        $('#admin-menu-item').hide();
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
        
        // Immediately ensure we have a token to avoid 403 errors
        this.ensureGitHubToken();
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
            
            // Ensure we have a token before making API requests
            await this.ensureGitHubToken();
            
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/data/products.json`;
            
            // Show loading notification
            showNotification('טוען מוצרים מהשרת...', 'info');
            
            const headers = {
                'Accept': 'application/vnd.github.v3+json'
            };
            
            // Add authorization header if we have a token
            if (this.githubToken) {
                headers['Authorization'] = `token ${this.githubToken}`;
            }
            
            const response = await fetch(apiUrl, { headers });
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
                            } else {
                                console.warn('displayProductsOnHomepage function not found');
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
            const base64Content = btoa(unescape(encodeURIComponent(content)));
            
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

    // Get file SHA (needed for updating files)
    async getGitHubFileSha(path) {
        try {
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/${path}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                console.error(`Failed to get SHA for ${path}: ${response.status} ${response.statusText}`);
                return null;
            }
            
            const data = await response.json();
            return data.sha;
        } catch (error) {
            console.error(`Error getting SHA for ${path}:`, error);
            return null;
        }
    }

    // Update existing file in GitHub repository
    async updateGitHubFile(path, content, message, token, sha) {
        try {
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/${path}`;
            
            // Convert content to base64
            const base64Content = btoa(unescape(encodeURIComponent(content)));
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    content: base64Content,
                    sha: sha,
                    branch: 'main'
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`GitHub API error (${response.status}): ${response.statusText}`, errorData);
                return false;
            }
            
            console.log(`Updated GitHub file: ${path}`);
            return true;
        } catch (error) {
            console.error(`Error updating GitHub file ${path}:`, error);
            return false;
        }
    }

    // Create directory in GitHub
    async createGitHubDirectory(path, message, token) {
        try {
            // In GitHub, you create a directory by creating a file inside it
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/${path}/.gitkeep`;
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    content: 'Cg==', // Base64 for empty content
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

    // Save products to GitHub
    async saveProductsToGitHub() {
        try {
            console.log('Saving products to GitHub...');
            
            // Check for GitHub token
            const hasToken = await this.ensureGitHubToken();
            if (!hasToken) {
                showNotification('נדרש Token של GitHub כדי לשמור שינויים', 'error');
                return false;
            }
            
            // Prepare content to save
            const content = JSON.stringify(this.products, null, 2);
            
            // Check if data directory exists
            const dataDirectoryExists = await this.checkGitHubPath('data');
            
            if (!dataDirectoryExists) {
                // Create data directory first
                const dirCreated = await this.createGitHubDirectory('data', 'Create data directory', this.githubToken);
                if (!dirCreated) {
                    throw new Error('Failed to create data directory');
                }
            }
            
            // Check if products.json exists
            const fileExists = await this.checkGitHubPath('data/products.json');
            
            if (fileExists) {
                // Update existing file
                // Get the SHA of the existing file first
                const sha = await this.getGitHubFileSha('data/products.json');
                
                if (!sha) {
                    throw new Error('Failed to get file SHA');
                }
                
                // Update file with the SHA
                const updated = await this.updateGitHubFile(
                    'data/products.json', 
                    content, 
                    'Update products', 
                    this.githubToken, 
                    sha
                );
                
                if (!updated) {
                    throw new Error('Failed to update products file');
                }
            } else {
                // Create new file
                const created = await this.createGitHubFile(
                    'data/products.json', 
                    content, 
                    'Add products file', 
                    this.githubToken
                );
                
                if (!created) {
                    throw new Error('Failed to create products file');
                }
            }
            
            console.log('Products saved to GitHub successfully');
            // Save to localStorage as a backup
            localStorage.setItem('products', JSON.stringify(this.products));
            
            return true;
        } catch (error) {
            console.error('Error saving products to GitHub:', error);
            showNotification(`שגיאה בשמירה ל-GitHub: ${error.message}`, 'error');
            return false;
        }
    }

    // This is a proper UTF-8 safe base64 decoder
    base64ToUtf8(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    }

    // Add new method to get all categories
    getAllCategories() {
        return this.categories;
    }

    // Add new method to get a single category
    getCategory(categoryId) {
        return this.categories.find(category => category.id === categoryId);
    }

    // Add new method to add a category
    async addCategory(category) {
        // Generate a unique ID if not provided
        if (!category.id) {
            category.id = Date.now().toString();
        }
        
        // Add timestamp
        category.createdAt = new Date().toISOString();
        
        // Add the category to the array
        this.categories.push(category);
        
        // Save to GitHub
        const success = await this.saveCategoriesToGitHub();
        return success;
    }

    // Add new method to update a category
    async updateCategory(categoryId, updatedData) {
        const index = this.categories.findIndex(category => category.id === categoryId);
        
        if (index === -1) {
            return false;
        }
        
        // Update the category
        this.categories[index] = {
            ...this.categories[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };
        
        // Save to GitHub
        const success = await this.saveCategoriesToGitHub();
        return success;
    }

    // Add new method to delete a category
    async deleteCategory(categoryId) {
        const initialLength = this.categories.length;
        this.categories = this.categories.filter(category => category.id !== categoryId);
        
        if (initialLength === this.categories.length) {
            return false; // No category was deleted
        }
        
        // Save to GitHub
        const success = await this.saveCategoriesToGitHub();
        return success;
    }

    // Add new method to load categories from GitHub
    async loadCategoriesFromGitHub() {
        try {
            console.log('Loading categories from GitHub...');
            
            // Ensure we have GitHub token
            await this.ensureGitHubToken();
            
            const apiUrl = `https://api.github.com/repos/${this.githubUser}/${this.githubRepo}/contents/data/categories.json`;
            
            const headers = {
                'Accept': 'application/vnd.github.v3+json'
            };
            
            // Add token if we have it
            if (this.githubToken) {
                headers['Authorization'] = `token ${this.githubToken}`;
            }
            
            const response = await fetch(apiUrl, { headers });
            
            if (!response.ok) {
                // If file doesn't exist (404), create it with empty array
                if (response.status === 404) {
                    console.warn(`GitHub API error (${response.status}): ${response.statusText}`);
                    
                    // Create categories.json file on GitHub
                    console.log('Creating categories.json file on GitHub...');
                    const created = await this.saveCategoriesToGitHub();
                    
                    if (created) {
                        return true;
                    } else {
                        throw new Error('Failed to create categories.json file');
                    }
                } else {
                    throw new Error(`GitHub API error: ${response.status}`);
                }
            }
            
            const data = await response.json();
            
            // GitHub returns base64 encoded content - decode it properly for UTF-8
            const content = this.base64ToUtf8(data.content);
            this.categories = JSON.parse(content);
            
            console.log('Loaded categories from GitHub, count:', this.categories.length);
            
            // Save to localStorage as a backup
            localStorage.setItem('categories', JSON.stringify(this.categories));
            
            return true;
        } catch (error) {
            console.error('Error loading categories from GitHub:', error);
            
            // Try to load from localStorage as a fallback
            const localCategories = localStorage.getItem('categories');
            if (localCategories) {
                try {
                    this.categories = JSON.parse(localCategories);
                    console.log('Loaded categories from localStorage, count:', this.categories.length);
                    return true;
                } catch (e) {
                    console.error('Error parsing categories from localStorage:', e);
                }
            }
            
            // Initialize with empty array if all else fails
            this.categories = [];
            return false;
        }
    }

    // Add new method to save categories to GitHub
    async saveCategoriesToGitHub() {
        try {
            console.log('Saving categories to GitHub...');
            
            // Check for GitHub token
            const hasToken = await this.ensureGitHubToken();
            if (!hasToken) {
                showNotification('נדרש Token של GitHub כדי לשמור שינויים', 'error');
                return false;
            }
            
            // Prepare content to save
            const content = JSON.stringify(this.categories, null, 2);
            
            // Check if data directory exists
            const dataDirectoryExists = await this.checkGitHubPath('data');
            
            if (!dataDirectoryExists) {
                // Create data directory first
                const dirCreated = await this.createGitHubDirectory('data', 'Create data directory', this.githubToken);
                if (!dirCreated) {
                    throw new Error('Failed to create data directory');
                }
            }
            
            // Check if categories.json exists
            const fileExists = await this.checkGitHubPath('data/categories.json');
            
            if (fileExists) {
                // Update existing file
                // Get the SHA of the existing file first
                const sha = await this.getGitHubFileSha('data/categories.json');
                
                if (!sha) {
                    throw new Error('Failed to get file SHA');
                }
                
                // Update file with the SHA
                const updated = await this.updateGitHubFile(
                    'data/categories.json', 
                    content, 
                    'Update categories', 
                    this.githubToken, 
                    sha
                );
                
                if (!updated) {
                    throw new Error('Failed to update categories file');
                }
            } else {
                // Create new file
                const created = await this.createGitHubFile(
                    'data/categories.json', 
                    content, 
                    'Add categories file', 
                    this.githubToken
                );
                
                if (!created) {
                    throw new Error('Failed to create categories file');
                }
            }
            
            console.log('Categories saved to GitHub successfully');
            // Save to localStorage as a backup
            localStorage.setItem('categories', JSON.stringify(this.categories));
            
            return true;
        } catch (error) {
            console.error('Error saving categories to GitHub:', error);
            showNotification(`שגיאה בשמירה ל-GitHub: ${error.message}`, 'error');
            return false;
        }
    }

    // Get products by category name
    getProductsByCategory(categoryName) {
        if (!categoryName || !this.products || !this.products.length) {
            return [];
        }
        
        // Match by exact category name or slug
        return this.products.filter(product => 
            product.category === categoryName || 
            (product.categorySlug && product.categorySlug === categoryName)
        );
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
            $productsGrid.html(`<div class="error">שגיאה בטעינת מוצרים</div>`);
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
        
        // And add this to your displayProductsOnHomepage function
        console.log('Products grid HTML after update:', $productsGrid.html());
        
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

// FIXED: Improved admin panel implementation with proper event handling
function addAdminPanelToDOM() {
    // Check if admin panel already exists
    if (adminPanelInitialized || $('#admin-panel').length > 0) {
        console.log('Admin panel already exists, just attaching event handlers');
        attachAdminPanelEventHandlers();
        return;
    }
    
    adminPanelInitialized = true;
    console.log('Adding admin panel to DOM');
    
    // Create admin panel with the structure matching HTML/CSS
    const adminPanelHTML = `
    <div id="admin-panel" class="admin-panel">
        <div class="admin-panel-bg"></div>
        <div class="admin-panel-container">
            <div class="admin-panel-header">
                <h2>פאנל ניהול</h2>
                <button id="close-admin-panel" class="close-admin-panel"><i class="fas fa-times"></i></button>
            </div>
            <div class="admin-panel-sidebar">
                <ul>
                    <li class="admin-menu-item active" data-target="products-tab">
                        <i class="fas fa-box"></i> מוצרים
                    </li>
                    <li class="admin-menu-item" data-target="orders-tab">
                        <i class="fas fa-shopping-bag"></i> הזמנות
                    </li>
                    <li class="admin-menu-item" data-target="users-tab">
                        <i class="fas fa-users"></i> משתמשים
                    </li>
                    <li class="admin-menu-item" data-target="categories-tab">
                        <i class="fas fa-tags"></i> קטגוריות
                    </li>
                    <li class="admin-menu-item" data-target="settings-tab">
                        <i class="fas fa-cog"></i> הגדרות
                    </li>
                </ul>
            </div>
            <div class="admin-panel-content">
                <div id="products-tab" class="admin-tab active">
                    <h3>ניהול מוצרים</h3>
                    <div class="admin-actions">
                        <button id="add-product-btn" class="admin-btn">הוסף מוצר חדש</button>
                        <button id="refresh-products-btn" class="admin-btn">רענן מוצרים</button>
                    </div>
                    <div id="admin-products-grid" class="admin-products-grid">
                        <table>
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
                            <tbody id="products-table-body">
                                <tr>
                                    <td colspan="6" class="loading">טוען מוצרים...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div id="orders-tab" class="admin-tab">
                    <h3>ניהול הזמנות</h3>
                    <p>פונקציונליות זו תהיה זמינה בקרוב.</p>
                </div>
                <div id="users-tab" class="admin-tab">
                    <h3>ניהול משתמשים</h3>
                    <p>פונקציונליות זו תהיה זמינה בקרוב.</p>
                </div>
                <div id="categories-tab" class="admin-tab">
                    <h3>ניהול קטגוריות</h3>
                    <div class="admin-actions">
                        <button id="add-category-btn" class="admin-btn">הוסף קטגוריה חדשה</button>
                        <button id="refresh-categories-btn" class="admin-btn">רענן קטגוריות</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>שם קטגוריה</th>
                                <th>מספר מוצרים</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody id="categories-table-body">
                            <tr>
                                <td colspan="3" class="loading">טוען קטגוריות...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div id="settings-tab" class="admin-tab">
                    <h3>הגדרות האתר</h3>
                    <div class="form-group">
                        <label>שם האתר</label>
                        <input type="text" id="site-name" placeholder="שם האתר">
                    </div>
                    <div class="form-group">
                        <label>לוגו האתר</label>
                        <div class="logo-preview">
                            <img src="/api/placeholder/100/40" alt="Site Logo Preview">
                        </div>
                        <input type="file" id="site-logo">
                    </div>
                    <div class="form-group">
                        <label>צבע ראשי</label>
                        <input type="color" id="primary-color" value="#3498db">
                    </div>
                    <div class="form-group">
                        <label>צבע משני</label>
                        <input type="color" id="secondary-color" value="#2ecc71">
                    </div>
                    <button id="save-settings" class="admin-btn">שמור הגדרות</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    $('body').append(adminPanelHTML);
    
    // Attach event handlers
    attachAdminPanelEventHandlers();
}

// FIXED: Separate function for attaching event handlers to prevent duplication
function attachAdminPanelEventHandlers() {
    console.log('Attaching admin panel event handlers');
    
    // Close button
    $('#close-admin-panel').off('click').on('click', closeAdminPanel);
    
    // Admin panel menu item clicking (sidebar)
    $('.admin-menu-item').off('click').on('click', function() {
        $('.admin-menu-item').removeClass('active');
        $(this).addClass('active');
        
        const targetTab = $(this).data('target');
        $('.admin-tab').removeClass('active');
        $(`#${targetTab}`).addClass('active');
        
        // Load data for the selected tab if needed
        if (targetTab === 'products-tab') {
            loadAndDisplayAdminProducts();
        } else if (targetTab === 'categories-tab') {
            loadCategories();
        }
    });
    
    // Add product button
    $('#add-product-btn').off('click').on('click', function() {
        console.log('Add product button clicked');
        showProductForm();
    });
    
    // Refresh products button
    $('#refresh-products-btn').off('click').on('click', function() {
        loadAndDisplayAdminProducts();
    });
    
    // Add category button
    $('#add-category-btn').off('click').on('click', function() {
        console.log('Add category button clicked');
        showCategoryForm();
    });
    
    // Refresh categories button
    $('#refresh-categories-btn').off('click').on('click', function() {
        loadCategories();
    });
    
    // Save settings button
    $('#save-settings').off('click').on('click', function() {
        // Save settings logic here
        showNotification('ההגדרות נשמרו בהצלחה', 'success');
    });
}

// Helper function for admin panel
function addAdminMenuItemToNav() {
    // Check if user is admin
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    const isAdmin = userData && (userData.isAdmin || userData.email === ADMIN_EMAIL);
    
    console.log('Adding admin menu item, isAdmin:', isAdmin, 'email:', userData.email);
    
    // Check if admin menu item already exists
    if ($('#admin-menu-item').length > 0) {
        // Update the click handler and visibility
        if (isAdmin) {
            $('#admin-menu-item').show();
            console.log('Admin menu item exists and shown');
            $('#admin-menu-item a').off('click').on('click', function(e) {
                e.preventDefault();
                openAdminPanel();
                return false;
            });
        } else {
            $('#admin-menu-item').hide();
            console.log('Admin menu item exists but hidden (not admin)');
        }
        return; // Already exists
    }
    
    // Admin menu item doesn't exist, add it to main navigation
    $('.main-nav').append('<li id="admin-menu-item" class="menu-item"><a href="#" class="admin-panel-btn">פאנל ניהול</a></li>');
    
    // Show if admin and add click handler
    if (isAdmin) {
        $('#admin-menu-item').show();
        console.log('New admin menu item added and shown');
    } else {
        $('#admin-menu-item').hide();
        console.log('New admin menu item added but hidden (not admin)');
    }
    
    $('#admin-menu-item a').on('click', function(e) {
        e.preventDefault();
        openAdminPanel();
        return false;
    });
    
    // Add some styling
    $('#admin-menu-item').css({
        'display': isAdmin ? 'block' : 'none',
        'cursor': 'pointer'
    });
}

// Function to open the admin panel
function openAdminPanel() {
    console.log('Opening admin panel...');
    
    // Make sure admin panel elements exist and attach handlers
    if (!adminPanelInitialized) {
        addAdminPanelToDOM();
    }
    
    $('#admin-panel').addClass('active');
    
    // Check if productManager exists and initialize it if needed
    if (typeof productManager === 'undefined' || !productManager) {
        console.log('Creating new ProductManager instance...');
        window.productManager = new ProductManager();
    }
    
    // Clear any previous content and show loading state
    $('#products-table-body').html('<tr><td colspan="6" class="loading">טוען מוצרים...</td></tr>');
    
    // Load and display products in admin panel
    console.log('Loading products from GitHub...');
    setTimeout(() => {
        loadAndDisplayAdminProducts();
    }, 500);
    
    // Also load categories
    loadCategories();
}

// Function to close the admin panel
function closeAdminPanel() {
    $('#admin-panel').removeClass('active');
}

// Function to load categories
function loadCategories() {
    console.log('Loading categories...');
    
    // Use the ProductManager to load categories from GitHub
    productManager.loadCategoriesFromGitHub().then(success => {
        if (success) {
            // Update both admin panel and site menu
            displayCategories(productManager.getAllCategories());
            displayCategoriesInMainMenu(productManager.getAllCategories());
        } else {
            showNotification('שגיאה בטעינת קטגוריות', 'error');
            // Display empty categories list
            displayCategories([]);
        }
    });
}

// Function to display categories in the admin panel
function displayCategories(categories) {
    let categoriesHTML = '';
    
    if (categories.length === 0) {
        categoriesHTML = '<tr><td colspan="3" class="empty">אין קטגוריות להצגה</td></tr>';
    } else {
        categories.forEach(category => {
            // Count products in this category
            const productsInCategory = productManager.products.filter(
                product => product.category === category.name
            ).length;
            
            categoriesHTML += `
                <tr>
                    <td>${category.name}</td>
                    <td>${productsInCategory}</td>
                    <td>
                        <button class="action-btn edit-category-btn" data-id="${category.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn delete-category-btn" data-id="${category.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    $('#categories-table-body').html(categoriesHTML);
    
    // Attach handlers to the category action buttons
    $('.edit-category-btn').off('click').on('click', function() {
        const categoryId = $(this).data('id');
        editCategory(categoryId);
    });
    
    $('.delete-category-btn').off('click').on('click', function() {
        const categoryId = $(this).data('id');
        const category = productManager.getCategory(categoryId);
        if (confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה "${category.name}"?`)) {
            deleteCategory(categoryId);
        }
    });
}

// Function to show category form
function showCategoryForm(categoryId = null) {
    // Find category if editing
    const category = categoryId ? productManager.getCategory(categoryId) : null;
    
    // Create modal form
    const formHTML = `
    <div id="category-form-modal" class="admin-modal active">
        <div class="admin-modal-bg"></div>
        <div class="admin-modal-container">
            <div class="admin-modal-header">
                <h3>${category ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}</h3>
                <button class="close-admin-modal"><i class="fas fa-times"></i></button>
            </div>
            <form id="category-form" class="admin-form">
                <div class="form-group">
                    <label for="category-name">שם הקטגוריה</label>
                    <input type="text" id="category-name" value="${category ? category.name : ''}" required>
                </div>
                <div class="form-group">
                    <label for="category-description">תיאור הקטגוריה</label>
                    <textarea id="category-description" rows="3">${category && category.description ? category.description : ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="category-slug">מזהה בכתובת URL (slug)</label>
                    <input type="text" id="category-slug" value="${category && category.slug ? category.slug : ''}" placeholder="לדוגמה: electronic-products">
                    <small>אותיות לטיניות ומקפים בלבד, ללא רווחים</small>
                </div>
                <div class="form-group">
                    <label for="category-icon">אייקון</label>
                    <select id="category-icon">
                        <option value="fas fa-leaf" ${category && category.icon === 'fas fa-leaf' ? 'selected' : ''}>צמח</option>
                        <option value="fas fa-seedling" ${category && category.icon === 'fas fa-seedling' ? 'selected' : ''}>שתיל</option>
                        <option value="fas fa-lightbulb" ${category && category.icon === 'fas fa-lightbulb' ? 'selected' : ''}>תאורה</option>
                        <option value="fas fa-water" ${category && category.icon === 'fas fa-water' ? 'selected' : ''}>מים/השקיה</option>
                        <option value="fas fa-flask" ${category && category.icon === 'fas fa-flask' ? 'selected' : ''}>דשנים</option>
                        <option value="fas fa-fan" ${category && category.icon === 'fas fa-fan' ? 'selected' : ''}>מאווררים</option>
                        <option value="fas fa-thermometer-half" ${category && category.icon === 'fas fa-thermometer-half' ? 'selected' : ''}>טמפרטורה</option>
                        <option value="fas fa-tools" ${category && category.icon === 'fas fa-tools' ? 'selected' : ''}>כלים</option>
                        <option value="fas fa-smoking" ${category && category.icon === 'fas fa-smoking' ? 'selected' : ''}>עישון</option>
                        <option value="fas fa-box" ${category && category.icon === 'fas fa-box' ? 'selected' : ''}>אחסון</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="category-image">תמונת רקע לקטגוריה (URL)</label>
                    <input type="text" id="category-image" value="${category && category.image ? category.image : '/api/placeholder/400/300'}" placeholder="כתובת URL של תמונה">
                    <small>השאר ריק לשימוש בתמונת ברירת מחדל</small>
                </div>
                <div class="form-group">
                    <label>צבע רקע (hex)</label>
                    <input type="color" id="category-bg-color" value="${category && category.bgColor ? category.bgColor : '#1a1d21'}">
                </div>
                <div class="form-group">
                    <label>צבע טקסט (hex)</label>
                    <input type="color" id="category-text-color" value="${category && category.textColor ? category.textColor : '#ffffff'}">
                </div>
                <div class="form-group">
                    <label for="category-order">סדר הצגה</label>
                    <input type="number" id="category-order" value="${category && category.order ? category.order : '0'}">
                    <small>קטגוריות עם מספר נמוך יותר יוצגו קודם</small>
                </div>
                <div class="form-group">
                    <label for="category-column-layout">פריסת עמודות במסך הקטגוריה</label>
                    <select id="category-column-layout">
                        <option value="1" ${category && category.columnLayout === '1' ? 'selected' : ''}>עמודה אחת (מתאים למסכים קטנים)</option>
                        <option value="2" ${category && category.columnLayout === '2' ? 'selected' : ''}>שתי עמודות</option>
                        <option value="3" ${category && category.columnLayout === '3' ? 'selected' : ''}>שלוש עמודות</option>
                        <option value="4" ${category && category.columnLayout === '4' ? 'selected' : ''}>ארבע עמודות</option>
                        <option value="masonry" ${category && category.columnLayout === 'masonry' ? 'selected' : ''}>פריסת Masonry (בלוקים)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="category-featured">
                        <input type="checkbox" id="category-featured" ${category && category.featured ? 'checked' : ''}>
                        הצג בעמוד הבית
                    </label>
                </div>
                <div class="form-group">
                    <label for="category-vip-only">
                        <input type="checkbox" id="category-vip-only" ${category && category.vipOnly ? 'checked' : ''}>
                        קטגוריה בלעדית לחברי VIP
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="admin-btn">${category ? 'עדכן קטגוריה' : 'הוסף קטגוריה'}</button>
                    <button type="button" class="admin-btn cancel-btn">ביטול</button>
                </div>
            </form>
        </div>
    </div>
    `;
    
    $('body').append(formHTML);
    
    // Auto-generate slug from name
    $('#category-name').on('input', function() {
        const name = $(this).val();
        if (!name) return;
        
        // Only auto-generate if slug field is empty or hasn't been manually edited
        const currentSlug = $('#category-slug').val();
        if (!currentSlug || currentSlug === generateSlug($(this).val())) {
            $('#category-slug').val(generateSlug(name));
        }
    });
    
    // Helper function to generate slug
    function generateSlug(text) {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')       // Replace spaces with -
            .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
            .replace(/\-\-+/g, '-')     // Replace multiple - with single -
            .replace(/^-+/, '')         // Trim - from start of text
            .replace(/-+$/, '');        // Trim - from end of text
    }
    
    // Attach event handlers
    $('.close-admin-modal, .cancel-btn').on('click', function() {
        $('#category-form-modal').remove();
    });
    
    $('#category-form').on('submit', function(e) {
        e.preventDefault();
        
        const name = $('#category-name').val();
        const description = $('#category-description').val();
        const slug = $('#category-slug').val() || generateSlug(name);
        const icon = $('#category-icon').val();
        const image = $('#category-image').val();
        const bgColor = $('#category-bg-color').val();
        const textColor = $('#category-text-color').val();
        const order = parseInt($('#category-order').val()) || 0;
        const featured = $('#category-featured').is(':checked');
        const vipOnly = $('#category-vip-only').is(':checked');
        const columnLayout = $('#category-column-layout').val();
        
        const categoryData = {
            name,
            description,
            slug,
            icon,
            image,
            bgColor,
            textColor,
            order,
            featured,
            vipOnly,
            columnLayout,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        
        if (category) {
            // Update existing category
            categoryData.id = category.id;
            categoryData.created = category.created; // Preserve original creation date
            
            productManager.updateCategory(category.id, categoryData).then(success => {
                if (success) {
                    showNotification(`הקטגוריה "${name}" עודכנה בהצלחה`, 'success');
                    loadCategories(); // Reload categories list and update menu
                    
                    // Update category page in GitHub
                    updateCategoryPage(categoryData).then(() => {
                        // Force refresh the categories in the main menu
                        displayCategoriesInMainMenu(productManager.getAllCategories());
                    });
                } else {
                    showNotification('שגיאה בעדכון הקטגוריה', 'error');
                }
            });
        } else {
            // Add new category
            // Generate a unique ID
            categoryData.id = 'cat_' + Date.now() + Math.floor(Math.random() * 1000);
            
            productManager.addCategory(categoryData).then(success => {
                if (success) {
                    showNotification(`הקטגוריה "${name}" נוספה בהצלחה`, 'success');
                    loadCategories(); // Reload categories list and update menu
                    
                    // Create category page file in GitHub
                    createCategoryPage(categoryData).then(() => {
                        // Force refresh the categories in the main menu
                        displayCategoriesInMainMenu(productManager.getAllCategories());
                    });
                } else {
                    showNotification('שגיאה בהוספת הקטגוריה', 'error');
                }
            });
        }
        
        $('#category-form-modal').remove();
    });
}

// Function to edit category
function editCategory(categoryId) {
    showCategoryForm(categoryId);
}

// Function to delete category
function deleteCategory(categoryId) {
    productManager.deleteCategory(categoryId).then(success => {
        if (success) {
            const category = productManager.getCategory(categoryId) || { name: 'הקטגוריה' };
            showNotification(`הקטגוריה "${category.name}" נמחקה בהצלחה`, 'success');
            loadCategories(); // Reload categories list
        } else {
            showNotification('שגיאה במחיקת הקטגוריה', 'error');
        }
    });
}

// Function to create a category page file in GitHub
async function createCategoryPage(categoryData) {
    try {
        console.log('Creating category page for:', categoryData.name);
        const { name, slug } = categoryData;
        const safeName = slug || name.replace(/\s+/g, '-').toLowerCase().replace(/[^\w\-]/g, '');
        const path = `category-${safeName}.html`;
        
        // Check if file already exists to prevent duplicates
        try {
            const fileExists = await productManager.checkGitHubPath(path);
            if (fileExists) {
                console.log(`Category page already exists: ${path}, updating instead`);
                // Get the SHA of existing file for update
                const existingFile = await productManager.getGitHubFileSha(path);
                if (existingFile) {
                    // Generate updated content
                    const content = createCategoryPageContent(categoryData);
                    // Update existing file
                    await productManager.updateGitHubFile(
                        path,
                        content,
                        `Update category page for ${name}`,
                        productManager.githubToken,
                        existingFile
                    );
                    console.log(`Category page updated successfully: ${path}`);
                    showNotification(`דף הקטגוריה "${name}" עודכן בהצלחה`, 'success');
                    return true;
                }
            }
        } catch (error) {
            console.log('File does not exist yet, creating new one:', error);
        }
        
        // Generate the content using the helper function
        const content = createCategoryPageContent(categoryData);
        
        // Add page to GitHub
        const message = `Create category page for ${name}`;
        await productManager.createGitHubFile(path, content, message, productManager.githubToken);
        
        console.log(`Category page created successfully: ${path}`);
        showNotification(`דף הקטגוריה "${name}" נוצר בהצלחה`, 'success');
        
        // Also update categories list file
        await updateCategoriesListFile(categoryData);
        
        return true;
    } catch (error) {
        console.error('Error creating category page:', error);
        showNotification(`שגיאה ביצירת דף הקטגוריה: ${error.message}`, 'error');
        return false;
    }
}

// Function to update an existing category page
async function updateCategoryPage(categoryData) {
    try {
        const { name, slug, id } = categoryData;
        const safeName = slug || name.replace(/\s+/g, '-').toLowerCase().replace(/[^\w\-]/g, '');
        const path = `data/categories/${safeName}.html`;
        
        // Check if the file exists
        const fileExists = await productManager.checkGitHubFile(path);
        
        if (fileExists) {
            // Update existing file
            const existingFile = await productManager.getGitHubFile(path);
            const updatedContent = createCategoryPageContent(categoryData, existingFile);
            
            await productManager.updateGitHubFile(
                path,
                updatedContent,
                `Update category page for: ${name}`,
                productManager.githubToken,
                existingFile.sha
            );
        } else {
            // Create new file
            createCategoryPage(categoryData);
        }
        
        // Update the categories list file
        await updateCategoriesListFile(categoryData);
        
    } catch (error) {
        console.error('Error updating category page:', error);
        showNotification('שגיאה בעדכון דף הקטגוריה', 'error');
    }
}

// Function to update the categories list file (for nav menus, etc.)
async function updateCategoriesListFile(categoryData) {
    try {
        console.log('Updating categories list file with data:', categoryData);
        const path = 'categories.json';
        let categories = [];
        
        // Try to get existing categories file
        try {
            const existingFile = await productManager.getGitHubFileSha(path);
            if (existingFile) {
                // Get the actual content
                const fileContent = await productManager.base64ToUtf8(
                    await fetch(`https://api.github.com/repos/${productManager.githubUsername}/${productManager.githubRepo}/contents/${path}?ref=${productManager.githubBranch}`)
                    .then(res => res.json())
                    .then(data => data.content)
                );
                if (fileContent) {
                    categories = JSON.parse(fileContent);
                    console.log('Loaded existing categories:', categories);
                }
            }
        } catch (error) {
            console.log('No existing categories file or error loading it, creating new one:', error);
        }
        
        // Find if the category already exists
        const existingIndex = categories.findIndex(c => c.id === categoryData.id);
        
        if (existingIndex >= 0) {
            // Update existing category
            categories[existingIndex] = categoryData;
        } else {
            // Add new category
            categories.push(categoryData);
        }
        
        // Sort by order
        categories.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Save to GitHub
        const content = JSON.stringify(categories, null, 2);
        const message = `Update categories list`;
        
        try {
            const fileSha = await productManager.getGitHubFileSha(path);
            if (fileSha) {
                // Update existing file
                await productManager.updateGitHubFile(
                    path,
                    content,
                    message,
                    productManager.githubToken,
                    fileSha
                );
            } else {
                // Create new file
                await productManager.createGitHubFile(
                    path,
                    content,
                    message,
                    productManager.githubToken
                );
            }
            console.log('Categories list file updated successfully');
            
            // Update the categories in the ProductManager object
            productManager.categories = categories;
            
            // Force a reload of categories in the menu
            displayCategoriesInMainMenu(categories);
            
            return true;
        } catch (error) {
            console.error('Error saving categories list:', error);
            return false;
        }
    } catch (error) {
        console.error('Error updating categories list:', error);
        return false;
    }
}

// Helper function to create content for a category page
function createCategoryPageContent(categoryData, existingFile = null) {
    const { name, description, icon, slug, columnLayout, vipOnly, bgColor, textColor, image } = categoryData;
    const safeName = slug || name.replace(/\s+/g, '-').toLowerCase().replace(/[^\w\-]/g, '');
    
    return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - Doctor Instraction</title>
    <meta name="description" content="${description || `מוצרי ${name} באיכות גבוהה`}">
    <meta property="og:title" content="${name} - Doctor Instraction">
    <meta property="og:description" content="${description || `מוצרי ${name} באיכות גבוהה`}">
    <meta property="og:image" content="${image || 'images/logo.png'}">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="fix.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.css">
    <style>
        /* Fix for page structure */
        html, body {
            overflow-x: hidden !important;
            max-width: 100% !important;
            width: 100% !important;
        }
        
        .category-banner {
            background-color: ${bgColor || '#1a1d21'};
            color: ${textColor || '#ffffff'};
            padding: 40px 0;
            margin-bottom: 30px;
            text-align: center;
            max-width: 100%;
            overflow: hidden;
            position: relative;
        }
        
        .category-banner h1 {
            font-size: 2.5rem;
            margin-bottom: 15px;
        }
        
        .category-banner p {
            font-size: 1.2rem;
            max-width: 800px;
            margin: 0 auto;
        }
        
        /* Products grid with fixed layout */
        .category-products-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important;
            gap: 20px !important;
            margin-top: 30px !important;
            max-width: 100% !important;
            padding: 0 20px !important;
            box-sizing: border-box !important;
        }
        
        .category-products-controls {
            display: flex !important;
            justify-content: space-between !important;
            margin-bottom: 20px !important;
            flex-wrap: wrap !important;
            padding: 0 20px !important;
        }
        
        .category-filters {
            display: flex !important;
            gap: 10px !important;
            margin-bottom: 15px !important;
        }
        
        .filter-btn {
            padding: 8px 15px !important;
            background: #2d3035 !important;
            border: none !important;
            border-radius: 5px !important;
            color: #e0e0e0 !important;
            cursor: pointer !important;
            transition: all 0.3s !important;
        }
        
        .filter-btn.active, .filter-btn:hover {
            background: #ff3a6b !important;
            color: white !important;
        }
        
        .category-sorting {
            display: flex !important;
            align-items: center !important;
        }
        
        .sort-select {
            padding: 8px 15px !important;
            background: #2d3035 !important;
            border: none !important;
            border-radius: 5px !important;
            color: #e0e0e0 !important;
            cursor: pointer !important;
        }
        
        .empty-category {
            text-align: center !important;
            padding: 40px !important;
            font-size: 1.2rem !important;
            color: #666 !important;
            background: #f5f5f5 !important;
            border-radius: 10px !important;
        }
        
        /* Fix footer */
        .footer-column {
            margin-bottom: 20px !important;
        }
        
        /* Mobile Responsive */
        @media (max-width: 992px) {
            .category-products-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
            
            .category-products-controls {
                flex-direction: column !important;
                align-items: flex-start !important;
            }
            
            .category-sorting {
                margin-top: 15px !important;
            }
        }
        
        @media (max-width: 576px) {
            .category-products-grid {
                grid-template-columns: 1fr !important;
            }
            
            .category-banner h1 {
                font-size: 2rem !important;
            }
        }
    </style>
</head>
<body class="category-page" data-category="${safeName}" data-vip-only="${vipOnly ? 'true' : 'false'}">
    <!-- Header section - we include the header from index.html -->
    <!-- Top Bar -->
    <div class="top-bar">
        <div class="container">
            <div class="top-bar-content">
                <div class="contact-info">
                    <a href="tel:+972501234567"><i class="fas fa-phone-alt"></i> 050-1234567</a>
                    <a href="mailto:info@doctor-instraction.com"><i class="fas fa-envelope"></i> info@doctor-instraction.com</a>
                </div>
                <div class="social-links">
                    <a href="#"><i class="fab fa-facebook-f"></i></a>
                    <a href="#"><i class="fab fa-instagram"></i></a>
                    <a href="#"><i class="fab fa-telegram"></i></a>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Main Header -->
    <header class="main-header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <a href="index.html">
                        <img src="logo.png" alt="Doctor Instraction">
                    </a>
                </div>
                
                <div class="header-right">
                    <div class="header-actions">
                        <div class="header-search">
                            <i class="fas fa-search"></i>
                        </div>
                        <div class="header-cart">
                            <i class="fas fa-shopping-cart"></i>
                            <span class="badge">0</span>
                        </div>
                        <div class="header-icon">
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                    
                    <form class="search-form">
                        <input type="text" placeholder="חיפוש מוצרים...">
                        <button type="submit"><i class="fas fa-search"></i></button>
                    </form>
                    
                    <div class="auth-links">
                        <a href="#" class="show-login">התחברות</a>
                        <a href="#" class="show-register">הרשמה</a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Header Bottom with Improved Navigation -->
        <div class="header-bottom">
            <div class="container">
                <nav class="improved-nav" aria-label="תפריט ראשי">
                    <ul class="main-nav">
                        <li class="menu-item"><a href="index.html">דף הבית</a></li>
                        <li class="menu-item menu-item-has-children">
                            <a href="#" class="has-submenu">קטגוריות<span class="drop-indicator"><i class="fas fa-caret-down"></i></span></a>
                            <ul class="sub-menu">
                                <!-- Categories will be loaded dynamically -->
                            </ul>
                        </li>
                        <li class="menu-item menu-item-has-children">
                            <a href="#" class="has-submenu">גלגול<span class="drop-indicator"><i class="fas fa-caret-down"></i></span></a>
                            <ul class="sub-menu">
                                <li class="dropdown-link"><a href="#" class="dropdown-link-a">ניירות גלגול</a></li>
                                <li class="dropdown-link"><a href="#" class="dropdown-link-a">פילטרים</a></li>
                                <li class="dropdown-link"><a href="#" class="dropdown-link-a">מגלגלות</a></li>
                                <li class="dropdown-link"><a href="#" class="dropdown-link-a">ערכות גלגול</a></li>
                            </ul>
                        </li>
                        <li class="menu-item"><a href="#">עלינו</a></li>
                        <li class="menu-item"><a href="#">צור קשר</a></li>
                        <li class="menu-item"><a href="#">המדריך השלם</a></li>
                        <li class="menu-item" id="admin-menu-item" style="display: none;"><a href="#" class="admin-panel-btn">פאנל ניהול</a></li>
                    </ul>
                </nav>
            </div>
        </div>
    </header>
    
    <main>
        <div class="category-banner">
            <div class="container">
                <h1><i class="${icon || 'fas fa-leaf'}"></i> ${name}</h1>
                <p>${description || `ברוכים הבאים לקטגוריית ${name}`}</p>
            </div>
        </div>
        
        <div class="category-products">
            <div class="container">
                <div class="category-products-controls">
                    <div class="category-filters">
                        <button class="filter-btn active" data-filter="all">הכל</button>
                        <button class="filter-btn" data-filter="new">חדש</button>
                        <button class="filter-btn" data-filter="sale">מבצע</button>
                        
                    </div>
                    
                    <div class="category-sorting">
                        <select class="sort-select">
                            <option value="recommended">מומלצים</option>
                            <option value="price-low">מחיר: מהנמוך לגבוה</option>
                            <option value="price-high">מחיר: מהגבוה לנמוך</option>
                            <option value="newest">חדשים ביותר</option>
                        </select>
                    </div>
                </div>
                
                <div class="category-products-grid" id="category-products-container">
                    <!-- Products will be loaded here via JavaScript -->
                    <div class="empty-category">טוען מוצרים...</div>
                </div>
            </div>
        </div>
    </main>
    
    <!-- Footer Section -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-column">
                    <h3>אודות</h3>
                    <p>Doctor Instraction מציע מוצרים איכותיים מהארץ ומהעולם. המקום שלכם לחוויית קנייה מושלמת.</p>
                    <div class="footer-social">
                        <a href="#"><i class="fab fa-facebook-f"></i></a>
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fab fa-telegram"></i></a>
                    </div>
                </div>
                
                <div class="footer-column">
                    <h3>ניווט מהיר</h3>
                    <ul class="footer-links">
                        <li><a href="index.html">דף הבית</a></li>
                        <li><a href="#">מדריכים</a></li>
                        <li><a href="#">בלוג</a></li>
                        <li><a href="#">צור קשר</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h3>מדיניות</h3>
                    <ul class="footer-links">
                        <li><a href="#">תנאי שימוש</a></li>
                        <li><a href="#">מדיניות פרטיות</a></li>
                        <li><a href="#">מדיניות משלוחים</a></li>
                        <li><a href="#">תקנון החנות</a></li>
                    </ul>
                </div>
                
                <div class="footer-column">
                    <h3>צור קשר</h3>
                    <ul class="footer-contact">
                        <li><i class="fas fa-map-marker-alt"></i> רחוב הראשי 123, תל אביב</li>
                        <li><i class="fas fa-phone"></i> 050-1234567</li>
                        <li><i class="fas fa-envelope"></i> info@doctor-instraction.com</li>
                        <li><i class="fas fa-clock"></i> א'-ה' 09:00-18:00</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>© 2023 Doctor Instraction. כל הזכויות שמורות.</p>
                <div class="payment-methods">
                    <i class="fab fa-cc-visa"></i>
                    <i class="fab fa-cc-mastercard"></i>
                    <i class="fab fa-paypal"></i>
                    <i class="fab fa-bitcoin"></i>
                </div>
            </div>
        </div>
    </footer>
    
    <!-- JavaScript Libraries -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
    <script src="script.js"></script>
    <script>
        $(document).ready(function() {
            if (typeof productManager === 'undefined') {
                window.productManager = new ProductManager();
            }
            
            // Check user login status
            checkUserLogin();
            
            // Load products for this category
            loadCategoryProducts("${name}");
            
            // Style registration button
            styleRegisterButton();
            
            // Initialize product filters
            $('.filter-btn').on('click', function() {
                $('.filter-btn').removeClass('active');
                $(this).addClass('active');
                
                const filter = $(this).data('filter');
                // Here would go the actual filtering logic
                // For demo purposes, we'll just reload products
                loadCategoryProducts("${name}", filter);
            });
            
            // Initialize sorting
            $('.sort-select').on('change', function() {
                const sortValue = $(this).val();
                loadCategoryProducts("${name}", $('.filter-btn.active').data('filter'), sortValue);
            });
            
            // VIP protection
            if (${vipOnly ? 'true' : 'false'}) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                if (!userData || !userData.isVIP) {
                    // Redirect if not VIP
                    window.location.href = 'index.html?error=vip_required';
                }
            }
            
            // Load and display categories in main menu
            loadCategories();
            
            // Fix categories dropdown menu
            fixCategoriesMenu();
        });
        
        // Function to load products for this category
        function loadCategoryProducts(categoryName, filter = 'all', sort = 'recommended') {
            console.log('Loading products for category:', categoryName, 'filter:', filter, 'sort:', sort);
            
            productManager.loadProductsFromGitHub().then(success => {
                if (success) {
                    // Filter products by category
                    let products = productManager.products.filter(p => p.category === categoryName);
                    
                    console.log('Found products:', products.length, products);
                    
                    // Apply additional filter if needed
                    if (filter !== 'all') {
                        if (filter === 'new') {
                            products = products.filter(p => p.badge === 'new');
                        } else if (filter === 'sale') {
                            products = products.filter(p => p.badge === 'sale');
                        } else if (filter === 'vip') {
                            products = products.filter(p => p.vipOnly);
                        }
                    }
                    
                    // Sort products
                    if (sort === 'price-low') {
                        products.sort((a, b) => a.price - b.price);
                    } else if (sort === 'price-high') {
                        products.sort((a, b) => b.price - a.price);
                    } else if (sort === 'newest') {
                        products.sort((a, b) => new Date(b.created) - new Date(a.created));
                    }
                    
                    // Display products
                    displayCategoryProducts(products);
                } else {
                    $('#category-products-container').html('<div class="empty-category">שגיאה בטעינת מוצרים</div>');
                }
            });
        }
        
        // Function to display products in the category page
        function displayCategoryProducts(products) {
            const $container = $('#category-products-container');
            
            if (!products || products.length === 0) {
                $container.html('<div class="empty-category">אין מוצרים בקטגוריה זו עדיין</div>');
                return;
            }
            
            // Build HTML for products
            let productsHTML = '';
            
            products.forEach(product => {
                // Get the VIP price if available
                const vipPrice = product.vipPrice || (product.price * 0.9);
                const isVIP = JSON.parse(localStorage.getItem('userData') || '{}').isVIP;
                
                // Determine which price to show
                const displayPrice = isVIP ? vipPrice : product.price;
                const oldPrice = isVIP ? product.price : null;
                
                // Build the product card
                productsHTML += \`
                    <div class="product-card" data-id="\${product.id}">
                        <div class="product-image" style="background-image: url('\${product.image || 'images/product-placeholder.jpg'}');">
                            \${product.badge ? \`<span class="product-badge \${product.badge}">\${getBadgeText(product.badge)}</span>\` : ''}
                            <div class="product-actions">
                                <button class="action-btn quick-view-btn" data-id="\${product.id}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-btn add-to-cart-btn" data-id="\${product.id}">
                                    <i class="fas fa-shopping-cart"></i>
                                </button>
                                <button class="action-btn add-to-wishlist-btn" data-id="\${product.id}">
                                    <i class="fas fa-heart"></i>
                                </button>
                            </div>
                        </div>
                        <div class="product-content">
                            <div class="product-category">\${product.category || 'כללי'}</div>
                            <h3 class="product-title">
                                <a href="product-\${product.slug}.html">\${product.name}</a>
                            </h3>
                            <div class="product-rating">
                                \${getRatingStars(product.rating || 5)}
                            </div>
                            <div class="product-price">
                                \${oldPrice ? \`<span class="old-price">\${oldPrice.toFixed(2)} ₪</span>\` : ''}
                                <span class="current-price">\${displayPrice.toFixed(2)} ₪</span>
                            </div>
                        </div>
                    </div>
                \`;
            });
            
            // Add products to container
            $container.html(productsHTML);
            
            // Attach event handlers to product card buttons
            initializeProductCards();
        }
    </script>
</body>
</html>
`;
}

// Add admin styles if not already in the document
function addAdminStyles() {
    if ($('#admin-styles').length === 0) {
        const adminStyles = `
        <style id="admin-styles">
            /* Admin panel custom styles (beyond what's in HTML) */
            .admin-panel table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            
            .admin-panel th, .admin-panel td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: right;
            }
            
            .admin-panel th {
                background-color: #f5f5f5;
                font-weight: 600;
            }
            
            .admin-panel tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            
            .admin-panel tr:hover {
                background-color: #f1f1f1;
            }
            
            .action-btn {
                background: none;
                border: none;
                color: #3498db;
                margin-right: 5px;
                cursor: pointer;
            }
            
            .delete-btn {
                color: #e74c3c;
            }
            
            .admin-btn {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.3s;
                margin-right: 5px;
            }
            
            .admin-btn:hover {
                background-color: #2980b9;
            }
            
            .admin-tab h3 {
                margin-top: 0;
                margin-bottom: 20px;
            }
            
            .admin-actions {
                margin-bottom: 20px;
                display: flex;
                gap: 10px;
            }
            
            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }
            
            .loading, .empty, .error {
                text-align: center;
                padding: 20px;
                color: #888;
            }
            
            .error {
                color: #e74c3c;
            }
            
            /* Admin modal styles */
            .admin-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 3100;
                direction: rtl;
            }
            
            .admin-modal.active {
                display: block;
            }
        </style>
        `;
        $('head').append(adminStyles);
    }
}

// Add styles for product form
function addProductFormStyles() {
    if ($('#product-form-styles').length === 0) {
        const styles = `
        <style id="product-form-styles">
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1001;
                direction: rtl;
            }
            
            .modal-content {
                background-color: white;
                border-radius: 5px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                border-bottom: 1px solid #eee;
            }
            
            .modal-body {
                padding: 15px;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            
            .form-group input, .form-group select, .form-group textarea {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .form-group textarea {
                min-height: 100px;
            }
            
            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
            }
        </style>
        `;
        $('head').append(styles);
    }
}

// Function to load and display products in admin panel
function loadAndDisplayAdminProducts() {
    console.log('loadAndDisplayAdminProducts called');
    
    // Check if productManager exists
    if (typeof productManager === 'undefined' || !productManager) {
        console.error('ProductManager not initialized!');
        $('#products-table-body').html('<tr><td colspan="6" class="error">מנהל המוצרים לא מאותחל</td></tr>');
        
        // Try to initialize it
        try {
            console.log('Attempting to initialize ProductManager...');
            window.productManager = new ProductManager();
        } catch (e) {
            console.error('Failed to initialize ProductManager:', e);
            return;
        }
    }
    
    $('#products-table-body').html('<tr><td colspan="6" class="loading">טוען מוצרים...</td></tr>');
    
    console.log('Calling loadProductsFromGitHub...');
    
    // Load products from GitHub with better error handling
    productManager.loadProductsFromGitHub()
        .then(success => {
            console.log('loadProductsFromGitHub result:', success);
            if (success) {
                console.log('Products loaded, displaying in admin panel...');
                const products = productManager.getAllProducts();
                console.log('Number of products loaded:', products ? products.length : 0);
                displayProductsInAdminPanel();
            } else {
                console.error('Failed to load products from GitHub');
                $('#products-table-body').html('<tr><td colspan="6" class="error">שגיאה בטעינת מוצרים</td></tr>');
            }
        })
        .catch(error => {
            console.error('Error in loadProductsFromGitHub:', error);
            $('#products-table-body').html(`<tr><td colspan="6" class="error">שגיאה בטעינת מוצרים: ${error.message}</td></tr>`);
        });
}

// Function to display products in admin panel
function displayProductsInAdminPanel() {
    console.log('displayProductsInAdminPanel called');
    const products = productManager.getAllProducts();
    console.log('Products to display:', products ? products.length : 0);
    
    if (!products || products.length === 0) {
        console.warn('No products to display in admin panel');
        $('#products-table-body').html('<tr><td colspan="6" class="empty">אין מוצרים להצגה</td></tr>');
        return;
    }
    
    let productsHTML = '';
    
    // Debug info about the products
    for (let i = 0; i < products.length; i++) {
        let product = products[i];
        console.log(`Product ${i+1}:`, product.id, product.name, product.price);
    }
    
    products.forEach((product, index) => {
        console.log(`Processing product ${index+1}:`, product.name);
        // Ensure all product properties exist to avoid errors
        const safeProduct = {
            id: product.id || `product-${index}`,
            name: product.name || 'מוצר ללא שם',
            category: product.category || 'כללי',
            price: product.price || 0,
            stock: product.stock || 'בלתי מוגבל',
            image: product.image || ''
        };
        
        productsHTML += `
            <tr data-id="${safeProduct.id}">
                <td>
                    <img src="${safeProduct.image || 'https://via.placeholder.com/50x50?text=' + encodeURIComponent(safeProduct.name)}" 
                         alt="${safeProduct.name}" style="width: 50px; height: 50px; object-fit: cover;">
                </td>
                <td>${safeProduct.name}</td>
                <td>${safeProduct.category}</td>
                <td>₪${typeof safeProduct.price === 'number' ? safeProduct.price.toFixed(2) : '0.00'}</td>
                <td>${safeProduct.stock}</td>
                <td>
                    <button class="action-btn edit-product-btn" data-id="${safeProduct.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn delete-product-btn" data-id="${safeProduct.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    console.log('Setting products-table-body HTML');
    $('#products-table-body').html(productsHTML);
    console.log('HTML set, attaching event handlers');
    
    // Attach event handlers to edit and delete buttons
    $('.edit-product-btn').off('click').on('click', function() {
        const productId = $(this).data('id');
        editProduct(productId);
    });
    
    $('.delete-product-btn').off('click').on('click', function() {
        const productId = $(this).data('id');
        if (confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
            deleteProduct(productId);
        }
    });
    
    console.log('Admin panel products display complete');
}

// FIXED: Improved product form that matches the admin panel style
function showProductForm(productId = null) {
    let product = null;
    
    if (productId) {
        // Edit existing product
        product = productManager.getProduct(productId);
        if (!product) {
            showNotification('המוצר לא נמצא', 'error');
            return;
        }
    }
    
    // Get all available categories from the ProductManager
    const categories = productManager.getAllCategories();
    console.log('Available categories for product form:', categories);
    
    // Build categories options HTML
    let categoriesOptionsHTML = '<option value="כללי" ' + (product && product.category === 'כללי' ? 'selected' : '') + '>כללי</option>';
    
    // Add all available categories from the product manager
    if (categories && categories.length > 0) {
        categories.forEach(category => {
            categoriesOptionsHTML += `<option value="${category.name}" ${product && product.category === category.name ? 'selected' : ''}>${category.name}</option>`;
        });
    } else {
        // Add default categories if none available
        categoriesOptionsHTML += `
            <option value="אלקטרוניקה" ${product && product.category === 'אלקטרוניקה' ? 'selected' : ''}>אלקטרוניקה</option>
            <option value="אופנה" ${product && product.category === 'אופנה' ? 'selected' : ''}>אופנה</option>
            <option value="בית וגן" ${product && product.category === 'בית וגן' ? 'selected' : ''}>בית וגן</option>
        `;
    }
    
    // Create the form modal HTML
    const formHTML = `
    <div id="product-form-modal" class="admin-modal active">
        <div class="admin-modal-bg"></div>
        <div class="admin-modal-container">
            <div class="admin-modal-header">
                <h3>${product ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</h3>
                <button class="close-admin-modal"><i class="fas fa-times"></i></button>
            </div>
            <form id="product-form" class="admin-form">
                <div class="form-group">
                    <label for="product-name">שם המוצר*</label>
                    <input type="text" id="product-name" value="${product ? product.name : ''}" required>
                </div>
                <div class="form-group">
                    <label for="product-price">מחיר</label>
                    <input type="number" id="product-price" min="0" step="0.01" value="${product ? product.price : ''}" required>
                </div>
                <div class="form-group">
                    <label for="product-old-price">מחיר קודם (למבצע)</label>
                    <input type="number" id="product-old-price" min="0" step="0.01" value="${product && product.oldPrice ? product.oldPrice : ''}">
                </div>
                <div class="form-group">
                    <label for="product-category">קטגוריה</label>
                    <select id="product-category">
                        ${categoriesOptionsHTML}
                    </select>
                </div>
                <div class="form-group">
                    <label for="product-stock">מלאי</label>
                    <input type="number" id="product-stock" min="0" value="${product && product.stock ? product.stock : ''}">
                </div>
                <div class="form-group">
                    <label for="product-image">תמונה (URL)</label>
                    <input type="text" id="product-image" value="${product && product.image ? product.image : ''}">
                </div>
                <div class="form-group">
                    <label for="product-description">תיאור</label>
                    <textarea id="product-description">${product && product.description ? product.description : ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="product-badge">תגית</label>
                    <select id="product-badge">
                        <option value="" ${!product || !product.badge ? 'selected' : ''}>אין</option>
                        <option value="new" ${product && product.badge === 'new' ? 'selected' : ''}>חדש</option>
                        <option value="sale" ${product && product.badge === 'sale' ? 'selected' : ''}>מבצע</option>
                        <option value="hot" ${product && product.badge === 'hot' ? 'selected' : ''}>חם</option>
                        <option value="vip" ${product && product.badge === 'vip' ? 'selected' : ''}>VIP</option>
                        <option value="out-of-stock" ${product && product.badge === 'out-of-stock' ? 'selected' : ''}>אזל מהמלאי</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="admin-btn">${product ? 'עדכן מוצר' : 'הוסף מוצר'}</button>
                    <button type="button" class="admin-btn cancel-btn">ביטול</button>
                </div>
                ${product ? `<input type="hidden" id="product-id" value="${product.id}">` : ''}
            </form>
        </div>
    </div>
    `;
    
    // Add the form to the DOM
    $('body').append(formHTML);
    
    // Add event listeners
    $('.close-admin-modal, .cancel-btn').on('click', function() {
        $('#product-form-modal').remove();
    });
    
    $('#product-form').on('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: $('#product-name').val(),
            price: parseFloat($('#product-price').val()),
            oldPrice: $('#product-old-price').val() ? parseFloat($('#product-old-price').val()) : null,
            category: $('#product-category').val(),
            stock: $('#product-stock').val() ? parseInt($('#product-stock').val()) : null,
            image: $('#product-image').val(),
            description: $('#product-description').val(),
            badge: $('#product-badge').val() || null,
            rating: product ? product.rating || 0 : 0,
            ratingCount: product ? product.ratingCount || 0 : 0
        };
        
        try {
            if (product) {
                // Update existing product
                const success = await productManager.updateProduct(product.id, formData);
                if (success) {
                    showNotification('המוצר עודכן בהצלחה', 'success');
                    $('#product-form-modal').remove();
                    displayProductsInAdminPanel();
                    
                    // If on homepage, update the products display there too
                    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                        displayProductsOnHomepage();
                    }
                }
            } else {
                // Add new product
                const newProductId = await productManager.addProduct(formData);
                if (newProductId) {
                    showNotification('המוצר נוסף בהצלחה', 'success');
                    $('#product-form-modal').remove();
                    displayProductsInAdminPanel();
                    
                    // If on homepage, update the products display there too
                    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                        displayProductsOnHomepage();
                    }
                }
            }
        } catch (error) {
            showNotification(`שגיאה: ${error.message}`, 'error');
        }
    });
}

// Function to edit product
function editProduct(productId) {
    // Show product form with product data
    showProductForm(productId);
}

// Function to delete product
function deleteProduct(productId) {
    if (typeof productManager !== 'undefined') {
        productManager.deleteProduct(productId).then(success => {
            if (success) {
                // Refresh the admin products grid
                displayProductsInAdminPanel();
                
                // If on homepage, update the products display there too
                if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                    displayProductsOnHomepage();
                }
            }
        });
    }
}

// Helper functions for displaying products
function getRatingStars(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    return starsHTML;
}

function getBadgeText(badge) {
    const badges = {
        'new': 'חדש',
        'sale': 'מבצע',
        'hot': 'חם',
        'out-of-stock': 'אזל מהמלאי'
    };
    
    return badges[badge] || badge;
}

// Function to initialize product cards after they are displayed
function initializeProductCards() {
    // Product Image Hover Effect
    $('.product-card').hover(
        function(){
            $(this).find('.product-actions').css('opacity', '1');
        },
        function(){
            $(this).find('.product-actions').css('opacity', '0');
        }
    );
    
    // Add to Cart Button
    $('.add-to-cart').off('click').on('click', function(e){
        e.preventDefault();
        
        // Add to cart animation/logic
        $(this).html('<i class="fas fa-check"></i> נוסף לסל');
        setTimeout(() => {
            $(this).html('הוסף לסל');
        }, 2000);
        
        // Update cart count
        let currentCount = parseInt($('.header-icon .badge').eq(1).text() || '0');
        $('.header-icon .badge').eq(1).text(currentCount + 1);
    });
    
    // Quick view and wishlist buttons
    $('.quick-view-btn, .wishlist-btn').off('click').on('click', function(e) {
        e.preventDefault();
        // Add your quick view or wishlist functionality here
    });
    

    
}

// Add VIP styles to the page
function addVIPStyles() {
    const styles = `
    <style>
        .vip-badge {
            background: linear-gradient(135deg, var(--vip-color), var(--warning-color));
            color: #000;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8em;
            font-weight: 700;
            margin-right: 5px;
        }
        
        .vip-signup-content {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .vip-benefits {
            background-color: rgba(247, 211, 110, 0.1);
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid var(--vip-color);
        }
        
        .vip-benefits h4 {
            color: var(--vip-color);
            margin-top: 0;
            margin-bottom: 10px;
        }
        
        .vip-benefits ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .vip-benefits li {
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }
        
        .vip-benefits li i {
            color: var(--vip-color);
            margin-left: 8px;
        }
        
        .vip-pricing {
            text-align: center;
            padding: 15px;
        }
        
        .vip-pricing h4 {
            margin-top: 0;
            color: var(--primary-color);
        }
        
        .regular-price {
            color: #888;
            font-size: 0.9em;
        }
        
        .vip-price {
            color: var(--vip-color);
            font-size: 1.4em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        #vip-signup-form {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
        }
        
        /* VIP user menu styling */
        .user-menu-link i.fa-gem {
            color: var(--vip-color);
        }
        
        /* VIP content elements */
        .vip-only {
            position: relative;
        }
        
        .vip-only::after {
            content: 'VIP';
            position: absolute;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, var(--vip-color), var(--warning-color));
            color: #000;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8em;
            font-weight: 700;
            z-index: 2;
        }
    </style>
    `;
    
    $('head').append(styles);
}

// Function to show VIP signup form
function showVIPSignupForm() {
    $('body').append(`
    <div id="vip-signup-modal" class="admin-modal active">
        <div class="admin-modal-bg"></div>
        <div class="admin-modal-container">
            <div class="admin-modal-header">
                <h3>הצטרפות למועדון ה-VIP</h3>
                <button class="close-admin-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="vip-signup-content">
                <div class="vip-benefits">
                    <h4>הטבות חברי VIP</h4>
                    <ul>
                        <li><i class="fas fa-check"></i> הנחה קבועה של 10% על כל הזמנה</li>
                        <li><i class="fas fa-check"></i> גישה למוצרים בלעדיים</li>
                        <li><i class="fas fa-check"></i> משלוח חינם בכל קנייה</li>
                        <li><i class="fas fa-check"></i> שירות לקוחות VIP</li>
                    </ul>
                </div>
                <div class="vip-pricing">
                    <h4>מחיר</h4>
                    <p>רגיל: 199₪ לשנה</p>
                    <p class="vip-price">חינם לתקופת ההשקה</p>
                </div>
                <form id="vip-signup-form" class="admin-form">
                    <div class="form-group">
                        <label for="vip-phone">טלפון לקבלת עדכונים (אופציונלי)</label>
                        <input type="text" id="vip-phone" placeholder="הזן מספר טלפון">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="admin-btn">הצטרף עכשיו (חינם)</button>
                    <button type="button" class="admin-btn cancel-btn">ביטול</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `);
    
    $('.close-admin-modal, .cancel-btn').on('click', function() {
        $('#vip-signup-modal').remove();
    });
    
    $('#vip-signup-form').on('submit', function(e) {
        e.preventDefault();
        
        const phone = $('#vip-phone').val();
        
        // Update VIP status
        userData.isVIP = true;
        
        // Save to localStorage
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // Close modal
        $('#vip-signup-modal').remove();
        
        // Show confirmation
        showNotification('ברכות! הצטרפת בהצלחה למועדון ה-VIP', 'success');
        
        // Update UI to reflect VIP status
        updateVIPStatus();
        
        // Generate VIP entry in GitHub if available
        if (productManager.githubToken) {
            createVIPUserFile(userData);
        }
    });
}

// Function to update UI with VIP status
function updateVIPStatus() {
    // Update user menu to show VIP badge
    if (userData.isVIP) {
        $('.user-greeting').html(`
            שלום, ${userData.name || 'אורח'} 
            <span class="vip-badge">VIP</span>
        `);
        
        // Enable VIP features
        $('.vip-only').removeClass('disabled');
        
        // Add VIP discount to products if not already applied
        productManager.products.forEach(product => {
            if (product.vipDiscount === undefined) {
                product.vipDiscount = 10; // 10% discount for VIP members
                product.vipPrice = product.price - (product.price * (product.vipDiscount / 100));
            }
        });
        
        // Update UI to show VIP prices if in product view
        if ($('.product-price').length > 0) {
            updateProductPricesForVIP();
        }
    } else {
        $('.user-greeting').html(`שלום, ${userData.name || 'אורח'}`);
    }
}

// Function to update product prices for VIP members
function updateProductPricesForVIP() {
    if (!userData.isVIP) return;
    
    $('.product-card').each(function() {
        const productId = $(this).data('id');
        const product = productManager.getProduct(productId);
        
        if (product && product.vipPrice) {
            const priceEl = $(this).find('.product-price');
            const currentPriceEl = priceEl.find('.current-price');
            
            // Check if we already added VIP price
            if (!priceEl.find('.vip-price-tag').length) {
                const originalPrice = currentPriceEl.text();
                currentPriceEl.html(`${product.vipPrice}₪ <span class="vip-price-tag">מחיר VIP</span>`);
                
                if (!priceEl.find('.old-price').length) {
                    currentPriceEl.after(`<span class="old-price">${originalPrice}</span>`);
                }
            }
        }
    });
}

// Function to create a VIP user file in GitHub
async function createVIPUserFile(userData) {
    try {
        const { name, email, isVIP } = userData;
        const phone = $('#vip-phone').val() || 'לא הוזן';
        const timestamp = new Date().toISOString();
        const safeName = (name || 'guest').replace(/\s+/g, '-').toLowerCase().replace(/[^\w\-]/g, '');
        const path = `data/vip_members/${safeName}-${Date.now()}.json`;
        
        // Check if directory exists first
        const dirExists = await productManager.checkGitHubPath('data/vip_members');
        if (!dirExists) {
            await productManager.createGitHubDirectory('data/vip_members', 'Create VIP members directory', productManager.githubToken);
        }
        
        // Prepare user data for GitHub
        const content = JSON.stringify({
            name: name || 'אורח',
            email: email || 'לא הוזן',
            phone,
            joinDate: timestamp,
            isVIP: true
        }, null, 2);
        
        // Upload to GitHub
        await productManager.createGitHubFile(
            path, 
            content, 
            `Add VIP member: ${name || 'Guest user'}`, 
            productManager.githubToken
        );
        
        console.log(`VIP user data saved to GitHub: ${path}`);
    } catch (error) {
        console.error('Error saving VIP data to GitHub:', error);
    }
}

// Setup sidebar toggles
function setupSidebarToggles() {
    // Left sidebar toggle
    $('.sidebar-toggle-left').off('click').on('click', function() {
        $('.system-sidebar').toggleClass('active');
    });
    
    // Right sidebar toggle
    $('.sidebar-toggle-right').off('click').on('click', function() {
        $('.product-sidebar').toggleClass('active');
    });
}

// Function to display categories in the main site menu
function displayCategoriesInMainMenu(categories) {
    console.log('Displaying categories in main menu:', categories);
    
    // Find the categories dropdown menu
    let $categoriesMenu = $('.main-nav .menu-item-has-children:has(a:contains("קטגוריות")) .sub-menu');
    
    if ($categoriesMenu.length === 0) {
        // If categories menu doesn't exist, let's create it
        console.log('Categories dropdown not found, creating it');
        $('.main-nav').append(`
            <li class="menu-item menu-item-has-children">
                <a href="#" class="has-submenu">קטגוריות<span class="drop-indicator"><i class="fas fa-caret-down"></i></span></a>
                <ul class="sub-menu">
                </ul>
            </li>
        `);
        $categoriesMenu = $('.categories-submenu, .main-nav .menu-item-has-children:has(a:contains("קטגוריות")) .sub-menu');
    } else {
        console.log('Categories dropdown found');
    }
    
    // Clear existing categories
    $categoriesMenu.empty();
    
    if (!categories || categories.length === 0) {
        $categoriesMenu.append('<li class="dropdown-link"><a href="#" class="dropdown-link-a">אין קטגוריות להצגה</a></li>');
        return;
    }
    
    // Sort categories by order if available, or by name
    const sortedCategories = [...categories].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
        }
        return (a.name || '').localeCompare(b.name || '');
    });
    
    // Add each category to the menu
    sortedCategories.forEach(category => {
        if (!category || !category.name) return;
        
        const categorySlug = category.slug || category.name.replace(/\s+/g, '-').toLowerCase();
        
        $categoriesMenu.append(`
            <li class="dropdown-link">
                <a href="category-${categorySlug}.html" class="dropdown-link-a">${category.name}</a>
            </li>
        `);
    });
    
    // Log the final menu structure 
    console.log('Updated categories menu:', $categoriesMenu.html());
}

// Function to load and display products on homepage
function loadAndDisplayProducts() {
    console.log('Loading and displaying products on homepage...');
    
    // Use the ProductManager to load products from GitHub
    productManager.loadProductsFromGitHub().then(success => {
        if (success) {
            displayProductsOnHomepage(productManager.getAllProducts());
        } else {
            showNotification('שגיאה בטעינת מוצרים', 'error');
            console.error('Failed to load products from GitHub');
        }
    });
}

// Function to display products on the homepage
function displayProductsOnHomepage(products) {
    console.log('Displaying products on homepage:', products);
    
    // Find the products container in the homepage
    const $productsContainer = $('#featured-products-container');
    
    if ($productsContainer.length === 0) {
        console.error('Products container not found on homepage');
        return;
    }
    
    // Check if there are products to display
    if (!products || products.length === 0) {
        $productsContainer.html('<div class="empty-products">אין מוצרים להצגה</div>');
        return;
    }
    
    // Build HTML for products
    let productsHTML = '<div class="products-grid">';
    
    products.forEach(product => {
        // Get the VIP price if available
        const vipPrice = product.vipPrice || (product.price * 0.9);
        const isVIP = JSON.parse(localStorage.getItem('userData') || '{}').isVIP;
        
        // Determine which price to show
        const displayPrice = isVIP ? vipPrice : product.price;
        const oldPrice = isVIP ? product.price : null;
        
        // Build the product card
        productsHTML += `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image || 'images/product-placeholder.jpg'}" alt="${product.name}">
                    ${product.badge ? `<span class="product-badge ${product.badge}">${getBadgeText(product.badge)}</span>` : ''}
                    <div class="product-actions">
                        <button class="action-btn quick-view-btn" data-id="${product.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn add-to-cart-btn" data-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                        <button class="action-btn add-to-wishlist-btn" data-id="${product.id}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">
                        <a href="product-${product.slug}.html">${product.name}</a>
                    </h3>
                    <div class="product-category">${product.category || 'כללי'}</div>
                    <div class="product-rating">
                        ${getRatingStars(product.rating || 5)}
                    </div>
                    <div class="product-price">
                        ${oldPrice ? `<span class="old-price">${oldPrice.toFixed(2)} ₪</span>` : ''}
                        <span class="current-price">${displayPrice.toFixed(2)} ₪</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    productsHTML += '</div>';
    
    // Add products to container
    $productsContainer.html(productsHTML);
    
    // Attach event handlers to product card buttons
    initializeProductCards();
}