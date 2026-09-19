# 📦 Enterprise Inventory Management Microservice

A scalable, robust, and microservice-oriented Inventory Management backend engineered with **Node.js, Express, TypeScript, and Prisma ORM**. This service powers comprehensive supply chain operations including cross-service product synchronization, multi-warehouse management, supplier relations, procurement lifecycle (Purchase Orders & Goods Receiving), stock valuation, batch tracking, warehouse transfers, and immutable audit ledgers (`Stock Transactions`).

---

## 🏗️ Architecture & Core Layers

The application follows a clean, modular, and enterprise-grade layered architecture built on top of standardized core base classes:

- **Base Repository (`BaseRepository`):** Standardizes database operations using Prisma, supporting transactions, pagination, and soft deletes.
- **Base Service (`BaseService`):** Handles core business logic, error propagation, and inter-service communication hooks.
- **Base Controller (`BaseController`):** Encapsulates HTTP request/response lifecycles, async error handling, and standardized JSON formatting.
- **Base Validator (`BaseValidator`):** Implements robust runtime validation using **Zod** schema definitions.
- **Base Routes (`BaseRoutes`):** Centralizes route registration, method middleware security, and gateway allow-listing.

---

## 🚀 Key Modules & Features

1. **Product Sync (`/api/v1/product-sync`):** Synchronizes product variants securely from the core product catalog service.
2. **Warehouse Management (`/api/v1/warehouse`):** Manages multiple warehouse entities, spatial codes, and primary storage indicators.
3. **Supplier Management (`/api/v1/supplier`):** Maintains vendor profiles, contact personnel, and procurement credentials.
4. **Purchase Orders (`/api/v1/purchase-order`):** Manages purchase requisitions, expected arrival timelines, order items, and status updates (`PENDING` -> `RECEIVED`).
5. **Stock Levels (`/api/v1/stock-level`):** Real-time tracking of stock counts per warehouse/variant combination, with automated low-stock alerting.
6. **Stock Batches (`/api/v1/stock-batch`):** Manages batch numbers, manufacturing/expiry dates, and expiring stock alerts.
7. **Stock Transfers (`/api/v1/stock-transfer`):** Facilitates and tracks inter-warehouse stock relocations.
8. **Stock Transactions (`/api/v1/stock-transaction`):** Provides an immutable double-entry-style audit ledger for every stock-in, stock-out, or adjustment event.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database & ORM:** PostgreSQL, Prisma Client
- **Validation:** Zod
- **Authentication/Gateway:** API Gateway Allow-list Middleware Architecture

---

## ⚙️ Installation & Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd inventory-service
```
