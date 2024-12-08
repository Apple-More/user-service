import { customerLogin, adminLogin,customerForgotPassword,verifyCustomerOtp, resetCustomerPassword, adminForgotPassword,resetAdminPassword} from '../../src/controllers/auth-controller';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendEmail,hashPassword } from '../../src/utils';


jest.mock('@prisma/client', () => {
  const mockCustomer = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const mockAdmin = {
    findUnique: jest.fn(),
  };
  const mockOtp = {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  };

 
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      customer: mockCustomer,
      admin: mockAdmin,
      otp: mockOtp
    })),
  };
});

// Mock the sendEmail function
jest.mock('../../src/utils', () => ({
  sendEmail: jest.fn().mockResolvedValue({ data: true }),
  hashPassword: jest.fn().mockResolvedValue({ data: true }),
}));
const mockedSendEmail = sendEmail as jest.Mock;


// Mock the sign function from jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mockedToken'), // Mocking the sign function
}));



// Mock bcrypt.compare to return a resolved Promise
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockImplementation((password: string, hash: string) => {
    return Promise.resolve(password === hash); // Simulate success/failure
  }),
}));

const mockResponse = (): Partial<Response> => {
  const res = {} as Partial<Response>;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (body: any = {}): Partial<Request> => {
  const req = {} as Partial<Request>;
  req.body = body;
  return req;
};

describe('Auth Controller Tests', () => {
  let prismaClient: any;

  beforeAll(() => {
    prismaClient = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test: customerLogin
  describe('customerLogin', () => {
    it('should log in a customer successfully', async () => {
      const req = mockRequest({
        email: 'john@example.com',
        password: 'password123',
      });
      const res = mockResponse();

      prismaClient.customer.findUnique.mockResolvedValue({
        customerId: 1,
        customerName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
        password: 'password123', // Simulate matching password
      });

      await customerLogin(req as Request, res as Response);

      expect(prismaClient.customer.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'password123');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: { accessToken: 'mockedToken' },
        message: 'Customer logged in successfully',
      });
    });

    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({ email: 'john@example.com' });
      const res = mockResponse();

      await customerLogin(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
    });

    it('should return 404 if customer not found', async () => {
      const req = mockRequest({
        email: 'john@example.com',
        password: 'password123',
      });
      const res = mockResponse();

      prismaClient.customer.findUnique.mockResolvedValue(null);

      await customerLogin(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Customer not found',
      });
    });

    it('should return 401 if password is incorrect', async () => {
      const req = mockRequest({
        email: 'john@example.com',
        password: 'password123',
      });
      const res = mockResponse();

      prismaClient.customer.findUnique.mockResolvedValue({
        customerId: 1,
        customerName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
        password: 'wrongPassword',
      });

      // Simulate incorrect password
    //  bcrypt.compare.mockResolvedValue(false);

      await customerLogin(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Invalid password',
      });
    });

    it('should return 500 if there is an error', async () => {
      const req = mockRequest({
        email: 'john@example.com',
        password: 'password123',
      });
      const res = mockResponse();

      prismaClient.customer.findUnique.mockRejectedValue(new Error('Database error'));

      await customerLogin(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'An error occurred: Database error',
      });
    });
  });

  // Test: adminLogin
  describe('adminLogin', () => {
    it('should log in an admin successfully', async () => {
      const req = mockRequest({
        email: 'admin@example.com',
        password: 'adminPassword123',
      });
      const res = mockResponse();

      prismaClient.admin.findUnique.mockResolvedValue({
        adminId: 1,
        adminName: 'Admin User',
        email: 'admin@example.com',
        adminRole: 'superAdmin',
        password: 'adminPassword123', // Simulate matching password
      });

      await adminLogin(req as Request, res as Response);

      expect(prismaClient.admin.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('adminPassword123', 'adminPassword123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: { accessToken: 'mockedToken' },
        message: 'Admin logged in successfully',
      });
    });

    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({ email: 'admin@example.com' });
      const res = mockResponse();

      await adminLogin(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
    });

    it('should return 404 if admin not found', async () => {
      const req = mockRequest({
        email: 'admin@example.com',
        password: 'adminPassword123',
      });
      const res = mockResponse();

      prismaClient.admin.findUnique.mockResolvedValue(null);

      await adminLogin(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Admin not found',
      });
    });

    it('should return 401 if password is incorrect', async () => {
      const req = mockRequest({
        email: 'admin@example.com',
        password: 'adminPassword123',
      });
      const res = mockResponse();

      prismaClient.admin.findUnique.mockResolvedValue({
        adminId: 1,
        adminName: 'Admin User',
        email: 'admin@example.com',
        adminRole: 'superAdmin',
        password: 'wrongPassword', // Simulate incorrect password
      });
     

      await adminLogin(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Invalid password',
      });
    });

    it('should return 500 if there is an error', async () => {
      const req = mockRequest({
        email: 'admin@example.com',
        password: 'adminPassword123',
      });
      const res = mockResponse();

      prismaClient.admin.findUnique.mockRejectedValue(new Error('Database error'));

      await adminLogin(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'An error occurred: Database error',
      });
    });
  });  
 // Test: customer Forgot Password
  describe('customerForgotPassword', () => {
    it('should send an OTP successfully', async () => {
      const req = mockRequest({ email: 'customer@example.com' });
      const res = mockResponse();
  
      prismaClient.customer.findUnique.mockResolvedValue({
        customerId: 1,
        email: 'customer@example.com',
      });
  
      prismaClient.otp.create.mockResolvedValue({});
  
      mockedSendEmail.mockResolvedValue({ data: true }); // Mock sendEmail success
  
      await customerForgotPassword(req as Request, res as Response);
  
      expect(prismaClient.customer.findUnique).toHaveBeenCalledWith({
        where: { email: 'customer@example.com' },
      });
      expect(prismaClient.otp.create).toHaveBeenCalled();
      expect(mockedSendEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: null,
        message: 'OTP sent successfully',
      });
    });
  
    it('should return 404 if customer not found', async () => {
      const req = mockRequest({ email: 'nonexistent@example.com' });
      const res = mockResponse();
  
      prismaClient.customer.findUnique.mockResolvedValue(null);
  
      await customerForgotPassword(req as Request, res as Response);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'User not found',
      });
    });
  
    it('should return 500 if sending OTP email fails', async () => {
      const req = mockRequest({ email: 'customer@example.com' });
      const res = mockResponse();
  
      prismaClient.customer.findUnique.mockResolvedValue({
        customerId: 1,
        email: 'customer@example.com',
      });
  
      prismaClient.otp.create.mockResolvedValue({});
      mockedSendEmail.mockResolvedValue({ data: null }); // Simulate failure
  
      await customerForgotPassword(req as Request, res as Response);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Failed to send OTP',
      });
    });
  });
   // Test: verify Customer Otp
  describe('verifyCustomerOtp', () => {
    it('should verify OTP successfully if valid', async () => {
      const req = mockRequest({ email: 'john@example.com', otpCode: '1234' });
      const res = mockResponse();
  
      prismaClient.customer.findUnique.mockResolvedValue({
        customerId: 1,
        email: 'john@example.com',
      });
      prismaClient.otp.findFirst.mockResolvedValue({
        otpId: 1,
        otpCode: '1234',
        otpUserId: 1,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
      prismaClient.otp.delete.mockResolvedValue({});
  
      await verifyCustomerOtp(req as Request, res as Response);
  
      expect(prismaClient.customer.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(prismaClient.otp.findFirst).toHaveBeenCalledWith({
        where: { otpCode: '1234', otpUserId: 1 },
      });
      expect(prismaClient.otp.delete).toHaveBeenCalledWith({ where: { otpId: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: {
          otpId: 1,
          otpCode: '1234',
          otpUserId: 1,
          expiresAt: expect.any(Date), // Use `expect.any(Date)` to handle dynamic date values
        },
        message: 'OTP verified successfully',
      });
    });
  
    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({ email: 'john@example.com' });
      const res = mockResponse();
  
      await verifyCustomerOtp(req as Request, res as Response);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
    });
  
    it('should return 404 if user does not exist', async () => {
      const req = mockRequest({ email: 'john@example.com', otpCode: '1234' });
      const res = mockResponse();
  
      prismaClient.customer.findUnique.mockResolvedValue(null);
  
      await verifyCustomerOtp(req as Request, res as Response);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'User not found',
      });
    });
  
    it('should return 401 if OTP is invalid', async () => {
      const req = mockRequest({ email: 'john@example.com', otpCode: '1234' });
      const res = mockResponse();
  
      prismaClient.customer.findUnique.mockResolvedValue({
        customerId: 1,
        email: 'john@example.com',
      });
      prismaClient.otp.findFirst.mockResolvedValue(null);
  
      await verifyCustomerOtp(req as Request, res as Response);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Invalid OTP code',
      });
    });
  
    it('should return 401 if OTP is expired', async () => {
      const req = mockRequest({ email: 'john@example.com', otpCode: '1234' });
      const res = mockResponse();
  
      prismaClient.customer.findUnique.mockResolvedValue({
        customerId: 1,
        email: 'john@example.com',
      });
      prismaClient.otp.findFirst.mockResolvedValue({
        otpId: 1,
        otpCode: '1234',
        otpUserId: 1,
        expiresAt: new Date(Date.now() - 1),
      });
  
      await verifyCustomerOtp(req as Request, res as Response);
  
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'OTP code has expired',
      });
    });
  
    it('should return 500 if an error occurs', async () => {
      const req = mockRequest({ email: 'john@example.com', otpCode: '1234' });
      const res = mockResponse();
  
      prismaClient.customer.findUnique.mockRejectedValue(new Error('Database error'));
  
      await verifyCustomerOtp(req as Request, res as Response);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'An error occurred: Database error',
      });
    });
  });
 // Test: reset Customer Password
  describe('resetCustomerPassword', () => {
    it('should reset the password successfully', async () => {
      const req = mockRequest({
        email: 'john@example.com',
        password: 'newPassword123',
      });
      const res = mockResponse();
  
      const userData = {
        customerId: 1,
        email: 'john@example.com',
      };
  
      prismaClient.customer.findUnique.mockResolvedValue(userData);
      (hashPassword as jest.Mock).mockResolvedValue('hashedNewPassword123');
      prismaClient.customer.update.mockResolvedValue({});
  
      await resetCustomerPassword(req as Request, res as Response);
  
      expect(prismaClient.customer.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(hashPassword).toHaveBeenCalledWith('newPassword123');
      expect(prismaClient.customer.update).toHaveBeenCalledWith({
        where: { customerId: 1 },
        data: { password: 'hashedNewPassword123' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: null,
        message: 'Password changed successfully',
      });
    });
  
    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({ email: 'john@example.com' }); // Missing password
      const res = mockResponse();
  
      await resetCustomerPassword(req as Request, res as Response);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
    });
  
    it('should return 404 if the user does not exist', async () => {
      const req = mockRequest({
        email: 'nonexistent@example.com',
        password: 'newPassword123',
      });
      const res = mockResponse();
  
      prismaClient.customer.findUnique.mockResolvedValue(null);
  
      await resetCustomerPassword(req as Request, res as Response);
  
      expect(prismaClient.customer.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'User not found',
      });
    });
  
    it('should return 500 if an error occurs during execution', async () => {
      const req = mockRequest({
        email: 'john@example.com',
        password: 'newPassword123',
      });
      const res = mockResponse();
  
      prismaClient.customer.findUnique.mockRejectedValue(
        new Error('Database error')
      );
  
      await resetCustomerPassword(req as Request, res as Response);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'An error occurred: Database error',
      });
    });
  });
  //Test : admin Forgot Password
  describe('adminForgotPassword', () => {
    it('should send an OTP successfully', async () => {
      const req = mockRequest({ email: 'admin@example.com' });
      const res = mockResponse();
  
      // Mocking prisma.admin.findUnique to return an admin
      prismaClient.admin.findUnique.mockResolvedValue({
        adminId: 1,
        email: 'admin@example.com',
      });
  
      // Mocking prisma.otp.create to simulate OTP creation
      prismaClient.otp.create.mockResolvedValue({});
  
      // Mocking sendEmail to simulate email sending success
      mockedSendEmail.mockResolvedValue({ data: true });
  
      await adminForgotPassword(req as Request, res as Response);
  
      // Verifying the behavior
      expect(prismaClient.admin.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@example.com' },
      });
      expect(prismaClient.otp.create).toHaveBeenCalled();
      expect(mockedSendEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: null,
        message: 'OTP sent successfully',
      });
    });

    it('should return 404 if admin not found', async () => {
      const req = mockRequest({ email: 'nonexistent@example.com' });
      const res = mockResponse();
    
      // Mocking prisma.admin.findUnique to return null (admin not found)
      prismaClient.admin.findUnique.mockResolvedValue(null);
    
      await adminForgotPassword(req as Request, res as Response);
    
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'User not found',
      });
    });
    it('should return 400 if email is missing', async () => {
      const req = mockRequest({});  // No email in the body
      const res = mockResponse();
    
      await adminForgotPassword(req as Request, res as Response);
    
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
    });
    it('should return 500 if sending OTP email fails', async () => {
      const req = mockRequest({ email: 'admin@example.com' });
      const res = mockResponse();
    
      // Mocking prisma.admin.findUnique to return an admin
      prismaClient.admin.findUnique.mockResolvedValue({
        adminId: 1,
        email: 'admin@example.com',
      });
    
      // Mocking prisma.otp.create to simulate OTP creation
      prismaClient.otp.create.mockResolvedValue({});
    
      // Mocking sendEmail to simulate email sending failure
      mockedSendEmail.mockResolvedValue({ data: null });
    
      await adminForgotPassword(req as Request, res as Response);
    
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Failed to send OTP',
      });
    });
    it('should return 500 if OTP creation fails', async () => {
      const req = mockRequest({ email: 'admin@example.com' });
      const res = mockResponse();
    
      // Mocking prisma.admin.findUnique to return an admin
      prismaClient.admin.findUnique.mockResolvedValue({
        adminId: 1,
        email: 'admin@example.com',
      });
    
      // Mocking prisma.otp.create to simulate an error in OTP creation
      prismaClient.otp.create.mockRejectedValue(new Error('OTP creation failed'));
    
      await adminForgotPassword(req as Request, res as Response);
    
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'An error occurred: OTP creation failed',
      });
    });
    it('should return 500 if an unknown error occurs', async () => {
      const req = mockRequest({ email: 'admin@example.com' });
      const res = mockResponse();
    
      // Mocking prisma.admin.findUnique to return an admin
      prismaClient.admin.findUnique.mockResolvedValue({
        adminId: 1,
        email: 'admin@example.com',
      });
    
      // Simulating an unexpected error in the OTP creation
      prismaClient.otp.create.mockRejectedValue(new Error('Database error'));
    
      await adminForgotPassword(req as Request, res as Response);
    
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'An error occurred: Database error',
      });
    });   
  });
  //Test : reset admin Password
  describe('resetAdminPassword', () => {
    it('should reset the password successfully', async () => {
      const req = mockRequest({
        email: 'admin@example.com',
        password: 'newAdminPassword123',
      });
      const res = mockResponse();
  
      const adminData = {
        adminId: 1,
        email: 'admin@example.com',
      };
  
      // Mocking prisma.admin.findUnique to return the admin user
      prismaClient.admin.findUnique.mockResolvedValue(adminData);
      
      // Mocking the password hashing
      (hashPassword as jest.Mock).mockResolvedValue('hashedNewAdminPassword123');
      
      // Mocking prisma.customer.update to simulate password update
      prismaClient.customer.update.mockResolvedValue({});
  
      await resetAdminPassword(req as Request, res as Response);
  
      // Verifying the behavior
      expect(prismaClient.admin.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@example.com' },
      });
      expect(hashPassword).toHaveBeenCalledWith('newAdminPassword123');
      expect(prismaClient.customer.update).toHaveBeenCalledWith({
        where: { customerId: 1 },
        data: { password: 'hashedNewAdminPassword123' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: null,
        message: 'Password changed successfully',
      });
    });

    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({ email: 'admin@example.com' }); // Missing password
      const res = mockResponse();
    
      await resetAdminPassword(req as Request, res as Response);
    
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
    });

    it('should return 404 if the admin does not exist', async () => {
      const req = mockRequest({
        email: 'nonexistent@example.com',
        password: 'newAdminPassword123',
      });
      const res = mockResponse();
    
      prismaClient.admin.findUnique.mockResolvedValue(null);
    
      await resetAdminPassword(req as Request, res as Response);
    
      expect(prismaClient.admin.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'User not found',
      });
    });
    it('should return 500 if an error occurs during execution', async () => {
      const req = mockRequest({
        email: 'admin@example.com',
        password: 'newAdminPassword123',
      });
      const res = mockResponse();
    
      // Simulating an error in the database query
      prismaClient.admin.findUnique.mockRejectedValue(
        new Error('Database error')
      );
    
      await resetAdminPassword(req as Request, res as Response);
    
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'An error occurred: Database error',
      });
    });
    it('should return 500 if password hashing fails', async () => {
      const req = mockRequest({
        email: 'admin@example.com',
        password: 'newAdminPassword123',
      });
      const res = mockResponse();
    
      const adminData = {
        adminId: 1,
        email: 'admin@example.com',
      };
    
      // Mocking the findUnique to return an admin user
      prismaClient.admin.findUnique.mockResolvedValue(adminData);
    
      // Simulating password hashing failure
      (hashPassword as jest.Mock).mockRejectedValue(new Error('Hashing failed'));
    
      await resetAdminPassword(req as Request, res as Response);
    
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: 'An error occurred: Hashing failed',
      });
    });
            
  }); 

});



