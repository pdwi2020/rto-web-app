from models import Base, engine, Complaint

# Create complaints table
Base.metadata.create_all(engine, tables=[Complaint.__table__])
print("✓ Complaints table created successfully!")
