# 🏃 Smart Calorie Tracker

A premium, high-performance web application designed for comprehensive fitness and nutrition tracking. Built with a sleek dark-themed aesthetic, it integrates real-time GPS workout tracking, manual activity logging, and AI-powered insights.

## 🚀 Live Demo
**URL:** [https://calorie-tracker-a234f.web.app](https://calorie-tracker-a234f.web.app)

---

## ✨ Key Features

### 🍎 Nutrition & Intake
- **Meal Logging:** Categorize entries into Breakfast, Lunch, Dinner, or Snacks.
- **Macro Tracking:** Real-time breakdown of Protein, Carbs, and Fats.
- **Dynamic Calorie Ring:** Visual guide showing remaining calories vs. daily goal (Adjusts automatically for burned calories).

### 🏃 Workout Tracking Module
- **Live GPS Tracking:** Record outdoor activities (Running, Walking, Cycling) with real-time route rendering using Leaflet maps.
- **Manual Logs:** Quick-entry for gym sessions, skipping, or other off-map activities.
- **Auto-Calorie Calculation:** Precise burn estimation based on user weight and activity intensity (MET values).

### 📊 History & Analytics
- **Historical Diary:** Scrollable feed of past nutrition and activity logs with infinite-scroll pagination.
- **Energy Reports:** Monthly calendar view with workout indicators (🏃) and daily net energy summaries (Eaten vs. Burned).
- **Weekly Stats:** Instant dashboard for sessions completed, distance covered, and total calories burned this week.

### 🤖 AI Integration
- **Gemini Coach:** AI-powered analysis of your daily habits, providing personalized praise and actionable advice based on your intake and activity levels.

---

## 🛠️ Tech Stack
- **Frontend:** React.js + Vite
- **Styling:** Tailwind CSS (Vanilla CSS focus for premium aesthetics)
- **Database:** Firebase Firestore (Real-time listeners)
- **Auth:** Firebase Authentication
- **Maps:** Leaflet & React-Leaflet
- **Icons:** Lucide-React

---

## ⚙️ Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/khan2abdul/calorietracker.git
   cd calorietracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   Create a `.env` file or update `src/firebase.js` with your Firebase project credentials.

4. **Run Locally:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

## 📜 License
MIT License. Feel free to use and modify for personal use!

---
*Created with ❤️ by Antigravity*
