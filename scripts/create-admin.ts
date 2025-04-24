import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = process.argv[2] || 'youradmin@example.com';
    const password = process.argv[3] || 'admin123';

    process.stderr.write(`Creating admin user with email: ${email}\n`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: 'Admin',
        fullName: 'Admin User',
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    process.stderr.write(`Admin user created successfully with ID: ${user.id}\n`);
  } catch (error) {
    process.stderr.write(`Error creating admin user: ${error}
`);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
