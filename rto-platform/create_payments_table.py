from models import Base, engine, Payment

# Create payments table
Base.metadata.create_all(engine, tables=[Payment.__table__])
print("✓ Payments table created successfully!")
