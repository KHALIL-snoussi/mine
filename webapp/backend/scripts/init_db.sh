#!/bin/bash

# Database initialization script
# Run this to set up the database with initial data

echo "Initializing database..."
cd "$(dirname "$0")/.."
python -m app.db.init_db

echo ""
echo "Database initialization complete!"
echo "You can now start the server with: uvicorn app.main:app --reload"
