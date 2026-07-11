"""Backend tests for CrimsonMC store - key prices and product listing."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fall back to reading frontend env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

EXPECTED_KEY_PRICES = {
    "ETERNAL KEY": 199.0,
    "PRIME KEY": 179.0,
    "SPAWNERS KEY": 140.0,
    "VIP KEY": 100.0,
    "COMMON KEY": 1.0,
}


@pytest.fixture(scope="module")
def products():
    r = requests.get(f"{BASE_URL}/api/products", timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


def test_products_returns_list(products):
    assert isinstance(products, list)
    assert len(products) > 0


def test_counts(products):
    ranks = [p for p in products if p["category"] == "rank"]
    keys = [p for p in products if p["category"] == "key"]
    bundles = [p for p in products if p["category"] == "bundle"]
    assert len(ranks) == 6, f"ranks={len(ranks)}"
    assert len(keys) == 5, f"keys={len(keys)}"
    assert len(bundles) == 6, f"bundles={len(bundles)}"


@pytest.mark.parametrize("name,price", list(EXPECTED_KEY_PRICES.items()))
def test_key_prices(products, name, price):
    match = [p for p in products if p["name"] == name]
    assert match, f"Missing key: {name}"
    assert match[0]["price_inr"] == price, f"{name}: got {match[0]['price_inr']}, expected {price}"


def test_config_endpoint():
    r = requests.get(f"{BASE_URL}/api/config", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data.get("brand") == "CrimsonMC"


def test_order_creation():
    payload = {"item": "TEST_ETERNAL KEY", "price_inr": 199.0, "currency": "INR"}
    r = requests.post(f"{BASE_URL}/api/orders", json=payload, timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "order_id" in data
    assert data["status"] == "pending_qr"
