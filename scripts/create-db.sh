#!/bin/bash

# Script to create PostgreSQL database and user
echo "Creating PostgreSQL database and user for the application..."

DB_NAME="salesapp"
DB_USER="salesappuser"
DB_PASSWORD="salesapppass123"

# Create the database
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"

# Create the user
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

# Update the .env file
echo "Updating .env file with database credentials..."
cat > .env << EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"

# Auth
NEXTAUTH_SECRET="supersecret_token_for_development"
NEXTAUTH_URL="http://localhost:3000"

# App
NODE_ENV="development"
EOF

echo "Database setup completed."
echo "Username: $DB_USER"
echo "Password: $DB_PASSWORD"
echo "Database: $DB_NAME"

echo "Now run: pnpm prisma migrate reset --force && pnpm prisma db seed"