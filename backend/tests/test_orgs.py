from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200

def test_create_org_minimal():
    payload = {
        "organization_name": "pytestorg",
        "admin_email": "pytest@example.com",
        "admin_password": "TestPass123!"
    }
    resp = client.post("/org/create", json=payload)
    assert resp.status_code == 200

    data = resp.json()
    assert data["ok"] is True
    assert data["organization"] == "pytestorg"
