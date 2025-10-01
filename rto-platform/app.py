from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from models import Citizen, Broker, Application, Rating, engine
from pydantic import BaseModel
from datetime import datetime
from ai_services.chatbot import get_chatbot_response
from ai_services.ocr import extract_text_from_image
from ai_services.forgery import analyze_document
import base64
import pickle
import os
import pandas as pd

# Load environment variables from .env file
if os.path.exists('.env'):
    with open('.env') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

app = FastAPI()

# Load fraud detection model
MODEL_PATH = 'fraud_model.pkl'
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, 'rb') as f:
        fraud_model = pickle.load(f)
    MODEL_AVAILABLE = True
else:
    fraud_model = None
    MODEL_AVAILABLE = False

# CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = Session(bind=engine)
    try:
        yield db
    finally:
        db.close()

# Models for request/response
class CitizenCreate(BaseModel):
    name: str
    aadhaar: str
    phone: str
    email: str
    address: str

class ApplicationCreate(BaseModel):
    citizen_id: int
    broker_id: int
    application_type: str
    documents: str

class ChatRequest(BaseModel):
    message: str

class OCRRequest(BaseModel):
    image: str  # base64 encoded image

class ForgeryRequest(BaseModel):
    image: str

# Endpoints
@app.post("/citizens/")
def create_citizen(citizen: CitizenCreate, db: Session = Depends(get_db)):
    db_citizen = Citizen(**citizen.dict())
    db.add(db_citizen)
    db.commit()
    db.refresh(db_citizen)
    return db_citizen

@app.get("/brokers/")
def list_brokers(db: Session = Depends(get_db)):
    brokers = db.query(Broker).all()
    result = []
    for broker in brokers:
        ratings = db.query(Rating).join(Application).filter(Application.broker_id == broker.id).all()
        if ratings:
            avg_punctuality = sum([r.punctuality for r in ratings]) / len(ratings)
            avg_quality = sum([r.quality for r in ratings]) / len(ratings)
            avg_compliance = sum([r.compliance for r in ratings]) / len(ratings)
            avg_communication = sum([r.communication for r in ratings]) / len(ratings)
            avg_overall = sum([r.overall for r in ratings]) / len(ratings)
        else:
            avg_punctuality = avg_quality = avg_compliance = avg_communication = avg_overall = 0
        result.append({
            'id': broker.id,
            'name': broker.name,
            'license_number': broker.license_number,
            'phone': broker.phone,
            'email': broker.email,
            'specialization': broker.specialization,
            'avg_punctuality': avg_punctuality,
            'avg_quality': avg_quality,
            'avg_compliance': avg_compliance,
            'avg_communication': avg_communication,
            'avg_overall': avg_overall
        })
    return result

@app.post("/applications/")
def create_application(app: ApplicationCreate, db: Session = Depends(get_db)):
    # Predict fraud
    is_fraud = False
    if MODEL_AVAILABLE:
        # Create a dataframe for prediction
        submission_day = datetime.now().timetuple().tm_yday
        data = {
            'citizen_id': [app.citizen_id],
            'broker_id': [app.broker_id],
            'application_type': [app.application_type],
            'status': ['Pending'],
            'submission_day': [submission_day],
            'avg_rating': [3] # Default rating for new applications
        }
        df = pd.DataFrame(data)

        # One-hot encode categorical variables
        df = pd.get_dummies(df, columns=['application_type', 'status'])

        # Align columns with the training data
        # Get the columns from the training data
        training_cols = ['citizen_id', 'broker_id', 'submission_day', 'avg_rating',
       'application_type_New Registration', 'application_type_Renewal',
       'application_type_Transfer', 'status_Approved', 'status_Pending',
       'status_Rejected']
        
        df = df.reindex(columns=training_cols, fill_value=0)

        # Predict
        prediction = fraud_model.predict(df)[0]
        is_fraud = bool(prediction)

    db_app = Application(**app.dict(), status="Pending", submission_date=datetime.now().date(), is_fraud=is_fraud)
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@app.get("/applications/")
def list_applications(citizen_id: int = None, broker_id: int = None, is_fraud: bool = None, page: int = 1, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(Application)

    # Apply filters
    if citizen_id:
        query = query.filter(Application.citizen_id == citizen_id)
    if broker_id:
        query = query.filter(Application.broker_id == broker_id)
    if is_fraud is not None:
        query = query.filter(Application.is_fraud == is_fraud)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * limit
    applications = query.offset(offset).limit(limit).all()

    result = []
    for app in applications:
        result.append({
            "id": app.id,
            "citizen_id": app.citizen_id,
            "broker_id": app.broker_id,
            "application_type": app.application_type,
            "status": app.status,
            "submission_date": app.submission_date.isoformat() if app.submission_date else None,
            "documents": app.documents,
            "is_fraud": app.is_fraud
        })
    return {"total": total, "page": page, "limit": limit, "applications": result}

@app.get("/analytics/")
def get_analytics(db: Session = Depends(get_db)):
    total_citizens = db.query(Citizen).count()
    total_brokers = db.query(Broker).count()
    total_apps = db.query(Application).count()
    approved_apps = db.query(Application).filter(Application.status == "Approved").count()
    return {
        "total_citizens": total_citizens,
        "total_brokers": total_brokers,
        "total_applications": total_apps,
        "approved_applications": approved_apps
    }

@app.post("/chat/")
def chat(request: ChatRequest):
    response = get_chatbot_response(request.message)
    return {"response": response}

@app.post("/ocr/")
def ocr(request: OCRRequest):
    try:
        image_bytes = base64.b64decode(request.image)
        text = extract_text_from_image(image_bytes)
        return {"extracted_text": text}
    except Exception as e:
        return {"error": str(e)}

@app.post("/forgery/")
def detect_forgery(request: ForgeryRequest):
    try:
        image_bytes = base64.b64decode(request.image)
    except Exception as exc:
        return {"status": "error", "error": f"Invalid image payload: {exc}"}
    result = analyze_document(image_bytes)
    return result

# New endpoints for complete functionality

@app.get("/applications/{application_id}")
def get_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return {"error": "Application not found"}

    # Get citizen and broker details
    citizen = db.query(Citizen).filter(Citizen.id == app.citizen_id).first()
    broker = db.query(Broker).filter(Broker.id == app.broker_id).first()

    # Get rating if exists
    rating = db.query(Rating).filter(Rating.application_id == app.id).first()

    return {
        "id": app.id,
        "citizen": {
            "id": citizen.id,
            "name": citizen.name,
            "email": citizen.email,
            "phone": citizen.phone,
            "address": citizen.address
        } if citizen else None,
        "broker": {
            "id": broker.id,
            "name": broker.name,
            "email": broker.email,
            "phone": broker.phone,
            "specialization": broker.specialization
        } if broker else None,
        "application_type": app.application_type,
        "status": app.status,
        "submission_date": app.submission_date.isoformat() if app.submission_date else None,
        "documents": app.documents,
        "is_fraud": app.is_fraud,
        "vehicle_details": {
            "owner_name": app.owner_name,
            "owner_so": app.owner_so,
            "owner_address": app.owner_address,
            "ownership": app.ownership,
            "chassis_number": app.chassis_number,
            "engine_number": app.engine_number,
            "cubic_capacity": app.cubic_capacity,
            "maker_name": app.maker_name,
            "model_name": app.model_name,
            "date_of_registration": app.date_of_registration.isoformat() if app.date_of_registration else None,
            "registration_valid_upto": app.registration_valid_upto.isoformat() if app.registration_valid_upto else None,
            "tax_valid_upto": app.tax_valid_upto.isoformat() if app.tax_valid_upto else None,
            "fitness_status": app.fitness_status,
            "vehicle_class": app.vehicle_class,
            "vehicle_description": app.vehicle_description,
            "fuel_type": app.fuel_type,
            "emission_norm": app.emission_norm,
            "seat_capacity": app.seat_capacity,
            "vehicle_color": app.vehicle_color,
            "insurance_details": app.insurance_details,
            "insurance_valid_upto": app.insurance_valid_upto.isoformat() if app.insurance_valid_upto else None,
            "pucc_no": app.pucc_no,
            "pucc_valid_upto": app.pucc_valid_upto.isoformat() if app.pucc_valid_upto else None,
            "registering_authority": app.registering_authority,
            "registration_number": app.registration_number
        },
        "rating": {
            "punctuality": rating.punctuality,
            "quality": rating.quality,
            "compliance": rating.compliance,
            "communication": rating.communication,
            "overall": rating.overall
        } if rating else None
    }

@app.get("/brokers/{broker_id}/details")
def get_broker_details(broker_id: int, db: Session = Depends(get_db)):
    broker = db.query(Broker).filter(Broker.id == broker_id).first()
    if not broker:
        return {"error": "Broker not found"}

    # Get ratings
    ratings = db.query(Rating).join(Application).filter(Application.broker_id == broker_id).all()

    # Calculate average ratings
    if ratings:
        avg_punctuality = sum([r.punctuality for r in ratings]) / len(ratings)
        avg_quality = sum([r.quality for r in ratings]) / len(ratings)
        avg_compliance = sum([r.compliance for r in ratings]) / len(ratings)
        avg_communication = sum([r.communication for r in ratings]) / len(ratings)
        avg_overall = sum([r.overall for r in ratings]) / len(ratings)
    else:
        avg_punctuality = avg_quality = avg_compliance = avg_communication = avg_overall = 0

    # Get recent applications
    recent_apps = db.query(Application).filter(Application.broker_id == broker_id).order_by(Application.submission_date.desc()).limit(10).all()

    # Calculate success rate
    total_apps = db.query(Application).filter(Application.broker_id == broker_id).count()
    approved_apps = db.query(Application).filter(Application.broker_id == broker_id, Application.status == "Approved").count()
    success_rate = (approved_apps / total_apps * 100) if total_apps > 0 else 0

    return {
        "id": broker.id,
        "name": broker.name,
        "license_number": broker.license_number,
        "phone": broker.phone,
        "email": broker.email,
        "specialization": broker.specialization,
        "ratings": {
            "punctuality": round(avg_punctuality, 2),
            "quality": round(avg_quality, 2),
            "compliance": round(avg_compliance, 2),
            "communication": round(avg_communication, 2),
            "overall": round(avg_overall, 2),
            "total_ratings": len(ratings)
        },
        "statistics": {
            "total_applications": total_apps,
            "approved_applications": approved_apps,
            "success_rate": round(success_rate, 2)
        },
        "recent_applications": [{
            "id": app.id,
            "application_type": app.application_type,
            "status": app.status,
            "submission_date": app.submission_date.isoformat() if app.submission_date else None
        } for app in recent_apps]
    }

@app.get("/brokers/{broker_id}/assignments")
def get_broker_assignments(broker_id: int, db: Session = Depends(get_db)):
    applications = db.query(Application).filter(Application.broker_id == broker_id, Application.status.in_(["Pending", "In Progress"])).all()

    result = []
    for app in applications:
        citizen = db.query(Citizen).filter(Citizen.id == app.citizen_id).first()
        result.append({
            "id": app.id,
            "application_type": app.application_type,
            "status": app.status,
            "submission_date": app.submission_date.isoformat() if app.submission_date else None,
            "citizen_name": citizen.name if citizen else "Unknown",
            "is_fraud": app.is_fraud
        })

    return result

@app.get("/brokers/{broker_id}/statistics")
def get_broker_statistics(broker_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import func
    from datetime import timedelta

    # Daily stats for last 7 days
    today = datetime.now().date()
    daily_stats = []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_name = day.strftime("%A")[:3]  # Mon, Tue, etc.

        count = db.query(Application).filter(
            Application.broker_id == broker_id,
            Application.submission_date == day
        ).count()

        daily_stats.append({
            "day": day_name,
            "count": count
        })

    # Overall stats
    total_assigned = db.query(Application).filter(Application.broker_id == broker_id).count()
    pending = db.query(Application).filter(Application.broker_id == broker_id, Application.status == "Pending").count()
    approved = db.query(Application).filter(Application.broker_id == broker_id, Application.status == "Approved").count()

    return {
        "daily_assignments": daily_stats,
        "total_assigned": total_assigned,
        "pending": pending,
        "approved": approved
    }