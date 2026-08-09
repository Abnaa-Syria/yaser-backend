const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

dotenv.config();

const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findFirst({
      where: { role: { name: 'INSTRUCTOR' } },
      include: { role: true },
    });

    if (!user) {
      console.error("User not found!");
      process.exit(1);
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    };

    const secret = process.env.JWT_SECRET || 'jwt-secret-key-123';
    console.log("Using JWT secret:", secret);

    const token = jwt.sign(payload, secret, { expiresIn: '1d' });
    console.log("Generated token:", token.substring(0, 30) + "...");

    console.log("Sending API request to http://localhost:3000/api/v1/instructor/classes/students...");
    const response = await fetch('http://localhost:3000/api/v1/instructor/classes/students', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Response Status:", response.status);
    const data = await response.json();
    console.log("Response Data:", JSON.stringify(data, null, 2));

  } catch (err) {
    console.error("Request failed:", err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
