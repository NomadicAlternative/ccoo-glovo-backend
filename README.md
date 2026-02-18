# ccoo-glovo-backend
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![Express](https://img.shields.io/badge/Express-MVC-black)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue)
![Status](https://img.shields.io/badge/Status-In%20Development-orange)

Express + MySQL MVC backend for managing labor conflict cases submitted by delivery workers represented by Comisiones Obreras. Built following structured backend development principles.
# CCOO – Glovo Case Management Backend

Backend web application built with Express and MySQL to manage labor conflict cases (dismissals, sanctions, unpaid leave, etc.) submitted by delivery workers represented by Comisiones Obreras.

Developed following structured backend architecture principles inspired by CSE 340 (MVC, server-side rendering, validation, authentication, and database integration).

---

## 🚀 Tech Stack

- Node.js
- Express.js
- MySQL
- MVC Architecture
- Server-Side Rendering (EJS – upcoming)
- Authentication & Authorization (planned)
- Input Validation
- RESTful principles

---

## 🎯 Project Purpose

This application allows:

- Workers to submit labor conflict cases securely.
- Internal representatives to manage and update case status.
- Structured tracking of dismissals, sanctions, unpaid leave, and other labor issues.

---

## 📦 Planned Features

- Worker case submission form
- Case tracking system
- Admin panel for internal representatives
- Role-based authentication
- Input validation & security hardening
- Protection against SQL injection & XSS
- GDPR-aware data handling

---

## 🏗 Architecture

The project follows a structured MVC pattern:

controllers/
models/
routes/
views/
public/
config/

---

## 🔐 Security Considerations

- Environment variables (.env)
- Password hashing (bcrypt)
- Session/JWT authentication
- Input sanitization
- HTTPS-ready
- GDPR compliance considerations

---

## 📌 Roadmap

### Phase 1 – Core Setup
- Express server
- MySQL connection
- MVC structure

### Phase 2 – Database Layer
- Workers table
- Cases table
- CRUD operations

### Phase 3 – Validation & Forms
- Server-side validation
- Error handling
- Secure submissions

### Phase 4 – Authentication
- Worker login
- Admin login
- Role-based permissions

### Phase 5 – Internal Dashboard
- Case filtering
- Status updates
- Case notes

### Phase 6 – Production Ready
- Security hardening
- Deployment
- Documentation

---

## 👨‍💻 Author

Diego García  
Software Developer  
Founder of The Nomadic Dev