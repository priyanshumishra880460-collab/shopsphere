# ShopSphere — Full-Stack E-Commerce Platform 🛍️

> **Academic Project Submission (2026)**  
> **Author & Lead Developer:** Priyanshu Mishra  
> **Architecture:** Full-Stack Node.js, Express REST API, Persistent JSON Database, Modern Tailwind CSS & Chart.js  

---

## 📋 Problem Statement Overview

The rapid growth of online shopping demands a reliable, user-friendly, and secure e-commerce platform that allows customers to browse products, compare options, place orders, make payments, and track deliveries from a single application. 

**ShopSphere** bridges the gap left by basic static websites by implementing a production-grade full-stack architecture featuring personalized user accounts, real-time inventory management, secure JWT authentication, simulated/live payments, end-to-end shipment tracking, verified product reviews, and an administrative sales analytics dashboard.

---

## ✨ System Architecture & Key Features

### 👤 1. Customer (Buyer) Portal
- **🔐 Secure Authentication:** User registration, password encryption via `bcryptjs`, and stateless token-based sessions via `jsonwebtoken` (JWT).
- **🔍 Multi-Token Search & Filters:** Live search with instant debounce, category rail filtering, and dynamic price-range slider (₹1,000 to ₹1,00,000).
- **🛒 Dynamic Cart & Wishlist:** Persistent local storage sync, stock quantity limits, real-time subtotal, GST (18%) calculation, and free shipping triggers.
- **💳 Multi-Method Checkout:** Address capture with simulated UPI / QR, Credit/Debit Cards, Netbanking, and Cash on Delivery.
- **📦 Visual Order Tracking ("My Orders"):** Live step-by-step shipment timeline:
  `Order Placed ➔ Processing ➔ Shipped ➔ Out for Delivery ➔ Delivered`.
- **⭐ Verified Buyer Reviews:** Star ratings (1 to 5) and verified buyer review submissions that dynamically recompute the product's average score.

### 🛡️ 2. Administrator Center (`/admin`)
- **📊 Real-Time Sales Analytics:** Visual Chart.js interactive charts displaying monthly revenue growth and category share distribution.
- **📦 Inventory Management:** Stock count controller with automated low-stock warnings (≤ 10 units) and automatic inventory decrement upon customer checkout.
- **📝 Product Catalog CRUD:** Add new products with high-resolution image URLs, categories, prices, and specifications; edit existing listings; or remove discontinued items.
- **🚚 Order Dispatch & Tracking Control:** Live status dropdown selector that instantly updates the buyer's shipment tracking timeline.
- **👥 Customer Monitoring:** Table of registered users with total orders placed, cumulative spend, and registration timestamps.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Modern Tailwind CSS, Vanilla JavaScript (ES6+), Chart.js |
| **Backend** | Node.js (v24+), Express.js RESTful API Architecture |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`) |
| **Persistence Layer** | Self-contained ACID-compliant File Database (`data/*.json`) with zero external DB setup required |
| **Icons & Typography** | Google Fonts ('Plus Jakarta Sans', 'Space Grotesk'), Unicode Icons |

---

## 🚀 Getting Started (Run in 1 Command)

### Prerequisites
- Node.js (v18 or higher) installed on your system.

### Installation & Launch
```bash
# 1. Clone or navigate to the project directory
cd shopsphere

# 2. Install dependencies
npm install

# 3. Start the application
npm start
```

Open your browser and navigate to:
👉 **`http://localhost:5000`**

---

## 🔑 Pre-Seeded Demo Credentials

For quick evaluation during college presentations and viva:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@shopsphere.com` | `admin123` | Full Dashboard & Inventory Access |
| **Customer** | `customer@shopsphere.com` | `customer123` | Storefront Shopping & Order Tracking |

*(The login modal also includes convenient **"One-Click Demo Fill"** buttons for immediate demonstration).*

---

## 📡 REST API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new customer
- `POST /api/auth/login` — Authenticate and receive JWT Bearer token
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Products & Inventory (`/api/products`)
- `GET /api/products` — Query catalog with `q`, `category`, `maxPrice`, `sort`
- `GET /api/products/:id` — Get product specifications and customer reviews
- `POST /api/products` — *(Admin)* Create a new product listing
- `PUT /api/products/:id` — *(Admin)* Update existing product details
- `PATCH /api/products/:id/stock` — *(Admin)* Update inventory stock levels
- `DELETE /api/products/:id` — *(Admin)* Remove product from catalog

### Orders & Tracking (`/api/orders`)
- `POST /api/orders` — Place order, verify stock, and trigger tracking
- `GET /api/orders/my` — Get authenticated customer's order history
- `GET /api/orders/:id` — Get single order tracking timeline
- `GET /api/orders/admin/all` — *(Admin)* View all customer orders
- `PATCH /api/orders/admin/:id/status` — *(Admin)* Update dispatch status

### Reviews & Admin Analytics
- `POST /api/reviews` — Submit verified product review
- `GET /api/admin/stats` — *(Admin)* Retrieve revenue, orders, and chart data
- `GET /api/admin/users` — *(Admin)* Retrieve customer monitoring metrics

---

© 2026 ShopSphere E-Commerce Project. Developed by Priyanshu Mishra.
