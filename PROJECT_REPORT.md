# ACADEMIC PROJECT REPORT
## PROJECT TITLE: SHOPSPHERE — FULL-STACK E-COMMERCE PLATFORM

- **Degree / Course:** Bachelor of Technology / Computer Science & Engineering (B.Tech / BCA / MCA)
- **Academic Year:** 2026
- **Developer & Author:** Priyanshu Mishra
- **Project Domain:** Web Technologies, Full-Stack Software Engineering, Cloud Systems

---

## 1. ABSTRACT

Modern digital commerce requires resilient, high-speed, and secure web applications capable of managing transactions, inventory allocation, and customer journeys from a unified interface. Traditional educational projects often rely on static interfaces lacking server-side persistence, real-time inventory management, and role-based access control.

**ShopSphere** is a production-oriented, full-stack e-commerce web application engineered to solve these challenges. Built on a modular Node.js and Express RESTful backend with a responsive Tailwind CSS and Chart.js frontend, ShopSphere implements JSON Web Token (JWT) stateless authentication, dynamic inventory tracking, simulated multi-gateway checkouts, an interactive five-stage order tracking engine, verified buyer reviews, and an administrative analytics center. The application satisfies all functional and non-functional requirements outlined in the 2026 Capstone Project specifications.

---

## 2. PROBLEM STATEMENT & OBJECTIVES

### 2.1 Problem Statement
Basic e-commerce implementations provide only static product displays and lack essential enterprise features such as:
1. Secure customer authentication and session persistence.
2. Real-time inventory deduction and low-stock alerting.
3. Multi-parameter searching and dynamic pricing filters.
4. Step-by-step milestone delivery tracking.
5. Role-based administrative management with sales analytics.

### 2.2 Project Objectives
- **Objective 1:** Build a stateless, secure user authentication system using `bcryptjs` and `jsonwebtoken` (JWT).
- **Objective 2:** Design a catalog engine supporting multi-token live search, category classification, and price range filtering.
- **Objective 3:** Implement an ACID-compliant persistent data store that operates independently without external database configuration dependencies.
- **Objective 4:** Provide an end-to-end customer checkout journey with automated stock decrement and simulated multi-channel payments.
- **Objective 5:** Develop a dedicated administrative control center (`/admin`) featuring real-time Chart.js revenue visualizers, inventory adjustment controls, and dispatch status management.

---

## 3. SYSTEM ARCHITECTURE & DATA DESIGN

### 3.1 Architectural Pattern
ShopSphere utilizes a **Single-Page Application (SPA) Client-Server Architecture**:
```
[Client Browser] 
    ├── HTML5 / Tailwind CSS / Vanilla JS (ES6+)
    ├── Chart.js Visualizer Engine
    └── JWT Bearer Token Authorization
           ↕ HTTP / RESTful JSON APIs
[Express.js Application Server]
    ├── Authentication Middleware (JWT & RBAC)
    ├── Route Controllers (/auth, /products, /orders, /admin)
    └── Business Logic (Stock Decrement, GST Calculation)
           ↕ Asynchronous File I/O
[Persistent JSON Data Layer]
    ├── users.json (Hashed Passwords & Roles)
    ├── products.json (Stock, Pricing, Specs)
    ├── orders.json (Tracking History, Items, Addresses)
    └── reviews.json (Ratings & Verified Comments)
```

### 3.2 Entity-Relationship (ER) Model Description
1. **User Entity:** `id (PK), name, email (Unique), password (Hashed), phone, role (admin/customer), avatar, createdAt`
2. **Product Entity:** `id (PK), name, category, price, originalPrice, stock, rating, reviewsCount, image, description, specs, isFeatured`
3. **Order Entity:** `id (PK), userId (FK), customerName, customerEmail, shippingAddress, items[], subtotal, tax, shippingFee, total, paymentMethod, paymentStatus, orderStatus, trackingHistory[], estimatedDelivery`
4. **Review Entity:** `id (PK), productId (FK), userId (FK), userName, rating (1-5), title, comment, verifiedPurchase, createdAt`

---

## 4. FUNCTIONAL MODULES BREAKDOWN

### Module 1: User Authentication & Role-Based Access Control (RBAC)
- Customers register with name, email, and password. Passwords are salted and hashed using `bcryptjs` (Cost factor: 10).
- Successful login generates a signed JWT payload containing `userId` and `role`.
- Two distinct authorization tiers:
  - **Customer Tier:** Can browse, save to cart/wishlist, checkout, submit reviews, and view own orders.
  - **Administrator Tier:** Protected via `requireAdmin` middleware. Granted exclusive access to `/admin` dashboard, analytics APIs, inventory controls, and order dispatch status modifiers.

### Module 2: Catalog Browsing & Multi-Token Search
- Client-side and server-side search tokenizes queries by whitespace and special characters, matching against product titles, categories, descriptions, and technical specifications.
- Instant category switching via dynamic query parameters.
- Price slider allows real-time budget filtering between ₹1,000 and ₹1,00,000.

### Module 3: Cart, Wishlist & Automated Pricing Calculation
- Local storage state management ensures shopping carts survive page refreshes.
- Automated stock guard: Cart quantities cannot exceed available inventory units.
- Built-in billing math: Standard 18% GST calculation + free shipping on orders exceeding ₹1,999.

### Module 4: Order Dispatch & Milestone Delivery Tracking
- Customers review shipping coordinates and select between UPI, Card, Netbanking, or Cash on Delivery.
- On order placement, stock is deducted from the catalog immediately.
- A five-step visual progress tracker (`Order Placed ➔ Processing ➔ Shipped ➔ Out for Delivery ➔ Delivered`) updates dynamically whenever an administrator modifies the order status.

### Module 5: Administrative Center & Sales Analytics
- Top metric cards summarize total revenue, completed orders, catalog count, active customers, and critical low-stock warnings (≤ 10 items).
- Chart.js renders a monthly revenue growth curve alongside a categorical sales breakdown doughnut.
- Comprehensive CRUD: Administrators can publish new products with images, adjust stock counts on the fly, or delete retired inventory.

---

## 5. HARDWARE & SOFTWARE SPECIFICATIONS

### Hardware Requirements
- **Processor:** Dual-Core x86/x64 or ARM (1.8 GHz minimum)
- **RAM:** 2 GB minimum (4 GB recommended)
- **Storage:** 150 MB free disk space

### Software Requirements
- **Operating System:** Windows 10/11, macOS, or Linux Ubuntu/Debian
- **Runtime Environment:** Node.js v18.0.0 or higher
- **Web Browser:** Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari

---

## 6. VIVA VOCE CHEAT SHEET (TOP EXAMINER QUESTIONS & WINNING ANSWERS)

### Q1: What makes ShopSphere different from a typical static e-commerce website?
> **Answer:** "A static website only renders hardcoded product HTML. ShopSphere is a full-stack application featuring a RESTful backend with stateless JWT authentication, password encryption via `bcrypt`, real-time inventory deduction during checkout, live milestone order tracking, and an interactive admin dashboard powered by Chart.js."

### Q2: Why did you use JWT instead of traditional server sessions?
> **Answer:** "JSON Web Tokens are stateless and highly scalable. Because the user's identity and role are cryptographically signed within the token payload, the server doesn't need to query a session table on every request. This reduces database overhead and makes the API cloud-ready."

### Q3: How does ShopSphere prevent race conditions or overselling of inventory?
> **Answer:** "During order creation in `/api/orders`, the server validates the available stock of each item before creating the record. If an item has fewer units than requested, the transaction is rejected with an HTTP 400 error. Once approved, the stock count is atomically updated."

### Q4: How is security handled for passwords and protected endpoints?
> **Answer:** "Passwords are never stored in plaintext; they are hashed with `bcryptjs` using a salt round of 10. For API protection, we use custom Express middleware (`authenticate` and `requireAdmin`) that inspects the HTTP `Authorization: Bearer <token>` header and denies requests lacking valid administrator credentials."

### Q5: What database are you using, and how does it persist data?
> **Answer:** "ShopSphere features a self-contained persistent JSON database layer with ACID-like atomic writes. It stores structured records on disk in `data/*.json`. This ensures the application runs reliably out of the box without requiring external database server daemons during evaluation."

---

© 2026 ShopSphere Project. Authored by Priyanshu Mishra.
