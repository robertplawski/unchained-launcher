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
    """
    Fetch metadata from IGDB and save in ~/Games/metadata/<GameName>/:
        - cover.jpg
        - big.jpg
        - screenshots/ (all screenshots from IGDB)
        - metadata.json (includes genres, platforms, summary, release date)
    """
    game_metadata_dir = METADATA_DIR / game_name
    screenshots_dir = game_metadata_dir / "screenshots"
    game_metadata_dir.mkdir(exist_ok=True)
    screenshots_dir.mkdir(exist_ok=True)

    metadata_json_path = game_metadata_dir / "metadata.json"
    cover_path = game_metadata_dir / "cover.jpg"
    big_path = game_metadata_dir / "big.jpg"

    # Skip if metadata already exists
    if metadata_json_path.exists():

        return json.load(open(metadata_json_path))#str(game_metadata_dir)

    token = get_igdb_token()
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }

    # Request cover, genres, platforms, summary, release date, screenshots
    fields = "name,cover.url,genres.name,platforms.name,first_release_date,summary,screenshots.url"
    data = f'fields {fields}; search "{game_name}";'

    resp = requests.post(IGDB_URL, headers=headers, data=data)

    # Retry if token expired
    if resp.status_code == 401:
        token = get_igdb_token()
        headers["Authorization"] = f"Bearer {token}"
        resp = requests.post(IGDB_URL, headers=headers, data=data)

    if resp.status_code != 200:
        print(f"[IGDB] Failed for {game_name}: {resp.status_code}")
        return None

    games = resp.json()
    if not games:
        return None

    game = games[0]

# Save cover.jpg (large cover)
    cover_url = game.get("cover", {}).get("url")
    if cover_url:
        if cover_url.startswith("//"):
            cover_url = "https:" + cover_url

        # cover.jpg -> t_cover_big
        cover_big_url = cover_url.replace("t_thumb", "t_cover_big")
        img_data = requests.get(cover_big_url).content
        Image.open(BytesIO(img_data)).save(cover_path)

        # big.jpg -> t_720p (HD)
        cover_hd_url = cover_url.replace("t_thumb", "t_720p")
        img_data = requests.get(cover_hd_url).content
        Image.open(BytesIO(img_data)).save(big_path)


    # Ensure screenshots folder exists
    screenshots_dir = game_metadata_dir / "screenshots"
    screenshots_dir.mkdir(exist_ok=True)

    screenshots = game.get("screenshots", [])
    for idx, sc in enumerate(screenshots, start=1):
        sc_url = sc.get("url")
        if sc_url:
            if sc_url.startswith("//"):
                sc_url = "https:" + sc_url
            # Replace t_thumb with t_screenshot_huge for HD
            sc_hd_url = sc_url.replace("t_thumb", "t_screenshot_huge")
            try:
                img_data = requests.get(sc_hd_url, timeout=10).content
                Image.open(BytesIO(img_data)).save(screenshots_dir / f"{idx}.jpg")
            except Exception as e:
                print(f"[IGDB] Failed to download screenshot {idx} for {game_name}: {e}")

    steam_id = None
    for site in game.get("websites", []):
        if site.get("category") == 1:  # 1 = Steam
            url = site.get("url")
            if url:
                # Extract numeric Steam ID from URL if possible
                import re
                match = re.search(r"/app/(\d+)", url)
                if match:
                    steam_id = match.group(1)
                    break


    # Build metadata dictionary
    metadata_dict = {
        "name": game.get("name"),
        "genres": [g["name"] for g in game.get("genres", [])] if game.get("genres") else [],
        "platforms": [p["name"] for p in game.get("platforms", [])] if game.get("platforms") else [],
        "first_release_date": game.get("first_release_date"),
        "summary": game.get("summary"),
        "cover": f"/metadata/{game_name}/cover.jpg" if cover_url else None,
        "big": f"/metadata/{game_name}/big.jpg" if cover_url else None,  # <- ensure this exists
        "screenshots": [f"/metadata/{game_name}/screenshots/{i+1}.jpg" for i in range(len(screenshots))] if screenshots else [],
        "steam_id": steam_id
    }




    with open(metadata_json_path, "w", encoding="utf-8") as f:
        json.dump(metadata_dict, f, indent=2)

    print(f"[IGDB] Saved metadata for {game_name} in {game_metadata_dir}")
    return metadata_dict 

# -------------------- Game Scanner --------------------

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

        # Find .exe files
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
                "metadata": metadata 
            })
    return games

games_cache = scan_games()

# -------------------- Models --------------------


class GameMetadata(BaseModel):
    cover: Optional[str]
    big: Optional[str]
    screenshots: Optional[List[str]] = []
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

class LaunchRequest(BaseModel):
    exe: Optional[str] = None

# -------------------- Endpoints --------------------
@app.get("/games", response_model=List[GameInfo])
def list_games():
    return games_cache

@app.post("/games/{game_id}/launch")
def launch_game(game_id: int, req: Optional[LaunchRequest] = None):
    # Find game
    game = next((g for g in games_cache if g["id"] == game_id), None)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if not game["exes"]:
        raise HTTPException(status_code=400, detail="No .exe found for this game")

    # Pick executable
    exe_to_run = req.exe if req and req.exe else game["exes"][0]
    if exe_to_run not in game["exes"]:
        raise HTTPException(status_code=400, detail="Invalid executable choice")

    # -------------------- Wine prefix --------------------
    wine_prefix = PREFIXES_DIR / game["name"]
    wine_prefix.mkdir(exist_ok=True)
    if not (wine_prefix / "system.reg").exists():
        subprocess.run(
            ["wineboot", "-i"],
            cwd=game["path"],
            env={**os.environ, "WINEPREFIX": str(wine_prefix)}
        )

    # -------------------- Save directory --------------------
    game_save_dir = SAVES_DIR / game["name"]
    game_save_dir.mkdir(exist_ok=True)

    # Optional: symlink "My Games" inside save dir
    my_games_folder = wine_prefix / "drive_c" / "users" / os.getlogin() / "My Documents" / "My Games"
    target_folder = game_save_dir / "My Games"
    if my_games_folder.exists() and not target_folder.exists():
        try:
            os.symlink(my_games_folder, target_folder)
        except FileExistsError:
            pass

    # -------------------- Launch game --------------------
    try:
        env = os.environ.copy()
        env["WINEPREFIX"] = str(wine_prefix)
        env["GAME_SAVE_DIR"] = str(game_save_dir)
        subprocess.Popen(
            ["umu-run", exe_to_run],
            cwd=game["path"],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to launch: {e}")

    return {
        "message": f"Launched {game['name']} -> {exe_to_run}",
        "wine_prefix": str(wine_prefix),
        "save_dir": str(game_save_dir),
        "cover_image": game.get("cover_image")
    }

@app.post("/refresh")
def refresh_games():
    global games_cache
    games_cache = scan_games()
    return {"message": "Game list refreshed", "count": len(games_cache)}

app.mount("/metadata", StaticFiles(directory=METADATA_DIR), name="metadata")


frontend_path = os.path.join(os.path.dirname(__file__), "../../frontend/dist")

app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

# Ensure React router works (fallback to index.html)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    return FileResponse(os.path.join(frontend_path, "index.html"))


# -------------------- Run server --------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
