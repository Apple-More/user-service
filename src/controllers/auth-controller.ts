import { sign } from 'jsonwebtoken';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

import prisma from '../config/prisma';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/index';

export const customerLogin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
      return;
    }
    const customer = await prisma.customer.findUnique({
      where: {
        email,
      },
    });
    if (!customer) {
      res.status(404).json({
        status: false,
        data: null,
        message: 'Customer not found',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: false,
        data: null,
        message: 'Invalid password',
      });
      return;
    }

    const payload = {
      customerId: customer.customerId,
      customerName: customer.customerName,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
    };

    const token = sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(200).json({
      status: true,
      data: {
        accessToken: token,
      },
      message: 'Customer logged in successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};
