import { Router } from 'express';
import {
  customerLogin,
  adminLogin,
  customerForgotPassword,
} from '../controllers/auth-controller';

const router = Router();

router.post('/customers/login', customerLogin);
router.post('/customers/forgot-password', customerForgotPassword);

router.post('/admin/login', adminLogin);
router.post('/admin/forgot-password');

export default router;
