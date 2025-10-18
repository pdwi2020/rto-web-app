from sqlalchemy.orm import Session
from models import Complaint, Application, Broker, engine
from datetime import datetime, timedelta
import random

def add_sample_complaints():
    db = Session(bind=engine)

    # Get all applications
    applications = db.query(Application).all()
    brokers = db.query(Broker).limit(20).all()  # Get first 20 brokers

    complaint_types = [
        "Delayed Processing",
        "Missing Documents",
        "Incorrect Information",
        "Payment Issue",
        "Communication Gap",
        "Service Quality",
        "Technical Issue",
        "Documentation Error"
    ]

    complaint_descriptions = {
        "Delayed Processing": "Application has been pending for over 2 weeks without any update.",
        "Missing Documents": "Required documents are not being accepted or uploaded properly.",
        "Incorrect Information": "Vehicle details or owner information contains errors.",
        "Payment Issue": "Payment was deducted but application status not updated.",
        "Communication Gap": "Unable to reach broker for status updates.",
        "Service Quality": "Dissatisfied with the quality of service provided.",
        "Technical Issue": "Website or portal showing errors during application submission.",
        "Documentation Error": "Submitted documents have discrepancies that need correction."
    }

    statuses = ["Pending", "Under Review", "Resolved", "Closed"]

    complaints_added = 0

    # First, add specific complaints for broker 1 (for testing)
    broker_1_apps = db.query(Application).filter(Application.broker_id == 1).limit(10).all()
    for app in broker_1_apps[:5]:  # Add 5 complaints for broker 1
        complaint_type = random.choice(complaint_types)
        status = random.choice(statuses)
        submitted_date = datetime.now() - timedelta(days=random.randint(1, 90))

        resolved_date = None
        if status in ["Resolved", "Closed"]:
            resolved_date = submitted_date + timedelta(days=random.randint(1, 14))

        complaint = Complaint(
            broker_id=1,
            application_id=app.id,
            complaint_type=complaint_type,
            description=complaint_descriptions[complaint_type],
            status=status,
            submitted_date=submitted_date.date(),
            resolved_date=resolved_date.date() if resolved_date else None
        )

        db.add(complaint)
        complaints_added += 1

    # Add 30-50 more sample complaints for other brokers
    num_complaints = random.randint(30, 50)

    for i in range(num_complaints):
        # Pick random application and broker
        app = random.choice(applications)
        broker = db.query(Broker).filter(Broker.id == app.broker_id).first()

        if not broker:
            continue

        complaint_type = random.choice(complaint_types)
        status = random.choice(statuses)
        submitted_date = datetime.now() - timedelta(days=random.randint(1, 90))

        resolved_date = None
        if status in ["Resolved", "Closed"]:
            resolved_date = submitted_date + timedelta(days=random.randint(1, 14))

        complaint = Complaint(
            broker_id=broker.id,
            application_id=app.id,
            complaint_type=complaint_type,
            description=complaint_descriptions[complaint_type],
            status=status,
            submitted_date=submitted_date.date(),
            resolved_date=resolved_date.date() if resolved_date else None
        )

        db.add(complaint)
        complaints_added += 1

    db.commit()
    print(f"✅ Added {complaints_added} sample complaints to database")

    # Show breakdown by status
    for status in statuses:
        count = db.query(Complaint).filter(Complaint.status == status).count()
        print(f"   - {status}: {count}")

    # Show complaints for broker 1 (for testing)
    broker_1_complaints = db.query(Complaint).filter(Complaint.broker_id == 1).count()
    print(f"\n📊 Broker 1 has {broker_1_complaints} complaints")

    db.close()

if __name__ == "__main__":
    add_sample_complaints()
