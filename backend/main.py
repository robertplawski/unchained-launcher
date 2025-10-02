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

IGDB_TOKEN = None
IGDB_TOKEN_EXPIRES = 0
IGDB_URL = "https://igdb-proxy.robertplawski8.workers.dev/games"

def upgrade_igdb_image_resolution(url):
    """
    Upgrade IGDB image URL to higher resolution.
    IGDB uses the following size patterns:
    - t_thumb: Thumbnail (100x100)
    - t_small: Small (300x400) 
    - t_med: Medium (500x700)
    - t_720p: 720p (1280x720)
    - t_1080p: 1080p (1920x1080)
    - t_original: Original size
    """
    if not url:
        return url
    
    # Replace lower resolution sizes with higher ones
    # Prefer 1080p, fall back to 720p, then original
    upgrades = [
        ('t_thumb', 't_1080p'),
        ('t_small', 't_1080p'), 
        ('t_med', 't_1080p'),
        ('t_720p', 't_1080p'),
        ('t_1080p', 't_original')  # If already 1080p, try original
    ]
    
    for old_size, new_size in upgrades:
        if old_size in url:
            new_url = url.replace(old_size, new_size)
            # Verify the new URL works by checking if it contains the new size identifier
            if new_size in new_url:
                return new_url
    
    return url

def process_game_metadata(game_data):
    """Process a single game's metadata from IGDB response"""
    # Process cover URL with higher resolution
    cover_url = game_data.get("cover", {}).get("url")
    if cover_url and cover_url.startswith("//"):
        cover_url = "https:" + cover_url
    # Upgrade cover resolution to 720p or 1080p
    if cover_url:
        cover_url = upgrade_igdb_image_resolution(cover_url)
        
    # Process screenshots with higher resolution
    screenshots = []
    for sc in game_data.get("screenshots", []):
        sc_url = sc.get("url")
        if sc_url and sc_url.startswith("//"):
            sc_url = "https:" + sc_url
        # Upgrade screenshot resolution
        if sc_url:
            sc_url = upgrade_igdb_image_resolution(sc_url)
        screenshots.append(sc_url)
        
    # Process artworks with higher resolution
    artworks = []
    for art in game_data.get("artworks", []):
        art_url = art.get("url")
        if art_url and art_url.startswith("//"):
            art_url = "https:" + art_url
        # Upgrade artwork resolution
        if art_url:
            art_url = upgrade_igdb_image_resolution(art_url)
        artworks.append(art_url)
        
    # Process Steam ID
    steam_id = None
    for site in game_data.get("websites", []):
        if site.get("category") == 1:  # Steam
            import re
            match = re.search(r"/app/(\d+)", site.get("url", ""))
            if match:
                steam_id = match.group(1)
                break
    
    return {
        "id": game_data.get("id"),
        "name": game_data.get("name"),
        "genres": [g["name"] for g in game_data.get("genres", [])] if game_data.get("genres") else [],
        "platforms": [p["name"] for p in game_data.get("platforms", [])] if game_data.get("platforms") else [],
        "first_release_date": game_data.get("first_release_date"),
        "summary": game_data.get("summary"),
        "rating": game_data.get("rating"),
        "total_rating": game_data.get("total_rating"),
        "cover": cover_url,
        "screenshots": screenshots,
        "artworks": artworks,
        "category":"bay",
        "steam_id": steam_id
    }

def search_library_games(query: str, limit: int):
    """Search for library games based on the query"""
    matching_games = []
    if query is None:
        # Return all library games if query is None
        return {"games": games_cache[:limit], "count": len(games_cache)}
    
    query_lower = query.lower()
    for game in games_cache:
        # Check if the game name matches the query
        if query_lower in game["name"].lower():
            matching_games.append(game)
        # Check if metadata name matches the query
        elif game["metadata"] and query_lower in (game["metadata"].get("name", "") or "").lower():
            matching_games.append(game)
    return {"games": matching_games[:limit], "count": len(matching_games)}

def search_igdb_games(query: str, limit: int):
    """Search for games using IGDB API"""
    if query is None:
        # Return empty result when query is None for IGDB
        return {"games": [], "count": 0}
    
    headers = {
        "Accept": "application/json"
    }
    
    # Escape quotes in query to prevent broken query
    import re
    safe_query = re.sub(r'"', '', query)
    
    fields = "id,name,cover.url,genres.name,platforms.name,first_release_date,summary,screenshots.url,artworks.url,websites.url,rating,total_rating"

    # filter for pc games only (platform id 6 = pc) and main games only (category 0 = main game)
    query_igdb = (
        f'fields {fields}; '
        f'search "{safe_query}*"; '
        # remember to change these platforms in order to support emulation
        f'where platforms = (6) &  game_type = (0,4,8,9,10,11,12); '

        f'limit 100;'
    )

    resp = requests.post(IGDB_URL, headers=headers, data=query_igdb)
    if resp.status_code == 401:  # token expired
        token = get_igdb_token()
        headers["Authorization"] = f"Bearer {token}"
        resp = requests.post(IGDB_URL, headers=headers, data=query_igdb)
    
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=f"IGDB API error: {resp.text}")
    
    import difflib
    games = resp.json()
    for g in games:
        g['category'] = 'bay'
    games = [g for g in games if 'rating' in g and g['rating'] is not None]
 

   
    games = sorted(
        games,
        key=lambda g: difflib.SequenceMatcher(None, g.get('name', ''), safe_query).ratio(),
        reverse=True
    )
    
    # Process the games to match our metadata format
    processed_games = []
    for game in games:
        processed_game = process_game_metadata(game)
        processed_games.append(processed_game)
        
    return {"games": processed_games, "count": len(processed_games)}

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

    headers = {
        "Accept": "application/json"
    }

    # Escape quotes in game_name to prevent broken query
    import re
    safe_query = re.sub(r'"', '', game_name)

    fields = "id,name,cover.url,genres.name,platforms.name,first_release_date,summary,screenshots.url,artworks.url,websites.url,rating,total_rating"

    # filter for pc games only (platform id 6 = pc) and main games only (category 0 = main game)
    query_igdb = (
        f'fields {fields}; '
        f'search "{safe_query}*"; '
        # remember to change these platforms in order to support emulation
        f'where platforms = (6) &  game_type = (0,4,8,9,10,11,12); '

        f'limit 100;'
    )
    resp = requests.post(IGDB_URL, headers=headers, data=query_igdb)
    if resp.status_code == 401:  # token expired
        token = get_igdb_token()
        headers["Authorization"] = f"Bearer {token}"
        resp = requests.post(IGDB_URL, headers=headers, data=query_igdb)

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
        "id": game.get('id'),
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
                "category":"library",
                "metadata": metadata,
                "size":get_directory_size_mb(dir_path)
            })
    return games

games_cache = scan_games()

# -------------------- Models --------------------
from typing import Literal

class GameMetadata(BaseModel):
    id: Optional[int] = None
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
    category: Literal["library", "peers", "bay","apps"] 
    igdb_id: Optional[int] = None
    size:float 

class SearchRequest(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = "all"  # all, library, bay, apps
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

import requests
from typing import Dict, Any

def search_flatpak_apps(query: str, limit: int) -> Dict[str, Any]:
    """Search for Flatpak apps using Flathub API"""
    if query is None:
        # Return empty result when query is None for Flatpak
        return {"games": [], "count": 0}
    
    try:
        # Use Flathub API to search for apps - based on the OpenAPI spec
        search_url = "https://flathub.org/api/v2/search"
        
        # The API expects POST request with JSON body based on the schema
        payload = {
            "query": query or "",
            "size": limit
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        response = requests.post(search_url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        apps = []
        # Process the data based on the MeilisearchResponse schema from the API spec
        hits = data.get('hits', [])
        for item in hits[:limit]:
            # Create metadata based on the GameMetadata schema
            metadata = {
                "cover": item.get('icon'),
                "big": item.get('icon'),  # Use icon as both cover and big
                "screenshots": [],  # Flathub API doesn't provide screenshots in search
                "artworks": [],  # Flathub API doesn't provide artworks in search
                "genres": item.get('categories', []),
                "platforms": ["Linux"],  # Flatpak apps are primarily for Linux
                "first_release_date": item.get('added_at'),
                "summary": item.get('summary'),
                "steam_id": None  # Not applicable for Flatpak apps
            }
            
            app = {
                'id': item.get('id'),
                'name': item.get('name'),
                'appid': item.get('app_id'),
                'category':'apps',
                'exes': [],  # Flatpak apps don't have traditional EXEs
                'metadata': metadata,
                'size': 0.0  # Size not available from search API
            }
            apps.append(app)
        
        return {
            "games": apps,
            "count": len(apps)
        }
    except requests.RequestException as e:
        print(f"Error searching Flatpak apps via API: {e}")
        return {"games": [], "count": 0}
    except Exception as e:
        print(f"Unexpected error searching Flatpak apps: {e}")
        return {"games": [], "count": 0}

def remove_duplicates(games_list):
    """Remove duplicate games from a list based on name and metadata name"""
    seen_names = set()
    unique_games = []
    
    for game in games_list:
        # Determine the game's name for comparison
        game_name = game.get('name') or (game.get('metadata', {}) or {}).get('name', '')
        
        # Normalize the name for comparison (lowercase, stripped)
        normalized_name = game_name.lower().strip()
        
        # Only add if we haven't seen this name before
        if normalized_name not in seen_names:
            seen_names.add(normalized_name)
            unique_games.append(game)
    
    return unique_games

@app.get("/api/game/igdb/{game_id}")
def get_igdb_game_metadata(game_id: int):
    """Get detailed metadata for a specific game by IGDB ID"""
    for g in games_cache:
        if g['metadata']['id'] == game_id:
            return g
    
    headers = {
        "Accept": "application/json"
    }
    
    fields = "id,name,cover.url,genres.name,platforms.name,first_release_date,summary,screenshots.url,artworks.url,websites.url,rating,total_rating,storyline,category,game_modes.name"
    query = f'fields {fields}; where id = {game_id};'
    
    resp = requests.post(IGDB_URL, headers=headers, data=query)
    if resp.status_code == 401:  # token expired
        token = get_igdb_token()
        headers["Authorization"] = f"Bearer {token}"
        resp = requests.post(IGDB_URL, headers=headers, data=query)
    
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=f"IGDB API error: {resp.text}")
    
    games = resp.json()
    if not games:
        raise HTTPException(status_code=404, detail="Game not found")
    

    game = games[0]
  
            #game['installed'] = True

    return process_game_metadata(game)



@app.post("/api/search")
def search_games(request: SearchRequest):
    """Search for games based on category"""
    query = request.query

    if not query:
        # TODO
        games = games_cache
        print(games)
        library_results = {"games":games,"count":len(games)}
        all_results = [
            {"category": "library", "results": library_results},
            #{"category": "bay", "results": igdb_results},
            #{"category": "apps", "results": apps_results},
            #{"category": "peers", "results": peers_results}
        ]
        # Collect all games from all categories
        all_games = []
        for result in all_results:
            all_games.extend(result["results"]["games"])
        
        # Remove duplicates from the combined list
        unique_games = remove_duplicates(all_games)
        
        # Create the final result
        final_result = {"games": unique_games, "count": len(unique_games)}

        return {
            "library": {"games": remove_duplicates(library_results["games"]), "count": len(remove_duplicates(library_results["games"]))},
            #"peers": peers_results,
            #"bay": {"games": remove_duplicates(igdb_results["games"]), "count": len(remove_duplicates(igdb_results["games"]))},
            #"apps": {"games": remove_duplicates(apps_results["games"]), "count": len(remove_duplicates(apps_results["games"]))},
            "all": final_result
        }

    category = request.category or "all"
    limit = min(request.limit or 50, 50)  # Default to 10 if None, max 50
    
    if category == "library":
        result = search_library_games(query, limit)
        result["games"] = remove_duplicates(result["games"])
        return result
    elif category == "apps":
        result = search_flatpak_apps(query, limit)
        result["games"] = remove_duplicates(result["games"])
        return result
    elif category == "bay":
        result = search_igdb_games(query, limit)
        result["games"] = remove_duplicates(result["games"])
        return result
    elif category == "all":
        # Search all categories and return combined results with counts
        library_results = search_library_games(query, limit)
        igdb_results = search_igdb_games(query, limit)
        apps_results = search_flatpak_apps(query, limit)
        peers_results = {"games": [], "count": 0}  # Placeholder

        # Combine all results
        all_results = [
            {"category": "library", "results": library_results},
            {"category": "bay", "results": igdb_results},
            #{"category": "apps", "results": apps_results},
            {"category": "peers", "results": peers_results}
        ]

        # Collect all games from all categories
        all_games = []
        for result in all_results:
            all_games.extend(result["results"]["games"])
        
        # Remove duplicates from the combined list
        unique_games = remove_duplicates(all_games)
        
        # Create the final result
        final_result = {"games": unique_games, "count": len(unique_games)}

        return {
            "library": {"games": remove_duplicates(library_results["games"]), "count": len(remove_duplicates(library_results["games"]))},
            "peers": peers_results,
            "bay": {"games": remove_duplicates(igdb_results["games"]), "count": len(remove_duplicates(igdb_results["games"]))},
            "apps": {"games": remove_duplicates(apps_results["games"]), "count": len(remove_duplicates(apps_results["games"]))},
            "all": final_result
        }

    else:
        # Default to IGDB search for any other category
        result = {"games": [], "count": 0, "message": f"Unknown category: {category}"}
        result["games"] = remove_duplicates(result["games"])
        return result


@app.post("/games/{game_id}/launch")
def launch_game(game_id: int):
    # Find game
    game = next((g for g in games_cache if g["id"] == game_id), None)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if not game["exes"]:
        raise HTTPException(status_code=400, detail="No .exe found for this game")

    # Pick executable
    exe_to_run = game["exes"][0]
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
    my_games_folder = (
        wine_prefix / "drive_c" / "users" / os.getlogin() / "My Documents" / "My Games"
    )
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
