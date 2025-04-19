#!/bin/bash

# Make this script executable with: chmod +x scripts/setup-db.sh

# Step 1: Create a .env file with database connection
echo "Creating .env file with DATABASE_URL and NEXTAUTH_SECRET"
cat > .env << EOL
# PostgreSQL Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/repdash"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOL

echo ".env file created"

# Step 2: Generate Prisma client
echo "Generating Prisma client"
npx prisma generate

# Step 3: Create initial migration
echo "Creating initial migration"
npx prisma migrate dev --name init

echo "Database setup complete!"
echo "Make sure PostgreSQL is running and update the DATABASE_URL if needed"
echo "You can now run 'npm run dev' to start the development server"