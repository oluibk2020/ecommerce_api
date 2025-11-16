# 🛍️ E-Commerce API

A **robust**, **scalable**, and **modern** backend application built with **NestJS**, powering a full-featured e-commerce platform. It handles **product management**, **user authentication**,**admin management**, **shopping carts**, **orders**, and more—built with a strong focus on performance, reliability, and developer experience.

---

## 🚀 Features

### **🛒 Product Management**
- Create, read, update, and delete products  
- Manage product details: name, description, price, stock, category, images  

### **🔐 User Authentication & Authorization**
- Secure user registration & login  
- Role-based access control (Admin, Customer)  
- JWT Authentication with Passport  
- Password hashing via Bcrypt  

### **🛍️ Shopping Cart**
- Add items to cart  
- Update item quantity  
- Remove items  

### **📦 Order Management**
- Create orders with line items  
- Update and track order status  
- View user order history  

### **📁 Category Management**
- Create and manage product categories  
- Support for hierarchical categorization  

### **🔎 Search & Filtering**
- Search products by keyword  
- Filter by category, price, and more  

### **📘 API Documentation**
- Clean and frontend-friendly REST API  
- Easily extendable (Swagger-ready)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Language | TypeScript (ES6+) |
| Framework | NestJS |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | JWT, Passport |
| Password Hashing | Bcrypt |
| Environment Variables | Dotenv |
| Task Scheduling | Node-Cron |
| Mailing | Nodemailer |

---

## 📦 Installation & Setup

### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

Set Up Environment Variables:
Create a .env file in the root directory and add the following:

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="your_jwt_secret_key"
PORT=5000

Replace USER, PASSWORD, HOST, PORT, and DATABASE with your PostgreSQL database credentials.

Generate a strong, random string for JWT_SECRET.

