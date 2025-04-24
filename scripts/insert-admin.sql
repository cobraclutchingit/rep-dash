-- Insert admin user directly into the database
-- Password: admin123 (bcrypt hashed)
INSERT INTO "User" (
  "email", 
  "password", 
  "name", 
  "fullName", 
  "role", 
  "emailVerified", 
  "createdAt", 
  "updatedAt"
) 
VALUES (
  'admin@example.com',
  '$2b$10$3Hbz.Xa5QJpNI7THt3zQB.fkbU7iFB5I4ggdgB.fJ.pN2Wdcnd7oG', -- bcrypt hash for 'admin123'
  'Admin',
  'Admin User',
  'ADMIN',
  NOW(),
  NOW(),
  NOW()
);