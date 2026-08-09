from __future__ import annotations

import html
import hashlib
import json
import mimetypes
import os
import re
import secrets
import ssl
import smtplib
import threading
import time
import urllib.error
import urllib.request
from email.message import EmailMessage
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote_plus, urlparse


ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
DATA_DIR = ROOT / "data"
ROOMS_FILE = DATA_DIR / "rooms.json"
ACCOUNTS_FILE = DATA_DIR / "accounts.json"
MAX_USERS = 5
ROOM_TTL_SECONDS = 60 * 60 * 8
YOUTUBE_SEARCH_TIMEOUT = 6
DEFAULT_VIDEO = "M7lc1UVf-VE"
APP_NAME = os.environ.get("APP_NAME", "Zynlivo")
SUPPORT_EMAIL = os.environ.get("SUPPORT_EMAIL", "support@example.com")
BUSINESS_NAME = os.environ.get("BUSINESS_NAME", APP_NAME)
STRIPE_PAYMENT_LINK = os.environ.get("STRIPE_PAYMENT_LINK", "")
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
AUTH_SECRET = os.environ.get("AUTH_SECRET", APP_NAME)
DATABASE_URL = os.environ.get("DATABASE_URL", "")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587") or 587)
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.environ.get("SMTP_FROM_EMAIL", SMTP_USERNAME or SUPPORT_EMAIL)
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", APP_NAME)
SMTP_SECURITY = os.environ.get("SMTP_SECURITY", "starttls").lower()
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", SMTP_FROM_EMAIL)
EMAIL_PROVIDER = os.environ.get("EMAIL_PROVIDER", "resend" if RESEND_API_KEY else "smtp").lower()
ALLOW_DEV_OTP = os.environ.get("ALLOW_DEV_OTP", "false").lower() == "true"
ENABLE_PUBLIC_LOGIN = os.environ.get("ENABLE_PUBLIC_LOGIN", "false").lower() == "true"
OTP_TTL_MS = 10 * 60 * 1000
SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
RATE_WINDOW_MS = 60 * 1000
OTP_REQUEST_LIMIT = 3
OTP_VERIFY_LIMIT = 8
MAX_CHAT_IMAGE_CHARS = 3_400_000
LUDO_SAFE_TILES = {0, 8, 13, 21, 26, 34, 39, 47}
LUDO_COLOR_ORDER = {
    1: ["red"],
    2: ["red", "green"],
    3: ["red", "green", "yellow"],
    4: ["red", "green", "yellow", "blue"],
}
LUDO_COLOR_STARTS = {"red": 13, "green": 0, "yellow": 39, "blue": 26}
LUDO_HOME_ORDER = {"red": 0, "blue": 1, "yellow": 2, "green": 3}

THEMES = {
    "late-night": {"name": "Late Night", "emoji": "🌙"},
    "study-lofi": {"name": "Study Lofi", "emoji": "📚"},
    "party": {"name": "Party", "emoji": "🔥"},
    "movie": {"name": "Movie Night", "emoji": "🍿"},
    "heartbreak": {"name": "Heartbreak", "emoji": "💔"},
    "anime": {"name": "Anime", "emoji": "✨"},
}

DEFAULT_MIX = {"bass": 40, "volume": 85}
AVATAR_IDS = {"male-1", "male-2", "male-3", "female-1", "female-2", "female-3"}

PROMPTS = [
    "Rate this video out of 10.",
    "Guess the next lyric.",
    "Would you replay this or skip?",
    "Drop one word for the vibe.",
    "Who should be DJ next?",
    "Best moment so far?",
]

rooms: dict[str, dict] = {}
accounts: dict[str, dict] = {}
lock = threading.Lock()


def now_ms() -> int:
    return int(time.time() * 1000)


def clean_room_id(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9-]", "", value.strip())[:32]


def clean_video_id(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "", value.strip())[:32]


def clean_email(value: str) -> str:
    return value.strip().lower()[:120]


def clean_nickname(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())[:24]


def clean_avatar(value: str) -> str:
    avatar = str(value or "").strip()
    return avatar if avatar in AVATAR_IDS else "male-1"


def nickname_error(nickname: str) -> str:
    if len(nickname) < 2:
        return "Name must be at least 2 characters."
    if len(nickname) > 24:
        return "Name must be 24 characters or less."
    if not re.match(r"^[A-Za-z0-9 ._-]+$", nickname):
        return "Use letters, numbers, spaces, dot, underscore, or hyphen."
    return ""


def otp_digest(email: str, otp: str) -> str:
    return hashlib.sha256(f"{AUTH_SECRET}:{email}:{otp}".encode("utf-8")).hexdigest()


def smtp_ready() -> bool:
    return bool(SMTP_HOST and SMTP_FROM_EMAIL and (SMTP_PASSWORD or SMTP_SECURITY == "none"))


def resend_ready() -> bool:
    return bool(RESEND_API_KEY and RESEND_FROM_EMAIL)


def email_otp_ready() -> bool:
    return resend_ready() or smtp_ready()


def send_otp_email(email: str, otp: str) -> None:
    if EMAIL_PROVIDER == "resend" and resend_ready():
        send_resend_otp(email, otp)
        return
    if not smtp_ready():
        if resend_ready():
            send_resend_otp(email, otp)
            return
        if ALLOW_DEV_OTP:
            print(f"[DEV OTP] {email}: {otp}")
            return
        raise RuntimeError("Email OTP is not configured. Add Resend API or SMTP settings in Render.")

    message = EmailMessage()
    message["Subject"] = f"{APP_NAME} login code: {otp}"
    message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    message["To"] = email
    message.set_content(
        "\n".join(
            [
                f"Your {APP_NAME} login code is {otp}.",
                "",
                "This code expires in 10 minutes.",
                "If you did not request this code, you can ignore this email.",
            ]
        )
    )
    message.add_alternative(
        f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#111827">
          <h2 style="margin:0 0 12px">{APP_NAME} login code</h2>
          <p style="font-size:16px">Use this six-digit code to continue:</p>
          <div style="font-size:34px;font-weight:800;letter-spacing:8px;padding:18px 20px;border-radius:16px;background:#f3f4f6;text-align:center">{otp}</div>
          <p style="color:#4b5563">This code expires in 10 minutes.</p>
          <p style="color:#6b7280;font-size:13px">If you did not request this code, you can ignore this email.</p>
        </div>
        """,
        subtype="html",
    )

    if SMTP_SECURITY == "ssl":
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=12) as smtp:
            if SMTP_USERNAME:
                smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.send_message(message)
        return

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12) as smtp:
        if SMTP_SECURITY != "none":
            smtp.starttls(context=ssl.create_default_context())
        if SMTP_USERNAME:
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
        smtp.send_message(message)


def send_resend_otp(email: str, otp: str) -> None:
    payload = {
        "from": f"{SMTP_FROM_NAME} <{RESEND_FROM_EMAIL}>",
        "to": [email],
        "subject": f"{APP_NAME} login code: {otp}",
        "text": "\n".join(
            [
                f"Your {APP_NAME} login code is {otp}.",
                "",
                "This code expires in 10 minutes.",
                "If you did not request this code, you can ignore this email.",
            ]
        ),
        "html": f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#111827">
          <h2 style="margin:0 0 12px">{APP_NAME} login code</h2>
          <p style="font-size:16px">Use this six-digit code to continue:</p>
          <div style="font-size:34px;font-weight:800;letter-spacing:8px;padding:18px 20px;border-radius:16px;background:#f3f4f6;text-align:center">{otp}</div>
          <p style="color:#4b5563">This code expires in 10 minutes.</p>
          <p style="color:#6b7280;font-size:13px">If you did not request this code, you can ignore this email.</p>
        </div>
        """,
    }
    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "watch-party-rooms/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            if response.status >= 300:
                raise RuntimeError(f"Resend returned HTTP {response.status}")
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")[:180]
        raise RuntimeError(f"Resend email failed: {details}") from exc


def ensure_account(email: str) -> dict:
    account = accounts.setdefault(
        email,
        {
            "id": secrets.token_urlsafe(12),
            "email": email,
            "createdAt": now_ms(),
            "sessions": [],
            "friends": [],
            "friendRequests": [],
            "roomInvites": [],
            "pushSubscriptions": [],
            "plan": "free",
            "notificationPreferences": {"sounds": True, "browser": False},
            "soundPreferences": {"volume": 85},
        },
    )
    account.setdefault("sessions", [])
    account.setdefault("friends", [])
    account.setdefault("friendRequests", [])
    account.setdefault("roomInvites", [])
    account.setdefault("pushSubscriptions", [])
    account.setdefault("plan", "free")
    account.setdefault("rateLimits", {})
    account["lastSeen"] = now_ms()
    return account


def public_account(account: dict) -> dict:
    nickname = account.get("nickname", "")
    return {
        "id": account.get("id", ""),
        "email": account.get("email", ""),
        "nickname": nickname,
        "displayName": nickname,
        "avatar": clean_avatar(account.get("avatar", "male-1")),
        "status": account.get("status") or account.get("vibe") or "Ready",
        "profileComplete": bool(nickname),
        "lastSeenAt": account.get("lastSeen", 0),
        "friends": public_friends(account),
        "friendRequests": public_friend_requests(account),
        "roomInvites": public_room_invites(account),
        "plan": account.get("plan", "free"),
        "notificationPreferences": account.get("notificationPreferences", {"sounds": True, "browser": False}),
        "soundPreferences": account.get("soundPreferences", {"volume": 85}),
    }


def public_friends(account: dict) -> list[dict]:
    rows = []
    cutoff = now_ms() - 60 * 1000
    for friend_id in account.get("friends", []):
        friend = account_by_id(str(friend_id))
        if not friend:
            continue
        rows.append(
            {
                "accountId": friend.get("id", ""),
                "nickname": friend.get("nickname") or "Friend",
                "avatar": clean_avatar(friend.get("avatar", "male-1")),
                "lastSeenAt": friend.get("lastSeen", 0),
                "online": int(friend.get("lastSeen", 0) or 0) >= cutoff,
            }
        )
    return rows


def public_room_invites(account: dict) -> list[dict]:
    cutoff = now_ms() - 24 * 60 * 60 * 1000
    invites = [invite for invite in account.get("roomInvites", []) if int(invite.get("at", 0)) >= cutoff]
    account["roomInvites"] = invites[-20:]
    return [
        {
            "id": invite.get("id", ""),
            "roomId": invite.get("roomId", ""),
            "fromName": invite.get("fromName", "Friend"),
            "fromAvatar": clean_avatar(invite.get("fromAvatar", "male-1")),
            "at": invite.get("at", 0),
        }
        for invite in account["roomInvites"]
    ]


def public_friend_requests(account: dict) -> list[dict]:
    requests = account.get("friendRequests", [])[-30:]
    account["friendRequests"] = requests
    rows = []
    for request in requests:
        from_account = account_by_id(str(request.get("fromAccountId", "")))
        rows.append(
            {
                "id": request.get("id", ""),
                "fromAccountId": request.get("fromAccountId", ""),
                "fromName": request.get("fromName") or (from_account or {}).get("nickname") or "Someone",
                "fromAvatar": clean_avatar(request.get("fromAvatar") or (from_account or {}).get("avatar") or "male-1"),
                "at": request.get("at", 0),
            }
        )
    return rows


def account_by_id(account_id: str) -> dict | None:
    for account in accounts.values():
        if account.get("id") == account_id:
            return account
    return None


def rate_limited(account: dict, bucket: str, limit: int, window_ms: int = RATE_WINDOW_MS) -> bool:
    now = now_ms()
    limits = account.setdefault("rateLimits", {})
    hits = [item for item in limits.get(bucket, []) if now - int(item) < window_ms]
    if len(hits) >= limit:
        limits[bucket] = hits
        return True
    hits.append(now)
    limits[bucket] = hits
    return False


def prune_account_sessions(account: dict) -> None:
    now = now_ms()
    sessions = []
    for session in account.get("sessions", []):
        expires_at = int(session.get("expiresAt") or (session.get("at", 0) + SESSION_TTL_MS))
        if expires_at > now:
            session["expiresAt"] = expires_at
            sessions.append(session)
    account["sessions"] = sessions[-8:]


def account_by_session(session_token: str) -> dict | None:
    if not session_token:
        return None
    for account in accounts.values():
        prune_account_sessions(account)
        for session in account.get("sessions", []):
            if secrets.compare_digest(str(session.get("token", "")), str(session_token)):
                account["lastSeen"] = now_ms()
                return account
    return None


def new_room_id() -> str:
    for _ in range(100):
        candidate = f"{secrets.randbelow(900000) + 100000}"
        if candidate not in rooms:
            return candidate
    return secrets.token_urlsafe(5).replace("_", "-")


def make_event(room: dict, event_type: str, payload: dict) -> dict:
    room["seq"] += 1
    event = {"seq": room["seq"], "type": event_type, "payload": payload, "at": now_ms()}
    room["events"].append(event)
    room["events"] = room["events"][-160:]
    save_rooms()
    return event


def load_rooms() -> None:
    global rooms
    if not ROOMS_FILE.exists():
        return
    try:
        data = json.loads(ROOMS_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return
    if isinstance(data, dict):
        rooms = data


def load_accounts() -> None:
    global accounts
    if not ACCOUNTS_FILE.exists():
        return
    try:
        data = json.loads(ACCOUNTS_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return
    if isinstance(data, dict):
        accounts = data


def save_rooms() -> None:
    try:
        DATA_DIR.mkdir(exist_ok=True)
        temp_file = ROOMS_FILE.with_suffix(".json.tmp")
        temp_file.write_text(json.dumps(rooms), encoding="utf-8")
        temp_file.replace(ROOMS_FILE)
    except OSError:
        pass


def save_accounts() -> None:
    try:
        DATA_DIR.mkdir(exist_ok=True)
        temp_file = ACCOUNTS_FILE.with_suffix(".json.tmp")
        temp_file.write_text(json.dumps(accounts), encoding="utf-8")
        temp_file.replace(ACCOUNTS_FILE)
    except OSError:
        pass


def award_badges(user: dict, badge: str) -> None:
    badges = user.setdefault("badges", [])
    if badge not in badges:
        badges.append(badge)


def active_users(room: dict) -> list[dict]:
    cutoff = now_ms() - 15000
    users = []
    for user in room["users"].values():
        copy = {
            "id": user.get("id", ""),
            "accountId": user.get("accountId", ""),
            "name": user.get("name", "Guest"),
            "avatar": clean_avatar(user.get("avatar", "male-1")),
            "vibe": user.get("vibe", "Ready"),
            "joinedAt": user.get("joinedAt", 0),
            "lastSeen": user.get("lastSeen", 0),
            "badges": user.get("badges", []),
            "stats": user.get("stats", {}),
        }
        copy["online"] = user.get("lastSeen", 0) >= cutoff
        users.append(copy)
    return users


def queue_snapshot(room: dict) -> list[dict]:
    items = []
    for item in room["queue"]:
        copy = dict(item)
        copy["votes"] = len(item.get("votes", []))
        copy["voterIds"] = list(item.get("votes", []))
        items.append(copy)
    return sorted(items, key=lambda item: (-item["votes"], item["addedAt"]))


def room_game_players(room: dict) -> list[dict]:
    users = list(room["users"].values())[:4]
    if not users:
        users = [{"id": "", "name": "Player 1", "avatar": "male-1"}]
    return users


def ludo_color_order(count: int) -> list[str]:
    return LUDO_COLOR_ORDER.get(max(1, min(4, count)), LUDO_COLOR_ORDER[4])[:count]


def default_games(count: int = 1) -> dict:
    colors = ludo_color_order(count)
    return {
        "ludo": {
            "gameId": secrets.token_urlsafe(8),
            "gameVersion": 2,
            "status": "waiting",
            "players": [],
            "colors": colors,
            "ready": {},
            "turn": 0,
            "turnNumber": 1,
            "pawns": [[-1, -1, -1, -1] for _ in range(count)],
            "pendingRoll": None,
            "rollHistory": [],
            "sixStreak": [0 for _ in range(count)],
            "ranking": [],
            "winner": None,
            "lastRoll": None,
            "message": "Press Ready. Host starts Ludo when 1-4 players are ready.",
            "updatedAt": now_ms(),
        },
        "snakes": {
            "turn": 0,
            "positions": [1 for _ in range(count)],
            "winner": None,
            "lastRoll": None,
            "message": "New Snake & Ladder round. First exact 100 wins.",
            "updatedAt": now_ms(),
        },
    }


def normalize_slots(slots: object, count: int, fallback: int) -> list[int]:
    source = slots if isinstance(slots, list) else []
    next_slots = [int(value) if isinstance(value, (int, float)) else fallback for value in source[:count]]
    while len(next_slots) < count:
        next_slots.append(fallback)
    return next_slots


def normalize_ludo_pawns(pawns: object, count: int) -> list[list[int]]:
    source = pawns if isinstance(pawns, list) else []
    next_pawns = [item for item in source[:count]]
    while len(next_pawns) < count:
        next_pawns.append([-1, -1, -1, -1])
    normalized = []
    for player_pawns in next_pawns:
        if not isinstance(player_pawns, list):
            normalized.append([-1, -1, -1, -1])
            continue
        row = [int(value) if isinstance(value, (int, float)) else -1 for value in player_pawns[:4]]
        while len(row) < 4:
            row.append(-1)
        normalized.append([max(-1, min(57, value)) for value in row])
    return normalized


def normalize_games(room: dict) -> dict:
    count = max(1, len(room_game_players(room)))
    games = room.setdefault("games", default_games(count))
    ludo = games.setdefault("ludo", default_games(count)["ludo"])
    snakes = games.setdefault("snakes", default_games(count)["snakes"])
    active_player_ids = [player.get("id", "") for player in room_game_players(room)[:4]]
    if ludo.get("status") in {"active", "finished", "paused"}:
        ludo_players = [player_id for player_id in ludo.get("players", []) if player_id in room["users"]]
        if not ludo_players:
            ludo_players = active_player_ids[:4]
    else:
        ludo_players = active_player_ids[:4]
    ludo_count = max(1, len(ludo_players))
    colors = ludo_color_order(ludo_count)
    ludo.setdefault("gameId", secrets.token_urlsafe(8))
    ludo["gameVersion"] = 2
    ludo["status"] = ludo.get("status") if ludo.get("status") in {"waiting", "active", "finished", "paused"} else "waiting"
    ludo["players"] = ludo_players
    ludo["colors"] = colors
    ludo["ready"] = {player_id: bool(ludo.get("ready", {}).get(player_id)) for player_id in active_player_ids[:4]}
    ludo["turnNumber"] = max(1, int(ludo.get("turnNumber", 1) or 1))
    ludo["pendingRoll"] = ludo.get("pendingRoll") if isinstance(ludo.get("pendingRoll"), dict) else None
    ludo["rollHistory"] = (ludo.get("rollHistory") if isinstance(ludo.get("rollHistory"), list) else [])[-120:]
    ludo["sixStreak"] = normalize_slots(ludo.get("sixStreak"), ludo_count, 0)
    ludo["ranking"] = ludo.get("ranking") if isinstance(ludo.get("ranking"), list) else []
    if ludo["status"] == "paused" and ludo_players:
        ludo["status"] = "active"
        ludo["message"] = ludo.get("message") or "Ludo reconnected. Continue from the current turn."
    ludo["pawns"] = normalize_ludo_pawns(ludo.get("pawns"), count)
    ludo["pawns"] = normalize_ludo_pawns(ludo.get("pawns"), ludo_count)
    snakes["positions"] = normalize_slots(snakes.get("positions"), count, 1)
    ludo["turn"] = int(ludo.get("turn", 0) or 0) % ludo_count
    snakes["turn"] = int(snakes.get("turn", 0) or 0) % count
    ludo.setdefault("winner", None)
    ludo.setdefault("lastRoll", None)
    ludo.setdefault("message", "Press Ready. Host starts Ludo when 1-4 players are ready.")
    snakes.setdefault("winner", None)
    snakes.setdefault("lastRoll", None)
    snakes.setdefault("message", "New Snake & Ladder round. First exact 100 wins.")
    return games


def games_snapshot(room: dict) -> dict:
    games = normalize_games(room)
    return {
        "ludo": {
            "gameId": games["ludo"].get("gameId"),
            "gameVersion": games["ludo"].get("gameVersion", 2),
            "status": games["ludo"].get("status", "waiting"),
            "players": games["ludo"].get("players", [])[:],
            "colors": games["ludo"].get("colors", [])[:],
            "ready": dict(games["ludo"].get("ready", {})),
            "turn": games["ludo"]["turn"],
            "turnNumber": games["ludo"].get("turnNumber", 1),
            "pawns": [row[:] for row in games["ludo"]["pawns"]],
            "pendingRoll": dict(games["ludo"].get("pendingRoll") or {}) or None,
            "rollHistory": games["ludo"].get("rollHistory", [])[-12:],
            "sixStreak": games["ludo"].get("sixStreak", [])[:],
            "ranking": games["ludo"].get("ranking", [])[:],
            "winner": games["ludo"].get("winner"),
            "lastRoll": games["ludo"].get("lastRoll"),
            "message": games["ludo"].get("message", ""),
            "updatedAt": games["ludo"].get("updatedAt", now_ms()),
        },
        "snakes": {
            "turn": games["snakes"]["turn"],
            "positions": games["snakes"]["positions"][:],
            "winner": games["snakes"].get("winner"),
            "lastRoll": games["snakes"].get("lastRoll"),
            "message": games["snakes"].get("message", ""),
            "updatedAt": games["snakes"].get("updatedAt", now_ms()),
        },
    }


def room_snapshot(room_id: str, room: dict) -> dict:
    room.setdefault("mix", DEFAULT_MIX.copy())
    return {
        "roomId": room_id,
        "users": active_users(room),
        "videoId": room["state"]["videoId"],
        "status": room["state"]["status"],
        "position": room["state"]["position"],
        "updatedAt": room["state"]["updatedAt"],
        "seq": room["seq"],
        "hostId": room.get("hostId"),
        "locked": bool(room.get("locked")),
        "theme": room.get("theme", "party"),
        "mix": room.get("mix", DEFAULT_MIX.copy()),
        "queue": queue_snapshot(room),
        "history": room.get("history", [])[-8:],
        "typing": [
            {"userId": user_id, "name": name}
            for user_id, data in room.get("typing", {}).items()
            if data.get("until", 0) > now_ms()
            for name in [data.get("name", "Someone")]
        ],
        "prompt": room.get("prompt"),
        "games": games_snapshot(room),
    }


def get_or_create_room(room_id: str | None = None) -> tuple[str, dict]:
    chosen = clean_room_id(room_id or "") or new_room_id()
    if chosen not in rooms:
        rooms[chosen] = {
            "users": {},
            "events": [],
            "queue": [],
            "history": [],
            "typing": {},
            "seq": 0,
            "hostId": None,
            "locked": False,
            "theme": "party",
            "mix": DEFAULT_MIX.copy(),
            "prompt": {"text": PROMPTS[0], "at": now_ms()},
            "games": default_games(1),
            "createdAt": now_ms(),
            "lastSeen": now_ms(),
            "state": {"videoId": DEFAULT_VIDEO, "status": "paused", "position": 0, "updatedAt": now_ms()},
        }
    rooms[chosen]["lastSeen"] = now_ms()
    return chosen, rooms[chosen]


def public_rooms() -> list[dict]:
    rows = []
    for room_id, room in rooms.items():
        users = active_users(room)
        if not users:
            continue
        theme = THEMES.get(room.get("theme", "party"), THEMES["party"])
        rows.append(
            {
                "roomId": room_id,
                "people": len(users),
                "theme": room.get("theme", "party"),
                "themeName": theme["name"],
                "themeEmoji": theme["emoji"],
                "status": room["state"]["status"],
            }
        )
    return sorted(rows, key=lambda row: (-row["people"], row["roomId"]))[:12]


def prune_rooms() -> None:
    cutoff = now_ms() - (ROOM_TTL_SECONDS * 1000)
    empty_for = now_ms() - (5 * 60 * 1000)
    changed = False
    for room_id in list(rooms.keys()):
        room = rooms[room_id]
        stale = room["lastSeen"] < cutoff
        empty = not room["users"] and room["lastSeen"] < empty_for
        if stale or empty:
            del rooms[room_id]
            changed = True
    if changed:
        save_rooms()


def read_json(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length", "0"))
    if length == 0:
        return {}
    return json.loads(handler.rfile.read(length).decode("utf-8"))


def decode_js_string(value: str) -> str:
    try:
        return json.loads(f'"{value}"')
    except json.JSONDecodeError:
        return html.unescape(value)


def search_youtube(query: str) -> list[dict]:
    if not query:
        return []
    if YOUTUBE_API_KEY:
        api_url = (
            "https://www.googleapis.com/youtube/v3/search"
            f"?part=snippet&type=video&videoEmbeddable=true&maxResults=8&q={quote_plus(query)}&key={quote_plus(YOUTUBE_API_KEY)}"
        )
        with urllib.request.urlopen(api_url, timeout=YOUTUBE_SEARCH_TIMEOUT) as response:
            payload = json.loads(response.read().decode("utf-8"))
        results = []
        for item in payload.get("items", []):
            video_id = item.get("id", {}).get("videoId", "")
            snippet = item.get("snippet", {})
            title = html.unescape(snippet.get("title", "YouTube video"))
            thumbnail = snippet.get("thumbnails", {}).get("high", {}).get("url") or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
            if video_id:
                results.append({"videoId": video_id, "title": title[:140], "thumbnail": thumbnail, "url": f"https://www.youtube.com/watch?v={video_id}"})
        return results

    search_url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
    request = urllib.request.Request(
        search_url,
        headers={"User-Agent": "Mozilla/5.0 WatchParty/1.0", "Accept-Language": "en-US,en;q=0.9"},
    )
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(request, timeout=YOUTUBE_SEARCH_TIMEOUT, context=context) as response:
        page = response.read().decode("utf-8", errors="ignore")

    results = []
    seen = set()
    for match in re.finditer(r'"videoId":"([a-zA-Z0-9_-]{11})"', page):
        video_id = match.group(1)
        if video_id in seen:
            continue
        nearby = page[match.start() : match.start() + 2400]
        title_match = re.search(r'"title":\{"runs":\[\{"text":"(.*?)"\}\]', nearby)
        if not title_match:
            title_match = re.search(r'"title":\{"simpleText":"(.*?)"\}', nearby)
        if not title_match:
            continue
        title = decode_js_string(title_match.group(1)).strip()
        if not title or title.lower() == "youtube":
            continue
        seen.add(video_id)
        results.append(
            {
                "videoId": video_id,
                "title": title[:140],
                "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                "url": f"https://www.youtube.com/watch?v={video_id}",
            }
        )
        if len(results) >= 8:
            break
    return results


def snake_jumps() -> dict[int, dict]:
    return {
        4: {"to": 25, "type": "ladder"},
        9: {"to": 31, "type": "ladder"},
        20: {"to": 38, "type": "ladder"},
        28: {"to": 84, "type": "ladder"},
        40: {"to": 59, "type": "ladder"},
        51: {"to": 67, "type": "ladder"},
        63: {"to": 81, "type": "ladder"},
        71: {"to": 91, "type": "ladder"},
        17: {"to": 7, "type": "snake"},
        54: {"to": 34, "type": "snake"},
        62: {"to": 19, "type": "snake"},
        64: {"to": 60, "type": "snake"},
        87: {"to": 24, "type": "snake"},
        93: {"to": 73, "type": "snake"},
        95: {"to": 75, "type": "snake"},
        98: {"to": 79, "type": "snake"},
    }


def ludo_board_index(color: str, progress: int) -> int:
    return (progress + LUDO_COLOR_STARTS.get(color, 0)) % 52


def ludo_capture_count(pawns: list[list[int]], colors: list[str], player_index: int, landing_progress: int) -> int:
    if landing_progress < 0 or landing_progress >= 52:
        return 0
    landing = ludo_board_index(colors[player_index], landing_progress)
    if landing in LUDO_SAFE_TILES:
        return 0
    total = 0
    for rival_index, rival_pawns in enumerate(pawns):
        if rival_index == player_index:
            continue
        total += sum(1 for position in rival_pawns if 0 <= position < 52 and ludo_board_index(colors[rival_index], position) == landing)
    return total


def ludo_candidates(pawns: list[list[int]], colors: list[str], player_index: int, roll: int) -> list[dict]:
    candidates = []
    for pawn_index, position in enumerate(pawns[player_index]):
        if position == 57:
            continue
        if position < 0:
            if roll == 6:
                candidates.append({"pawnIndex": pawn_index, "from": position, "to": 0, "opens": True, "finishes": False, "captures": ludo_capture_count(pawns, colors, player_index, 0)})
            continue
        to = position + roll
        if to <= 57:
            candidates.append({"pawnIndex": pawn_index, "from": position, "to": to, "opens": False, "finishes": to == 57, "captures": ludo_capture_count(pawns, colors, player_index, to)})
    return candidates


def ludo_player_map(room: dict, game_state: dict) -> list[dict]:
    players = []
    for player_id in game_state.get("players", []):
        user = room["users"].get(player_id)
        if user:
            players.append(user)
    if not players:
        players = room_game_players(room)[:4]
    return players


def capture_ludo_rivals(pawns: list[list[int]], colors: list[str], players: list[dict], player_index: int, pawn_index: int) -> str:
    progress = pawns[player_index][pawn_index]
    if progress < 0 or progress >= 52:
        return ""
    landing = ludo_board_index(colors[player_index], progress)
    if landing in LUDO_SAFE_TILES:
        return ""
    captured = []
    for rival_index, rival_pawns in enumerate(pawns):
        if rival_index == player_index:
            continue
        for rival_pawn_index, position in enumerate(rival_pawns):
            if position < 0 or position >= 52:
                continue
            if ludo_board_index(colors[rival_index], position) == landing:
                pawns[rival_index][rival_pawn_index] = -1
                captured.append(players[rival_index].get("name", f"Player {rival_index + 1}"))
    return ", ".join(captured)


def next_ludo_turn(game_state: dict, player_count: int) -> None:
    game_state["turn"] = (int(game_state.get("turn", 0)) + 1) % max(1, player_count)
    game_state["turnNumber"] = int(game_state.get("turnNumber", 1)) + 1
    game_state["pendingRoll"] = None


def reset_ludo_round(players: list[dict]) -> dict:
    game = default_games(max(1, len(players)))["ludo"]
    game["players"] = [player.get("id", "") for player in players]
    game["colors"] = ludo_color_order(len(players))
    game["ready"] = {player.get("id", ""): False for player in players}
    return game


def roll_dice() -> int:
    return secrets.randbelow(6) + 1


def valid_session(user: dict, session_token: str) -> bool:
    stored = str(user.get("sessionToken", ""))
    provided = str(session_token)
    return bool(stored and provided and secrets.compare_digest(stored, provided))


class WatchPartyHandler(BaseHTTPRequestHandler):
    server_version = "WatchParty/2.0"

    def do_HEAD(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)
            return
        self.serve_static(parsed.path, include_body=False)

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_cors_headers()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.route_get(parsed.path, parse_qs(parsed.query))
            return
        self.serve_static(parsed.path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.route_post(parsed.path)
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def route_get(self, path: str, query: dict[str, list[str]]) -> None:
        if path == "/api/health":
            with lock:
                self.json_response({"ok": True, "rooms": len(rooms), "accounts": len(accounts), "time": now_ms()})
            return

        if path == "/api/config":
            self.json_response(
                {
                    "appName": APP_NAME,
                    "supportEmail": SUPPORT_EMAIL,
                    "businessName": BUSINESS_NAME,
                    "paymentsEnabled": bool(STRIPE_PAYMENT_LINK),
                    "paymentLink": STRIPE_PAYMENT_LINK,
                    "officialYoutubeSearch": bool(YOUTUBE_API_KEY),
                    "storageProvider": "postgres-ready" if DATABASE_URL else "local-json",
                    "pushNotificationsReady": bool(VAPID_PUBLIC_KEY),
                    "vapidPublicKey": VAPID_PUBLIC_KEY,
                    "emailOtpReady": email_otp_ready(),
                    "emailProvider": "resend" if resend_ready() else "smtp" if smtp_ready() else "none",
                    "publicLoginEnabled": ENABLE_PUBLIC_LOGIN,
                }
            )
            return

        if path == "/api/auth/session":
            token = str(query.get("token", [""])[0])
            with lock:
                account = account_by_session(token)
                if not account:
                    self.json_response({"error": "Session expired. Please log in again."}, HTTPStatus.UNAUTHORIZED)
                    return
                save_accounts()
                self.json_response({"account": public_account(account)})
            return

        if path == "/api/rooms":
            with lock:
                prune_rooms()
                self.json_response({"rooms": public_rooms(), "themes": THEMES})
            return

        if path == "/api/search":
            search_text = str(query.get("q", [""])[0]).strip()[:120]
            if len(search_text) < 2:
                self.json_response({"results": []})
                return
            try:
                self.json_response({"results": search_youtube(search_text)})
            except (urllib.error.URLError, TimeoutError, OSError) as exc:
                self.json_response(
                    {
                        "error": "YouTube search is unavailable from this server right now.",
                        "details": str(exc)[:160],
                        "searchUrl": f"https://www.youtube.com/results?search_query={quote_plus(search_text)}",
                    },
                    HTTPStatus.BAD_GATEWAY,
                )
            return

        if path == "/api/events":
            room_id = clean_room_id(query.get("room", [""])[0])
            user_id = query.get("user", [""])[0]
            session_token = query.get("token", [""])[0]
            since = int(query.get("since", ["0"])[0] or 0)
            with lock:
                prune_rooms()
                room = rooms.get(room_id)
                if not room or user_id not in room["users"]:
                    self.json_response({"error": "Room or user not found"}, HTTPStatus.NOT_FOUND)
                    return
                if not valid_session(room["users"][user_id], session_token):
                    self.json_response({"error": "Login expired. Please join the room again."}, HTTPStatus.UNAUTHORIZED)
                    return
                room["lastSeen"] = now_ms()
                room["users"][user_id]["lastSeen"] = now_ms()
                events = [event for event in room["events"] if event["seq"] > since]
                snapshot = room_snapshot(room_id, room)
            self.json_response({"events": events, "snapshot": snapshot})
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def route_post(self, path: str) -> None:
        try:
            data = read_json(self)
        except Exception:
            self.json_response({"error": "Invalid JSON"}, HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/auth/request-otp":
            self.handle_request_otp(data)
            return
        if path == "/api/auth/public-login":
            self.handle_public_login(data)
            return
        if path == "/api/auth/verify-otp":
            self.handle_verify_otp(data)
            return
        if path == "/api/auth/logout":
            self.handle_logout(data)
            return
        if path == "/api/profile":
            self.handle_profile(data)
            return
        if path == "/api/leave":
            self.handle_leave(data)
            return
        if path == "/api/join":
            self.handle_join(data)
            return
        if path == "/api/friends":
            self.handle_friends(data)
            return
        if path == "/api/friends/respond":
            self.handle_friend_respond(data)
            return
        if path == "/api/notifications/subscribe":
            self.handle_notification_subscribe(data)
            return

        room_id, user_id = self.require_member(data)
        if not room_id:
            return

        if path == "/api/friends/add":
            self.handle_friend_add(room_id, user_id, data)
            return
        if path == "/api/friends/invite":
            self.handle_friend_invite(room_id, user_id, data)
            return
        if path == "/api/chat":
            self.handle_chat(room_id, user_id, data)
            return
        if path == "/api/control":
            self.handle_control(room_id, user_id, data)
            return
        if path == "/api/theme":
            self.handle_theme(room_id, user_id, data)
            return
        if path == "/api/mix":
            self.handle_mix(room_id, user_id, data)
            return
        if path == "/api/queue/add":
            self.handle_queue_add(room_id, user_id, data)
            return
        if path == "/api/queue/vote":
            self.handle_queue_vote(room_id, user_id, data)
            return
        if path == "/api/queue/remove":
            self.handle_queue_remove(room_id, user_id, data)
            return
        if path == "/api/queue/play":
            self.handle_queue_play(room_id, user_id, data)
            return
        if path == "/api/reaction":
            self.handle_reaction(room_id, user_id, data)
            return
        if path == "/api/typing":
            self.handle_typing(room_id, user_id, data)
            return
        if path == "/api/prompt":
            self.handle_prompt(room_id, user_id)
            return
        if path == "/api/game/roll":
            self.handle_game_roll(room_id, user_id, data)
            return
        if path == "/api/game/move":
            self.handle_ludo_move(room_id, user_id, data)
            return
        if path == "/api/game/ready":
            self.handle_ludo_ready(room_id, user_id)
            return
        if path == "/api/game/start":
            self.handle_ludo_start(room_id, user_id)
            return
        if path == "/api/game/reset":
            self.handle_game_reset(room_id, user_id, data)
            return
        if path == "/api/host/claim":
            self.handle_host_claim(room_id, user_id)
            return
        if path == "/api/host/transfer":
            self.handle_host_transfer(room_id, user_id, data)
            return
        if path == "/api/host/lock":
            self.handle_host_lock(room_id, user_id, data)
            return
        if path == "/api/host/remove":
            self.handle_host_remove(room_id, user_id, data)
            return

        self.send_error(HTTPStatus.NOT_FOUND)

    def create_account_session(self, account: dict) -> str:
        token = secrets.token_urlsafe(32)
        prune_account_sessions(account)
        account.setdefault("sessions", []).append({"token": token, "at": now_ms(), "expiresAt": now_ms() + SESSION_TTL_MS})
        account["lastSeen"] = now_ms()
        return token

    def handle_public_login(self, data: dict) -> None:
        if not ENABLE_PUBLIC_LOGIN:
            self.json_response({"error": "Public test login is disabled. Use email OTP login."}, HTTPStatus.GONE)
            return
        email = clean_email(str(data.get("email", "")))
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            self.json_response({"error": "Enter a valid email address."}, HTTPStatus.BAD_REQUEST)
            return
        with lock:
            account = ensure_account(email)
            if rate_limited(account, "public-login", OTP_REQUEST_LIMIT):
                save_accounts()
                self.json_response({"error": "Too many login attempts. Please wait a minute."}, HTTPStatus.TOO_MANY_REQUESTS)
                return
            token = self.create_account_session(account)
            save_accounts()
            self.json_response({"sessionToken": token, "account": public_account(account)})

    def handle_request_otp(self, data: dict) -> None:
        email = clean_email(str(data.get("email", "")))
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            self.json_response({"error": "Enter a valid email address."}, HTTPStatus.BAD_REQUEST)
            return
        with lock:
            account = ensure_account(email)
            if rate_limited(account, "otp-request", OTP_REQUEST_LIMIT):
                save_accounts()
                self.json_response({"error": "Too many OTP requests. Please wait a minute."}, HTTPStatus.TOO_MANY_REQUESTS)
                return
            otp = f"{secrets.randbelow(1_000_000):06d}"
            account["pendingOtp"] = {"hash": otp_digest(email, otp), "expiresAt": now_ms() + OTP_TTL_MS, "attempts": 0}
            save_accounts()
        try:
            send_otp_email(email, otp)
        except Exception as exc:
            with lock:
                account = accounts.get(email)
                if account:
                    account.pop("pendingOtp", None)
                    save_accounts()
            self.json_response({"error": f"Could not send OTP email: {str(exc)[:180]}"}, HTTPStatus.SERVICE_UNAVAILABLE)
            return
        self.json_response({"ok": True, "message": "OTP sent. Check your email for the six-digit code."})

    def handle_verify_otp(self, data: dict) -> None:
        email = clean_email(str(data.get("email", "")))
        otp = re.sub(r"\D", "", str(data.get("otp", "")))[:6]
        with lock:
            account = accounts.get(email)
            if not account:
                self.json_response({"error": "Request a fresh OTP first."}, HTTPStatus.BAD_REQUEST)
                return
            if rate_limited(account, "otp-verify", OTP_VERIFY_LIMIT):
                save_accounts()
                self.json_response({"error": "Too many OTP attempts. Please wait a minute."}, HTTPStatus.TOO_MANY_REQUESTS)
                return
            pending = account.get("pendingOtp") or {}
            if int(pending.get("expiresAt", 0)) < now_ms():
                self.json_response({"error": "OTP expired. Request a new code."}, HTTPStatus.BAD_REQUEST)
                return
            pending["attempts"] = int(pending.get("attempts", 0)) + 1
            if pending["attempts"] > OTP_VERIFY_LIMIT or not secrets.compare_digest(str(pending.get("hash", "")), otp_digest(email, otp)):
                account["pendingOtp"] = pending
                save_accounts()
                self.json_response({"error": "Invalid OTP. Check the six digits and try again."}, HTTPStatus.UNAUTHORIZED)
                return
            token = self.create_account_session(account)
            account.pop("pendingOtp", None)
            save_accounts()
            self.json_response({"sessionToken": token, "account": public_account(account)})

    def handle_logout(self, data: dict) -> None:
        token = str(data.get("sessionToken", ""))
        with lock:
            account = account_by_session(token)
            if account:
                account["sessions"] = [session for session in account.get("sessions", []) if not secrets.compare_digest(str(session.get("token", "")), token)]
                save_accounts()
        self.json_response({"ok": True})

    def handle_profile(self, data: dict) -> None:
        token = str(data.get("sessionToken", ""))
        nickname = clean_nickname(str(data.get("nickname", "")))
        display_name = str(data.get("displayName", "")).strip()[:32]
        avatar = clean_avatar(data.get("avatar", "male-1"))
        status = str(data.get("status", "")).strip()[:60] or "Ready"
        error = nickname_error(nickname)
        if error:
            self.json_response({"error": error}, HTTPStatus.BAD_REQUEST)
            return
        with lock:
            account = account_by_session(token)
            if not account:
                self.json_response({"error": "Session expired. Please log in again."}, HTTPStatus.UNAUTHORIZED)
                return
            account.update(
                {
                    "nickname": nickname,
                    "displayName": nickname,
                    "name": nickname,
                    "avatar": avatar,
                    "status": status,
                    "vibe": status,
                    "updatedAt": now_ms(),
                    "lastSeen": now_ms(),
                }
            )
            save_accounts()
            self.json_response({"account": public_account(account)})

    def handle_join(self, data: dict) -> None:
        auth_session = str(data.get("authSessionToken", ""))
        requested_room = str(data.get("roomId", "")).strip()
        action = str(data.get("action", "join")).strip().lower()
        with lock:
            account = account_by_session(auth_session)
            if not account:
                self.json_response({"error": "Please log in before joining a room."}, HTTPStatus.UNAUTHORIZED)
                return
            if not account.get("nickname"):
                self.json_response({"error": "Choose a nickname before joining a room."}, HTTPStatus.FORBIDDEN)
                return
            name = account.get("nickname") or "Guest"
            email = account.get("email", "")
            avatar = clean_avatar(account.get("avatar", "male-1"))
            vibe = account.get("status") or "Ready"
            prune_rooms()
            if action == "create":
                room_id, room = get_or_create_room("")
            else:
                room_id = clean_room_id(requested_room)
                if not room_id:
                    self.json_response({"error": "Enter a room code or tap Create Room."}, HTTPStatus.BAD_REQUEST)
                    return
                room = rooms.get(room_id)
                if not room:
                    self.json_response({"error": "Room not found. Ask for the latest code or create a new room."}, HTTPStatus.NOT_FOUND)
                    return
                if room.get("locked"):
                    self.json_response({"error": "This room is locked by the host."}, HTTPStatus.FORBIDDEN)
                    return
            if len(room["users"]) >= MAX_USERS:
                self.json_response({"error": "This room already has 5 people."}, HTTPStatus.CONFLICT)
                return
            save_accounts()
            user_id = secrets.token_urlsafe(12)
            user = {
                "id": user_id,
                "accountId": account["id"],
                "email": email,
                "sessionToken": auth_session,
                "name": name,
                "avatar": avatar,
                "vibe": vibe,
                "joinedAt": now_ms(),
                "lastSeen": now_ms(),
                "badges": ["Founder"] if not room["users"] else [],
                "stats": {"chats": 0, "reactions": 0, "queueAdds": 0},
            }
            room["users"][user_id] = user
            account["lastRoomId"] = room_id
            if not room.get("hostId"):
                room["hostId"] = user_id
                award_badges(user, "DJ")
            make_event(room, "system", {"message": f"{name} joined the room."})
            for other in room["users"].values():
                if other.get("id") == user_id:
                    continue
                other_account = account_by_id(str(other.get("accountId", "")))
                if other_account and account["id"] in other_account.get("friends", []):
                    make_event(room, "system", {"message": f"Your friend {name} is online."})
                    break
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
            save_accounts()
        self.json_response({"user": user, "room": snapshot})

    def handle_friends(self, data: dict) -> None:
        token = str(data.get("sessionToken", ""))
        with lock:
            account = account_by_session(token)
            if not account:
                self.json_response({"error": "Session expired. Please log in again."}, HTTPStatus.UNAUTHORIZED)
                return
            save_accounts()
            self.json_response({"account": public_account(account)})

    def handle_friend_add(self, room_id: str, user_id: str, data: dict) -> None:
        target_user_id = str(data.get("targetUserId", ""))
        with lock:
            room = rooms[room_id]
            user = room["users"][user_id]
            target_user = room["users"].get(target_user_id)
            if not target_user:
                self.json_response({"error": "That person is not in this room."}, HTTPStatus.NOT_FOUND)
                return
            if target_user_id == user_id:
                self.json_response({"error": "You are already yourself, which is powerful enough."}, HTTPStatus.BAD_REQUEST)
                return
            account = account_by_id(str(user.get("accountId", "")))
            target_account = account_by_id(str(target_user.get("accountId", "")))
            if not account or not target_account:
                self.json_response({"error": "Could not link these profiles right now."}, HTTPStatus.BAD_REQUEST)
                return
            account.setdefault("friends", [])
            target_account.setdefault("friends", [])
            if target_account["id"] in account["friends"]:
                self.json_response({"error": "You are already friends."}, HTTPStatus.CONFLICT)
                return
            target_account.setdefault("friendRequests", [])
            existing = any(request.get("fromAccountId") == account["id"] for request in target_account["friendRequests"])
            if not existing:
                target_account["friendRequests"].append(
                    {
                        "id": secrets.token_urlsafe(8),
                        "fromAccountId": account["id"],
                        "fromName": user.get("name", "Friend"),
                        "fromAvatar": clean_avatar(user.get("avatar", "male-1")),
                        "at": now_ms(),
                    }
                )
                target_account["friendRequests"] = target_account["friendRequests"][-30:]
            save_accounts()
            make_event(room, "system", {"message": f"{user['name']} sent {target_user['name']} a friend request."})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot, "account": public_account(account)})

    def handle_friend_respond(self, data: dict) -> None:
        token = str(data.get("sessionToken", ""))
        request_id = str(data.get("requestId", ""))
        action = str(data.get("action", "")).lower()
        with lock:
            account = account_by_session(token)
            if not account:
                self.json_response({"error": "Session expired. Please log in again."}, HTTPStatus.UNAUTHORIZED)
                return
            request = next((item for item in account.get("friendRequests", []) if item.get("id") == request_id), None)
            if not request:
                self.json_response({"error": "Friend request not found."}, HTTPStatus.NOT_FOUND)
                return
            account["friendRequests"] = [item for item in account.get("friendRequests", []) if item.get("id") != request_id]
            from_account = account_by_id(str(request.get("fromAccountId", "")))
            if action == "accept" and from_account:
                account.setdefault("friends", [])
                from_account.setdefault("friends", [])
                if from_account["id"] not in account["friends"]:
                    account["friends"].append(from_account["id"])
                if account["id"] not in from_account["friends"]:
                    from_account["friends"].append(account["id"])
            save_accounts()
            self.json_response({"ok": True, "account": public_account(account)})

    def handle_notification_subscribe(self, data: dict) -> None:
        token = str(data.get("sessionToken", ""))
        subscription = data.get("subscription")
        with lock:
            account = account_by_session(token)
            if not account:
                self.json_response({"error": "Session expired. Please log in again."}, HTTPStatus.UNAUTHORIZED)
                return
            account.setdefault("notificationPreferences", {})["browser"] = True
            if isinstance(subscription, dict):
                account.setdefault("pushSubscriptions", [])
                endpoint = str(subscription.get("endpoint", ""))
                account["pushSubscriptions"] = [item for item in account["pushSubscriptions"] if item.get("endpoint") != endpoint]
                account["pushSubscriptions"].append(subscription)
                account["pushSubscriptions"] = account["pushSubscriptions"][-5:]
            save_accounts()
            self.json_response({"ok": True, "account": public_account(account), "pushReady": bool(VAPID_PUBLIC_KEY)})

    def handle_friend_invite(self, room_id: str, user_id: str, data: dict) -> None:
        target_account_id = str(data.get("targetAccountId", ""))
        with lock:
            room = rooms[room_id]
            user = room["users"][user_id]
            account = account_by_id(str(user.get("accountId", "")))
            target_account = account_by_id(target_account_id)
            if not account or not target_account:
                self.json_response({"error": "Friend not found."}, HTTPStatus.NOT_FOUND)
                return
            if target_account_id not in account.get("friends", []):
                self.json_response({"error": "Add this person as a friend before inviting directly."}, HTTPStatus.FORBIDDEN)
                return
            invite = {
                "id": secrets.token_urlsafe(8),
                "roomId": room_id,
                "fromAccountId": account.get("id", ""),
                "fromName": user.get("name", "Friend"),
                "fromAvatar": clean_avatar(user.get("avatar", "male-1")),
                "at": now_ms(),
            }
            target_account.setdefault("roomInvites", []).append(invite)
            target_account["roomInvites"] = target_account["roomInvites"][-20:]
            save_accounts()
            make_event(room, "system", {"message": f"{user['name']} invited a friend to room {room_id}."})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_leave(self, data: dict) -> None:
        room_id = clean_room_id(str(data.get("roomId", "")))
        user_id = str(data.get("userId", ""))
        session_token = str(data.get("sessionToken", ""))
        with lock:
            room = rooms.get(room_id)
            if room and user_id in room["users"]:
                if not valid_session(room["users"][user_id], session_token):
                    self.json_response({"error": "Login expired. Please join the room again."}, HTTPStatus.UNAUTHORIZED)
                    return
                user = room["users"][user_id]
                del room["users"][user_id]
                if room.get("hostId") == user_id:
                    room["hostId"] = next(iter(room["users"]), None)
                    if room["hostId"]:
                        award_badges(room["users"][room["hostId"]], "DJ")
                make_event(room, "system", {"message": f"{user['name']} left the room."})
                make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
                room["lastSeen"] = now_ms()
        self.json_response({"ok": True})

    def handle_chat(self, room_id: str, user_id: str, data: dict) -> None:
        text = str(data.get("text", "")).strip()[:400]
        image = data.get("image")
        image_payload = None
        if isinstance(image, dict):
            image_type = str(image.get("type", ""))[:80]
            image_data = str(image.get("data", ""))
            image_name = str(image.get("name", "Photo"))[:80]
            if not image_type.startswith("image/") or not image_data.startswith(f"data:{image_type};base64,"):
                self.json_response({"error": "Only photo/image attachments are allowed."}, HTTPStatus.BAD_REQUEST)
                return
            if len(image_data) > MAX_CHAT_IMAGE_CHARS:
                self.json_response({"error": "Photo is too large. Please use a smaller image."}, HTTPStatus.BAD_REQUEST)
                return
            image_payload = {"type": image_type, "name": image_name, "data": image_data}
        if not text and not image_payload:
            self.json_response({"error": "Message is empty"}, HTTPStatus.BAD_REQUEST)
            return
        with lock:
            room = rooms[room_id]
            user = room["users"][user_id]
            user["stats"]["chats"] += 1
            if user["stats"]["chats"] >= 5:
                award_badges(user, "Chat Star")
            room.get("typing", {}).pop(user_id, None)
            make_event(room, "chat", {"userId": user_id, "name": user["name"], "avatar": clean_avatar(user.get("avatar", "male-1")), "text": text, "image": image_payload})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
        self.json_response({"ok": True})

    def handle_control(self, room_id: str, user_id: str, data: dict) -> None:
        action = str(data.get("action", ""))
        position = max(0, float(data.get("position", 0) or 0))
        video_id = clean_video_id(str(data.get("videoId", "")))
        with lock:
            room = rooms[room_id]
            user = room["users"][user_id]
            if action == "load":
                if not re.match(r"^[a-zA-Z0-9_-]{6,20}$", video_id):
                    self.json_response({"error": "Invalid YouTube video ID"}, HTTPStatus.BAD_REQUEST)
                    return
                room["state"].update({"videoId": video_id, "status": "paused", "position": 0, "updatedAt": now_ms()})
                room["history"].append({"videoId": video_id, "title": str(data.get("title", "YouTube video"))[:140], "by": user["name"], "at": now_ms()})
                room["history"] = room["history"][-12:]
            elif action in {"play", "pause", "seek"}:
                room["state"].update({"status": "playing" if action == "play" else "paused", "position": position, "updatedAt": now_ms()})
            else:
                self.json_response({"error": "Unknown control action"}, HTTPStatus.BAD_REQUEST)
                return
            make_event(room, "control", {"userId": user_id, "name": user["name"], "action": action, **room["state"]})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_theme(self, room_id: str, user_id: str, data: dict) -> None:
        theme = str(data.get("theme", "party"))
        if theme not in THEMES:
            self.json_response({"error": "Unknown theme"}, HTTPStatus.BAD_REQUEST)
            return
        with lock:
            room = rooms[room_id]
            user = room["users"][user_id]
            room["theme"] = theme
            make_event(room, "theme", {"theme": theme, "name": THEMES[theme]["name"], "emoji": THEMES[theme]["emoji"], "by": user["name"]})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_mix(self, room_id: str, user_id: str, data: dict) -> None:
        def bounded_int(name: str, fallback: int, low: int, high: int) -> int:
            try:
                value = int(float(data.get(name, fallback)))
            except (TypeError, ValueError):
                value = fallback
            return max(low, min(high, value))

        mix = {
            "bass": bounded_int("bass", DEFAULT_MIX["bass"], 0, 100),
            "volume": bounded_int("volume", DEFAULT_MIX["volume"], 0, 100),
        }
        with lock:
            room = rooms[room_id]
            user = room["users"][user_id]
            room["mix"] = mix
            make_event(room, "mix", {"userId": user_id, "name": user["name"], "mix": mix})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_queue_add(self, room_id: str, user_id: str, data: dict) -> None:
        video_id = clean_video_id(str(data.get("videoId", "")))
        title = str(data.get("title", "YouTube video")).strip()[:140] or "YouTube video"
        thumbnail = str(data.get("thumbnail", f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg")).strip()[:220]
        if not re.match(r"^[a-zA-Z0-9_-]{6,20}$", video_id):
            self.json_response({"error": "Invalid YouTube video ID"}, HTTPStatus.BAD_REQUEST)
            return
        with lock:
            room = rooms[room_id]
            user = room["users"][user_id]
            item = {
                "id": secrets.token_urlsafe(8),
                "videoId": video_id,
                "title": title,
                "thumbnail": thumbnail,
                "addedBy": user["name"],
                "addedById": user_id,
                "addedAt": now_ms(),
                "votes": [user_id],
            }
            room["queue"].append(item)
            room["queue"] = room["queue"][-30:]
            user["stats"]["queueAdds"] += 1
            award_badges(user, "Curator")
            make_event(room, "queue", {"message": f"{user['name']} added “{title}” to the queue."})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_queue_vote(self, room_id: str, user_id: str, data: dict) -> None:
        item_id = str(data.get("itemId", ""))
        with lock:
            room = rooms[room_id]
            for item in room["queue"]:
                if item["id"] == item_id:
                    votes = item.setdefault("votes", [])
                    if user_id in votes:
                        votes.remove(user_id)
                    else:
                        votes.append(user_id)
                    break
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_queue_remove(self, room_id: str, user_id: str, data: dict) -> None:
        item_id = str(data.get("itemId", ""))
        with lock:
            room = rooms[room_id]
            user = room["users"][user_id]
            item = next((entry for entry in room["queue"] if entry.get("id") == item_id), None)
            if not item:
                self.json_response({"error": "Queue item not found."}, HTTPStatus.NOT_FOUND)
                return
            if item.get("addedById") != user_id and room.get("hostId") != user_id:
                self.json_response({"error": "Only the host or the person who added it can remove this song."}, HTTPStatus.FORBIDDEN)
                return
            room["queue"] = [entry for entry in room["queue"] if entry.get("id") != item_id]
            title = item.get("title", "song")
            make_event(room, "queue", {"message": f"{user['name']} removed “{title}” from the queue."})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_queue_play(self, room_id: str, user_id: str, data: dict) -> None:
        item_id = str(data.get("itemId", ""))
        with lock:
            room = rooms[room_id]
            user = room["users"][user_id]
            item = next((entry for entry in queue_snapshot(room) if entry["id"] == item_id), None)
            if not item and room["queue"]:
                item = queue_snapshot(room)[0]
            if not item:
                self.json_response({"error": "Queue is empty"}, HTTPStatus.BAD_REQUEST)
                return
            room["queue"] = [entry for entry in room["queue"] if entry["id"] != item["id"]]
            room["state"].update({"videoId": item["videoId"], "status": "playing", "position": 0, "updatedAt": now_ms()})
            room["history"].append({"videoId": item["videoId"], "title": item["title"], "by": user["name"], "at": now_ms()})
            make_event(room, "control", {"userId": user_id, "name": user["name"], "action": "load", **room["state"]})
            make_event(room, "queue", {"message": f"{user['name']} started “{item['title']}” from the queue."})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_reaction(self, room_id: str, user_id: str, data: dict) -> None:
        emoji = str(data.get("emoji", "🔥")).strip()[:8]
        with lock:
            room = rooms[room_id]
            user = room["users"][user_id]
            user["stats"]["reactions"] += 1
            if user["stats"]["reactions"] >= 5:
                award_badges(user, "Top Reactor")
            make_event(room, "reaction", {"emoji": emoji, "name": user["name"], "avatar": clean_avatar(user.get("avatar", "male-1"))})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
        self.json_response({"ok": True})

    def handle_typing(self, room_id: str, user_id: str, data: dict) -> None:
        with lock:
            room = rooms[room_id]
            user = room["users"][user_id]
            if data.get("typing"):
                room["typing"][user_id] = {"name": user["name"], "until": now_ms() + 3500}
            else:
                room["typing"].pop(user_id, None)
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
        self.json_response({"ok": True})

    def handle_prompt(self, room_id: str, user_id: str) -> None:
        with lock:
            room = rooms[room_id]
            index = int(time.time()) % len(PROMPTS)
            room["prompt"] = {"text": PROMPTS[index], "at": now_ms(), "by": room["users"][user_id]["name"]}
            make_event(room, "prompt", room["prompt"])
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_game_roll(self, room_id: str, user_id: str, data: dict) -> None:
        game = str(data.get("game", ""))
        if game not in {"ludo", "snakes"}:
            self.json_response({"error": "Unknown game"}, HTTPStatus.BAD_REQUEST)
            return
        with lock:
            room = rooms[room_id]
            games = normalize_games(room)
            players = ludo_player_map(room, games["ludo"]) if game == "ludo" else room_game_players(room)
            if user_id not in {player.get("id") for player in players}:
                self.json_response({"error": "Join this game as one of the first 4 players."}, HTTPStatus.FORBIDDEN)
                return
            game_state = games[game]
            active_index = game_state["turn"] % len(players)
            active_user = players[active_index]
            if active_user.get("id") != user_id:
                self.json_response({"error": f"It is {active_user.get('name', 'another player')}'s turn."}, HTTPStatus.CONFLICT)
                return
            if game == "ludo" and game_state.get("pendingRoll"):
                self.json_response({"error": "Select a movable pawn before rolling again."}, HTTPStatus.CONFLICT)
                return
            if game == "ludo" and game_state.get("status") != "active":
                if game_state.get("status") == "paused":
                    game_state["status"] = "active"
                else:
                    self.json_response({"error": "Host must start Ludo after players press Ready."}, HTTPStatus.CONFLICT)
                    return
            roll = roll_dice()
            if game == "ludo":
                message, extra_turn = self.apply_ludo_roll(game_state, players, active_index, roll)
            else:
                message, extra_turn = self.apply_snakes_roll(game_state, players, active_index, roll)
            game_state["lastRoll"] = roll
            game_state["message"] = message
            game_state["updatedAt"] = now_ms()
            if game != "ludo" and not extra_turn:
                game_state["turn"] = (game_state["turn"] + 1) % len(players)
            payload = {"game": game, "message": message, "roll": roll, "by": active_user.get("name", "Player"), "snapshot": games_snapshot(room)}
            make_event(room, "game", payload)
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot, "message": message, "roll": roll})

    def apply_ludo_roll(self, game_state: dict, players: list[dict], player_index: int, roll: int) -> tuple[str, bool]:
        if game_state.get("status") != "active":
            return f"{game_state.get('winner') or 'This round'} already finished. Reset for a new Ludo round.", False
        if game_state.get("winner"):
            return f"{game_state['winner']} already won Ludo. Reset for a new round.", False
        player = players[player_index]
        pawns = game_state["pawns"]
        colors = game_state.get("colors") or ludo_color_order(len(players))
        record = {
            "gameId": game_state.get("gameId"),
            "playerId": player.get("id", ""),
            "diceValue": roll,
            "turnNumber": game_state.get("turnNumber", 1),
            "gameVersion": game_state.get("gameVersion", 2),
            "timestamp": now_ms(),
        }
        game_state.setdefault("rollHistory", []).append(record)
        game_state["rollHistory"] = game_state["rollHistory"][-120:]
        game_state["sixStreak"] = normalize_slots(game_state.get("sixStreak"), len(players), 0)
        if roll == 6:
            game_state["sixStreak"][player_index] += 1
        else:
            game_state["sixStreak"][player_index] = 0
        if game_state["sixStreak"][player_index] >= 3:
            game_state["pendingRoll"] = None
            game_state["sixStreak"][player_index] = 0
            message = f"{player['name']} rolled three sixes. Third six is cancelled and turn passes."
            next_ludo_turn(game_state, len(players))
            return message, False
        game_state["lastRoll"] = roll
        candidates = ludo_candidates(pawns, colors, player_index, roll)
        if not candidates:
            locked = all(position < 0 for position in pawns[player_index])
            reason = "Need a 6 to open a pawn." if locked and roll != 6 else "No legal move; exact roll is needed near HOME."
            next_ludo_turn(game_state, len(players))
            return f"{player['name']} rolled {roll}. {reason}", False
        if len(candidates) > 1:
            game_state["pendingRoll"] = {
                "playerIndex": player_index,
                "playerId": player.get("id", ""),
                "diceValue": roll,
                "movable": [move["pawnIndex"] for move in candidates],
                "moves": candidates,
                "rolledAt": now_ms(),
            }
            return f"{player['name']} rolled {roll}. Select one highlighted pawn.", True
        return self.apply_ludo_move_choice(game_state, players, player_index, candidates[0])

    def apply_ludo_move_choice(self, game_state: dict, players: list[dict], player_index: int, move: dict) -> tuple[str, bool]:
        player = players[player_index]
        pawns = game_state["pawns"]
        colors = game_state.get("colors") or ludo_color_order(len(players))
        roll = int(game_state.get("lastRoll") or game_state.get("pendingRoll", {}).get("diceValue") or 0)
        pawns[player_index][move["pawnIndex"]] = move["to"]
        captured = capture_ludo_rivals(pawns, colors, players, player_index, move["pawnIndex"])
        game_state["pendingRoll"] = None
        if all(position == 57 for position in pawns[player_index]):
            game_state["winner"] = player["name"]
            game_state["status"] = "finished"
            game_state.setdefault("ranking", []).append({"playerId": player.get("id"), "name": player["name"], "at": now_ms()})
            return f"{player['name']} brought all 4 pawns HOME and won Ludo.", False
        if move["from"] < 0:
            action = f"opened pawn {move['pawnIndex'] + 1}"
        elif move["to"] == 57:
            action = f"sent pawn {move['pawnIndex'] + 1} HOME"
        elif move["to"] >= 52:
            action = f"moved pawn {move['pawnIndex'] + 1} into the home lane"
        else:
            action = f"moved pawn {move['pawnIndex'] + 1}"
        capture_text = f" Captured {captured}." if captured else ""
        extra = roll == 6 or bool(captured) or move["to"] == 57
        if not extra:
            game_state["sixStreak"][player_index] = 0
            next_ludo_turn(game_state, len(players))
        else:
            game_state["turnNumber"] = int(game_state.get("turnNumber", 1)) + 1
        return f"{player['name']} rolled {roll} and {action}.{capture_text}{' Roll again.' if extra else ''}", extra

    def handle_ludo_move(self, room_id: str, user_id: str, data: dict) -> None:
        try:
            pawn_index = int(data.get("pawnIndex", -1))
        except (TypeError, ValueError):
            pawn_index = -1
        with lock:
            room = rooms[room_id]
            games = normalize_games(room)
            game_state = games["ludo"]
            players = ludo_player_map(room, game_state)
            pending = game_state.get("pendingRoll") or {}
            if not pending:
                self.json_response({"error": "Roll first, then select a highlighted pawn."}, HTTPStatus.CONFLICT)
                return
            if pending.get("playerId") != user_id:
                self.json_response({"error": "Only the active player can move this pawn."}, HTTPStatus.FORBIDDEN)
                return
            if pawn_index not in pending.get("movable", []):
                self.json_response({"error": "That pawn cannot move for this dice roll."}, HTTPStatus.BAD_REQUEST)
                return
            player_index = int(pending.get("playerIndex", 0))
            move = next((item for item in pending.get("moves", []) if item.get("pawnIndex") == pawn_index), None)
            if not move:
                self.json_response({"error": "Move expired. Roll again."}, HTTPStatus.CONFLICT)
                return
            game_state["lastRoll"] = int(pending.get("diceValue") or 0)
            message, _extra = self.apply_ludo_move_choice(game_state, players, player_index, move)
            game_state["message"] = message
            game_state["updatedAt"] = now_ms()
            make_event(room, "game", {"game": "ludo", "message": message, "by": players[player_index].get("name", "Player"), "snapshot": games_snapshot(room)})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot, "message": message})

    def handle_ludo_ready(self, room_id: str, user_id: str) -> None:
        with lock:
            room = rooms[room_id]
            games = normalize_games(room)
            ludo = games["ludo"]
            players = room_game_players(room)[:4]
            if user_id not in {player.get("id") for player in players}:
                self.json_response({"error": "Only the first 4 room members can ready up for Ludo."}, HTTPStatus.FORBIDDEN)
                return
            ludo["players"] = [player.get("id", "") for player in players]
            ludo["colors"] = ludo_color_order(len(players))
            ludo["ready"][user_id] = True
            user = room["users"][user_id]
            ludo["message"] = f"{user['name']} is ready for Ludo."
            if room.get("hostId") == user_id and players and all(ludo["ready"].get(player.get("id")) for player in players):
                games["ludo"] = reset_ludo_round(players)
                games["ludo"]["status"] = "active"
                games["ludo"]["ready"] = {player.get("id", ""): True for player in players}
                games["ludo"]["message"] = f"Ludo started with {len(players)} player{'s' if len(players) != 1 else ''}. {players[0]['name']} rolls first."
            event_message = games["ludo"]["message"]
            make_event(room, "game", {"game": "ludo", "message": event_message, "by": user["name"], "snapshot": games_snapshot(room)})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_ludo_start(self, room_id: str, user_id: str) -> None:
        with lock:
            room = rooms[room_id]
            if room.get("hostId") != user_id:
                self.json_response({"error": "Only the host can start Ludo."}, HTTPStatus.FORBIDDEN)
                return
            players = room_game_players(room)[:4]
            if len(players) < 1:
                self.json_response({"error": "Need at least 1 player to start Ludo."}, HTTPStatus.BAD_REQUEST)
                return
            games = normalize_games(room)
            ready = games["ludo"].get("ready", {})
            missing = [player["name"] for player in players if not ready.get(player.get("id"))]
            if missing:
                self.json_response({"error": f"Waiting for ready: {', '.join(missing)}"}, HTTPStatus.CONFLICT)
                return
            games["ludo"] = reset_ludo_round(players)
            games["ludo"]["status"] = "active"
            games["ludo"]["ready"] = {player.get("id", ""): True for player in players}
            games["ludo"]["message"] = f"Ludo started with {len(players)} player{'s' if len(players) != 1 else ''}. {players[0]['name']} rolls first."
            make_event(room, "game", {"game": "ludo", "message": games["ludo"]["message"], "by": room["users"][user_id]["name"], "snapshot": games_snapshot(room)})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def apply_snakes_roll(self, game_state: dict, players: list[dict], player_index: int, roll: int) -> tuple[str, bool]:
        if game_state.get("winner"):
            return f"{game_state['winner']} already won. Reset for a new round.", False
        player = players[player_index]
        current = game_state["positions"][player_index] or 1
        if current + roll > 100:
            return f"{player['name']} rolled {roll}. Exact roll needed for 100.", roll == 6
        next_position = current + roll
        jump = snake_jumps().get(next_position)
        jump_text = ""
        if jump:
            jump_text = f" climbed {next_position} to {jump['to']}" if jump["type"] == "ladder" else f" slid {next_position} to {jump['to']}"
            next_position = jump["to"]
        game_state["positions"][player_index] = next_position
        if next_position == 100:
            game_state["winner"] = player["name"]
            return f"{player['name']} landed on 100 and won Snake & Ladder.", False
        extra = roll == 6
        return f"{player['name']} rolled {roll}{jump_text}.{' Roll again.' if extra else ''}", extra

    def handle_game_reset(self, room_id: str, user_id: str, data: dict) -> None:
        game = str(data.get("game", ""))
        if game not in {"ludo", "snakes"}:
            self.json_response({"error": "Unknown game"}, HTTPStatus.BAD_REQUEST)
            return
        with lock:
            room = rooms[room_id]
            if game == "ludo" and room.get("hostId") != user_id:
                self.json_response({"error": "Only the host can reset Ludo."}, HTTPStatus.FORBIDDEN)
                return
            players = room_game_players(room)
            games = normalize_games(room)
            user = room["users"][user_id]
            games[game] = reset_ludo_round(players[:4]) if game == "ludo" else default_games(len(players))[game]
            label = "Ludo" if game == "ludo" else "Snake & Ladder"
            message = f"{user['name']} reset {label}."
            make_event(room, "game", {"game": game, "message": message, "by": user["name"], "snapshot": games_snapshot(room)})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_host_claim(self, room_id: str, user_id: str) -> None:
        with lock:
            room = rooms[room_id]
            current_host_id = room.get("hostId")
            current_host = room["users"].get(current_host_id or "")
            current_host_online = bool(current_host and current_host.get("lastSeen", 0) >= now_ms() - 15000)
            if current_host_id and current_host_id != user_id and current_host_online:
                self.json_response({"error": "Host is locked. Ask the current host to make you host."}, HTTPStatus.FORBIDDEN)
                return
            room["hostId"] = user_id
            user = room["users"][user_id]
            award_badges(user, "DJ")
            make_event(room, "system", {"message": f"{user['name']} is hosting now."})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_host_transfer(self, room_id: str, user_id: str, data: dict) -> None:
        target_id = str(data.get("targetUserId", ""))
        with lock:
            room = rooms[room_id]
            if room.get("hostId") != user_id:
                self.json_response({"error": "Only the host can change host."}, HTTPStatus.FORBIDDEN)
                return
            if target_id not in room["users"]:
                self.json_response({"error": "That person is not in this room."}, HTTPStatus.NOT_FOUND)
                return
            room["hostId"] = target_id
            user = room["users"][target_id]
            award_badges(user, "DJ")
            make_event(room, "system", {"message": f"{user['name']} is hosting now."})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_host_lock(self, room_id: str, user_id: str, data: dict) -> None:
        locked = bool(data.get("locked"))
        with lock:
            room = rooms[room_id]
            if room.get("hostId") != user_id:
                self.json_response({"error": "Only the host can lock this room."}, HTTPStatus.FORBIDDEN)
                return
            room["locked"] = locked
            user = room["users"][user_id]
            message = f"{user['name']} {'locked' if locked else 'unlocked'} the room."
            make_event(room, "system", {"message": message})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def handle_host_remove(self, room_id: str, user_id: str, data: dict) -> None:
        target_id = str(data.get("targetUserId", ""))
        with lock:
            room = rooms[room_id]
            if room.get("hostId") != user_id:
                self.json_response({"error": "Only the host can remove people."}, HTTPStatus.FORBIDDEN)
                return
            if target_id == user_id:
                self.json_response({"error": "Host cannot remove themselves."}, HTTPStatus.BAD_REQUEST)
                return
            target = room["users"].get(target_id)
            if not target:
                self.json_response({"error": "That person is not in this room."}, HTTPStatus.NOT_FOUND)
                return
            del room["users"][target_id]
            message = f"{target.get('name', 'Someone')} was removed by the host."
            make_event(room, "system", {"message": message})
            make_event(room, "room", {"snapshot": room_snapshot(room_id, room)})
            snapshot = room_snapshot(room_id, room)
        self.json_response({"ok": True, "room": snapshot})

    def require_member(self, data: dict) -> tuple[str | None, str | None]:
        room_id = clean_room_id(str(data.get("roomId", "")))
        user_id = str(data.get("userId", ""))
        session_token = str(data.get("sessionToken", ""))
        with lock:
            room = rooms.get(room_id)
            if not room or user_id not in room["users"]:
                self.json_response({"error": "Room or user not found"}, HTTPStatus.NOT_FOUND)
                return None, None
            if not valid_session(room["users"][user_id], session_token):
                self.json_response({"error": "Login expired. Please join the room again."}, HTTPStatus.UNAUTHORIZED)
                return None, None
            room["lastSeen"] = now_ms()
            room["users"][user_id]["lastSeen"] = now_ms()
        return room_id, user_id

    def serve_static(self, path: str, include_body: bool = True) -> None:
        target = PUBLIC / ("index.html" if path in {"", "/"} else path.lstrip("/"))
        try:
            target = target.resolve()
            target.relative_to(PUBLIC)
        except ValueError:
            self.send_error(HTTPStatus.FORBIDDEN)
            return
        if not target.exists() or not target.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if target.name == "manifest.webmanifest":
            content_type = "application/manifest+json"
        data = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_cors_headers()
        self.end_headers()
        if include_body:
            self.wfile.write(data)

    def send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Credentials", "false")
        self.send_header("Vary", "Origin")

    def json_response(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), format % args))


def main() -> None:
    load_rooms()
    load_accounts()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer((host, port), WatchPartyHandler)
    print(f"{APP_NAME} running at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
