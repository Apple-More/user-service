import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.use('/public/auth', authRoutes);
router.use('/', userRoutes);

export default router;
