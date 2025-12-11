# backend/tests/test_orgs.py
def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_create_org_minimal(client):
    payload = {
        "organization_name": "PyTestOrg",
        "admin_email": "pytest@example.com",
        "admin_password": "TestPass123!"
    }

    resp = client.post("/org/create", json=payload)
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert data["ok"] is True
    assert data["organization"] == "pytestorg"  # sanitized lowercase


def test_create_org_duplicate(client):
    # First create
    payload = {
        "organization_name": "dupOrg",
        "admin_email": "dup@example.com",
        "admin_password": "TestPass!"
    }
    resp1 = client.post("/org/create", json=payload)
    assert resp1.status_code == 200

    # Try duplicate
    resp2 = client.post("/org/create", json=payload)
    assert resp2.status_code == 400
    assert resp2.json()["detail"] == "Organization already exists"
