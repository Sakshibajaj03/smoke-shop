# Static Images System

This project now supports both Firebase Storage URLs and local static images. Images are stored in the `images/` folder and will work when the code is uploaded to GitHub.

## How It Works

1. **Firebase Storage URLs** are stored in the database (Firestore)
2. **Static images** are stored in the `images/` folder in the codebase
3. The system automatically falls back to static images if Firebase URLs fail to load

## Image Structure

```
images/
├── slide image/          # Slider images
├── Foger/               # FOGER brand products
├── geek bar/            # GEEK BAR brand products
├── raz/                 # RAZ brand products
├── viho/                # VIHO brand products
├── air bar/             # AIR BAR brand products
├── MYLE/                # MYLE brand products
├── REDS/                # REDS brand products
├── TYSON/               # TYSON brand products
└── VGOD/                # VGOD brand products
```

## Image Utility Functions

The `image-utils.js` file provides:

- `getImageUrl(firebaseUrl, type, brand)` - Gets image URL (Firebase or static fallback)
- `getStaticProductImage(brand)` - Gets static product image by brand
- `getStaticSliderImages()` - Gets array of static slider images
- `handleImageError(event, type, brand)` - Handles image loading errors with fallback

## Usage

### In JavaScript:
```javascript
// Product image
const imgUrl = window.getImageUrl(product.image, 'product', product.brand);

// Slider image
const imgUrl = window.getImageUrl(sliderData.image1, 'slider');

// With error handling
<img src="${imgUrl}" onerror="window.handleImageError(event, 'product', '${brand}')">
```

## Adding New Images

1. Add images to the appropriate folder in `images/`
2. Update `image-utils.js` to include the new image paths
3. Images will automatically be used as fallbacks

## Benefits

- ✅ Images work on GitHub Pages
- ✅ Images work offline
- ✅ Faster loading (no external dependencies)
- ✅ Firebase URLs still stored in database
- ✅ Automatic fallback system




