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
def list_applications(db: Session = Depends(get_db)):
    applications = db.query(Application).all()
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
    return result

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