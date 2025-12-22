/**
 * Image Utility Functions
 * Handles both Firebase Storage URLs and local static images
 */

// Track used images per brand to avoid duplicates
const usedImagesTracker = {
    // Format: { 'AIR BAR': [usedImage1, usedImage2, ...], ... }
    used: {},
    
    // Reset tracking for a brand or all brands
    reset: function(brand = null) {
        if (brand) {
            const brandKey = normalizeBrandKey(brand);
            if (brandKey) {
                delete this.used[brandKey];
            }
        } else {
            this.used = {};
        }
    },
    
    // Mark an image as used for a brand
    markUsed: function(brand, imagePath) {
        const brandKey = normalizeBrandKey(brand);
        if (!brandKey) return;
        
        if (!this.used[brandKey]) {
            this.used[brandKey] = [];
        }
        if (!this.used[brandKey].includes(imagePath)) {
            this.used[brandKey].push(imagePath);
        }
    },
    
    // Check if an image is already used for a brand
    isUsed: function(brand, imagePath) {
        const brandKey = normalizeBrandKey(brand);
        if (!brandKey || !this.used[brandKey]) return false;
        return this.used[brandKey].includes(imagePath);
    },
    
    // Get next available image for a brand (cycles through unused images)
    getNextAvailable: function(brand, availableImages) {
        const brandKey = normalizeBrandKey(brand);
        if (!brandKey || !availableImages || availableImages.length === 0) return null;
        
        const used = this.used[brandKey] || [];
        
        // Find first unused image
        for (const imagePath of availableImages) {
            if (!used.includes(imagePath)) {
                this.markUsed(brand, imagePath);
                return imagePath;
            }
        }
        
        // All images used, reset and start over
        this.reset(brand);
        if (availableImages.length > 0) {
            const firstImage = availableImages[0];
            this.markUsed(brand, firstImage);
            return firstImage;
        }
        
        return null;
    }
};

// Static image paths mapping
const STATIC_IMAGES = {
    // Slider images - static images from code (correct folder name: "slider image")
    sliders: {
        1: 'images/slider image/Slider Image 1.jpg',
        2: 'images/slider image/Slider Image 2.png',
        3: 'images/slider image/Slider Image 3.jpg',
        4: 'images/slider image/Slider Image 4.jpg',
        5: 'images/slider image/Slider Image 5.jpg',
        default: 'images/slider image/Slider Image 1.jpg',
        fallbacks: [
            'images/slider image/Slider Image 1.jpg',
            'images/slider image/Slider Image 2.png',
            'images/slider image/Slider Image 3.jpg',
            'images/slider image/Slider Image 4.jpg',
            'images/slider image/Slider Image 5.jpg'
        ]
    },
    // Product images by brand
    products: {
        'FOGER': 'images/Foger/foger-switch-pro-30k-puffs-disposable-vape-pod.webp',
        'GEEK BAR': 'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs.jpg',
        'RAZ': 'images/raz/RAZ TN9000/raz_tn9000_watermelon_ice.jpg',
        'VIHO': 'images/viho/VIHO TRX 50K/viho_trx_50k_main.jpg',
        'AIR BAR': 'images/air bar/Air Bar AB5000 10pk/Air Bar AB5000 10pk.jpg',
        'AIRBAR AURA 0912': 'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_blueberry_ice.jpg', // Maps to AIR BAR images
        'AIRBAR AURA   0912': 'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_blueberry_ice.jpg', // Maps to AIR BAR images
        'MYLE': 'images/MYLE/download.jpg',
        'REDS': 'images/REDS/download.jpg',
        'TYSON': 'images/TYSON/download.jpg',
        'VGOD': 'images/VGOD/images.jpg',
        default: 'images/Foger/foger-switch-pro-30k-puffs-disposable-vape-pod.webp'
    },
    // Brand images
    brands: {
        default: 'images/Foger/foger-bit-35k-collection.webp'
    },
    // Flavor images
    flavours: {
        default: 'images/Foger/download.jpg'
    }
};

/**
 * Normalize string for comparison (remove special chars, lowercase, etc.)
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

/**
 * Check if two strings are similar (for product name and image name matching)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {boolean} True if strings are similar
 */
function areStringsSimilar(str1, str2) {
    const norm1 = normalizeString(str1);
    const norm2 = normalizeString(str2);
    
    // Check if one contains the other or they share significant common parts
    if (norm1.length < 3 || norm2.length < 3) return false;
    
    // If normalized strings are the same or one contains the other
    if (norm1 === norm2) return true;
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    
    // Check for significant overlap (at least 50% of shorter string)
    const shorter = norm1.length < norm2.length ? norm1 : norm2;
    const longer = norm1.length >= norm2.length ? norm1 : norm2;
    const minMatchLength = Math.floor(shorter.length * 0.5);
    
    // Check if a significant portion of shorter string exists in longer string
    for (let i = 0; i <= shorter.length - minMatchLength; i++) {
        const substring = shorter.substring(i, i + minMatchLength);
        if (longer.includes(substring)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Normalize brand name to match STATIC_IMAGES keys
 * Handles variations like "Airbar AURA   0912" -> "AIR BAR"
 * @param {string} brand - Brand name to normalize
 * @returns {string} Normalized brand key
 */
function normalizeBrandKey(brand) {
    if (!brand) return null;
    
    const brandUpper = brand.toUpperCase().trim();
    
    // Direct match first
    if (STATIC_IMAGES.products[brandUpper]) {
        return brandUpper;
    }
    
    // Try to extract base brand name from compound names
    // Handle "Airbar AURA   0912" -> "AIR BAR"
    // Handle "Airbar AURA 0912" -> "AIR BAR"
    // Handle "Air Bar AURA 0912" -> "AIR BAR"
    
    // Remove extra spaces and normalize
    const normalized = brandUpper.replace(/\s+/g, ' ').trim();
    
    // Check if it starts with known brand names
    const brandMappings = {
        'AIRBAR': 'AIR BAR',
        'AIR BAR': 'AIR BAR',
        'AIRBAR AURA': 'AIR BAR',  // Handle "Airbar AURA 0912" -> "AIR BAR"
        'AIR BAR AURA': 'AIR BAR',
        'FOGER': 'FOGER',
        'GEEK BAR': 'GEEK BAR',
        'GEEKBAR': 'GEEK BAR',
        'RAZ': 'RAZ',
        'VIHO': 'VIHO',
        'MYLE': 'MYLE',
        'REDS': 'REDS',
        'TYSON': 'TYSON',
        'VGOD': 'VGOD'
    };
    
    // Try exact match first (including with numbers like "AIRBAR AURA 0912")
    if (STATIC_IMAGES.products[normalized]) {
        return normalized;  // Return as-is if it exists in STATIC_IMAGES
    }
    
    if (brandMappings[normalized]) {
        return brandMappings[normalized];
    }
    
    // Try to find if brand name starts with any known brand
    for (const [key, value] of Object.entries(brandMappings)) {
        if (normalized.startsWith(key) || normalized.includes(key)) {
            return value;
        }
    }
    
    // Try removing numbers and special patterns (e.g., "AIRBAR AURA 0912" -> "AIRBAR AURA")
    const withoutNumbers = normalized.replace(/\d+/g, '').trim();
    if (STATIC_IMAGES.products[withoutNumbers]) {
        return withoutNumbers;
    }
    
    for (const [key, value] of Object.entries(brandMappings)) {
        const keyWithoutSpaces = key.replace(/\s+/g, '');
        const normalizedWithoutSpaces = withoutNumbers.replace(/\s+/g, '');
        if (normalizedWithoutSpaces.startsWith(keyWithoutSpaces) || 
            normalizedWithoutSpaces.includes(keyWithoutSpaces)) {
            return value;
        }
    }
    
    return null;
}

/**
 * Extract key words from product name for matching
 * @param {string} productName - Product name
 * @returns {Array} Array of key words
 */
function extractKeyWords(productName) {
    if (!productName) return [];
    
    // Remove common words and extract meaningful parts
    const normalized = productName.toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    
    // Split by spaces and numbers, keep meaningful parts
    const parts = normalized.split(/[\s#\-_]+/).filter(part => {
        // Filter out very short parts and pure numbers
        return part.length >= 2 && !(/^\d+$/.test(part));
    });
    
    // Also try to extract product model/type (e.g., "AB5000", "AURA", "0912")
    const modelMatch = normalized.match(/([a-z]+)\s*(\d+)/gi);
    if (modelMatch) {
        parts.push(...modelMatch.map(m => m.replace(/\s+/g, '')));
    }
    
    return [...new Set(parts)]; // Remove duplicates
}

/**
 * Calculate similarity score between product name and image filename
 * @param {string} productName - Product name
 * @param {string} imagePath - Image path
 * @returns {number} Similarity score (0-100)
 */
function calculateSimilarity(productName, imagePath) {
    if (!productName || !imagePath) return 0;
    
    // Extract filename from path
    const filename = imagePath.substring(imagePath.lastIndexOf('/') + 1);
    const filenameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    
    // Normalize both
    const normProduct = normalizeString(productName);
    const normImage = normalizeString(filenameWithoutExt);
    
    // Exact match
    if (normProduct === normImage) return 100;
    
    // One contains the other
    if (normProduct.includes(normImage) || normImage.includes(normProduct)) {
        const longer = normProduct.length > normImage.length ? normProduct : normImage;
        const shorter = normProduct.length <= normImage.length ? normProduct : normImage;
        return Math.floor((shorter.length / longer.length) * 90);
    }
    
    // Extract key words and check overlap
    const productWords = extractKeyWords(productName);
    const imageWords = extractKeyWords(filenameWithoutExt);
    
    if (productWords.length === 0 || imageWords.length === 0) return 0;
    
    // Count matching words
    let matchCount = 0;
    let totalWords = Math.max(productWords.length, imageWords.length);
    
    for (const pWord of productWords) {
        for (const iWord of imageWords) {
            if (pWord === iWord || pWord.includes(iWord) || iWord.includes(pWord)) {
                matchCount++;
                break;
            }
        }
    }
    
    if (matchCount === 0) return 0;
    
    // Calculate percentage match
    const wordMatchScore = (matchCount / totalWords) * 80;
    
    // Check for partial string matches
    let partialMatchScore = 0;
    for (const pWord of productWords) {
        if (pWord.length >= 3 && normImage.includes(pWord)) {
            partialMatchScore += 10;
        }
    }
    
    return Math.min(100, wordMatchScore + partialMatchScore);
}

/**
 * Find matching static image based on product name
 * @param {string} productName - Product name to match
 * @param {string} brand - Brand name
 * @returns {string|null} Matching image path or null
 */
function findMatchingProductImage(productName, brand) {
    if (!productName || !brand) return null;
    
    // Normalize brand to match STATIC_IMAGES keys
    const brandKey = normalizeBrandKey(brand);
    if (!brandKey) {
        console.warn(`Brand "${brand}" could not be normalized. Product: "${productName}"`);
        return null;
    }
    
    const brandDefaultPath = STATIC_IMAGES.products[brandKey];
    
    if (!brandDefaultPath) {
        console.warn(`No images found for brand "${brandKey}". Product: "${productName}"`);
        return null;
    }
    
    // Known image paths for each brand (extracted from folder structure)
    // This maps brand to their known image paths
    const brandImagePaths = {
        'FOGER': [
            'images/Foger/foger-switch-pro-30k-puffs-disposable-vape-pod.webp',
            'images/Foger/foger-bit-35k-collection.webp',
            'images/Foger/download.jpg'
        ],
        'GEEK BAR': [
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_berry_trio_ice.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_cool_mint.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_fuji_melon_ice.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_ginger_ale.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_green_monster.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_mexico_mango.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_peach_ice.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_sour_apple_ice.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_stone_freeze.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_strawberry_ice.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_strawberry_mango.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_strawberry_watermelon.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_tropical_rainbow_blast.jpg',
            'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_watermelon_ice.jpg',
            'images/geek bar/GEEK BAR/geek_bar_pulse_blow_pop.jpg',
            'images/geek bar/GEEK BAR/geek_bar_pulse_blue_razz_ice.jpg',
            'images/geek bar/GEEK BAR/geek_bar_pulse_california_cherry.jpg',
            'images/geek bar/GEEK BAR/geek_bar_pulse_fcuking_fab.jpg',
            'images/geek bar/GEEK BAR/geek_bar_pulse_juicy_peach_ice.jpg',
            'images/geek bar/GEEK BAR/geek_bar_pulse_meta_moon.jpg',
            'images/geek bar/GEEK BAR/geek_bar_pulse_mexico_mango.jpg'
        ],
        'RAZ': [
            'images/raz/RAZ TN9000/raz_tn9000_watermelon_ice.jpg',
            'images/raz/RAZ LTX 25K/raz_ltx_25000_bangin_sour_berries.jpg',
            'images/raz/RAZ LTX 25K/raz_ltx_25000_black_blue_lime.jpg',
            'images/raz/RAZ LTX 25K/raz_ltx_25000_black_cherry_peach.jpg',
            'images/raz/RAZ LTX 25K/raz_ltx_25000_blue_raz_ice.jpg',
            'images/raz/RAZ LTX 25K/raz_ltx_25000_blueberry_watermelon.jpg',
            'images/raz/RAZ LTX 25K/raz_ltx_25000_cherry_strapple.jpg',
            'images/raz/RAZ LTX 25K/raz_ltx_25000_clear_diamond.jpg'
        ],
        'VIHO': [
            'images/viho/VIHO TRX 50K/viho_trx_50k_main.jpg',
            'images/viho/Viho 20K 0915/Viho 20K 0915.jpg'
        ],
        'AIR BAR': [
            'images/air bar/Air Bar AB5000 10pk/Air Bar AB5000 10pk.jpg',
            'images/air bar/Air Bar AB5000 10pk/air_bar_ab5000_berries_blast.jpg',
            'images/air bar/Air Bar AB5000 10pk/air_bar_ab5000_black_cheese_cake.jpg',
            'images/air bar/Air Bar AB5000 10pk/air_bar_ab5000_black_ice.jpg',
            'images/air bar/Air Bar Aura 25,000 Puffs 5pk/Air Bar Aura 25,000 Puffs 5pk (Main image).jpg',
            'images/air bar/Air Bar Aura 25,000 Puffs 5pk/air_bar_aura_blackberry_fab.jpg',
            'images/air bar/Air Bar Aura 25,000 Puffs 5pk/air_bar_aura_blue_mint.jpg',
            'images/air bar/Air Bar Aura 25,000 Puffs 5pk/air_bar_aura_blue_razz_ice.jpg',
            'images/air bar/Air Bar Diamond+ 1000 Puffs 10pk.jpg',
            'images/air bar/Air Bar Mini 2000 Puffs.jpg',
            'images/air bar/air-bar-diamond-spark-8-250x300.jpg',
            'images/air bar/Airbar AURA   0912/Airbar AURA   0912.jpg',
            'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_blueberry_ice.jpg',
            'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_cool_mint.jpg',
            'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_miami_mint.jpg',
            'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_watermelon_ice.jpg'
        ],
        // Handle "Airbar AURA 0912" as a variant of AIR BAR
        'AIRBAR AURA 0912': [
            'images/air bar/Airbar AURA   0912/Airbar AURA   0912.jpg',
            'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_blueberry_ice.jpg',
            'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_cool_mint.jpg',
            'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_miami_mint.jpg',
            'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_watermelon_ice.jpg',
            'images/air bar/Air Bar Aura 25,000 Puffs 5pk/Air Bar Aura 25,000 Puffs 5pk (Main image).jpg',
            'images/air bar/Air Bar AB5000 10pk/Air Bar AB5000 10pk.jpg'
        ],
        'MYLE': [
            'images/MYLE/download.jpg'
        ],
        'REDS': [
            'images/REDS/download.jpg'
        ],
        'TYSON': [
            'images/TYSON/download.jpg'
        ],
        'VGOD': [
            'images/VGOD/SALT BAE.jpg',
            'images/VGOD/VGOD SALTS.jpg',
            'images/VGOD/images.jpg'
        ]
    };
    
    // Get images for this brand
    const brandImages = brandImagePaths[brandKey];
    if (!brandImages || brandImages.length === 0) {
        console.warn(`No image paths found for brand "${brandKey}". Product: "${productName}"`);
        return null;
    }
    
    // Try to find the best matching image using similarity scoring
    let bestMatch = null;
    let bestScore = 0;
    const MIN_SIMILARITY_SCORE = 30; // Minimum score to consider a match
    
    for (const imagePath of brandImages) {
        const score = calculateSimilarity(productName, imagePath);
        
        if (score > bestScore && score >= MIN_SIMILARITY_SCORE) {
            bestScore = score;
            bestMatch = imagePath;
        }
    }
    
    // If we found a good match, check if it's already used
    if (bestMatch && bestScore >= MIN_SIMILARITY_SCORE) {
        // If this exact image was already used for another product of same brand, try to get next available
        if (usedImagesTracker.isUsed(brand, bestMatch)) {
            console.log(`⚠️ Matched image "${bestMatch}" already used for brand "${brandKey}". Finding alternative...`);
            // Try to get next available image from the brand
            const nextAvailable = usedImagesTracker.getNextAvailable(brand, brandImages);
            if (nextAvailable) {
                console.log(`✅ Using alternative image "${nextAvailable}" for product "${productName}" (brand: ${brandKey})`);
                return nextAvailable;
            }
        }
        // Mark as used and return
        usedImagesTracker.markUsed(brand, bestMatch);
        console.log(`✅ Matched product "${productName}" (brand: ${brandKey}) with image "${bestMatch}" (score: ${bestScore})`);
        return bestMatch;
    }
    
    // No good match found - try to get next available image from brand (avoid duplicates)
    const nextAvailable = usedImagesTracker.getNextAvailable(brand, brandImages);
    if (nextAvailable) {
        console.log(`ℹ️ No name match for "${productName}" (brand: ${brandKey}). Using available image: "${nextAvailable}"`);
        return nextAvailable;
    }
    
    // No images available
    console.warn(`❌ No matching image found for product "${productName}" (brand: ${brandKey}). Best score: ${bestScore}`);
    return null;
}

/**
 * Get image URL - checks Firebase URL first, falls back to static image
 * @param {string} firebaseUrl - Firebase Storage URL
 * @param {string} type - Image type: 'product', 'slider', 'brand', 'flavour'
 * @param {string} brand - Brand name (for product images)
 * @param {string} productName - Product name (for matching with image filenames)
 * @returns {string} Image URL
 */
function getImageUrl(firebaseUrl, type = 'product', brand = null, productName = null) {
    // If Firebase URL exists and is valid, use it
    if (firebaseUrl && firebaseUrl.startsWith('http')) {
        return firebaseUrl;
    }
    
    // Otherwise, use static image based on type
    switch (type) {
        case 'slider':
            // If brand is provided as index (1-5), use specific slider image
            if (brand && STATIC_IMAGES.sliders[brand]) {
                return STATIC_IMAGES.sliders[brand];
            }
            return STATIC_IMAGES.sliders.default;
        case 'product':
            // First, try to find matching image based on product name
            if (productName && brand) {
                const matchingImage = findMatchingProductImage(productName, brand);
                if (matchingImage) {
                    return matchingImage;
                }
            }
            
            // If no name match found, use any available image from the brand
            // This ensures products always show an image from their brand
            const normalizedBrand = normalizeBrandKey(brand);
            if (normalizedBrand) {
                // Get brand image paths
                const brandImagePaths = {
                    'FOGER': [
                        'images/Foger/foger-switch-pro-30k-puffs-disposable-vape-pod.webp',
                        'images/Foger/foger-bit-35k-collection.webp',
                        'images/Foger/download.jpg'
                    ],
                    'GEEK BAR': [
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_berry_trio_ice.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_cool_mint.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_fuji_melon_ice.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_ginger_ale.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_green_monster.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_mexico_mango.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_peach_ice.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_sour_apple_ice.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_stone_freeze.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_strawberry_ice.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_strawberry_mango.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_strawberry_watermelon.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_tropical_rainbow_blast.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_meloso_max_9000_puffs_watermelon_ice.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_pulse_blow_pop.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_pulse_blue_razz_ice.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_pulse_california_cherry.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_pulse_fcuking_fab.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_pulse_juicy_peach_ice.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_pulse_meta_moon.jpg',
                        'images/geek bar/GEEK BAR/geek_bar_pulse_mexico_mango.jpg'
                    ],
                    'RAZ': [
                        'images/raz/RAZ TN9000/raz_tn9000_watermelon_ice.jpg',
                        'images/raz/RAZ LTX 25K/raz_ltx_25000_bangin_sour_berries.jpg',
                        'images/raz/RAZ LTX 25K/raz_ltx_25000_black_blue_lime.jpg',
                        'images/raz/RAZ LTX 25K/raz_ltx_25000_black_cherry_peach.jpg',
                        'images/raz/RAZ LTX 25K/raz_ltx_25000_blue_raz_ice.jpg',
                        'images/raz/RAZ LTX 25K/raz_ltx_25000_blueberry_watermelon.jpg',
                        'images/raz/RAZ LTX 25K/raz_ltx_25000_cherry_strapple.jpg',
                        'images/raz/RAZ LTX 25K/raz_ltx_25000_clear_diamond.jpg'
                    ],
                    'VIHO': [
                        'images/viho/VIHO TRX 50K/viho_trx_50k_main.jpg',
                        'images/viho/Viho 20K 0915/Viho 20K 0915.jpg'
                    ],
                    'AIR BAR': [
                        'images/air bar/Air Bar AB5000 10pk/Air Bar AB5000 10pk.jpg',
                        'images/air bar/Air Bar AB5000 10pk/air_bar_ab5000_berries_blast.jpg',
                        'images/air bar/Air Bar AB5000 10pk/air_bar_ab5000_black_cheese_cake.jpg',
                        'images/air bar/Air Bar AB5000 10pk/air_bar_ab5000_black_ice.jpg',
                        'images/air bar/Air Bar Aura 25,000 Puffs 5pk/Air Bar Aura 25,000 Puffs 5pk (Main image).jpg',
                        'images/air bar/Air Bar Aura 25,000 Puffs 5pk/air_bar_aura_blackberry_fab.jpg',
                        'images/air bar/Air Bar Aura 25,000 Puffs 5pk/air_bar_aura_blue_mint.jpg',
                        'images/air bar/Air Bar Aura 25,000 Puffs 5pk/air_bar_aura_blue_razz_ice.jpg',
                        'images/air bar/Air Bar Diamond+ 1000 Puffs 10pk.jpg',
                        'images/air bar/Air Bar Mini 2000 Puffs.jpg',
                        'images/air bar/air-bar-diamond-spark-8-250x300.jpg',
                        'images/air bar/Airbar AURA   0912/Airbar AURA   0912.jpg',
                        'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_blueberry_ice.jpg',
                        'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_cool_mint.jpg',
                        'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_miami_mint.jpg',
                        'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_watermelon_ice.jpg'
                    ],
                    'AIRBAR AURA 0912': [
                        'images/air bar/Airbar AURA   0912/Airbar AURA   0912.jpg',
                        'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_blueberry_ice.jpg',
                        'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_cool_mint.jpg',
                        'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_miami_mint.jpg',
                        'images/air bar/Airbar AURA   0912/air_bar_diamond_plus_watermelon_ice.jpg',
                        'images/air bar/Air Bar Aura 25,000 Puffs 5pk/Air Bar Aura 25,000 Puffs 5pk (Main image).jpg',
                        'images/air bar/Air Bar AB5000 10pk/Air Bar AB5000 10pk.jpg'
                    ],
                    'MYLE': [
                        'images/MYLE/download.jpg'
                    ],
                    'REDS': [
                        'images/REDS/download.jpg'
                    ],
                    'TYSON': [
                        'images/TYSON/download.jpg'
                    ],
                    'VGOD': [
                        'images/VGOD/SALT BAE.jpg',
                        'images/VGOD/VGOD SALTS.jpg',
                        'images/VGOD/images.jpg'
                    ]
                };
                
                const brandImages = brandImagePaths[normalizedBrand];
                if (brandImages && brandImages.length > 0) {
                    // Get next available image from brand (ensures different images for different products)
                    const nextAvailable = usedImagesTracker.getNextAvailable(brand, brandImages);
                    if (nextAvailable) {
                        console.log(`ℹ️ Using brand image "${nextAvailable}" for product "${productName || 'Unknown'}" (brand: ${normalizedBrand})`);
                        return nextAvailable;
                    }
                }
                
                // Fallback to brand default if available
                if (STATIC_IMAGES.products[normalizedBrand]) {
                    console.log(`ℹ️ Using brand default image for product "${productName || 'Unknown'}" (brand: ${normalizedBrand})`);
                    return STATIC_IMAGES.products[normalizedBrand];
                }
            }
            
            // Last resort: return default image
            return STATIC_IMAGES.products.default;
        case 'brand':
            return STATIC_IMAGES.brands.default;
        case 'flavour':
            return STATIC_IMAGES.flavours.default;
        default:
            return STATIC_IMAGES.products.default;
    }
}

/**
 * Get static image path for a product based on brand and product name
 * @param {string} brand - Brand name
 * @param {string} productName - Product name (optional, for matching)
 * @returns {string} Static image path
 */
function getStaticProductImage(brand, productName = null) {
    // STRICT MATCHING: Only use images that match product name
    if (productName && brand) {
        const matchingImage = findMatchingProductImage(productName, brand);
        if (matchingImage) {
            return matchingImage;
        }
    }
    
    // If no match found, use brand default ONLY if brand matches product
    const normalizedBrand = normalizeBrandKey(brand);
    if (normalizedBrand && STATIC_IMAGES.products[normalizedBrand]) {
        const productNameNorm = (productName || '').toLowerCase();
        const brandNameNorm = normalizedBrand.toLowerCase();
        
        // Only use brand default if product name contains brand name
        if (productNameNorm.includes(brandNameNorm.replace(/\s+/g, '')) || 
            brandNameNorm.includes(productNameNorm.split(/\s+/)[0])) {
            return STATIC_IMAGES.products[normalizedBrand];
        }
    }
    
    // Return empty string instead of wrong brand default
    return '';
}

/**
 * Get static slider images
 * @returns {Array} Array of static slider image paths
 */
function getStaticSliderImages() {
    return [
        STATIC_IMAGES.sliders.default,
        ...STATIC_IMAGES.sliders.fallbacks.slice(0, 4)
    ];
}

/**
 * Check if URL is a Firebase Storage URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
function isFirebaseUrl(url) {
    return url && (url.includes('firebasestorage') || url.includes('firebase') || url.startsWith('http'));
}

/**
 * Handle image error - fallback to static image
 * @param {Event} event - Image error event
 * @param {string} type - Image type
 * @param {string} brand - Brand name (for products)
 * @param {string} productName - Product name (for products, optional)
 */
function handleImageError(event, type = 'product', brand = null, productName = null) {
    const img = event.target;
    const fallbackUrl = getImageUrl(null, type, brand, productName);
    
    // Only set fallback if it's different from current src to avoid infinite loop
    if (img.src !== fallbackUrl && !img.dataset.fallbackSet) {
        img.dataset.fallbackSet = 'true';
        img.src = fallbackUrl;
    }
}

// Make functions globally available
window.getImageUrl = getImageUrl;
window.getStaticProductImage = getStaticProductImage;
window.getStaticSliderImages = getStaticSliderImages;
window.isFirebaseUrl = isFirebaseUrl;
window.handleImageError = handleImageError;
window.resetImageTracker = function(brand) {
    usedImagesTracker.reset(brand);
};

