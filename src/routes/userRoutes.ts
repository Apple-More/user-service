import { Router } from 'express';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
} from '../controllers/user-controller';

const router = Router();

router.get('/customers', getAllCustomers);
router.post('/customers', createCustomer);
router.get('/customers/:customerId', getCustomerById);
router.patch('/customers');

export default router;
