# Soulstices Activity Hub

A community-driven platform for discovering and joining local activities in Bhopal, Madhya Pradesh.

## What can I do today evening?

Soulstices Activity Hub answers this question by connecting people with sports and leisure activities happening in their city.

## Features

- Browse activities happening today and throughout the week
- Discover groups organizing various sports and leisure activities
- View activity details: location, time, expected duration, and cost
- Dark-themed, modern interface

## Tech Stack

- **Frontend**: React + Vite, Tailwind CSS
- **Backend**: Node.js + Express
- **Data**: JSON files (will migrate to database later)

## Getting Started

See `SETUP_INSTRUCTIONS.md` for detailed setup steps.

### Quick Start

1. Install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Run the application (in two terminals):
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

3. Open http://localhost:5173 in your browser

## Project Structure

```
soulstices-activity-hub/
├── backend/           # Node.js/Express server
│   ├── data/         # JSON data files
│   ├── routes/       # API routes
│   └── server.js     # Main server file
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── index.html
└── README.md
```

## Target Launch

January 1, 2026 - Bhopal, Madhya Pradesh

## License

Private Project - All Rights Reserved