# backend/tests/test_auth.py
def test_admin_login_and_protected_route(client):
    # First create an org
    payload = {
        "organization_name": "loginOrg",
        "admin_email": "admin@login.com",
        "admin_password": "StrongPass123!"
    }
    resp = client.post("/org/create", json=payload)
    assert resp.status_code == 200

    # Login
    login_resp = client.post(
        "/admin/login",
        json={"email": "admin@login.com", "password": "StrongPass123!"}
    )
    assert login_resp.status_code == 200, login_resp.text

    token = login_resp.json()["access_token"]
    assert token is not None

    # Call protected route
    protected = client.get(
        "/org/get",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert protected.status_code == 200, protected.text

    data = protected.json()
    assert data["organization_name"] == "loginorg"
    assert data["admin_email"] == "admin@login.com"
