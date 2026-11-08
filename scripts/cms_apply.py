import json
import os
import re
import urllib.request
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "content" / "site-content.json"
MAX_IMAGE_BYTES = 5 * 1024 * 1024

def fail(message):
    raise SystemExit(message)

def safe_text(value, field, limit=5000):
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        fail(f"Invalid {field}")
    return value.strip()

def safe_id(value):
    value = safe_text(value, "id", 80).lower()
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", value):
        fail("ID may contain only lowercase letters, numbers and hyphens")
    return value

def download_image(url, item_id):
    if not url:
        return ""
    url = safe_text(url, "image_url", 2000)
    if not url.startswith("https://"):
        fail("Images must use HTTPS URLs")
    request = urllib.request.Request(url, headers={"User-Agent": "RQJEY-CMS/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        content_type = response.headers.get_content_type()
        if content_type not in ("image/png", "image/jpeg", "image/webp", "image/gif"):
            fail("Image URL must return PNG, JPEG, WEBP or GIF")
        data = response.read(MAX_IMAGE_BYTES + 1)
    if not data or len(data) > MAX_IMAGE_BYTES:
        fail("Image must be smaller than 5 MB")
    ext = {"image/png":".png","image/jpeg":".jpg","image/webp":".webp","image/gif":".gif"}[content_type]
    folder = ROOT / "assets" / "cms"
    folder.mkdir(parents=True, exist_ok=True)
    for old in folder.glob(item_id + ".*"):
        old.unlink()
    target = folder / (item_id + ext)
    target.write_bytes(data)
    return "assets/cms/" + target.name

def main():
    raw = os.environ.get("CMS_PAYLOAD", "")
    if len(raw) > 60000:
        fail("Payload is too large")
    try:
        payload = json.loads(raw)
    except Exception as exc:
        fail(f"Payload is not valid JSON: {exc}")
    if not isinstance(payload, dict):
        fail("Payload must be a JSON object")

    if DATA_FILE.exists():
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    else:
        data = {"homepage": {}, "categories": [], "projects": [], "news": []}
    data.setdefault("homepage", {})
    data.setdefault("categories", [])
    data.setdefault("projects", [])
    data.setdefault("news", [])
    data.setdefault("hiddenProjects", [])

    action = payload.get("action")
    if action == "restore_content":
        restored = payload.get("content")
        if not isinstance(restored, dict) or not isinstance(restored.get("homepage", {}), dict):
            fail("Backup content must contain a homepage object")
        for key in ("categories", "projects", "news"):
            if not isinstance(restored.get(key, []), list):
                fail(f"Backup {key} must be a list")
        if len(restored.get("categories", [])) > 50 or len(restored.get("projects", [])) > 100 or len(restored.get("news", [])) > 30:
            fail("Backup contains too many records")
        project_ids = []
        for project in restored.get("projects", []):
            if not isinstance(project, dict):
                fail("Invalid project in backup")
            project_ids.append(safe_id(project.get("id", "")))
        if len(project_ids) != len(set(project_ids)):
            fail("Backup contains duplicate project IDs")
        news_ids = []
        for item in restored.get("news", []):
            if not isinstance(item, dict):
                fail("Invalid news item in backup")
            news_ids.append(safe_id(item.get("id", "")))
        if len(news_ids) != len(set(news_ids)):
            fail("Backup contains duplicate news IDs")
        hidden = restored.get("hiddenProjects", [])
        if not isinstance(hidden, list) or any(not isinstance(item, str) for item in hidden):
            fail("Backup hiddenProjects must be a list of IDs")
        history = restored.get("adminLog", [])
        if not isinstance(history, list):
            fail("Backup adminLog must be a list")
        data = {"homepage": restored.get("homepage", {}), "categories": restored.get("categories", []),
                "projects": restored.get("projects", []), "news": restored.get("news", []),
                "hiddenProjects": restored.get("hiddenProjects", []), "adminLog": restored.get("adminLog", [])}
    elif action == "reorder_projects":
        order = payload.get("order")
        current_ids = [project.get("id") for project in data["projects"]]
        if not isinstance(order, list) or len(order) != len(current_ids) or set(order) != set(current_ids) or len(set(order)) != len(order):
            fail("Project order must contain every existing project exactly once")
        by_id = {project["id"]: project for project in data["projects"]}
        data["projects"] = [by_id[item_id] for item_id in order]
    elif action == "save_project":
        project = payload.get("project", {})
        if not isinstance(project, dict):
            fail("Project must be an object")
        item_id = safe_id(project.get("id", ""))
        name = safe_text(project.get("name", ""), "name", 80)
        category = safe_text(project.get("category", ""), "category", 60)
        description = safe_text(project.get("description", ""), "description", 2000)
        accent = project.get("accent", "violet")
        if accent not in ("violet", "blue", "green", "purple", "orange"):
            fail("Invalid accent")
        features = project.get("features", [])
        if not isinstance(features, list) or len(features) > 12 or any(not isinstance(x, str) or len(x) > 120 for x in features):
            fail("Invalid features")
        image_path = download_image(project.get("image_url", ""), item_id) if project.get("image_url") else ("" if project.get("clear_image") else project.get("image", ""))
        record = {
            "id": item_id, "name": name, "icon": safe_text(project.get("icon", "✳"), "icon", 32),
            "category": category, "description": description,
            "minecraft": safe_text(project.get("minecraft", "Любая"), "minecraft", 40),
            "accent": accent, "features": features
        }
        if image_path:
            record["image"] = image_path
        else:
            record.pop("image", None)
        found = next((i for i, p in enumerate(data["projects"]) if p.get("id") == item_id), None)
        if found is None:
            data["projects"].append(record)
        else:
            data["projects"][found] = record
        data["hiddenProjects"] = [hidden for hidden in data["hiddenProjects"] if hidden != item_id]
        if category not in data["categories"]:
            data["categories"].append(category)

    elif action == "delete_project":
        item_id = safe_id(payload.get("id", ""))
        data["projects"] = [p for p in data["projects"] if p.get("id") != item_id]
        if item_id not in data["hiddenProjects"]:
            data["hiddenProjects"].append(item_id)
        for path in (ROOT / "assets" / "cms").glob(item_id + ".*"):
            path.unlink()

    elif action == "save_categories":
        categories = payload.get("categories")
        if not isinstance(categories, list) or len(categories) > 50:
            fail("Categories must be a list with at most 50 entries")
        cleaned = []
        for category in categories:
            category = safe_text(category, "category", 60)
            if category not in cleaned:
                cleaned.append(category)
        data["categories"] = cleaned

    elif action == "publish_news":
        item = payload.get("news", {})
        news_id = safe_id(item.get("id", ""))
        title = safe_text(item.get("title", ""), "news title", 120)
        body = safe_text(item.get("body", ""), "news body", 4000)
        original_id = safe_id(payload.get("original_id", news_id)) if payload.get("original_id") else news_id
        existing = next((news for news in data["news"] if news.get("id") == original_id), {})
        if original_id != news_id and any(news.get("id") == news_id for news in data["news"]):
            fail("A news item with the new ID already exists")
        image = download_image(item.get("image_url", ""), "news-" + news_id) if item.get("image_url") else existing.get("image", "")
        date = existing.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        record = {"id": news_id, "title": title, "body": body, "date": date}
        if image:
            record["image"] = image
        data["news"] = [n for n in data["news"] if n.get("id") not in (original_id, news_id)]
        data["news"].insert(0, record)
        data["news"] = data["news"][:30]

    elif action == "delete_news":
        news_id = safe_id(payload.get("id", ""))
        data["news"] = [n for n in data["news"] if n.get("id") != news_id]
        for path in (ROOT / "assets" / "cms").glob("news-" + news_id + ".*"):
            path.unlink()

    elif action == "update_homepage":
        homepage = payload.get("homepage", {})
        allowed = ("heroCopy", "modsKicker", "modsTitle", "modsCopy", "utilitiesKicker", "utilitiesTitle", "utilitiesCopy", "newsKicker", "newsTitle", "newsCopy", "aboutKicker", "aboutTitle", "aboutCopy")
        for key in allowed:
            if key in homepage:
                data["homepage"][key] = safe_text(homepage[key], key, 1000)

    else:
        fail("Unsupported CMS action")

    log = data.setdefault("adminLog", [])
    if not isinstance(log, list):
        log = []
    log.append({"at": datetime.now(timezone.utc).isoformat(), "action": action})
    data["adminLog"] = log[-100:]

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Applied CMS action: {action}")

if __name__ == "__main__":
    main()
