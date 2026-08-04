# CyberPay AI - Documentation

Welcome to the documentation for **CyberPay AI**, an AI-enhanced digital payment and fraud detection system.

## Project Structure

- `frontend/` - Modern glassmorphism web client with dynamic UI components and real-time dashboard.
  - `assets/` - Static assets including CSS stylesheets, JavaScript files, images, icons, and fonts.
  - `pages/` - Application view pages (`dashboard.html`, `send-money.html`, `bills.html`, `fraud.html`, `insights.html`, `profile.html`, `settings.html`, etc.).
  - `components/` - Reusable UI HTML templates (`navbar.html`, `sidebar.html`, `footer.html`, `loader.html`).
  - `index.html` - Main landing page entry point.
- `backend/` - Node.js / Express backend service handling authentication, transaction processing, MySQL database queries, and security.
- `ml-service/` - Python ML microservice serving real-time neural network fraud risk scores.
- `docs/` - System architecture and integration documentation.

## Getting Started

1. Start backend service:
   ```bash
   cd backend
   npm install
   npm start
   ```
2. Start ML microservice:
   ```bash
   cd ml-service
   pip install -r requirements.txt
   python app.py
   ```
3. Open `frontend/index.html` or serve `frontend/` via web server or Nginx.
