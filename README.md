# ASMR Zen Generator

A premium web application that generates customizable ASMR audio experiences tailored by AI. Users can select from predefined themes or describe their desired mood, and the AI (Gemini 1.5 Flash) curates a matching soundscape with layered audio controls and a personalized relaxation script.

## Core Features
- **AI-Powered Curation**: Gemini AI analyzes your mood/theme to suggest a "recipe" of sounds.
- **Layered Audio Player**: Mix up to 3 different ambient sounds (Rain, Nature, Ocean, Fire, White Noise) with individual volume sliders.
- **Zen Aesthetics**: A beautiful, minimalist UI with dynamic glassmorphism and soft color transitions.
- **Responsive Design**: Works perfectly on desktop and mobile.

## Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript.
- **Backend**: FastAPI (Python).
- **LLM**: Google Gemini API for session and script generation.

## How to Run Locally

### 1. Requirements
- Python 3.8+
- A Google Gemini API Key (Optional: App includes fallback mock if not provided)

### 2. Setup
```bash
# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the project root:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

### 4. Run the Server
```bash
python main.py
```
Visit `http://localhost:8000` in your browser.

## Built with ❤️ for Peace and Relaxation.
