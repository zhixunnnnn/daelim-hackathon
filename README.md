# AstraSemi - Semiconductor Operations Platform

A comprehensive web application for semiconductor operations analysis, featuring AI-powered CSV analysis, text interpretation, image recognition, and a comprehensive glossary.

## Features

- **Module 1: CSV Analysis** - Upload and analyze semiconductor operational CSV files with AI-powered insights
- **Module 2: Text Interpretation** - Interpret and convert semiconductor work-related text messages
- **Module 3: Image Recognition** - Analyze semiconductor manufacturing images with AI vision
- **Module 4: Glossary** - Searchable dictionary of semiconductor terms with AI-enhanced explanations
- **Dashboard** - Real-time analytics and quick access to all modules

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- i18next for internationalization (English/Korean)
- Lucide React for icons
- React Markdown for content rendering

### Backend
- Flask (Python)
- OpenAI API integration (GPT-4o, GPT-4o-mini)
- Pandas for CSV processing
- Flask-CORS for cross-origin support

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- OpenAI API key

## Quick Start

### Option 1: Use Startup Scripts (Recommended)

**macOS/Linux:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

### Option 2: Manual Start

**1. Backend Setup:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**2. Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

**3. Environment Variables:**
Create a `.env` file in the `backend` directory:
```
OPENAI_API_KEY=your_api_key_here
```

## Development

### Project Structure
```
react-python-app/
├── backend/
│   ├── app.py              # Flask API server
│   ├── data/
│   │   └── glossary_terms.json
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── utils/          # Utilities (analytics, error handling)
│   │   ├── Dashboard.tsx
│   │   ├── Module1.tsx     # CSV Analysis
│   │   ├── Module2.tsx     # Text Interpretation
│   │   ├── Module3.tsx     # Image Recognition
│   │   └── Module4.tsx     # Glossary
│   └── package.json
├── start.sh                # Startup script (Unix)
├── start.bat               # Startup script (Windows)
└── README.md
```

### API Endpoints

- `POST /api/analyze-csv` - Analyze CSV files
- `POST /api/interpret-text` - Interpret text messages
- `POST /api/convert-text` - Convert text to email/update
- `POST /api/analyze` - Analyze images
- `GET /api/glossary/search` - Search glossary terms
- `GET /api/glossary/term/<term_id>` - Get term details
- `POST /api/glossary/ai-explain` - Get AI explanation
- `POST /api/glossary/related-terms` - Get related terms

### Error Handling

The application includes production-grade error handling:
- Centralized error handler (`frontend/src/utils/errorHandler.ts`)
- Proper logging in backend (Python logging module)
- User-friendly error messages
- Network error detection

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Proper error boundaries
- Production-ready logging

## Deployment

### Backend
The Flask app runs on port 5001 by default. For production:
- Use a production WSGI server (e.g., Gunicorn)
- Set `debug=False`
- Configure proper CORS settings
- Use environment variables for secrets

### Frontend
Build for production:
```bash
cd frontend
npm run build
```

The output will be in `frontend/dist/` directory.

## License

Private - AstraSemi Corporation
