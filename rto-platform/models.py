from sqlalchemy import create_engine, Column, Integer, String, Date, ForeignKey, Boolean, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

engine = create_engine('sqlite:///rto.db')

class Citizen(Base):
    __tablename__ = 'citizens'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    aadhaar = Column(String, unique=True)
    phone = Column(String)
    email = Column(String)
    address = Column(String)

class Broker(Base):
    __tablename__ = 'brokers'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    license_number = Column(String, unique=True)
    phone = Column(String)
    email = Column(String)
    specialization = Column(String)

class Application(Base):
    __tablename__ = 'applications'
    id = Column(Integer, primary_key=True)
    citizen_id = Column(Integer, ForeignKey('citizens.id'))
    broker_id = Column(Integer, ForeignKey('brokers.id'))
    application_type = Column(String)
    status = Column(String)
    submission_date = Column(Date)
    documents = Column(String)
    is_fraud = Column(Boolean)
    
    # Vehicle details
    owner_name = Column(String)
    owner_so = Column(String)
    owner_address = Column(String)
    ownership = Column(String)  # Single/partner
    chassis_number = Column(String)
    engine_number = Column(String)
    cubic_capacity = Column(String)
    maker_name = Column(String)
    model_name = Column(String)
    date_of_registration = Column(Date)
    registration_valid_upto = Column(Date)
    tax_valid_upto = Column(Date)
    fitness_status = Column(String)
    vehicle_class = Column(String)
    vehicle_description = Column(String)
    fuel_type = Column(String)
    emission_norm = Column(String)
    seat_capacity = Column(Integer)
    vehicle_color = Column(String)
    insurance_details = Column(String)
    insurance_valid_upto = Column(Date)
    pucc_no = Column(String)
    pucc_valid_upto = Column(Date)
    registering_authority = Column(String)
    registration_number = Column(String)

class Rating(Base):
    __tablename__ = 'ratings'
    id = Column(Integer, primary_key=True)
    application_id = Column(Integer, ForeignKey('applications.id'))
    punctuality = Column(Integer)
    quality = Column(Integer)
    compliance = Column(Integer)
    communication = Column(Integer)
    overall = Column(Integer)

class Complaint(Base):
    __tablename__ = 'complaints'
    id = Column(Integer, primary_key=True)
    broker_id = Column(Integer, ForeignKey('brokers.id'))
    application_id = Column(Integer, ForeignKey('applications.id'))
    complaint_type = Column(String)
    description = Column(String)
    status = Column(String)  # Pending, Resolved, Closed
    submitted_date = Column(Date)
    resolved_date = Column(Date)

class Payment(Base):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True)
    application_id = Column(Integer, ForeignKey('applications.id'))
    amount = Column(Float)
    payment_method = Column(String)  # UPI, Card, NetBanking
    transaction_id = Column(String, unique=True)
    status = Column(String)  # Pending, Success, Failed
    payment_date = Column(DateTime, default=datetime.utcnow)
    fee_breakdown = Column(String)  # JSON string