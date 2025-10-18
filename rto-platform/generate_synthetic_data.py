import pandas as pd
from faker import Faker
import random

fake = Faker('en_IN')  # For Indian locale

# Generate citizens
citizens = []
for i in range(1000):
    citizens.append({
        'id': i+1,
        'name': fake.name(),
        'aadhaar': fake.unique.random_number(digits=12),
        'phone': fake.phone_number(),
        'email': fake.email(),
        'address': fake.address()
    })
citizens_df = pd.DataFrame(citizens)

# Generate brokers
brokers = []
for i in range(100):
    brokers.append({
        'id': i+1,
        'name': fake.name(),
        'license_number': fake.unique.random_number(digits=10),
        'phone': fake.phone_number(),
        'email': fake.email(),
        'specialization': random.choice(['Vehicle Registration', 'License Renewal', 'Transfer of Ownership'])
    })
brokers_df = pd.DataFrame(brokers)

# Generate applications
applications = []
for i in range(5000):
    citizen_id = random.randint(1, 1000)
    broker_id = random.randint(1, 100)
    applications.append({
        'id': i+1,
        'citizen_id': citizen_id,
        'broker_id': broker_id,
        'application_type': random.choice(['New Registration', 'Renewal', 'Transfer']),
        'status': random.choice(['Pending', 'Approved', 'Rejected']),
        'submission_date': fake.date_this_year(),
        'documents': 'aadhaar,pan,etc',  # simplified
        'is_fraud': random.choices([True, False], weights=[0.1, 0.9])[0],
        # Vehicle details
        'owner_name': fake.name(),
        'owner_so': fake.name(),  # S/o
        'owner_address': fake.address(),
        'ownership': random.choice(['Single', 'Partner']),
        'chassis_number': fake.unique.random_number(digits=17),
        'engine_number': fake.unique.random_number(digits=10),
        'cubic_capacity': f"{random.randint(800, 2000)} CC",
        'maker_name': random.choice(['Maruti Suzuki', 'Hyundai', 'Tata Motors', 'Honda', 'Toyota', 'Ford', 'Volkswagen']),
        'model_name': random.choice(['Swift', 'i10', 'Nexon', 'City', 'Innova', 'Figo', 'Polo']),
        'date_of_registration': fake.date_this_decade(),
        'registration_valid_upto': fake.date_this_decade(),
        'tax_valid_upto': fake.date_this_decade(),
        'fitness_status': random.choice(['Valid', 'Expired']),
        'vehicle_class': random.choice(['LMV', 'HMV', 'MCV', 'HCV']),
        'vehicle_description': random.choice(['Car', 'Motorcycle', 'Truck', 'Bus']),
        'fuel_type': random.choice(['Petrol', 'Diesel', 'Electric', 'CNG']),
        'emission_norm': random.choice(['BS4', 'BS6']),
        'seat_capacity': random.randint(2, 9),
        'vehicle_color': random.choice(['White', 'Black', 'Red', 'Blue', 'Silver', 'Grey']),
        'insurance_details': fake.company(),
        'insurance_valid_upto': fake.date_this_decade(),
        'pucc_no': fake.unique.random_number(digits=10),
        'pucc_valid_upto': fake.date_this_decade(),
        'registering_authority': fake.city(),
        'registration_number': f"TN{random.randint(10, 99)}CH{random.randint(1000, 9999)}"
    })
applications_df = pd.DataFrame(applications)

# Generate ratings
ratings = []
for i in range(3000):
    app_id = random.randint(1, 5000)
    ratings.append({
        'id': i+1,
        'application_id': app_id,
        'punctuality': random.randint(1,5),
        'quality': random.randint(1,5),
        'compliance': random.randint(1,5),
        'communication': random.randint(1,5),
        'overall': random.randint(1,5)
    })
ratings_df = pd.DataFrame(ratings)

# Save to CSV
citizens_df.to_csv('citizens.csv', index=False)
brokers_df.to_csv('brokers.csv', index=False)
applications_df.to_csv('applications.csv', index=False)
ratings_df.to_csv('ratings.csv', index=False)

print("Synthetic data generated and saved to CSV files.")