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
const SUPABASE_URL = 'https://xyzcompany.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia2diYWV0c2d0em9yZHZrY3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMjAzMTMsImV4cCI6MjA1NzY5NjMxM30.fype9g6RIKCYHJvXJN8b_kFFnkehACo3inpXa382GgI';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// משתנים גלובליים
let currentUser = null;
const ADMIN_EMAIL = 'liad1111@gmail.com';
let isAdmin = false;

// פונקציה להצגת הודעות למשתמש
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon;
    switch(type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-exclamation-circle';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            break;
        default:
            icon = 'fa-info-circle';
    }
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // הצג את ההודעה
    setTimeout(() => {
        notification.classList.add('show');
    }, 50);
    
    // הסר את ההודעה לאחר 3 שניות
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// פונקציה לבדיקה אם המשתמש הוא מנהל
function isUserAdmin(user) {
    return user && user.email === ADMIN_EMAIL;
}

// עדכון ממשק המשתמש בהתאם לסטטוס ההתחברות
function updateUserUI(userData) {
    const authLinks = document.querySelector('.auth-links');
    const adminMenuItem = document.getElementById('admin-menu-item');
    
    if (userData) {
        // המשתמש מחובר
        authLinks.innerHTML = `
            <span>שלום, ${userData.name || userData.email}</span>
            <a href="#" id="logout-link">התנתק</a>
        `;
        
        // הוסף פונקציונליות התנתקות
        document.getElementById('logout-link').addEventListener('click', async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            showNotification('התנתקת בהצלחה', 'success');
            currentUser = null;
            isAdmin = false;
            updateUserUI(null);
        });
        
        // בדוק אם המשתמש הוא מנהל
        if (isUserAdmin(userData)) {
            isAdmin = true;
            adminMenuItem.style.display = 'inline-block';
                } else {
            isAdmin = false;
            adminMenuItem.style.display = 'none';
                }
        } else {
        // המשתמש לא מחובר
        authLinks.innerHTML = `
            <a href="#" class="show-login">התחברות</a>
            <a href="#" class="show-register">הרשמה</a>
        `;
        
        // הסתר את פריט פאנל הניהול בתפריט
        adminMenuItem.style.display = 'none';
        isAdmin = false;
        
        // אתחול מחדש של כפתורי פתיחת החלונות המודליים
        document.querySelector('.show-login').addEventListener('click', showLoginModal);
        document.querySelector('.show-register').addEventListener('click', showRegisterModal);
    }
}

// פתיחת חלון התחברות
function showLoginModal(e) {
    e.preventDefault();
    document.querySelector('.auth-modal').classList.add('active');
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
    document.querySelector('.auth-tab[data-target="login-form"]').classList.add('active');
    document.querySelector('.auth-tab[data-target="register-form"]').classList.remove('active');
}

// פתיחת חלון הרשמה
function showRegisterModal(e) {
    e.preventDefault();
    document.querySelector('.auth-modal').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
    document.querySelector('.auth-tab[data-target="login-form"]').classList.remove('active');
    document.querySelector('.auth-tab[data-target="register-form"]').classList.add('active');
}

// סגירת חלון האימות
function hideAuthModal() {
    document.querySelector('.auth-modal').classList.remove('active');
}

// פתיחת פאנל הניהול
function openAdminPanel() {
    if (!isAdmin) {
        showNotification('אין לך הרשאות מנהל', 'error');
        return;
    }
    
    document.getElementById('admin-panel').classList.add('active');
    
    // טען נתונים לפאנל הניהול
    loadAdminPanelData();
}

// סגירת פאנל הניהול
function closeAdminPanel() {
    document.getElementById('admin-panel').classList.remove('active');
}

// טעינת נתונים לפאנל הניהול
async function loadAdminPanelData() {
    try {
        // טעינת מוצרים מ-Supabase
        await loadProductsData();
        
        // טעינת קטגוריות מ-Supabase
        await loadCategoriesData();
        
        // טעינת משתמשים מ-Supabase
        await loadUsersData();
        
        // טעינת הזמנות מ-Supabase
        await loadOrdersData();
    } catch (error) {
        console.error('Error loading admin data:', error);
        showNotification('שגיאה בטעינת נתוני הניהול', 'error');
    }
}

// טעינת מוצרים מ-Supabase
async function loadProductsData() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const productListBody = document.getElementById('product-list-body');
        
        if (products && products.length > 0) {
            productListBody.innerHTML = '';
            
            products.forEach(product => {
                productListBody.innerHTML += `
                    <tr>
                        <td><img src="${product.image_url || '/api/placeholder/50/50'}" alt="${product.name}" width="50"></td>
                        <td>${product.name}</td>
                        <td>${product.category}</td>
                        <td>₪${product.price}</td>
                        <td>${product.stock}</td>
                        <td>
                            <button class="action-btn edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete-btn" data-id="${product.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
                `;
            });
        } else {
            productListBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">אין מוצרים</td>
            </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading products data:', error);
        throw error;
    }
}

// טעינת קטגוריות מ-Supabase
async function loadCategoriesData() {
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*, products:products(id)');
        
        if (error) throw error;
        
        const categoryListBody = document.getElementById('category-list-body');
        
        if (categories && categories.length > 0) {
            categoryListBody.innerHTML = '';
            
            categories.forEach(category => {
                const productCount = category.products ? category.products.length : 0;
                
                categoryListBody.innerHTML += `
                    <tr>
                        <td>${category.name}</td>
                        <td>${productCount}</td>
                        <td>
                            <button class="action-btn edit-btn" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete-btn" data-id="${category.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
                `;
            });
                } else {
            categoryListBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center">אין קטגוריות</td>
            </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading categories data:', error);
        throw error;
    }
}

// טעינת משתמשים מ-Supabase
async function loadUsersData() {
    try {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const userListBody = document.getElementById('user-list-body');
        
        if (users && users.length > 0) {
            userListBody.innerHTML = '';
            
            users.forEach(user => {
                userListBody.innerHTML += `
                    <tr>
                        <td>${user.full_name || 'לא צוין'}</td>
                        <td>${user.email}</td>
                        <td>${user.email === ADMIN_EMAIL ? 'מנהל' : 'רגיל'}</td>
                        <td>${new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="action-btn edit-btn" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete-btn" data-id="${user.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
                `;
            });
        } else {
            userListBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">אין משתמשים</td>
            </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading users data:', error);
        throw error;
    }
}

// טעינת הזמנות מ-Supabase
async function loadOrdersData() {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, profile:profiles(*)')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const orderListBody = document.getElementById('order-list-body');
        
        if (orders && orders.length > 0) {
            orderListBody.innerHTML = '';
            
            orders.forEach(order => {
                // סטטוס בהתאם למצב ההזמנה
                let statusClass = '';
                switch (order.status) {
                    case 'completed':
                        statusClass = 'completed';
                        break;
                    case 'pending':
                        statusClass = 'pending';
                        break;
                    case 'cancelled':
                        statusClass = 'cancelled';
                        break;
                    default:
                        statusClass = 'pending';
                }
                
                const statusText = {
                    'completed': 'הושלם',
                    'pending': 'בטיפול',
                    'cancelled': 'בוטל'
                };
                
                orderListBody.innerHTML += `
                    <tr>
                        <td>#${order.id}</td>
                        <td>${order.profile ? (order.profile.full_name || order.profile.email) : 'לקוח לא ידוע'}</td>
                        <td>${new Date(order.created_at).toLocaleDateString()}</td>
                        <td>₪${order.total_amount}</td>
                        <td><span class="status-badge ${statusClass}">${statusText[order.status] || 'בטיפול'}</span></td>
                        <td>
                            <button class="action-btn view-btn" data-id="${order.id}"><i class="fas fa-eye"></i></button>
                            <button class="action-btn delete-btn" data-id="${order.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
                `;
            });
        } else {
            orderListBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">אין הזמנות</td>
            </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading orders data:', error);
        throw error;
    }
}

// פונקציה להוספת מוצר חדש ל-Supabase
async function addProduct(productData) {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([productData]);
        
        if (error) throw error;
        
        showNotification('המוצר נוסף בהצלחה', 'success');
        loadProductsData(); // רענן את רשימת המוצרים
        
        return data;
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('שגיאה בהוספת המוצר', 'error');
        throw error;
    }
}

// פונקציה לעדכון מוצר קיים ב-Supabase
async function updateProduct(productId, productData) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', productId);
        
        if (error) throw error;
        
        showNotification('המוצר עודכן בהצלחה', 'success');
        loadProductsData(); // רענן את רשימת המוצרים
        
        return data;
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('שגיאה בעדכון המוצר', 'error');
        throw error;
    }
}

// פונקציה למחיקת מוצר מ-Supabase
async function deleteProduct(productId) {
    try {
        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
        showNotification('המוצר נמחק בהצלחה', 'success');
        loadProductsData(); // רענן את רשימת המוצרים
        
        return data;
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('שגיאה במחיקת המוצר', 'error');
        throw error;
    }
}

// פונקציה להוספת קטגוריה חדשה ל-Supabase
async function addCategory(categoryData) {
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([categoryData]);
        
        if (error) throw error;
        
        showNotification('הקטגוריה נוספה בהצלחה', 'success');
        loadCategoriesData(); // רענן את רשימת הקטגוריות
        
        return data;
    } catch (error) {
        console.error('Error adding category:', error);
        showNotification('שגיאה בהוספת הקטגוריה', 'error');
        throw error;
    }
}

// פתיחת חלון הוספת מוצר
function openAddProductModal() {
    document.getElementById('add-product-modal').classList.add('active');
    
    // טען את רשימת הקטגוריות לתיבת הבחירה
    loadCategoriesForSelect();
}

// טעינת קטגוריות לתיבת הבחירה של המוצר
async function loadCategoriesForSelect() {
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('id, name');
        
        if (error) throw error;
        
        const categorySelect = document.getElementById('product-category');
        
        // נקה את האפשרויות הקיימות
        categorySelect.innerHTML = '<option value="">בחר קטגוריה</option>';
        
        // הוסף את הקטגוריות מ-Supabase
        if (categories && categories.length > 0) {
            categories.forEach(category => {
                categorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading categories for select:', error);
    }
}

// סגירת חלון הוספת מוצר
function closeAddProductModal() {
    document.getElementById('add-product-modal').classList.remove('active');
    document.getElementById('add-product-form').reset();
}

// פונקציה להעלאת תמונה ל-Supabase Storage
async function uploadProductImage(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `product-images/${fileName}`;
        
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);
        
        if (error) throw error;
        
        // קבל את ה-URL הציבורי של התמונה
        const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);
        
        return publicUrlData.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// התחברות עם Supabase
async function loginUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // שמור את פרטי המשתמש במשתנה הגלובלי
        currentUser = data.user;
        
        // בדוק אם המשתמש הוא מנהל
        isAdmin = isUserAdmin(currentUser);
        
        // עדכן את ממשק המשתמש עם פרטי המשתמש
        const userData = {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.user_metadata && currentUser.user_metadata.full_name ? currentUser.user_metadata.full_name : currentUser.email.split('@')[0]
        };
        
        showNotification('התחברת בהצלחה!', 'success');
        hideAuthModal();
        updateUserUI(userData);
        
        // אם המשתמש הוא מנהל, פתח את פאנל הניהול אוטומטית
        if (isAdmin) {
            setTimeout(() => {
                openAdminPanel();
            }, 500);
        }
        
    return true;
    } catch (error) {
        console.error('Login error:', error.message);
        document.getElementById('login-error').textContent = 'שגיאת התחברות: ' + error.message;
        document.getElementById('login-error').style.display = 'block';
        return false;
    }
}

// הרשמה עם Supabase
async function registerUser(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        
        if (error) throw error;
        
        showNotification('נרשמת בהצלחה! בדוק את האימייל שלך לאימות.', 'success');
        hideAuthModal();
        
        // אם יש משתמש וההרשמה הצליחה ללא צורך באימות אימייל
        if (data.user && !data.session) {
            showNotification('נשלח אליך אימייל לאימות החשבון', 'info');
        } else if (data.user && data.session) {
            // המשתמש נרשם והתחבר מיד
            currentUser = data.user;
            
            // עדכן את ממשק המשתמש עם פרטי המשתמש
            const userData = {
                id: currentUser.id,
                email: currentUser.email,
                name: currentUser.user_metadata && currentUser.user_metadata.full_name ? currentUser.user_metadata.full_name : currentUser.email.split('@')[0]
            };
            
            updateUserUI(userData);
        }
        
            return true;
    } catch (error) {
        console.error('Registration error:', error.message);
        document.getElementById('register-error').textContent = 'שגיאת הרשמה: ' + error.message;
        document.getElementById('register-error').style.display = 'block';
            return false;
        }
}

// הוספת מאזיני אירועים
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // בדוק אם יש משתמש מחובר
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
            currentUser = user;
            isAdmin = isUserAdmin(user);
            
            // עדכן את ממשק המשתמש
            const userData = {
                id: user.id,
                email: user.email,
                name: user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : user.email.split('@')[0]
            };
            
            updateUserUI(userData);
        }
        
        // אירועי התחברות
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // נקה הודעות שגיאה קודמות
            document.getElementById('login-error').style.display = 'none';
            
            await loginUser(email, password);
        });
        
        // אירועי הרשמה
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm').value;
            
            // נקה הודעות שגיאה קודמות
            document.getElementById('register-error').style.display = 'none';
            
            // בדיקת התאמת סיסמאות
            if (password !== confirmPassword) {
                document.getElementById('register-error').textContent = 'הסיסמאות אינן תואמות';
                document.getElementById('register-error').style.display = 'block';
                return;
            }
            
            await registerUser(email, password, fullName);
        });
        
        // הצגת חלונות התחברות והרשמה
        document.querySelectorAll('.show-login').forEach(btn => {
            btn.addEventListener('click', showLoginModal);
        });
        
        document.querySelectorAll('.show-register').forEach(btn => {
            btn.addEventListener('click', showRegisterModal);
        });
        
        // מעבר בין לשוניות התחברות והרשמה
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-target');
                
                // הסר את המחלקה 'active' מכל הלשוניות והטפסים
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                
                // הוסף את המחלקה 'active' ללשונית ולטופס הנבחרים
                tab.classList.add('active');
                document.getElementById(target).classList.add('active');
            });
        });
        
        // סגירת חלונות מודליים
        document.querySelector('.close-auth').addEventListener('click', hideAuthModal);
        document.querySelector('.auth-modal-bg').addEventListener('click', hideAuthModal);
        
        // ניהול פאנל מנהל
        document.querySelector('.admin-panel-btn').addEventListener('click', (e) => {
            e.preventDefault();
            openAdminPanel();
        });
        
        document.querySelector('.close-admin-panel').addEventListener('click', closeAdminPanel);
        document.querySelector('.admin-panel-bg').addEventListener('click', closeAdminPanel);
        
        // מעבר בין לשוניות בפאנל המנהל
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                // הסר את המחלקה 'active' מכל פריטי התפריט
                document.querySelectorAll('.admin-menu-item').forEach(i => i.classList.remove('active'));
                // הסר את המחלקה 'active' מכל הלשוניות
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                
                // הוסף את המחלקה 'active' לפריט שנבחר
                item.classList.add('active');
                
                // הצג את הלשונית המתאימה
                const target = item.getAttribute('data-target');
                document.getElementById(target).classList.add('active');
            });
        });
        
        // פתיחת חלון הוספת מוצר
        document.getElementById('add-product-btn').addEventListener('click', openAddProductModal);
        
        // סגירת חלון הוספת מוצר
        document.querySelector('.close-admin-modal').addEventListener('click', closeAddProductModal);
        document.querySelector('.admin-modal-bg').addEventListener('click', closeAddProductModal);
        
        // הוספת מוצר חדש
        document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
            
            const formData = new FormData(e.target);
            const productName = formData.get('product-name');
            const categoryId = formData.get('product-category');
            const price = parseFloat(formData.get('product-price'));
            const oldPrice = formData.get('product-old-price') ? parseFloat(formData.get('product-old-price')) : null;
            const stock = parseInt(formData.get('product-stock'));
            const description = formData.get('product-description');
            const badge = formData.get('product-badge');
            const imageFile = document.getElementById('product-image').files[0];
            
            try {
                // כפתור שליחה - שינוי מצב טעינה
                const submitBtn = document.getElementById('add-product-form').querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'מעלה...';
                
                // העלאת תמונה אם נבחרה
                let imageUrl = '/api/placeholder/300/300'; // תמונת ברירת מחדל
                if (imageFile) {
                    imageUrl = await uploadProductImage(imageFile);
                }
                
                // יצירת אובייקט המוצר
                const productData = {
                    name: productName,
                    category_id: categoryId,
                    price: price,
                    old_price: oldPrice,
                    stock: stock,
                    description: description,
                    badge: badge,
                    image_url: imageUrl,
                    created_at: new Date().toISOString()
                };
                
                // הוספת המוצר ל-Supabase
                await addProduct(productData);
                
                // סגירת החלון המודלי וניקוי הטופס
                closeAddProductModal();
                e.target.reset();
    } catch (error) {
                console.error('Error adding product:', error);
                showNotification('שגיאה בהוספת המוצר', 'error');
            } finally {
                // החזרת כפתור השליחה למצב רגיל
                const submitBtn = document.getElementById('add-product-form').querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'הוסף מוצר';
            }
        });
        
        // הוספת קטגוריה חדשה
        document.getElementById('add-category-btn').addEventListener('click', async () => {
            const categoryName = prompt('הזן שם קטגוריה:');
            if (categoryName && categoryName.trim() !== '') {
                try {
                    await addCategory({ name: categoryName });
    } catch (error) {
                    console.error('Error adding category:', error);
                    showNotification('שגיאה בהוספת הקטגוריה', 'error');
                }
            }
        });
        
        // מחיקת מוצר
        document.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-btn')) {
                const button = e.target.closest('.delete-btn');
                const id = button.getAttribute('data-id');
                const type = button.closest('table').id.includes('product') ? 'product' : 
                             button.closest('table').id.includes('category') ? 'category' : 
                             button.closest('table').id.includes('user') ? 'user' : 'order';
                
                if (confirm(`האם אתה בטוח שברצונך למחוק ${type === 'product' ? 'מוצר' : type === 'category' ? 'קטגוריה' : type === 'user' ? 'משתמש' : 'הזמנה'} זה?`)) {
                    try {
                        switch (type) {
                            case 'product':
                                await deleteProduct(id);
                                break;
                            case 'category':
                                await deleteCategory(id);
                                break;
                            case 'user':
                                await deleteUser(id);
                                break;
                            case 'order':
                                await deleteOrder(id);
                                break;
                        }
                    } catch (error) {
                        console.error(`Error deleting ${type}:`, error);
                        showNotification(`שגיאה במחיקת ${type === 'product' ? 'המוצר' : type === 'category' ? 'הקטגוריה' : type === 'user' ? 'המשתמש' : 'ההזמנה'}`, 'error');
                    }
                }
            }
        });
        
        // שינוי הגדרות האתר
        document.getElementById('site-settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
            
            const siteTitle = document.getElementById('site-title').value;
            const siteDescription = document.getElementById('site-description').value;
            const logoFile = document.getElementById('site-logo').files[0];
            
            try {
                let logoUrl = null;
                if (logoFile) {
                    // העלאת לוגו חדש
                    const fileExt = logoFile.name.split('.').pop();
                    const fileName = `site-logo.${fileExt}`;
                    const filePath = `site-assets/${fileName}`;
                    
                    const { data, error } = await supabase.storage
                        .from('site-assets')
                        .upload(filePath, logoFile, { upsert: true });
                    
                    if (error) throw error;
                    
                    // קבלת URL הציבורי של הלוגו
                    const { data: publicUrlData } = supabase.storage
                        .from('site-assets')
                        .getPublicUrl(filePath);
                    
                    logoUrl = publicUrlData.publicUrl;
                }
                
                // עדכון הגדרות האתר ב-Supabase
                const { data, error } = await supabase
                    .from('site_settings')
                    .upsert([
                        {
                            id: 1, // הנחה שיש רק שורה אחת של הגדרות
                            title: siteTitle,
                            description: siteDescription,
                            logo_url: logoUrl || document.querySelector('.logo img').src,
                            updated_at: new Date().toISOString()
                        }
                    ]);
                
                if (error) throw error;
                
                showNotification('הגדרות האתר נשמרו בהצלחה', 'success');
                
                // עדכון הכותרת והתיאור בעמוד
                document.title = siteTitle;
                document.querySelector('meta[name="description"]').setAttribute('content', siteDescription);
                
                // עדכון הלוגו אם הועלה חדש
                if (logoUrl) {
                    document.querySelector('.logo img').src = logoUrl;
                }
            } catch (error) {
                console.error('Error updating site settings:', error);
                showNotification('שגיאה בשמירת הגדרות האתר', 'error');
            }
        });
        
        // חיפוש מוצרים בפאנל המנהל
        document.getElementById('product-search').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const productRows = document.querySelectorAll('#product-list-body tr');
            
            productRows.forEach(row => {
                const productName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const productCategory = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            
            if (productName.includes(searchTerm) || productCategory.includes(searchTerm)) {
                    row.style.display = '';
            } else {
                    row.style.display = 'none';
            }
        });
    });
    
        } catch (error) {
        console.error('Error in DOMContentLoaded:', error);
        }
});
