// Admin Panel JavaScript

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupFormHandlers();
    loadExistingData();
    
    // Setup file previews
    setupFilePreviews();
    // Load dashboard data
    loadDashboardData();
});

// Setup navigation between sections
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all nav items and sections
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked nav item
            item.classList.add('active');
            
            // Show corresponding section
            const sectionId = item.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('active');
                
                // Reload dashboard data when dashboard is opened
                if (sectionId === 'dashboard') {
                    loadDashboardData();
                }
            }
        });
    });
}

// Setup form handlers
function setupFormHandlers() {
    // Slider form removed - using static images only
    
    // Brand form
    document.getElementById('brandForm').addEventListener('submit', handleBrandSubmit);
    
    // Flavour form
    document.getElementById('flavourForm').addEventListener('submit', handleFlavourSubmit);
    
    // Product form
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    
    // Database upload form
    const databaseUploadForm = document.getElementById('databaseUploadForm');
    if (databaseUploadForm) {
        databaseUploadForm.addEventListener('submit', handleDatabaseUpload);
    }
    
    // Setup file name display for database upload
    const databaseFileInput = document.getElementById('databaseFile');
    const fileNameDisplay = document.getElementById('selectedFileName');
    const fileNameSpan = document.getElementById('fileNameDisplay');
    if (databaseFileInput && fileNameDisplay && fileNameSpan) {
        databaseFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileNameSpan.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
                fileNameDisplay.style.display = 'block';
            } else {
                fileNameDisplay.style.display = 'none';
            }
        });
    }
}

// Setup file previews
function setupFilePreviews() {
    // Slider previews removed - using static images only
    
    // Flavour preview
    const flavourInput = document.getElementById('flavourImage');
    const flavourPreview = document.getElementById('previewFlavour');
    if (flavourInput && flavourPreview) {
        flavourInput.addEventListener('change', (e) => previewImage(e, flavourPreview));
    }
    
    // Product preview
    const productInput = document.getElementById('productImage');
    const productPreview = document.getElementById('previewProduct');
    if (productInput && productPreview) {
        productInput.addEventListener('change', (e) => previewImage(e, productPreview));
    }
}

// Preview image before upload
function previewImage(event, previewElement) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewElement.src = e.target.result;
            previewElement.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Save static slider images automatically (without file selection)
async function saveStaticSliderImages() {
    console.log('saveStaticSliderImages function called');
    const statusDiv = document.getElementById('sliderStatus');
    
    if (!statusDiv) {
        console.error('sliderStatus element not found!');
        alert('Error: Status div not found. Please refresh the page.');
        return;
    }
    
    // Check if Firebase is initialized
    if (!db) {
        console.error('Firebase Firestore not initialized');
        statusDiv.textContent = 'Error: Firebase is not initialized. Please refresh the page.';
        statusDiv.className = 'status-message error';
        statusDiv.style.display = 'block';
        alert('Firebase is not initialized. Please refresh the page and try again.');
        return;
    }
    
    try {
        console.log('Starting to save static slider images...');
        statusDiv.textContent = 'Saving static slider images to Firebase...';
        statusDiv.className = 'status-message';
        statusDiv.style.display = 'block';
        
        // Collect all slider image paths from the admin panel input fields
        const sliderCards = document.querySelectorAll('.slider-image-card');
        const staticSliderPaths = {};
        
        if (sliderCards.length === 0) {
            throw new Error('No slider images found. Please add at least one image using the "Add New Slider Image" button.');
        }
        
        // Process all slider cards - supports unlimited images
        sliderCards.forEach((card, index) => {
            const imageIndex = index + 1;
            const pathInput = card.querySelector('.slider-image-path-input');
            const imagePath = pathInput ? pathInput.value.trim() : '';
            
            if (imagePath && imagePath.length > 0) {
                staticSliderPaths[`image${imageIndex}`] = imagePath;
                console.log(`Adding image ${imageIndex}: ${imagePath}`);
            } else {
                console.warn(`Image ${imageIndex} has no path, skipping...`);
            }
        });
        
        console.log(`Total images to save: ${Object.keys(staticSliderPaths).length}`);
        
        console.log('Static slider paths to save:', staticSliderPaths);
        
        if (Object.keys(staticSliderPaths).length === 0) {
            throw new Error('No valid slider image paths found. Please enter image paths in the input fields.');
        }
        
        // Save to Firestore - use set without merge to replace all data
        // This supports UNLIMITED images (not limited to 5)
        await db.collection('sliders').doc('main').set(staticSliderPaths);
        
        const totalImages = Object.keys(staticSliderPaths).length;
        console.log('✅ Static slider images saved to Firebase successfully!');
        console.log(`✅ Total images saved: ${totalImages} (supports unlimited images)`);
        console.log('Saved data structure:', staticSliderPaths);
        statusDiv.textContent = `✅ ${totalImages} slider image(s) saved successfully! They will appear on the website immediately.`;
        statusDiv.className = 'status-message success';
        statusDiv.style.display = 'block';
        
        // Verify the save by reading it back
        const verifyDoc = await db.collection('sliders').doc('main').get();
        if (verifyDoc.exists) {
            const verifyData = verifyDoc.data();
            const verifyCount = Object.keys(verifyData).filter(k => k.startsWith('image')).length;
            console.log(`✅ Verification - Data in Firebase: ${verifyCount} images found`);
            console.log('✅ Verification - Full data:', verifyData);
            
            if (verifyCount !== totalImages) {
                console.warn(`⚠️ Warning: Saved ${totalImages} images but found ${verifyCount} in Firebase`);
            }
        } else {
            console.warn('⚠️ Verification - Document not found after save');
        }
        
        // Slider previews removed
        
    } catch (error) {
        console.error('❌ Error saving static slider images:', error);
        const errorMsg = error.message || error.toString();
        statusDiv.textContent = '❌ Error saving static images: ' + errorMsg;
        statusDiv.className = 'status-message error';
        statusDiv.style.display = 'block';
        alert('Error saving static images: ' + errorMsg);
    }
}

// Make functions globally available
window.saveStaticSliderImages = saveStaticSliderImages;

// Slider image management functions - will be defined later
// These are made available globally when defined

// Manual upload functions removed - using static images only

// Handle brand form submission
async function handleBrandSubmit(e) {
    e.preventDefault();
    const statusDiv = document.getElementById('brandStatus');
    
    try {
        const name = document.getElementById('brandName').value.trim();
        const description = document.getElementById('brandDescription').value.trim();
        
        if (!name) {
            throw new Error('Brand name is required');
        }
        
        const form = document.getElementById('brandForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const editingId = form.dataset.editingId;
        
        statusDiv.textContent = editingId ? 'Updating brand...' : 'Adding brand...';
        statusDiv.className = 'status-message';
        statusDiv.style.display = 'block';
        
        // Get existing data if editing (to preserve fields like displayOrder, assignedFlavors)
        let existingData = {};
        if (editingId) {
            const existingDoc = await db.collection('brands').doc(editingId).get();
            if (existingDoc && existingDoc.data) {
                existingData = existingDoc.data();
            }
        }
        
        const brandData = {
            name: name,
            description: description,
            assignedFlavors: existingData.assignedFlavors || [],
            displayOrder: existingData.displayOrder || 1 // Preserve display order
        };
        
        if (editingId) {
            await db.collection('brands').doc(editingId).update(brandData);
            console.log('Brand updated successfully in Firebase');
            statusDiv.textContent = 'Brand updated successfully! Changes will reflect on the index page automatically.';
        } else {
            brandData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            brandData.displayOrder = 1; // Default display order for new brands
            await db.collection('brands').add(brandData);
            console.log('Brand added successfully to Firebase');
            statusDiv.textContent = 'Brand added successfully! Changes will reflect on the index page automatically.';
        }
        
        statusDiv.className = 'status-message success';
        
        // Reset form and exit edit mode
        form.reset();
        delete form.dataset.editingId;
        const submitButtonText = document.getElementById('submitBrandButtonText');
        if (submitButtonText) {
            submitButtonText.textContent = 'Add Brand';
        } else if (submitBtn) {
            const btnText = submitBtn.querySelector('span');
            if (btnText) {
                btnText.textContent = 'Add Brand';
            } else {
                submitBtn.textContent = 'Add Brand';
            }
        }
        submitBtn.classList.remove('btn-update');
        
        // Close modal after successful submission (with a small delay to show success message)
        setTimeout(() => {
            closeBrandModal();
        }, 1500);
    } catch (error) {
        console.error('Error adding brand:', error);
        statusDiv.textContent = 'Error adding brand: ' + error.message;
        statusDiv.className = 'status-message error';
    }
}

// Handle flavour form submission - Brand-Specific Flavors
async function handleFlavourSubmit(e) {
    e.preventDefault();
    const statusDiv = document.getElementById('flavourStatus');
    const form = document.getElementById('flavourForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const editingId = form.dataset.editingId;
    
    try {
        const brand = document.getElementById('flavourBrand').value.trim() || '';
        const name = document.getElementById('flavourName').value.trim() || '';
        const manualFlavorId = document.getElementById('flavourId').value.trim() || '';
        const imageFile = document.getElementById('flavourImage').files[0];
        
        statusDiv.textContent = editingId ? 'Updating flavour...' : 'Adding flavour...';
        statusDiv.className = 'status-message';
        statusDiv.style.display = 'block';
        
        // Check for duplicate flavor name within the same brand (only if both brand and name are provided)
        if (brand && name) {
            const existingFlavors = await db.collection('flavours')
                .where('brand', '==', brand)
                .where('name', '==', name)
                .get();
            
            if (!existingFlavors.empty) {
                const existingFlavor = existingFlavors.docs[0];
                // Allow if editing the same flavor
                if (!editingId || existingFlavor.id !== editingId) {
                    throw new Error(`Flavor "${name}" already exists for brand "${brand}". Each flavor name must be unique within a brand.`);
                }
            }
        }
        
        let imageUrl = '';
        if (imageFile) {
            imageUrl = await uploadFlavourImage(imageFile);
        }
        
        // Generate or use manual flavor ID (brand-specific)
        let flavorId = '';
        if (editingId) {
            // When editing, allow manual ID change or preserve existing
            if (manualFlavorId) {
                // Check for duplicate flavorId (across all brands to ensure uniqueness)
                const duplicateIdCheck = await db.collection('flavours')
                    .where('flavorId', '==', manualFlavorId.trim())
                    .get();
                
                if (!duplicateIdCheck.empty) {
                    const duplicateFlavor = duplicateIdCheck.docs[0];
                    // Only throw error if it's a different flavor (not the one being edited)
                    if (duplicateFlavor.id !== editingId) {
                        const dupData = duplicateFlavor.data();
                        throw new Error(`Flavor ID "${manualFlavorId}" is already allocated to flavor "${dupData.name}" (Brand: ${dupData.brand || 'N/A'}). Each flavor ID must be unique.`);
                    }
                }
                flavorId = manualFlavorId.trim();
            } else {
                // Preserve existing flavor ID when editing if no new one provided
                try {
                    const existingDoc = await db.collection('flavours').doc(editingId).get();
                    if (existingDoc.exists) {
                        const existingData = existingDoc.data();
                        flavorId = (existingData.flavorId && existingData.flavorId.trim()) ? existingData.flavorId : '';
                    }
                } catch (error) {
                    console.error('Error fetching existing flavor:', error);
                }
            }
        } else {
            // When creating new flavor - ONLY use manual ID, no auto-generation
            if (manualFlavorId) {
                // Check for duplicate flavorId (across all brands to ensure uniqueness)
                const duplicateIdCheck = await db.collection('flavours')
                    .where('flavorId', '==', manualFlavorId.trim())
                    .get();
                
                if (!duplicateIdCheck.empty) {
                    const duplicateFlavor = duplicateIdCheck.docs[0];
                    const dupData = duplicateFlavor.data();
                    throw new Error(`Flavor ID "${manualFlavorId}" is already allocated to flavor "${dupData.name}" (Brand: ${dupData.brand || 'N/A'}). Each flavor ID must be unique.`);
                }
                flavorId = manualFlavorId.trim();
            } else {
                // No auto-generation - require manual ID
                throw new Error('Flavor ID is required. Please provide a flavor ID manually or import through Excel.');
            }
        }
        
        const flavourData = {};
        
        // Only include fields that have values
        if (name) {
            flavourData.name = name;
        }
        if (brand) {
            flavourData.brand = brand;
        }
        if (flavorId) {
            flavourData.flavorId = flavorId;
        }
        
        // Only update image if a new one was uploaded
        if (imageUrl) {
            flavourData.image = imageUrl;
        }
        
        // Preserve existing image if editing and no new image uploaded
        if (editingId && !imageUrl) {
            if (form.dataset.existingImage) {
                flavourData.image = form.dataset.existingImage;
            } else {
                try {
                    const existingDoc = await db.collection('flavours').doc(editingId).get();
                    if (existingDoc.exists) {
                        const existingData = existingDoc.data();
                        if (existingData.image) {
                            flavourData.image = existingData.image;
                        }
                    }
                } catch (error) {
                    console.error('Error fetching existing flavour image:', error);
                }
            }
        }
        
        
        if (editingId) {
            await db.collection('flavours').doc(editingId).update(flavourData);
            console.log('Flavour updated successfully in Firebase');
            statusDiv.textContent = 'Flavour updated successfully! Changes will reflect on the index page automatically.';
        } else {
            flavourData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('flavours').add(flavourData);
            console.log('Flavour added successfully to Firebase');
            statusDiv.textContent = 'Flavour added successfully! Changes will reflect on the index page automatically.';
        }
        
        statusDiv.className = 'status-message success';
        
        // Reset form and exit edit mode
        form.reset();
        delete form.dataset.editingId;
        delete form.dataset.existingImage;
        const submitButtonText = document.getElementById('submitFlavorButtonText');
        if (submitButtonText) {
            submitButtonText.textContent = 'Save Flavour';
        } else if (submitBtn) {
            const btnText = submitBtn.querySelector('span');
            if (btnText) {
                btnText.textContent = 'Save Flavour';
            } else {
                submitBtn.textContent = 'Save Flavour';
            }
        }
        submitBtn.classList.remove('btn-update');
        const preview = document.getElementById('previewFlavour');
        if (preview) {
            preview.style.display = 'none';
            preview.src = '';
        }
        
        // Close modal after successful submission (with a small delay to show success message)
        setTimeout(() => {
            closeFlavorModal();
        }, 1500);
    } catch (error) {
        console.error('Error adding flavour:', error);
        statusDiv.textContent = 'Error adding flavour: ' + error.message;
        statusDiv.className = 'status-message error';
    }
}

// Upload flavour image
async function uploadFlavourImage(file) {
    const storageRef = storage.ref(`flavours/flavour_${Date.now()}_${file.name}`);
    await storageRef.put(file);
    return await storageRef.getDownloadURL();
}

// Handle product form submission
async function handleProductSubmit(e) {
    e.preventDefault();
    const statusDiv = document.getElementById('productStatusMessage');
    const form = document.getElementById('productForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const editingId = form.dataset.editingId;
    
    try {
        const name = document.getElementById('productName').value.trim() || '';
        const priceValue = document.getElementById('productPrice').value;
        const price = priceValue ? parseFloat(priceValue) : 0;
        const brand = document.getElementById('productBrand').value || '';
        const selectedFlavours = window.getSelectedFlavours ? window.getSelectedFlavours() : [];
        const description = document.getElementById('productDescription').value.trim() || '';
        const stockValue = document.getElementById('productStock').value;
        const stock = stockValue ? parseInt(stockValue) : 0;
        const status = document.getElementById('productStatusSelect').value || 'Available';
        const featured = document.getElementById('productFeatured').checked || false;
        const imageFile = document.getElementById('productImage').files[0];
        
        statusDiv.textContent = editingId ? 'Updating product...' : 'Adding product...';
        statusDiv.className = 'status-message';
        statusDiv.style.display = 'block';
        
        let imageUrl = '';
        if (imageFile) {
            imageUrl = await uploadProductImage(imageFile);
        } else if (editingId && form.dataset.existingImage) {
            // Preserve existing image if no new image is uploaded
            imageUrl = form.dataset.existingImage;
        } else if (editingId && !imageUrl) {
            // If editing and no new image, preserve existing image from database
            try {
                const existingDoc = await db.collection('products').doc(editingId).get();
                if (existingDoc.exists) {
                    const existingData = existingDoc.data();
                    if (existingData.image) {
                        imageUrl = existingData.image;
                    }
                }
            } catch (error) {
                console.error('Error fetching existing product image:', error);
            }
        }
        
        // Check featured limit for new products
        if (featured && !editingId) {
            const featuredSnapshot = await db.collection('products').where('featured', '==', true).get();
            if (featuredSnapshot.size >= 5) {
                if (!confirm('You already have 5 featured products. Adding this will make 6 featured products. Continue?')) {
                    document.getElementById('productFeatured').checked = false;
                    return;
                }
            }
        }
        
        const productData = {};
        
        // Only include fields that have values
        if (name) {
            productData.name = name;
        }
        if (price && price > 0) {
            productData.price = price;
        }
        if (brand) {
            productData.brand = brand;
        }
        if (selectedFlavours && selectedFlavours.length > 0) {
            productData.flavour = Array.isArray(selectedFlavours) ? selectedFlavours : [selectedFlavours];
        } else {
            productData.flavour = [];
        }
        if (description) {
            productData.description = description;
        }
        if (stock !== undefined && stock !== null) {
            productData.stock = stock;
        }
        if (status) {
            productData.status = status;
        }
        productData.featured = featured || false;
        
        // Always include image if available (new upload, existing from form, or existing from database)
        if (imageUrl) {
            productData.image = imageUrl;
        }
        
        if (editingId) {
            await db.collection('products').doc(editingId).update(productData);
            console.log('Product updated successfully in Firebase');
            statusDiv.textContent = 'Product updated successfully! Changes will reflect on the index page automatically.';
        } else {
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(productData);
            console.log('Product added successfully to Firebase');
            statusDiv.textContent = 'Product added successfully! Changes will reflect on the index page automatically.';
        }
        
        statusDiv.className = 'status-message success';
        
        // Reset form and exit edit mode
        form.reset();
        if (window.clearSelectedFlavours) {
            window.clearSelectedFlavours();
        }
        delete form.dataset.editingId;
        delete form.dataset.existingImage;
        const submitButtonText = document.getElementById('submitButtonText');
        if (submitButtonText) {
            submitButtonText.textContent = 'Add Product';
        } else if (submitBtn) {
            const btnText = submitBtn.querySelector('span');
            if (btnText) {
                btnText.textContent = 'Add Product';
            } else {
                submitBtn.textContent = 'Add Product';
            }
        }
        submitBtn.classList.remove('btn-update');
        const preview = document.getElementById('previewProduct');
        if (preview) {
            preview.style.display = 'none';
            preview.src = '';
        }
        
        // Close modal after successful submission (with a small delay to show success message)
        setTimeout(() => {
            closeProductModal();
        }, 1500);
    } catch (error) {
        console.error('Error saving product:', error);
        statusDiv.textContent = 'Error saving product: ' + error.message;
        statusDiv.className = 'status-message error';
    }
}

// Upload product image
async function uploadProductImage(file) {
    const storageRef = storage.ref(`products/product_${Date.now()}_${file.name}`);
    await storageRef.put(file);
    return await storageRef.getDownloadURL();
}

// Load existing data for dropdowns and lists
function loadExistingData() {
    // Load brands for product form and flavor form
    db.collection('brands').onSnapshot((snapshot) => {
        const brandSelect = document.getElementById('productBrand');
        if (brandSelect) {
            const currentValue = brandSelect.value;
            brandSelect.innerHTML = '<option value="">Select Brand</option>';
            snapshot.forEach((doc) => {
                const brand = doc.data();
                const option = document.createElement('option');
                option.value = brand.name;
                option.textContent = brand.name;
                brandSelect.appendChild(option);
            });
            if (currentValue) {
                brandSelect.value = currentValue;
            }
        }
        
        // Populate brand dropdown in flavor form
        const flavourBrandSelect = document.getElementById('flavourBrand');
        if (flavourBrandSelect) {
            const currentFlavorBrand = flavourBrandSelect.value;
            flavourBrandSelect.innerHTML = '<option value="">Select Brand</option>';
            snapshot.forEach((doc) => {
                const brand = doc.data();
                const option = document.createElement('option');
                option.value = brand.name;
                option.textContent = brand.name;
                flavourBrandSelect.appendChild(option);
            });
            if (currentFlavorBrand) {
                flavourBrandSelect.value = currentFlavorBrand;
            }
        }
        
        loadBrandsList(snapshot);
    });
    
    // Load flavours for product form dropdown (will be filtered by brand)
    db.collection('flavours').onSnapshot((snapshot) => {
        updateFlavorDropdown();
        loadFlavoursList(snapshot);
    });
    
    // Setup add flavour button
    setupFlavourSelector();
    
    // Update flavor dropdown when product brand changes
    const productBrandSelect = document.getElementById('productBrand');
    if (productBrandSelect) {
        productBrandSelect.addEventListener('change', updateFlavorDropdown);
    }
    
    // Load products list
    db.collection('products').onSnapshot((snapshot) => {
        loadProductsList(snapshot);
    });
    
    // Slider image previews removed
}

// Update flavor dropdown based on selected product brand
function updateFlavorDropdown() {
    const productBrand = document.getElementById('productBrand')?.value || '';
    const flavourDropdown = document.getElementById('flavourSelectDropdown');
    
    if (!flavourDropdown) return;
    
    flavourDropdown.innerHTML = '<option value="">Select Existing Flavor</option>';
    
    if (!productBrand) {
        return;
    }
    
    // Load flavors filtered by brand
    db.collection('flavours')
        .where('brand', '==', productBrand)
        .get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const flavour = doc.data();
                const option = document.createElement('option');
                option.value = flavour.name;
                option.textContent = flavour.name;
                option.dataset.flavorId = flavour.flavorId || doc.id;
                flavourDropdown.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error loading flavors:', error);
        });
}

// Load slider image previews from Firebase - Dynamic
function loadSliderImagePreviews() {
    const sliderGrid = document.getElementById('sliderImagesGrid');
    if (!sliderGrid) return;
    
    db.collection('sliders').doc('main').get().then((doc) => {
        let sliderData = null;
        if (doc) {
            if (typeof doc.exists === 'function' && doc.exists()) {
                sliderData = doc.data();
            } else if (doc.data) {
                const data = doc.data();
                if (data && Object.keys(data).length > 0) {
                    sliderData = data;
                }
            }
        }
        
        // Clear existing cards
        sliderGrid.innerHTML = '';
        
        // Load images from Firebase or use defaults
        if (sliderData && Object.keys(sliderData).length > 0) {
            // Get all image keys and sort them
            const imageKeys = Object.keys(sliderData)
                .filter(key => key.startsWith('image'))
                .sort((a, b) => {
                    const numA = parseInt(a.replace('image', ''));
                    const numB = parseInt(b.replace('image', ''));
                    return numA - numB;
                });
            
            imageKeys.forEach((imageKey, index) => {
                const imagePath = sliderData[imageKey];
                const imageIndex = index + 1;
                createSliderImageCard(imageIndex, imagePath);
            });
        } else {
            // Default: Create 5 cards with default paths
            const defaultPaths = [
                'images/slider image/Slider Image 1.jpg',
                'images/slider image/Slider Image 2.png',
                'images/slider image/Slider Image 3.jpg',
                'images/slider image/Slider Image 4.jpg',
                'images/slider image/Slider Image 5.jpg'
            ];
            
            defaultPaths.forEach((path, index) => {
                createSliderImageCard(index + 1, path);
            });
        }
    }).catch((error) => {
        console.error('Error loading slider image previews:', error);
        // On error, create default cards
        const defaultPaths = [
            'images/slider image/Slider Image 1.jpg',
            'images/slider image/Slider Image 2.png',
            'images/slider image/Slider Image 3.jpg',
            'images/slider image/Slider Image 4.jpg',
            'images/slider image/Slider Image 5.jpg'
        ];
        defaultPaths.forEach((path, index) => {
            createSliderImageCard(index + 1, path);
        });
    });
}

// Create slider image card
function createSliderImageCard(index, imagePath) {
    const sliderGrid = document.getElementById('sliderImagesGrid');
    if (!sliderGrid) return;
    
    const card = document.createElement('div');
    card.className = 'slider-image-card';
    card.dataset.index = index;
    
    // Extract filename from path
    const filename = imagePath ? imagePath.split('/').pop() : `Slider Image ${index}.jpg`;
    
    // Determine image URL
    let imgUrl = imagePath;
    if (!imagePath || (!imagePath.startsWith('http') && !imagePath.startsWith('images/'))) {
        imgUrl = `images/slider image/Slider Image ${index}.jpg`;
    }
    
    card.innerHTML = `
        <div class="slider-image-preview">
            <img src="${imgUrl}" 
                 alt="Slider Image ${index}" 
                 id="sliderPreview${index}" 
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27120%27%3E%3Crect fill=%27%23f0f0f0%27 width=%27200%27 height=%27120%27/%3E%3Ctext fill=%27%23999%27 font-family=%27sans-serif%27 font-size=%2714%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27%3EImage ${index}%3C/text%3E%3C/svg%3E'">
            <div class="slider-image-overlay">
                <div class="slider-image-index">#${index}</div>
            </div>
        </div>
        <div class="slider-image-details">
            <div class="slider-image-name">
                <i class="fas fa-file-image"></i>
                <input type="text" class="slider-image-name-input" value="${filename}" 
                       placeholder="Image filename" 
                       onchange="updateSliderImagePreview(${index}, this.value)">
            </div>
            <div class="slider-image-path">
                <code>
                    <input type="text" class="slider-image-path-input" 
                           value="${imagePath || `images/slider image/Slider Image ${index}.jpg`}" 
                           placeholder="images/slider image/your-image.jpg"
                           onchange="updateSliderImagePreview(${index}, this.value.split('/').pop())">
                </code>
            </div>
            <button type="button" class="btn-remove-slider-image" onclick="removeSliderImageCard(this)" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: var(--error-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                <i class="fas fa-trash-alt"></i> Remove Image
            </button>
        </div>
    `;
    
    sliderGrid.appendChild(card);
}

// Add new slider image card
function addSliderImageCard() {
    const sliderGrid = document.getElementById('sliderImagesGrid');
    if (!sliderGrid) {
        console.error('Slider grid not found');
        alert('Error: Slider grid not found. Please refresh the page.');
        return;
    }
    
    // Get current number of cards
    const existingCards = sliderGrid.querySelectorAll('.slider-image-card');
    const nextIndex = existingCards.length + 1;
    
    // Create new card
    createSliderImageCard(nextIndex, `images/slider image/Slider Image ${nextIndex}.jpg`);
}

// Remove slider image card
function removeSliderImageCard(button) {
    if (!confirm('Are you sure you want to remove this slider image?')) {
        return;
    }
    
    const card = button.closest('.slider-image-card');
    if (card) {
        card.remove();
        // Re-index remaining cards
        reindexSliderCards();
    }
}

// Re-index slider cards after removal
function reindexSliderCards() {
    const sliderGrid = document.getElementById('sliderImagesGrid');
    if (!sliderGrid) return;
    
    const cards = sliderGrid.querySelectorAll('.slider-image-card');
    cards.forEach((card, index) => {
        const newIndex = index + 1;
        card.dataset.index = newIndex;
        
        const indexDisplay = card.querySelector('.slider-image-index');
        if (indexDisplay) {
            indexDisplay.textContent = `#${newIndex}`;
        }
        
        const img = card.querySelector('img');
        if (img) {
            img.id = `sliderPreview${newIndex}`;
            img.alt = `Slider Image ${newIndex}`;
        }
        
        const nameInput = card.querySelector('.slider-image-name-input');
        if (nameInput) {
            nameInput.placeholder = `Image filename (e.g., Slider Image ${newIndex}.jpg)`;
            // Update onchange handler
            nameInput.setAttribute('onchange', `updateSliderImagePreview(${newIndex}, this.value)`);
        }
        
        const pathInput = card.querySelector('.slider-image-path-input');
        if (pathInput) {
            if (!pathInput.value || pathInput.value.includes('Slider Image')) {
                pathInput.value = `images/slider image/Slider Image ${newIndex}.jpg`;
            }
            // Update onchange handler
            pathInput.setAttribute('onchange', `updateSliderImagePreview(${newIndex}, this.value.split('/').pop())`);
        }
    });
}

// Update slider image preview
function updateSliderImagePreview(index, filename) {
    const preview = document.getElementById(`sliderPreview${index}`);
    const card = preview ? preview.closest('.slider-image-card') : null;
    const pathInput = card ? card.querySelector('.slider-image-path-input') : null;
    
    if (preview && pathInput) {
        const currentPath = pathInput.value;
        const basePath = currentPath.includes('/') ? currentPath.split('/').slice(0, -1).join('/') : 'images/slider image';
        const fullPath = `${basePath}/${filename}`;
        
        // Update preview
        preview.src = fullPath;
        
        // Update path input if filename was changed from name input
        if (filename && !pathInput.value.includes(filename)) {
            pathInput.value = fullPath;
        }
    }
}

// Make slider functions globally available
window.addSliderImageCard = addSliderImageCard;
window.removeSliderImageCard = removeSliderImageCard;
window.updateSliderImagePreview = updateSliderImagePreview;
window.reindexSliderCards = reindexSliderCards;

// Load brands list in admin
async function loadBrandsList(snapshot) {
    const brandsList = document.getElementById('brandsList');
    if (!brandsList) return;
    
    if (snapshot.empty) {
        brandsList.innerHTML = '<div class="empty-state"><p>No brands added yet. Add your first brand above!</p></div>';
        return;
    }
    
    brandsList.innerHTML = '<div class="brands-grid-admin" id="brandsGrid"></div>';
    const brandsGrid = document.getElementById('brandsGrid');
    
    // Get all products to count
    const productsSnapshot = await db.collection('products').get();
    const products = [];
    productsSnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
    });
    
    // Get all flavors grouped by brand
    const flavorsSnapshot = await db.collection('flavours').get();
    const flavorsByBrand = new Map();
    flavorsSnapshot.forEach((doc) => {
        const flavor = { id: doc.id, ...doc.data() };
        const flavorBrand = flavor.brand || '';
        if (flavorBrand) {
            if (!flavorsByBrand.has(flavorBrand)) {
                flavorsByBrand.set(flavorBrand, []);
            }
            flavorsByBrand.get(flavorBrand).push(flavor);
        }
    });
    
    snapshot.forEach((doc) => {
        const brand = { id: doc.id, ...doc.data() };
        // Count products for this brand
        const brandProducts = products.filter(p => p.brand === brand.name);
        const productCount = brandProducts.length;
        
        // Get flavors that belong to this brand (from flavors collection with brand field)
        const brandFlavors = flavorsByBrand.get(brand.name) || [];
        const flavorCount = brandFlavors.length;
        
        // Also check legacy assignedFlavors for backward compatibility
        const legacyAssignedFlavors = brand.assignedFlavors || [];
        const allBrandFlavors = [...brandFlavors];
        
        // Merge with legacy assigned flavors if they exist
        legacyAssignedFlavors.forEach(legacyFlavor => {
            if (typeof legacyFlavor === 'string') {
                // Check if this flavor name already exists in brandFlavors
                const exists = brandFlavors.some(f => f.name === legacyFlavor);
                if (!exists) {
                    // Try to find the flavor in the flavors collection
                    const foundFlavor = Array.from(flavorsByBrand.values())
                        .flat()
                        .find(f => f.name === legacyFlavor && f.brand === brand.name);
                    if (foundFlavor) {
                        allBrandFlavors.push(foundFlavor);
                    }
                }
            } else {
                // Object format - check if already in brandFlavors
                const flavorId = legacyFlavor.id || legacyFlavor.flavorId;
                const exists = brandFlavors.some(f => 
                    (f.id === flavorId) || (f.flavorId === flavorId) ||
                    (f.id === legacyFlavor.id) || (f.flavorId === legacyFlavor.flavorId)
                );
                if (!exists) {
                    // Try to find the flavor
                    const foundFlavor = Array.from(flavorsByBrand.values())
                        .flat()
                        .find(f => 
                            ((f.id === flavorId) || (f.flavorId === flavorId)) &&
                            f.brand === brand.name
                        );
                    if (foundFlavor) {
                        allBrandFlavors.push(foundFlavor);
                    } else {
                        // Legacy flavor - add it as is
                        allBrandFlavors.push(legacyFlavor);
                    }
                }
            }
        });
        
        const card = createBrandCardAdmin(brand, productCount, allBrandFlavors.length, allBrandFlavors);
        brandsGrid.appendChild(card);
    });
}

// Create brand card for admin - Updated for Brand-Specific Flavors
function createBrandCardAdmin(brand, productCount = 0, flavorCount = 0, flavors = []) {
    const card = document.createElement('div');
    card.className = 'brand-card-admin';
    const firstLetter = brand.name ? brand.name.charAt(0).toUpperCase() : '?';
    const displayOrder = brand.displayOrder || 1;
    
    // Flavors parameter now contains flavor objects from the flavors collection
    // Filter to ensure we only show flavors that belong to this brand
    const brandFlavors = flavors.filter(f => {
        if (typeof f === 'string') {
            return true; // Legacy string format
        }
        return (f.brand === brand.name);
    });
    
    card.innerHTML = `
        <div class="brand-card-header">
            <div class="brand-icon-header">
                <div class="brand-icon-circle">${firstLetter}</div>
                <h3 class="brand-card-title">${brand.name}</h3>
            </div>
            <div class="brand-header-actions">
                <div class="display-order-group">
                    <span class="display-order-label">Display Order:</span>
                    <input type="number" class="display-order-input" value="${displayOrder}" 
                           onchange="updateBrandDisplayOrder('${brand.id}', this.value)" min="1">
                </div>
                <button class="btn-icon-edit" onclick="editBrand('${brand.id}')" title="Edit Brand">
                    <i class="fas fa-pencil-alt"></i>
                    <span class="btn-label">Edit</span>
                </button>
                <button class="btn-icon-delete" onclick="deleteBrand('${brand.id}')" title="Delete Brand">
                    <i class="fas fa-trash-alt"></i>
                    <span class="btn-label">Delete</span>
                </button>
            </div>
        </div>
        
        <div class="brand-summary-info">
            <span class="info-badge product-badge">
                <i class="fas fa-box"></i> ${productCount} Products
            </span>
            <span class="info-badge flavor-badge">
                <i class="fas fa-leaf"></i> ${brandFlavors.length} Flavors
            </span>
        </div>
    `;
    return card;
}

// Load flavours list in admin
async function loadFlavoursList(snapshot) {
    const flavoursList = document.getElementById('flavoursList');
    if (!flavoursList) return;
    
    if (snapshot.empty) {
        flavoursList.innerHTML = '<div class="empty-state"><p>No flavours added yet. Add your first flavour above!</p></div>';
        return;
    }
    
    // Create filter toolbar and grid
    flavoursList.innerHTML = `
        <div class="products-toolbar">
            <div class="toolbar-header">
                <div class="toolbar-title">
                    <i class="fas fa-filter"></i>
                    <span>Filter by:</span>
                </div>
                <div class="toolbar-results" id="flavorResultsCount">
                    <span id="visibleFlavorsCount">0</span> of <span id="totalFlavorsCount">0</span> flavors
                </div>
            </div>
            <div class="toolbar-content">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="flavorSearch" placeholder="Search flavors by name, brand, or ID..." class="search-input">
                </div>
                <div class="filter-group-toolbar">
                    <div class="filter-item">
                        <label class="filter-label">
                            <i class="fas fa-tag"></i>
                            <span>Brand</span>
                        </label>
                        <select id="filterFlavorBrand" class="filter-select-toolbar">
                            <option value="">All Brands</option>
                        </select>
                    </div>
                    <div class="filter-item">
                        <label class="filter-label">
                            <i class="fas fa-sort"></i>
                            <span>Sort by</span>
                        </label>
                        <select id="sortFlavors" class="filter-select-toolbar">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="brand-asc">Brand (A-Z)</option>
                            <option value="brand-desc">Brand (Z-A)</option>
                            <option value="id-asc">ID (A-Z)</option>
                            <option value="id-desc">ID (Z-A)</option>
                        </select>
                    </div>
                    <button class="btn-clear-filters" onclick="clearFlavorFilters()" title="Clear All Filters">
                        <i class="fas fa-times"></i>
                        <span>Clear</span>
                    </button>
                </div>
            </div>
            <div class="active-filters" id="activeFlavorFiltersContainer" style="display: none;">
                <span class="active-filters-label">Active filters:</span>
                <div class="active-filters-list" id="activeFlavorFiltersList"></div>
            </div>
        </div>
        <div class="flavors-list-grid" id="flavoursGrid"></div>
    `;
    
    const flavoursGrid = document.getElementById('flavoursGrid');
    const allFlavors = [];
    
    // Get all products to count usage
    const productsSnapshot = await db.collection('products').get();
    const products = [];
    productsSnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
    });
    
    snapshot.forEach((doc) => {
        const flavour = { id: doc.id, ...doc.data() };
        
        // Ensure flavor has an ID (for backwards compatibility with existing flavors)
        // Only generate if flavorId is truly missing or empty (not if it's already allocated)
        if (!flavour.flavorId || (typeof flavour.flavorId === 'string' && !flavour.flavorId.trim())) {
            // Generate ID for existing flavors without one
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
            const generatedFlavorId = `FLAV-${timestamp}-${randomStr}`;
            
            // Update the flavor document with generated ID (async, don't wait)
            db.collection('flavours').doc(flavour.id).update({
                flavorId: generatedFlavorId
            }).catch(error => {
                console.error('Error updating flavor ID:', error);
            });
            
            // Use generated ID for display
            flavour.flavorId = generatedFlavorId;
        }
        
        // Count how many products use this flavor (only products from the same brand)
        let usageCount = 0;
        const flavorBrand = flavour.brand || '';
        products.forEach(product => {
            // Only count if product brand matches flavor brand
            if (product.brand === flavorBrand && product.flavour) {
                if (Array.isArray(product.flavour)) {
                    if (product.flavour.includes(flavour.name)) {
                        usageCount++;
                    }
                } else if (product.flavour === flavour.name) {
                    usageCount++;
                }
            }
        });
        
        allFlavors.push(flavour);
        const card = createFlavourCardAdmin(flavour, usageCount);
        flavoursGrid.appendChild(card);
    });
    
    // Store flavors for filtering
    window.allFlavors = allFlavors;
    
    // Update total flavors count
    updateFlavorCounts(allFlavors.length, allFlavors.length);
    
    // Populate brand filter
    const brandFilter = document.getElementById('filterFlavorBrand');
    if (brandFilter) {
        const brands = [...new Set(allFlavors.map(f => f.brand).filter(Boolean))].sort();
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });
    }
    
    // Setup search and filter handlers
    setupFlavorFilters();
    
    // Apply initial sort
    sortFlavorsTable('newest');
}

// Create flavour card for admin - Brand-Specific
function createFlavourCardAdmin(flavour, usageCount = 0) {
    const card = document.createElement('div');
    card.className = 'flavor-row-item';
    card.dataset.flavorName = (flavour.name || '').toLowerCase();
    card.dataset.flavorBrand = (flavour.brand || '').toLowerCase();
    card.dataset.flavorId = (flavour.flavorId || flavour.id || '').toLowerCase();
    const flavorIdDisplay = (flavour.flavorId && flavour.flavorId.trim()) ? flavour.flavorId : 'N/A';
    const brandName = flavour.brand || 'No Brand';
    card.innerHTML = `
        <div class="flavor-row-content">
            <div class="flavor-name-section">
                <h3 class="flavor-name-text">${flavour.name}</h3>
                <div class="flavor-meta-info">
                    <div class="flavor-brand-display">
                        <i class="fas fa-tag"></i>
                        <span>Brand: ${brandName}</span>
                    </div>
                    <div class="flavor-id-display">
                        <i class="fas fa-hashtag"></i>
                        <span>ID: ${flavorIdDisplay}</span>
                    </div>
                </div>
            </div>
            <div class="flavor-usage-section">
                <i class="fas fa-box"></i>
                <span class="flavor-usage-text">Used in ${usageCount} product${usageCount !== 1 ? 's' : ''}</span>
            </div>
        </div>
        <div class="flavor-row-actions">
            <button class="btn-flavor-edit" onclick="editFlavour('${flavour.id}')">
                <i class="fas fa-check"></i> Edit
            </button>
            <button class="btn-flavor-delete" onclick="deleteFlavour('${flavour.id}')">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        </div>
    `;
    return card;
}

// Open flavor form
// Flavour Modal Functions
function openFlavorModal() {
    const modal = document.getElementById('flavorModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reset form if not editing
        const form = document.getElementById('flavourForm');
        if (form && !form.dataset.editingId) {
            resetFlavorForm();
        }
        
        // Scroll modal body to top
        const modalBody = modal.querySelector('.product-modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }
}

function closeFlavorModal() {
    const modal = document.getElementById('flavorModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form after animation
        setTimeout(() => {
            resetFlavorForm();
        }, 300);
    }
}

function resetFlavorForm() {
    const form = document.getElementById('flavourForm');
    if (!form) return;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const modalTitle = document.getElementById('flavorModalTitle');
    const submitButtonText = document.getElementById('submitFlavorButtonText');
    
    // Reset form
    form.reset();
    delete form.dataset.editingId;
    
    if (submitBtn) {
        const btnText = submitBtn.querySelector('span');
        if (btnText) {
            btnText.textContent = 'Save Flavour';
        } else {
            submitBtn.textContent = 'Save Flavour';
        }
        submitBtn.classList.remove('btn-update');
    }
    
    if (modalTitle) {
        const titleSpan = modalTitle.querySelector('span');
        if (titleSpan) titleSpan.textContent = 'Add New Flavor';
    }
    if (submitButtonText) submitButtonText.textContent = 'Save Flavour';
    
    // Clear preview
    const preview = document.getElementById('previewFlavour');
    if (preview) {
        preview.style.display = 'none';
        preview.src = '';
    }
    
    // Clear status message
    const statusDiv = document.getElementById('flavourStatus');
    if (statusDiv) {
        statusDiv.textContent = '';
        statusDiv.className = 'status-message';
        statusDiv.style.display = 'none';
    }
}

// Legacy function names for backward compatibility
function openFlavorForm() {
    openFlavorModal();
}

function closeFlavorForm() {
    closeFlavorModal();
}

// Remove all flavors
async function removeAllFlavors() {
    if (!confirm('Are you sure you want to delete ALL flavors? This action cannot be undone!')) return;
    await deleteAllFlavors();
}

// Delete all products
async function deleteAllProducts() {
    const statusDiv = document.getElementById('productsDeleteStatus');
    
    if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL products from Firebase?\n\nThis will permanently delete all products and their IDs. This action cannot be undone!\n\nType OK to confirm.')) {
        return;
    }
    
    try {
        if (statusDiv) {
            statusDiv.textContent = 'Deleting all products...';
            statusDiv.className = 'status-message';
            statusDiv.style.display = 'block';
        }
        
        const productsSnapshot = await db.collection('products').get();
        
        if (productsSnapshot.empty) {
            if (statusDiv) {
                statusDiv.textContent = 'No products found to delete.';
                statusDiv.className = 'status-message';
                statusDiv.style.display = 'block';
            }
            return;
        }
        
        // Firestore batch limit is 500, so we need to process in batches
        let deletedCount = 0;
        const batchSize = 500;
        const docs = [];
        
        productsSnapshot.forEach(doc => {
            docs.push(doc.ref);
        });
        
        // Process in batches
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = db.batch();
            const batchDocs = docs.slice(i, i + batchSize);
            
            batchDocs.forEach(docRef => {
                batch.delete(docRef);
            });
            
            await batch.commit();
            deletedCount += batchDocs.length;
            
            if (statusDiv) {
                statusDiv.textContent = `Deleting... ${deletedCount}/${docs.length} products deleted`;
            }
        }
        
        if (statusDiv) {
            statusDiv.textContent = `✅ Successfully deleted ${deletedCount} product(s) and their IDs from Firebase!`;
            statusDiv.className = 'status-message success';
            statusDiv.style.display = 'block';
        }
        
        alert(`✅ Successfully deleted ${deletedCount} product(s) from Firebase!`);
    } catch (error) {
        console.error('Error deleting all products:', error);
        const errorMsg = error.message || error.toString();
        if (statusDiv) {
            statusDiv.textContent = '❌ Error deleting products: ' + errorMsg;
            statusDiv.className = 'status-message error';
            statusDiv.style.display = 'block';
        }
        alert('Error deleting products: ' + errorMsg);
    }
}

// Delete all brands
async function deleteAllBrands() {
    const statusDiv = document.getElementById('brandsDeleteStatus');
    
    if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL brands from Firebase?\n\nThis will permanently delete all brands and their IDs. This action cannot be undone!\n\nType OK to confirm.')) {
        return;
    }
    
    try {
        if (statusDiv) {
            statusDiv.textContent = 'Deleting all brands...';
            statusDiv.className = 'status-message';
            statusDiv.style.display = 'block';
        }
        
        const brandsSnapshot = await db.collection('brands').get();
        
        if (brandsSnapshot.empty) {
            if (statusDiv) {
                statusDiv.textContent = 'No brands found to delete.';
                statusDiv.className = 'status-message';
                statusDiv.style.display = 'block';
            }
            return;
        }
        
        let deletedCount = 0;
        const batchSize = 500;
        const docs = [];
        
        brandsSnapshot.forEach(doc => {
            docs.push(doc.ref);
        });
        
        // Process in batches
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = db.batch();
            const batchDocs = docs.slice(i, i + batchSize);
            
            batchDocs.forEach(docRef => {
                batch.delete(docRef);
            });
            
            await batch.commit();
            deletedCount += batchDocs.length;
            
            if (statusDiv) {
                statusDiv.textContent = `Deleting... ${deletedCount}/${docs.length} brands deleted`;
            }
        }
        
        if (statusDiv) {
            statusDiv.textContent = `✅ Successfully deleted ${deletedCount} brand(s) and their IDs from Firebase!`;
            statusDiv.className = 'status-message success';
            statusDiv.style.display = 'block';
        }
        
        alert(`✅ Successfully deleted ${deletedCount} brand(s) from Firebase!`);
    } catch (error) {
        console.error('Error deleting all brands:', error);
        const errorMsg = error.message || error.toString();
        if (statusDiv) {
            statusDiv.textContent = '❌ Error deleting brands: ' + errorMsg;
            statusDiv.className = 'status-message error';
            statusDiv.style.display = 'block';
        }
        alert('Error deleting brands: ' + errorMsg);
    }
}

// Delete all flavors
async function deleteAllFlavors() {
    const statusDiv = document.getElementById('flavorsDeleteStatus');
    
    if (!confirm('⚠️ WARNING: Are you sure you want to delete ALL flavors from Firebase?\n\nThis will permanently delete all flavors and their IDs. This action cannot be undone!\n\nType OK to confirm.')) {
        return;
    }
    
    try {
        if (statusDiv) {
            statusDiv.textContent = 'Deleting all flavors...';
            statusDiv.className = 'status-message';
            statusDiv.style.display = 'block';
        }
        
        const flavoursSnapshot = await db.collection('flavours').get();
        
        if (flavoursSnapshot.empty) {
            if (statusDiv) {
                statusDiv.textContent = 'No flavors found to delete.';
                statusDiv.className = 'status-message';
                statusDiv.style.display = 'block';
            }
            return;
        }
        
        let deletedCount = 0;
        const batchSize = 500;
        const docs = [];
        
        flavoursSnapshot.forEach(doc => {
            docs.push(doc.ref);
        });
        
        // Process in batches
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = db.batch();
            const batchDocs = docs.slice(i, i + batchSize);
            
            batchDocs.forEach(docRef => {
                batch.delete(docRef);
            });
            
            await batch.commit();
            deletedCount += batchDocs.length;
            
            if (statusDiv) {
                statusDiv.textContent = `Deleting... ${deletedCount}/${docs.length} flavors deleted`;
            }
        }
        
        if (statusDiv) {
            statusDiv.textContent = `✅ Successfully deleted ${deletedCount} flavor(s) and their IDs from Firebase!`;
            statusDiv.className = 'status-message success';
            statusDiv.style.display = 'block';
        }
        
        alert(`✅ Successfully deleted ${deletedCount} flavor(s) from Firebase!`);
    } catch (error) {
        console.error('Error deleting all flavors:', error);
        const errorMsg = error.message || error.toString();
        if (statusDiv) {
            statusDiv.textContent = '❌ Error deleting flavors: ' + errorMsg;
            statusDiv.className = 'status-message error';
            statusDiv.style.display = 'block';
        }
        alert('Error deleting flavors: ' + errorMsg);
    }
}

// Delete all data (products, brands, and flavors)
async function deleteAllData() {
    const statusDiv = document.getElementById('deleteAllStatus');
    
    const confirmation1 = confirm('⚠️⚠️⚠️ FINAL WARNING ⚠️⚠️⚠️\n\nThis will delete ALL products, ALL brands, and ALL flavors from Firebase Firestore!\n\nThis action is PERMANENT and CANNOT be undone!\n\nDo you want to continue?');
    if (!confirmation1) {
        return;
    }
    
    const confirmation2 = confirm('Are you ABSOLUTELY SURE?\n\nThis will delete EVERYTHING:\n- All Products\n- All Brands\n- All Flavors\n\nAll document IDs will be permanently removed.\n\nLast chance to cancel!');
    if (!confirmation2) {
        return;
    }
    
    const confirmation3 = prompt('Type "DELETE ALL" (in uppercase) to confirm this destructive action:');
    if (confirmation3 !== 'DELETE ALL') {
        alert('Deletion cancelled. You did not type "DELETE ALL" correctly.');
        return;
    }
    
    try {
        if (statusDiv) {
            statusDiv.textContent = 'Starting deletion of all data... This may take a moment.';
            statusDiv.className = 'status-message';
            statusDiv.style.display = 'block';
        }
        
        let totalDeleted = {
            products: 0,
            brands: 0,
            flavors: 0
        };
        
        // Delete Products
        if (statusDiv) {
            statusDiv.textContent = 'Deleting all products...';
        }
        const productsSnapshot = await db.collection('products').get();
        if (!productsSnapshot.empty) {
            const batchSize = 500;
            const productDocs = [];
            productsSnapshot.forEach(doc => productDocs.push(doc.ref));
            
            for (let i = 0; i < productDocs.length; i += batchSize) {
                const batch = db.batch();
                productDocs.slice(i, i + batchSize).forEach(docRef => batch.delete(docRef));
                await batch.commit();
                totalDeleted.products += Math.min(batchSize, productDocs.length - i);
            }
        }
        
        // Delete Brands
        if (statusDiv) {
            statusDiv.textContent = `Products deleted (${totalDeleted.products}). Deleting all brands...`;
        }
        const brandsSnapshot = await db.collection('brands').get();
        if (!brandsSnapshot.empty) {
            const batchSize = 500;
            const brandDocs = [];
            brandsSnapshot.forEach(doc => brandDocs.push(doc.ref));
            
            for (let i = 0; i < brandDocs.length; i += batchSize) {
                const batch = db.batch();
                brandDocs.slice(i, i + batchSize).forEach(docRef => batch.delete(docRef));
                await batch.commit();
                totalDeleted.brands += Math.min(batchSize, brandDocs.length - i);
            }
        }
        
        // Delete Flavors
        if (statusDiv) {
            statusDiv.textContent = `Brands deleted (${totalDeleted.brands}). Deleting all flavors...`;
        }
        const flavoursSnapshot = await db.collection('flavours').get();
        if (!flavoursSnapshot.empty) {
            const batchSize = 500;
            const flavorDocs = [];
            flavoursSnapshot.forEach(doc => flavorDocs.push(doc.ref));
            
            for (let i = 0; i < flavorDocs.length; i += batchSize) {
                const batch = db.batch();
                flavorDocs.slice(i, i + batchSize).forEach(docRef => batch.delete(docRef));
                await batch.commit();
                totalDeleted.flavors += Math.min(batchSize, flavorDocs.length - i);
            }
        }
        
        const totalItems = totalDeleted.products + totalDeleted.brands + totalDeleted.flavors;
        
        if (statusDiv) {
            statusDiv.innerHTML = `
                <strong>✅ All data deleted successfully!</strong><br>
                <div style="margin-top: 0.5rem; font-size: 0.9rem;">
                    <div>📦 Products: ${totalDeleted.products} deleted</div>
                    <div>🏷️ Brands: ${totalDeleted.brands} deleted</div>
                    <div>🍬 Flavors: ${totalDeleted.flavors} deleted</div>
                    <div style="margin-top: 0.5rem; font-weight: 600;">Total: ${totalItems} items and their IDs permanently removed from Firebase</div>
                </div>
            `;
            statusDiv.className = 'status-message success';
            statusDiv.style.display = 'block';
        }
        
        alert(`✅ All data deleted successfully!\n\nProducts: ${totalDeleted.products}\nBrands: ${totalDeleted.brands}\nFlavors: ${totalDeleted.flavors}\n\nTotal: ${totalItems} items permanently removed from Firebase.`);
    } catch (error) {
        console.error('Error deleting all data:', error);
        const errorMsg = error.message || error.toString();
        if (statusDiv) {
            statusDiv.textContent = '❌ Error deleting data: ' + errorMsg;
            statusDiv.className = 'status-message error';
            statusDiv.style.display = 'block';
        }
        alert('Error deleting all data: ' + errorMsg);
    }
}

// Make functions globally available
window.deleteAllProducts = deleteAllProducts;
window.deleteAllBrands = deleteAllBrands;
window.deleteAllFlavors = deleteAllFlavors;
window.deleteAllData = deleteAllData;

// Make functions globally available
window.openFlavorForm = openFlavorForm;
window.closeFlavorForm = closeFlavorForm;
window.openFlavorModal = openFlavorModal;
window.closeFlavorModal = closeFlavorModal;
window.removeAllFlavors = removeAllFlavors;

// Load products list in admin
function loadProductsList(snapshot) {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    if (snapshot.empty) {
        productsList.innerHTML = '<div class="empty-state"><p>No products added yet. Add your first product above!</p></div>';
        return;
    }
    
    // Create search and filter bar
    productsList.innerHTML = `
        <div class="products-toolbar">
            <div class="toolbar-header">
                <div class="toolbar-title">
                    <i class="fas fa-filter"></i>
                    <span>Filter by:</span>
                </div>
                <div class="toolbar-results" id="productResultsCount">
                    <span id="visibleProductsCount">0</span> of <span id="totalProductsCount">0</span> products
                </div>
            </div>
            <div class="toolbar-content">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="productSearch" placeholder="Search products by name, brand, or flavor..." class="search-input">
                </div>
                <div class="filter-group-toolbar">
                    <div class="filter-item">
                        <label class="filter-label">
                            <i class="fas fa-tag"></i>
                            <span>Brand</span>
                        </label>
                        <select id="filterBrand" class="filter-select-toolbar">
                            <option value="">All Brands</option>
                        </select>
                    </div>
                    <div class="filter-item">
                        <label class="filter-label">
                            <i class="fas fa-info-circle"></i>
                            <span>Status</span>
                        </label>
                        <select id="filterStatus" class="filter-select-toolbar">
                            <option value="">All Status</option>
                            <option value="Available">Available</option>
                            <option value="Out of Stock">Out of Stock</option>
                            <option value="Coming Soon">Coming Soon</option>
                        </select>
                    </div>
                    <div class="filter-item">
                        <label class="filter-label">
                            <i class="fas fa-sort"></i>
                            <span>Sort by</span>
                        </label>
                        <select id="sortProducts" class="filter-select-toolbar">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="price-asc">Price (Low-High)</option>
                            <option value="price-desc">Price (High-Low)</option>
                            <option value="stock-asc">Stock (Low-High)</option>
                            <option value="stock-desc">Stock (High-Low)</option>
                        </select>
                    </div>
                    <button class="btn-clear-filters" onclick="clearProductFilters()" title="Clear All Filters">
                        <i class="fas fa-times"></i>
                        <span>Clear</span>
                    </button>
                </div>
            </div>
            <div class="active-filters" id="activeFiltersContainer" style="display: none;">
                <span class="active-filters-label">Active filters:</span>
                <div class="active-filters-list" id="activeFiltersList"></div>
            </div>
        </div>
        <div class="products-table-container">
            <table class="products-table">
                <thead>
                    <tr>
                        <th>IMAGE</th>
                        <th>NAME</th>
                        <th>FLAVOURS</th>
                        <th>PRICE</th>
                        <th>STOCK</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody id="productsTableBody">
                </tbody>
            </table>
        </div>
    `;
    
    const productsTableBody = document.getElementById('productsTableBody');
    const allProducts = [];
    
    snapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() };
        allProducts.push(product);
        const row = createProductRowAdmin(product);
        productsTableBody.appendChild(row);
    });
    
    // Store products for filtering
    window.allProducts = allProducts;
    
    // Update total products count
    updateProductCounts(allProducts.length, allProducts.length);
    
    // Populate brand filter
    const brandFilter = document.getElementById('filterBrand');
    if (brandFilter) {
        const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });
    }
    
    // Setup search and filter handlers
    setupProductFilters();
    
    // Apply initial sort
    sortProductsTable('newest');
}

// Update product counts
function updateProductCounts(visible, total) {
    const visibleCount = document.getElementById('visibleProductsCount');
    const totalCount = document.getElementById('totalProductsCount');
    if (visibleCount) visibleCount.textContent = visible;
    if (totalCount) totalCount.textContent = total;
}

// Sort products table
function sortProductsTable(sortBy) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('.product-table-row'));
    const allProducts = window.allProducts || [];
    
    // Create a map of product IDs to products for quick lookup
    const productMap = {};
    allProducts.forEach(p => {
        productMap[p.id] = p;
    });
    
    rows.sort((a, b) => {
        const productA = productMap[a.dataset.productId];
        const productB = productMap[b.dataset.productId];
        
        if (!productA || !productB) return 0;
        
        switch(sortBy) {
            case 'newest':
                const dateA = productA.createdAt?.toMillis?.() || 0;
                const dateB = productB.createdAt?.toMillis?.() || 0;
                return dateB - dateA;
            case 'oldest':
                const dateA2 = productA.createdAt?.toMillis?.() || 0;
                const dateB2 = productB.createdAt?.toMillis?.() || 0;
                return dateA2 - dateB2;
            case 'name-asc':
                return (productA.name || '').localeCompare(productB.name || '');
            case 'name-desc':
                return (productB.name || '').localeCompare(productA.name || '');
            case 'price-asc':
                return (parseFloat(productA.price || 0)) - (parseFloat(productB.price || 0));
            case 'price-desc':
                return (parseFloat(productB.price || 0)) - (parseFloat(productA.price || 0));
            case 'stock-asc':
                return (parseInt(productA.stock || 0)) - (parseInt(productB.stock || 0));
            case 'stock-desc':
                return (parseInt(productB.stock || 0)) - (parseInt(productA.stock || 0));
            default:
                return 0;
        }
    });
    
    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));
}

// Create product row for admin - Table Layout
function createProductRowAdmin(product) {
    const row = document.createElement('tr');
    row.className = 'product-table-row';
    row.dataset.productId = product.id;
    row.setAttribute('data-product-id', product.id);
    row.dataset.productName = (product.name || '').toLowerCase();
    row.dataset.productBrand = (product.brand || '').toLowerCase();
    row.dataset.productStatus = (product.status || (product.stock > 0 ? 'Available' : 'Out of Stock')).toLowerCase();
    
    const status = product.status || (product.stock > 0 ? 'Available' : 'Out of Stock');
    const flavours = Array.isArray(product.flavour) ? product.flavour : (product.flavour ? [product.flavour] : []);
    
    const imgUrl = window.getImageUrl ? window.getImageUrl(product.image, 'product', product.brand, product.name) : (product.image || 'images/Foger/foger-switch-pro-30k-puffs-disposable-vape-pod.webp');
    
    // Format flavors for display (show first few, then "+X more")
    let flavorsDisplay = '';
    if (flavours.length > 0) {
        const displayFlavors = flavours.slice(0, 3);
        const remainingCount = flavours.length - 3;
        const flavorNames = displayFlavors.map(flavor => {
            return typeof flavor === 'string' ? flavor : (flavor.name || flavor);
        }).join(', ');
        flavorsDisplay = flavorNames;
        if (remainingCount > 0) {
            flavorsDisplay += ` +${remainingCount}`;
        }
    } else {
        flavorsDisplay = 'No flavors';
    }
    
    // Status badge styling
    let statusClass = 'status-available';
    let statusText = 'AVAILABLE';
    if (status === 'Out of Stock') {
        statusClass = 'status-out';
        statusText = 'OUT OF STOCK';
    } else if (status === 'Coming Soon') {
        statusClass = 'status-coming';
        statusText = 'COMING SOON';
    }
    
    row.innerHTML = `
        <td class="product-image-cell">
            <img src="${imgUrl}" alt="${product.name || 'Product'}" class="product-table-image"
                 onerror="window.handleImageError ? window.handleImageError(event, 'product', '${product.brand || ''}', '${(product.name || '').replace(/'/g, "\\'")}') : this.src='images/Foger/foger-switch-pro-30k-puffs-disposable-vape-pod.webp'">
        </td>
        <td class="product-name-cell">${product.name || 'Unnamed Product'}</td>
        <td class="product-flavors-cell">${flavorsDisplay}</td>
        <td class="product-price-cell">$${parseFloat(product.price || 0).toFixed(2)}</td>
        <td class="product-stock-cell">${product.stock || 0}</td>
        <td class="product-status-cell">
            <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td class="product-actions-cell">
            <button class="btn-edit-product" onclick="editProduct('${product.id}')" title="Edit Product">
                Edit
            </button>
            <button class="btn-delete-product" onclick="deleteProduct('${product.id}')" title="Delete Product">
                Delete
            </button>
        </td>
    `;
    return row;
}

// Setup product filters
function setupProductFilters() {
    const searchInput = document.getElementById('productSearch');
    const brandFilter = document.getElementById('filterBrand');
    const statusFilter = document.getElementById('filterStatus');
    const sortSelect = document.getElementById('sortProducts');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    if (brandFilter) {
        brandFilter.addEventListener('change', filterProducts);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterProducts);
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortProductsTable(e.target.value);
            updateActiveFilters();
        });
    }
}

// Filter products
function filterProducts() {
    const searchTerm = (document.getElementById('productSearch')?.value || '').toLowerCase();
    const brandFilter = (document.getElementById('filterBrand')?.value || '').toLowerCase();
    const statusFilter = (document.getElementById('filterStatus')?.value || '').toLowerCase();
    
    const rows = document.querySelectorAll('.product-table-row');
    let visibleCount = 0;
    const totalCount = rows.length;
    
    rows.forEach(row => {
        const name = row.dataset.productName || '';
        const brand = row.dataset.productBrand || '';
        const status = row.dataset.productStatus || '';
        
        // Enhanced search - also search in flavors
        const flavorCell = row.querySelector('.product-flavors-cell');
        const flavors = flavorCell ? flavorCell.textContent.toLowerCase() : '';
        const matchesSearch = !searchTerm || name.includes(searchTerm) || brand.includes(searchTerm) || flavors.includes(searchTerm);
        const matchesBrand = !brandFilter || brand === brandFilter;
        const matchesStatus = !statusFilter || status === statusFilter;
        
        if (matchesSearch && matchesBrand && matchesStatus) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update product counts
    updateProductCounts(visibleCount, totalCount);
    
    // Update active filters display
    updateActiveFilters();
    
    // Show message if no products match
    const productsTableBody = document.getElementById('productsTableBody');
    if (productsTableBody) {
        let noResultsMsg = productsTableBody.querySelector('.no-results-message');
        if (visibleCount === 0 && rows.length > 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('tr');
                noResultsMsg.className = 'no-results-message';
                noResultsMsg.innerHTML = '<td colspan="7" style="text-align: center; padding: 2rem;"><p><i class="fas fa-search"></i> No products match your filters. Try adjusting your search criteria.</p></td>';
                productsTableBody.appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = '';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }
}

// Update active filters display
function updateActiveFilters() {
    const searchTerm = document.getElementById('productSearch')?.value || '';
    const brandFilter = document.getElementById('filterBrand')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const sortSelect = document.getElementById('sortProducts')?.value || '';
    
    const activeFiltersContainer = document.getElementById('activeFiltersContainer');
    const activeFiltersList = document.getElementById('activeFiltersList');
    
    if (!activeFiltersContainer || !activeFiltersList) return;
    
    activeFiltersList.innerHTML = '';
    const hasFilters = searchTerm || brandFilter || statusFilter || (sortSelect && sortSelect !== 'newest');
    
    if (hasFilters) {
        activeFiltersContainer.style.display = 'flex';
        
        if (searchTerm) {
            const filterTag = createFilterTag('Search', searchTerm, 'productSearch');
            activeFiltersList.appendChild(filterTag);
        }
        if (brandFilter) {
            const filterTag = createFilterTag('Brand', brandFilter, 'filterBrand');
            activeFiltersList.appendChild(filterTag);
        }
        if (statusFilter) {
            const filterTag = createFilterTag('Status', statusFilter, 'filterStatus');
            activeFiltersList.appendChild(filterTag);
        }
        if (sortSelect && sortSelect !== 'newest') {
            const sortLabels = {
                'oldest': 'Oldest First',
                'name-asc': 'Name (A-Z)',
                'name-desc': 'Name (Z-A)',
                'price-asc': 'Price (Low-High)',
                'price-desc': 'Price (High-Low)',
                'stock-asc': 'Stock (Low-High)',
                'stock-desc': 'Stock (High-Low)'
            };
            const filterTag = createFilterTag('Sort', sortLabels[sortSelect] || sortSelect, 'sortProducts');
            activeFiltersList.appendChild(filterTag);
        }
    } else {
        activeFiltersContainer.style.display = 'none';
    }
}

// Create filter tag element
function createFilterTag(label, value, filterId) {
    const tag = document.createElement('div');
    tag.className = 'active-filter-tag';
    tag.innerHTML = `
        <span class="filter-tag-label">${label}:</span>
        <span class="filter-tag-value">${value}</span>
        <button type="button" class="filter-tag-remove" onclick="removeFilter('${filterId}')" title="Remove filter">
            <i class="fas fa-times"></i>
        </button>
    `;
    return tag;
}

// Remove specific filter
function removeFilter(filterId) {
    const element = document.getElementById(filterId);
    if (element) {
        if (element.type === 'text') {
            element.value = '';
        } else if (element.tagName === 'SELECT') {
            if (filterId === 'sortProducts') {
                element.value = 'newest';
            } else {
                element.value = '';
            }
        }
        if (filterId === 'sortProducts') {
            sortProductsTable(element.value);
        } else {
            filterProducts();
        }
    }
}

// Clear filters
function clearProductFilters() {
    const searchInput = document.getElementById('productSearch');
    const brandFilter = document.getElementById('filterBrand');
    const statusFilter = document.getElementById('filterStatus');
    const sortSelect = document.getElementById('sortProducts');
    
    if (searchInput) searchInput.value = '';
    if (brandFilter) brandFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (sortSelect) sortSelect.value = 'newest';
    
    filterProducts();
    sortProductsTable('newest');
}

window.clearProductFilters = clearProductFilters;

// Update flavor counts
function updateFlavorCounts(visible, total) {
    const visibleCount = document.getElementById('visibleFlavorsCount');
    const totalCount = document.getElementById('totalFlavorsCount');
    if (visibleCount) visibleCount.textContent = visible;
    if (totalCount) totalCount.textContent = total;
}

// Sort flavors table
function sortFlavorsTable(sortBy) {
    const grid = document.getElementById('flavoursGrid');
    if (!grid) return;
    
    const cards = Array.from(grid.querySelectorAll('.flavor-row-item'));
    const allFlavors = window.allFlavors || [];
    
    // Create a map for quick lookup
    const flavorMap = new Map();
    allFlavors.forEach(flavor => {
        flavorMap.set(flavor.id, flavor);
    });
    
    cards.sort((a, b) => {
        const flavorA = flavorMap.get(a.dataset.flavorId || '');
        const flavorB = flavorMap.get(b.dataset.flavorId || '');
        
        if (!flavorA || !flavorB) return 0;
        
        switch(sortBy) {
            case 'newest':
                const timeA = flavorA.createdAt?.toMillis?.() || 0;
                const timeB = flavorB.createdAt?.toMillis?.() || 0;
                return timeB - timeA;
            case 'oldest':
                const timeAOld = flavorA.createdAt?.toMillis?.() || 0;
                const timeBOld = flavorB.createdAt?.toMillis?.() || 0;
                return timeAOld - timeBOld;
            case 'name-asc':
                return (flavorA.name || '').localeCompare(flavorB.name || '');
            case 'name-desc':
                return (flavorB.name || '').localeCompare(flavorA.name || '');
            case 'brand-asc':
                return (flavorA.brand || '').localeCompare(flavorB.brand || '');
            case 'brand-desc':
                return (flavorB.brand || '').localeCompare(flavorA.brand || '');
            case 'id-asc':
                return (flavorA.flavorId || '').localeCompare(flavorB.flavorId || '');
            case 'id-desc':
                return (flavorB.flavorId || '').localeCompare(flavorA.flavorId || '');
            default:
                return 0;
        }
    });
    
    // Re-append sorted cards
    cards.forEach(card => grid.appendChild(card));
    
    // Update active filters
    updateActiveFlavorFilters();
}

// Setup flavor filters
function setupFlavorFilters() {
    const searchInput = document.getElementById('flavorSearch');
    const brandFilter = document.getElementById('filterFlavorBrand');
    const sortSelect = document.getElementById('sortFlavors');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterFlavors);
    }
    if (brandFilter) {
        brandFilter.addEventListener('change', filterFlavors);
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortFlavorsTable(e.target.value);
            updateActiveFlavorFilters();
        });
    }
}

// Filter flavors
function filterFlavors() {
    const searchTerm = (document.getElementById('flavorSearch')?.value || '').toLowerCase();
    const brandFilter = (document.getElementById('filterFlavorBrand')?.value || '').toLowerCase();
    
    const cards = document.querySelectorAll('.flavor-row-item');
    let visibleCount = 0;
    const totalCount = cards.length;
    
    cards.forEach(card => {
        const name = card.dataset.flavorName || '';
        const brand = card.dataset.flavorBrand || '';
        const id = card.dataset.flavorId || '';
        
        const matchesSearch = !searchTerm || 
            name.includes(searchTerm) || 
            brand.includes(searchTerm) || 
            id.includes(searchTerm);
        const matchesBrand = !brandFilter || brand === brandFilter;
        
        if (matchesSearch && matchesBrand) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Update flavor counts
    updateFlavorCounts(visibleCount, totalCount);
    
    // Update active filters display
    updateActiveFlavorFilters();
    
    // Show message if no flavors match
    const flavoursGrid = document.getElementById('flavoursGrid');
    if (flavoursGrid) {
        let noResultsMsg = flavoursGrid.querySelector('.no-results-message');
        if (visibleCount === 0 && cards.length > 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'no-results-message';
                noResultsMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 2rem; color: #64748B;';
                noResultsMsg.innerHTML = '<p><i class="fas fa-search"></i> No flavors match your filters. Try adjusting your search criteria.</p>';
                flavoursGrid.appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = '';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }
}

// Update active flavor filters display
function updateActiveFlavorFilters() {
    const searchTerm = document.getElementById('flavorSearch')?.value || '';
    const brandFilter = document.getElementById('filterFlavorBrand')?.value || '';
    const sortSelect = document.getElementById('sortFlavors')?.value || '';
    
    const activeFiltersContainer = document.getElementById('activeFlavorFiltersContainer');
    const activeFiltersList = document.getElementById('activeFlavorFiltersList');
    
    if (!activeFiltersContainer || !activeFiltersList) return;
    
    activeFiltersList.innerHTML = '';
    const hasFilters = searchTerm || brandFilter || (sortSelect && sortSelect !== 'newest');
    
    if (hasFilters) {
        if (searchTerm) {
            const badge = document.createElement('span');
            badge.className = 'active-filter-badge';
            badge.innerHTML = `<i class="fas fa-search"></i> Search: "${searchTerm}" <button onclick="document.getElementById('flavorSearch').value=''; filterFlavors();" class="remove-filter-btn">×</button>`;
            activeFiltersList.appendChild(badge);
        }
        
        if (brandFilter) {
            const badge = document.createElement('span');
            badge.className = 'active-filter-badge';
            badge.innerHTML = `<i class="fas fa-tag"></i> Brand: "${brandFilter}" <button onclick="document.getElementById('filterFlavorBrand').value=''; filterFlavors();" class="remove-filter-btn">×</button>`;
            activeFiltersList.appendChild(badge);
        }
        
        if (sortSelect && sortSelect !== 'newest') {
            const sortLabels = {
                'oldest': 'Oldest First',
                'name-asc': 'Name (A-Z)',
                'name-desc': 'Name (Z-A)',
                'brand-asc': 'Brand (A-Z)',
                'brand-desc': 'Brand (Z-A)',
                'id-asc': 'ID (A-Z)',
                'id-desc': 'ID (Z-A)'
            };
            const badge = document.createElement('span');
            badge.className = 'active-filter-badge';
            badge.innerHTML = `<i class="fas fa-sort"></i> Sort: "${sortLabels[sortSelect] || sortSelect}" <button onclick="document.getElementById('sortFlavors').value='newest'; sortFlavorsTable('newest');" class="remove-filter-btn">×</button>`;
            activeFiltersList.appendChild(badge);
        }
        
        activeFiltersContainer.style.display = '';
    } else {
        activeFiltersContainer.style.display = 'none';
    }
}

// Clear flavor filters
function clearFlavorFilters() {
    const searchInput = document.getElementById('flavorSearch');
    const brandFilter = document.getElementById('filterFlavorBrand');
    const sortSelect = document.getElementById('sortFlavors');
    
    if (searchInput) searchInput.value = '';
    if (brandFilter) brandFilter.value = '';
    if (sortSelect) sortSelect.value = 'newest';
    
    filterFlavors();
    sortFlavorsTable('newest');
}

window.clearFlavorFilters = clearFlavorFilters;

// Delete brand
async function deleteBrand(brandId) {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    
    try {
        // Delete the brand document
        await db.collection('brands').doc(brandId).delete();
        
        // The onSnapshot listener will automatically update the admin panel
        // The index page will also automatically update via its onSnapshot listener
        console.log('Brand deleted successfully from Firebase');
        
        // Show success message
        alert('Brand deleted successfully! The changes will be reflected on the index page automatically.');
    } catch (error) {
        console.error('Error deleting brand:', error);
        alert('Error deleting brand: ' + error.message);
    }
}

// Delete flavour
async function deleteFlavour(flavourId) {
    if (!confirm('Are you sure you want to delete this flavour?')) return;
    
    try {
        // Delete the flavour document
        await db.collection('flavours').doc(flavourId).delete();
        
        // The onSnapshot listener will automatically update the admin panel
        // The index page will also automatically update via its onSnapshot listener
        console.log('Flavour deleted successfully from Firebase');
        
        // Show success message
        alert('Flavour deleted successfully! The changes will be reflected on the index page automatically.');
    } catch (error) {
        console.error('Error deleting flavour:', error);
        alert('Error deleting flavour: ' + error.message);
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        // Delete the product document
        await db.collection('products').doc(productId).delete();
        
        // The onSnapshot listener will automatically update the admin panel
        // The index page will also automatically update via its onSnapshot listener
        console.log('Product deleted successfully from Firebase');
        
        // Show success message
        alert('Product deleted successfully! The changes will be reflected on the index page automatically.');
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + error.message);
    }
}

// Flag to prevent multiple simultaneous edit operations
let isEditing = false;

// Edit functions
// Helper function to scroll to element with proper offset for sticky header (mobile-friendly)
function scrollToElement(element, offset = 20) {
    if (!element) return;
    
    // Cancel any existing scroll animations
    window.scrollTo({ top: window.pageYOffset, behavior: 'auto' });
    
    // Wait for layout to stabilize
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const header = document.querySelector('.admin-header');
            const headerHeight = header ? header.offsetHeight : 100;
            
            // Get element position
            const elementRect = element.getBoundingClientRect();
            const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            // Calculate target scroll position
            const targetScrollY = elementRect.top + currentScrollY - headerHeight - offset;
            const finalScrollY = Math.max(0, targetScrollY);
            
            // Use instant scroll first, then smooth if needed
            window.scrollTo({
                top: finalScrollY,
                behavior: 'auto'
            });
            
            // Small adjustment after layout settles (mobile-friendly)
            setTimeout(() => {
                const finalRect = element.getBoundingClientRect();
                const finalHeaderHeight = header ? header.offsetHeight : 100;
                
                if (finalRect.top < finalHeaderHeight + offset) {
                    const adjustment = finalHeaderHeight + offset - finalRect.top;
                    window.scrollTo({
                        top: window.pageYOffset + adjustment,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        });
    });
}

async function editBrand(brandId) {
    // Prevent multiple simultaneous edit operations
    if (isEditing) {
        return;
    }
    
    isEditing = true;
    
    try {
        const brandDoc = await db.collection('brands').doc(brandId).get();
        if (!brandDoc.exists) {
            alert('Brand not found!');
            isEditing = false;
            return;
        }
        
        const brand = brandDoc.data();
        const form = document.getElementById('brandForm');
        if (!form) {
            alert('Brand form not found!');
            isEditing = false;
            return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Open modal first
        openBrandModal();
        
        // Wait for modal to be visible
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Populate form
        document.getElementById('brandName').value = brand.name || '';
        document.getElementById('brandDescription').value = brand.description || '';
        
        // Set edit mode
        form.dataset.editingId = brandId;
        submitBtn.classList.add('btn-update');
        
        // Update modal title and button text
        const modalTitle = document.getElementById('brandModalTitle');
        const submitButtonText = document.getElementById('submitBrandButtonText');
        
        if (modalTitle) {
            const titleSpan = modalTitle.querySelector('span');
            if (titleSpan) titleSpan.textContent = 'Edit Brand';
        }
        if (submitButtonText) {
            submitButtonText.textContent = 'Update Brand';
        } else if (submitBtn) {
            const btnText = submitBtn.querySelector('span');
            if (btnText) {
                btnText.textContent = 'Update Brand';
            } else {
                submitBtn.textContent = 'Update Brand';
            }
        }
        
        isEditing = false;
    } catch (error) {
        console.error('Error loading brand:', error);
        alert('Error loading brand: ' + error.message);
        isEditing = false;
        closeBrandModal();
    }
}

async function editFlavour(flavourId) {
    // Prevent multiple simultaneous edit operations
    if (isEditing) {
        return;
    }
    
    isEditing = true;
    
    try {
        const flavourDoc = await db.collection('flavours').doc(flavourId).get();
        if (!flavourDoc.exists) {
            alert('Flavour not found!');
            isEditing = false;
            return;
        }
        
        const flavour = flavourDoc.data();
        const form = document.getElementById('flavourForm');
        
        if (!form) {
            alert('Flavour form not found!');
            isEditing = false;
            return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Open modal first
        openFlavorModal();
        
        // Wait for modal to be visible
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Populate form
        document.getElementById('flavourBrand').value = flavour.brand || '';
        
        // Trigger brand change to update any dependent fields
        const brandSelect = document.getElementById('flavourBrand');
        if (brandSelect) {
            brandSelect.dispatchEvent(new Event('change'));
        }
        
        // Wait a bit for any brand-dependent updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        document.getElementById('flavourName').value = flavour.name || '';
        document.getElementById('flavourId').value = flavour.flavorId || '';
        
        // Show existing image if available
        const preview = document.getElementById('previewFlavour');
        if (preview) {
            if (flavour.image) {
                const imgUrl = window.getImageUrl ? window.getImageUrl(flavour.image, 'flavour', flavour.brand) : flavour.image;
                preview.src = imgUrl;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
                preview.src = '';
            }
        }
        
        // Store existing image URL for preservation if no new image is uploaded
        if (flavour.image) {
            form.dataset.existingImage = flavour.image;
        }
        
        // Set edit mode
        form.dataset.editingId = flavourId;
        submitBtn.classList.add('btn-update');
        
        // Update modal title and button text
        const modalTitle = document.getElementById('flavorModalTitle');
        const submitButtonText = document.getElementById('submitFlavorButtonText');
        
        if (modalTitle) {
            const titleSpan = modalTitle.querySelector('span');
            if (titleSpan) titleSpan.textContent = 'Edit Flavor';
        }
        if (submitButtonText) {
            submitButtonText.textContent = 'Update Flavour';
        } else if (submitBtn) {
            const btnText = submitBtn.querySelector('span');
            if (btnText) {
                btnText.textContent = 'Update Flavour';
            } else {
                submitBtn.textContent = 'Update Flavour';
            }
        }
        
        isEditing = false;
    } catch (error) {
        console.error('Error loading flavour:', error);
        alert('Error loading flavour: ' + error.message);
        isEditing = false;
        closeFlavorModal();
    }
}


// Product Modal Functions
function openProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reset form if not editing
        const form = document.getElementById('productForm');
        if (form && !form.dataset.editingId) {
            resetProductForm();
        }
        
        // Scroll modal body to top
        const modalBody = modal.querySelector('.product-modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form after animation
        setTimeout(() => {
            resetProductForm();
        }, 300);
    }
}

function resetProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const modalTitle = document.getElementById('productModalTitle');
    const submitButtonText = document.getElementById('submitButtonText');
    
    // Reset form
    form.reset();
    delete form.dataset.editingId;
    delete form.dataset.existingImage;
    
    // Set default status to "Available"
    const statusSelect = document.getElementById('productStatusSelect');
    if (statusSelect) {
        statusSelect.value = 'Available';
    }
    
    if (submitBtn) {
        const btnText = submitBtn.querySelector('span');
        if (btnText) {
            btnText.textContent = 'Add Product';
        } else {
            submitBtn.textContent = 'Add Product';
        }
        submitBtn.classList.remove('btn-update');
    }
    
    if (modalTitle) {
        const titleSpan = modalTitle.querySelector('span');
        if (titleSpan) titleSpan.textContent = 'Add New Product';
    }
    if (submitButtonText) submitButtonText.textContent = 'Add Product';
    
    // Clear preview
    const preview = document.getElementById('previewProduct');
    if (preview) {
        preview.style.display = 'none';
        preview.src = '';
    }
    
    // Clear selected flavours
    if (window.clearSelectedFlavours) {
        window.clearSelectedFlavours();
    }
    
    // Clear status message
    const statusDiv = document.getElementById('productStatusMessage');
    if (statusDiv) {
        statusDiv.textContent = '';
        statusDiv.className = 'status-message';
        statusDiv.style.display = 'none';
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const productModal = document.getElementById('productModal');
    const brandModal = document.getElementById('brandModal');
    const flavorModal = document.getElementById('flavorModal');
    
    if (productModal && event.target.classList.contains('product-modal-overlay')) {
        closeProductModal();
    } else if (brandModal && event.target.classList.contains('product-modal-overlay')) {
        closeBrandModal();
    } else if (flavorModal && event.target.classList.contains('product-modal-overlay')) {
        closeFlavorModal();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const productModal = document.getElementById('productModal');
        const brandModal = document.getElementById('brandModal');
        const flavorModal = document.getElementById('flavorModal');
        if (productModal && productModal.classList.contains('active')) {
            closeProductModal();
        } else if (brandModal && brandModal.classList.contains('active')) {
            closeBrandModal();
        } else if (flavorModal && flavorModal.classList.contains('active')) {
            closeFlavorModal();
        }
    }
});

// Make functions available globally
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;

// Brand Modal Functions
function openBrandModal() {
    const modal = document.getElementById('brandModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reset form if not editing
        const form = document.getElementById('brandForm');
        if (form && !form.dataset.editingId) {
            resetBrandForm();
        }
        
        // Scroll modal body to top
        const modalBody = modal.querySelector('.product-modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }
}

function closeBrandModal() {
    const modal = document.getElementById('brandModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form after animation
        setTimeout(() => {
            resetBrandForm();
        }, 300);
    }
}

function resetBrandForm() {
    const form = document.getElementById('brandForm');
    if (!form) return;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const modalTitle = document.getElementById('brandModalTitle');
    const submitButtonText = document.getElementById('submitBrandButtonText');
    
    // Reset form
    form.reset();
    delete form.dataset.editingId;
    
    if (submitBtn) {
        const btnText = submitBtn.querySelector('span');
        if (btnText) {
            btnText.textContent = 'Add Brand';
        } else {
            submitBtn.textContent = 'Add Brand';
        }
        submitBtn.classList.remove('btn-update');
    }
    
    if (modalTitle) {
        const titleSpan = modalTitle.querySelector('span');
        if (titleSpan) titleSpan.textContent = 'Add New Brand';
    }
    if (submitButtonText) submitButtonText.textContent = 'Add Brand';
    
    // Clear status message
    const statusDiv = document.getElementById('brandStatus');
    if (statusDiv) {
        statusDiv.textContent = '';
        statusDiv.className = 'status-message';
        statusDiv.style.display = 'none';
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const productModal = document.getElementById('productModal');
    const brandModal = document.getElementById('brandModal');
    const flavorModal = document.getElementById('flavorModal');
    
    if (productModal && event.target.classList.contains('product-modal-overlay')) {
        closeProductModal();
    } else if (brandModal && event.target.classList.contains('product-modal-overlay')) {
        closeBrandModal();
    } else if (flavorModal && event.target.classList.contains('product-modal-overlay')) {
        closeFlavorModal();
    }
});

// Close brand modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('brandModal');
        if (modal && modal.classList.contains('active')) {
            closeBrandModal();
        }
    }
});

// Make brand modal functions available globally
window.openBrandModal = openBrandModal;
window.closeBrandModal = closeBrandModal;

async function editProduct(productId) {
    // Prevent multiple simultaneous edit operations
    if (isEditing) {
        return;
    }
    
    isEditing = true;
    
    try {
        const productDoc = await db.collection('products').doc(productId).get();
        if (!productDoc.exists) {
            alert('Product not found!');
            isEditing = false;
            return;
        }
        
        const product = productDoc.data();
        const form = document.getElementById('productForm');
        if (!form) {
            alert('Product form not found!');
            isEditing = false;
            return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Open modal first
        openProductModal();
        
        // Wait for modal to be visible
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Populate form
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productBrand').value = product.brand || '';
        
        // Trigger brand change to update flavor dropdown
        const brandSelect = document.getElementById('productBrand');
        if (brandSelect) {
            brandSelect.dispatchEvent(new Event('change'));
        }
        
        // Handle multiple flavours - set in flavour selector
        // Wait a bit for flavor dropdown to populate
        await new Promise(resolve => setTimeout(resolve, 200));
        if (window.setSelectedFlavours) {
            const flavours = Array.isArray(product.flavour) ? product.flavour : (product.flavour ? [product.flavour] : []);
            window.setSelectedFlavours(flavours);
        }
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productStock').value = product.stock || 0;
        
        // Set status - ensure it matches one of the dropdown options
        const statusValue = product.status || (product.stock > 0 ? 'Available' : 'Out of Stock');
        const statusSelect = document.getElementById('productStatusSelect');
        if (statusSelect) {
            // Check if the value exists in options (handle both with and without emoji prefixes)
            const optionExists = Array.from(statusSelect.options).some(opt => {
                const optValue = opt.value.trim();
                return optValue === statusValue || optValue === statusValue;
            });
            if (optionExists) {
                statusSelect.value = statusValue;
            } else {
                // Default to Available if status doesn't match
                statusSelect.value = 'Available';
            }
            // Trigger change event to update UI
            statusSelect.dispatchEvent(new Event('change'));
        }
        document.getElementById('productFeatured').checked = product.featured === true;
        
        // Store existing image URL for preservation if no new image is uploaded
        if (product.image) {
            form.dataset.existingImage = product.image;
        }
        
        // Show existing image if available
        const preview = document.getElementById('previewProduct');
        if (preview) {
            if (product.image) {
                const imgUrl = window.getImageUrl ? window.getImageUrl(product.image, 'product', product.brand, product.name) : product.image;
                preview.src = imgUrl;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
                preview.src = '';
            }
        }
        
        // Set edit mode
        form.dataset.editingId = productId;
        submitBtn.classList.add('btn-update');
        
        // Update modal title and button text
        const modalTitle = document.getElementById('productModalTitle');
        const submitButtonText = document.getElementById('submitButtonText');
        
        if (modalTitle) {
            const titleSpan = modalTitle.querySelector('span');
            if (titleSpan) titleSpan.textContent = 'Edit Product';
        }
        if (submitButtonText) {
            submitButtonText.textContent = 'Update Product';
        } else if (submitBtn) {
            const btnText = submitBtn.querySelector('span');
            if (btnText) {
                btnText.textContent = 'Update Product';
            } else {
                submitBtn.textContent = 'Update Product';
            }
        }
        
        isEditing = false;
    } catch (error) {
        console.error('Error loading product:', error);
        alert('Error loading product: ' + error.message);
        isEditing = false;
        closeProductModal();
    }
}

// Make edit and delete functions available globally
window.editBrand = editBrand;
window.editFlavour = editFlavour;
window.editProduct = editProduct;
window.deleteBrand = deleteBrand;
window.deleteFlavour = deleteFlavour;
window.deleteProduct = deleteProduct;

// Make modal functions available globally

// Toggle featured status for a product
async function toggleFeatured(productId, isFeatured, event) {
    const checkbox = event && event.target ? event.target : null;
    const button = event && event.target && event.target.closest ? event.target.closest('.btn-featured-card') : null;
    
    try {
        // First, check how many products are currently featured (excluding the current one)
        if (isFeatured) {
            const featuredSnapshot = await db.collection('products').where('featured', '==', true).get();
            const currentProductDoc = await db.collection('products').doc(productId).get();
            const currentIsFeatured = currentProductDoc.exists && currentProductDoc.data().featured === true;
            
            // Count other featured products (excluding current if it's currently featured)
            const otherFeaturedCount = featuredSnapshot.docs.filter(doc => {
                return doc.id !== productId || !currentIsFeatured;
            }).length;
            
            if (otherFeaturedCount >= 5) {
                if (!confirm(`You already have 5 featured products. Adding this will make ${otherFeaturedCount + 1} featured products. Continue?`)) {
                    // Reset checkbox or button
                    if (checkbox) {
                        checkbox.checked = false;
                    }
                    return;
                }
            }
        }
        
        await db.collection('products').doc(productId).update({
            featured: isFeatured
        });
        
        // Update button state if using button
        if (button) {
            if (isFeatured) {
                button.classList.add('active');
                const span = button.querySelector('span');
                if (span) span.textContent = 'Featured';
            } else {
                button.classList.remove('active');
                const span = button.querySelector('span');
                if (span) span.textContent = 'Feature';
            }
        }
        
        // Update featured badge on card
        const card = document.querySelector(`[data-product-id="${productId}"]`);
        if (card) {
            let badge = card.querySelector('.featured-badge-card');
            if (isFeatured && !badge) {
                const top = card.querySelector('.product-card-top');
                if (top) {
                    badge = document.createElement('div');
                    badge.className = 'featured-badge-card';
                    badge.innerHTML = '<i class="fas fa-star"></i> Featured';
                    top.insertBefore(badge, top.firstChild);
                }
            } else if (!isFeatured && badge) {
                badge.remove();
            }
        }
        
        // Show success message
        const statusDiv = document.getElementById('productStatusMessage');
        if (statusDiv) {
            statusDiv.textContent = isFeatured ? 'Product marked as featured!' : 'Product removed from featured.';
            statusDiv.className = 'status-message success';
            statusDiv.style.display = 'block';
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    } catch (error) {
        console.error('Error updating featured status:', error);
        alert('Error updating featured status: ' + error.message);
        // Reset checkbox on error
        if (checkbox) {
            checkbox.checked = !isFeatured;
        }
    }
}

// Make toggleFeatured available globally
window.toggleFeatured = toggleFeatured;

// Update brand display order
async function updateBrandDisplayOrder(brandId, displayOrder) {
    try {
        const orderValue = parseInt(displayOrder) || 1;
        await db.collection('brands').doc(brandId).update({
            displayOrder: orderValue
        });
        console.log(`Display order updated to ${orderValue} for brand ${brandId}`);
        // The change will automatically reflect on the index page via real-time listener
    } catch (error) {
        console.error('Error updating display order:', error);
        alert('Error updating display order: ' + error.message);
    }
}

// Remove flavor from brand - Updated for Brand-Specific Flavors
async function removeFlavorFromBrand(brandId, flavorIdentifier) {
    try {
        const brandDoc = await db.collection('brands').doc(brandId).get();
        if (!brandDoc.exists) {
            alert('Brand not found!');
            return;
        }
        
        const brandData = brandDoc.data();
        const brandName = brandData.name;
        
        // Try to find the flavor by identifier (could be ID, flavorId, or name)
        let flavorDoc = null;
        let flavorDocId = null;
        
        // First try to find by document ID
        try {
            const doc = await db.collection('flavours').doc(flavorIdentifier).get();
            if (doc.exists && doc.data().brand === brandName) {
                flavorDoc = doc;
                flavorDocId = doc.id;
            }
        } catch (e) {
            // Not a document ID, try other methods
        }
        
        // If not found by ID, try to find by flavorId or name
        if (!flavorDoc) {
            const flavorsSnapshot = await db.collection('flavours')
                .where('brand', '==', brandName)
                .get();
            
            flavorsSnapshot.forEach((doc) => {
                const flavorData = doc.data();
                if (doc.id === flavorIdentifier || 
                    flavorData.flavorId === flavorIdentifier ||
                    flavorData.name === flavorIdentifier) {
                    flavorDoc = doc;
                    flavorDocId = doc.id;
                }
            });
        }
        
        if (!flavorDoc || !flavorDocId) {
            alert('Flavor not found for this brand.');
            return;
        }
        
        // Remove from legacy assignedFlavors array if it exists
        let assignedFlavors = brandData.assignedFlavors || [];
        const updatedFlavors = assignedFlavors.filter(f => {
            if (typeof f === 'string') {
                return f !== flavorDoc.data().name;
            } else {
                const flavorId = f.id || f.flavorId;
                return !(flavorId === flavorDocId || 
                        flavorId === flavorDoc.data().flavorId ||
                        f.id === flavorDocId);
            }
        });
        
        // Update brand document if there were legacy assigned flavors
        if (updatedFlavors.length < assignedFlavors.length) {
            await db.collection('brands').doc(brandId).update({
                assignedFlavors: updatedFlavors
            });
        }
        
        // Note: We don't remove the brand field from the flavor document
        // because flavors are inherently brand-specific in the new system
        // The flavor will still show in the brand card because it has brand field
        
        alert(`Flavor removed from brand assignment successfully!`);
        
        // Reload brands list to reflect changes
        const brandsSnapshot = await db.collection('brands').get();
        loadBrandsList(brandsSnapshot);
    } catch (error) {
        console.error('Error removing flavor from brand:', error);
        alert('Error removing flavor: ' + error.message);
    }
}

// Open assign flavor modal - Updated for Brand-Specific Flavors
async function openAssignFlavorModal(brandId) {
    // Get brand name
    const brandDoc = await db.collection('brands').doc(brandId).get();
    if (!brandDoc.exists) {
        alert('Brand not found!');
        return;
    }
    const brandData = brandDoc.data();
    const brandName = brandData.name;
    
    // Get all flavors that belong to this brand (brand-specific system)
    const flavorsSnapshot = await db.collection('flavours')
        .where('brand', '==', brandName)
        .get();
    
    const brandFlavors = [];
    flavorsSnapshot.forEach((doc) => {
        const flavorData = doc.data();
        brandFlavors.push({
            id: doc.id,
            name: flavorData.name || 'Unnamed Flavor',
            flavorId: (flavorData.flavorId && flavorData.flavorId.trim()) ? flavorData.flavorId : 'N/A',
            brand: flavorData.brand || brandName
        });
    });
    
    // Also check legacy assignedFlavors for backward compatibility
    const legacyAssignedFlavors = brandData.assignedFlavors || [];
    const assignedFlavorIds = new Set();
    
    // Get IDs from legacy assigned flavors
    legacyAssignedFlavors.forEach(f => {
        if (typeof f === 'string') {
            // Find flavor by name in brandFlavors
            const found = brandFlavors.find(bf => bf.name === f);
            if (found) {
                assignedFlavorIds.add(found.id);
                assignedFlavorIds.add(found.flavorId);
            }
        } else {
            assignedFlavorIds.add(f.id || f.flavorId);
        }
    });
    
    // Filter out already assigned flavors
    const availableFlavors = brandFlavors.filter(f => 
        !assignedFlavorIds.has(f.id) && !assignedFlavorIds.has(f.flavorId)
    );
    
    if (availableFlavors.length === 0) {
        alert(`All flavors for brand "${brandName}" are already assigned.`);
        return;
    }
    
    // Create a modal for flavor selection with ID display
    const modal = document.createElement('div');
    modal.className = 'flavor-assign-modal-overlay';
    modal.innerHTML = `
        <div class="flavor-assign-modal">
            <div class="modal-header">
                <h3>Assign Flavor to Brand</h3>
                <button class="modal-close" onclick="this.closest('.flavor-assign-modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 1rem; color: var(--text-color);">Select a flavor to assign (showing name and ID):</p>
                <div class="flavor-select-list">
                    ${availableFlavors.map(flavor => {
                        const flavorIdDisplay = (flavor.flavorId && flavor.flavorId.trim()) ? flavor.flavorId : 'N/A';
                        const flavorData = JSON.stringify({
                            id: flavor.id,
                            name: flavor.name,
                            flavorId: flavor.flavorId
                        }).replace(/'/g, "&#39;");
                        return `
                        <div class="flavor-select-item" onclick="selectFlavorForBrand('${brandId}', '${flavorData.replace(/"/g, '&quot;')}')">
                            <i class="fas fa-check-circle"></i>
                            <div class="flavor-select-info">
                                <span class="flavor-select-name">${flavor.name}</span>
                                <span class="flavor-select-id">ID: ${flavorIdDisplay}</span>
                            </div>
                        </div>
                    `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Select flavor for brand
async function selectFlavorForBrand(brandId, flavorDataJson) {
    // Remove modal
    const modal = document.querySelector('.flavor-assign-modal-overlay');
    if (modal) modal.remove();
    
    try {
        // Parse flavor data (handle both JSON string and plain string for backward compatibility)
        let flavorData;
        if (typeof flavorDataJson === 'string' && flavorDataJson.startsWith('{')) {
            flavorData = JSON.parse(flavorDataJson.replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
        } else {
            // Backward compatibility - if it's just a name string, fetch the flavor
            const flavorsSnapshot = await db.collection('flavours').where('name', '==', flavorDataJson).get();
            if (flavorsSnapshot.empty) {
                alert('Flavor not found!');
                return;
            }
            const flavorDoc = flavorsSnapshot.docs[0];
            const flavorDocData = flavorDoc.data();
            flavorData = {
                id: flavorDoc.id,
                name: flavorDocData.name,
                flavorId: (flavorDocData.flavorId && flavorDocData.flavorId.trim()) ? flavorDocData.flavorId : 'N/A'
            };
        }
        
        // Assign flavor with full data
        await assignFlavorToBrand(brandId, flavorData);
    } catch (error) {
        console.error('Error parsing flavor data:', error);
        alert('Error processing flavor selection: ' + error.message);
    }
}

// Assign flavor to brand - Updated for Brand-Specific Flavors
async function assignFlavorToBrand(brandId, flavorData) {
    try {
        const brandDoc = await db.collection('brands').doc(brandId).get();
        if (!brandDoc.exists) {
            alert('Brand not found!');
            return;
        }
        
        const brandData = brandDoc.data();
        const brandName = brandData.name;
        
        // Verify flavor belongs to this brand (brand-specific system)
        const flavorDoc = await db.collection('flavours').doc(flavorData.id).get();
        if (!flavorDoc.exists) {
            alert('Flavor not found!');
            return;
        }
        
        const existingFlavorData = flavorDoc.data();
        if (existingFlavorData.brand !== brandName) {
            alert(`This flavor belongs to brand "${existingFlavorData.brand || 'Unknown'}". Only flavors for "${brandName}" can be assigned.`);
            return;
        }
        
        // Check legacy assignedFlavors for backward compatibility
        let assignedFlavors = brandData.assignedFlavors || [];
        
        // Convert old string format to object format
        assignedFlavors = assignedFlavors.map(f => {
            if (typeof f === 'string') {
                return { name: f, flavorId: null, id: null };
            }
            return f;
        });
        
        // Check if flavor is already in legacy assignedFlavors (by ID)
        const flavorId = flavorData.id || flavorData.flavorId;
        const isAlreadyAssigned = assignedFlavors.some(f => 
            (f.id === flavorId) || (f.flavorId === flavorId) || 
            (f.id === flavorData.id) || (f.flavorId === flavorData.flavorId)
        );
        
        if (isAlreadyAssigned) {
            alert('This flavor is already assigned to this brand.');
            return;
        }
        
        // Add flavor to legacy assignedFlavors array for backward compatibility
        assignedFlavors.push({
            id: flavorData.id,
            name: flavorData.name,
            flavorId: flavorData.flavorId
        });
        
        await db.collection('brands').doc(brandId).update({
            assignedFlavors: assignedFlavors
        });
        
        alert(`Flavor "${flavorData.name}" (ID: ${flavorData.flavorId}) assigned to brand successfully!`);
        
        // Reload brands list to reflect changes
        const brandsSnapshot = await db.collection('brands').get();
        loadBrandsList(brandsSnapshot);
    } catch (error) {
        console.error('Error assigning flavor to brand:', error);
        alert('Error assigning flavor: ' + error.message);
    }
}

// Make functions globally available
window.updateBrandDisplayOrder = updateBrandDisplayOrder;
window.removeFlavorFromBrand = removeFlavorFromBrand;
window.openAssignFlavorModal = openAssignFlavorModal;
window.selectFlavorForBrand = selectFlavorForBrand;

// Dashboard Functions
function loadDashboardData() {
    loadDashboardStats();
    loadLiveVisitors();
    loadInventoryHealth();
    loadLowStockTable();
    loadTopProductsTable();
    loadStatusChart();
    loadBrandChart();
    loadPriceChart();
    setupQuickActions();
}

// Load dashboard statistics
function loadDashboardStats() {
    // Load products count
    db.collection('products').onSnapshot((snapshot) => {
        const totalProducts = snapshot.size;
        const featuredCount = snapshot.docs.filter(doc => doc.data().featured === true).length;
        
        const totalProductsEl = document.getElementById('totalProducts');
        const featuredProductsEl = document.getElementById('featuredProducts');
        if (totalProductsEl) totalProductsEl.textContent = totalProducts;
        if (featuredProductsEl) featuredProductsEl.textContent = featuredCount;
        
        // Calculate total stock and value
        let totalStock = 0;
        let totalValue = 0;
        let totalPrice = 0;
        let productCount = 0;
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            const stock = parseInt(product.stock || 0);
            const price = parseFloat(product.price || 0);
            totalStock += stock;
            totalValue += price * stock;
            totalPrice += price;
            productCount++;
        });
        
        const totalStockEl = document.getElementById('totalStock');
        const totalValueEl = document.getElementById('totalValue');
        if (totalStockEl) totalStockEl.textContent = totalStock.toLocaleString();
        if (totalValueEl) totalValueEl.textContent = `$${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    });
    
    // Load brands count
    db.collection('brands').onSnapshot((snapshot) => {
        const totalBrandsEl = document.getElementById('totalBrands');
        if (totalBrandsEl) totalBrandsEl.textContent = snapshot.size;
    });
    
    // Load flavours count
    db.collection('flavours').onSnapshot((snapshot) => {
        const totalFlavoursEl = document.getElementById('totalFlavours');
        if (totalFlavoursEl) totalFlavoursEl.textContent = snapshot.size;
    });
}

// Load live visitors count
function loadLiveVisitors() {
    const SESSION_TIMEOUT = 90000; // 90 seconds - visitors considered inactive after this
    
    // Real-time listener for active visitors
    db.collection('activeVisitors').onSnapshot((snapshot) => {
        const now = firebase.firestore.Timestamp.now();
        let activeCount = 0;
        
        snapshot.forEach((doc) => {
            const visitorData = doc.data();
            if (visitorData.lastActive) {
                try {
                    // Get timestamp (handle both Firestore Timestamp and serverTimestamp)
                    let lastActiveTime;
                    if (visitorData.lastActive.toDate) {
                        lastActiveTime = visitorData.lastActive.toDate();
                    } else if (visitorData.lastActive.seconds) {
                        lastActiveTime = new Date(visitorData.lastActive.seconds * 1000);
                    } else {
                        lastActiveTime = new Date(visitorData.lastActive);
                    }
                    
                    const timeSinceLastActive = now.toDate().getTime() - lastActiveTime.getTime();
                    
                    // Count as active if updated within timeout period
                    if (timeSinceLastActive < SESSION_TIMEOUT) {
                        activeCount++;
                    }
                } catch (error) {
                    // If timestamp parsing fails, count as active (safer)
                    activeCount++;
                }
            } else {
                // If no timestamp, count as active (new visitor)
                activeCount++;
            }
        });
        
        // Update the display
        const liveVisitorsElement = document.getElementById('liveVisitors');
        const liveVisitorsCard = document.getElementById('liveVisitorsCard');
        if (liveVisitorsElement) {
            liveVisitorsElement.textContent = activeCount;
            
            // Add visual feedback
            if (liveVisitorsCard) {
                if (activeCount > 0) {
                    liveVisitorsCard.classList.add('has-visitors');
                } else {
                    liveVisitorsCard.classList.remove('has-visitors');
                }
            }
        }
    }, (error) => {
        console.error('Error loading live visitors:', error);
        const liveVisitorsElement = document.getElementById('liveVisitors');
        if (liveVisitorsElement) {
            liveVisitorsElement.textContent = '0';
        }
    });
    
    // Periodic cleanup of old inactive visitors
    setInterval(() => {
        const cutoffTime = firebase.firestore.Timestamp.fromDate(new Date(Date.now() - SESSION_TIMEOUT));
        db.collection('activeVisitors')
            .where('lastActive', '<', cutoffTime)
            .get()
            .then(snapshot => {
                if (snapshot.size > 0) {
                    const batch = db.batch();
                    snapshot.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    return batch.commit().then(() => {
                        console.log(`Cleaned up ${snapshot.size} inactive visitors`);
                    });
                }
            })
            .catch(error => {
                console.error('Error cleaning up old visitors:', error);
            });
    }, 120000); // Clean up every 2 minutes
}

// Load inventory statistics
function loadInventoryStats() {
    db.collection('products').onSnapshot((snapshot) => {
        const inventoryStats = document.getElementById('inventoryStats');
        if (snapshot.empty) {
            inventoryStats.innerHTML = '<div class="empty-state-dashboard"><p>No products found</p></div>';
            return;
        }
        
        let inStock = 0;
        let outOfStock = 0;
        let lowStock = 0;
        
        snapshot.forEach((doc) => {
            const stock = parseInt(doc.data().stock || 0);
            if (stock === 0) {
                outOfStock++;
            } else if (stock < 10) {
                lowStock++;
            } else {
                inStock++;
            }
        });
        
        inventoryStats.innerHTML = `
            <div class="inventory-item">
                <span class="inventory-label">In Stock</span>
                <span class="inventory-value" style="color: #4CAF50;">${inStock}</span>
            </div>
            <div class="inventory-item">
                <span class="inventory-label">Low Stock (< 10)</span>
                <span class="inventory-value" style="color: #ff9800;">${lowStock}</span>
            </div>
            <div class="inventory-item">
                <span class="inventory-label">Out of Stock</span>
                <span class="inventory-value" style="color: #f44336;">${outOfStock}</span>
            </div>
        `;
    });
}

// Load low stock items
function loadLowStockItems() {
    db.collection('products').onSnapshot((snapshot) => {
        const lowStockList = document.getElementById('lowStockList');
        const lowStockItems = [];
        
        snapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            const stock = parseInt(product.stock || 0);
            if (stock > 0 && stock < 10) {
                lowStockItems.push({ ...product, stock });
            }
        });
        
        if (lowStockItems.length === 0) {
            lowStockList.innerHTML = '<div class="empty-state-dashboard"><p>✅ All products have sufficient stock!</p></div>';
            return;
        }
        
        // Sort by stock (lowest first)
        lowStockItems.sort((a, b) => a.stock - b.stock);
        
        let html = '';
        lowStockItems.slice(0, 5).forEach(item => {
            html += `
                <div class="low-stock-item">
                    <span class="low-stock-item-name">${item.name || 'Unnamed Product'}</span>
                    <span class="low-stock-item-qty">${item.stock} left</span>
                </div>
            `;
        });
        
        if (lowStockItems.length > 5) {
            html += `<div class="empty-state-dashboard"><p>...and ${lowStockItems.length - 5} more</p></div>`;
        }
        
        lowStockList.innerHTML = html;
    });
}

// Load brand distribution
function loadBrandDistribution() {
    db.collection('products').onSnapshot((snapshot) => {
        const brandChart = document.getElementById('brandChart');
        const brandCounts = {};
        let totalProducts = 0;
        
        snapshot.forEach((doc) => {
            const brand = doc.data().brand;
            if (brand) {
                brandCounts[brand] = (brandCounts[brand] || 0) + 1;
                totalProducts++;
            }
        });
        
        if (totalProducts === 0) {
            brandChart.innerHTML = '<div class="empty-state-dashboard"><p>No products found</p></div>';
            return;
        }
        
        // Sort brands by count
        const sortedBrands = Object.entries(brandCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        let html = '';
        sortedBrands.forEach(([brandName, count]) => {
            const percentage = (count / totalProducts * 100).toFixed(1);
            html += `
                <div class="brand-item">
                    <div class="brand-name-row">
                        <span class="brand-name">${brandName}</span>
                        <span class="brand-count">${count} products</span>
                    </div>
                    <div class="brand-bar">
                        <div class="brand-bar-fill" style="width: ${percentage}%">
                            ${percentage}%
                        </div>
                    </div>
                </div>
            `;
        });
        
        brandChart.innerHTML = html;
    });
}

// Load recent products
function loadRecentProducts() {
    db.collection('products')
        .orderBy('createdAt', 'desc')
        .limit(6)
        .onSnapshot((snapshot) => {
            const recentProducts = document.getElementById('recentProducts');
            
            if (snapshot.empty) {
                recentProducts.innerHTML = '<div class="empty-state-dashboard"><p>No products found</p></div>';
                return;
            }
            
            let html = '';
            snapshot.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() };
                html += `
                    <div class="recent-product-item">
                        <div class="recent-product-name">${product.name || 'Unnamed Product'}</div>
                        <div class="recent-product-info">
                            <span>$${parseFloat(product.price || 0).toFixed(2)}</span>
                            <span>Stock: ${product.stock || 0}</span>
                        </div>
                    </div>
                `;
            });
            
            recentProducts.innerHTML = html;
        });
}

// Calculate total stock value
function calculateStockValue() {
    db.collection('products').onSnapshot((snapshot) => {
        let totalValue = 0;
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            const price = parseFloat(product.price || 0);
            const stock = parseInt(product.stock || 0);
            totalValue += price * stock;
        });
        
        document.getElementById('totalStockValue').textContent = `$${totalValue.toFixed(2)}`;
    });
}

// Setup quick action buttons
function setupQuickActions() {
    const quickActionBtns = document.querySelectorAll('.quick-action-btn[data-section]');
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = btn.getAttribute('data-section');
            
            // Remove active class from all nav items and sections
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked section
            const navItem = document.querySelector(`[data-section="${sectionId}"]`);
            const section = document.getElementById(sectionId);
            
            if (navItem) navItem.classList.add('active');
            if (section) section.classList.add('active');
        });
    });
}

// Initialize stock value calculation
calculateStockValue();

// Load enhanced analytics
function loadEnhancedAnalytics() {
    db.collection('products').onSnapshot((snapshot) => {
        let totalValue = 0;
        let totalPrice = 0;
        let productsWithStock = 0;
        let productCount = 0;
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            const price = parseFloat(product.price || 0);
            const stock = parseInt(product.stock || 0);
            totalValue += price * stock;
            totalPrice += price;
            productCount++;
            if (stock > 0) productsWithStock++;
        });
        
        const averagePrice = productCount > 0 ? totalPrice / productCount : 0;
        const avgPriceEl = document.getElementById('averagePrice');
        const totalValueEl = document.getElementById('totalValue');
        const productsWithStockEl = document.getElementById('productsWithStock');
        
        if (avgPriceEl) avgPriceEl.textContent = `$${averagePrice.toFixed(2)}`;
        if (totalValueEl) totalValueEl.textContent = `$${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if (productsWithStockEl) productsWithStockEl.textContent = productsWithStock;
    });
    
    // Count unique flavors
    db.collection('flavours').onSnapshot((snapshot) => {
        const totalFlavorsEl = document.getElementById('totalFlavorsCount');
        if (totalFlavorsEl) totalFlavorsEl.textContent = snapshot.size;
    });
}

// Load product status breakdown
function loadStatusBreakdown() {
    const statusBreakdown = document.getElementById('statusBreakdown');
    if (!statusBreakdown) return;
    
    db.collection('products').onSnapshot((snapshot) => {
        if (snapshot.empty) {
            statusBreakdown.innerHTML = '<div class="empty-state-dashboard"><p>No products found</p></div>';
            return;
        }
        
        let available = 0;
        let outOfStock = 0;
        let comingSoon = 0;
        let total = snapshot.size;
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            const status = product.status || (product.stock > 0 ? 'Available' : 'Out of Stock');
            if (status === 'Available') {
                available++;
            } else if (status === 'Out of Stock') {
                outOfStock++;
            } else if (status === 'Coming Soon') {
                comingSoon++;
            }
        });
        
        const availablePercent = total > 0 ? (available / total * 100).toFixed(1) : 0;
        const outOfStockPercent = total > 0 ? (outOfStock / total * 100).toFixed(1) : 0;
        const comingSoonPercent = total > 0 ? (comingSoon / total * 100).toFixed(1) : 0;
        
        statusBreakdown.innerHTML = `
            <div class="status-item">
                <div class="status-item-header">
                    <span class="status-label">Available</span>
                    <span class="status-count">${available} (${availablePercent}%)</span>
                </div>
                <div class="status-bar">
                    <div class="status-bar-fill status-available" style="width: ${availablePercent}%"></div>
                </div>
            </div>
            <div class="status-item">
                <div class="status-item-header">
                    <span class="status-label">Out of Stock</span>
                    <span class="status-count">${outOfStock} (${outOfStockPercent}%)</span>
                </div>
                <div class="status-bar">
                    <div class="status-bar-fill status-out-of-stock" style="width: ${outOfStockPercent}%"></div>
                </div>
            </div>
            <div class="status-item">
                <div class="status-item-header">
                    <span class="status-label">Coming Soon</span>
                    <span class="status-count">${comingSoon} (${comingSoonPercent}%)</span>
                </div>
                <div class="status-bar">
                    <div class="status-bar-fill status-coming-soon" style="width: ${comingSoonPercent}%"></div>
                </div>
            </div>
        `;
    });
}

// Load price range analysis
function loadPriceRangeAnalysis() {
    const priceRange = document.getElementById('priceRange');
    if (!priceRange) return;
    
    db.collection('products').onSnapshot((snapshot) => {
        if (snapshot.empty) {
            priceRange.innerHTML = '<div class="empty-state-dashboard"><p>No products found</p></div>';
            return;
        }
        
        let prices = [];
        snapshot.forEach((doc) => {
            const price = parseFloat(doc.data().price || 0);
            if (price > 0) prices.push(price);
        });
        
        if (prices.length === 0) {
            priceRange.innerHTML = '<div class="empty-state-dashboard"><p>No price data available</p></div>';
            return;
        }
        
        prices.sort((a, b) => a - b);
        const minPrice = prices[0];
        const maxPrice = prices[prices.length - 1];
        const medianPrice = prices[Math.floor(prices.length / 2)];
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        // Categorize by price ranges
        let lowRange = 0; // $0-10
        let midRange = 0; // $10-30
        let highRange = 0; // $30+
        
        prices.forEach(price => {
            if (price <= 10) lowRange++;
            else if (price <= 30) midRange++;
            else highRange++;
        });
        
        const total = prices.length;
        const lowPercent = (lowRange / total * 100).toFixed(1);
        const midPercent = (midRange / total * 100).toFixed(1);
        const highPercent = (highRange / total * 100).toFixed(1);
        
        priceRange.innerHTML = `
            <div class="price-stats">
                <div class="price-stat-item">
                    <span class="price-stat-label">Min</span>
                    <span class="price-stat-value">$${minPrice.toFixed(2)}</span>
                </div>
                <div class="price-stat-item">
                    <span class="price-stat-label">Max</span>
                    <span class="price-stat-value">$${maxPrice.toFixed(2)}</span>
                </div>
                <div class="price-stat-item">
                    <span class="price-stat-label">Avg</span>
                    <span class="price-stat-value">$${avgPrice.toFixed(2)}</span>
                </div>
                <div class="price-stat-item">
                    <span class="price-stat-label">Median</span>
                    <span class="price-stat-value">$${medianPrice.toFixed(2)}</span>
                </div>
            </div>
            <div class="price-range-bars">
                <div class="price-range-item">
                    <div class="price-range-header">
                        <span>$0 - $10</span>
                        <span>${lowRange} (${lowPercent}%)</span>
                    </div>
                    <div class="price-range-bar">
                        <div class="price-range-fill" style="width: ${lowPercent}%; background: #4CAF50;"></div>
                    </div>
                </div>
                <div class="price-range-item">
                    <div class="price-range-header">
                        <span>$10 - $30</span>
                        <span>${midRange} (${midPercent}%)</span>
                    </div>
                    <div class="price-range-bar">
                        <div class="price-range-fill" style="width: ${midPercent}%; background: #FF9800;"></div>
                    </div>
                </div>
                <div class="price-range-item">
                    <div class="price-range-header">
                        <span>$30+</span>
                        <span>${highRange} (${highPercent}%)</span>
                    </div>
                    <div class="price-range-bar">
                        <div class="price-range-fill" style="width: ${highPercent}%; background: #2196F3;"></div>
                    </div>
                </div>
            </div>
        `;
    });
}

// Load top products by stock value
function loadTopProducts() {
    const topProducts = document.getElementById('topProducts');
    if (!topProducts) return;
    
    db.collection('products').onSnapshot((snapshot) => {
        if (snapshot.empty) {
            topProducts.innerHTML = '<div class="empty-state-dashboard"><p>No products found</p></div>';
            return;
        }
        
        const products = [];
        snapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            const price = parseFloat(product.price || 0);
            const stock = parseInt(product.stock || 0);
            const value = price * stock;
            products.push({ ...product, value, price, stock });
        });
        
        // Sort by value (highest first)
        products.sort((a, b) => b.value - a.value);
        const top5 = products.slice(0, 5);
        
        if (top5.length === 0) {
            topProducts.innerHTML = '<div class="empty-state-dashboard"><p>No products with stock value</p></div>';
            return;
        }
        
        let html = '<div class="top-products-list">';
        top5.forEach((product, index) => {
            const imgUrl = window.getImageUrl ? window.getImageUrl(product.image, 'product', product.brand, product.name) : (product.image || '');
            html += `
                <div class="top-product-item">
                    <div class="top-product-rank">#${index + 1}</div>
                    <div class="top-product-image">
                        ${imgUrl ? `<img src="${imgUrl}" alt="${product.name}" onerror="this.style.display='none'">` : '<div class="no-image">📦</div>'}
                    </div>
                    <div class="top-product-info">
                        <div class="top-product-name">${product.name || 'Unnamed Product'}</div>
                        <div class="top-product-details">
                            <span>Stock: ${product.stock}</span>
                            <span>Price: $${product.price.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="top-product-value">
                        <div class="value-amount">$${product.value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div class="value-label">Total Value</div>
                    </div>
                    <button class="btn-edit-product" onclick="editProduct('${product.id}')" title="Edit Product">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';
        
        topProducts.innerHTML = html;
    });
}

// Load flavor distribution
function loadFlavorDistribution() {
    const flavorChart = document.getElementById('flavorChart');
    if (!flavorChart) return;
    
    db.collection('products').onSnapshot((snapshot) => {
        const flavorCounts = {};
        let totalProducts = 0;
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            const flavours = Array.isArray(product.flavour) ? product.flavour : (product.flavour ? [product.flavour] : []);
            flavours.forEach(flavor => {
                const flavorName = typeof flavor === 'string' ? flavor : (flavor.name || flavor);
                if (flavorName) {
                    flavorCounts[flavorName] = (flavorCounts[flavorName] || 0) + 1;
                }
            });
            if (flavours.length > 0) totalProducts++;
        });
        
        if (Object.keys(flavorCounts).length === 0) {
            flavorChart.innerHTML = '<div class="empty-state-dashboard"><p>No flavors found</p></div>';
            return;
        }
        
        // Sort flavors by count
        const sortedFlavors = Object.entries(flavorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        let html = '';
        sortedFlavors.forEach(([flavorName, count]) => {
            const percentage = totalProducts > 0 ? (count / totalProducts * 100).toFixed(1) : 0;
            html += `
                <div class="flavor-item">
                    <div class="flavor-name-row">
                        <span class="flavor-name">${flavorName}</span>
                        <span class="flavor-count">${count} products</span>
                    </div>
                    <div class="flavor-bar">
                        <div class="flavor-bar-fill" style="width: ${percentage}%">
                            ${percentage}%
                        </div>
                    </div>
                </div>
            `;
        });
        
        flavorChart.innerHTML = html;
    });
}

// Dashboard Chart Instances
let statusChartInstance = null;
let brandChartInstance = null;
let priceChartInstance = null;

// Load Status Chart (Pie Chart)
function loadStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    db.collection('products').onSnapshot((snapshot) => {
        let available = 0;
        let outOfStock = 0;
        let comingSoon = 0;
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            const status = product.status || (product.stock > 0 ? 'Available' : 'Out of Stock');
            if (status === 'Available') available++;
            else if (status === 'Out of Stock') outOfStock++;
            else if (status === 'Coming Soon') comingSoon++;
        });
        
        if (statusChartInstance) {
            statusChartInstance.destroy();
        }
        
        statusChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Available', 'Out of Stock', 'Coming Soon'],
                datasets: [{
                    data: [available, outOfStock, comingSoon],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(244, 67, 54, 0.8)',
                        'rgba(255, 152, 0, 0.8)'
                    ],
                    borderColor: [
                        'rgba(76, 175, 80, 1)',
                        'rgba(244, 67, 54, 1)',
                        'rgba(255, 152, 0, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    });
}

// Load Brand Distribution Chart (Bar Chart)
function loadBrandChart() {
    const ctx = document.getElementById('brandChart');
    if (!ctx) return;
    
    db.collection('products').onSnapshot((snapshot) => {
        const brandCounts = {};
        
        snapshot.forEach((doc) => {
            const brand = doc.data().brand;
            if (brand) {
                brandCounts[brand] = (brandCounts[brand] || 0) + 1;
            }
        });
        
        const sortedBrands = Object.entries(brandCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        if (brandChartInstance) {
            brandChartInstance.destroy();
        }
        
        brandChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedBrands.map(([brand]) => brand),
                datasets: [{
                    label: 'Products',
                    data: sortedBrands.map(([, count]) => count),
                    backgroundColor: 'rgba(14, 165, 233, 0.8)',
                    borderColor: 'rgba(14, 165, 233, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    });
}

// Load Price Analysis Chart
function loadPriceChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;
    
    db.collection('products').onSnapshot((snapshot) => {
        let prices = [];
        snapshot.forEach((doc) => {
            const price = parseFloat(doc.data().price || 0);
            if (price > 0) prices.push(price);
        });
        
        let lowRange = 0;
        let midRange = 0;
        let highRange = 0;
        
        prices.forEach(price => {
            if (price <= 10) lowRange++;
            else if (price <= 30) midRange++;
            else highRange++;
        });
        
        if (priceChartInstance) {
            priceChartInstance.destroy();
        }
        
        priceChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['$0 - $10', '$10 - $30', '$30+'],
                datasets: [{
                    data: [lowRange, midRange, highRange],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(255, 152, 0, 0.8)',
                        'rgba(33, 150, 243, 0.8)'
                    ],
                    borderColor: [
                        'rgba(76, 175, 80, 1)',
                        'rgba(255, 152, 0, 1)',
                        'rgba(33, 150, 243, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    });
}

// Load Inventory Health
function loadInventoryHealth() {
    const inventoryHealth = document.getElementById('inventoryHealth');
    if (!inventoryHealth) return;
    
    db.collection('products').onSnapshot((snapshot) => {
        let inStock = 0;
        let lowStock = 0;
        let outOfStock = 0;
        let total = snapshot.size;
        
        snapshot.forEach((doc) => {
            const stock = parseInt(doc.data().stock || 0);
            if (stock === 0) outOfStock++;
            else if (stock < 10) lowStock++;
            else inStock++;
        });
        
        const inStockPercent = total > 0 ? (inStock / total * 100).toFixed(1) : 0;
        const lowStockPercent = total > 0 ? (lowStock / total * 100).toFixed(1) : 0;
        const outOfStockPercent = total > 0 ? (outOfStock / total * 100).toFixed(1) : 0;
        
        inventoryHealth.innerHTML = `
            <div class="health-item">
                <div class="health-label-row">
                    <span class="health-label">In Stock</span>
                    <span class="health-value">${inStock} (${inStockPercent}%)</span>
                </div>
                <div class="health-bar">
                    <div class="health-bar-fill health-good" style="width: ${inStockPercent}%"></div>
                </div>
            </div>
            <div class="health-item">
                <div class="health-label-row">
                    <span class="health-label">Low Stock</span>
                    <span class="health-value">${lowStock} (${lowStockPercent}%)</span>
                </div>
                <div class="health-bar">
                    <div class="health-bar-fill health-warning" style="width: ${lowStockPercent}%"></div>
                </div>
            </div>
            <div class="health-item">
                <div class="health-label-row">
                    <span class="health-label">Out of Stock</span>
                    <span class="health-value">${outOfStock} (${outOfStockPercent}%)</span>
                </div>
                <div class="health-bar">
                    <div class="health-bar-fill health-danger" style="width: ${outOfStockPercent}%"></div>
                </div>
            </div>
        `;
    });
}

// Load Top Products Table
function loadTopProductsTable() {
    const topProductsTable = document.getElementById('topProductsTable');
    if (!topProductsTable) return;
    
    db.collection('products').onSnapshot((snapshot) => {
        const products = [];
        snapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            const price = parseFloat(product.price || 0);
            const stock = parseInt(product.stock || 0);
            const value = price * stock;
            products.push({ ...product, value, price, stock });
        });
        
        products.sort((a, b) => b.value - a.value);
        const top5 = products.slice(0, 5);
        
        if (top5.length === 0) {
            topProductsTable.innerHTML = '<div class="empty-state">No products found</div>';
            return;
        }
        
        let html = '<div class="data-table">';
        top5.forEach((product, index) => {
            html += `
                <div class="table-row">
                    <div class="table-cell rank" data-label="Rank">#${index + 1}</div>
                    <div class="table-cell name" data-label="Product">${product.name || 'Unnamed Product'}</div>
                    <div class="table-cell stock" data-label="Stock">${product.stock} units</div>
                    <div class="table-cell price" data-label="Price">$${product.price.toFixed(2)}</div>
                    <div class="table-cell value" data-label="Value">$${product.value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div class="table-cell action" data-label="Action">
                        <button class="btn-table-action" onclick="editProduct('${product.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        topProductsTable.innerHTML = html;
    });
}

// Load Low Stock Table
function loadLowStockTable() {
    const lowStockTable = document.getElementById('lowStockTable');
    const lowStockCount = document.getElementById('lowStockCount');
    if (!lowStockTable) return;
    
    db.collection('products').onSnapshot((snapshot) => {
        const lowStockItems = [];
        
        snapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            const stock = parseInt(product.stock || 0);
            if (stock > 0 && stock < 10) {
                lowStockItems.push({ ...product, stock });
            }
        });
        
        if (lowStockCount) lowStockCount.textContent = lowStockItems.length;
        
        if (lowStockItems.length === 0) {
            lowStockTable.innerHTML = '<div class="empty-state success">✅ All products have sufficient stock!</div>';
            return;
        }
        
        lowStockItems.sort((a, b) => a.stock - b.stock);
        const top10 = lowStockItems.slice(0, 10);
        
        let html = '<div class="data-table">';
        top10.forEach((item) => {
            html += `
                <div class="table-row warning-row">
                    <div class="table-cell name" data-label="Product">${item.name || 'Unnamed Product'}</div>
                    <div class="table-cell stock urgent" data-label="Stock">${item.stock} left</div>
                    <div class="table-cell price" data-label="Price">$${parseFloat(item.price || 0).toFixed(2)}</div>
                    <div class="table-cell action" data-label="Action">
                        <button class="btn-table-action" onclick="editProduct('${item.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        lowStockTable.innerHTML = html;
    });
}

// Export dashboard data
function exportDashboardData() {
    Promise.all([
        db.collection('products').get(),
        db.collection('brands').get(),
        db.collection('flavours').get()
    ]).then(([productsSnapshot, brandsSnapshot, flavoursSnapshot]) => {
        const data = {
            exportDate: new Date().toISOString(),
            products: [],
            brands: [],
            flavours: []
        };
        
        productsSnapshot.forEach(doc => {
            data.products.push({ id: doc.id, ...doc.data() });
        });
        
        brandsSnapshot.forEach(doc => {
            data.brands.push({ id: doc.id, ...doc.data() });
        });
        
        flavoursSnapshot.forEach(doc => {
            data.flavours.push({ id: doc.id, ...doc.data() });
        });
        
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        const statusDiv = document.createElement('div');
        statusDiv.className = 'status-message success';
        statusDiv.textContent = '✅ Dashboard data exported successfully!';
        statusDiv.style.position = 'fixed';
        statusDiv.style.top = '20px';
        statusDiv.style.right = '20px';
        statusDiv.style.zIndex = '10000';
        document.body.appendChild(statusDiv);
        setTimeout(() => statusDiv.remove(), 3000);
    }).catch(error => {
        console.error('Error exporting data:', error);
        alert('Error exporting data: ' + error.message);
    });
}

// Setup flavour selector with add/remove functionality
function setupFlavourSelector() {
    const addFlavourBtn = document.getElementById('addFlavourBtn');
    const flavourInput = document.getElementById('flavourInput');
    const flavourDropdown = document.getElementById('flavourSelectDropdown');
    const selectedFlavoursList = document.getElementById('selectedFlavoursList');
    
    if (!addFlavourBtn || !selectedFlavoursList) {
        console.warn('Flavour selector elements not found');
        return;
    }
    
    // Initialize selected flavours array
    let selectedFlavours = [];
    
    // Function to render selected flavours
    function renderSelectedFlavours() {
        selectedFlavoursList.innerHTML = '';
        
        if (selectedFlavours.length === 0) {
            selectedFlavoursList.innerHTML = '<p class="no-flavors-placeholder" id="noFlavoursMessage"><i class="fas fa-palette"></i> No flavors added yet. Add flavors above.</p>';
            return;
        }
        
        selectedFlavours.forEach((flavour, index) => {
            const flavourChip = document.createElement('div');
            flavourChip.className = 'flavour-chip';
            flavourChip.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: 500;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;
            
            flavourChip.innerHTML = `
                <span>🍬 ${flavour}</span>
                <button type="button" onclick="removeFlavourFromList(${index})" style="
                    background: rgba(255,255,255,0.3);
                    border: none;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: bold;
                    padding: 0;
                    line-height: 1;
                    transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.5)'" onmouseout="this.style.background='rgba(255,255,255,0.3)'">×</button>
            `;
            
            selectedFlavoursList.appendChild(flavourChip);
        });
    }
    
    // Add flavour function - Brand-Specific Validation
    window.addFlavour = async function() {
        const productBrand = document.getElementById('productBrand')?.value || '';
        
        if (!productBrand) {
            alert('Please select a brand first. Flavors are brand-specific.');
            return;
        }
        
        let flavourName = '';
        
        // Check dropdown first, then input field
        if (flavourDropdown && flavourDropdown.value) {
            flavourName = flavourDropdown.value.trim();
        } else if (flavourInput && flavourInput.value.trim()) {
            flavourName = flavourInput.value.trim();
        }
        
        if (!flavourName) {
            alert('Please enter or select a flavor name');
            return;
        }
        
        // Check if already added
        if (selectedFlavours.includes(flavourName)) {
            alert('This flavor is already added');
            return;
        }
        
        // Validate that flavor exists for the selected brand (if from dropdown, it's already validated)
        if (flavourInput && flavourInput.value.trim() && (!flavourDropdown || !flavourDropdown.value)) {
            // Custom flavor name entered - check if it exists for this brand
            try {
                const flavorCheck = await db.collection('flavours')
                    .where('brand', '==', productBrand)
                    .where('name', '==', flavourName)
                    .limit(1)
                    .get();
                
                if (flavorCheck.empty) {
                    const createFlavor = confirm(`Flavor "${flavourName}" does not exist for brand "${productBrand}". Would you like to create it now?`);
                    if (createFlavor) {
                        // Prompt user for flavor ID - no auto-generation
                        const flavorId = prompt(`Please enter a Flavor ID for "${flavourName}":`);
                        if (!flavorId || flavorId.trim() === '') {
                            alert('Flavor ID is required. Flavor creation cancelled.');
                            return;
                        }
                        
                        // Allow duplicate IDs if manually entered - user's choice
                        await db.collection('flavours').add({
                            name: flavourName,
                            brand: productBrand,
                            flavorId: flavorId.trim(),
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        
                        // Update dropdown to include new flavor
                        updateFlavorDropdown();
                        
                        alert(`Flavor "${flavourName}" created successfully for brand "${productBrand}"!`);
                    } else {
                        return; // User cancelled
                    }
                }
            } catch (error) {
                console.error('Error checking flavor:', error);
                alert('Error validating flavor. Please try again.');
                return;
            }
        }
        
        // Add to selected flavours
        selectedFlavours.push(flavourName);
        
        // Clear inputs
        if (flavourInput) flavourInput.value = '';
        if (flavourDropdown) flavourDropdown.value = '';
        
        // Render updated list
        renderSelectedFlavours();
    };
    
    // Remove flavour function
    window.removeFlavourFromList = function(index) {
        if (index >= 0 && index < selectedFlavours.length) {
            selectedFlavours.splice(index, 1);
            renderSelectedFlavours();
        }
    };
    
    // Setup button click
    addFlavourBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.addFlavour();
    });
    
    // Setup Enter key on input
    if (flavourInput) {
        flavourInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.addFlavour();
            }
        });
    }
    
    // Don't auto-add on dropdown change - let user click button
    // Dropdown is just for selecting, button adds it
    
    // Make selectedFlavours accessible for form submission
    window.getSelectedFlavours = function() {
        return selectedFlavours;
    };
    
    // Function to set selected flavours (for editing)
    window.setSelectedFlavours = function(flavours) {
        if (flavours) {
            selectedFlavours = Array.isArray(flavours) ? [...flavours] : (typeof flavours === 'string' ? [flavours] : []);
        } else {
            selectedFlavours = [];
        }
        renderSelectedFlavours();
    };
    
    // Clear flavours function
    window.clearSelectedFlavours = function() {
        selectedFlavours = [];
        renderSelectedFlavours();
    };
    
    // Initial render
    renderSelectedFlavours();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Database Upload Functions
async function handleDatabaseUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('databaseFile');
    const file = fileInput.files[0];
    const statusDiv = document.getElementById('uploadStatus');
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');
    const progressDetails = document.getElementById('progressDetails');
    const uploadBtn = document.querySelector('#databaseUploadForm button[type="submit"]');
    
    if (!file) {
        statusDiv.textContent = 'Please select a file to upload';
        statusDiv.className = 'status-message error';
        statusDiv.style.display = 'block';
        return;
    }
    
    const importProducts = document.getElementById('importProducts').checked;
    const importBrands = document.getElementById('importBrands').checked;
    const importFlavours = document.getElementById('importFlavours').checked;
    
    if (!importProducts && !importBrands && !importFlavours) {
        statusDiv.textContent = 'Please select at least one collection to import';
        statusDiv.className = 'status-message error';
        statusDiv.style.display = 'block';
        return;
    }
    
    try {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '⏳ Uploading...';
        progressDiv.style.display = 'block';
        statusDiv.style.display = 'none';
        
        progressBar.style.width = '10%';
        progressPercent.textContent = '10%';
        progressText.textContent = 'Reading Excel file...';
        
        // Check file type
        const fileName = file.name.toLowerCase();
        const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
        
        let data;
        if (isExcel) {
            // Parse Excel file
            progressBar.style.width = '20%';
            progressPercent.textContent = '20%';
            progressText.textContent = 'Parsing Excel file...';
            try {
                data = await parseExcelToJSON(file);
                
                // Validate that we got data
                if (!data || (!data.products || data.products.length === 0) && 
                    (!data.brands || data.brands.length === 0) && 
                    (!data.flavours || data.flavours.length === 0)) {
                    throw new Error('No data found in Excel file. Please check that your sheets are named correctly (products, brands, flavours) and contain data rows.');
                }
            } catch (error) {
                throw new Error('Failed to parse Excel file: ' + error.message + '. Please ensure your file is a valid .xlsx format and has the correct sheet structure.');
            }
        } else {
            // Fallback to CSV for backwards compatibility
            progressBar.style.width = '15%';
            progressPercent.textContent = '15%';
            progressText.textContent = 'Reading CSV file...';
            const fileContent = await readFileAsText(file);
            
            progressBar.style.width = '20%';
            progressPercent.textContent = '20%';
            progressText.textContent = 'Parsing CSV...';
            data = parseCSVToJSON(fileContent);
        }
        
        progressBar.style.width = '30%';
        progressPercent.textContent = '30%';
        progressText.textContent = 'Starting import...';
        
        let importedCount = {
            products: 0,
            brands: 0,
            flavours: 0
        };
        let skippedCount = {
            products: 0,
            brands: 0,
            flavours: 0
        };
        let errorCount = {
            products: 0,
            brands: 0,
            flavours: 0
        };
        
        const totalCollections = (importProducts ? 1 : 0) + (importBrands ? 1 : 0) + (importFlavours ? 1 : 0);
        let completedCollections = 0;
        const errorDetails = {
            products: [],
            brands: [],
            flavours: []
        };
        
        // Import Products (with auto-create brands and flavours)
        if (importProducts && data.products && Array.isArray(data.products) && data.products.length > 0) {
            progressText.textContent = 'Checking duplicates and creating brands/flavours...';
            
            // First, ensure all brands and flavours referenced in products exist
            // This also checks for duplicates in file and system, and allocates flavours to existing products
            const productsToSkip = await ensureBrandsAndFlavoursExist(data.products);
            
            progressText.textContent = 'Importing products...';
            
            const result = await importCollection('products', data.products, productsToSkip, (current, total) => {
                const progress = 30 + (40 * completedCollections / totalCollections) + (40 / totalCollections) * (current / total);
                progressBar.style.width = progress + '%';
                progressPercent.textContent = Math.round(progress) + '%';
                progressDetails.textContent = `Products: ${current}/${total} processed`;
            });
            importedCount.products = result.imported;
            skippedCount.products = result.skipped;
            errorCount.products = result.errors;
            if (result.errorDetails && result.errorDetails.length > 0) {
                errorDetails.products = result.errorDetails;
                console.error('Product import errors:', result.errorDetails);
            }
            completedCollections++;
        }
        
        // Import Brands
        if (importBrands && data.brands && Array.isArray(data.brands) && data.brands.length > 0) {
            progressText.textContent = 'Importing brands...';
            const result = await importCollection('brands', data.brands, null, (current, total) => {
                const progress = 30 + (40 * completedCollections / totalCollections) + (40 / totalCollections) * (current / total);
                progressBar.style.width = progress + '%';
                progressPercent.textContent = Math.round(progress) + '%';
                progressDetails.textContent = `Brands: ${current}/${total} processed`;
            });
            importedCount.brands = result.imported;
            skippedCount.brands = result.skipped;
            errorCount.brands = result.errors;
            if (result.errorDetails && result.errorDetails.length > 0) {
                errorDetails.brands = result.errorDetails;
                console.error('Brand import errors:', result.errorDetails);
            }
            completedCollections++;
        }
        
        // Import Flavours
        if (importFlavours && data.flavours && Array.isArray(data.flavours) && data.flavours.length > 0) {
            progressText.textContent = 'Importing flavours...';
            const result = await importCollection('flavours', data.flavours, null, (current, total) => {
                const progress = 30 + (40 * completedCollections / totalCollections) + (40 / totalCollections) * (current / total);
                progressBar.style.width = progress + '%';
                progressPercent.textContent = Math.round(progress) + '%';
                progressDetails.textContent = `Flavours: ${current}/${total} processed`;
            });
            importedCount.flavours = result.imported;
            skippedCount.flavours = result.skipped;
            errorCount.flavours = result.errors;
            if (result.errorDetails && result.errorDetails.length > 0) {
                errorDetails.flavours = result.errorDetails;
                console.error('Flavour import errors:', result.errorDetails);
            }
            completedCollections++;
        }
        
        // Complete
        progressBar.style.width = '100%';
        progressPercent.textContent = '100%';
        progressText.textContent = 'Import completed!';
        
        // Show summary
        const summary = [];
        if (importProducts) {
            let productSummary = `Products: ${importedCount.products} imported, ${skippedCount.products} skipped, ${errorCount.products} errors`;
            if (errorDetails.products && errorDetails.products.length > 0) {
                productSummary += `<br><small style="color: #f44336;">Errors: ${errorDetails.products.slice(0, 3).join('; ')}${errorDetails.products.length > 3 ? '...' : ''}</small>`;
            }
            summary.push(productSummary);
        }
        if (importBrands) {
            let brandSummary = `Brands: ${importedCount.brands} imported, ${skippedCount.brands} skipped, ${errorCount.brands} errors`;
            if (errorDetails.brands && errorDetails.brands.length > 0) {
                brandSummary += `<br><small style="color: #f44336;">Errors: ${errorDetails.brands.slice(0, 3).join('; ')}${errorDetails.brands.length > 3 ? '...' : ''}</small>`;
            }
            summary.push(brandSummary);
        }
        if (importFlavours) {
            let flavourSummary = `Flavours: ${importedCount.flavours} imported, ${skippedCount.flavours} skipped, ${errorCount.flavours} errors`;
            if (errorDetails.flavours && errorDetails.flavours.length > 0) {
                flavourSummary += `<br><small style="color: #f44336;">Errors: ${errorDetails.flavours.slice(0, 3).join('; ')}${errorDetails.flavours.length > 3 ? '...' : ''}</small>`;
            }
            summary.push(flavourSummary);
        }
        
        progressDetails.innerHTML = '<strong>Import Summary:</strong><br>' + summary.join('<br>');
        
        statusDiv.textContent = 'Database uploaded successfully!';
        statusDiv.className = 'status-message success';
        statusDiv.style.display = 'block';
        
        // Refresh admin lists to show newly imported data
        // Note: The onSnapshot listeners should automatically refresh, but we trigger a manual refresh
        // to ensure the UI updates immediately after import
        try {
            // Force a refresh by triggering the snapshot listeners
            // The onSnapshot listeners in loadExistingData() will automatically update the UI
            // But we can also manually trigger a refresh if needed
            
            // For brands - the onSnapshot listener should handle it, but we can manually refresh
            if (importBrands || importProducts) {
                // Trigger a query to force snapshot update
                const brandsQuery = await db.collection('brands').limit(1).get();
                // The onSnapshot listener will handle the full refresh
                console.log('Brands import completed - UI should auto-refresh via onSnapshot');
            }
            
            // For flavours - the onSnapshot listener should handle it
            if (importFlavours || importProducts) {
                // Trigger a query to force snapshot update
                const flavoursQuery = await db.collection('flavours').limit(1).get();
                // The onSnapshot listener will handle the full refresh
                console.log('Flavours import completed - UI should auto-refresh via onSnapshot');
            }
            
            // For products - the onSnapshot listener should handle it
            if (importProducts) {
                // Trigger a query to force snapshot update
                const productsQuery = await db.collection('products').limit(1).get();
                // The onSnapshot listener will handle the full refresh
                console.log('Products import completed - UI should auto-refresh via onSnapshot');
            }
        } catch (refreshError) {
            console.error('Error refreshing admin lists after import:', refreshError);
            // Don't fail the import if refresh fails - onSnapshot listeners should still work
        }
        
        // Reset form after 5 seconds
        setTimeout(() => {
            document.getElementById('databaseUploadForm').reset();
            progressDiv.style.display = 'none';
            statusDiv.style.display = 'none';
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '📤 Upload & Import Excel File';
        }, 5000);
        
    } catch (error) {
        console.error('Error uploading database:', error);
        statusDiv.textContent = 'Error uploading database: ' + error.message;
        statusDiv.className = 'status-message error';
        statusDiv.style.display = 'block';
        progressDiv.style.display = 'none';
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '📤 Upload & Import Excel File';
    }
}

// Parse Excel file to JSON
async function parseExcelToJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const result = {
                    products: [],
                    brands: [],
                    flavours: []
                };
                
                // Process each sheet
                const foundSheets = [];
                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { 
                        raw: false, // Convert all values to strings/numbers properly
                        defval: '', // Default value for empty cells
                        blankrows: false // Skip blank rows
                    });
                    
                    // Map sheet name to collection (case-insensitive)
                    const normalizedSheetName = sheetName.toLowerCase().trim();
                    
                    if (normalizedSheetName === 'products' || normalizedSheetName === 'product') {
                        const cleanedProducts = jsonData.map(row => cleanExcelRow(row, 'products')).filter(row => row && Object.keys(row).length > 0);
                        result.products = result.products.concat(cleanedProducts);
                        foundSheets.push(`products (${cleanedProducts.length} rows)`);
                    } else if (normalizedSheetName === 'brands' || normalizedSheetName === 'brand') {
                        const cleanedBrands = jsonData.map(row => cleanExcelRow(row, 'brands')).filter(row => row && Object.keys(row).length > 0);
                        result.brands = result.brands.concat(cleanedBrands);
                        foundSheets.push(`brands (${cleanedBrands.length} rows)`);
                    } else if (normalizedSheetName === 'flavours' || normalizedSheetName === 'flavors' || normalizedSheetName === 'flavour' || normalizedSheetName === 'flavor') {
                        const cleanedFlavours = jsonData.map(row => cleanExcelRow(row, 'flavours')).filter(row => row && Object.keys(row).length > 0);
                        result.flavours = result.flavours.concat(cleanedFlavours);
                        foundSheets.push(`flavours (${cleanedFlavours.length} rows)`);
                    } else {
                        // Unknown sheet - log but don't error
                        console.warn(`Sheet "${sheetName}" was not recognized. Expected sheet names: products, brands, or flavours`);
                    }
                });
                
                // Log what was found for debugging
                console.log('Excel Import Summary:', {
                    totalSheets: workbook.SheetNames.length,
                    sheetNames: workbook.SheetNames,
                    foundSheets: foundSheets,
                    productsFound: result.products.length,
                    brandsFound: result.brands.length,
                    flavoursFound: result.flavours.length
                });
                
                resolve(result);
            } catch (error) {
                reject(new Error('Error parsing Excel file: ' + error.message));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Error reading Excel file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// Clean and convert Excel row data
function cleanExcelRow(row, collectionType) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(row)) {
        // Clean header name (remove extra spaces, normalize)
        const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
        
        if (value === null || value === undefined || value === '') {
            // Skip empty values (except for ID fields)
            if (cleanKey === 'id' || cleanKey === 'flavorid' || cleanKey === 'flavourid') {
                cleaned[cleanKey === 'flavorid' || cleanKey === 'flavourid' ? 'flavorId' : 'id'] = value || '';
            }
            continue;
        }
        
        // Convert value based on type
        let cleanedValue = value;
        
        // Try to parse as number
        if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                cleanedValue = numValue;
            }
        }
        // Try to parse as boolean
        else if (typeof value === 'string') {
            const lowerValue = value.trim().toLowerCase();
            if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') {
                cleanedValue = true;
            } else if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') {
                cleanedValue = false;
            }
            // Try to parse as JSON array/object (for arrays like flavours)
            else if ((value.startsWith('[') && value.endsWith(']')) || (value.startsWith('{') && value.endsWith('}'))) {
                try {
                    cleanedValue = JSON.parse(value);
                } catch (e) {
                    // Keep as string if JSON parse fails
                }
            }
        }
        
        // Map common field name variations
        let finalKey = cleanKey;
        
        // Product fields
        if (cleanKey === 'product_name' || cleanKey === 'productname') finalKey = 'name';
        if (cleanKey === 'product_price' || cleanKey === 'productprice' || cleanKey === 'price') finalKey = 'price';
        if (cleanKey === 'product_brand' || cleanKey === 'productbrand') finalKey = 'brand';
        if (cleanKey === 'product_description' || cleanKey === 'productdescription' || cleanKey === 'description') finalKey = 'description';
        if (cleanKey === 'product_stock' || cleanKey === 'productstock' || cleanKey === 'stock' || cleanKey === 'quantity') finalKey = 'stock';
        if (cleanKey === 'product_status' || cleanKey === 'productstatus' || cleanKey === 'status') finalKey = 'status';
        if (cleanKey === 'product_featured' || cleanKey === 'productfeatured' || cleanKey === 'featured' || cleanKey === 'is_featured') finalKey = 'featured';
        
        // Brand fields
        if (cleanKey === 'brand_name' || cleanKey === 'brandname') finalKey = 'name';
        if (cleanKey === 'brand_description' || cleanKey === 'branddescription') finalKey = 'description';
        
        // Flavour fields
        if (cleanKey === 'flavour_name' || cleanKey === 'flavourname' || cleanKey === 'flavor_name' || cleanKey === 'flavorname') finalKey = 'name';
        if (cleanKey === 'flavour_id' || cleanKey === 'flavourid' || cleanKey === 'flavor_id' || cleanKey === 'flavorid') finalKey = 'flavorId';
        if (cleanKey === 'flavour_brand' || cleanKey === 'flavourbrand' || cleanKey === 'flavor_brand' || cleanKey === 'flavorbrand' || cleanKey === 'brand') {
            if (collectionType === 'flavours') {
                finalKey = 'brand';
            }
        }
        if (cleanKey === 'flavour' || cleanKey === 'flavor' || cleanKey === 'flavours' || cleanKey === 'flavors') {
            // Handle flavour as string or comma-separated list
            if (collectionType === 'products') {
                finalKey = 'flavour';
                // If it's a string with commas, convert to array
                if (typeof cleanedValue === 'string' && cleanedValue.includes(',')) {
                    cleanedValue = cleanedValue.split(',').map(f => f.trim()).filter(f => f);
                }
            }
        }
        // Handle flavour_ids for products (mapping flavor names to IDs)
        if ((cleanKey === 'flavour_ids' || cleanKey === 'flavor_ids' || cleanKey === 'flavorids' || cleanKey === 'flavourids') && collectionType === 'products') {
            finalKey = 'flavour_ids';
            // Convert comma-separated IDs to array
            if (typeof cleanedValue === 'string' && cleanedValue.trim() !== '') {
                cleanedValue = cleanedValue.split(',').map(id => id.trim()).filter(id => id !== '');
            }
        }
        
        cleaned[finalKey] = cleanedValue;
    }
    
    return cleaned;
}

// Read file as text (for CSV fallback)
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Error reading file'));
        reader.readAsText(file, 'UTF-8');
    });
}

// Parse CSV to JSON structure
function parseCSVToJSON(csvContent) {
    // Remove BOM if present
    const content = csvContent.replace(/^\ufeff/, '');
    
    if (!content || content.trim().length === 0) {
        throw new Error('CSV file is empty');
    }
    
    const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    
    if (lines.length < 1) {
        throw new Error('CSV file must have at least a header row');
    }
    
    const data = {
        products: [],
        brands: [],
        flavours: []
    };
    
    let currentCollection = null;
    let collectionHeaders = null;
    
    // Process CSV line by line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
            // Parse CSV line (handling quoted values)
            const parsedLine = parseCSVLine(line);
            
            if (parsedLine.length === 0) continue;
            
            // Check if this is a new collection header (starts with collection name)
            const firstHeader = parsedLine[0] ? parsedLine[0].replace(/^"|"$/g, '') : '';
            const collectionMatch = firstHeader.match(/^(products|brands|flavours)_/);
            
            if (collectionMatch) {
                // Start new collection
                currentCollection = collectionMatch[1];
                collectionHeaders = parsedLine.map(h => {
                    const cleanHeader = h.replace(/^"|"$/g, '');
                    // Remove collection prefix (e.g., "products_id" -> "id")
                    const prefix = `${currentCollection}_`;
                    if (cleanHeader.startsWith(prefix)) {
                        return cleanHeader.substring(prefix.length);
                    }
                    return cleanHeader;
                });
            } else if (currentCollection && collectionHeaders && parsedLine.length > 0) {
                // This is a data row for current collection
                const item = {};
                let hasData = false;
                
                collectionHeaders.forEach((header, index) => {
                    if (parsedLine[index] !== undefined && header && header.trim() !== '') {
                        let value = parsedLine[index].replace(/^"|"$/g, '').replace(/""/g, '"');
                        
                        // Skip empty values for non-id fields (keep id and productId even if empty)
                        if (value === '' && header !== 'id' && header !== 'productId') {
                            return;
                        }
                        
                        // Try to parse as number
                        if (value !== '' && !isNaN(value) && value.trim() !== '') {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                                value = numValue;
                            }
                        }
                        // Try to parse as boolean
                        else if (value === 'TRUE' || value === 'true') {
                            value = true;
                        } else if (value === 'FALSE' || value === 'false') {
                            value = false;
                        }
                        // Try to parse as JSON
                        else if (value !== '' && ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']')))) {
                            try {
                                value = JSON.parse(value);
                            } catch (e) {
                                // Keep as string if JSON parse fails
                            }
                        }
                        
                        item[header] = value;
                        hasData = true;
                    }
                });
                
                if (hasData && Object.keys(item).length > 0) {
                    data[currentCollection].push(item);
                }
            }
        } catch (lineError) {
            console.error(`Error parsing CSV line ${i + 1}:`, lineError);
            // Continue processing other lines
        }
    }
    
    // Validate that we found at least one collection
    const hasData = data.products.length > 0 || data.brands.length > 0 || data.flavours.length > 0;
    if (!hasData && lines.length > 0) {
        throw new Error('No valid collection data found in CSV. Please ensure your CSV has headers like "products_id", "brands_id", or "flavours_id"');
    }
    
    return data;
}

// Parse a CSV line handling quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    if (!line || line.trim() === '') {
        return [];
    }
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add last field
    result.push(current);
    return result;
}

// Ensure brands and flavours exist and allocate to existing products if duplicate names
// Returns map of product names to track duplicates and which should be skipped
// Updated for brand-specific flavors
async function ensureBrandsAndFlavoursExist(products) {
    const brandNames = new Set();
    const flavourMap = new Map(); // Map "brand|flavorName" to flavor ID (from product data)
    const productNameMap = new Map(); // Track product names and their data for duplicates
    const duplicateProductNames = new Set(); // Track which product names are duplicates in CSV
    const productsToSkip = new Set(); // Products that should be skipped (duplicates in file)
    
    // First pass: Check for duplicates within the CSV file itself
    products.forEach((product, index) => {
        if (product.name && product.name.trim() !== '') {
            const productName = product.name.trim().toLowerCase();
            
            if (productNameMap.has(productName)) {
                // Duplicate found in CSV file
                duplicateProductNames.add(productName);
                // Keep the first occurrence, mark subsequent ones to skip
                if (!productsToSkip.has(index)) {
                    // Find the first occurrence and keep it
                    const firstIndex = productNameMap.get(productName).index;
                    productsToSkip.add(index); // Mark current as duplicate to skip
                }
            } else {
                productNameMap.set(productName, { index, product });
            }
            
            // Collect brand names
            const productBrand = product.brand && product.brand.trim() ? product.brand.trim() : '';
            if (productBrand) {
                brandNames.add(productBrand);
            }
            
            // Handle flavors with their IDs - Brand-Specific
            if (product.flavour && productBrand) {
                const flavours = Array.isArray(product.flavour) ? product.flavour : [product.flavour];
                const flavourIds = Array.isArray(product.flavour_ids) ? product.flavour_ids : 
                    (product.flavour_ids ? product.flavour_ids.split(',').map(id => id.trim()).filter(id => id) : []);
                
                flavours.forEach((flavorName, flavorIndex) => {
                    const cleanFlavorName = flavorName.trim();
                    if (cleanFlavorName) {
                        // Create unique key: "brand|flavorName"
                        const flavorKey = `${productBrand}|${cleanFlavorName}`;
                        // Map flavor key to its ID if provided
                        if (flavourIds[flavorIndex]) {
                            flavourMap.set(flavorKey, flavourIds[flavorIndex].trim());
                        } else if (!flavourMap.has(flavorKey)) {
                            // If no ID specified for this flavor, mark as null (will auto-generate)
                            flavourMap.set(flavorKey, null);
                        }
                    }
                });
            }
        }
    });
    
    // Merge flavours/brands from duplicate products into the first occurrence
    duplicateProductNames.forEach(productName => {
        const firstEntry = productNameMap.get(productName);
        if (!firstEntry) return;
        
        // Find all occurrences of this product name
        products.forEach((product, index) => {
            if (product.name && product.name.trim().toLowerCase() === productName) {
                // Merge flavours - combine all unique flavours from duplicates
                const firstFlavours = Array.isArray(firstEntry.product.flavour) 
                    ? firstEntry.product.flavour 
                    : (firstEntry.product.flavour ? [firstEntry.product.flavour] : []);
                const currentFlavours = Array.isArray(product.flavour)
                    ? product.flavour
                    : (product.flavour ? product.flavour.split(',').map(f => f.trim()).filter(f => f !== '') : []);
                const allFlavours = [...new Set([...firstFlavours, ...currentFlavours])];
                firstEntry.product.flavour = allFlavours;
                
                // Merge flavour_ids - combine IDs maintaining order
                const firstFlavourIds = Array.isArray(firstEntry.product.flavour_ids) 
                    ? firstEntry.product.flavour_ids 
                    : (firstEntry.product.flavour_ids ? firstEntry.product.flavour_ids.split(',').map(id => id.trim()).filter(id => id) : []);
                const currentFlavourIds = Array.isArray(product.flavour_ids)
                    ? product.flavour_ids
                    : (product.flavour_ids ? product.flavour_ids.split(',').map(id => id.trim()).filter(id => id) : []);
                
                // Match IDs to flavors by position
                const mergedIds = [];
                allFlavours.forEach((flavorName, idx) => {
                    if (firstFlavours.includes(flavorName)) {
                        const firstIdx = firstFlavours.indexOf(flavorName);
                        if (firstFlavourIds[firstIdx]) mergedIds.push(firstFlavourIds[firstIdx]);
                        else if (currentFlavours.includes(flavorName)) {
                            const currentIdx = currentFlavours.indexOf(flavorName);
                            if (currentFlavourIds[currentIdx]) mergedIds.push(currentFlavourIds[currentIdx]);
                        }
                    } else if (currentFlavours.includes(flavorName)) {
                        const currentIdx = currentFlavours.indexOf(flavorName);
                        if (currentFlavourIds[currentIdx]) mergedIds.push(currentFlavourIds[currentIdx]);
                    }
                });
                if (mergedIds.length > 0) {
                    firstEntry.product.flavour_ids = mergedIds;
                }
                
                // Merge brand if first doesn't have it but duplicate does
                if (firstEntry.product.brand && firstEntry.product.brand.trim() !== '') {
                    // First already has brand, keep it
                } else if (product.brand && product.brand.trim() !== '') {
                    firstEntry.product.brand = product.brand.trim();
                }
            }
        });
    });
    
    // Check and create missing brands
    if (brandNames.size > 0) {
        for (const brandName of brandNames) {
            try {
                const brandQuery = await db.collection('brands')
                    .where('name', '==', brandName)
                    .limit(1)
                    .get();
                
                if (brandQuery.empty) {
                    try {
                        await db.collection('brands').add({
                            name: brandName,
                            description: '',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        console.log(`Auto-created brand: ${brandName}`);
                    } catch (brandError) {
                        console.error(`Error creating brand "${brandName}":`, brandError);
                        // Continue with next brand instead of breaking
                    }
                }
            } catch (error) {
                console.error(`Error checking/creating brand "${brandName}":`, error);
            }
        }
    }
    
    // Check and create missing flavours with their IDs - Brand-Specific
    if (flavourMap.size > 0) {
        for (const [flavorKey, flavourId] of flavourMap.entries()) {
            try {
                // Parse brand and flavor name from key
                const [brandName, flavourName] = flavorKey.split('|');
                
                if (!brandName || !flavourName) {
                    console.warn(`Invalid flavor key format: ${flavorKey}`);
                    continue;
                }
                
                // Check if flavor exists for this specific brand
                const flavourQuery = await db.collection('flavours')
                    .where('brand', '==', brandName)
                    .where('name', '==', flavourName)
                    .limit(1)
                    .get();
                
                if (flavourQuery.empty) {
                    // Flavor doesn't exist for this brand, create it
                    let finalFlavorId = flavourId;
                    
                    // If no ID provided, skip creation - require ID from Excel
                    if (!finalFlavorId || finalFlavorId.trim() === '') {
                        console.warn(`Skipping flavor "${flavourName}" for brand "${brandName}" - no ID provided. Please provide flavorId in Excel file.`);
                        continue;
                    }
                    
                    // Allow duplicate IDs if provided - user's choice, no auto-generation
                    // Just use the provided ID even if it's a duplicate
                    
                    try {
                        await db.collection('flavours').add({
                            name: flavourName,
                            brand: brandName,
                            flavorId: finalFlavorId,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        console.log(`Auto-created flavour: ${flavourName} for brand "${brandName}" with ID: ${finalFlavorId}`);
                    } catch (addError) {
                        console.error(`Error adding flavour "${flavourName}" for brand "${brandName}":`, addError);
                        // Continue with next flavor instead of breaking
                    }
                } else {
                    // Flavor exists for this brand, check if it needs flavorId assigned
                    const existingFlavor = flavourQuery.docs[0];
                    const existingData = existingFlavor.data();
                    
                    if (!existingData.flavorId) {
                        // Existing flavor doesn't have an ID - only use provided ID, no auto-generation
                        let finalFlavorId = flavourId;
                        
                        if (!finalFlavorId || finalFlavorId.trim() === '') {
                            // No ID provided and existing flavor has no ID - skip this flavor
                            console.warn(`Flavor "${flavourName}" for brand "${brandName}" has no ID. Skipping ID assignment. Please add ID manually or through Excel import.`);
                            finalFlavorId = null;
                        } else {
                            // Allow duplicate IDs if provided - user's choice
                        }
                        
                        // Only update if we have a valid ID
                        if (finalFlavorId) {
                            try {
                                await existingFlavor.ref.update({
                                    flavorId: finalFlavorId
                                });
                                console.log(`Assigned ID to existing flavour: ${flavourName} for brand "${brandName}" with ID: ${finalFlavorId}`);
                            } catch (updateError) {
                                console.error(`Error updating flavour "${flavourName}" for brand "${brandName}":`, updateError);
                                // Continue with next flavor instead of breaking
                            }
                        }
                    } else if (flavourId && flavourId.trim() !== '' && existingData.flavorId !== flavourId) {
                        // User provided a different ID, but flavor already has one - keep existing
                        console.warn(`Flavor "${flavourName}" for brand "${brandName}" already has ID "${existingData.flavorId}". Keeping existing ID.`);
                    }
                }
            } catch (error) {
                console.error(`Error checking/creating flavour from key "${flavorKey}":`, error);
            }
        }
    }
    
    // Check for duplicates in system and allocate flavours/brands to existing products
    for (const [productNameLower, entry] of productNameMap.entries()) {
        const product = entry.product;
        const productName = product.name.trim();
        
        try {
            // Check if product with this name already exists in system
            const existingProductQuery = await db.collection('products')
                .where('name', '==', productName)
                .limit(1)
                .get();
            
            if (!existingProductQuery.empty) {
                // Product exists in system - mark to skip and allocate flavour/brand
                productsToSkip.add(entry.index);
                const existingProductDoc = existingProductQuery.docs[0];
                const existingProductData = existingProductDoc.data();
                const updateData = {};
                
                // Always update flavours - merge with existing flavours
                const existingFlavours = Array.isArray(existingProductData.flavour) 
                    ? existingProductData.flavour 
                    : (existingProductData.flavour ? [existingProductData.flavour] : []);
                const csvFlavours = Array.isArray(product.flavour)
                    ? product.flavour
                    : (product.flavour ? product.flavour.split(',').map(f => f.trim()).filter(f => f !== '') : []);
                const mergedFlavours = [...new Set([...existingFlavours, ...csvFlavours])];
                if (mergedFlavours.length > 0) {
                    updateData.flavour = mergedFlavours;
                }
                
                // Always update brand if CSV product has one
                if (product.brand && product.brand.trim() !== '') {
                    updateData.brand = product.brand.trim();
                }
                
                // Update other fields if they're missing in existing product
                if (product.price && (!existingProductData.price || existingProductData.price === 0)) {
                    updateData.price = product.price;
                }
                if (product.stock !== undefined && existingProductData.stock === undefined) {
                    updateData.stock = product.stock;
                }
                if (product.description && (!existingProductData.description || existingProductData.description.trim() === '')) {
                    updateData.description = product.description;
                }
                if (product.productId && (!existingProductData.productId || existingProductData.productId.trim() === '')) {
                    updateData.productId = product.productId;
                }
                
                // Update existing product with flavour/brand
                if (Object.keys(updateData).length > 0) {
                    await existingProductDoc.ref.update(updateData);
                    console.log(`Updated existing product "${productName}" with flavour "${product.flavour}" and brand "${product.brand}"`);
                }
            }
        } catch (error) {
            console.error(`Error checking/updating duplicate product "${productName}":`, error);
        }
    }
    
    return productsToSkip;
}

// Import a collection
async function importCollection(collectionName, items, productsToSkip, progressCallback) {
    const result = {
        imported: 0,
        skipped: 0,
        errors: 0,
        errorDetails: []
    };
    
    if (!Array.isArray(items)) {
        throw new Error(`${collectionName} must be an array`);
    }
    
    if (items.length === 0) {
        return result;
    }
    
    for (let i = 0; i < items.length; i++) {
        try {
            const item = items[i];
            
            // Check if this product should be skipped (duplicate in file or system)
            if (collectionName === 'products' && productsToSkip && productsToSkip.has(i)) {
                result.skipped++;
                const productName = item.name ? item.name.trim() : `Row ${i + 1}`;
                result.errorDetails.push(`Row ${i + 1}: Product "${productName}" skipped (duplicate in file or already exists in system)`);
                if (progressCallback) progressCallback(i + 1, items.length);
                continue;
            }
            
            // Validate item is an object
            if (!item || typeof item !== 'object') {
                result.errors++;
                result.errorDetails.push(`Row ${i + 1}: Invalid item format (not an object)`);
                if (progressCallback) progressCallback(i + 1, items.length);
                continue;
            }
            
            // Remove id from data (Firebase will auto-generate if not provided)
            const { id, createdAt, updatedAt, ...itemData } = item;
            
            // Validate item has at least one field besides id
            if (Object.keys(itemData).length === 0) {
                result.errors++;
                result.errorDetails.push(`Row ${i + 1}: Item has no data fields`);
                if (progressCallback) progressCallback(i + 1, items.length);
                continue;
            }
            
            // Validate required fields for products
            if (collectionName === 'products') {
                if (!itemData.name || itemData.name.trim() === '') {
                    result.errors++;
                    result.errorDetails.push(`Row ${i + 1}: Product name is required`);
                    if (progressCallback) progressCallback(i + 1, items.length);
                    continue;
                }
                
                // Double-check if product with same name exists (safety check)
                const existingProductQuery = await db.collection('products')
                    .where('name', '==', itemData.name.trim())
                    .limit(1)
                    .get();
                
                if (!existingProductQuery.empty) {
                    // Product already exists (should have been caught earlier, but double-check)
                    result.skipped++;
                    if (progressCallback) progressCallback(i + 1, items.length);
                    continue;
                }
            } else if (collectionName === 'flavours') {
                // For flavours, check brand-specific uniqueness only if both brand and name are provided
                if (itemData.brand && itemData.brand.trim() !== '' && itemData.name && itemData.name.trim() !== '') {
                    // Check if flavor with same name exists for the same brand
                    const existingFlavorQuery = await db.collection('flavours')
                        .where('brand', '==', itemData.brand.trim())
                        .where('name', '==', itemData.name.trim())
                        .limit(1)
                        .get();
                    
                    if (!existingFlavorQuery.empty) {
                        // Flavor already exists for this brand
                        result.skipped++;
                        result.errorDetails.push(`Row ${i + 1}: Flavor "${itemData.name.trim()}" already exists for brand "${itemData.brand.trim()}"`);
                        if (progressCallback) progressCallback(i + 1, items.length);
                        continue;
                    }
                    
                    // Allow duplicate IDs if provided in Excel - user's choice
                    // Only require that flavorId is provided, don't check for duplicates
                    if (!itemData.flavorId || itemData.flavorId.trim() === '') {
                        if (itemData.brand && itemData.brand.trim() !== '') {
                            // No auto-generation - require ID from Excel import
                            result.errors++;
                            result.errorDetails.push(`Row ${i + 1}: Flavor ID is required for flavor "${itemData.name || 'Unknown'}" in brand "${itemData.brand.trim()}". Please provide flavorId in Excel file.`);
                            if (progressCallback) progressCallback(i + 1, items.length);
                            continue;
                        }
                    }
                }
                
                // Ensure brand and name are trimmed if they exist
                if (itemData.brand) {
                    itemData.brand = itemData.brand.trim();
                }
                if (itemData.name) {
                    itemData.name = itemData.name.trim();
                }
            } else {
                // For other collections (brands), check by ID if provided
                if (item.id) {
                    const existingDoc = await db.collection(collectionName).doc(item.id).get();
                    if (existingDoc.exists) {
                        result.skipped++;
                        if (progressCallback) progressCallback(i + 1, items.length);
                        continue;
                    }
                }
            }
            
            // Add timestamp if not present
            if (!createdAt) {
                itemData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            }
            
            // Add document
            if (id && id.trim() !== '') {
                await db.collection(collectionName).doc(id.trim()).set(itemData);
            } else {
                await db.collection(collectionName).add(itemData);
            }
            
            result.imported++;
        } catch (error) {
            console.error(`Error importing ${collectionName} item ${i + 1}:`, error);
            result.errors++;
            result.errorDetails.push(`Row ${i + 1}: ${error.message}`);
        }
        
        if (progressCallback) {
            progressCallback(i + 1, items.length);
        }
        
        // Small delay to avoid overwhelming Firebase
        if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    return result;
}

