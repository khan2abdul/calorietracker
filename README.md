Smart Calorie Tracker

A modern, iOS-style calorie and fitness tracker built with React, Tailwind CSS, and Lucide Icons.

Features

Tri-Ring Dashboard: Track Calories, Burn, and Water in a single glance.

Smart AI Logging: Add meals and exercises using natural language.

3-Way Theme: Switch between Light, Dark (Neon), and Wooden themes.

Fitness Hub: Track body stats and predict weight goals.

Energy Reports: Visualize calorie history with interactive graphs.

Setup & Installation

Clone the repository.

Install dependencies:

npm install


Create a .env file in the root directory and add your Gemini API key (if using AI features):

VITE_GEMINI_API_KEY=your_api_key_here


(Note: You will need to update App.jsx to read this variable using import.meta.env.VITE_GEMINI_API_KEY)

Run the development server:

npm run dev


Deployment

This project is ready to deploy on Vercel, Netlify, or GitHub Pages.

Build

npm run build
