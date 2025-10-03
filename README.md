# Parallax

Real-time 3D solar system visualization with AI-powered search through NASA documents.

## Features

- **Real-time visualization**: 8 planets, ISS position updates every 5 seconds
- **Hybrid search**: BM25 + semantic search through NASA mission documents
- **Zero backend**: Everything runs in your browser after initial load
- **Smart navigation**: Search "Cassini" → camera flies to Saturn
- **Fast**: 50ms search through 5,000 documents

## Tech Stack

- **Frontend**: TypeScript + Three.js
- **Search**: EdgeRAG (Rust → WASM)
- **Embeddings**: EdgeBERT (384-dim MiniLM)
- **Data**: NASA mission reports, press kits, technical docs

## Quick Start
```bash
npm install
npm run dev
```

Open http://localhost:5173

## Search examples:
- **ISS** → Shows International Space Station orbit
- **Mars rovers** → Flies to Mars, shows mission documents
- **Saturn rings** → Shows Cassini mission findings

## Controls
- Mouse: Orbit camera (drag), zoom (scroll)
- Keys: 1-8 for planets, 0 for sun
- Search: Type query, press Enter

## Architecture
- Three.js (3D visualization)
- EdgeBERT (text → embeddings)
- EdgeRAG (hybrid search)
- NASA data (pre-indexed)

## Completely Local, no backend (WASM RAG, WASM BERT Model)
- No server calls except ISS position API.


## License
MIT

## Related


![EdgeRAG - Client-side RAG engine](https://github.com/olafurjohannsson/edgebert)
![EdgeBERT - BERT in Rust/WASM](https://github.com/olafurjohannsson/edgebert)
