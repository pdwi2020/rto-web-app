from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from models import Citizen, Broker, Application, Rating, Complaint, Payment, engine
from pydantic import BaseModel
from datetime import datetime
import random
from ai_services.chatbot import get_chatbot_response, get_rag_response_detailed
from ai_services.ocr import extract_text_from_image
from ai_services.forgery import analyze_document, analyze_document_advanced
from ai_services.fee_estimator import get_fee_estimator
from ai_services.feedback_analyzer import get_feedback_analyzer
from ai_services.communication_engine import get_communication_engine
from ai_services.rating_engine import get_rating_engine
from ai_services.fraud_detection import get_fraud_detector
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

# CORS - Must be configured before loading model
from fastapi.middleware.cors import CORSMiddleware

# Configure CORS to allow Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel deployments
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://rto-web-app.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Load fraud detection model
MODEL_PATH = 'fraud_model.pkl'
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, 'rb') as f:
        fraud_model = pickle.load(f)
    MODEL_AVAILABLE = True
else:
    fraud_model = None
    MODEL_AVAILABLE = False

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

class StartJobRequest(BaseModel):
    vehicle_number: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class ComplaintRequest(BaseModel):
    broker_id: int
    application_id: int
    complaint_type: str
    description: str

class FeeEstimateRequest(BaseModel):
    application_type: str
    vehicle_class: str

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

@app.get("/brokers/{broker_id}")
def get_broker(broker_id: int, db: Session = Depends(get_db)):
    broker = db.query(Broker).filter(Broker.id == broker_id).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker not found")

    # Calculate average ratings (same logic as list_brokers)
    ratings = db.query(Rating).join(Application).filter(Application.broker_id == broker.id).all()
    if ratings:
        avg_punctuality = sum([r.punctuality for r in ratings]) / len(ratings)
        avg_quality = sum([r.quality for r in ratings]) / len(ratings)
        avg_compliance = sum([r.compliance for r in ratings]) / len(ratings)
        avg_communication = sum([r.communication for r in ratings]) / len(ratings)
        avg_overall = sum([r.overall for r in ratings]) / len(ratings)
    else:
        avg_punctuality = avg_quality = avg_compliance = avg_communication = avg_overall = 0

    return {
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
    }

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

# Broker workflow endpoints

@app.post("/brokers/{broker_id}/start-job")
def start_job(broker_id: int, request: StartJobRequest, db: Session = Depends(get_db)):
    """Start a new job by searching for vehicle"""
    # Search for application by vehicle registration number
    app = db.query(Application).filter(Application.registration_number == request.vehicle_number).first()

    if app:
        return {
            "success": True,
            "application": {
                "id": app.id,
                "vehicle_number": app.registration_number,
                "owner_name": app.owner_name,
                "status": app.status
            }
        }
    else:
        # If not found in applications, search in any vehicle with this number
        return {
            "success": False,
            "message": "Vehicle not found in system. Please create new application."
        }

@app.post("/brokers/verify-otp")
def verify_otp(request: VerifyOTPRequest):
    """Verify OTP (mock implementation)"""
    # For demo, accept any 6-digit OTP
    if len(request.otp) == 6 and request.otp.isdigit():
        return {
            "success": True,
            "message": "OTP verified successfully",
            "session_token": f"mock_token_{random.randint(1000, 9999)}"
        }
    else:
        return {
            "success": False,
            "message": "Invalid OTP"
        }

@app.post("/applications/{application_id}/calculate-fee")
def calculate_fee(application_id: int, request: FeeEstimateRequest, db: Session = Depends(get_db)):
    """Calculate fee estimate for application"""
    # Fee structure
    base_fees = {
        "New Registration": 1500,
        "Renewal": 800,
        "Transfer": 1000
    }

    vehicle_class_multiplier = {
        "Two Wheeler": 1.0,
        "Four Wheeler": 1.5,
        "Commercial": 2.0,
        "Heavy Vehicle": 3.0
    }

    base_fee = base_fees.get(request.application_type, 1000)
    multiplier = vehicle_class_multiplier.get(request.vehicle_class, 1.0)

    service_fee = base_fee * multiplier
    broker_commission = service_fee * 0.15
    tax = service_fee * 0.18  # GST
    total = service_fee + broker_commission + tax

    return {
        "breakdown": {
            "base_fee": round(base_fee, 2),
            "service_fee": round(service_fee, 2),
            "broker_commission": round(broker_commission, 2),
            "tax_gst": round(tax, 2),
            "total": round(total, 2)
        },
        "application_type": request.application_type,
        "vehicle_class": request.vehicle_class
    }

@app.post("/complaints")
def submit_complaint(complaint: ComplaintRequest, db: Session = Depends(get_db)):
    """Submit a new complaint"""
    db_complaint = Complaint(
        broker_id=complaint.broker_id,
        application_id=complaint.application_id,
        complaint_type=complaint.complaint_type,
        description=complaint.description,
        status="Pending",
        submitted_date=datetime.now().date()
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return {
        "success": True,
        "complaint_id": db_complaint.id,
        "message": "Complaint submitted successfully. Ticket ID: " + str(db_complaint.id)
    }

@app.get("/complaints")
def list_complaints(broker_id: int = None, status: str = None, db: Session = Depends(get_db)):
    """List complaints with filters"""
    query = db.query(Complaint)

    if broker_id:
        query = query.filter(Complaint.broker_id == broker_id)
    if status:
        query = query.filter(Complaint.status == status)

    complaints = query.all()

    result = []
    for c in complaints:
        result.append({
            "id": c.id,
            "broker_id": c.broker_id,
            "application_id": c.application_id,
            "complaint_type": c.complaint_type,
            "description": c.description,
            "status": c.status,
            "submitted_date": c.submitted_date.isoformat() if c.submitted_date else None,
            "resolved_date": c.resolved_date.isoformat() if c.resolved_date else None
        })

    return result

@app.put("/applications/{application_id}/status")
def update_application_status(application_id: int, status: str, db: Session = Depends(get_db)):
    """Update application status"""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        return {"error": "Application not found"}

    app.status = status
    db.commit()

    return {
        "success": True,
        "application_id": application_id,
        "new_status": status
    }

@app.get("/support/info")
def get_support_info():
    """Get toll-free and support information"""
    return {
        "toll_free": "1800-XXX-XXXX",
        "emergency_contact": "+91-XXX-XXX-XXXX",
        "email": "support@rto.gov.in",
        "working_hours": "Monday - Saturday, 9:00 AM - 6:00 PM",
        "helpdesk": "For urgent assistance, call our 24/7 helpline"
    }

# ==================== Approval Workflow Endpoints ====================

class ApproveRequest(BaseModel):
    approved_by: int  # broker_id

class RejectRequest(BaseModel):
    rejected_by: int  # broker_id
    reason: str

@app.post("/applications/{application_id}/approve")
def approve_application(application_id: int, request: ApproveRequest, db: Session = Depends(get_db)):
    """Approve an application"""
    app = db.query(Application).filter(Application.id == application_id).first()

    if not app:
        return {"error": "Application not found"}

    app.status = "Approved"
    db.commit()

    return {
        "success": True,
        "application_id": application_id,
        "status": "Approved",
        "message": "Application approved successfully"
    }

@app.post("/applications/{application_id}/reject")
def reject_application(application_id: int, request: RejectRequest, db: Session = Depends(get_db)):
    """Reject an application with reason"""
    app = db.query(Application).filter(Application.id == application_id).first()

    if not app:
        return {"error": "Application not found"}

    app.status = "Rejected"
    db.commit()

    return {
        "success": True,
        "application_id": application_id,
        "status": "Rejected",
        "reason": request.reason,
        "message": "Application rejected"
    }

# ==================== Payment Endpoints ====================

class PaymentRequest(BaseModel):
    application_id: int
    amount: float
    payment_method: str
    fee_breakdown: str  # JSON string

@app.post("/payments/")
def create_payment(payment: PaymentRequest, db: Session = Depends(get_db)):
    """Process payment for an application"""
    import uuid

    # Generate transaction ID
    transaction_id = f"TXN{uuid.uuid4().hex[:12].upper()}"

    # Create payment record
    db_payment = Payment(
        application_id=payment.application_id,
        amount=payment.amount,
        payment_method=payment.payment_method,
        transaction_id=transaction_id,
        status="Success",  # Mock success
        payment_date=datetime.utcnow(),
        fee_breakdown=payment.fee_breakdown
    )

    db.add(db_payment)

    # Update application status to "Payment Completed"
    app = db.query(Application).filter(Application.id == payment.application_id).first()
    if app:
        app.status = "Payment Completed"

    db.commit()
    db.refresh(db_payment)

    return {
        "success": True,
        "payment_id": db_payment.id,
        "transaction_id": transaction_id,
        "amount": payment.amount,
        "status": "Success",
        "message": "Payment processed successfully"
    }

@app.get("/payments/{application_id}")
def get_payment_by_application(application_id: int, db: Session = Depends(get_db)):
    """Get payment details for an application"""
    payment = db.query(Payment).filter(Payment.application_id == application_id).first()

    if not payment:
        return {"error": "Payment not found"}

    return {
        "id": payment.id,
        "application_id": payment.application_id,
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "transaction_id": payment.transaction_id,
        "status": payment.status,
        "payment_date": payment.payment_date.isoformat() if payment.payment_date else None,
        "fee_breakdown": payment.fee_breakdown
    }

@app.get("/payments/")
def list_payments(db: Session = Depends(get_db)):
    """List all payments"""
    payments = db.query(Payment).all()

    return [{
        "id": p.id,
        "application_id": p.application_id,
        "amount": p.amount,
        "payment_method": p.payment_method,
        "transaction_id": p.transaction_id,
        "status": p.status,
        "payment_date": p.payment_date.isoformat() if p.payment_date else None
    } for p in payments]

# ==================== Authentication Endpoint ====================

class LoginRequest(BaseModel):
    license_number: str

@app.post("/brokers/login")
def broker_login(request: LoginRequest, db: Session = Depends(get_db)):
    """Simple broker login using license number"""
    broker = db.query(Broker).filter(Broker.license_number == request.license_number).first()

    if not broker:
        return {"success": False, "message": "Invalid license number"}

    # Calculate broker stats
    applications = db.query(Application).filter(Application.broker_id == broker.id).all()
    total_apps = len(applications)
    approved_apps = len([a for a in applications if a.status == "Approved"])

    return {
        "success": True,
        "broker": {
            "id": broker.id,
            "name": broker.name,
            "license_number": broker.license_number,
            "phone": broker.phone,
            "email": broker.email,
            "specialization": broker.specialization,
            "total_applications": total_apps,
            "approved_applications": approved_apps
        }
    }


# ==================== AI-Powered Endpoints (Novel Algorithms) ====================

# --- XFDRC Fee Estimator Endpoints ---

class FeeEstimateRequestAdvanced(BaseModel):
    service_type: str
    vehicle_class: str
    broker_tier: str = "Silver"
    region: str = "TN-45"
    avg_processing_time: float = 5.0
    seasonal_load: float = 1.0
    anomaly_score: float = 0.0
    use_ml: bool = True

@app.post("/fee/estimate-advanced")
def estimate_fee_advanced(request: FeeEstimateRequestAdvanced):
    """
    Advanced fee estimation using XFDRC XGBoost model with SHAP explainability
    """
    estimator = get_fee_estimator()

    result = estimator.estimate_fee(
        service_type=request.service_type,
        vehicle_class=request.vehicle_class,
        broker_tier=request.broker_tier,
        region=request.region,
        avg_processing_time=request.avg_processing_time,
        seasonal_load=request.seasonal_load,
        anomaly_score=request.anomaly_score,
        use_ml=request.use_ml
    )

    return result

@app.post("/fee/detect-inflation")
def detect_inflation(actual_fee: float, service_type: str, vehicle_class: str, broker_tier: str = "Silver"):
    """
    Detect fee inflation using XFDRC algorithm
    """
    estimator = get_fee_estimator()

    result = estimator.detect_fee_inflation(
        actual_fee=actual_fee,
        service_type=service_type,
        vehicle_class=vehicle_class,
        broker_tier=broker_tier
    )

    return result


# --- RAG-IVR Enhanced Chatbot Endpoints ---

class ChatRequestAdvanced(BaseModel):
    message: str
    use_rag: bool = True
    top_k: int = 3

@app.post("/chat/rag")
def chat_rag(request: ChatRequestAdvanced):
    """
    RAG-enhanced chatbot with evidence-linked responses
    """
    if request.use_rag:
        result = get_rag_response_detailed(request.message, request.top_k)
        return result
    else:
        response = get_chatbot_response(request.message, use_rag=False)
        return {
            "query": request.message,
            "response": response,
            "rag_enabled": False
        }


# --- Feedback Analysis & Sentiment Endpoints ---

class FeedbackAnalysisRequest(BaseModel):
    text: str
    use_ml: bool = True

@app.post("/feedback/analyze")
def analyze_feedback(request: FeedbackAnalysisRequest):
    """
    Analyze feedback sentiment and intent using NLP
    """
    analyzer = get_feedback_analyzer()
    result = analyzer.analyze_feedback(request.text, request.use_ml)
    result['analysis_timestamp'] = datetime.now().isoformat()
    return result

@app.post("/feedback/rating-adjustment")
def calculate_rating_adjustment(sentiment_score: float, complaint_probability: float):
    """
    Calculate rating adjustment using SIR algorithm
    """
    analyzer = get_feedback_analyzer()
    adjustment = analyzer.calculate_rating_adjustment(sentiment_score, complaint_probability)
    return {
        "rating_adjustment": adjustment,
        "sentiment_score": sentiment_score,
        "complaint_probability": complaint_probability
    }


# --- Communication & Escalation Endpoints ---

class EscalationCheckRequest(BaseModel):
    anomaly_score: float = 0.0
    complaint_probability: float = 0.0
    sentiment_score: float = 0.0
    delay_ratio: float = 0.0

@app.post("/communication/check-escalation")
def check_escalation(request: EscalationCheckRequest):
    """
    Calculate escalation score using CERE algorithm
    """
    engine = get_communication_engine()
    result = engine.calculate_escalation_score(
        anomaly_score=request.anomaly_score,
        complaint_probability=request.complaint_probability,
        sentiment_score=request.sentiment_score,
        delay_ratio=request.delay_ratio
    )
    return result

@app.get("/communication/support-info")
def get_support_contact():
    """Get support contact information"""
    engine = get_communication_engine()
    return engine.get_support_info()


# --- TAS-DyRa Dynamic Rating Endpoints ---

class RatingUpdateRequest(BaseModel):
    broker_id: int
    current_rating: float
    actual_time: float
    expected_time: float
    completed_tasks: int
    total_tasks: int
    sentiment_score: float
    anomaly_score: float = 0.0
    fraud_score: float = 0.0
    days_ago: float = 0.0

@app.post("/rating/update-dynamic")
def update_rating_dynamic(request: RatingUpdateRequest):
    """
    Update broker rating using TAS-DyRa algorithm
    """
    rating_engine = get_rating_engine()

    task_data = {
        'actual_time': request.actual_time,
        'expected_time': request.expected_time,
        'completed_tasks': request.completed_tasks,
        'total_tasks': request.total_tasks,
        'sentiment_score': request.sentiment_score
    }

    result = rating_engine.process_broker_update(
        broker_id=request.broker_id,
        current_rating=request.current_rating,
        task_data=task_data,
        anomaly_score=request.anomaly_score,
        fraud_score=request.fraud_score,
        days_ago=request.days_ago
    )

    return result

@app.get("/brokers/{broker_id}/rating-explanation")
def get_rating_explanation(broker_id: int, db: Session = Depends(get_db)):
    """
    Get detailed explanation of broker's current rating using TAS-DyRa
    """
    broker = db.query(Broker).filter(Broker.id == broker_id).first()
    if not broker:
        return {"error": "Broker not found"}

    # Get current rating
    ratings = db.query(Rating).join(Application).filter(Application.broker_id == broker_id).all()
    avg_overall = sum([r.overall for r in ratings]) / len(ratings) if ratings else 3.0

    rating_engine = get_rating_engine()
    category = rating_engine.categorize_rating(avg_overall)

    # Get recent applications for trend
    recent_apps = db.query(Application).filter(Application.broker_id == broker_id).order_by(Application.submission_date.desc()).limit(10).all()

    return {
        "broker_id": broker_id,
        "current_rating": round(avg_overall, 2),
        "category": category,
        "total_ratings": len(ratings),
        "recent_activity_count": len(recent_apps),
        "algorithm": "TAS-DyRa (Temporal Anomaly-Scored Dynamic Rating)"
    }


# --- TG-CMAE Fraud Detection Endpoints ---

class FraudCheckRequest(BaseModel):
    application_id: int
    otp_start_time: str = None
    otp_close_time: str = None
    actual_fee: float = 0.0
    expected_fee: float = 0.0
    actual_duration: float = 0.0
    expected_duration: float = 5.0
    broker_id: int = None

@app.post("/fraud/comprehensive-check")
def comprehensive_fraud_check(request: FraudCheckRequest):
    """
    Comprehensive fraud detection using TG-CMAE algorithm
    """
    detector = get_fraud_detector()

    # Parse timestamps if provided
    otp_start = datetime.fromisoformat(request.otp_start_time) if request.otp_start_time else None
    otp_close = datetime.fromisoformat(request.otp_close_time) if request.otp_close_time else None

    application_data = {
        'id': request.application_id,
        'otp_start_time': otp_start,
        'otp_close_time': otp_close,
        'actual_fee': request.actual_fee,
        'expected_fee': request.expected_fee,
        'actual_duration': request.actual_duration,
        'expected_duration': request.expected_duration,
        'broker_id': request.broker_id
    }

    result = detector.comprehensive_fraud_check(application_data)
    return result

@app.post("/fraud/detect-ghosting")
def detect_ghosting(otp_start_time: str, otp_close_time: str = None):
    """
    Detect ghosting pattern (task started but not completed)
    """
    detector = get_fraud_detector()

    start_time = datetime.fromisoformat(otp_start_time) if otp_start_time else None
    close_time = datetime.fromisoformat(otp_close_time) if otp_close_time else None

    result = detector.detect_ghosting(start_time, close_time)
    return result


# --- VAFD-OCR Advanced Forgery Detection ---

@app.post("/forgery/advanced")
def detect_forgery_advanced(request: ForgeryRequest):
    """
    Advanced forgery detection using VAFD-OCR dual-branch architecture
    """
    try:
        image_bytes = base64.b64decode(request.image)
    except Exception as exc:
        return {"status": "error", "error": f"Invalid image payload: {exc}"}

    result = analyze_document_advanced(image_bytes)
    return result


# --- Health Check Endpoint ---

@app.get("/health/ai-modules")
def check_ai_modules():
    """
    Check status of all AI modules
    """
    return {
        "status": "healthy",
        "modules": {
            "xfdrc_fee_estimator": "active",
            "rag_ivr_chatbot": "active",
            "tas_dyra_rating": "active",
            "tg_cmae_fraud": "active",
            "vafd_ocr": "active",
            "feedback_analyzer": "active",
            "communication_engine": "active"
        },
        "novel_algorithms": [
            "XFDRC - Explainable Fee-Dynamic Rating-Communication",
            "RAG-IVR - Retrieval-Augmented Generation with Evidence Linking",
            "TAS-DyRa - Temporal Anomaly-Scored Dynamic Rating",
            "TG-CMAE - Temporal Graph Cross-Modal Autoencoder",
            "VAFD-OCR - Verification-Aware Forgery Detection OCR"
        ]
    }