# QueueCure V2 - Enterprise Clinic Management

> **Tagline:** *"Know your turn before it's your turn."*

QueueCure V2 transforms chaos into clarity. This is a production-grade, highly-scalable, real-time healthcare queue management platform. Built to support multi-clinic SaaS architecture, it empowers clinics with predictive wait-time AI, priority sorting, and mobile-first patient tracking.

![QueueCure Banner](https://via.placeholder.com/1200x400/0f172a/ffffff?text=QueueCure+V2+-+Live+Clinic+Queue+Management)

---

## 🎯 The Problem
In neighborhood clinics across the world, patients suffer from "Queue Anxiety." Because consultation times vary drastically, static appointments fail. Clinics rely on physical paper tokens, leading to:
- Crowded, contagious waiting rooms.
- Overwhelmed receptionists answering "When is my turn?" every 2 minutes.
- Frustrated doctors waiting on patients who left the room.

## 💡 The Solution
QueueCure V2 is a bidirectional, event-sourced real-time web application featuring:
1. **Receptionist Dashboard**: Lightning-fast onboarding with Priority assignment and QR code generation.
2. **Doctor Dashboard**: A workspace with an active timer turning green/yellow/red based on historical efficiency.
3. **Patient TV / Mobile Tracker**: A live, auto-updating display showing exactly who is being served and predictive wait estimates.

---

## 🚀 Key Innovation Highlights

* **Predictive Wait Time Engine 2.0**: The engine calculates an exact estimate using: `Remaining Current Consultation Time + ((Patients Ahead - 1) × Rolling Average)`. It actively detects if the doctor is running fast or slow today.
* **Smart Queue Intelligence**: Analyzes the gap between today's speed and the 30-day historical speed, displaying insights like: *"Doctor is running 18% faster than average today."*
* **Priority Sorting**: Emergency cases bypass Normal cases instantly at the database layer.
* **Event Sourcing**: Every action (`PATIENT_ADDED`, `PATIENT_CALLED`) generates an immutable `QueueEvent` log for future auditing and AI modeling.
* **Offline Resilience**: If the clinic's Wi-Fi drops, the Socket connection cleanly falls back to REST API polling until the network restores, ensuring zero stale data.

---

## 🏗️ Architecture

### Frontend (`apps/web`)
* **Framework**: Next.js 15 (App Router)
* **Styling**: Tailwind CSS & Shadcn UI (Linear/Stripe-grade glassmorphism & animations)
* **Animation**: Framer Motion
* **State Management**: Zustand
* **Real-time Client**: Socket.IO-client

### Backend (`apps/api`)
* **Runtime**: Node.js & Express.js
* **Real-time Server**: Socket.IO (with Rooms for multi-clinic isolation)
* **Database**: MongoDB Atlas (via Mongoose)

*(See `architecture.md` for full ER diagrams and systems design).*

---

## ⚙️ Setup & Evaluation Guide

### 1. Start the Backend API
The backend comes pre-configured with `mongodb-memory-server` for instant, hassle-free evaluation. No Atlas URI is required to test!
```bash
cd apps/api
npm install
npm run dev
```
*Server runs on `http://localhost:3001`*

### 2. Start the Frontend
In a new terminal window:
```bash
cd apps/web
npm install
npm run dev
```
*App runs on `http://localhost:3000`*

---

## 🧪 Judge Presentation & Demo Flow

To win the hackathon, follow this script:

1. **The Setup**: Open three windows.
   - Window A: `localhost:3000/reception`
   - Window B: `localhost:3000/doctor`
   - Window C: `localhost:3000/tv`
2. **The "Wow" Seed Moment**: In the Reception window, click the **Demo Seeder** button. Instantly, all three screens will populate with a live queue and historical data. Point out the **Smart Intelligence Banner**.
3. **Show Priority Override**: Add a new patient named "Critical Case" and select **Emergency**. Watch the UI instantly slot them at the absolute front of the line, and see the wait times recalculate for everyone behind them.
4. **Show The Doctor Timer**: In the Doctor Dashboard, show how the live timer counts up. Explain how this data feeds into the Wait Time Engine. Click **Finish & Call Next**.
5. **Show The Mobile QR**: In the Reception table, click the QR code icon. Explain how patients can scan this to open the `/track/:id` route on their phones, allowing them to leave the crowded clinic and wait at a nearby coffee shop.

---

## 🛡️ Scalability & Production Readiness
This project was built to scale from 1 clinic to 10,000.
* **Socket Rooms**: Events are isolated using `io.to(clinicId)`. 
* **Atomic Transactions**: `findOneAndUpdate` handles queue transitions to prevent duplicate token active states during simultaneous API calls.

*(See `thought-process.md` for a deep dive into engineering decisions).*
