# 🌐 WordTrainer - Conversational English Mastery

**WordTrainer** is a modern web application for practicing English vocabulary, combining AI-powered translations with proven learning techniques like Flashcards and Matching Games.

Built on **Next.js 16**, **Supabase**, and **AI SDK**, it provides a premium user experience with a focus on speed, aesthetics, and meaningful learning.

---

## 🚀 Key Features

### 🧠 AI-Powered Intelligence
- **Instant Translation**: Get precise translations powered by Groq/Google AI.
- **Contextual Examples**: Automatically generate usage examples for every word to improve retention.
- **Auto-Correction**: Smart typo fixing and word validation during the entry process.

### 🃏 Advanced Training Workflow
- **Flashcards (DuoCards Mode)**: High-performance gesture control (swipe left/right) with realistic physics-based animations.
- **Matching Game**: A consolidation phase where you match words to translations against the clock.
- **Two-Stage Cycle**: Ensures a transition from passive recognition to active recall.

### 💾 Persistence & Reliability
- **Zustand Persistence**: Your training progress is instantly saved to `localStorage`. Refresh the page or switch tabs, and you'll resume exactly where you left off.
- **Session Lock**: A robust server-side pre-fetching mechanism that eliminates UI flickering during navigation.

---

## 🛠️ Tech Stack

**Frontend:**
- **Next.js 15 (App Router)**: High performance and server-side rendering.
- **Zustand**: State management with persistence middleware.
- **Framer Motion**: Smooth, premium UI animations.
- **Tailwind CSS & Shadcn UI**: Modern, responsive, and "glassmorphism" design.

**Backend & AI:**
- **Supabase (PostgreSQL, Auth)**: Backend-as-a-service for data storage and authentication.
- **AI SDK**: Flexible integration with Groq for AI-powered translations and auto-correction.

---

## 🏗️ Authentication

- **Email/password** authentication
- **Google OAuth** via Supabase
- **Redirect-based** flow (/auth/callback)
- **Session management** via JWT and cookies

---

## 🏗️ Project Structure

- `app/train/` - Training session logic and components.
- `app/words/` - Word list management and details.
- `app/add-word/` - AI-driven form for quick vocabulary entry.
- `lib/store/` - Zustand store for state persistence.
- `components/ui/` - Custom UI component library.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/elena-savitskaya/a-manager.git
cd a-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables (.env.local)

```env
Create .env.local file with the following variables:

NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key

# Vercel Deployment URL (no trailing slash)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# GROQ API key — https://console.groq.com/keys
GROQ_API_KEY=your-real-key

# Google OAuth (for Auth)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 4. Run the App

```bash
npm run dev
```

---

## 🎨 Design Principles
The app utilizes a **Premium Dark Mode** with focus on gradients, micro-animations, and tactile feedback (active:scale-95), providing the feel of a native mobile application.
