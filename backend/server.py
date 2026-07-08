from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


# ---------------- Models ----------------
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # "rank" | "key"
    name: str
    badge: str
    copy: str
    price_inr: float
    perks: List[str]
    featured: bool = False
    note: Optional[str] = None
    order: int = 0


class StoreConfig(BaseModel):
    brand: str = "CrimsonMC"
    tagline: str = "Luxury Lava Store"
    hero_title: str = "Rule the CrimsonMC"
    hero_subtitle: str = ("Luxury crimson-fire design, royal green highlights, premium ranks, "
                          "event keys, and a flexible store built for QR checkout and live status.")
    server_ip: str = "play.crimsonmc.in:25569"
    server_host: str = "play.crimsonmc.in"
    server_port: int = 25569
    instagram: str = "https://instagram.com/Crimsonmc.in"
    instagram_handle: str = "@Crimsonmc.in"
    usd_rate: float = 0.012  # 1 INR -> USD
    upi_id: str = "shiekhjeet19@fam"
    payee_name: str = "Shiekh Jeet"
    qr_image_url: str = "https://customer-assets.emergentagent.com/job_quick-host-deploy/artifacts/7acbako8_IMG_20251207_082918.jpg"


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None


class OrderCreate(BaseModel):
    item: str
    price_inr: float
    currency: str


# ---------------- Seed data ----------------
RANKS = [
    ("HABIBI", "Elite", "Top-tier prestige rank with the strongest premium presence.", 1678.9,
     ["Premium visual status", "Priority store prestige tier", "Best featured placement"], True),
    ("VOID", "Mythic", "A high-value rank for serious players chasing status.", 1290.0,
     ["Strong premium identity", "Luxury rank presentation", "High-value progression tier"], False),
    ("IMMORTAL", "Legend", "Balanced prestige with standout value and strong appeal.", 999.0,
     ["Popular upgrade choice", "Bold in-store presence", "Great mid-premium option"], False),
    ("TITAN", "Power", "A powerful rank tier for players moving into premium access.", 699.0,
     ["Entry premium spotlight", "Strong value positioning", "Popular next-step rank"], False),
    ("WARRIOR", "Battle", "Affordable rank upgrade for active PvP-focused players.", 321.0,
     ["Low-cost premium entry", "Easy first upgrade", "Clean step-up option"], False),
    ("KNIGHT", "Starter", "The easiest premium rank for first-time supporters.", 149.0,
     ["Budget-friendly unlock", "Simple first purchase", "Good starter support rank"], False),
]

KEYS = [
    ("ETERNAL KEY", "Rare", "Premium event key designed for stronger seasonal rewards.", 499.0,
     ["Fits flash sale events", "Premium featured crate", "Strong visual appeal"], None),
    ("SPAWNERS KEY", "Utility", "Focused on spawner-style rewards and useful unlocks.", 398.0,
     ["Useful progression crate", "Good event reward option", "Works well in bundle packs"], None),
    ("PRIME KEY", "Prime", "A refined premium key tier built for headline events.", 420.0,
     ["Clean premium tier", "Event-ready spotlight", "Works for countdown sales"], None),
    ("VIP KEY", "Popular", "Affordable premium key for regular buyers and drops.", 300.0,
     ["Good everyday offer", "Balanced price point", "Easy to promote often"], None),
    ("COMMON KEY", "Event", "Shown as event-based when key-all or special public events happen.", 1.0,
     ["Displayed as special note", "Useful for event promotions", "Can be swapped later"], "Given in key-all events"),
]


async def seed_data():
    if await db.products.count_documents({}) == 0:
        docs = []
        for i, (name, badge, copy, price, perks, featured) in enumerate(RANKS):
            docs.append(Product(category="rank", name=name, badge=badge, copy=copy,
                                price_inr=price, perks=perks, featured=featured, order=i).model_dump())
        for i, (name, badge, copy, price, perks, note) in enumerate(KEYS):
            docs.append(Product(category="key", name=name, badge=badge, copy=copy,
                                price_inr=price, perks=perks, note=note, order=i).model_dump())
        await db.products.insert_many(docs)
        logger.info("Seeded %d products", len(docs))
    if await db.config.count_documents({}) == 0:
        await db.config.insert_one(StoreConfig().model_dump())
        logger.info("Seeded store config")


# ---------------- Auth helper ----------------
async def get_current_user(request: Request) -> Optional[User]:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    return User(**{k: user_doc.get(k) for k in ["user_id", "email", "name", "picture"]})


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "CrimsonMC Store API"}


@api_router.get("/config")
async def get_config():
    cfg = await db.config.find_one({}, {"_id": 0})
    return cfg or StoreConfig().model_dump()


@api_router.get("/products", response_model=List[Product])
async def get_products():
    docs = await db.products.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return [Product(**d) for d in docs]


@api_router.get("/server-status")
async def server_status():
    cfg = await db.config.find_one({}, {"_id": 0}) or StoreConfig().model_dump()
    host = cfg.get("server_host", "play.crimsonmc.in")
    port = cfg.get("server_port", 25569)

    def fetch():
        try:
            r = requests.get(f"https://api.mcsrvstat.us/2/{host}:{port}", timeout=8)
            return r.json()
        except Exception as e:
            logger.warning("status fetch failed: %s", e)
            return None

    data = await asyncio.to_thread(fetch)
    if not data:
        return {"online": False, "players_online": 0, "players_max": 0, "host": host, "port": port}
    players = data.get("players", {}) or {}
    return {
        "online": bool(data.get("online")),
        "players_online": players.get("online", 0),
        "players_max": players.get("max", 0),
        "version": data.get("version"),
        "host": host,
        "port": port,
    }


# ----- Auth -----
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session id")
    try:
        r = await asyncio.to_thread(
            lambda: requests.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": session_id}, timeout=10)
        )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error("session-data error: %s", e)
        raise HTTPException(status_code=502, detail="Auth provider error")

    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id},
                                  {"$set": {"name": data.get("name"), "picture": data.get("picture")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": data.get("name"),
            "picture": data.get("picture"), "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(key="session_token", value=session_token, httponly=True,
                        secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60)
    return {"user_id": user_id, "email": email, "name": data.get("name"), "picture": data.get("picture")}


@api_router.get("/auth/me")
async def auth_me(user: Optional[User] = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


@api_router.post("/orders")
async def create_order(order: OrderCreate, user: Optional[User] = Depends(get_current_user)):
    doc = {
        "order_id": f"ord_{uuid.uuid4().hex[:12]}",
        "item": order.item, "price_inr": order.price_inr, "currency": order.currency,
        "user_email": user.email if user else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending_qr",
    }
    await db.orders.insert_one(doc)
    return {"order_id": doc["order_id"], "status": doc["status"]}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await seed_data()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
