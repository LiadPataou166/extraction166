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
            $('#register-submit').prop('disabled', false).text('הרשמה');
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
        updateUserUI(JSON.parse(userData));
    }
}

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

// User Authentication and Admin Access
$(document).ready(function() {
    // Check if user is logged in
    checkLoginStatus();
    
    // Login Modal
    $('.user-login-link').on('click', function(e) {
        e.preventDefault();
        showLoginModal();
    });
    
    // Logout functionality
    $('.user-logout-link').on('click', function(e) {
        e.preventDefault();
        logoutUser();
    });
    
    // Login form submission
    $(document).on('submit', '#login-form-modal', function(e) {
        e.preventDefault();
        const email = $('#login-email').val();
        const password = $('#login-password').val();
        
        // Simple authentication logic
        loginUser(email, password);
    });
});

// Create and display login modal
function showLoginModal() {
    // Remove any existing modal
    $('#login-modal').remove();
    
    // Create modal HTML
    const modalHtml = `
    <div class="modal fade" id="login-modal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">התחברות למערכת</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="login-form-modal">
                        <div class="mb-3">
                            <label for="login-email" class="form-label">דואר אלקטרוני</label>
                            <input type="email" class="form-control" id="login-email" required>
                        </div>
                        <div class="mb-3">
                            <label for="login-password" class="form-label">סיסמה</label>
                            <input type="password" class="form-control" id="login-password" required>
                        </div>
                        <div class="alert alert-danger" id="login-error-modal" style="display: none;"></div>
                        <button type="submit" class="btn btn-primary">התחבר</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Append modal to body
    $('body').append(modalHtml);
    
    // Initialize and show the modal
    const loginModal = new bootstrap.Modal(document.getElementById('login-modal'));
    loginModal.show();
}

// Login user function
function loginUser(email, password) {
    // For demonstration, using a simple check
    if (email === 'liad1111@gmail.com' && password === '123123') {
        // Store user info in localStorage
        const userInfo = {
            email: email,
            name: 'ליעד',
            isAdmin: true
        };
        localStorage.setItem('currentUser', JSON.stringify(userInfo));
        
        // Update UI
        updateUserInterface(userInfo);
        
        // Close modal if it exists
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('login-modal'));
        if (loginModal) {
            loginModal.hide();
        }
        
        // Show success message
        alert('התחברת בהצלחה!');
    } else {
        // Show error
        $('#login-error-modal').text('דוא"ל או סיסמה שגויים').show();
    }
}

// Logout user function
function logoutUser() {
    // Clear user data
    localStorage.removeItem('currentUser');
    
    // Update UI
    updateUserInterface(null);
    
    // Show message
    alert('התנתקת בהצלחה!');
}

// Check login status on page load
function checkLoginStatus() {
    const userInfo = JSON.parse(localStorage.getItem('currentUser'));
    updateUserInterface(userInfo);
}

// Update user interface based on login status
function updateUserInterface(userInfo) {
    if (userInfo) {
        // User is logged in
        $('.user-login-link').hide();
        $('.user-logout-link').show();
        
        // If admin, show admin panel link
        if (userInfo.isAdmin) {
            $('.admin-link').show();
        } else {
            $('.admin-link').hide();
        }
        
        // You could also update other UI elements like user name
        // $('.user-name-display').text(userInfo.name);
    } else {
        // User is logged out
        $('.user-login-link').show();
        $('.user-logout-link').hide();
        $('.admin-link').hide();
    }
}



// Admin Panel & Site Management System
class SiteManager {
    constructor() {
        this.settings = this.loadSettings();
        this.products = this.loadProducts();
        this.categories = this.loadCategories();
        this.isAdminPanelOpen = false;
        
        // Apply loaded settings to the site immediately
        this.applySiteSettings();
    }
    
    // Load saved settings from localStorage
    loadSettings() {
        const defaultSettings = {
            siteName: "Doctor Instraction",
            siteEmail: "info@doctorinstraction.com",
            sitePhone: "03-1234567",
            siteAddress: "רחוב הראשי 123, תל אביב",
            siteDescription: "חנות מקצועית ומובילה עם מוצרים איכותיים במחירים אטרקטיביים. הצטרפו למועדון ה-VIP וקבלו הטבות בלעדיות.",
            socialLinks: {
                facebook: "https://www.facebook.com/doctorinstraction",
                instagram: "https://www.instagram.com/doctorinstraction",
                twitter: "https://www.twitter.com/doctorinstraction",
                telegram: "https://t.me/doctorinstraction"
            },
            productsPerPage: 8,
            currency: "ILS",
            maintenanceMode: false,
            allowReviews: true
        };
        
        const savedSettings = localStorage.getItem('siteSettings');
        
        if (savedSettings) {
            try {
                return JSON.parse(savedSettings);
            } catch (e) {
                console.error("Error parsing saved settings:", e);
                return defaultSettings;
            }
        }
        
        return defaultSettings;
    }
    
    // Apply current settings to the website
    applySiteSettings() {
        // Update site title and metadata
        document.title = this.settings.siteName + " - חנות מקצועית";
        
        // Update footer contact information
        $('.footer-widget.contact-widget ul li:nth-child(1) span').text(this.settings.siteAddress);
        $('.footer-widget.contact-widget ul li:nth-child(2) span').text(this.settings.sitePhone);
        $('.footer-widget.contact-widget ul li:nth-child(3) span').text(this.settings.siteEmail);
        
        // Update social links
        $('.social-links a:nth-child(1)').attr('href', this.settings.socialLinks.facebook);
        $('.social-links a:nth-child(2)').attr('href', this.settings.socialLinks.instagram);
        $('.social-links a:nth-child(3)').attr('href', this.settings.socialLinks.twitter);
        $('.social-links a:nth-child(4)').attr('href', this.settings.socialLinks.telegram);
        
        // Apply products per page setting to pagination
        this.updateProductsDisplay();
    }
    
    // Update how many products are displayed
    updateProductsDisplay() {
        // In a real implementation, this would refresh the product listing
        // based on the current page and productsPerPage setting
        console.log(`Products per page set to: ${this.settings.productsPerPage}`);
    }
    
    // Save current settings to localStorage
    saveSettings() {
        localStorage.setItem('siteSettings', JSON.stringify(this.settings));
        this.applySiteSettings();
        return true;
    }
    
    // Update a specific setting
    updateSetting(key, value) {
        // Handle nested settings like socialLinks.facebook
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            this.settings[parent][child] = value;
        } else {
            this.settings[key] = value;
        }
        
        this.saveSettings();
        return true;
    }
    
    // Load products from localStorage
    loadProducts() {
        const savedProducts = localStorage.getItem('products');
        
        if (savedProducts) {
            try {
                return JSON.parse(savedProducts);
            } catch (e) {
                console.error("Error parsing saved products:", e);
                return [];
            }
        }
        
        // Default sample products if none saved
        return this.getDefaultProducts();
    }
    
    // Get default sample products
    getDefaultProducts() {
        // Return sample products data
        // This would normally come from a database
        return [
            {
                id: 1,
                name: "מוצר 1",
                category: 1,
                description: "תיאור למוצר 1",
                price: 199.99,
                oldPrice: 249.99,
                badge: "hot",
                stock: 25,
                image: "/api/placeholder/300/300"
            },
            // More sample products...
        ];
    }
    
    // Save products to localStorage
    saveProducts() {
        localStorage.setItem('products', JSON.stringify(this.products));
        return true;
    }
    
    // Add a new product
    addProduct(product) {
        // Generate a new ID
        const newId = this.products.length > 0 
            ? Math.max(...this.products.map(p => p.id)) + 1 
            : 1;
        
        product.id = newId;
        this.products.push(product);
        this.saveProducts();
        return newId;
    }
    
    // Update existing product
    updateProduct(id, updatedData) {
        const index = this.products.findIndex(p => p.id === id);
        
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updatedData };
            this.saveProducts();
            return true;
        }
        
        return false;
    }
    
    // Delete a product
    deleteProduct(id) {
        const initialLength = this.products.length;
        this.products = this.products.filter(p => p.id !== id);
        
        if (this.products.length < initialLength) {
            this.saveProducts();
            return true;
        }
        
        return false;
    }
    
    // Load categories from localStorage
    loadCategories() {
        const savedCategories = localStorage.getItem('categories');
        
        if (savedCategories) {
            try {
                return JSON.parse(savedCategories);
            } catch (e) {
                console.error("Error parsing saved categories:", e);
                return this.getDefaultCategories();
            }
        }
        
        return this.getDefaultCategories();
    }
    
    // Get default categories
    getDefaultCategories() {
        return [
            { id: 1, name: "קטגוריה 1", description: "תיאור לקטגוריה 1" },
            { id: 2, name: "קטגוריה 2", description: "תיאור לקטגוריה 2" },
            { id: 3, name: "קטגוריה 3", description: "תיאור לקטגוריה 3" }
        ];
    }
    
    // Save categories to localStorage
    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
        return true;
    }
    
    // Add a new category
    addCategory(category) {
        const newId = this.categories.length > 0 
            ? Math.max(...this.categories.map(c => c.id)) + 1 
            : 1;
        
        category.id = newId;
        this.categories.push(category);
        this.saveCategories();
        return newId;
    }
    
    // Update a category
    updateCategory(id, updatedData) {
        const index = this.categories.findIndex(c => c.id === id);
        
        if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...updatedData };
            this.saveCategories();
            return true;
        }
        
        return false;
    }
    
    // Delete a category
    deleteCategory(id) {
        const initialLength = this.categories.length;
        this.categories = this.categories.filter(c => c.id !== id);
        
        if (this.categories.length < initialLength) {
            this.saveCategories();
            return true;
        }
        
        return false;
    }
    
    // Toggle admin panel visibility
    toggleAdminPanel() {
        this.isAdminPanelOpen = !this.isAdminPanelOpen;
        
        if (this.isAdminPanelOpen) {
            this.showAdminPanel();
        } else {
            this.hideAdminPanel();
        }
        
        return this.isAdminPanelOpen;
    }
    
    // Show the admin panel
    showAdminPanel() {
        if ($('#admin-sidebar').length === 0) {
            this.createAdminPanel();
        }
        
        $('#admin-sidebar').addClass('open');
        $('body').addClass('admin-panel-open');
    }
    
    // Hide the admin panel
    hideAdminPanel() {
        $('#admin-sidebar').removeClass('open');
        $('body').removeClass('admin-panel-open');
    }
    
    // Create admin panel DOM structure
    createAdminPanel() {
        // Create panel HTML structure
        const adminPanelHtml = `
        <div id="admin-sidebar" class="admin-sidebar">
            <div class="admin-sidebar-header">
                <h3><i class="fas fa-tachometer-alt"></i> פאנל ניהול</h3>
                <button id="close-admin-panel" class="btn-close"></button>
            </div>
            
            <div class="admin-sidebar-content">
                <ul class="admin-nav">
                    <li class="admin-nav-item active" data-section="dashboard">
                        <a href="#"><i class="fas fa-home"></i> לוח בקרה</a>
                    </li>
                    <li class="admin-nav-item" data-section="products">
                        <a href="#"><i class="fas fa-box"></i> ניהול מוצרים</a>
                    </li>
                    <li class="admin-nav-item" data-section="categories">
                        <a href="#"><i class="fas fa-tags"></i> ניהול קטגוריות</a>
                    </li>
                    <li class="admin-nav-item" data-section="settings">
                        <a href="#"><i class="fas fa-cog"></i> הגדרות אתר</a>
                    </li>
                </ul>
            </div>
            
            <div class="admin-content">
                <!-- Dashboard Section -->
                <div id="admin-dashboard" class="admin-section active">
                    <h2>לוח בקרה</h2>
                    
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <i class="fas fa-box"></i>
                            <div class="stat-number">${this.products.length}</div>
                            <div class="stat-label">מוצרים</div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-tags"></i>
                            <div class="stat-number">${this.categories.length}</div>
                            <div class="stat-label">קטגוריות</div>
                        </div>
                    </div>
                    
                    <div class="quick-actions">
                        <h3>פעולות מהירות</h3>
                        <div class="action-buttons">
                            <button class="btn btn-primary" id="quick-add-product">
                                <i class="fas fa-plus"></i> הוסף מוצר
                            </button>
                            <button class="btn btn-primary" id="quick-add-category">
                                <i class="fas fa-plus"></i> הוסף קטגוריה
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Products Section -->
                <div id="admin-products" class="admin-section">
                    <h2>ניהול מוצרים</h2>
                    
                    <button class="btn btn-primary mb-3" id="add-product-btn">
                        <i class="fas fa-plus"></i> הוסף מוצר חדש
                    </button>
                    
                    <div class="products-list">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">שם</th>
                                    <th scope="col">מחיר</th>
                                    <th scope="col">קטגוריה</th>
                                    <th scope="col">פעולות</th>
                                </tr>
                            </thead>
                            <tbody id="products-table-body">
                                ${this.renderProductsTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Categories Section -->
                <div id="admin-categories" class="admin-section">
                    <h2>ניהול קטגוריות</h2>
                    
                    <button class="btn btn-primary mb-3" id="add-category-btn">
                        <i class="fas fa-plus"></i> הוסף קטגוריה חדשה
                    </button>
                    
                    <div class="categories-list">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">שם</th>
                                    <th scope="col">תיאור</th>
                                    <th scope="col">פעולות</th>
                                </tr>
                            </thead>
                            <tbody id="categories-table-body">
                                ${this.renderCategoriesTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Settings Section -->
                <div id="admin-settings" class="admin-section">
                    <h2>הגדרות אתר</h2>
                    
                    <form id="site-settings-form">
                        <div class="form-group mb-3">
                            <label for="site-name">שם האתר</label>
                            <input type="text" class="form-control" id="site-name" value="${this.settings.siteName}">
                        </div>
                        
                        <div class="form-group mb-3">
                            <label for="site-email">דוא"ל קשר</label>
                            <input type="email" class="form-control" id="site-email" value="${this.settings.siteEmail}">
                        </div>
                        
                        <div class="form-group mb-3">
                            <label for="site-phone">טלפון קשר</label>
                            <input type="text" class="form-control" id="site-phone" value="${this.settings.sitePhone}">
                        </div>
                        
                        <div class="form-group mb-3">
                            <label for="site-address">כתובת</label>
                            <input type="text" class="form-control" id="site-address" value="${this.settings.siteAddress}">
                        </div>
                        
                        <div class="form-group mb-3">
                            <label for="products-per-page">מוצרים בכל עמוד</label>
                            <input type="number" class="form-control" id="products-per-page" value="${this.settings.productsPerPage}">
                        </div>
                        
                        <button type="submit" class="btn btn-primary" id="save-settings-btn">שמור הגדרות</button>
                    </form>
                </div>
            </div>
        </div>
        
        <!-- Product Modal -->
        <div class="modal fade" id="product-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="product-modal-title">הוספת מוצר חדש</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="product-form">
                            <input type="hidden" id="product-id">
                            <div class="mb-3">
                                <label for="product-name" class="form-label">שם המוצר</label>
                                <input type="text" class="form-control" id="product-name" required>
                            </div>
                            <div class="mb-3">
                                <label for="product-category" class="form-label">קטגוריה</label>
                                <select class="form-select" id="product-category" required>
                                    ${this.renderCategoryOptions()}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="product-price" class="form-label">מחיר</label>
                                <input type="number" class="form-control" id="product-price" step="0.01" required>
                            </div>
                            <div class="mb-3">
                                <label for="product-description" class="form-label">תיאור</label>
                                <textarea class="form-control" id="product-description" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button>
                        <button type="button" class="btn btn-primary" id="save-product-btn">שמור</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Category Modal -->
        <div class="modal fade" id="category-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="category-modal-title">הוספת קטגוריה חדשה</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="category-form">
                            <input type="hidden" id="category-id">
                            <div class="mb-3">
                                <label for="category-name" class="form-label">שם הקטגוריה</label>
                                <input type="text" class="form-control" id="category-name" required>
                            </div>
                            <div class="mb-3">
                                <label for="category-description" class="form-label">תיאור</label>
                                <textarea class="form-control" id="category-description" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ביטול</button>
                        <button type="button" class="btn btn-primary" id="save-category-btn">שמור</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Append the panel to the body
        $('body').append(adminPanelHtml);
        
        // Add CSS styles dynamically
        const adminStyles = `
        <style>
            /* Admin Panel Styles */
            .admin-sidebar {
                position: fixed;
                top: 0;
                right: -400px;
                width: 400px;
                height: 100vh;
                background-color: #fff;
                box-shadow: -2px 0 10px rgba(0,0,0,0.1);
                transition: right 0.3s ease;
                z-index: 9999;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                direction: rtl;
            }
            
            .admin-sidebar.open {
                right: 0;
            }
            
            .admin-sidebar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: #2c3e50;
                color: white;
            }
            
            .admin-sidebar-header h3 {
                margin: 0;
                font-size: 1.2rem;
            }
            
            .admin-sidebar-header .btn-close {
                background-color: transparent;
                color: white;
            }
            
            .admin-sidebar-content {
                padding: 0;
                border-bottom: 1px solid #eee;
            }
            
            .admin-nav {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .admin-nav-item {
                padding: 0;
                border-bottom: 1px solid #eee;
            }
            
            .admin-nav-item:last-child {
                border-bottom: none;
            }
            
            .admin-nav-item a {
                display: block;
                padding: 15px 20px;
                color: #333;
                text-decoration: none;
                transition: all 0.2s;
            }
            
            .admin-nav-item a i {
                margin-left: 10px;
                width: 20px;
                text-align: center;
            }
            
            .admin-nav-item:hover a,
            .admin-nav-item.active a {
                background-color: #f8f9fa;
                color: #007bff;
            }
            
            .admin-content {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }
            
            .admin-section {
                display: none;
            }
            
            .admin-section.active {
                display: block;
            }
            
            .dashboard-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .stat-card {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }
            
            .stat-card i {
                font-size: 24px;
                color: #007bff;
                margin-bottom: 10px;
            }
            
            .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #2c3e50;
            }
            
            .stat-label {
                color: #6c757d;
                font-size: 14px;
            }
            
            .quick-actions {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
            }
            
            .action-buttons {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            /* Animation for admin panel */
            @keyframes slideIn {
                from { right: -400px; }
                to { right: 0; }
            }
            
            @keyframes slideOut {
                from { right: 0; }
                to { right: -400px; }
            }
            
            body.admin-panel-open {
                overflow: hidden;
            }
            
            /* Admin badge on the user menu */
            .admin-badge {
                background-color: #dc3545;
                color: white;
                font-size: 10px;
                padding: 2px 5px;
                border-radius: 3px;
                margin-right: 5px;
            }
        </style>
        `;
        
        $('head').append(adminStyles);
        
        // Initialize event handlers
        this.initAdminEventHandlers();
    }
    
    // Render products table
    renderProductsTable() {
        if (!this.products || this.products.length === 0) {
            return '<tr><td colspan="5" class="text-center">אין מוצרים להצגה</td></tr>';
        }
        
        return this.products.map(product => {
            // Find category name
            const category = this.categories.find(c => c.id === product.category);
            const categoryName = category ? category.name : 'ללא קטגוריה';
            
            return `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>₪${product.price}</td>
                <td>${categoryName}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-product" data-product-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-product" data-product-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    }
    
    // Render categories table
    renderCategoriesTable() {
        if (!this.categories || this.categories.length === 0) {
            return '<tr><td colspan="4" class="text-center">אין קטגוריות להצגה</td></tr>';
        }
        
        return this.categories.map(category => {
            return `
            <tr>
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>${category.description || ''}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-category" data-category-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-category" data-category-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    }
    
    // Render category options for select dropdown
    renderCategoryOptions() {
        if (!this.categories || this.categories.length === 0) {
            return '<option value="">אין קטגוריות</option>';
        }
        
        return this.categories.map(category => {
            return `<option value="${category.id}">${category.name}</option>`;
        }).join('');
    }
    
    // Initialize admin panel event handlers
    initAdminEventHandlers() {
        // Close admin panel
        $('#close-admin-panel').on('click', () => {
            this.hideAdminPanel();
        });
        
        // Navigation between sections
        $('.admin-nav-item').on('click', function() {
            // Remove active class from all items
            $('.admin-nav-item').removeClass('active');
            // Add active class to clicked item
            $(this).addClass('active');
            
            // Hide all sections
            $('.admin-section').removeClass('active');
            // Show the selected section
            const section = $(this).data('section');
            $(`#admin-${section}`).addClass('active');
        });
        
        // Save settings button
        $('#site-settings-form').on('submit', (e) => {
            e.preventDefault();
            
            this.settings.siteName = $('#site-name').val();
            this.settings.siteEmail = $('#site-email').val();
            this.settings.sitePhone = $('#site-phone').val();
            this.settings.siteAddress = $('#site-address').val();
            this.settings.productsPerPage = parseInt($('#products-per-page').val(), 10);
            
            if (this.saveSettings()) {
                this.showNotification('ההגדרות נשמרו בהצלחה', 'success');
            }
        });
        
        // Quick action - Add product
        $('#quick-add-product, #add-product-btn').on('click', () => {
            // Clear form
            $('#product-form')[0].reset();
            $('#product-id').val('');
            $('#product-modal-title').text('הוספת מוצר חדש');
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('product-modal'));
            modal.show();
        });
        
        // Quick action - Add category
        $('#quick-add-category, #add-category-btn').on('click', () => {
            // Clear form
            $('#category-form')[0].reset();
            $('#category-id').val('');
            $('#category-modal-title').text('הוספת קטגוריה חדשה');
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('category-modal'));
            modal.show();
        });
        
        // Save product button
        $('#save-product-btn').on('click', () => {
            const productId = $('#product-id').val();
            const product = {
                name: $('#product-name').val(),
                category: parseInt($('#product-category').val(), 10),
                price: parseFloat($('#product-price').val()),
                description: $('#product-description').val()
            };
            
            if (!product.name || !product.price) {
                this.showNotification('אנא מלא את כל השדות הנדרשים', 'error');
                return;
            }
            
            let success;
            
            if (productId) {
                // Update existing product
                success = this.updateProduct(parseInt(productId, 10), product);
                if (success) {
                    this.showNotification('המוצר עודכן בהצלחה', 'success');
                }
            } else {
                // Add new product
                success = this.addProduct(product);
                if (success) {
                    this.showNotification('המוצר נוסף בהצלחה', 'success');
                }
            }
            
            if (success) {
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('product-modal')).hide();
                // Refresh products table
                $('#products-table-body').html(this.renderProductsTable());
                // Refresh dashboard counts
                $('.stat-card:first-child .stat-number').text(this.products.length);
            }
        });
        
        // Edit product buttons
        $(document).on('click', '.edit-product', (e) => {
            const productId = $(e.currentTarget).data('product-id');
            const product = this.products.find(p => p.id === productId);
            
            if (product) {
                $('#product-id').val(product.id);
                $('#product-name').val(product.name);
                $('#product-category').val(product.category);
                $('#product-price').val(product.price);
                $('#product-description').val(product.description || '');
                $('#product-modal-title').text('עריכת מוצר');
                
                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('product-modal'));
                modal.show();
            }
        });
        
        // Delete product buttons
        $(document).on('click', '.delete-product', (e) => {
            const productId = $(e.currentTarget).data('product-id');
            
            if (confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
                if (this.deleteProduct(productId)) {
                    this.showNotification('המוצר נמחק בהצלחה', 'success');
                    // Refresh products table
                    $('#products-table-body').html(this.renderProductsTable());
                    // Refresh dashboard counts
                    $('.stat-card:first-child .stat-number').text(this.products.length);
                }
            }
        });
        
        // Save category button
        $('#save-category-btn').on('click', () => {
            const categoryId = $('#category-id').val();
            const category = {
                name: $('#category-name').val(),
                description: $('#category-description').val()
            };
            
            if (!category.name) {
                this.showNotification('אנא הזן שם קטגוריה', 'error');
                return;
            }
            
            let success;
            
            if (categoryId) {
                // Update existing category
                success = this.updateCategory(parseInt(categoryId, 10), category);
                if (success) {
                    this.showNotification('הקטגוריה עודכנה בהצלחה', 'success');
                }
            } else {
                // Add new category
                success = this.addCategory(category);
                if (success) {
                    this.showNotification('הקטגוריה נוספה בהצלחה', 'success');
                }
            }
            
            if (success) {
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('category-modal')).hide();
                // Refresh categories table
                $('#categories-table-body').html(this.renderCategoriesTable());
                // Refresh dashboard counts
                $('.stat-card:nth-child(2) .stat-number').text(this.categories.length);
                // Update category dropdowns
                $('#product-category').html(this.renderCategoryOptions());
            }
        });
        
        // Edit category buttons
        $(document).on('click', '.edit-category', (e) => {
            const categoryId = $(e.currentTarget).data('category-id');
            const category = this.categories.find(c => c.id === categoryId);
            
            if (category) {
                $('#category-id').val(category.id);
                $('#category-name').val(category.name);
                $('#category-description').val(category.description || '');
                $('#category-modal-title').text('עריכת קטגוריה');
                
                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('category-modal'));
                modal.show();
            }
        });
    }
}

// Create and initialize site manager
const siteManager = new SiteManager();

// Add a toggle button for the admin panel (shown only for admin users)
function initAdminPanel() {
    // Check if user is admin
    const userInfo = JSON.parse(localStorage.getItem('currentUser'));
    
    if (userInfo && userInfo.isAdmin) {
        if ($('#admin-panel-toggle').length === 0) {
            // Create toggle button
            const toggleButton = `
            <div id="admin-panel-toggle" class="floating-admin-toggle">
                <i class="fas fa-cog"></i>
                <span>פאנל ניהול</span>
            </div>
            `;
            
            $('body').append(toggleButton);
            
            // Add CSS for toggle button
            const toggleStyles = `
            <style>
                .floating-admin-toggle {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background-color: #2c3e50;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 50px;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                    cursor: pointer;
                    z-index: 999;
                    display: flex;
                    align-items: center;
                    transition: all 0.3s ease;
                }
                
                .floating-admin-toggle:hover {
                    background-color: #34495e;
                    transform: translateY(-3px);
                }
                
                .floating-admin-toggle i {
                    font-size: 18px;
                    margin-left: 8px;
                }
                
                .floating-admin-toggle span {
                    font-weight: 500;
                }
                
                .admin-notifications {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .admin-notification {
                    background-color: white;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                    border-radius: 8px;
                    padding: 12px 20px;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    transform: translateX(-100%);
                    opacity: 0;
                    transition: all 0.3s ease;
                    max-width: 300px;
                }
                
                .admin-notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                
                .admin-notification i {
                    margin-right: 10px;
                    font-size: 18px;
                }
                
                .admin-notification.success {
                    border-left: 4px solid #28a745;
                }
                
                .admin-notification.success i {
                    color: #28a745;
                }
                
                .admin-notification.error {
                    border-left: 4px solid #dc3545;
                }
                
                .admin-notification.error i {
                    color: #dc3545;
                }
                
                .admin-notification.warning {
                    border-left: 4px solid #ffc107;
                }
                
                .admin-notification.warning i {
                    color: #ffc107;
                }
                
                .admin-notification.info {
                    border-left: 4px solid #17a2b8;
                }
                
                .admin-notification.info i {
                    color: #17a2b8;
                }
            </style>
            `;
            
            $('head').append(toggleStyles);
            
            // Handle toggle button click
            $('#admin-panel-toggle').on('click', function() {
                siteManager.toggleAdminPanel();
            });
        }
    }
}

// Call initAdminPanel when document is ready
$(document).ready(function() {
    // Initialize admin panel if user is admin
    initAdminPanel();
});
