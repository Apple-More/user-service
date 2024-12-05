import { createCustomer, getAllCustomers, getCustomerById, updateCustomer, createAddressByCustomerId, getAllAddressByCustomerId, getAllAdmins, getAdminById, createAdmin, updateAdmin, getAllSuperAdmins, getSuperAdminById, createSuperAdmin, updateSuperAdmin } from '../../src/controllers/user-controller';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword , } from '../../src/utils';

jest.mock('@prisma/client', () => {
  const mockCustomer = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const mockAdmin = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const mockAddress = {
    findMany: jest.fn(),
    create: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      customer: mockCustomer,
      admin: mockAdmin,
      address: mockAddress,
    })),
  };
});

jest.mock('../../src/utils', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashedPassword'),
}));

const mockResponse = (): Partial<Response> => {
  const res = {} as Partial<Response>;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (body: any = {}, params: any = {}): Partial<Request> => {
  const req = {} as Partial<Request>;
  req.body = body;
  req.params = params;
  return req;
};

describe('User Controller Tests', () => {
  let prismaClient: any;

  beforeAll(() => {
    prismaClient = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test: createCustomer
describe('createCustomer', () => {
  it('should create a new customer', async () => {
    const req = mockRequest({
      customerName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phoneNumber: '1234567890',
    });
    const res = mockResponse();

    // Mock hashPassword to return a specific hashed value
    const hashedPassword = 'hashedPassword';
    (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

    // Mock the prisma client's create method
    prismaClient.customer.create.mockResolvedValue({
      customerName: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      phoneNumber: '1234567890',
    });

    await createCustomer(req as Request, res as Response);

    expect(hashPassword).toHaveBeenCalledWith('password123'); // Ensure password is hashed
    expect(prismaClient.customer.create).toHaveBeenCalledWith({
      data: {
        customerName: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        phoneNumber: '1234567890',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: expect.objectContaining({ customerName: 'John Doe' }),
      message: 'Customer created successfully',
    });
  });

  it('should return 400 if required fields are missing', async () => {
    const req = mockRequest({ email: 'john@example.com', password: 'password123' });
    const res = mockResponse();

    await createCustomer(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'Missing required fields',
    });
  });

  it('should return 500 if there is an unexpected error', async () => {
    const req = mockRequest({
      customerName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phoneNumber: '1234567890',
    });
    const res = mockResponse();

    // Force prismaClient.customer.create to throw an error
    prismaClient.customer.create.mockRejectedValue(new Error('Database error'));

    await createCustomer(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });
});

  // Test: getAllCustomers
  describe('getAllCustomers', () => {
    it('should retrieve all customers', async () => {
      const req = mockRequest();
      const res = mockResponse();

      prismaClient.customer.findMany.mockResolvedValue([
        { customerName: 'John Doe', email: 'john@example.com', phoneNumber: '1234567890' },
      ]);

      await getAllCustomers(req as Request, res as Response);

      expect(prismaClient.customer.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: expect.arrayContaining([expect.objectContaining({ customerName: 'John Doe' })]),
        message: 'Customers retrieved successfully',
      });
    });

    it('should return 500 if there is an error', async () => {
      const req = mockRequest();
      const res = mockResponse();
  
      // Force findMany to throw an error
      prismaClient.customer.findMany.mockRejectedValue(new Error('Database error'));
  
      await getAllCustomers(req as Request, res as Response);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'An error occurred: Database error',
      });
    });
  });

  // Test: getCustomerById
  describe('getCustomerById', () => {
    it('should retrieve a customer by ID', async () => {
      const customerId = '123';
      const req = mockRequest({}, { customerId });
      const res = mockResponse();
  
      // Mock the prisma client's findUnique method to return a customer object
      prismaClient.customer.findUnique.mockResolvedValue({
        customerId: '123',
        customerName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
        address: { street: '123 Main St', city: 'Anytown' },
      });
  
      await getCustomerById(req as Request, res as Response);
  
      expect(prismaClient.customer.findUnique).toHaveBeenCalledWith({
        where: { customerId: '123' },
        include: { address: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: expect.objectContaining({ customerName: 'John Doe' }),
        message: 'Customer retrieved successfully',
      });
    });
  
    it('should return 404 if customer is not found', async () => {
      const customerId = 'nonexistentId';
      const req = mockRequest({}, { customerId });
      const res = mockResponse();
  
      // Mock the prisma client's findUnique method to return null
      prismaClient.customer.findUnique.mockResolvedValue(null);
  
      await getCustomerById(req as Request, res as Response);
  
      expect(prismaClient.customer.findUnique).toHaveBeenCalledWith({
        where: { customerId: 'nonexistentId' },
        include: { address: true },
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Customer not found',
      });
    });
  
    it('should return 500 if there is an error', async () => {
      const customerId = '123';
      const req = mockRequest({}, { customerId });
      const res = mockResponse();
  
      // Force prismaClient.customer.findUnique to throw an error
      prismaClient.customer.findUnique.mockRejectedValue(new Error('Database error'));
  
      await getCustomerById(req as Request, res as Response);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'An error occurred: Database error',
      });
    });
  });

 
 // Test: updateCustomer
 describe('updateCustomer', () => {
  it('should update a customer successfully', async () => {
    const customerId = '123';
    const req = mockRequest(
      { customerName: 'Jane Doe', email: 'jane@example.com', phoneNumber: '0987654321' },
      { customerId }
    );
    const res = mockResponse();

    // Mock prisma client's update method
    prismaClient.customer.update.mockResolvedValue({
      customerId: '123',
      customerName: 'Jane Doe',
      email: 'jane@example.com',
      phoneNumber: '0987654321',
    });

    await updateCustomer(req as Request, res as Response);

    expect(prismaClient.customer.update).toHaveBeenCalledWith({
      where: { customerId: '123' },
      data: {
        customerName: 'Jane Doe',
        email: 'jane@example.com',
        phoneNumber: '0987654321',
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: expect.objectContaining({ customerName: 'Jane Doe' }),
      message: 'Customer updated successfully',
    });
  });

  it('should return 500 if there is a database error', async () => {
    const customerId = '123';
    const req = mockRequest(
      { customerName: 'Jane Doe', email: 'jane@example.com', phoneNumber: '0987654321' },
      { customerId }
    );
    const res = mockResponse();

    // Force prismaClient.customer.update to throw an error
    prismaClient.customer.update.mockRejectedValue(new Error('Database error'));

    await updateCustomer(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });
});

// Test: getAllAddressByCustomerId
describe('getAllAddressByCustomerId', () => {
  it('should retrieve all addresses for a customer', async () => {
    const customerId = '123';
    const req = mockRequest({}, { customerId });
    const res = mockResponse();

    // Mock the prisma client's findMany method to return a list of addresses
    prismaClient.address.findMany.mockResolvedValue([
      { addressNo: 'A1', city: 'City1', zipCode: '12345' },
      { addressNo: 'B2', city: 'City2', zipCode: '67890' },
    ]);

    await getAllAddressByCustomerId(req as Request, res as Response);

    expect(prismaClient.address.findMany).toHaveBeenCalledWith({
      where: { customerId: '123' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: expect.arrayContaining([
        expect.objectContaining({ addressNo: 'A1', city: 'City1' }),
        expect.objectContaining({ addressNo: 'B2', city: 'City2' }),
      ]),
      message: 'Addresses retrieved successfully',
    });
  });

  it('should return an empty list if no addresses are found', async () => {
    const customerId = '123';
    const req = mockRequest({}, { customerId });
    const res = mockResponse();

    // Mock the prisma client's findMany method to return an empty list
    prismaClient.address.findMany.mockResolvedValue([]);

    await getAllAddressByCustomerId(req as Request, res as Response);

    expect(prismaClient.address.findMany).toHaveBeenCalledWith({
      where: { customerId: '123' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: [],
      message: 'Addresses retrieved successfully',
    });
  });

  it('should return 500 if there is an error', async () => {
    const customerId = '123';
    const req = mockRequest({}, { customerId });
    const res = mockResponse();

    // Force prismaClient.address.findMany to throw an error
    prismaClient.address.findMany.mockRejectedValue(
      new Error('Database error')
    );

    await getAllAddressByCustomerId(req as Request, res as Response);

    expect(prismaClient.address.findMany).toHaveBeenCalledWith({
      where: { customerId: '123' },
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });
});

//Test: createAddressByCustomerId
describe('createAddressByCustomerId', () => {
  it('should create a new address for a customer', async () => {
    const req = mockRequest(
      {
        addressNo: 'A123',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'Anytown',
        zipCode: '12345',
      },
      { customerId: '123' }
    );
    const res = mockResponse();

    // Mock the prisma address create method
    prismaClient.address.create.mockResolvedValue({
      addressNo: 'A123',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'Anytown',
      zipCode: '12345',
      customerId: '123',
    });

    await createAddressByCustomerId(req as Request, res as Response);

    expect(prismaClient.address.create).toHaveBeenCalledWith({
      data: {
        addressNo: 'A123',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'Anytown',
        zipCode: '12345',
        customerId: '123',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: expect.objectContaining({ addressNo: 'A123' }),
      message: 'Address created successfully',
    });
  });

  

  it('should return 500 if there is an unexpected error', async () => {
    const req = mockRequest(
      {
        addressNo: 'A123',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'Anytown',
        zipCode: '12345',
      },
      { customerId: '123' }
    );
    const res = mockResponse();

    // Force prismaClient.address.create to throw an error
    prismaClient.address.create.mockRejectedValue(new Error('Database error'));

    await createAddressByCustomerId(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });
});

// Test: getAllAdmins
describe('getAllAdmins', () => {
  it('should retrieve all admins successfully', async () => {
    const req = mockRequest();
    const res = mockResponse();

    const mockAdmins = [
      { adminId: '1', adminName: 'Admin One', adminRole: 'Admin', email: 'admin1@example.com' },
      { adminId: '2', adminName: 'Admin Two', adminRole: 'Admin', email: 'admin2@example.com' },
    ];

    // Mock the prisma.admin.findMany method
    prismaClient.admin.findMany.mockResolvedValue(mockAdmins);

    await getAllAdmins(req as Request, res as Response);

    expect(prismaClient.admin.findMany).toHaveBeenCalledWith({ where: { adminRole: 'Admin' } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: mockAdmins,
      message: 'Admins retrieved successfully',
    });
  });

  it('should return 500 if there is an unexpected error', async () => {
    const req = mockRequest();
    const res = mockResponse();

    // Force prismaClient.admin.findMany to throw an error
    prismaClient.admin.findMany.mockRejectedValue(new Error('Database error'));

    await getAllAdmins(req as Request, res as Response);

    expect(prismaClient.admin.findMany).toHaveBeenCalledWith({ where: { adminRole: 'Admin' } });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });
});

// Test: getAdminById
describe('getAdminById', () => {
  it('should retrieve the admin by ID successfully', async () => {
    const adminId = '1';
    const req = mockRequest({}, { adminId });
    const res = mockResponse();

    const mockAdmin = { adminId: '1', adminName: 'Admin One', adminRole: 'Admin', email: 'admin1@example.com' };

    // Mock the prisma.admin.findUnique method
    prismaClient.admin.findUnique.mockResolvedValue(mockAdmin);

    await getAdminById(req as Request, res as Response);

    expect(prismaClient.admin.findUnique).toHaveBeenCalledWith({ where: { adminId: '1' } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: mockAdmin,
      message: 'Admin retrieved successfully',
    });
  });

  it('should return 404 if the admin is not found', async () => {
    const adminId = 'nonexistentId';
    const req = mockRequest({}, { adminId });
    const res = mockResponse();

    // Mock the prisma.admin.findUnique method to return null
    prismaClient.admin.findUnique.mockResolvedValue(null);

    await getAdminById(req as Request, res as Response);

    expect(prismaClient.admin.findUnique).toHaveBeenCalledWith({ where: { adminId: 'nonexistentId' } });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'Admin not found',
    });
  });

  it('should return 500 if there is an unexpected error', async () => {
    const adminId = '1';
    const req = mockRequest({}, { adminId });
    const res = mockResponse();

    // Force prismaClient.admin.findUnique to throw an error
    prismaClient.admin.findUnique.mockRejectedValue(new Error('Database error'));

    await getAdminById(req as Request, res as Response);

    expect(prismaClient.admin.findUnique).toHaveBeenCalledWith({ where: { adminId: '1' } });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });
});

// Test: createAdmin
describe('createAdmin', () => {
  it('should create a new admin successfully', async () => {
    const req = mockRequest({
      adminName: 'Admin One',
      email: 'admin1@example.com',
      password: 'password123',
    });
    const res = mockResponse();

    const hashedPassword = 'hashedPassword';
    const mockAdmin = {
      adminName: 'Admin One',
      email: 'admin1@example.com',
      password: hashedPassword,
      adminRole: 'Admin',
    };

    // Mock hashPassword to return a hashed password
    (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

    // Mock the prisma.admin.create method
    prismaClient.admin.create.mockResolvedValue(mockAdmin);

    await createAdmin(req as Request, res as Response);

    expect(hashPassword).toHaveBeenCalledWith('password123'); // Ensure password is hashed
    expect(prismaClient.admin.create).toHaveBeenCalledWith({
      data: {
        adminName: 'Admin One',
        email: 'admin1@example.com',
        password: hashedPassword,
        adminRole: 'Admin',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: mockAdmin,
      message: 'Admin created successfully',
    });
  });

  it('should return 400 if required fields are missing', async () => {
    const req = mockRequest({ email: 'admin1@example.com', password: 'password123' });
    const res = mockResponse();

    await createAdmin(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'Missing required fields',
    });
  });

  it('should return 500 if there is an unexpected error', async () => {
    const req = mockRequest({
      adminName: 'Admin One',
      email: 'admin1@example.com',
      password: 'password123',
    });
    const res = mockResponse();

    // Mock hashPassword to return a hashed password
    const hashedPassword = 'hashedPassword';
    (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

    // Force prisma.admin.create to throw an error
    prismaClient.admin.create.mockRejectedValue(new Error('Database error'));

    await createAdmin(req as Request, res as Response);

    expect(hashPassword).toHaveBeenCalledWith('password123'); // Ensure password is hashed
    expect(prismaClient.admin.create).toHaveBeenCalledWith({
      data: {
        adminName: 'Admin One',
        email: 'admin1@example.com',
        password: hashedPassword,
        adminRole: 'Admin',
      },
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });
});

// Test: updateAdmin
describe('updateAdmin', () => {
  it('should update admin successfully', async () => {
    const req = mockRequest(
      { adminName: 'Updated Admin', email: 'updatedadmin@example.com' },
      { adminId: '123' }
    );
    const res = mockResponse();

    const mockUpdatedAdmin = {
      adminId: '123',
      adminName: 'Updated Admin',
      email: 'updatedadmin@example.com',
      adminRole: 'Admin',
    };

    // Mock prisma.admin.update to return the updated admin
    prismaClient.admin.update.mockResolvedValue(mockUpdatedAdmin);

    await updateAdmin(req as Request, res as Response);

    expect(prismaClient.admin.update).toHaveBeenCalledWith({
      where: { adminId: '123' },
      data: {
        adminName: 'Updated Admin',
        email: 'updatedadmin@example.com',
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: mockUpdatedAdmin,
      message: 'Admin updated successfully',
    });
  });

  
  it('should return 500 if there is an unexpected error', async () => {
    const req = mockRequest(
      { adminName: 'Updated Admin', email: 'updatedadmin@example.com' },
      { adminId: '123' }
    );
    const res = mockResponse();

    // Force prisma.admin.update to throw an error
    prismaClient.admin.update.mockRejectedValue(new Error('Database error'));

    await updateAdmin(req as Request, res as Response);

    expect(prismaClient.admin.update).toHaveBeenCalledWith({
      where: { adminId: '123' },
      data: {
        adminName: 'Updated Admin',
        email: 'updatedadmin@example.com',
      },
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });
});

// Test: getAllSuperAdmins
describe('getAllSuperAdmins', () => {
  it('should retrieve all super admins successfully', async () => {
    const req = mockRequest();
    const res = mockResponse();

    const mockSuperAdmins = [
      {
        adminId: '1',
        adminName: 'Super Admin 1',
        email: 'superadmin1@example.com',
        adminRole: 'SuperAdmin',
      },
      {
        adminId: '2',
        adminName: 'Super Admin 2',
        email: 'superadmin2@example.com',
        adminRole: 'SuperAdmin',
      },
    ];

    // Mock prisma.admin.findMany to return the list of super admins
    prismaClient.admin.findMany.mockResolvedValue(mockSuperAdmins);

    await getAllSuperAdmins(req as Request, res as Response);

    expect(prismaClient.admin.findMany).toHaveBeenCalledWith({
      where: { adminRole: 'SuperAdmin' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: mockSuperAdmins,
      message: 'Super Admins retrieved successfully',
    });
  });

  it('should return 500 if there is an unexpected error', async () => {
    const req = mockRequest();
    const res = mockResponse();

    // Force prisma.admin.findMany to throw an error
    prismaClient.admin.findMany.mockRejectedValue(new Error('Database error'));

    await getAllSuperAdmins(req as Request, res as Response);

    expect(prismaClient.admin.findMany).toHaveBeenCalledWith({
      where: { adminRole: 'SuperAdmin' },
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });
});

// Test: getSuperAdminById
describe('getSuperAdminById', () => {
  it('should retrieve a super admin by ID successfully', async () => {
    const adminId = '1';
    const req = mockRequest({}, { adminId });
    const res = mockResponse();

    const mockSuperAdmin = {
      adminId: '1',
      adminName: 'Super Admin 1',
      email: 'superadmin1@example.com',
      adminRole: 'SuperAdmin',
    };

    // Mock prisma.admin.findUnique to return the super admin
    prismaClient.admin.findUnique.mockResolvedValue(mockSuperAdmin);

    await getSuperAdminById(req as Request, res as Response);

    expect(prismaClient.admin.findUnique).toHaveBeenCalledWith({
      where: { adminId: '1' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: mockSuperAdmin,
      message: 'Super Admin retrieved successfully',
    });
  });

  it('should return 404 if the super admin is not found', async () => {
    const adminId = 'nonexistentId';
    const req = mockRequest({}, { adminId });
    const res = mockResponse();

    // Mock prisma.admin.findUnique to return null
    prismaClient.admin.findUnique.mockResolvedValue(null);

    await getSuperAdminById(req as Request, res as Response);

    expect(prismaClient.admin.findUnique).toHaveBeenCalledWith({
      where: { adminId: 'nonexistentId' },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'Super Admin not found',
    });
  });

  it('should return 500 if there is an unexpected error', async () => {
    const adminId = '1';
    const req = mockRequest({}, { adminId });
    const res = mockResponse();

    // Force prisma.admin.findUnique to throw an error
    prismaClient.admin.findUnique.mockRejectedValue(new Error('Database error'));

    await getSuperAdminById(req as Request, res as Response);

    expect(prismaClient.admin.findUnique).toHaveBeenCalledWith({
      where: { adminId: '1' },
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });
});

// Test: createSuperAdmin
describe('createSuperAdmin', () => {
  it('should create a super admin successfully', async () => {
    const req = mockRequest({
      adminName: 'Super Admin 1',
      email: 'superadmin1@example.com',
      password: 'password123',
    });
    const res = mockResponse();

    const mockHashedPassword = 'hashedPassword';
    const mockSuperAdmin = {
      adminId: '1',
      adminName: 'Super Admin 1',
      email: 'superadmin1@example.com',
      password: mockHashedPassword,
      adminRole: 'SuperAdmin',
    };

    // Mock hashPassword to return the hashed password
    (hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);

    // Mock prisma.admin.create to return the created super admin
    prismaClient.admin.create.mockResolvedValue(mockSuperAdmin);

    await createSuperAdmin(req as Request, res as Response);

    expect(hashPassword).toHaveBeenCalledWith('password123'); // Ensure password is hashed
    expect(prismaClient.admin.create).toHaveBeenCalledWith({
      data: {
        adminName: 'Super Admin 1',
        email: 'superadmin1@example.com',
        password: mockHashedPassword,
        adminRole: 'SuperAdmin',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: mockSuperAdmin,
      message: 'Super Admin created successfully',
    });
  });

  it('should return 400 if required fields are missing', async () => {
    const req = mockRequest({
      email: 'superadmin1@example.com',
      password: 'password123', // Missing adminName
    });
    const res = mockResponse();

    await createSuperAdmin(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'Missing required fields',
    });
  });

  it('should return 500 if there is an unexpected error', async () => {
    const req = mockRequest({
      adminName: 'Super Admin 1',
      email: 'superadmin1@example.com',
      password: 'password123',
    });
    const res = mockResponse();

    // Force prisma.admin.create to throw an error
    prismaClient.admin.create.mockRejectedValue(new Error('Database error'));

    await createSuperAdmin(req as Request, res as Response);

    expect(hashPassword).toHaveBeenCalledWith('password123');
    expect(prismaClient.admin.create).toHaveBeenCalledWith({
      data: {
        adminName: 'Super Admin 1',
        email: 'superadmin1@example.com',
        password: expect.any(String), // Ensure password hashing was attempted
        adminRole: 'SuperAdmin',
      },
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });
});


// Test: updateSuperAdmin
describe('updateSuperAdmin', () => {
  it('should update a super admin successfully', async () => {
    const adminId = '1';
    const req = mockRequest(
      { adminName: 'Updated Admin', email: 'updated@example.com' },
      { adminId }
    );
    const res = mockResponse();

    // Mock prisma.admin.update to return the updated super admin
    prismaClient.admin.update.mockResolvedValue({
      adminId: '1',
      adminName: 'Updated Admin',
      email: 'updated@example.com',
    });

    await updateSuperAdmin(req as Request, res as Response);

    expect(prismaClient.admin.update).toHaveBeenCalledWith({
      where: { adminId: '1' },
      data: {
        adminName: 'Updated Admin',
        email: 'updated@example.com',
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      data: expect.objectContaining({
        adminName: 'Updated Admin',
        email: 'updated@example.com',
      }),
      message: 'Super Admin updated successfully',
    });
  });

  it('should return 500 if there is a database error', async () => {
    const adminId = '1';
    const req = mockRequest(
      { adminName: 'Updated Admin', email: 'updated@example.com' },
      { adminId }
    );
    const res = mockResponse();

    // Force prisma.admin.update to throw an error
    prismaClient.admin.update.mockRejectedValue(new Error('Database error'));

    await updateSuperAdmin(req as Request, res as Response);

    expect(prismaClient.admin.update).toHaveBeenCalledWith({
      where: { adminId: '1' },
      data: {
        adminName: 'Updated Admin',
        email: 'updated@example.com',
      },
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: 'An error occurred: Database error',
    });
  });

  it('should handle missing adminId gracefully', async () => {
    const req = mockRequest(
      { adminName: 'Updated Admin', email: 'updated@example.com' },
      {}
    );
    const res = mockResponse();

    await updateSuperAdmin(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      data: null,
      message: expect.stringContaining('An error occurred'),
    });
  });
});

});