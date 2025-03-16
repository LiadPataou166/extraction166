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
        
        try {
            const supabase = initSupabase();
            if (!supabase) {
                showAuthError('login', 'Unable to connect to authentication service');
                return;
            }
            
            // Show loading state
            $('#login-submit').prop('disabled', true).text('Processing...');
            
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
            
            showNotification('Login successful!', 'success');
            hideAuthModal();
            updateUserUI(userData);
            
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
            // Sign out from Supabase
            await supabase.auth.signOut();
            
            // Clear user data from UI
            updateUserUI(null);
            
            // Show success message
            showNotification('התנתקת בהצלחה', 'info');
            
        } catch (err) {
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

    // Initialize everything when the document is ready
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
        
        // Initialize modals
        addAuthModalToDOM();
        
        // Auth modal triggers
        $('.show-login').on('click', function(e){
            e.preventDefault();
            showAuthModal('login');
        });
        
        $('.show-register').on('click', function(e){
            e.preventDefault();
            showAuthModal('register');
        });
        
        // Initialize managers
        window.productManager = new ProductManager();
        window.membershipManager = new MembershipManager();
        window.cartManager = new CartManager();
        
        // Initialize Supabase
        initSupabase();
        
        // Check user authentication
        checkUserLogin();

        // Replace login form handler with admin-enabled version
        enhancedLoginHandler();
        
        // Initialize pagination for products
        setupPagination();
        
        // Back to top button functionality
        $(window).scroll(function(){
            if ($(this).scrollTop() > 300) {
                $('.back-to-top').fadeIn();
            } else {
                $('.back-to-top').fadeOut();
            }
        });
        
        $('.back-to-top').on('click', function(){
            $('html, body').animate({scrollTop: 0}, 500);
            return false;
        });

        // Network status check
        window.addEventListener('online', checkNetworkConnection);
        window.addEventListener('offline', checkNetworkConnection);
        checkNetworkConnection();
    });
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
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            updateUserUI(userData);
            return userData;
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem('user');
            updateUserUI(null);
        }
    } else {
        updateUserUI(null);
    }
    return null;
}

function updateUserUI(userData) {
    if (userData) {
        $('.auth-links').html(`
            <div class="user-greeting">
                שלום, <span class="user-name">${userData.name}</span>
                <div class="user-menu">
                    <div class="user-menu-item" data-action="profile">הפרופיל שלי</div>
                    <div class="user-menu-item" data-action="orders">ההזמנות שלי</div>
                    <div class="user-menu-item" data-action="wishlist">רשימת משאלות</div>
                    <div class="user-menu-item" data-action="settings">הגדרות</div>
                    <div class="user-menu-divider"></div>
                    <div class="user-menu-item logout" data-action="logout">התנתקות</div>
                </div>
            </div>
        `);
        
        // Attach event handlers
        $('.user-menu-item').on('click', function() {
            const action = $(this).data('action');
            if (action === 'logout') {
                localStorage.removeItem('user');
                updateUserUI(null);
                return;
            }
            
            // Handle other menu actions (for now just show notification)
            showNotification(`הפונקציה "${$(this).text()}" תהיה זמינה בקרוב`, 'info');
        });
        
        // Check if user is admin
        checkAdminLogin(userData);
    } else {
        $('.auth-links').html(`
            <a href="#" class="show-login">התחברות</a>
            <a href="#" class="show-register">הרשמה</a>
        `);
        
        // Reattach event handlers for modals
        $('.show-login').on('click', function(e) {
            e.preventDefault();
            showAuthModal('login');
        });
        
        $('.show-register').on('click', function(e) {
            e.preventDefault();
            showAuthModal('register');
        });
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
    }
    
    // Add new product
    addProduct(product) {
        // Generate unique ID
        product.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.products.push(product);
        this.saveProducts();
        return product.id;
    }
    
    // Update existing product
    updateProduct(productId, updatedData) {
        const index = this.products.findIndex(p => p.id === productId);
        if(index !== -1) {
            this.products[index] = { ...this.products[index], ...updatedData };
            this.saveProducts();
            return true;
        }
        return false;
    }
    
    // Delete product
    deleteProduct(productId) {
        this.products = this.products.filter(p => p.id !== productId);
        this.saveProducts();
    }
    
    // Get product by ID
    getProduct(productId) {
        return this.products.find(p => p.id === productId);
    }
    
    // Get all products
    getAllProducts() {
        return this.products;
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
                return filters.tags.every(tag => p.tags.includes(tag));
            });
        }
        
        // Search by keyword
        if(filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            filteredProducts = filteredProducts.filter(p => {
                return p.name.toLowerCase().includes(keyword) || 
                       p.description.toLowerCase().includes(keyword);
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
                    filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    break;
                case 'rating':
                    filteredProducts.sort((a, b) => b.rating - a.rating);
                    break;
            }
        }
        
        return filteredProducts;
    }
    
    // Save products to localStorage
    saveProducts() {
        localStorage.setItem('products', JSON.stringify(this.products));
    }
    
    // Load products from localStorage
    loadProducts() {
        const storedProducts = localStorage.getItem('products');
        if(storedProducts) {
            this.products = JSON.parse(storedProducts);
        }
    }
    
    // Add category
    addCategory(category) {
        if(!this.categories.includes(category)) {
            this.categories.push(category);
            localStorage.setItem('categories', JSON.stringify(this.categories));
        }
    }
    
    // Get all categories
    getAllCategories() {
        return this.categories;
    }
    
    // Load categories from localStorage
    loadCategories() {
        const storedCategories = localStorage.getItem('categories');
        if(storedCategories) {
            this.categories = JSON.parse(storedCategories);
        }
    }
    
    // Add tag
    addTag(tag) {
        if(!this.tags.includes(tag)) {
            this.tags.push(tag);
            localStorage.setItem('tags', JSON.stringify(this.tags));
        }
    }
    
    // Get all tags
    getAllTags() {
        return this.tags;
    }
    
    // Load tags from localStorage
    loadTags() {
        const storedTags = localStorage.getItem('tags');
        if(storedTags) {
            this.tags = JSON.parse(storedTags);
        }
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
const productManager = new ProductManager();
const membershipManager = new MembershipManager();
const cartManager = new CartManager();

// Load data from localStorage
productManager.loadProducts();
productManager.loadCategories();
productManager.loadTags();
membershipManager.loadMembers();

// Update cart badge on page load
$(document).ready(function(){
    const cartCount = cartManager.getItemCount();
    $('.header-icon .badge').eq(1).text(cartCount);
});

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

// Check if user is authenticated with Supabase
async function checkUserAuth() {
    try {
        if (supabase) {
            supabase.auth.getSession().then(({ data, error }) => {
                if (error) {
                    console.error('Auth error:', error);
                    return;
                }
                
                if (data && data.session) {
                    // User is logged in
                    const user = data.session.user;
                    const userData = {
                        email: user.email,
                        name: user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : user.email.split('@')[0],
                        isVIP: user.user_metadata && user.user_metadata.isVIP ? user.user_metadata.isVIP : false
                    };
                    
                    updateUserUI(userData);
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

// Pagination Variables
let currentPage = 1;
const productsPerPage = 8;
let allProducts = [];
let filteredProducts = [];
let totalPages = 0;

// Product Pagination Function
function setupPagination() {
    // Load all product data
    productManager.loadProducts();
    allProducts = productManager.getAllProducts();
    filteredProducts = [...allProducts];
    totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    renderPagination();
    loadProductsForPage(currentPage);
    
    // Pagination event listeners
    $(document).on('click', '.pagination-number', function() {
        const page = parseInt($(this).text());
        if (page !== currentPage) {
            currentPage = page;
            loadProductsForPage(currentPage);
            renderPagination();
        }
    });
    
    $(document).on('click', '.next-page:not([disabled])', function() {
        currentPage++;
        loadProductsForPage(currentPage);
        renderPagination();
    });
    
    $(document).on('click', '.prev-page:not([disabled])', function() {
        currentPage--;
        loadProductsForPage(currentPage);
        renderPagination();
    });
    
    // Filter button clicks should reset pagination
    $('.filter-btn').on('click', function() {
        const filter = $(this).text().trim();
        
        if (filter === 'הכל') {
            filteredProducts = [...allProducts];
        } else if (filter === 'מוצרים חדשים') {
            filteredProducts = allProducts.filter(p => p.badge === 'new');
        } else if (filter === 'מבצעים') {
            filteredProducts = allProducts.filter(p => p.badge === 'hot' || p.badge === 'sale');
        } else if (filter === 'בלעדי ל-VIP') {
            filteredProducts = allProducts.filter(p => p.badge === 'vip');
        }
        
        totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        currentPage = 1;
        renderPagination();
        loadProductsForPage(currentPage);
    });
    
    // Sort select change
    $('.sort-select').on('change', function() {
        const sortMethod = $(this).val();
        
        if (sortMethod === 'popularity') {
            filteredProducts.sort((a, b) => b.popularity - a.popularity);
        } else if (sortMethod === 'rating') {
            filteredProducts.sort((a, b) => b.rating - a.rating);
        } else if (sortMethod === 'price-low') {
            filteredProducts.sort((a, b) => a.price - b.price);
        } else if (sortMethod === 'price-high') {
            filteredProducts.sort((a, b) => b.price - a.price);
        } else if (sortMethod === 'newest') {
            filteredProducts.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        
        loadProductsForPage(currentPage);
    });
}

function renderPagination() {
    const $paginationNumbers = $('.pagination-numbers');
    $paginationNumbers.empty();
    
    // Determine which page numbers to show
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);
    
    // Adjust if we're at the end
    if (endPage - startPage < 2) {
        startPage = Math.max(1, endPage - 2);
    }
    
    // Previous button
    $('.prev-page').prop('disabled', currentPage === 1);
    
    // Add first page + ellipsis if needed
    if (startPage > 1) {
        $paginationNumbers.append(`<button class="pagination-number ${1 === currentPage ? 'active' : ''}">1</button>`);
        if (startPage > 2) {
            $paginationNumbers.append('<span class="pagination-ellipsis">...</span>');
        }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
        $paginationNumbers.append(`<button class="pagination-number ${i === currentPage ? 'active' : ''}">${i}</button>`);
    }
    
    // Add last page + ellipsis if needed
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            $paginationNumbers.append('<span class="pagination-ellipsis">...</span>');
        }
        $paginationNumbers.append(`<button class="pagination-number ${totalPages === currentPage ? 'active' : ''}">${totalPages}</button>`);
    }
    
    // Next button
    $('.next-page').prop('disabled', currentPage === totalPages);
    
    // Update the range text
    const start = (currentPage - 1) * productsPerPage + 1;
    const end = Math.min(start + productsPerPage - 1, filteredProducts.length);
    $('.current-range').text(`${start}-${end}`);
    $('.total-count').text(filteredProducts.length);
}

function loadProductsForPage(page) {
    const startIndex = (page - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    // Clear the products grid
    $('.products-grid').empty();
    
    // Add products
    productsToShow.forEach(product => {
        const productHTML = createProductCard(product);
        $('.products-grid').append(productHTML);
    });
    
    // Re-activate hover effects
    $('.product-card').hover(
        function(){
            $(this).find('.product-actions').css('opacity', '1');
        },
        function(){
            $(this).find('.product-actions').css('opacity', '0');
        }
    );
}

function createProductCard(product) {
    let badgeHTML = '';
    if (product.badge) {
        const badgeText = {
            'new': 'חדש',
            'hot': 'מבצע',
            'vip': 'VIP',
            'sale': 'מבצע'
        }[product.badge] || '';
        
        badgeHTML = `<div class="product-badge ${product.badge}">${badgeText}</div>`;
    }
    
    let priceHTML = `<div class="current-price">₪${product.price.toFixed(2)}</div>`;
    if (product.oldPrice && product.oldPrice > product.price) {
        const discount = Math.round((1 - product.price / product.oldPrice) * 100);
        priceHTML += `
            <div class="old-price">₪${product.oldPrice.toFixed(2)}</div>
            <div class="price-discount">-${discount}%</div>
        `;
    }
    
    // Generate rating stars
    const fullStars = Math.floor(product.rating);
    const halfStar = product.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            ${badgeHTML}
            <div class="product-img">
                <img src="${product.image || '/api/placeholder/300/300'}" alt="${product.name}">
            </div>
            <div class="product-actions">
                <div class="product-action-btn">
                    <i class="fas fa-heart"></i>
                </div>
                <div class="product-action-btn">
                    <i class="fas fa-eye"></i>
                </div>
                <div class="product-action-btn">
                    <i class="fas fa-exchange-alt"></i>
                </div>
            </div>
            <div class="product-content">
                <div class="product-category">${product.category || 'קטגוריה'}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-rating">
                    <div class="rating-stars">
                        ${starsHTML}
                    </div>
                    <div class="rating-count">(${product.ratingCount || 0})</div>
                </div>
                <div class="product-price">
                    ${priceHTML}
                </div>
                <button class="add-to-cart">הוסף לסל</button>
            </div>
        </div>
    `;
}

// Admin Functionality
function setupAdminFunctionality() {
    // Admin tab switching
    $('.admin-tab').on('click', function() {
        const tabId = $(this).data('tab');
        
        $('.admin-tab').removeClass('active');
        $(this).addClass('active');
        
        $('.admin-tab-content').removeClass('active');
        $(`#${tabId}-tab`).addClass('active');
    });
    
    // Product form controls
    $('#add-product-btn').on('click', function() {
        $('#product-form').slideDown();
    });
    
    $('#cancel-product-btn').on('click', function() {
        $('#product-form').slideUp();
        $('#new-product-form')[0].reset();
    });
    
    // Add new product
    $('#new-product-form').on('submit', function(e) {
        e.preventDefault();
        
        const product = {
            id: Date.now().toString(),
            name: $('#product-name').val(),
            category: $('#product-category option:selected').text(),
            price: parseFloat($('#product-price').val()),
            oldPrice: $('#product-old-price').val() ? parseFloat($('#product-old-price').val()) : null,
            badge: $('#product-badge').val() || null,
            description: $('#product-description').val(),
            image: '/api/placeholder/300/300', // In a real app, would handle image upload
            stock: parseInt($('#product-stock').val()),
            rating: 0,
            ratingCount: 0,
            date: new Date().toISOString(),
            popularity: 0
        };
        
        productManager.addProduct(product);
        allProducts = productManager.getAllProducts();
        filteredProducts = [...allProducts];
        totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        
        renderPagination();
        loadProductsForPage(currentPage);
        loadAdminProductsTable();
        
        $('#product-form').slideUp();
        $('#new-product-form')[0].reset();
        
        showNotification('המוצר נוסף בהצלחה!', 'success');
    });
    
    // Load products table in admin view
    loadAdminProductsTable();
    
    // Admin logout
    $('#admin-logout').on('click', function(e) {
        e.preventDefault();
        logoutAdmin();
    });
}

function loadAdminProductsTable() {
    const products = productManager.getAllProducts();
    const $tableBody = $('#products-table-body');
    $tableBody.empty();
    
    products.forEach(product => {
        const statusClass = product.stock > 0 ? 'text-success' : 'text-danger';
        const statusText = product.stock > 0 ? 'במלאי' : 'אזל מהמלאי';
        
        $tableBody.append(`
            <tr data-product-id="${product.id}">
                <td><img src="${product.image}" alt="${product.name}" width="50"></td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>₪${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td class="${statusClass}">${statusText}</td>
                <td class="admin-actions">
                    <button class="admin-action-btn edit"><i class="fas fa-edit"></i></button>
                    <button class="admin-action-btn delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `);
    });
    
    // Attach event handlers to the edit and delete buttons
    $('.admin-action-btn.edit').on('click', function() {
        const productId = $(this).closest('tr').data('product-id');
        // Implementation would open the form for editing
        showNotification('פונקציונליות עריכה תהיה זמינה בקרוב', 'info');
    });
    
    $('.admin-action-btn.delete').on('click', function() {
        const productId = $(this).closest('tr').data('product-id');
        if (confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
            productManager.deleteProduct(productId);
            
            // Refresh all product related views
            allProducts = productManager.getAllProducts();
            filteredProducts = [...allProducts];
            totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            
            if (currentPage > totalPages) {
                currentPage = Math.max(1, totalPages);
            }
            
            renderPagination();
            loadProductsForPage(currentPage);
            loadAdminProductsTable();
            
            showNotification('המוצר נמחק בהצלחה', 'success');
        }
    });
}

// Admin Authentication
const ADMIN_EMAIL = 'liad1111@gmail.com';

function checkAdminLogin(userData) {
    if (userData && userData.email === ADMIN_EMAIL) {
        showAdminPage();
        return true;
    }
    return false;
}

function showAdminPage() {
    // Hide regular content
    $('header, main, footer, .back-to-top').hide();
    
    // Show admin page
    $('#admin-page').show();
    
    // Setup admin functionality
    setupAdminFunctionality();
    
    // Add class to body
    $('body').addClass('admin-mode');
}

function logoutAdmin() {
    // Clear authentication
    localStorage.removeItem('user');
    
    // Show regular content
    $('header, main, footer, .back-to-top').show();
    
    // Hide admin page
    $('#admin-page').hide();
    
    // Remove admin class
    $('body').removeClass('admin-mode');
    
    // Update UI
    updateUserUI(null);
}

// Enhanced login function to support admin login
function enhancedLoginHandler() {
    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        
        const email = $('#login-email').val();
        const password = $('#login-password').val();
        
        if (!isValidEmail(email)) {
            showAuthError('login', 'נא להזין כתובת אימייל תקינה');
            return;
        }
        
        if (password.length < 6) {
            showAuthError('login', 'הסיסמה חייבת להכיל לפחות 6 תווים');
            return;
        }
        
        // Simulated login for demo purposes
        // In a real app, this would make an API request to your backend
        if (email === ADMIN_EMAIL && password === 'admin123') {
            const userData = {
                id: 'admin1',
                name: 'מנהל',
                email: ADMIN_EMAIL,
                isAdmin: true
            };
            
            localStorage.setItem('user', JSON.stringify(userData));
            hideAuthModal();
            updateUserUI(userData);
            showNotification('התחברת בהצלחה כמנהל', 'success');
        } else {
            // Regular user login logic
            const memberByEmail = membershipManager.getMemberByEmail(email);
            
            if (memberByEmail && memberByEmail.password === password) {
                localStorage.setItem('user', JSON.stringify(memberByEmail));
                hideAuthModal();
                updateUserUI(memberByEmail);
                showNotification('התחברת בהצלחה', 'success');
            } else {
                showAuthError('login', 'שם משתמש או סיסמה שגויים');
            }
        }
    });
}

// Replace the current login form handler with the enhanced one
$(document).ready(function(){
    // ... existing initializations ...
    
    // Initialize pagination
    setupPagination();
    
    // Check if user is already logged in
    checkUserLogin();
    
    // Setup login form handler with admin support
    enhancedLoginHandler();
    
    // ... rest of your initialization code ...
});
