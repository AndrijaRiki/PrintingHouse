# 🖨️ Printing House — Full-Stack Web Platform

**Printing House** is a full-stack web application designed to streamline operations, e-commerce, automated invoicing, public procurement bidding, and analytics for printing enterprises and their clients[cite: 4]. Built with **Angular**, **Node.js/Express (TypeScript)**, and **MongoDB**, this platform connects individual clients, corporate entities, and printing shops into a unified ecosystem.

---

## 🌟 Core Features

### 🔐 1. Authentication & Role Management
* **Dual Login Portals:** Separate public authentication forms for clients/shops and a dedicated, isolated admin route for system administrators.
* **Registration & Approval Flow:**
  * **Individual Clients:** Input personal info, unique email, contact phone, and profile picture.
  * **Corporate Clients & Printing Shops:** In addition to contact info, require Company Name, Address, Unique 8-digit Registration Number (MB), and 9-digit Tax ID (PIB).
  * **Admin Review:** New client and shop registrations require administrator approval before accounts are activated.
* **Password Security:** Regex validation (8–12 chars, $\ge 1$ uppercase, $\ge 1$ digit, $\ge 1$ special character, starting with a letter) and password hashing/encryption in MongoDB.
* **Temporary Password Reset:** Sends a temporary reset token via email valid strictly for 5 minutes.
* **Profile Image Upload:** Image dimension validation ($100\times100\text{ px}$ to $250\times250\text{ px}$) with fallback to a default avatar (`default_profile_image.jpg`).

---

### 🛒 2. Public Catalog & Client Portal
* **Public Search & Product Catalog:** Unauthenticated visitors can browse active products, filter by dynamic categories, search by keyword, and view gallery images stored in browser cookies.
* **Interactive Product Customization:**
  * Custom text or transparent graphic overlay positioning using **HTML5 Canvas** / CSS overlay.
  * Custom print service selection (e.g., Direct-to-Garment DTG, Sublimation, Flex) with real-time price calculations.
  * Real-time stock validation to prevent over-ordering.
* **E-Commerce & E-Cart:**
  * Groups items by print shop during checkout.
  * Automatically splits single carts into separate, itemized invoices per shop.
* **Integrated Payments & Automated Invoicing:**
  * Payment gateway integration (Stripe Test Mode / PayPal Sandbox) updates order status from `ordered` to `paid`.
  * PDF generation and automated email dispatch of official invoice documents to clients upon purchase.
* **Order Lifecycle Tracking:**
  * Status sequence: `ordered` $\rightarrow$ `paid` $\rightarrow$ `in_print` $\rightarrow$ `delivered` $\rightarrow$ `received`.
  * Clients can cancel orders that are still in `ordered` status.
* **Archive & Product Reviews:**
  * Order history sorting by date, invoice ID, and shop.
  * Clients can mark delivered items as received, leave likes/dislikes, and post reviews (own comments highlighted in orange).

---

### 🏛️ 3. Corporate Public Procurement (Javne Nabavke)
* **Automated Bidding Window:** When corporate clients confirm orders, the system triggers a 10-minute competitive tender instead of issuing immediate invoices.
* **Shop Email Alerts:** Automatically dispatches email notifications to all registered printing shops announcing open tenders and requested item lists.
* **Lowest-Bid Selection:** Evaluates active tender submissions upon deadline expiration, awarding the contract to the print shop offering the lowest total bid with adequate stock.
* **PDF Procurement Reports:** Generates downloadable summary reports outlining all submitted bids and the winning tender.

---

### 🏭 4. Print Shop Portal
* **Inventory Management:** Add/edit products, stock quantities, image galleries, and specialized print services with dimension limits and price add-ons.
* **Bulk JSON Inventory Import:** Upload complete catalog lists and services using standard JSON data files.
* **Order Execution:** Update client order statuses from `ordered`/`paid` $\rightarrow$ `in_print` $\rightarrow$ `delivered`.
* **Tender Participation:** Review active public tenders and submit competitive bulk bids within the active bidding window.

---

### 📊 5. Administrator Dashboard & Analytics
* **User & Category Management:** Approve/reject account requests, manage active users, and add product categories and subcategories
* **Interactive Data Visualizations (Chart.js):**
  * **Bar Chart:** Top revenue-generating print shops over the past quarter
  * **Pie Chart:** Most frequently ordered products over the past month
  * **Line Chart:** Product rating trends over time with interactive filtering

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** Angular 20
* **Language:** TypeScript
* **UI/UX:** Responsive Web Design (CSS3 / HTML5 Canvas)
* **Data Visualization:** Chart.js / ng2-charts

### Backend
* **Runtime:** Node.js with Express framework
* **Language:** TypeScript
* **Database:** MongoDB (via Mongoose ORM)
* **PDF Engine:** PDFKit / Puppeteer
* **Mailing Service:** Nodemailer (SMTP)
* **Payment Processor:** Stripe API / PayPal Sandbox SDK

---

## 📁 Repository Structure

```text
PIA projekat/
├── backend_Node/
│   ├── src/
│   │   ├── assets/       # Static templates & assets
│   │   ├── controllers/  # Route controllers (Auth, Order, Tender, Product)
│   │   ├── models/       # Mongoose schemas (User, Product, Invoice, Tender)
│   │   ├── routers/      # Express API endpoint definitions
│   │   ├── services/     # Business logic, Mailer, PDF generators
│   │   └── server.ts     # Entry point
│   ├── scripts/          # Database seeding and utility scripts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    └── app/
        ├── src/
        │   ├── app/
        │   │   ├── admin-component/       # Admin user/category/analytics dashboard
        │   │   ├── public-procurement/   # Tender creation and bidding portal
        │   │   ├── prepare-product/      # Interactive Canvas customization
        │   │   ├── ecart-component/        # E-cart & multi-invoice checkout
        │   │   ├── services/             # Angular API integration services
        │   │   └── ...                   # Additional feature modules
        │   ├── assets/
        │   └── styles.css
        ├── angular.json
        └── package.json
