# NearestDoctor — AI Healthcare Assistant

An AI-powered full-stack healthcare web application that connects patients with doctors. Built with React, Node.js/Express, Python/Flask, MongoDB, and Ethereum blockchain.

---

## 👨‍💻 Developer

| Field   | Details                        |
|---------|-------------------------------|
| Name    | Suraj Manik More              |
| Phone   | 9422078548                    |
| Email   | surajmore7858@gmail.com       |

---

## 📦 What's Inside

```
assistant/
├── react-app/       → Frontend (React.js, Tailwind CSS) — runs on port 8081
├── server/          → Backend API (Node.js + Express + MongoDB) — runs on port 8080
├── blockchain/      → Ethereum blockchain node for medical records — runs on port 3001
└── py side/         → Python/Flask AI microservices (face recognition, OCR)
```

### Key Features
- **AI Symptom Chatbot** — Dialogflow-powered bot recommends specialists based on symptoms
- **X-Ray Scanner** — Analyzes chest, hand, knee, spine, shoulder, foot, skull, pelvis X-rays using TensorFlow
- **Doctor–Patient Messaging** — Real-time inbox with unread badge
- **Appointment Booking** — Book with nearest/first-available doctor via Google Maps
- **Blockchain Medical Records** — Immutable patient records on Ethereum smart contracts
- **Mental Health Test** — Guided quiz with personalized article suggestions
- **Doctor Identity Verification** — National ID card OCR via Nanonets API
- **Face ID Login** — TensorFlow deep learning biometric authentication
- **Paramedical E-Shop** — ML-based personalized product recommendations
- **Stripe Payments** — Doctor subscription plans and patient service payments

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v16+
- [Python 3.8+](https://www.python.org/)
- MongoDB Atlas account (or local MongoDB)
- Git

---

## 🚀 How to Run

### 1. Clone the repository

```bash
git clone https://github.com/surajmore303/nearest-doctor-ai-assistant.git
cd nearest-doctor-ai-assistant
```

### 2. Configure environment variables

Create `server/.env`:
```env
ATLAS_URI=mongodb+srv://<username>:<password>@cluster0.ra0suif.mongodb.net/nearestdoctor
PORT=8080
JWT_SECRET=your_jwt_secret_here
```

Create `react-app/.env`:
```env
PORT=8081
REACT_APP_API_URL=http://localhost:8080
REACT_APP_BLOCKCHAIN_NODE=http://localhost:3001
```

### 3. Install all dependencies

```bash
npm run install:all
```

This installs dependencies for root, server, and react-app.

### 4. Start the application

```bash
npm run dev
```

This starts both the backend server (port 8080) and React frontend (port 8081) simultaneously.

Open your browser at: **http://localhost:8081**

---

### Optional: Start Blockchain Node

```bash
cd blockchain
npm install
npm start
```

Runs on **http://localhost:3001**

### Optional: Start Python AI Microservices

```bash
cd "py side"
pip install -r requirements.txt
python run.py
```

---

## 🛠️ Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React.js v18, Tailwind CSS        |
| Backend     | Node.js, Express.js               |
| Database    | MongoDB Atlas                     |
| AI/ML       | TensorFlow.js, Python/Flask       |
| Blockchain  | Ethereum Smart Contracts          |
| Chatbot     | Dialogflow                        |
| Payments    | Stripe API                        |
| Maps        | Google Maps API                   |
| Auth        | JWT, Face ID (TensorFlow)         |
| OCR         | Nanonets AI API                   |

---

## 📋 Available Scripts (from root)

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `npm run dev`        | Start server + React app together                |
| `npm run server`     | Start only the backend server (nodemon)          |
| `npm run client`     | Start only the React frontend                    |
| `npm run install:all`| Install all dependencies (root + server + react) |

---

## 🗄️ Database

MongoDB Atlas — cluster: `cluster0.ra0suif.mongodb.net`, database: `nearestdoctor`

Collections: `users`, `appointments`, `messages`, `scans`, `blogs`, `products`, `records`

---

## 📄 License

Apache 2.0 — see [LICENSE](./LICENSE)
