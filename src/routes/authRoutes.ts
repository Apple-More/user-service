import { Router } from 'express';
import { customerLogin, adminLogin } from '../controllers/auth-controller';

const router = Router();

router.post('/customers/login', customerLogin);
router.post('/admin/login', adminLogin);

export default router;
