import sys
import pytest
from fastapi.testclient import TestClient
sys.path.append('..')
from app import app
import os
import base64

client = TestClient(app)

def test_analytics():
    response = client.get("/analytics/")
    assert response.status_code == 200
    data = response.json()
    assert "total_citizens" in data
    assert "total_brokers" in data
    assert "total_applications" in data
    assert "approved_applications" in data

def test_list_brokers():
    response = client.get("/brokers/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        broker = data[0]
        assert "name" in broker
        assert "avg_overall" in broker

def test_create_citizen():
    from faker import Faker
    fake = Faker()
    citizen_data = {
        "name": "Test Citizen",
        "aadhaar": str(fake.unique.random_number(digits=12)),
        "phone": "1234567890",
        "email": "test@example.com",
        "address": "Test Address"
    }
    response = client.post("/citizens/", json=citizen_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Citizen"

def test_chat():
    chat_data = {"message": "Hello"}
    response = client.post("/chat/", json=chat_data)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data

def test_create_application():
    application_data = {
        "citizen_id": 1,
        "broker_id": 1,
        "application_type": "New Registration",
        "documents": "test_documents"
    }
    response = client.post("/applications/", json=application_data)
    assert response.status_code == 200
    data = response.json()
    assert data["application_type"] == "New Registration"

def test_list_applications():
    response = client.get("/applications/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        app_entry = data[0]
        expected_keys = {"id", "citizen_id", "broker_id", "application_type", "status", "submission_date", "documents", "is_fraud"}
        assert expected_keys.issubset(app_entry.keys())

def test_ocr():
    # Create a dummy image file
    with open("test_image.txt", "w") as f:
        f.write("This is a test image.")
    
    # Read the dummy image and encode it to base64
    import base64
    with open("test_image.txt", "rb") as f:
        image_bytes = f.read()
        encoded_image = base64.b64encode(image_bytes).decode('utf-8')

    ocr_data = {"image": encoded_image}
    response = client.post("/ocr/", json=ocr_data)
    assert response.status_code == 200
    data = response.json()
    assert "extracted_text" in data
    assert data["extracted_text"] is not None
    os.remove("test_image.txt")

def test_forgery_detection():
    from PIL import Image
    import io
    image = Image.new("RGB", (64, 64), color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

    response = client.post("/forgery/", json={"image": encoded_image})
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    if data["status"] == "ok":
        assert "is_forged" in data
        assert "confidence" in data
    else:
        assert data["status"] == "unavailable"