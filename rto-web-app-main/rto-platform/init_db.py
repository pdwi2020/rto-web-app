#!/usr/bin/env python3
"""Initialize database on startup if it doesn't exist."""
import os
from models import Base, engine

# Create tables if database doesn't exist
if not os.path.exists('rto.db'):
    print("Creating database tables...")
    Base.metadata.create_all(engine)
    print("Database tables created successfully!")

    # Try to load data if CSV files exist
    try:
        from create_db import session
        print("Data loaded from CSV files.")
    except Exception as e:
        print(f"Note: Could not load CSV data (this is okay for production): {e}")
        print("Database is ready with empty tables.")
else:
    print("Database already exists, skipping initialization.")
