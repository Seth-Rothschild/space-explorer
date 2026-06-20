import json
import time
import urllib.request
import urllib.parse

WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"

INSTANCE_OF_SIMPLIFIED = {
    "G-type main-sequence star":           "star",
    "inner planet of the Solar System":    "planet",
    "gas giant":                           "planet",
    "ice giant":                           "planet",
    "dwarf planet":                        "dwarf planet",
    "plutoid":                             "dwarf planet",
    "planetary moon":                      "moon",
}

def simplify_instance_of(raw, game_key):
    if raw in INSTANCE_OF_SIMPLIFIED:
        return INSTANCE_OF_SIMPLIFIED[raw]
    if "moon" in raw.lower():
        return "moon"
    if game_key in ("ERIS", "HAUMEA", "MAKEMAKE", "PLUTO", "ORCUS", "GONGGONG", "QUAOAR"):
        return "dwarf planet"
    return "asteroid"

NAME_ORIGIN_URLS = {
    "SUN":       "https://en.wikipedia.org/wiki/Sol_(mythology)",
    "MERCURY":   "https://en.wikipedia.org/wiki/Mercury_(mythology)",
    "VENUS":     "https://en.wikipedia.org/wiki/Venus_(mythology)",
    "EARTH":     None,
    "MARS":      "https://en.wikipedia.org/wiki/Mars_(mythology)",
    "CERES":     "https://en.wikipedia.org/wiki/Ceres_(mythology)",
    "JUPITER":   "https://en.wikipedia.org/wiki/Jupiter_(mythology)",
    "SATURN":    "https://en.wikipedia.org/wiki/Saturn_(mythology)",
    "URANUS":    "https://en.wikipedia.org/wiki/Uranus_(mythology)",
    "NEPTUNE":   "https://en.wikipedia.org/wiki/Neptune_(mythology)",
    "PLUTO":     "https://en.wikipedia.org/wiki/Pluto_(mythology)",
    "HAUMEA":    "https://en.wikipedia.org/wiki/Haumea_(mythology)",
    "MAKEMAKE":  "https://en.wikipedia.org/wiki/Makemake_(deity)",
    "ERIS":      "https://en.wikipedia.org/wiki/Eris_(mythology)",
    "MOON":      "https://en.wikipedia.org/wiki/Luna_(goddess)",
    "PHOBOS":    "https://en.wikipedia.org/wiki/Phobos_(mythology)",
    "DEIMOS":    "https://en.wikipedia.org/wiki/Deimos_(mythology)",
    "IO":        "https://en.wikipedia.org/wiki/Io_(mythology)",
    "EUROPA":    "https://en.wikipedia.org/wiki/Europa_(mythology)",
    "GANYMEDE":  "https://en.wikipedia.org/wiki/Ganymede_(mythology)",
    "CALLISTO":  "https://en.wikipedia.org/wiki/Callisto_(mythology)",
    "MIMAS":     "https://en.wikipedia.org/wiki/Mimas_(mythology)",
    "ENCELADUS": "https://en.wikipedia.org/wiki/Enceladus_(mythology)",
    "TITAN":     "https://en.wikipedia.org/wiki/Titan_(mythology)",
    "MIRANDA":   "https://en.wikipedia.org/wiki/Miranda_(The_Tempest)",
    "TITANIA":   "https://en.wikipedia.org/wiki/Titania_(A_Midsummer_Night%27s_Dream)",
    "OBERON":    "https://en.wikipedia.org/wiki/Oberon",
    "TRITON":    "https://en.wikipedia.org/wiki/Triton_(mythology)",
    "CHARON":    "https://en.wikipedia.org/wiki/Charon_(mythology)",
    "TETHYS":    "https://en.wikipedia.org/wiki/Tethys_(mythology)",
    "DIONE":     "https://en.wikipedia.org/wiki/Dione_(mythology)",
    "RHEA":      "https://en.wikipedia.org/wiki/Rhea_(mythology)",
    "IAPETUS":   "https://en.wikipedia.org/wiki/Iapetus",
    "ARIEL":     "https://en.wikipedia.org/wiki/The_Rape_of_the_Lock",
    "UMBRIEL":   "https://en.wikipedia.org/wiki/The_Rape_of_the_Lock",
    "VESTA":     "https://en.wikipedia.org/wiki/Vesta_(mythology)",
    "ORCUS":     "https://en.wikipedia.org/wiki/Orcus_(mythology)",
    "QUAOAR":    "https://en.wikipedia.org/wiki/Chinigchinix",
    "ARROKOTH":  None,
    "GONGGONG":  "https://en.wikipedia.org/wiki/Gong_Gong",
    "SEDNA":     "https://en.wikipedia.org/wiki/Sedna_(mythology)",
    "FAROUT":    None,
    "FARFAROUT": None,
}


def check_url(url):
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "spaceexplorer/1.0 (seth.j.rothschild@gmail.com)"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False

KM_PER_AU = 149_597_870.7

UNIT_KM          = "http://www.wikidata.org/entity/Q828224"
UNIT_AU          = "http://www.wikidata.org/entity/Q1811"
UNIT_DAY         = "http://www.wikidata.org/entity/Q573"
UNIT_YEAR        = "http://www.wikidata.org/entity/Q577"
UNIT_HOUR        = "http://www.wikidata.org/entity/Q25235"
UNIT_KELVIN      = "http://www.wikidata.org/entity/Q11597"
UNIT_KELVIN_ALT  = "http://www.wikidata.org/entity/Q11579"
UNIT_CELSIUS     = "http://www.wikidata.org/entity/Q25267"

DAYS_PER_YEAR = 365.25

PROPS = {
    "P31":   ("instance_of", "item"),
    "P397":  ("parent_body", "item"),
    "P2386": ("diameter_km", "quantity"),
    "P2120": ("radius_km", "quantity"),
    "P2233": ("distance_au", "quantity"),
    "P2146": ("orbital_period_days", "quantity"),
    "P2147": ("rotation_period_days", "quantity"),
    "P2076": ("surface_temp_c", "quantity"),
}

ALL_BODIES = [
    ("SUN",       "Sun"),
    ("MERCURY",   "Mercury_(planet)"),
    ("VENUS",     "Venus"),
    ("EARTH",     "Earth"),
    ("MARS",      "Mars"),
    ("CERES",     "Ceres_(dwarf_planet)"),
    ("JUPITER",   "Jupiter"),
    ("SATURN",    "Saturn"),
    ("URANUS",    "Uranus"),
    ("NEPTUNE",   "Neptune"),
    ("PLUTO",     "Pluto"),
    ("HAUMEA",    "Haumea"),
    ("MAKEMAKE",  "Makemake"),
    ("ERIS",      "Eris_(dwarf_planet)"),
    ("MOON",      "Moon"),
    ("PHOBOS",    "Phobos_(moon)"),
    ("DEIMOS",    "Deimos_(moon)"),
    ("IO",        "Io_(moon)"),
    ("EUROPA",    "Europa_(moon)"),
    ("GANYMEDE",  "Ganymede_(moon)"),
    ("CALLISTO",  "Callisto_(moon)"),
    ("MIMAS",     "Mimas_(moon)"),
    ("ENCELADUS", "Enceladus_(moon)"),
    ("TITAN",     "Titan_(moon)"),
    ("MIRANDA",   "Miranda_(moon)"),
    ("TITANIA",   "Titania_(moon)"),
    ("OBERON",    "Oberon_(moon)"),
    ("TRITON",    "Triton_(moon)"),
    ("CHARON",    "Charon_(moon)"),
    ("TETHYS",    "Tethys_(moon)"),
    ("DIONE",     "Dione_(moon)"),
    ("RHEA",      "Rhea_(moon)"),
    ("IAPETUS",   "Iapetus_(moon)"),
    ("ARIEL",     "Ariel_(moon)"),
    ("UMBRIEL",   "Umbriel_(moon)"),
    ("VESTA",     "4_Vesta"),
    ("ORCUS",     "90482_Orcus"),
    ("QUAOAR",    "50000_Quaoar"),
    ("ARROKOTH",  "486958_Arrokoth"),
    ("GONGGONG",  "Gonggong_(dwarf_planet)"),
    ("SEDNA",     "90377_Sedna"),
    ("FAROUT",    "2018_VG18"),
    ("FARFAROUT", "2018_AG37"),
]

OUTPUT_JS = "metadata.js"


def fetch_wikidata_id(wiki_title):
    params = {
        "action": "query",
        "prop": "pageprops",
        "ppprop": "wikibase_item",
        "titles": wiki_title,
        "format": "json",
        "redirects": "true",
    }
    url = WIKI_API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "spaceexplorer/1.0 (seth.j.rothschild@gmail.com)"})
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    page = next(iter(data["query"]["pages"].values()))
    return page.get("pageprops", {}).get("wikibase_item")


def fetch_wikidata_entity(qid):
    params = {
        "action": "wbgetentities",
        "ids": qid,
        "props": "claims|labels",
        "languages": "en",
        "format": "json",
    }
    url = WIKIDATA_API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "spaceexplorer/1.0 (seth.j.rothschild@gmail.com)"})
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    return data["entities"][qid]


def extract_quantity(claim):
    value = claim["mainsnak"].get("datavalue", {}).get("value", {})
    amount = float(value.get("amount", 0))
    unit = value.get("unit", "")
    return amount, unit


def extract_entity_label(claim, entities_cache):
    qid = claim["mainsnak"].get("datavalue", {}).get("value", {}).get("id")
    if not qid:
        return None
    if qid in entities_cache:
        return entities_cache[qid]
    params = {
        "action": "wbgetentities",
        "ids": qid,
        "props": "labels",
        "languages": "en",
        "format": "json",
    }
    url = WIKIDATA_API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "spaceexplorer/1.0 (seth.j.rothschild@gmail.com)"})
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    label = data["entities"][qid]["labels"].get("en", {}).get("value", qid)
    entities_cache[qid] = label
    return label


def to_km(amount, unit):
    if unit == UNIT_KM:
        return round(amount)
    if unit == UNIT_AU:
        return round(amount * KM_PER_AU)
    return None


def to_au(amount, unit):
    if unit == UNIT_AU:
        return round(amount, 3)
    if unit == UNIT_KM:
        return round(amount / KM_PER_AU, 3)
    return None


def to_days(amount, unit):
    if unit == UNIT_DAY:
        return round(amount, 3)
    if unit == UNIT_YEAR:
        return round(amount * DAYS_PER_YEAR, 1)
    if unit == UNIT_HOUR:
        return round(amount / 24, 3)
    return None


def to_celsius(amount, unit):
    if unit == UNIT_CELSIUS:
        return round(amount, 1)
    if unit in (UNIT_KELVIN, UNIT_KELVIN_ALT):
        return round(amount - 273.15, 1)
    return None


def extract_metadata(entity, entities_cache):
    claims = entity.get("claims", {})
    result = {}

    for prop, (field, kind) in PROPS.items():
        if prop not in claims:
            continue
        claim = claims[prop][0]
        if claim["mainsnak"].get("snaktype") != "value":
            continue

        if kind == "item":
            result[field] = extract_entity_label(claim, entities_cache)
            continue

        amount, unit = extract_quantity(claim)

        if field == "distance_au":
            parent = result.get("parent_body", "Sun")
            if parent == "Sun":
                value = to_au(amount, unit)
                if value is not None:
                    result["distance_from_sun_au"] = value
            else:
                value = to_km(amount, unit)
                if value is not None:
                    result["orbit_radius_km"] = value
            continue
        elif field in ("orbital_period_days", "rotation_period_days"):
            value = to_days(amount, unit)
        elif field == "surface_temp_c":
            value = to_celsius(amount, unit)
        else:
            value = round(amount, 3)

        if value is not None:
            result[field] = value

    if "diameter_km" not in result and "radius_km" in result:
        result["diameter_km"] = round(result["radius_km"] * 2, 1)
    result.pop("radius_km", None)

    return result


def write_js(results, path):
    lines = ["var METADATA = {"]
    for key, meta in results.items():
        lines.append(f'  "{key}": {{')
        for field, value in meta.items():
            if isinstance(value, str):
                escaped = value.replace('"', '\\"')
                lines.append(f'    "{field}": "{escaped}",')
            else:
                lines.append(f'    "{field}": {value},')
        lines.append("  },")
    lines.append("};")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"Wrote {path}")


def main():
    entities_cache = {}
    results = {}

    for game_key, wiki_title in ALL_BODIES:
        print(f"Fetching {game_key}...")
        qid = fetch_wikidata_id(wiki_title)
        if not qid:
            print(f"  No Wikidata ID found")
            continue
        entity = fetch_wikidata_entity(qid)
        metadata = extract_metadata(entity, entities_cache)

        raw_type = metadata.get("instance_of", "")
        metadata["instance_of"] = simplify_instance_of(raw_type, game_key)

        is_moon = metadata["instance_of"] == "moon"
        if not is_moon:
            metadata.pop("parent_body", None)

        results[game_key] = metadata
        time.sleep(0.3)

    print("\nChecking name origin URLs...")
    broken = []
    for game_key, url in NAME_ORIGIN_URLS.items():
        if url is None:
            continue
        ok = check_url(url)
        if ok:
            results[game_key]["name_origin_url"] = url
        else:
            broken.append((game_key, url))
        time.sleep(0.1)

    write_js(results, OUTPUT_JS)

    if broken:
        print("\nBROKEN URLs (need manual fix):")
        for game_key, url in broken:
            print(f"  {game_key}: {url}")
    else:
        print("All URLs OK")

    covered = sum(1 for m in results.values() for _ in m)
    total = len(results) * len(PROPS)
    print(f"\nCoverage: {covered}/{total} base fields across {len(results)} objects")


if __name__ == "__main__":
    main()
