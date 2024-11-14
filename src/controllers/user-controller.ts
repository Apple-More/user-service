import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { hashPassword } from '../utils';

export const createCustomer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { customerName, email, password, phoneNumber } = req.body;
    if (!customerName || !email || !password || !phoneNumber) {
      res.status(400).json({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
      return;
    }
    const customer = await prisma.customer.create({
      data: {
        customerName,
        email,
        password: await hashPassword(password),
        phoneNumber,
      },
    });
    res.status(201).json({
      status: true,
      data: customer,
      message: 'Customer created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const getAllCustomers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const customers = await prisma.customer.findMany();
    res.status(200).json({
      status: true,
      data: customers,
      message: 'Customers retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const customerId = req.params.customerId;
    const customer = await prisma.customer.findUnique({
      where: { customerId },
    });
    if (!customer) {
      res.status(404).json({
        status: false,
        data: null,
        message: 'Customer not found',
      });
      return;
    }
    res.status(200).json({
      status: true,
      data: customer,
      message: 'Customer retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};
