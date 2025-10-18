from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pandas as pd
from sqlalchemy.orm import sessionmaker
from models import engine, Application, Rating
import pickle

Session = sessionmaker(bind=engine)
session = Session()

# Load applications with ratings
applications = session.query(Application).all()
data = []
for app in applications:
    ratings = session.query(Rating).filter(Rating.application_id == app.id).all()
    avg_rating = sum([r.overall for r in ratings]) / len(ratings) if ratings else 3
    data.append({
        'citizen_id': app.citizen_id,
        'broker_id': app.broker_id,
        'application_type': app.application_type,
        'status': app.status,
        'submission_day': app.submission_date.timetuple().tm_yday,
        'avg_rating': avg_rating,
        'is_fraud': app.is_fraud
    })

df = pd.DataFrame(data)

# Encode categorical variables
df = pd.get_dummies(df, columns=['application_type', 'status'])

# Features and label
X = df.drop('is_fraud', axis=1)
y = df['is_fraud']

# Train test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = GradientBoostingClassifier(random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred)}")

# Save model
with open('fraud_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Fraud detection model trained and saved.")