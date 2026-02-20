import os
import json
import logging
from typing import List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

app = FastAPI()

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

# Reliable hotlinkable audio from Wikimedia Commons
SOUND_LIBRARY = {
    "rain": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Rain_on_the_roof.mp3",
    "forest": "https://upload.wikimedia.org/wikipedia/commons/b/b0/Forest_ambience_with_birds.mp3",
    "waves": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Ocean_waves_rolling_onto_the_shore.mp3",
    "fire": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Fire_in_the_fireplace.mp3",
    "white-noise": "https://upload.wikimedia.org/wikipedia/commons/e/e5/White_noise.ogg"
}

@app.get("/")
async def hello():
    return {"message": "ASMR API is running"}

@app.post("/", response_model=SessionResponse)
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
        
        # Cleanup markdown fences
        if text.startswith("```json"): text = text[7:]
        if text.endswith("```"): text = text[:-3]
        
        data = json.loads(text.strip())
        
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
        return SessionResponse(
            title=f"Peaceful {request.theme}",
            script=f"Let the gentle sounds of {request.theme} wash over you. Deep breath in, slow release.",
            layers=[
                AudioLayer(name="Soft Rain", url=SOUND_LIBRARY['rain'], initialVolume=0.4),
                AudioLayer(name="Nature Wind", url=SOUND_LIBRARY['forest'], initialVolume=0.2)
            ],
            colors={"primary": "#2c3e50", "secondary": "#4ca1af"}
        )
