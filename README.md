# 🚨 CrisisLens AI

### AI-Powered Emergency Intelligence Platform

CrisisLens AI is an AI-powered emergency intelligence platform designed to support faster and smarter disaster response.

It analyzes disaster images, evaluates incident risk and severity, identifies locations, displays incidents on an interactive map, provides emergency alerts, generates analytics, and recommends response actions.

---

## 🌐 Live Demo

**Frontend:**  
https://crisis-lens-ai-beta.vercel.app

**GitHub:**  
https://github.com/loges-waran/CrisisLens-AI

---

## ✨ Key Features

### 🤖 AI Disaster Image Analysis
Upload a disaster-related image and CrisisLens AI uses a Hugging Face image classification model to identify possible disaster categories.

### ⚠️ Risk & Severity Analysis
The system evaluates incident information and calculates:
- Risk level
- Severity
- Risk score
- Emergency priority

### 🗺️ Location Intelligence
Users can search for locations and view incident information based on geographic location.

### 🌍 Interactive Disaster Map
Incidents are displayed using an interactive Leaflet map with OpenStreetMap.

### 🚨 Live Emergency Alerts
The platform provides emergency alerts based on incident information and risk levels.

### 📊 AI Analytics Dashboard
Displays emergency intelligence through analytics including:
- Total incidents
- Risk distribution
- Severity information
- Incident statistics

### 🧭 Emergency Response Plan
CrisisLens AI generates recommended response actions based on incident severity and risk.

### 🧠 AI Decision Explanation
The platform provides explanations for AI-generated risk and response decisions.

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │     User / Admin    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │      + Vite         │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │ AI Vision   │  │   SQLite    │  │ Risk &      │
       │ Model       │  │  Database   │  │ Response    │
       └─────────────┘  └─────────────┘  └─────────────┘
              │
              ▼
       Disaster Image
       Classification