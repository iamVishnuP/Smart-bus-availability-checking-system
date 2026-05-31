# 🚎 Smart Bus Availability Checking & Tracking System

A state-of-the-art, full-stack transit assistant for checking and tracking real-time bus availability in Kerala. Built with a beautiful **3D Glassmorphic UI**, a **Context-Aware AI Chatbot**, and **Passenger-Sourced passed stop tracking** to create an extremely visual, high-fidelity experience.

---

## ✨ Features

### 🤖 1. Context-Aware AI Chatbot Bus Finder (Default)
- **Natural Language understanding:** Ask questions like *"buses from Cherpu to Thrissur"*, *"next bus to Guruvayur"*, or *"bus after 5 pm"*.
- **Fuzzy Location Matching:** Automatically aligns misspelled or approximate location names (e.g. `"trissur"` to `"Thrissur"`, `"thriprayer"` to `"Thriprayar"`) to correct database routes.
- **Strict Database Validation (Zero Hallucinations):** The chatbot intercepts LLM search outputs and populates them directly from MongoDB records. If a stop doesn't exist, it displays: *"Sorry, we are currently in the developing stage. No buses available."*
- **3 Consecutive Buses Rule:** Displays a maximum of 3 upcoming buses, strictly ordered by time. No fake buses are generated.
- **Time-Based Filtering:** Automatically filters out buses that have already departed from the user's selected source stop based on Indian Standard Time (IST).
- **Intermediate Stop Support:** Correctly calculates timings and intermediate fares (`Math.abs(priceAtDestination - priceAtSource)`) for intermediate-to-intermediate searches.

### 🔍 2. Conventional Bus Finder Toggle
- An alternate visual finder with direct source/destination dropdown inputs.
- Uses the **exact same robust database validation, time-filtering, and fare calculation logic** as the chatbot.

### 🙋‍♂️ 3. "I'm On This Bus" Passenger Crowdsourcing
- Replaces complex GPS coordinate sharing with a lightweight stop-based passed stop reporter.
- Passengers on a bus can select stops along the route to report them as passed.
- **12-Hour Expiration:** Commuters checking routes see the exact real-time location (e.g., *"Passed Pazhuvil (at 10:45 AM)"*). If no passenger has submitted a stop update within 12 hours, the system cleanly displays *"Updated location not available"*.

### ⚙️ 4. Administrative Management Portal
- **Admin-Only Auth:** Direct app access for users. Administrative credentials (`admin` / `Damu@123`) secure the CRUD features.
- **Route & Stop Management:** Admin can add, edit, or delete districts, bus names, source times, destination times, base pricing, intermediate stops, and stop ticket fares.
- **Live passed Stop Monitor:** Admin panel displays active crowdsourced passed stops on administrative bus cards in real-time.

### 🎨 5. Futuristic 3D Glassmorphic UI/UX
- **Smooth Layout Transitions:** Chatbot begins centered on page load. Once a query is entered, the chatbot card **smoothly glides to the left**, and the results panel **slides and fades in on the right** side (`1fr 1.1fr` split).
- **Floating 3D Bus Cards:** Gorgeous visual timelines, live pulse indicators, and collapsible routing tables inside interactive translucent glass blocks.
- **Scrolling Backdrop Highway:** A fully visible vector bus moving continuously across a scrolling black highway with white lane markings. The bus dynamically shifts colors based on the selected theme (Blue Dashboard -> Red Bus; Red Dashboard -> Blue Bus) and never blocks inputs.

---

## 🛠️ Technology Stack

**Backend:**
- **Node.js** & **Express.js** (ES Modules configuration)
- **MongoDB** via **Mongoose** ORM
- **Groq SDK** (Llama-3.1-8B-Instant model)
- **jsonwebtoken** & **bcryptjs** (Secure admin authorization)

**Frontend:**
- **React.js** & **Vite** (Optimized bundler)
- **React Router Dom**
- **Axios** (API communications client)
- **Vanilla CSS3** (HSL variables, glassmorphism, 3D shadows, fluid keyframes)

---

## 📦 Installation & Local Setup

### 1. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `server/` directory and configure the variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_uri
   JWT_SECRET=your_jwt_signature_secret
   GROQ_API_KEY=your_groq_llama_api_key
   ```
4. Seed the database with the initial transit routes:
   ```bash
   node seed_bus_routes.js
   ```
5. Start the backend developer daemon:
   ```bash
   npm run dev
   ```
   The backend will launch on `http://localhost:5000`

### 2. Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite dev server:
   ```bash
   npm run dev
   ```
   The frontend application will launch on `http://localhost:5173`

---

## 🔒 Security & Git Protection
The project includes a comprehensive root-level `.gitignore` file that prevents heavy files and environment keys from leaking online. Sensitive credentials (`server/.env`) and package directories are untracked globally, making it completely safe to clone and push:
```bash
git status # check excluded assets
```

---

## 📜 License
This project is licensed under the MIT License.
