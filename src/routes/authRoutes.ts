import { Router } from 'express';
import { customerLogin } from '../controllers/auth-controller';

const router = Router();

router.post('/customers/login', customerLogin);

export default router;
