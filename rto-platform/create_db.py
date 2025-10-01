from models import Base, Citizen, Broker, Application, Rating
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pandas as pd
from datetime import datetime

engine = create_engine('sqlite:///rto.db')
Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)
session = Session()

# Load citizens
citizens_df = pd.read_csv('citizens.csv')
for _, row in citizens_df.iterrows():
    citizen = Citizen(**row.to_dict())
    session.add(citizen)

# Load brokers
brokers_df = pd.read_csv('brokers.csv')
for _, row in brokers_df.iterrows():
    broker = Broker(**row.to_dict())
    session.add(broker)

# Load applications
applications_df = pd.read_csv('applications.csv')
for _, row in applications_df.iterrows():
    # Parse date fields
    date_fields = ['submission_date', 'date_of_registration', 'registration_valid_upto', 'tax_valid_upto', 'insurance_valid_upto', 'pucc_valid_upto']
    for field in date_fields:
        if field in row and pd.notna(row[field]):
            row[field] = datetime.strptime(row[field], '%Y-%m-%d').date()
    app = Application(**row.to_dict())
    session.add(app)

# Load ratings
ratings_df = pd.read_csv('ratings.csv')
for _, row in ratings_df.iterrows():
    rating = Rating(**row.to_dict())
    session.add(rating)

session.commit()
print("Database created and data loaded successfully.")