#!/bin/bash

# Make this script executable with: chmod +x scripts/init-project.sh

# Set text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==== Sales Rep Dashboard Setup ====${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ before continuing.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version is $NODE_VERSION. Please upgrade to Node.js 18+ before continuing.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

# Create directories if they don't exist
echo "Creating required directories..."
mkdir -p app/generated/prisma
mkdir -p components/ui
mkdir -p lib/utils
mkdir -p public

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install

# Setup environment file
echo -e "${BLUE}Setting up environment variables...${NC}"

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# PostgreSQL Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/repdash"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOL
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Check if PostgreSQL is installed
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
    
    # Prompt to create database
    read -p "Do you want to create the PostgreSQL database now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "PostgreSQL username (default: postgres): " DB_USER
        DB_USER=${DB_USER:-postgres}
        
        read -s -p "PostgreSQL password: " DB_PASS
        echo
        
        read -p "PostgreSQL host (default: localhost): " DB_HOST
        DB_HOST=${DB_HOST:-localhost}
        
        read -p "PostgreSQL port (default: 5432): " DB_PORT
        DB_PORT=${DB_PORT:-5432}
        
        read -p "Database name (default: repdash): " DB_NAME
        DB_NAME=${DB_NAME:-repdash}
        
        # Update .env file with custom credentials
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME\"|g" .env
        rm .env.bak 2>/dev/null
        
        echo -e "${BLUE}Attempting to create database '${DB_NAME}'...${NC}"
        PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Database created successfully${NC}"
        else
            echo -e "${RED}Failed to create database. You may need to create it manually.${NC}"
            echo "Use: CREATE DATABASE $DB_NAME;"
        fi
    fi
else
    echo -e "${RED}PostgreSQL does not appear to be installed.${NC}"
    echo "Please install PostgreSQL and create a database before running Prisma migrations."
fi

# Generate Prisma client
echo -e "${BLUE}Generating Prisma client...${NC}"
npx prisma generate

echo -e "${BLUE}Do you want to run the initial database migration? (y/n)${NC}"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate dev --name init
    echo -e "${GREEN}✓ Initial migration created${NC}"
fi

echo -e "${GREEN}✓ Setup completed!${NC}"
echo -e "${BLUE}Run 'npm run dev' to start the development server${NC}"