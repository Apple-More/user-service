import { sign } from 'jsonwebtoken';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

import prisma from '../config/prisma';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/index';
import { hashPassword, sendEmail } from '../utils';

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
      user: {
        customerId: customer.customerId,
        customerName: customer.customerName,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
      },
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

export const adminLogin = async (
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
    const admin = await prisma.admin.findUnique({
      where: {
        email,
      },
    });
    if (!admin) {
      res.status(404).json({
        status: false,
        data: null,
        message: 'Admin not found',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: false,
        data: null,
        message: 'Invalid password',
      });
      return;
    }

    const payload = {
      user: {
        adminId: admin.adminId,
        adminName: admin.adminName,
        email: admin.email,
        adminRole: admin.adminRole,
      },
    };

    const token = sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(200).json({
      status: true,
      data: {
        accessToken: token,
      },
      message: 'Admin logged in successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const customerForgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Forgot password logic
    const { email } = req.body;
    if (!email) {
      res.status(400).json({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
      return;
    }

    const user = await prisma.customer.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(404).json({
        status: false,
        data: null,
        message: 'User not found',
      });
      return;
    }

    const generatedOtpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.otp.create({
      data: {
        otpCode: generatedOtpCode,
        otpUserId: user.customerId,
        expiresAt,
      },
    });

    // Send OTP to user email
    const emailPayload = {
      emails: [email],
      subject: 'Your OTP Code for Account Verification',
      message: `
    <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #ddd; border-radius: 8px;">
          <div style="padding: 20px;">
            <h2 style="text-align: center; color: #333;">Help us protect your account</h2>
            <p style="text-align: center;">Before you sign in, we need to verify your identity. Enter the following code on the sign-in page:</p>
            <div style="text-align: center; margin: 20px;">
              <p style="font-size: 36px; font-weight: bold; color: #333; background: #f2f2f2; display: inline-block; padding: 10px 20px; border-radius: 5px; border: 1px solid #ddd;">
                ${generatedOtpCode}
              </p>
            </div>
            <p style="text-align: center; color: #666;">If you did not request this code, we recommend <a href="#" style="color: #673AB7; text-decoration: none;">changing your password</a> and <a href="#" style="color: #673AB7; text-decoration: none;">setting up Two-Factor Authentication</a> to keep your account safe. This code expires after 60 minutes.</p>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>You’re receiving this email because of your account on <a href="#" style="color: #673AB7; text-decoration: none;">applemore.com</a>.</p>
          </div>
        </div>
      </body>
    </html>
  `,
    };
    const { data } = await sendEmail(emailPayload);
    if (!data) {
      res.status(500).json({
        status: false,
        data: null,
        message: 'Failed to send OTP',
      });
      return;
    }

    res.status(200).json({
      status: true,
      data: null,
      message: 'OTP sent successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const verifyCustomerOtp = async (req: Request, res: Response) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      res.status(400).json({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
      return;
    }

    const user = await prisma.customer.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(404).json({
        status: false,
        data: null,
        message: 'User not found',
      });
      return;
    }

    const otp = await prisma.otp.findFirst({
      where: {
        otpCode,
        otpUserId: user.customerId,
      },
    });

    if (!otp) {
      res.status(401).json({
        status: false,
        data: null,
        message: 'Invalid OTP code',
      });
      return;
    }

    const isOtpExpired = new Date() > otp.expiresAt;

    if (isOtpExpired) {
      res.status(401).json({
        status: false,
        data: null,
        message: 'OTP code has expired',
      });
      return;
    }

    await prisma.otp.delete({
      where: {
        otpId: otp.otpId,
      },
    });

    res.status(200).json({
      status: true,
      data: otp,
      message: 'OTP verified successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const resetCustomerPassword = async (
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

    const user = await prisma.customer.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(404).json({
        status: false,
        data: null,
        message: 'User not found',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    await prisma.customer.update({
      where: {
        customerId: user.customerId,
      },
      data: {
        password: hashedPassword,
      },
    });

    res.status(200).json({
      status: true,
      data: null,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const adminForgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Forgot password logic
    const { email } = req.body;
    if (!email) {
      res.status(400).json({
        status: false,
        data: null,
        message: 'Missing required fields',
      });
      return;
    }

    const user = await prisma.admin.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(404).json({
        status: false,
        data: null,
        message: 'User not found',
      });
      return;
    }

    const generatedOtpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.otp.create({
      data: {
        otpCode: generatedOtpCode,
        otpUserId: user.adminId,
        expiresAt,
      },
    });

    // Send OTP to user email
    const emailPayload = {
      emails: [email],
      subject: 'Your OTP Code for Account Verification',
      message: `
    <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #ddd; border-radius: 8px;">
          <div style="padding: 20px;">
            <h2 style="text-align: center; color: #333;">Help us protect your account</h2>
            <p style="text-align: center;">Before you sign in, we need to verify your identity. Enter the following code on the sign-in page:</p>
            <div style="text-align: center; margin: 20px;">
              <p style="font-size: 36px; font-weight: bold; color: #333; background: #f2f2f2; display: inline-block; padding: 10px 20px; border-radius: 5px; border: 1px solid #ddd;">
                ${generatedOtpCode}
              </p>
            </div>
            <p style="text-align: center; color: #666;">If you did not request this code, we recommend <a href="#" style="color: #673AB7; text-decoration: none;">changing your password</a> and <a href="#" style="color: #673AB7; text-decoration: none;">setting up Two-Factor Authentication</a> to keep your account safe. This code expires after 60 minutes.</p>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p>You’re receiving this email because of your account on <a href="#" style="color: #673AB7; text-decoration: none;">applemore.com</a>.</p>
          </div>
        </div>
      </body>
    </html>
  `,
    };
    const { data } = await sendEmail(emailPayload);
    if (!data) {
      res.status(500).json({
        status: false,
        data: null,
        message: 'Failed to send OTP',
      });
      return;
    }

    res.status(200).json({
      status: true,
      data: null,
      message: 'OTP sent successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

export const resetAdminPassword = async (
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

    const user = await prisma.admin.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(404).json({
        status: false,
        data: null,
        message: 'User not found',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    await prisma.customer.update({
      where: {
        customerId: user.adminId,
      },
      data: {
        password: hashedPassword,
      },
    });

    res.status(200).json({
      status: true,
      data: null,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: false,
      data: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};
