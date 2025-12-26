// Main Application JavaScript

// Initialize variables
let currentSlide = 0;
let slides = [];
let sliderInterval;
let allProducts = [];
let featuredProducts = [];
let allBrands = [];
let cart = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSliderImages();
    loadBrands();
    loadProducts();
    loadCart();
    
    // Setup slider navigation
    setupSliderNavigation();
    
    // Setup filter functionality
    setupFilters();
    
    // Setup view toggle
    
    // Setup search
    setupSearch();
    
    // Setup mobile menu
    setupMobileMenu();
});

// Setup Mobile Menu Toggle
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 767) {
                    navMenu.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 767) {
                if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    navMenu.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            }
        });
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 767) {
                    navMenu.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            }, 250);
        });
    }
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCartCount();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Update cart count display
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Also update cart count on product detail page if it exists
    const cartCountDetail = document.getElementById('cartCountDetail');
    if (cartCountDetail) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountDetail.textContent = totalItems;
        cartCountDetail.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Setup search functionality
function setupSearch() {
    const mainSearch = document.getElementById('mainSearch');
    const searchBtn = document.getElementById('searchBtn');
    
    const performSearch = () => {
        const query = mainSearch.value.toLowerCase().trim();
        filterProductsBySearch(query);
    };
    
    if (mainSearch) {
        mainSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
}

// Filter products by search query
function filterProductsBySearch(query) {
    // Update filter search if main search is used
    const filterSearch = document.getElementById('filterSearch');
    if (filterSearch) {
        filterSearch.value = query;
    }
    
    // Use the unified filter function
    filterAndSortProducts();
    
    // Also filter featured products separately (they have their own section)
    if (query) {
        const filteredFeatured = featuredProducts.filter(product => {
            const name = (product.name || '').toLowerCase();
            const brand = (product.brand || '').toLowerCase();
            let flavourStr = '';
            if (product.flavour) {
                if (Array.isArray(product.flavour)) {
                    flavourStr = product.flavour.join(' ').toLowerCase();
                } else {
                    flavourStr = (product.flavour || '').toLowerCase();
                }
            }
            const description = (product.description || '').toLowerCase();
            return name.includes(query) || brand.includes(query) || flavourStr.includes(query) || description.includes(query);
        });
        renderProducts(filteredFeatured, document.getElementById('featuredProductsGrid'));
    } else {
        renderProducts(featuredProducts, document.getElementById('featuredProductsGrid'));
    }
}

// Load Slider Images from Firebase
function loadSliderImages() {
    // Use onSnapshot for real-time updates across all devices
    db.collection('sliders').doc('main').onSnapshot((doc) => {
        console.log('Slider data updated');
        console.log('Document snapshot:', doc);
        
        // Check if document exists - handle both compat and regular modes
        let sliderData = null;
        if (doc) {
            // Try to get data first (works in both v8 and v9)
            try {
                const data = doc.data();
                if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                    sliderData = data;
                    console.log('Document data found:', sliderData);
                } else {
                    // Check if document exists (property or function)
                    const exists = (typeof doc.exists === 'function') ? doc.exists() : (doc.exists !== undefined ? doc.exists : false);
                    if (exists) {
                        console.log('Document exists but has no data or empty data');
                    } else {
                        console.log('Document does not exist');
                    }
                }
            } catch (error) {
                console.error('Error reading document data:', error);
                // Try alternative method
                if (doc.exists) {
                    const exists = (typeof doc.exists === 'function') ? doc.exists() : doc.exists;
                    if (exists && doc.data) {
                        sliderData = doc.data();
                        console.log('Document data found (alternative method):', sliderData);
                    }
                }
            }
        } else {
            console.log('No document snapshot received');
        }
        
        slides = [];
        
        if (sliderData && Object.keys(sliderData).length > 0) {
            console.log('Found slider data in Firebase:', sliderData);
            console.log('All keys in sliderData:', Object.keys(sliderData));
            
            // Collect ALL available slider images from Firebase (supports unlimited images)
            const imageKeys = Object.keys(sliderData)
                .filter(key => key.startsWith('image'))
                .sort((a, b) => {
                    const numA = parseInt(a.replace('image', '')) || 0;
                    const numB = parseInt(b.replace('image', '')) || 0;
                    return numA - numB;
                });
            
            console.log(`Found ${imageKeys.length} image keys in Firebase:`, imageKeys);
            
            // Process all images - no limit
            imageKeys.forEach((imageKey, index) => {
                const imagePath = sliderData[imageKey];
                console.log(`Processing ${imageKey} (index ${index}):`, imagePath);
                
                if (imagePath && imagePath.trim() !== '') {
                    let imageUrl;
                    
                    // Check if it's a Firebase Storage URL or static image path
                    if (imagePath && (imagePath.startsWith('http') || imagePath.includes('firebasestorage'))) {
                        // Firebase Storage URL - use it directly
                        imageUrl = imagePath;
                        console.log(`Slider ${index + 1}: Using Firebase Storage URL: ${imageUrl}`);
                    } else if (imagePath && imagePath.startsWith('images/')) {
                        // Static image path from Firebase - use as is (relative path)
                        imageUrl = imagePath;
                        console.log(`Slider ${index + 1}: Using static path from Firebase: ${imageUrl}`);
                    } else {
                        // Fallback to static image using index
                        imageUrl = window.getImageUrl ? window.getImageUrl(null, 'slider', (index + 1).toString()) : `images/slider image/Slider Image ${index + 1}.jpg`;
                        console.log(`Slider ${index + 1}: Using fallback static image: ${imageUrl}`);
                    }
                    
                    slides.push({
                        url: imageUrl,
                        firebaseUrl: imagePath, // Keep original path/URL reference
                        id: index + 1
                    });
                    console.log(`✅ Added slide ${index + 1} with URL: ${imageUrl}`);
                } else {
                    console.warn(`⚠️ Skipping ${imageKey} - empty or invalid path:`, imagePath);
                }
            });
            
            console.log(`✅ Total slides loaded from Firebase: ${slides.length}`);
        } else {
            console.log('No slider data found in Firebase or data is empty');
        }
        
        // If no Firebase images exist, use static images as default
        if (slides.length === 0) {
            console.log('No slider data in Firebase, using static images');
            if (window.getStaticSliderImages) {
                const staticSliders = window.getStaticSliderImages();
                staticSliders.forEach((url, index) => {
                    slides.push({
                        url: url,
                        firebaseUrl: null, // No Firebase URL, using static
                        id: index + 1
                    });
                });
                console.log(`Loaded ${slides.length} static slider images`);
            }
        }
        
        console.log(`Total slides loaded: ${slides.length}`);
        
        // Render slides
        renderSlides();
        
        // Start slider if we have images
        if (slides.length > 0) {
            startSlider();
        } else {
            // Stop slider if no images
            clearInterval(sliderInterval);
        }
    }, (error) => {
        console.error('Error loading sliders:', error);
        console.log('Falling back to static slider images');
        
        // On error, use static images
        slides = [];
        if (window.getStaticSliderImages) {
            const staticSliders = window.getStaticSliderImages();
            staticSliders.forEach((url, index) => {
                slides.push({
                    url: url,
                    firebaseUrl: null,
                    id: index + 1
                });
            });
        }
        
        if (slides.length > 0) {
            renderSlides();
            startSlider();
        } else {
            // Show error message only if no static images available
            const sliderWrapper = document.getElementById('sliderWrapper');
            if (sliderWrapper) {
                sliderWrapper.innerHTML = `
                    <div class="slide active">
                        <div class="slide-placeholder">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Error loading slider images. Please refresh the page.</p>
                        </div>
                    </div>
                `;
            }
        }
    });
}

// Render slides in the slider
function renderSlides() {
    const sliderWrapper = document.getElementById('sliderWrapper');
    const sliderDots = document.getElementById('sliderDots');
    
    if (!sliderWrapper || !sliderDots) {
        console.error('Slider elements not found');
        return;
    }
    
    sliderWrapper.innerHTML = '';
    sliderDots.innerHTML = '';
    
    if (slides.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'slide active';
        placeholder.innerHTML = `
            <div class="slide-placeholder">
                <i class="fas fa-image"></i>
                <p>No slider images. Add images from admin panel.</p>
            </div>
        `;
        sliderWrapper.appendChild(placeholder);
        return;
    }
    
    slides.forEach((slide, index) => {
        // Create slide div
        const slideDiv = document.createElement('div');
        slideDiv.className = `slide ${index === 0 ? 'active' : ''}`;
        
        // Create image element with error handling and loading state
        const img = document.createElement('img');
        img.alt = `Slide ${index + 1}`;
        img.loading = index === 0 ? 'eager' : 'lazy'; // Load first image immediately
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center center;
            display: block;
            margin: 0;
            padding: 0;
            opacity: 0;
            transition: opacity 0.6s ease-in-out;
        `;
        
        // Show loading placeholder initially
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'slide-placeholder';
        loadingDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
            z-index: 1;
        `;
        loadingDiv.innerHTML = `<i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-purple); margin-bottom: 1rem;"></i><p style="color: var(--text-color);">Loading image...</p>`;
        slideDiv.appendChild(loadingDiv);
        
        img.onload = function() {
            console.log(`Successfully loaded slide ${index + 1}`);
            this.style.opacity = '1';
            if (loadingDiv.parentNode) {
                loadingDiv.style.opacity = '0';
                setTimeout(() => {
                    if (loadingDiv.parentNode) {
                        loadingDiv.remove();
                    }
                }, 300);
            }
        };
        
        img.onerror = function() {
            console.error(`Failed to load slide ${index + 1}:`, slide.url);
            // Try static fallback using image utility
            const staticSliders = window.getStaticSliderImages ? window.getStaticSliderImages() : [];
            const fallbackUrl = staticSliders[index] || (window.getImageUrl ? window.getImageUrl(null, 'slider', (index + 1).toString()) : `images/slider image/Slider Image ${index + 1}.jpg`);
            
            if (!this.dataset.fallbackSet) {
                this.dataset.fallbackSet = 'true';
                console.log(`Trying fallback for slide ${index + 1}:`, fallbackUrl);
                this.src = fallbackUrl;
                this.onerror = null; // Prevent infinite loop
            } else if (loadingDiv.parentNode) {
                loadingDiv.innerHTML = `<i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--error-color); margin-bottom: 1rem;"></i><p style="color: var(--text-color);">Failed to load image</p>`;
            }
        };
        
        // Get image URL - use Firebase URL if available, otherwise use static fallback
        let imageUrl = slide.url;
        
        // If no URL, use static fallback
        if (!imageUrl) {
            const staticSliders = window.getStaticSliderImages ? window.getStaticSliderImages() : [];
            imageUrl = staticSliders[index] || (window.getImageUrl ? window.getImageUrl(null, 'slider', (index + 1).toString()) : `images/slider image/Slider Image ${index + 1}.jpg`);
        }
        
        console.log(`Setting image source for slide ${index + 1}:`, imageUrl);
        
        // Set src after setting up handlers
        img.src = imageUrl;
        slideDiv.appendChild(img);
        sliderWrapper.appendChild(slideDiv);
        
        // Create dot for navigation
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        sliderDots.appendChild(dot);
    });
    
    currentSlide = 0;
    console.log(`Rendered ${slides.length} slides`);
}

// Setup slider navigation
function setupSliderNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.addEventListener('click', () => previousSlide());
    if (nextBtn) nextBtn.addEventListener('click', () => nextSlide());
}

// Start automatic slider
function startSlider() {
    if (slides.length <= 1) {
        clearInterval(sliderInterval);
        return;
    }
    
    clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        nextSlide();
    }, 5000);
    console.log('Slider started with', slides.length, 'slides');
}

// Next slide
function nextSlide() {
    if (slides.length <= 1) return;
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlide();
}

// Previous slide
function previousSlide() {
    if (slides.length <= 1) return;
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlide();
}

// Go to specific slide
function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    currentSlide = index;
    updateSlide();
}

// Update slide display
function updateSlide() {
    const slideElements = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    slideElements.forEach((slide, index) => {
        if (index === currentSlide) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });
    
    dots.forEach((dot, index) => {
        if (index === currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
    
    // Restart timer
    startSlider();
}

// Load Brands from Firebase
function loadBrands() {
    db.collection('brands').onSnapshot((snapshot) => {
        const brandsGrid = document.getElementById('brandsGrid');
        allBrands = [];
        
        if (snapshot.empty) {
            brandsGrid.innerHTML = '<div class="loading">No brands available. Add some from the admin panel!</div>';
            return;
        }
        
        // Collect all brands first
        const brandsArray = [];
        snapshot.forEach((doc) => {
            const brand = { id: doc.id, ...doc.data() };
            brandsArray.push(brand);
        });
        
        // Sort brands by displayOrder (lower numbers first, then by name for same order)
        brandsArray.sort((a, b) => {
            const orderA = a.displayOrder || 9999; // Default to high number if no displayOrder
            const orderB = b.displayOrder || 9999;
            
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            // If displayOrder is the same, sort alphabetically by name
            return (a.name || '').localeCompare(b.name || '');
        });
        
        // Store sorted brands
        allBrands = brandsArray;
        
        // Clear and render brands in sorted order
        brandsGrid.innerHTML = '';
        brandsArray.forEach((brand) => {
            const brandCard = createBrandCard(brand);
            brandsGrid.appendChild(brandCard);
        });
        
        // Update brand filter dropdown
        updateBrandFilter();
    }, (error) => {
        console.error('Error loading brands:', error);
        document.getElementById('brandsGrid').innerHTML = '<div class="loading">Error loading brands</div>';
    });
}

// Setup "All brands" button
function setupAllBrandsButton() {
    const allBrandsBtn = document.getElementById('allBrandsBtn');
    if (allBrandsBtn) {
        allBrandsBtn.addEventListener('click', () => {
            filterByBrandName('all');
            updateBrandSelection('all');
            
            // Clear brand filter dropdown
            const brandFilter = document.getElementById('brandFilter');
            if (brandFilter) {
                brandFilter.value = '';
            }
            
            // Show all products
            renderAllProducts();
        });
    }
}

// Create brand card
function createBrandCard(brand) {
    const card = document.createElement('button');
    card.className = 'brand-card';
    card.setAttribute('data-brand', brand.name);
    card.setAttribute('type', 'button');
    
    // Get first letter of brand name for icon
    const firstLetter = brand.name.charAt(0).toUpperCase();
    
    card.innerHTML = `
        <div class="brand-icon">${firstLetter}</div>
        <h3>${brand.name}</h3>
    `;
    
    // Add click event to redirect to products page
    card.addEventListener('click', () => {
        // Redirect to products page with brand name as parameter
        window.location.href = `products.html?brand=${encodeURIComponent(brand.name)}`;
    });
    
    return card;
}

// Filter products by brand name
function filterByBrandName(brandName) {
    const brandFilter = document.getElementById('brandFilter');
    if (brandFilter) {
        if (brandName === 'all') {
            brandFilter.value = '';
        } else {
            brandFilter.value = brandName;
        }
        filterAndSortProducts();
    }
}

// Update brand button selection
function updateBrandSelection(selectedBrand) {
    // Remove selected class from all brand cards
    const brandCards = document.querySelectorAll('.brand-card');
    brandCards.forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to clicked brand (skip 'all' since we removed that button)
    if (selectedBrand !== 'all') {
        const selectedCard = document.querySelector(`.brand-card[data-brand="${selectedBrand}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }
}

// Update brand filter dropdown
function updateBrandFilter() {
    const brandFilter = document.getElementById('brandFilter');
    if (brandFilter) {
        const currentValue = brandFilter.value;
        brandFilter.innerHTML = '<option value="">All Brands</option>';
        allBrands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.name;
            option.textContent = brand.name;
            brandFilter.appendChild(option);
        });
        if (currentValue) {
            brandFilter.value = currentValue;
        }
    }
}

// Load Products from Firebase
function loadProducts() {
    db.collection('products').onSnapshot((snapshot) => {
        allProducts = [];
        featuredProducts = [];
        
        if (snapshot.empty) {
            document.getElementById('allProductsGrid').innerHTML = '<div class="loading">No products available. Add some from the admin panel!</div>';
            document.getElementById('featuredProductsGrid').innerHTML = '<div class="loading">No featured products available.</div>';
            return;
        }
        
        snapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            allProducts.push(product);
            
            // Check if product is featured
            if (product.featured === true) {
                featuredProducts.push(product);
            }
        });
        
        // Sort featured products to show only 5
        featuredProducts = featuredProducts.slice(0, 5);
        
        // Update brand filter dropdown
        updateBrandFilter();
        
        // Update product counts
        updateProductCountsIndex(allProducts.length, allProducts.length);
        
        // Render products
        renderAllProducts();
        renderFeaturedProducts();
    }, (error) => {
        console.error('Error loading products:', error);
        document.getElementById('allProductsGrid').innerHTML = '<div class="loading">Error loading products</div>';
        document.getElementById('featuredProductsGrid').innerHTML = '<div class="loading">Error loading featured products</div>';
    });
}

// Flavor filter removed - no longer needed

// Render all products
function renderAllProducts() {
    // Use filterAndSortProducts to apply any active filters
    filterAndSortProducts();
}

// Render featured products
function renderFeaturedProducts() {
    const featuredProductsGrid = document.getElementById('featuredProductsGrid');
    if (featuredProductsGrid) {
        if (featuredProducts.length === 0) {
            featuredProductsGrid.innerHTML = '<div class="loading">No featured products. Mark products as featured in admin panel.</div>';
            return;
        }
        renderProducts(featuredProducts, featuredProductsGrid);
    }
}

// Render products to grid
function renderProducts(products, gridElement) {
    if (!gridElement) return;
    
    // Reset image tracker before rendering to ensure fresh distribution
    if (window.resetImageTracker) {
        window.resetImageTracker();
    }
    
    gridElement.innerHTML = '';
    
    if (products.length === 0) {
        gridElement.innerHTML = '<div class="loading">No products found.</div>';
        return;
    }
    
    products.forEach((product) => {
        const productCard = createProductCard(product);
        gridElement.appendChild(productCard);
    });
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);
    
    // Make card clickable to view details (but not buttons)
    card.addEventListener('click', (e) => {
        // Don't navigate if clicking on buttons
        if (!e.target.closest('button') && !e.target.closest('.product-actions')) {
            viewProductDetails(product.id);
        }
    });
    
    // Get product ID for display
    const productIdDisplay = product.productId || product.id || 'N/A';
    
    const stock = product.stock || 0;
    const status = product.status || (stock > 0 ? 'Available' : 'Out of Stock');
    const isInStock = status === 'Available';
    const isOutOfStock = status === 'Out of Stock';
    const isComingSoon = status === 'Coming Soon';
    const flavours = Array.isArray(product.flavour) ? product.flavour : (product.flavour ? [product.flavour] : []);
    const flavourCount = flavours.length;
    
    // Helper function to extract flavour name from object or string
    const getFlavourName = (flavour) => {
        if (typeof flavour === 'string') {
            return flavour;
        } else if (typeof flavour === 'object' && flavour !== null) {
            return flavour.name || String(flavour);
        }
        return String(flavour);
    };
    
    // Get first flavour name for display
    const firstFlavourName = flavourCount > 0 ? getFlavourName(flavours[0]) : '';
    
    // Get image URL - use Firebase URL if available, otherwise use static image
    const imageUrl = window.getImageUrl ? window.getImageUrl(product.image, 'product', product.brand, product.name) : (product.image || window.getStaticProductImage ? window.getStaticProductImage(product.brand, product.name) : 'images/Foger/foger-switch-pro-30k-puffs-disposable-vape-pod.webp');
    
    const isFeatured = product.featured === true;
    
    // Status badge HTML
    let statusBadge = '';
    if (isInStock) {
        statusBadge = '<div class="product-stock-badge product-status-available"><i class="fas fa-check-circle"></i> In Stock</div>';
    } else if (isOutOfStock) {
        statusBadge = '<div class="product-stock-badge product-status-out-of-stock"><i class="fas fa-times-circle"></i> Out of Stock</div>';
    } else if (isComingSoon) {
        statusBadge = '<div class="product-stock-badge product-status-coming-soon"><i class="fas fa-clock"></i> Coming Soon</div>';
    }
    
    card.innerHTML = `
        <div class="product-image-wrapper">
            <img src="${imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Crect fill=%27%23f0f0f0%27 width=%27200%27 height=%27200%27/%3E%3Ctext fill=%27%23999%27 font-family=%27sans-serif%27 font-size=%2714%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27%3ENo Image%3C/text%3E%3C/svg%3E'}" alt="${product.name}" loading="lazy" onerror="window.handleImageError ? window.handleImageError(event, 'product', '${product.brand || ''}', '${(product.name || '').replace(/'/g, "\\'")}') : this.style.display='none'">
            ${statusBadge}
            ${isFeatured ? `
                <div class="product-featured-badge">
                    <i class="fas fa-star"></i> Featured
                </div>
            ` : ''}
        </div>
        <div class="product-info">
            <div class="product-header-row">
                <h3 class="product-name">${product.name || 'Unnamed Product'}</h3>
                <span class="product-price">$${parseFloat(product.price || 0).toFixed(2)}</span>
            </div>
            <div class="product-badges">
                ${product.brand ? `
                    <div class="product-badge product-badge-brand">
                        <i class="fas fa-tag"></i>
                        <span>${product.brand}</span>
                    </div>
                ` : ''}
                ${flavourCount > 0 ? `
                    <div class="product-badge product-badge-flavor">
                        <i class="fas fa-palette"></i>
                        <span>${firstFlavourName}${flavourCount > 1 ? ` +${flavourCount - 1}` : ''}</span>
                    </div>
                ` : ''}
            </div>
            ${flavourCount > 1 ? `
                <div class="product-flavour-hint">
                    <div class="flavour-hint-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="flavour-hint-text">
                        <strong>${flavourCount} flavors</strong> available - Click "View Product" to select
                    </div>
                </div>
            ` : ''}
            <div class="product-actions-row">
                <button class="btn-view-product" onclick="event.stopPropagation(); viewProductDetails('${product.id}')">
                    <i class="fas fa-eye"></i> View Product
                </button>
                <button class="btn-quick-order" onclick="event.stopPropagation(); addToCart('${product.id}')">
                    <i class="fas fa-bolt"></i> Quick Order
                </button>
            </div>
        </div>
    `;
    return card;
}

// View product details
function viewProductDetails(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Make viewProductDetails available globally
window.viewProductDetails = viewProductDetails;

// Setup filter functionality
function setupFilters() {
    const brandFilter = document.getElementById('brandFilter');
    const sortFilter = document.getElementById('sortFilter');
    const filterSearch = document.getElementById('filterSearch');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    
    if (brandFilter) {
        brandFilter.addEventListener('change', filterAndSortProducts);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', filterAndSortProducts);
    }
    
    if (filterSearch) {
        filterSearch.addEventListener('input', filterAndSortProducts);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

// Filter and sort products
function filterAndSortProducts() {
    const brandFilter = document.getElementById('brandFilter')?.value || '';
    const sortFilter = document.getElementById('sortFilter')?.value || 'newest';
    const filterSearch = document.getElementById('filterSearch')?.value || '';
    const mainSearch = document.getElementById('mainSearch')?.value || '';
    
    // Use filter search if available, otherwise use main search
    const searchTerm = (filterSearch || mainSearch).toLowerCase();
    
    let filtered = [...allProducts];
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(product => {
            const name = (product.name || '').toLowerCase();
            const brand = (product.brand || '').toLowerCase();
            let flavourStr = '';
            if (product.flavour) {
                if (Array.isArray(product.flavour)) {
                    flavourStr = product.flavour.join(' ').toLowerCase();
                } else {
                    flavourStr = (product.flavour || '').toLowerCase();
                }
            }
            const description = (product.description || '').toLowerCase();
            return name.includes(searchTerm) || brand.includes(searchTerm) || flavourStr.includes(searchTerm) || description.includes(searchTerm);
        });
    }
    
    // Filter by brand
    if (brandFilter) {
        filtered = filtered.filter(product => product.brand === brandFilter);
    }
    
    // Sort products
    switch (sortFilter) {
        case 'price-low':
            filtered.sort((a, b) => (parseFloat(a.price || 0)) - (parseFloat(b.price || 0)));
            break;
        case 'price-high':
            filtered.sort((a, b) => (parseFloat(b.price || 0)) - (parseFloat(a.price || 0)));
            break;
        case 'name-asc':
            filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'name-desc':
            filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
        case 'oldest':
            // Sort by creation date (oldest first)
            filtered.sort((a, b) => {
                const dateA = a.createdAt?.toMillis?.() || 0;
                const dateB = b.createdAt?.toMillis?.() || 0;
                return dateA - dateB;
            });
            break;
        case 'newest':
        default:
            // Sort by creation date (newest first)
            filtered.sort((a, b) => {
                const dateA = a.createdAt?.toMillis?.() || 0;
                const dateB = b.createdAt?.toMillis?.() || 0;
                return dateB - dateA;
            });
            break;
    }
    
    // Update product counts
    updateProductCountsIndex(filtered.length, allProducts.length);
    
    // Update active filters display
    updateActiveFiltersIndex();
    
    // Render filtered products
    renderProducts(filtered, document.getElementById('allProductsGrid'));
}

// Update product counts on index page
function updateProductCountsIndex(visible, total) {
    const visibleCount = document.getElementById('visibleCount');
    const totalCount = document.getElementById('totalCount');
    if (visibleCount) visibleCount.textContent = visible;
    if (totalCount) totalCount.textContent = total;
}

// Update active filters display on index page
function updateActiveFiltersIndex() {
    const brandFilter = document.getElementById('brandFilter')?.value || '';
    const sortFilter = document.getElementById('sortFilter')?.value || '';
    const filterSearch = document.getElementById('filterSearch')?.value || '';
    
    const activeFiltersContainer = document.getElementById('activeFiltersContainerIndex');
    const activeFiltersList = document.getElementById('activeFiltersListIndex');
    
    if (!activeFiltersContainer || !activeFiltersList) return;
    
    activeFiltersList.innerHTML = '';
    const hasFilters = filterSearch || brandFilter || (sortFilter && sortFilter !== 'newest');
    
    if (hasFilters) {
        activeFiltersContainer.style.display = 'flex';
        
        if (filterSearch) {
            const filterTag = createFilterTagIndex('Search', filterSearch, 'filterSearch');
            activeFiltersList.appendChild(filterTag);
        }
        if (brandFilter) {
            const filterTag = createFilterTagIndex('Brand', brandFilter, 'brandFilter');
            activeFiltersList.appendChild(filterTag);
        }
        if (sortFilter && sortFilter !== 'newest') {
            const sortLabels = {
                'oldest': 'Oldest First',
                'name-asc': 'Name (A-Z)',
                'name-desc': 'Name (Z-A)',
                'price-low': 'Price (Low-High)',
                'price-high': 'Price (High-Low)'
            };
            const filterTag = createFilterTagIndex('Sort', sortLabels[sortFilter] || sortFilter, 'sortFilter');
            activeFiltersList.appendChild(filterTag);
        }
    } else {
        activeFiltersContainer.style.display = 'none';
    }
}

// Create filter tag element for index page
function createFilterTagIndex(label, value, filterId) {
    const tag = document.createElement('div');
    tag.className = 'active-filter-tag-index';
    tag.innerHTML = `
        <span class="filter-tag-label-index">${label}:</span>
        <span class="filter-tag-value-index">${value}</span>
        <button type="button" class="filter-tag-remove-index" onclick="removeFilterIndex('${filterId}')" title="Remove filter">
            <i class="fas fa-times"></i>
        </button>
    `;
    return tag;
}

// Remove specific filter on index page
function removeFilterIndex(filterId) {
    const element = document.getElementById(filterId);
    if (element) {
        if (element.type === 'text') {
            element.value = '';
        } else if (element.tagName === 'SELECT') {
            if (filterId === 'sortFilter') {
                element.value = 'newest';
            } else {
                element.value = '';
            }
        }
        filterAndSortProducts();
    }
}

// Clear all filters on index page
function clearAllFilters() {
    const filterSearch = document.getElementById('filterSearch');
    const brandFilter = document.getElementById('brandFilter');
    const sortFilter = document.getElementById('sortFilter');
    const mainSearch = document.getElementById('mainSearch');
    
    if (filterSearch) filterSearch.value = '';
    if (brandFilter) brandFilter.value = '';
    if (sortFilter) sortFilter.value = 'newest';
    if (mainSearch) mainSearch.value = '';
    
    filterAndSortProducts();
}


// Add to cart
function addToCart(productId) {
    // Show Coming Soon popup instead of adding to cart
    if (typeof showComingSoonPopup === 'function') {
        showComingSoonPopup();
    } else {
        // Fallback if popup function is not available
        alert('Coming Soon! This feature is under development.');
    }
}

// Make addToCart available globally
window.addToCart = addToCart;
window.removeFilterIndex = removeFilterIndex;
window.clearAllFilters = clearAllFilters;
