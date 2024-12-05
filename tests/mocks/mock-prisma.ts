import { PrismaClient } from '@prisma/client';

// Mock the entire PrismaClient with jest.fn() for methods
const prisma = {
  customer: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    update: jest.fn(),
  },

  admin: {
    findUnique: jest.fn(),
  },
  otp:{
    create :jest.fn(),
  }
} as unknown as PrismaClient; // Typecast it as PrismaClient

