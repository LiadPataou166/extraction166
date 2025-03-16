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

// Admin Panel System
// Check if user is admin when logged in
let isAdmin = false;
const ADMIN_EMAIL = 'liad1111@gmail.com';

// Function to show admin panel
function openAdminPanel() {
    $('#admin-panel').addClass('active');
    loadAdminPanelData();
}

// Function to close admin panel
function closeAdminPanel() {
    $('#admin-panel').removeClass('active');
}

// Function to load data for admin panel
async function loadAdminPanelData() {
    try {
        // Load products data
        await loadProductsData();
        
        // Load categories data
        await loadCategoriesData();
        
        // Load users data
        await loadUsersData();
        
        // Load orders data
        await loadOrdersData();
    } catch (error) {
        console.error('Error loading admin data:', error);
        showNotification('שגיאה בטעינת נתוני הניהול', 'error');
    }
}

// Function to load products data
async function loadProductsData() {
    try {
        // For now, using demo data
        // In real implementation, fetch from Supabase
        const productListBody = $('#product-list-body');
        productListBody.html(`
            <tr>
                <td><img src="/api/placeholder/50/50" alt="מוצר 1" width="50"></td>
                <td>מוצר לדוגמה 1</td>
                <td>קטגוריה 1</td>
                <td>₪149.99</td>
                <td>25</td>
                <td>
                    <button class="action-btn edit-btn" data-id="1"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="1"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
            <tr>
                <td><img src="/api/placeholder/50/50" alt="מוצר 2" width="50"></td>
                <td>מוצר לדוגמה 2</td>
                <td>קטגוריה 2</td>
                <td>₪89.99</td>
                <td>15</td>
                <td>
                    <button class="action-btn edit-btn" data-id="2"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="2"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `);
    } catch (error) {
        console.error('Error loading products data:', error);
        throw error;
    }
}

// Function to load categories data
async function loadCategoriesData() {
    try {
        // For now, using demo data
        const categoryListBody = $('#category-list-body');
        categoryListBody.html(`
            <tr>
                <td>קטגוריה 1</td>
                <td>24</td>
                <td>
                    <button class="action-btn edit-btn" data-id="1"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="1"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
            <tr>
                <td>קטגוריה 2</td>
                <td>18</td>
                <td>
                    <button class="action-btn edit-btn" data-id="2"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="2"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `);
    } catch (error) {
        console.error('Error loading categories data:', error);
        throw error;
    }
}

// Function to load users data
async function loadUsersData() {
    try {
        // For now, using demo data
        const userListBody = $('#user-list-body');
        userListBody.html(`
            <tr>
                <td>לקוח לדוגמה</td>
                <td>customer@example.com</td>
                <td>רגיל</td>
                <td>2025-03-15</td>
                <td>
                    <button class="action-btn edit-btn" data-id="1"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="1"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
            <tr>
                <td>מנהל</td>
                <td>${ADMIN_EMAIL}</td>
                <td>מנהל</td>
                <td>2025-03-10</td>
                <td>
                    <button class="action-btn edit-btn" data-id="2"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="2"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `);
    } catch (error) {
        console.error('Error loading users data:', error);
        throw error;
    }
}

// Function to load orders data
async function loadOrdersData() {
    try {
        // For now, using demo data
        const orderListBody = $('#order-list-body');
        orderListBody.html(`
            <tr>
                <td>#1001</td>
                <td>לקוח לדוגמה</td>
                <td>2025-03-18</td>
                <td>₪299.98</td>
                <td><span class="status-badge completed">הושלם</span></td>
                <td>
                    <button class="action-btn view-btn" data-id="1001"><i class="fas fa-eye"></i></button>
                    <button class="action-btn delete-btn" data-id="1001"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
            <tr>
                <td>#1002</td>
                <td>לקוח לדוגמה 2</td>
                <td>2025-03-17</td>
                <td>₪149.99</td>
                <td><span class="status-badge pending">בטיפול</span></td>
                <td>
                    <button class="action-btn view-btn" data-id="1002"><i class="fas fa-eye"></i></button>
                    <button class="action-btn delete-btn" data-id="1002"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `);
    } catch (error) {
        console.error('Error loading orders data:', error);
        throw error;
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

// Add admin panel HTML to the DOM if it doesn't exist
function addAdminPanelToDOM() {
    // Check if admin panel already exists
    if ($('#admin-panel').length > 0) return;
    
    const adminPanelHTML = `
    <!-- Admin Panel -->
    <div id="admin-panel" class="admin-panel">
        <div class="admin-panel-bg"></div>
        <div class="admin-panel-container">
            <div class="admin-panel-header">
                <h2>פאנל ניהול</h2>
                <button class="close-admin-panel">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="admin-panel-sidebar">
                <ul>
                    <li class="admin-menu-item active" data-target="product-management">ניהול מוצרים</li>
                    <li class="admin-menu-item" data-target="category-management">ניהול קטגוריות</li>
                    <li class="admin-menu-item" data-target="user-management">ניהול משתמשים</li>
                    <li class="admin-menu-item" data-target="order-management">ניהול הזמנות</li>
                    <li class="admin-menu-item" data-target="site-settings">הגדרות אתר</li>
                </ul>
            </div>
            
            <div class="admin-panel-content">
                <!-- Product Management -->
                <div id="product-management" class="admin-tab active">
                    <h3>ניהול מוצרים</h3>
                    
                    <div class="admin-actions">
                        <button id="add-product-btn" class="admin-btn">הוסף מוצר חדש</button>
                        <input type="text" id="product-search" placeholder="חפש מוצרים...">
                    </div>
                    
                    <div class="product-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>תמונה</th>
                                    <th>שם המוצר</th>
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
                
                <!-- Category Management -->
                <div id="category-management" class="admin-tab">
                    <h3>ניהול קטגוריות</h3>
                    
                    <div class="admin-actions">
                        <button id="add-category-btn" class="admin-btn">הוסף קטגוריה חדשה</button>
                    </div>
                    
                    <div class="category-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>שם הקטגוריה</th>
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
                
                <!-- User Management -->
                <div id="user-management" class="admin-tab">
                    <h3>ניהול משתמשים</h3>
                    
                    <div class="user-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>שם</th>
                                    <th>אימייל</th>
                                    <th>סוג חשבון</th>
                                    <th>תאריך הרשמה</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody id="user-list-body">
                                <!-- Users will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Order Management -->
                <div id="order-management" class="admin-tab">
                    <h3>ניהול הזמנות</h3>
                    
                    <div class="order-list">
                        <table>
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
                
                <!-- Site Settings -->
                <div id="site-settings" class="admin-tab">
                    <h3>הגדרות אתר</h3>
                    
                    <form id="site-settings-form">
                        <div class="form-group">
                            <label for="site-title">כותרת האתר</label>
                            <input type="text" id="site-title" value="Doctor Instraction - חנות מקצועית">
                        </div>
                        
                        <div class="form-group">
                            <label for="site-description">תיאור האתר</label>
                            <textarea id="site-description">חנות מקצועית ומובילה עם מוצרים איכותיים במחירים אטרקטיביים. הצטרפו למועדון ה-VIP וקבלו הטבות בלעדיות.</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="site-logo">לוגו האתר</label>
                            <div class="logo-preview">
                                <img src="/api/placeholder/40/40" alt="Site Logo">
                            </div>
                            <input type="file" id="site-logo">
                        </div>
                        
                        <button type="submit" class="admin-btn">שמור שינויים</button>
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
                <button class="close-admin-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="add-product-form">
                <div class="form-group">
                    <label for="product-name">שם המוצר</label>
                    <input type="text" id="product-name" required>
                </div>
                
                <div class="form-group">
                    <label for="product-category">קטגוריה</label>
                    <select id="product-category" required>
                        <option value="">בחר קטגוריה</option>
                        <option value="1">קטגוריה 1</option>
                        <option value="2">קטגוריה 2</option>
                        <option value="3">קטגוריה 3</option>
                        <option value="4">קטגוריה 4</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="product-price">מחיר</label>
                    <input type="number" id="product-price" step="0.01" required>
                </div>
                
                <div class="form-group">
                    <label for="product-old-price">מחיר קודם (אופציונלי)</label>
                    <input type="number" id="product-old-price" step="0.01">
                </div>
                
                <div class="form-group">
                    <label for="product-stock">מלאי</label>
                    <input type="number" id="product-stock" required>
                </div>
                
                <div class="form-group">
                    <label for="product-description">תיאור</label>
                    <textarea id="product-description" required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="product-image">תמונה</label>
                    <input type="file" id="product-image" accept="image/*" required>
                </div>
                
                <div class="form-group">
                    <label for="product-badge">תג (אופציונלי)</label>
                    <select id="product-badge">
                        <option value="">ללא תג</option>
                        <option value="new">חדש</option>
                        <option value="hot">מבצע</option>
                        <option value="sale">מכירה</option>
                        <option value="vip">VIP</option>
                    </select>
                </div>
                
                <button type="submit" class="admin-btn">הוסף מוצר</button>
            </form>
        </div>
    </div>
    `;
    
    $('body').append(adminPanelHTML);
    
    // Add CSS for admin panel
    const adminPanelCSS = `
    <style>
        /* Admin Panel Styles */
        .admin-panel {
            position: fixed;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            z-index: 3000;
            display: none;
        }

        .admin-panel.active {
            display: block;
        }

        .admin-panel-bg {
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }

        .admin-panel-container {
            position: absolute;
            top: 50%;
            right: 50%;
            transform: translate(50%, -50%);
            width: 90%;
            max-width: 1200px;
            height: 80%;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .admin-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background-color: #2c3e50;
            color: #fff;
        }

        .admin-panel-header h2 {
            margin: 0;
            font-size: 1.5rem;
        }

        .close-admin-panel {
            background: none;
            border: none;
            color: #fff;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 5px;
        }

        .admin-panel-sidebar {
            width: 220px;
            background-color: #34495e;
            color: #fff;
            position: absolute;
            top: 63px;
            right: 0;
            bottom: 0;
            overflow-y: auto;
        }

        .admin-panel-sidebar ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .admin-panel-sidebar .admin-menu-item {
            padding: 15px 20px;
            cursor: pointer;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: background-color 0.3s;
        }

        .admin-panel-sidebar .admin-menu-item:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .admin-panel-sidebar .admin-menu-item.active {
            background-color: #3498db;
        }

        .admin-panel-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            margin-right: 220px;
        }

        .admin-tab {
            display: none;
        }

        .admin-tab.active {
            display: block;
        }

        .admin-actions {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .admin-btn {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        .admin-btn:hover {
            background-color: #2980b9;
        }

        .admin-panel table {
            width: 100%;
            border-collapse: collapse;
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

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }

        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group input[type="file"],
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
        }

        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }

        .logo-preview {
            margin-bottom: 10px;
        }

        .logo-preview img {
            max-width: 100px;
            height: auto;
        }

        /* Admin Modal */
        .admin-modal {
            position: fixed;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            z-index: 3100;
            display: none;
        }

        .admin-modal.active {
            display: block;
        }

        .admin-modal-bg {
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
        }

        .admin-modal-container {
            position: absolute;
            top: 50%;
            right: 50%;
            transform: translate(50%, -50%);
            width: 90%;
            max-width: 600px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .admin-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background-color: #2c3e50;
            color: #fff;
        }

        .admin-modal-header h3 {
            margin: 0;
        }

        .close-admin-modal {
            background: none;
            border: none;
            color: #fff;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 5px;
        }

        .admin-modal form {
            padding: 20px;
        }
        
        /* Status badges for orders */
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 0.85rem;
            font-weight: 600;
            text-align: center;
        }
        
        .status-badge.completed {
            background-color: rgba(46, 204, 113, 0.2);
            color: #2ecc71;
        }
        
        .status-badge.pending {
            background-color: rgba(243, 156, 18, 0.2);
            color: #f39c12;
        }
        
        .status-badge.cancelled {
            background-color: rgba(231, 76, 60, 0.2);
            color: #e74c3c;
        }
    </style>
    `;
    
    $('head').append(adminPanelCSS);
}

// Add admin menu item to the navigation
function addAdminMenuItemToNav() {
    // Check if admin menu item already exists
    if ($('#admin-menu-item').length > 0) return;
    
    // Add admin menu item to navigation
    $('nav ul').append('<li id="admin-menu-item" style="display: none;"><a href="#" class="admin-panel-btn">פאנל ניהול</a></li>');
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

// Override login function to check for admin
const originalLoginForm = $('#login-form').on('submit');
$('#login-form').off('submit').on('submit', async function(e) {
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
        
        showNotification('התחברת בהצלחה!', 'success');
        hideAuthModal();
        updateUserUI(userData);
        
        // Save user data to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Check if user is admin
        if (email === ADMIN_EMAIL) {
            // Open admin panel automatically
            setTimeout(() => {
                openAdminPanel();
            }, 500);
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showAuthError('login', error.message || 'Failed to login. Please check your credentials.');
    } finally {
        // Reset button state
        $('#login-submit').prop('disabled', false).text('התחברות');
    }
});

// Document ready event handlers for admin panel
$(document).ready(function() {
    // Add admin panel elements to DOM
    addAdminPanelToDOM();
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
    
    // Admin panel open/close
    $(document).on('click', '.admin-panel-btn', function(e) {
        e.preventDefault();
        openAdminPanel();
    });
    
    $(document).on('click', '.close-admin-panel', function() {
        closeAdminPanel();
    });
    
    $(document).on('click', '.admin-panel-bg', function() {
        closeAdminPanel();
    });
    
    // Add product button
    $(document).on('click', '#add-product-btn', function() {
        openAddProductModal();
    });
    
    // Close modal buttons
    $(document).on('click', '.close-admin-modal', function() {
        closeAddProductModal();
    });
    
    $(document).on('click', '.admin-modal-bg', function() {
        closeAddProductModal();
    });
    
    // Add product form submission
    $(document).on('submit', '#add-product-form', function(e) {
        e.preventDefault();
        
        // Get form data
        const productName = $('#product-name').val();
        const productCategory = $('#product-category').val();
        const productPrice = $('#product-price').val();
        const productOldPrice = $('#product-old-price').val();
        const productStock = $('#product-stock').val();
        const productDescription = $('#product-description').val();
        const productBadge = $('#product-badge').val();
        
        // In a real implementation, you would also handle the image upload
        
        // For now, just show a success message
        showNotification('המוצר נוסף בהצלחה!', 'success');
        closeAddProductModal();
        
        // Add a new row to the product list
        $('#product-list-body').prepend(`
            <tr>
                <td><img src="/api/placeholder/50/50" alt="${productName}" width="50"></td>
                <td>${productName}</td>
                <td>קטגוריה ${productCategory}</td>
                <td>₪${productPrice}</td>
                <td>${productStock}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="new"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="new"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `);
    });
    
    // Save site settings form
    $(document).on('submit', '#site-settings-form', function(e) {
        e.preventDefault();
        
        const siteTitle = $('#site-title').val();
        const siteDescription = $('#site-description').val();
        
        // In a real implementation, you would save these settings to the database
        
        showNotification('הגדרות האתר נשמרו בהצלחה!', 'success');
    });
    
    // Delete product button
    $(document).on('click', '.delete-btn', function() {
        const id = $(this).data('id');
        if (confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
            // In a real implementation, you would delete from the database
            $(this).closest('tr').fadeOut(300, function() {
                $(this).remove();
            });
            showNotification('הפריט נמחק בהצלחה', 'success');
        }
    });
    
    // Edit product button (placeholder functionality)
    $(document).on('click', '.edit-btn', function() {
        const id = $(this).data('id');
        showNotification('עריכת פריט #' + id + ' תהיה זמינה בקרוב', 'info');
    });
    
    // Product search functionality
    $(document).on('keyup', '#product-search', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('#product-list-body tr').each(function() {
            const productName = $(this).find('td:nth-child(2)').text().toLowerCase();
            const productCategory = $(this).find('td:nth-child(3)').text().toLowerCase();
            
            if (productName.includes(searchTerm) || productCategory.includes(searchTerm)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
    
    // Add category button (placeholder functionality)
    $(document).on('click', '#add-category-btn', function() {
        const categoryName = prompt('הזן שם קטגוריה:');
        if (categoryName) {
            $('#category-list-body').prepend(`
                <tr>
                    <td>${categoryName}</td>
                    <td>0</td>
                    <td>
                        <button class="action-btn edit-btn" data-id="new"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" data-id="new"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `);
            showNotification('הקטגוריה נוספה בהצלחה', 'success');
        }
    });
    
    // Check login status on page load
    const checkAdminStatus = async function() {
        try {
            if (!supabase) return;
            
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            
            if (data && data.session) {
                const user = data.session.user;
                if (user.email === ADMIN_EMAIL) {
                    // User is admin, make sure admin menu is shown
                    isAdmin = true;
                    $('#admin-menu-item').show();
                }
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    };
    
    // Run admin check
    checkAdminStatus();
});
