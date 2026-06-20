import json
import os
import time
import urllib.request
import urllib.parse

PLANETS = [
    ("SUN",     "Sun"),
    ("MERCURY", "Mercury_(planet)"),
    ("VENUS",   "Venus"),
    ("EARTH",   "Earth"),
    ("MARS",    "Mars"),
    ("JUPITER", "Jupiter"),
    ("SATURN",  "Saturn"),
    ("URANUS",  "Uranus"),
    ("NEPTUNE", "Neptune"),
]

DWARF_PLANETS = [
    ("PLUTO",   "Pluto"),
    ("ERIS",    "Eris_(dwarf_planet)"),
    ("HAUMEA",  "Haumea"),
    ("MAKEMAKE","Makemake"),
    ("CERES",   "Ceres_(dwarf_planet)"),
]

MOONS = [
    ("MOON",      "Moon"),
    ("PHOBOS",    "Phobos_(moon)"),
    ("DEIMOS",    "Deimos_(moon)"),
    ("IO",        "Io_(moon)"),
    ("EUROPA",    "Europa_(moon)"),
    ("GANYMEDE",  "Ganymede_(moon)"),
    ("CALLISTO",  "Callisto_(moon)"),
    ("TETHYS",    "Tethys_(moon)"),
    ("DIONE",     "Dione_(moon)"),
    ("RHEA",      "Rhea_(moon)"),
    ("IAPETUS",   "Iapetus_(moon)"),
    ("TITAN",     "Titan_(moon)"),
    ("ENCELADUS", "Enceladus_(moon)"),
    ("MIMAS",     "Mimas_(moon)"),
    ("ARIEL",     "Ariel_(moon)"),
    ("UMBRIEL",   "Umbriel_(moon)"),
    ("MIRANDA",   "Miranda_(moon)"),
    ("TITANIA",   "Titania_(moon)"),
    ("OBERON",    "Oberon_(moon)"),
    ("TRITON",    "Triton_(moon)"),
    ("CHARON",    "Charon_(moon)"),
]

NEW_BODIES = [
    ("VESTA",     "4_Vesta"),
    ("ORCUS",     "90482_Orcus"),
    ("QUAOAR",    "50000_Quaoar"),
    ("ARROKOTH",  "486958_Arrokoth"),
    ("GONGGONG",  "Gonggong_(dwarf_planet)"),
    ("SEDNA",     "90377_Sedna"),
    ("FAROUT",    "2018_VG18"),
    ("FARFAROUT", "2018_AG37"),
]

ALL_BODIES = PLANETS + DWARF_PLANETS + MOONS + NEW_BODIES

API_BASE = "https://en.wikipedia.org/w/api.php"
PAGE_BASE = "https://en.wikipedia.org/wiki"
LICENSE = "CC BY-SA 4.0"
LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/"

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "wikipedia")


def fetch_extract(wiki_title):
    params = {
        "action": "query",
        "prop": "extracts|info",
        "titles": wiki_title,
        "explaintext": "true",
        "exsectionformat": "plain",
        "inprop": "url",
        "format": "json",
        "redirects": "true",
    }
    url = API_BASE + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": "spaceexplorer-game/1.0 (educational; seth.j.rothschild@gmail.com)"})
    with urllib.request.urlopen(request) as response:
        data = json.loads(response.read())
    pages = data["query"]["pages"]
    page = next(iter(pages.values()))
    extract = page.get("extract", "")
    canonical_url = page.get("fullurl", f"{PAGE_BASE}/{urllib.parse.quote(wiki_title)}")
    return extract, canonical_url


def write_attributed_file(game_key, wiki_title, extract, page_url):
    attribution = (
        f"SOURCE: Wikipedia — \"{wiki_title.replace('_', ' ')}\"\n"
        f"URL: {page_url}\n"
        f"AUTHORS: Wikipedia contributors\n"
        f"LICENSE: {LICENSE} — {LICENSE_URL}\n"
        f"{'=' * 72}\n\n"
    )
    path = os.path.join(OUTPUT_DIR, f"{game_key.lower()}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(attribution)
        f.write(extract)
    print(f"  saved {path}")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for game_key, wiki_title in ALL_BODIES:
        print(f"Fetching {game_key} ({wiki_title})...")
        extract, page_url = fetch_extract(wiki_title)
        write_attributed_file(game_key, wiki_title, extract, page_url)
        time.sleep(0.5)
    print("Done.")


if __name__ == "__main__":
    main()
