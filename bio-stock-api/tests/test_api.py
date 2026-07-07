"""Integration tests covering auth, health logging, tokens, staking, and FHIR."""
import main
from tests.conftest import GREEN_LOG


def test_register_and_login_flow(client):
    r = client.post("/auth/register", json={"email": "a@b.com", "password": "password1"})
    assert r.status_code == 200
    assert "access_token" in r.json()

    r = client.post("/auth/login", json={"email": "a@b.com", "password": "password1"})
    assert r.status_code == 200


def test_weak_password_rejected(client):
    r = client.post("/auth/register", json={"email": "x@y.com", "password": "short"})
    assert r.status_code == 422


def test_protected_route_requires_token(client):
    assert client.get("/dashboard/").status_code in (401, 403)


def test_log_health_mints_tokens(auth_client):
    r = auth_client.post("/health/log", json=GREEN_LOG)
    assert r.status_code == 200
    body = r.json()
    assert body["zone"] == "green"
    assert body["tokens_earned"] >= 10

    bal = auth_client.get("/tokens/balance").json()
    assert bal["balance"] >= 10


def test_duplicate_log_same_day_conflicts(auth_client):
    auth_client.post("/health/log", json=GREEN_LOG)
    r = auth_client.post("/health/log", json=GREEN_LOG)
    assert r.status_code == 409


def test_out_of_range_log_rejected(auth_client):
    bad = {**GREEN_LOG, "systolic_bp": 9999}
    assert auth_client.post("/health/log", json=bad).status_code == 422


def test_stake_requires_positive_amount(auth_client):
    auth_client.post("/health/log", json=GREEN_LOG)
    r = auth_client.post("/tokens/stake", json={"goal_name": "Test", "stake_amount": -5})
    assert r.status_code == 422


def test_stake_burns_balance_and_appears_in_ledger(auth_client):
    auth_client.post("/health/log", json=GREEN_LOG)
    before = auth_client.get("/tokens/balance").json()["balance"]
    r = auth_client.post("/tokens/stake", json={"goal_name": "7-Day Green", "stake_amount": 5})
    assert r.status_code == 200
    after = auth_client.get("/tokens/balance").json()["balance"]
    assert after == before - 5

    ledger = auth_client.get("/tokens/ledger").json()
    assert any(e["transaction_type"] == "BURN" for e in ledger)


def test_fhir_observation_bundle_is_valid(auth_client):
    auth_client.post("/health/log", json=GREEN_LOG)
    r = auth_client.get("/fhir/Observation")
    assert r.status_code == 200
    bundle = r.json()
    assert bundle["resourceType"] == "Bundle"
    assert bundle["total"] == 5  # one Observation per biometric
    codes = {e["resource"]["code"]["coding"][0]["code"] for e in bundle["entry"]}
    assert "8480-6" in codes  # systolic BP LOINC


def test_fhir_patient_resource(auth_client):
    r = auth_client.get("/fhir/Patient/me")
    assert r.status_code == 200
    assert r.json()["resourceType"] == "Patient"


def test_mfa_setup_enable_and_enforced_login(client):
    import pyotp

    # Register + authenticate.
    token = client.post("/auth/register", json={"email": "m@m.com", "password": "password1"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Enroll and enable MFA.
    secret = client.post("/auth/mfa/setup", headers=headers).json()["secret"]
    code = pyotp.TOTP(secret).now()
    assert client.post("/auth/mfa/verify", json={"code": code}, headers=headers).json()["enabled"] is True

    # Login without a code is now rejected; with a valid code it succeeds.
    assert client.post("/auth/login", json={"email": "m@m.com", "password": "password1"}).status_code == 401
    ok = client.post("/auth/login", json={
        "email": "m@m.com", "password": "password1", "otp_code": pyotp.TOTP(secret).now(),
    })
    assert ok.status_code == 200


def test_security_headers_present(client):
    r = client.get("/healthcheck")
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert r.headers.get("X-Frame-Options") == "DENY"


def test_mfa_secret_stored_encrypted_not_plaintext(client):
    from models.mfa import UserMFA
    from services.crypto import decrypt

    token = client.post("/auth/register", json={"email": "e@e.com", "password": "password1"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    raw_secret = client.post("/auth/mfa/setup", headers=headers).json()["secret"]

    db = main.app.state.test_session_local()
    stored = db.query(UserMFA).first().secret
    db.close()

    assert stored != raw_secret  # never persisted in plaintext
    assert decrypt(stored) == raw_secret  # but recoverable via the app's key


def test_register_returns_refresh_token(client):
    body = client.post("/auth/register", json={"email": "r@r.com", "password": "password1"}).json()
    assert "refresh_token" in body and body["refresh_token"]


def test_refresh_token_rotates_and_old_one_is_invalid(client):
    tokens = client.post("/auth/register", json={"email": "rot@r.com", "password": "password1"}).json()
    old_refresh = tokens["refresh_token"]

    r = client.post("/auth/refresh", json={"refresh_token": old_refresh})
    assert r.status_code == 200
    new_tokens = r.json()
    assert new_tokens["access_token"] != tokens["access_token"]
    assert new_tokens["refresh_token"] != old_refresh

    # The rotated-out token can no longer be used.
    reuse = client.post("/auth/refresh", json={"refresh_token": old_refresh})
    assert reuse.status_code == 401

    # The new one still works.
    assert client.post("/auth/refresh", json={"refresh_token": new_tokens["refresh_token"]}).status_code == 200


def test_logout_revokes_refresh_token(client):
    tokens = client.post("/auth/register", json={"email": "lo@r.com", "password": "password1"}).json()
    assert client.post("/auth/logout", json={"refresh_token": tokens["refresh_token"]}).status_code == 200
    assert client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]}).status_code == 401


def test_invalid_refresh_token_rejected(client):
    assert client.post("/auth/refresh", json={"refresh_token": "not-a-real-token"}).status_code == 401


def test_login_rate_limited_after_repeated_failures(client):
    client.post("/auth/register", json={"email": "rl@r.com", "password": "password1"})
    last_status = None
    for _ in range(6):
        last_status = client.post("/auth/login", json={"email": "rl@r.com", "password": "wrongpass1"}).status_code
    assert last_status == 429
