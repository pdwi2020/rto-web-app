from sqlalchemy.orm import Session
from models import Broker, engine
import random

# Tamil Nadu style names
tamil_first_names = [
    "Murugan", "Selvam", "Kumar", "Ravi", "Vignesh", "Arun", "Karthik", "Sundar",
    "Prakash", "Venkatesh", "Rajesh", "Suresh", "Ramesh", "Ganesh", "Dinesh",
    "Vijay", "Ajay", "Sanjay", "Manoj", "Balaji", "Senthil", "Mani", "Gopal",
    "Krishna", "Anand", "Prasad", "Mohan", "Shankar", "Vishnu", "Siva"
]

tamil_last_names = [
    "Kumar", "Raj", "Krishnan", "Murugan", "Selvam", "Pandian", "Rajan",
    "Subramanian", "Iyer", "Narayanan", "Swamy", "Pillai", "Reddy", "Naidu"
]

def update_broker_names():
    db = Session(bind=engine)
    try:
        brokers = db.query(Broker).all()
        print(f"Updating {len(brokers)} broker names to Tamil Nadu style...")

        for broker in brokers:
            first = random.choice(tamil_first_names)
            last = random.choice(tamil_last_names)
            broker.name = f"{first} {last}"

        db.commit()
        print("✓ Broker names updated successfully!")

        # Show first 10 as sample
        print("\nSample updated names:")
        for i, broker in enumerate(brokers[:10], 1):
            print(f"{i}. {broker.name}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_broker_names()
