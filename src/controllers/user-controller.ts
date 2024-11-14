import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { hashPassword } from '../utils';

// ------------------- Customer Controller ------------------- //
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
    const customers = await prisma.customer.findMany({
      include: { address: true },
    });
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
      include: { address: true },
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

export const updateCustomer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const customerId = req.params.customerId;
    const { customerName, email, phoneNumber } = req.body;
    const customer = await prisma.customer.update({
      where: { customerId },
      data: {
        customerName,
        email,
        phoneNumber,
      },
    });
    res.status(200).json({
      status: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

// ------------------- Address Controller ------------------- //

export const getAllAddressByCustomerId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const customerId = req.params.customerId;
    const addresses = await prisma.address.findMany({
      where: { customerId },
    });
    res.status(200).json({
      status: true,
      data: addresses,
      message: 'Addresses retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const createAddressByCustomerId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const customerId = req.params.customerId;
    const { addressNo, addressLine1, addressLine2, city, zipCode } = req.body;
    const address = await prisma.address.create({
      data: {
        addressNo,
        addressLine1,
        addressLine2,
        city,
        zipCode,
        customerId,
      },
    });
    res.status(201).json({
      status: true,
      data: address,
      message: 'Address created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

// ------------------- Admin Controller ------------------- //

export const getAllAdmins = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const admins = await prisma.admin.findMany({
      where: { adminRole: 'Admin' },
    });
    res.status(200).json({
      status: true,
      data: admins,
      message: 'Admins retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const getAdminById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const adminId = req.params.adminId;
    const admin = await prisma.admin.findUnique({
      where: { adminId },
    });
    if (!admin) {
      res.status(404).json({
        status: false,
        data: null,
        message: 'Admin not found',
      });
      return;
    }
    res.status(200).json({
      status: true,
      data: admin,
      message: 'Admin retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const createAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { adminName, email, password } = req.body;
    if (!adminName || !email || !password) {
      res.status(400).json({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
      return;
    }
    const admin = await prisma.admin.create({
      data: {
        adminName,
        email,
        password: await hashPassword(password),
        adminRole: 'Admin',
      },
    });
    res.status(201).json({
      status: true,
      data: admin,
      message: 'Admin created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const updateAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const adminId = req.params.adminId;
    const { adminName, email } = req.body;
    const admin = await prisma.admin.update({
      where: { adminId },
      data: {
        adminName,
        email,
      },
    });
    res.status(200).json({
      status: true,
      data: admin,
      message: 'Admin updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

// ------------------- Super Admin Controller ------------------- //

export const getAllSuperAdmins = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const superAdmins = await prisma.admin.findMany({
      where: { adminRole: 'SuperAdmin' },
    });
    res.status(200).json({
      status: true,
      data: superAdmins,
      message: 'Super Admins retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const getSuperAdminById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const adminId = req.params.adminId;
    const superAdmin = await prisma.admin.findUnique({
      where: { adminId },
    });
    if (!superAdmin) {
      res.status(404).json({
        status: false,
        data: null,
        message: 'Super Admin not found',
      });
      return;
    }
    res.status(200).json({
      status: true,
      data: superAdmin,
      message: 'Super Admin retrieved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const createSuperAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { adminName, email, password } = req.body;
    if (!adminName || !email || !password) {
      res.status(400).json({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
      return;
    }
    const superAdmin = await prisma.admin.create({
      data: {
        adminName,
        email,
        password: await hashPassword(password),
        adminRole: 'SuperAdmin',
      },
    });
    res.status(201).json({
      status: true,
      data: superAdmin,
      message: 'Super Admin created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const updateSuperAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const adminId = req.params.adminId;
    const { adminName, email } = req.body;
    const superAdmin = await prisma.admin.update({
      where: { adminId },
      data: {
        adminName,
        email,
      },
    });
    res.status(200).json({
      status: true,
      data: superAdmin,
      message: 'Super Admin updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};
