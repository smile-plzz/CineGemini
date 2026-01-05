
# 🎬 CineVault

**CineVault** is a premium cinematic discovery and streaming platform. Powered by OMDb and GNews APIs, it provides a high-fidelity interface for exploring the global database of film and television.

![CineVault Hero](https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop)

## ✨ Core Features

### 🔍 Precision Search
*   **OMDb Integration**: Comprehensive metadata retrieval including high-resolution posters, Metascores, and IMDB ratings.
*   **Rich Metadata**: Every title features full plot synopses, director details, and cast lists.
*   **Genre Discovery**: Intelligent genre-based suggestions for exploring similar content.

### 🎭 Luxury UI/UX
*   **Cinematic Design System**: A meticulously crafted "Obsidian & Azure" theme featuring fluid 60FPS animations and responsive layouts.
*   **Personal Vault**: A sophisticated watchlist management system to curate your private cinema collection.
*   **Hollywood Pulse**: Integrated global news engine providing real-time industry updates.

### 📺 Advanced Streaming Hub
*   **Multi-Server Node Switching**: Integrated video player with 6+ high-reliability streaming nodes.
*   **Error Monitoring**: Built-in server health monitoring that allows users to switch between streaming nodes instantly if one fails.

---

## 🛠 Tech Stack

*   **Core**: [React 19](https://react.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Metadata**: [OMDb API](http://www.omdbapi.com/)
*   **News**: [GNews API](https://gnews.io/)

---

## 📂 Project Structure

```text
/
├── components/          # UI Modules
│   ├── MovieCard.tsx    # Title visualization
│   ├── DetailModal.tsx  # Metadata & discovery
│   ├── VideoPlayer.tsx  # Streaming interface
│   └── NewsSection.tsx  # Industry Pulse engine
├── services/            # Core Logic
│   └── geminiService.ts # OMDb Orchestration & Caching
├── types.ts             # Global Type Definitions
├── App.tsx              # Main Controller
└── index.html           # Entry Point
```

---

## 📜 Acknowledgements

*   **OMDb API** for robust movie metadata.
*   **GNews** for real-time headlines.
*   **Unsplash** for cinematic placeholder assets.

**CineVault** — *Premium Cinema Discovery.*
