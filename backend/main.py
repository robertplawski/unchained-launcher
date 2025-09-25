from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from fastapi.middleware.cors import CORSMiddleware

#!/usr/bin/env python3
import os
import subprocess
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import requests
import time
import json
from PIL import Image
from io import BytesIO

# -------------------- CONFIG --------------------
BASE_DIR = Path.home() / "Games"
DATA_DIR = BASE_DIR / "data"
PREFIXES_DIR = BASE_DIR / "prefixes"
SAVES_DIR = BASE_DIR / "saves"
METADATA_DIR = BASE_DIR / "metadata"

for d in [DATA_DIR, PREFIXES_DIR, SAVES_DIR, METADATA_DIR]:
    d.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Game Launcher API")
# -------------------- CORS --------------------
origins = [
  "*",  # Optional: allow all origins (good for local development)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, etc
    allow_headers=["*"],
)


# IGDB API credentials
IGDB_CLIENT_ID = "laerj6vf8mku8gvypqnz6te10cnnqk"
IGDB_CLIENT_SECRET = "61ihdu0laj8zerj1r19omw25yckxnf"
IGDB_TOKEN = None
IGDB_TOKEN_EXPIRES = 0
IGDB_URL = "https://api.igdb.com/v4/games"

def get_igdb_token():
    """Generate a new IGDB access token if expired or missing."""
    global IGDB_TOKEN, IGDB_TOKEN_EXPIRES
    now = int(time.time())
    if IGDB_TOKEN is None or now >= IGDB_TOKEN_EXPIRES:
        resp = requests.post(
            "https://id.twitch.tv/oauth2/token",
            data={
                "client_id": IGDB_CLIENT_ID,
                "client_secret": IGDB_CLIENT_SECRET,
                "grant_type": "client_credentials"
            }
        )
        if resp.status_code == 200:
            data = resp.json()
            IGDB_TOKEN = data["access_token"]
            IGDB_TOKEN_EXPIRES = now + data["expires_in"] - 60  # refresh 1 min early
            print(f"[IGDB] New token obtained, expires in {data['expires_in']}s")
        else:
            raise RuntimeError(f"Failed to get IGDB token: {resp.status_code} {resp.text}")
    return IGDB_TOKEN



def fetch_game_metadata(game_name: str):
    game_metadata_dir = METADATA_DIR / game_name
    screenshots_dir = game_metadata_dir / "screenshots"
    artworks_dir = game_metadata_dir / "artworks"
    logos_dir = game_metadata_dir / "logos"
    game_metadata_dir.mkdir(exist_ok=True)
    screenshots_dir.mkdir(exist_ok=True)
    artworks_dir.mkdir(exist_ok=True)
    logos_dir.mkdir(exist_ok=True)

    metadata_json_path = game_metadata_dir / "metadata.json"
    cover_path = game_metadata_dir / "cover.jpg"
    big_path = game_metadata_dir / "big.jpg"

    # Skip if metadata exists
    if metadata_json_path.exists():
        return json.load(open(metadata_json_path, encoding="utf-8"))

    token = get_igdb_token()
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    # Escape quotes in game_name to prevent broken query
    import re
    safe_game_name = re.sub(r'"', '', game_name)

    fields = "name,cover.url,genres.name,platforms.name,first_release_date,summary,screenshots.url,artworks.url,websites.url"
# Filter for PC games only (platform ID 6 = PC) and main games only (category 0 = main game)
    # Search already sorts by relevance internally
    query = f'search "{safe_game_name}"; fields {fields}; where platforms = (6) & game_type= 0; limit 1;'
    
    resp = requests.post(IGDB_URL, headers=headers, data=query)
    if resp.status_code == 401:  # token expired
        token = get_igdb_token()
        headers["Authorization"] = f"Bearer {token}"
        resp = requests.post(IGDB_URL, headers=headers, data=query)

    if resp.status_code != 200:
        print(f"[IGDB] Failed for {game_name}: {resp.status_code} {resp.text}")
        return None

    games = resp.json()
    if not games:
        return None
    game = games[0]

    # ----- Cover -----
    cover_url = game.get("cover", {}).get("url")
    if cover_url:
        if cover_url.startswith("//"):
            cover_url = "https:" + cover_url
        Image.open(BytesIO(requests.get(cover_url.replace("t_thumb", "t_cover_big")).content)).save(cover_path)
        Image.open(BytesIO(requests.get(cover_url.replace("t_thumb", "t_720p")).content)).save(big_path)

    # ----- Screenshots -----
    for idx, sc in enumerate(game.get("screenshots", []), start=1):
        sc_url = sc.get("url")
        if sc_url:
            if sc_url.startswith("//"):
                sc_url = "https:" + sc_url
            sc_hd_url = sc_url.replace("t_thumb", "t_screenshot_huge")
            try:
                Image.open(BytesIO(requests.get(sc_hd_url, timeout=10).content)).save(screenshots_dir / f"{idx}.jpg")
            except Exception as e:
                print(f"[IGDB] Failed to download screenshot {idx} for {game_name}: {e}")

    # ----- Artworks -----
    for idx, art in enumerate(game.get("artworks", []), start=1):
        art_url = art.get("url")
        if art_url:
            if art_url.startswith("//"):
                art_url = "https:" + art_url
            art_hd_url = art_url.replace("t_thumb", "t_1080p")
            try:
                Image.open(BytesIO(requests.get(art_hd_url, timeout=10).content)).save(artworks_dir / f"{idx}.jpg")
            except Exception as e:
                print(f"[IGDB] Failed to download artwork {idx} for {game_name}: {e}")

    # ----- Logos -----
    for idx, logo in enumerate(game.get("logos", []), start=1):
        logo_url = logo.get("url")
        if logo_url:
            if logo_url.startswith("//"):
                logo_url = "https:" + logo_url
            logo_hd_url = logo_url.replace("t_thumb", "t_720p")
            try:
                Image.open(BytesIO(requests.get(logo_hd_url, timeout=10).content)).save(logos_dir / f"{idx}.png")
            except Exception as e:
                print(f"[IGDB] Failed to download logo {idx} for {game_name}: {e}")

    # ----- Steam ID (optional) -----
    steam_id = None
    for site in game.get("websites", []):
        if site.get("category") == 1:  # Steam
            import re
            match = re.search(r"/app/(\d+)", site.get("url", ""))
            if match:
                steam_id = match.group(1)
                break

    # ----- Build metadata dict -----
    metadata_dict = {
        "name": game.get("name"),
        "genres": [g["name"] for g in game.get("genres", [])] if game.get("genres") else [],
        "platforms": [p["name"] for p in game.get("platforms", [])] if game.get("platforms") else [],
        "first_release_date": game.get("first_release_date"),
        "summary": game.get("summary"),
        "cover": f"/metadata/{game_name}/cover.jpg" if cover_url else None,
        "big": f"/metadata/{game_name}/big.jpg" if cover_url else None,
        "screenshots": [f"/metadata/{game_name}/screenshots/{i+1}.jpg" for i in range(len(game.get("screenshots", [])))] if game.get("screenshots") else [],
        "artworks": [f"/metadata/{game_name}/artworks/{i+1}.jpg" for i in range(len(game.get("artworks", [])))] if game.get("artworks") else [],
        "logos": [f"/metadata/{game_name}/logos/{i+1}.png" for i in range(len(game.get("logos", [])))] if game.get("logos") else [],
        "steam_id": steam_id
    }

    with open(metadata_json_path, "w", encoding="utf-8") as f:
        json.dump(metadata_dict, f, indent=2)

    print(f"[IGDB] Saved metadata (covers/screenshots/artworks/logos) for {game_name}")
    return metadata_dict

# -------------------- Game Scanner --------------------
def get_directory_size_mb(path):
    """Get directory size in megabytes using pathlib"""
    path = Path(path)
    total_size = sum(f.stat().st_size for f in path.rglob('*') if f.is_file())
    return total_size / (1024 * 1024)

def scan_games():
    games = []
    for dir_name in os.listdir(DATA_DIR):
        dir_path = DATA_DIR / dir_name
        if not dir_path.is_dir():
            continue

        # Read AppID if available
        appid_path = dir_path / "steam_appid.txt"
        appid = None
        if appid_path.is_file():
            appid = appid_path.read_text(encoding="utf-8").strip()

        # Find .exe filesplatforms: Array(9) [ "Xbox Series X|S", "PlayStation 4", "Android", … ]
        exe_files = [f.name for f in dir_path.iterdir() if f.is_file() and f.suffix.lower() == ".exe"]

        if exe_files:
            # Fetch metadata while scanning
            metadata = fetch_game_metadata(dir_name)

            games.append({
                "id": len(games),
                "name": dir_name,
                "appid": appid,
                "exes": exe_files,
                "path": dir_path,
                "metadata": metadata,
                "size":get_directory_size_mb(dir_path)
            })
    return games

games_cache = scan_games()

# -------------------- Models --------------------



class GameMetadata(BaseModel):
    cover: Optional[str]
    big: Optional[str]
    screenshots: Optional[List[str]] = []
    artworks: Optional[List[str]] = []
    genres: Optional[List[str]] = []
    platforms: Optional[List[str]] = []
    first_release_date: Optional[int]
    summary: Optional[str]
    steam_id: Optional[str]

class GameInfo(BaseModel):
    id: int
    name: str
    appid: Optional[str]
    exes: List[str]
    metadata: Optional[GameMetadata]
    size:float 

class LaunchRequest(BaseModel):
    exe: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 10



# -------------------- Endpoints --------------------


@app.get("/api/library", response_model=List[GameInfo])
def list_games():
    return games_cache

@app.post("/api/refresh")
def refresh_games():
    global games_cache
    games_cache = scan_games()
    return {"message": "Game list refreshed", "count": len(games_cache)}

@app.post("/api/search")
def search_games(request: SearchRequest):
    """Search for games using IGDB API"""
    token = get_igdb_token()
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    # Escape quotes in query to prevent broken query
    import re
    safe_query = re.sub(r'"', '', request.query)
    
    limit = min(request.limit or 10, 50)  # Default to 10 if None, max 50
    
    fields = "name,cover.url,genres.name,platforms.name,first_release_date,summary,screenshots.url,artworks.url,websites.url,rating,total_rating"
    # filter for pc games only (platform id 6 = pc) and main games only (category 0 = main game)
    # search already sorts by relevance internally
    query = (
        f'fields {fields}; '
        f'search "{safe_query}"; '
        f'where platforms = (6) & game_type = 0; '
            #f'sort rating desc; '
        f'limit {limit};'
    )

    resp = requests.post(IGDB_URL, headers=headers, data=query)
    if resp.status_code == 401:  # token expired
        token = get_igdb_token()
        headers["Authorization"] = f"Bearer {token}"
        resp = requests.post(IGDB_URL, headers=headers, data=query)
    
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=f"IGDB API error: {resp.text}")
    
    import difflib
    games = resp.json()
    games = [g for g in games if 'rating' in g and g['rating'] is not None]
    games =sorted(
        games,
        key=lambda g: difflib.SequenceMatcher(None, g.get('name', ''), safe_query).ratio(),
        reverse=True
    )
    #games = sorted(
    #    games,
    #    key = lambda g: g.get('rating',0),
    #    reverse=True
    #)
    
    # Process the games to match our metadata format
    processed_games = []
    for game in games:
        # Process cover URL
        cover_url = game.get("cover", {}).get("url")
        if cover_url and cover_url.startswith("//"):
            cover_url = "https:" + cover_url
            
        # Process screenshots
        screenshots = []
        for sc in game.get("screenshots", []):
            sc_url = sc.get("url")
            if sc_url and sc_url.startswith("//"):
                sc_url = "https:" + sc_url
            screenshots.append(sc_url)
            
        # Process artworks
        artworks = []
        for art in game.get("artworks", []):
            art_url = art.get("url")
            if art_url and art_url.startswith("//"):
                art_url = "https:" + art_url
            artworks.append(art_url)
            
        # Process Steam ID
        steam_id = None
        for site in game.get("websites", []):
            if site.get("category") == 1:  # Steam
                import re
                match = re.search(r"/app/(\d+)", site.get("url", ""))
                if match:
                    steam_id = match.group(1)
                    break
        
        processed_game = {
            "name": game.get("name"),
            "genres": [g["name"] for g in game.get("genres", [])] if game.get("genres") else [],
            "platforms": [p["name"] for p in game.get("platforms", [])] if game.get("platforms") else [],
            "first_release_date": game.get("first_release_date"),
            "summary": game.get("summary"),
            "rating": game.get("rating"),
            "total_rating": game.get("total_rating"),
            "cover": cover_url,
            "screenshots": screenshots,
            "artworks": artworks,
            "steam_id": steam_id
        }
        processed_games.append(processed_game)
        
    return {"games": processed_games, "count": len(processed_games)}

app.mount("/api/metadata", StaticFiles(directory=METADATA_DIR), name="metadata")


frontend_path = os.path.join(os.path.dirname(__file__), "../frontend/dist")

app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

# Ensure React router works (fallback to index.html)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    return FileResponse(os.path.join(frontend_path, "index.html"))


# -------------------- Run server --------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
