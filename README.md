# Shagun Saree Baran - E-commerce Website

A complete and fully functional modern e-commerce website for an Indian saree store, built with HTML, CSS, and JavaScript.

## 🌟 Features

### 🏠 Home Page
- **Responsive Navigation**: Logo, search bar, cart icon with count, and login button
- **Hero Banner**: Welcoming message with call-to-action button
- **Featured Categories**: Grid layout showcasing different saree types
- **Trending Products**: Dynamic display of popular sarees

### 🛍️ Collections Page
- **Product Grid**: Responsive display of all sarees
- **Advanced Filtering**: 
  - Price range slider
  - Fabric type selection (Silk, Cotton, Georgette, Chiffon)
  - Color selection with visual color swatches
- **Sorting Options**: Featured, Price (Low to High), Price (High to Low), Rating, Newest
- **Load More**: Pagination with load more functionality

### 📱 Product Details Page
- **Image Gallery**: Main image with thumbnail navigation
- **Product Information**: Name, price, description, ratings, and reviews
- **Product Options**: Color, size, and quantity selection
- **Action Buttons**: Add to Cart, Buy Now, Add to Wishlist
- **Detailed Tabs**: Description, Specifications, Reviews, Shipping & Returns
- **Related Products**: Suggestions for similar items

### 🛒 Shopping Cart
- **Cart Management**: Add, remove, and update quantities
- **Order Summary**: Subtotal, delivery charges, discounts, and total
- **Coupon System**: Apply discount codes (WELCOME10, FIRST20, FREEDEL)
- **Empty State**: Friendly message when cart is empty
- **Continue Shopping**: Easy navigation back to products

### 📍 Address Management
- **Delivery Form**: Complete address collection form
- **Form Validation**: Required field validation
- **State Selection**: All Indian states included
- **Saved Addresses**: Option to save for future orders
- **Security Notice**: Information about data protection

### 💳 Checkout Process
- **Multi-step Process**: Visual progress indicator
- **Payment Methods**: 
  - Cash on Delivery (COD)
  - Credit/Debit Cards
  - UPI Payment
  - Net Banking
- **Order Review**: Final confirmation of items and details
- **Terms & Conditions**: Required agreement checkbox
- **Order Confirmation**: Success modal with order details

## 🎨 Design Features

- **Modern UI/UX**: Clean, professional design similar to Amazon/Flipkart
- **Responsive Design**: Perfect on desktop, tablet, and mobile devices
- **Smooth Animations**: CSS transitions and hover effects
- **Color Scheme**: Professional color palette with brand colors
- **Typography**: Modern, readable fonts
- **Icons**: Font Awesome icons for enhanced visual appeal

## 🛠️ Technical Implementation

### Frontend Technologies
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with Flexbox and Grid
- **JavaScript (ES6+)**: Dynamic functionality and interactions
- **Local Storage**: Cart persistence across browser sessions

### Key Features
- **Cart Management**: Add, remove, update quantities
- **Product Filtering**: Real-time filtering and sorting
- **Responsive Grid**: CSS Grid for flexible layouts
- **Form Handling**: Address and checkout forms
- **Dynamic Content**: JavaScript-driven product loading
- **State Management**: Cart state persistence

### Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📁 File Structure

```
website/
├── index.html          # Home page
├── collections.html    # Product collections with filters
├── product.html       # Individual product details
├── cart.html          # Shopping cart
├── address.html       # Delivery address form
├── checkout.html      # Checkout and payment
├── style.css          # Main stylesheet
├── main.js           # JavaScript functionality
└── README.md         # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser
- Local web server (optional, for development)

### Installation
1. Download or clone the project files
2. Open `index.html` in your web browser
3. Navigate through the website to explore all features

### Development Setup
1. Use a local web server (e.g., Live Server in VS Code)
2. Open the project folder in your code editor
3. Make changes to HTML, CSS, or JavaScript files
4. Refresh the browser to see changes

## 🎯 Key Functionality

### Cart System
- **Add to Cart**: Click on any product's "Add to Cart" button
- **Cart Persistence**: Cart data saved in browser's local storage
- **Quantity Management**: Increase/decrease quantities in cart
- **Remove Items**: Remove individual items or clear entire cart

### Product Browsing
- **Category Navigation**: Browse by saree types
- **Search Functionality**: Search bar for finding specific products
- **Filtering**: Filter by price, fabric, and color
- **Sorting**: Sort products by various criteria

### Checkout Process
- **Address Collection**: Fill in delivery details
- **Payment Selection**: Choose from multiple payment methods
- **Order Confirmation**: Complete order with confirmation

## 🔧 Customization

### Adding Products
Edit the `products` array in `main.js`:
```javascript
const products = [
    {
        id: 7,
        name: "New Saree Name",
        price: 5000,
        originalPrice: 6000,
        image: "path/to/image.jpg",
        category: "silk",
        rating: 4.5,
        reviews: 50,
        description: "Product description",
        colors: ["Red", "Blue"],
        sizes: ["Free Size"],
        fabric: "Silk"
    }
];
```

### Modifying Styles
- Edit `style.css` to change colors, fonts, and layouts
- Update CSS variables for consistent theming
- Modify responsive breakpoints as needed

### Adding Features
- Extend JavaScript functionality in `main.js`
- Add new HTML pages following the existing structure
- Implement additional payment methods or features

## 📱 Mobile Responsiveness

The website is fully responsive and includes:
- **Mobile-first design approach**
- **Touch-friendly interactions**
- **Optimized layouts for small screens**
- **Responsive navigation menu**
- **Mobile-optimized forms**

## 🎨 Color Scheme

- **Primary**: #FF6B6B (Coral Red)
- **Secondary**: #4ECDC4 (Turquoise)
- **Accent**: #FFD700 (Gold)
- **Text**: #333 (Dark Gray)
- **Background**: #f8f9fa (Light Gray)
- **Footer**: #2c3e50 (Dark Blue)

## 🔒 Security Features

- **Form Validation**: Client-side validation for all forms
- **Data Protection**: Information about data security
- **Secure Checkout**: Multiple secure payment options
- **Privacy Policy**: Terms and conditions links

## 🚀 Future Enhancements

- **User Authentication**: Login/registration system
- **Wishlist**: Save favorite products
- **Product Reviews**: Customer review system
- **Order Tracking**: Real-time order status
- **Payment Gateway**: Integration with payment processors
- **Admin Panel**: Product management system
- **Search API**: Advanced search functionality
- **Multi-language**: Support for multiple languages

## 📞 Support

For questions or support:
- Email: shagunsaree60@gmail.com
- Phone: +91 9636788945
- Address: Krishna Colony, Baran, Rajasthan, India

## 📄 License

This project is created for demonstration purposes. All rights reserved to Shagun Saree Baran.

---

**Built with ❤️ for the Indian saree community**
