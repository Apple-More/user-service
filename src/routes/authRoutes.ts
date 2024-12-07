import { Router } from 'express';
import {
  customerLogin,
  adminLogin,
  customerForgotPassword,
  verifyCustomerOtp,
  resetCustomerPassword,
  adminForgotPassword,
  resetAdminPassword,
} from '../controllers/auth-controller';
import { createCustomer } from '../controllers/user-controller';

const router = Router();

router.post('/customers/register', createCustomer);
router.post('/customers/login', customerLogin);
router.post('/customers/forgot-password', customerForgotPassword);
router.post('/customers/reset-password', resetCustomerPassword);

router.post('/verify-otp', verifyCustomerOtp);

router.post('/admin/login', adminLogin);
router.post('/admin/forgot-password', adminForgotPassword);
router.post('/admin/reset-password', resetAdminPassword);

export default router;
