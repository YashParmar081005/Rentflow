# Backend Implementation Plan: Rental Management System

This plan outlines the steps to build a robust Node.js and MongoDB backend for the Rental Management System, replacing the current frontend mock data and Supabase integration.

## 1. Project Initialization & Structure

**Location:** `d:\Rental Managment System\server`

### 1.1 Directory Structure
```
server/
├── config/
│   └── db.js           # Database connection
├── controllers/        # Request handlers
│   ├── authController.js
│   ├── userController.js
│   ├── productController.js
│   ├── orderController.js
│   ├── invoiceController.js
│   └── ...
├── middleware/         # Custom middleware
│   ├── authMiddleware.js   # JWT verification & Role checks
│   └── errorMiddleware.js  # Global error handling
├── models/             # Mongoose schemas
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Invoice.js
│   ├── Quotation.js
│   └── ...
├── routes/             # API route definitions
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   └── ...
├── utils/              # Helper functions
│   └── generateToken.js
├── .env                # Environment variables
├── server.js           # Entry point
└── package.json
```

### 1.2 Dependencies
*   `express`: Web framework
*   `mongoose`: MongoDB object modeling
*   `dotenv`: Environment variables
*   `cors`: Cross-Origin Resource Sharing
*   `bcryptjs`: Password hashing
*   `jsonwebtoken`: Authentication tokens
*   `nodemon`: Dev server (dev dependency)

---

## 2. Database Design (Schemas)

We will translate the TypeScript interfaces from `rently-suite/src/types` into Mongoose Schemas.

### 2.1 User Schema
*   `name`, `email` (unique), `password` (hashed), `role` (enum: customer, vendor, admin), `company`, `gstin`, `avatar`.

### 2.2 Product Schema
*   `name`, `description`, `category`, `price` (daily, weekly, monthly), `stock`, `vendor` (ref: User), `images` (array), `attributes` (Map/Object).

### 2.3 Order Schema
*   `customer` (ref: User), `items` (array with product ref, quantity, dates), `status`, `totalAmount`, `dates` (pickup, return).

### 2.4 Invoice Schema
*   `order` (ref: Order), `customer` (ref: User), `amount`, `status`, `dueDate`.

---

## 3. Authentication & Authorization Flow

### 3.1 Auth Strategy
*   **Signup**: validate input -> check existing user -> hash password -> save user -> return JWT.
*   **Login**: find user -> compare password (bcrypt) -> return JWT.
*   **JWT Payload**: `{ id: user._id, role: user.role }`.

### 3.2 Middleware (`authMiddleware.js`)
1.  `protect`: Verifies the token from `Authorization: Bearer <token>` header. Attaches `req.user`.
2.  `authorize(...roles)`: Checks if `req.user.role` is allowed to access the route.

---

## 4. Workflows & API Endpoints

### 4.1 Authentication
*   `POST /api/auth/signup`
*   `POST /api/auth/login`
*   `GET /api/auth/profile` (Protected)

### 4.2 Products
*   `GET /api/products` (Public, with filters)
*   `GET /api/products/:id` (Public)
*   `POST /api/products` (Vendor/Admin)
*   `PUT /api/products/:id` (Vendor/Admin - Owner check)
*   `DELETE /api/products/:id` (Vendor/Admin - Owner check)

### 4.3 Orders (Rental)
*   `POST /api/orders` (Customer)
*   `GET /api/orders` (Protected - Customers see theirs, Vendors see theirs, Admin see all)
*   `PUT /api/orders/:id/status` (Vendor/Admin)

### 4.4 Invoices & Quotations
*   Endpoints to generate and manage invoices/quotes based on orders.

---

## 5. Implementation Steps

1.  **Setup Server**: Create folder, `npm init`, install packages, setup `server.js` & `db.js`.
2.  **Define Models**: Write Mongoose schemas for User, Product, Order.
3.  **Auth Implementation**: Write auth controller & middleware. Test with Postman.
4.  **Product CRUD**: Implement product routes and controllers.
5.  **Order System**: Implement order placement and retrieval logic.
6.  **Frontend Integration**: Update React app to use `axios` (or fetch) to call these new endpoints instead of mock data.
