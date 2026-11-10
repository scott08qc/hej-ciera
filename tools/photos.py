"""Fetch one freely licensed photo per sight from Wikipedia/Wikimedia Commons into img/, with credits.
Only Creative Commons and public-domain images are kept; anything else (logos, fair use) is skipped."""
import json, os, re, sys, time, urllib.parse, urllib.request

UA = {"User-Agent": "hej-danmark-app/1.0 (family language learning app)"}
SIGHTS = {
    "tivoli": "Tivoli Gardens", "nyhavn": "Nyhavn", "stroeget": "Strøget", "havfrue": "The Little Mermaid (statue)",
    "rundetaarn": "Rundetaarn", "amalienborg": "Amalienborg", "christiania": "Freetown Christiania",
    "amager": "Amager Strandpark", "smoerrebroed": "Smørrebrød", "raadhus": "City Hall Square, Copenhagen",
    "gaasetaarn": "Goose Tower", "vordingborg": "Vordingborg", "polsevogn": "Pølsevogn", "magasin": "Magasin du Nord",
    "cbs": "Copenhagen Business School", "torvehallerne": "Torvehallerne", "cykler": "Cycling in Copenhagen",
    "kanal": "Christianshavn", "dyne": "Duvet",
}
API = "https://en.wikipedia.org/w/api.php?"

def get(params):
    with urllib.request.urlopen(urllib.request.Request(API + urllib.parse.urlencode(params), headers=UA), timeout=30) as r:
        return json.load(r)

os.makedirs("img", exist_ok=True)
credits = json.load(open("img/credits.json", encoding="utf-8")) if os.path.exists("img/credits.json") else {}
for key, title in SIGHTS.items():
    if key in credits and os.path.exists(credits[key]["file"]):
        continue
    try:
        time.sleep(8)
        page = next(iter(get({"action": "query", "format": "json", "redirects": 1, "titles": title, "prop": "pageimages", "piprop": "name|thumbnail", "pithumbsize": 800})["query"]["pages"].values()))
        name, thumb = page.get("pageimage"), page.get("thumbnail", {}).get("source")
        if not name or not thumb:
            print("no image:", title); continue
        info = next(iter(get({"action": "query", "format": "json", "titles": "File:" + name, "prop": "imageinfo", "iiprop": "extmetadata"})["query"]["pages"].values()))
        meta = info.get("imageinfo", [{}])[0].get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "")
        if not re.match(r"(CC|Public domain|PD)", lic, re.I):
            print("skipped (license %r): %s" % (lic, title)); continue
        artist = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip()[:60] or "Wikimedia Commons"
        ext = ".png" if thumb.lower().split("?")[0].endswith(".png") else ".jpg"
        with urllib.request.urlopen(urllib.request.Request(thumb, headers=UA), timeout=60) as r:
            data = r.read()
        open(os.path.join("img", key + ext), "wb").write(data)
        credits[key] = {"file": "img/" + key + ext, "credit": "Photo: %s, %s, via Wikimedia Commons" % (artist, lic), "source": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(name)}
        print("ok", key, len(data), lic)
        time.sleep(1)
    except Exception as e:
        print("failed:", title, e)
        if "429" in str(e):
            time.sleep(45)
json.dump(credits, open(os.path.join("img", "credits.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(credits), "photos")
