# 🎬 CineGemini

**CineGemini** is a premium, AI-first cinema discovery and streaming platform. Powered by the Google Gemini API, it transcends traditional search by acting as a neural concierge—analyzing cinematic patterns, providing real-time industry insights, and curating personalized movie multiverses.

![CineGemini Hero](https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop)

## 🚀 Vision

Traditional entertainment platforms rely on rigid tags and metadata. CineGemini uses **Natural Language Understanding (NLU)** and **Real-Time Grounding** to allow users to explore cinema through themes, moods, and abstract concepts.

---

## ✨ Core Features

### 🧠 Neural Discovery Engine
*   **Gemini 3 Flash Integration**: Leverages the latest generative models to understand complex queries like *"movies about existential dread with a neon aesthetic"* or *"limited series that feel like a fever dream."*
*   **AI Insights**: Every search result is accompanied by a unique, model-generated analysis of the current selection's cultural and thematic impact.
*   **Deep Discovery**: A proprietary recommendation system that uses vector-like thematic cross-referencing to suggest "Similar Nodes" that go beyond simple genre matching.

### 🎭 Luxury UI/UX
*   **Cinematic Design System**: A meticulously crafted "Obsidian & Azure" theme featuring glassmorphism, fluid 60FPS animations, and 4K-ready responsive layouts.
*   **Personal Vault**: A sophisticated watchlist management system to curate your private cinema collection.
*   **Hollywood Pulse**: Integrated global news engine (via GNews API) providing real-time updates on the industry, synchronized with cinematic aesthetics.

### 📺 Advanced Streaming Hub
*   **Multi-Server Node Switching**: Integrated video player with 6+ high-reliability streaming servers.
*   **Quantum Error Reporting**: Built-in server health monitoring that allows users to switch between streaming nodes instantly if one fails.
*   **Series Management**: Full support for Season/Episode navigation within the neural player interface.

### 💬 AI Concierge Chat
*   **Cinephile AI**: A dedicated chat widget that acts as an expert film historian and recommendation assistant, maintaining conversational context throughout your session.

---

## 🛠 Tech Stack

*   **Core**: [React 19](https://react.dev/)
*   **AI Orchestration**: [@google/genai (Gemini SDK)](https://www.npmjs.com/package/@google/genai)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Metadata**: [OMDb API](http://www.omdbapi.com/)
*   **News**: [GNews API](https://gnews.io/)
*   **State Management**: React Context & Hooks with optimized In-Memory Caching.

---

## 🚦 Getting Started

### Prerequisites
*   A [Google AI Studio API Key](https://aistudio.google.com/)
*   Node.js (v18+)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/cinegemini.git
   cd cinegemini
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file or set the following variable:
   ```env
   API_KEY=YOUR_GEMINI_API_KEY
   ```

4. Start the development server:
   ```bash
   npm start
   ```

---

## 📂 Project Structure

```text
/
├── components/          # Specialized UI Modules
│   ├── MovieCard.tsx    # Neural data visualization
│   ├── DetailModal.tsx  # Deep discovery & metadata
│   ├── VideoPlayer.tsx  # Multi-node streaming interface
│   ├── ChatWidget.tsx   # AI Concierge interface
│   └── NewsSection.tsx  # Industry Pulse engine
├── services/            # Core Logic
│   └── geminiService.ts # SDK Orchestration & Caching
├── types.ts             # Global Type Definitions
├── App.tsx              # Main Application Controller
└── index.html           # Entry Point & CDN Imports
```

---

## 🛡 Performance & Optimization

*   **Intelligent Caching**: `geminiService` implements a `Map`-based cache to prevent redundant API calls for OMDb metadata and similar movie queries.
*   **Lazy Loading**: All posters and news images use native browser lazy-loading to optimize initial paint times.
*   **Memoized Selectors**: Heavy calculations and watchlist checks are handled via `useMemo` to ensure consistent 60FPS performance during scrolling.

---

## 📜 Acknowledgements

*   **Google Gemini Team** for the next-generation LLM capabilities.
*   **OMDb API** for robust movie metadata.
*   **Unsplash** for high-fidelity cinematic placeholder assets.

---

**CineGemini** — *Where Artificial Intelligence meets Art.*
