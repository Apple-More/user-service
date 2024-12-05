import { Router } from 'express';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  getAllAddressByCustomerId,
  createAddressByCustomerId,
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  getAllSuperAdmins,
  getSuperAdminById,
  createSuperAdmin,
  updateSuperAdmin,
} from '../controllers/user-controller';
import allowRoles from '../middlewares/allow-roles';

const router = Router();

router.post('/customers', createCustomer);
router.get('/customers/:customerId', getCustomerById);
router.patch('/customers/:customerId', updateCustomer);
router.get('/customers/:customerId/address', getAllAddressByCustomerId);
router.post('/customers/:customerId/address', createAddressByCustomerId);

router.route('/customers').get(allowRoles('Admin'), getAllCustomers);

router.get('/admins', getAllAdmins);
router.get('/admins/:adminId', getAdminById);
router.post('/admins/register', createAdmin);
router.patch('/admins/:adminId', updateAdmin);

router.get('/super-admins', getAllSuperAdmins);
router.get('/super-admins/:adminId', getSuperAdminById);
router.post('/super-admins', createSuperAdmin);
router.patch('/super-admins/:adminId', updateSuperAdmin);

export default router;
