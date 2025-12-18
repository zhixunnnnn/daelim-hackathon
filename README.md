# React + TypeScript + Python Full Stack App

A full-stack application with React + TypeScript frontend (Vite) and Python Flask backend.

## Project Structure

```
react-python-app/
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Python Flask backend
│   ├── app.py
│   └── requirements.txt
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
```

3. Activate the virtual environment:
```bash
# On macOS/Linux
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

- `GET /api/hello` - Returns a greeting message
- `GET /api/data` - Returns a list of sample items

## Development

1. Start the backend server first (on port 5000)
2. Start the frontend dev server (on port 5173)
3. The frontend has a proxy configured to forward `/api` requests to the backend

## Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- CSS

### Backend
- Python 3
- Flask
- Flask-CORS
