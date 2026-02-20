import os
import json
import logging
from typing import List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Gemini Config
api_key = os.getenv("GOOGLE_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

app = FastAPI(title="ASMR Zen Experience API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SessionRequest(BaseModel):
    theme: str

class AudioLayer(BaseModel):
    name: str
    url: str
    initialVolume: float

class SessionResponse(BaseModel):
    title: str
    script: str
    layers: List[AudioLayer]
    colors: Dict[str, str]

# Mock sound library (real implementation would have more or use cloud storage)
SOUND_LIBRARY = {
    "rain": "https://www.soundjay.com/nature/sounds/rain-01.mp3",
    "forest": "https://www.soundjay.com/nature/sounds/forest-wind-1.mp3",
    "waves": "https://www.soundjay.com/nature/sounds/ocean-waves-1.mp3",
    "fire": "https://www.soundjay.com/nature/sounds/fire-1.mp3",
    "white-noise": "https://www.soundjay.com/misc/sounds/white-noise-1.mp3"
}

@app.get("/")
async def root():
    return FileResponse('index.html')

@app.get("/style.css")
async def css():
    return FileResponse('style.css')

@app.get("/script.js")
async def js():
    return FileResponse('script.js')

@app.post("/create-session", response_model=SessionResponse)
async def create_session(request: SessionRequest):
    prompt = f"""
    Create a Zen ASMR session configuration for the theme: "{request.theme}".
    Return a JSON object with:
    - title: A calming title.
    - script: A 2-3 sentence relaxation message.
    - layers: An array of 2-3 objects with 'name' (must be from: rain, forest, waves, fire, white-noise) and 'initialVolume' (0.1 to 0.8).
    - colors: A dict with 'primary' and 'secondary' hex codes representing the mood.
    Return ONLY JSON.
    """
    
    try:
        if not api_key:
            raise ValueError("No API Key")
            
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Cleanup
        if text.startswith("```json"): text = text[7:]
        if text.endswith("```"): text = text[:-3]
        
        data = json.loads(text.strip())
        
        # Map names to URLs
        layers = []
        for l in data.get('layers', []):
            name = l.get('name', 'rain').lower()
            layers.append(AudioLayer(
                name=name.capitalize(),
                url=SOUND_LIBRARY.get(name, SOUND_LIBRARY['rain']),
                initialVolume=l.get('initialVolume', 0.5)
            ))
            
        return SessionResponse(
            title=data.get('title', 'Zen Peace'),
            script=data.get('script', 'Close your eyes and breathe.'),
            layers=layers,
            colors=data.get('colors', {'primary': '#1a2a6c', 'secondary': '#b21f1f'})
        )
        
    except Exception as e:
        logger.error(f"Error: {e}")
        # Fallback
        return SessionResponse(
            title=f"Peaceful {request.theme}",
            script=f"Let the gentle sounds of {request.theme} wash over you. Deep breath in, slow release.",
            layers=[
                AudioLayer(name="Soft Rain", url=SOUND_LIBRARY['rain'], initialVolume=0.4),
                AudioLayer(name="Nature Wind", url=SOUND_LIBRARY['forest'], initialVolume=0.2)
            ],
            colors={"primary": "#2c3e50", "secondary": "#4ca1af"}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
