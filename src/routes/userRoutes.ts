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

router.route('/customers').get(allowRoles('Admin'), getAllCustomers);
router.post('/customers', createCustomer);
router.get('/customers/:customerId/address', getAllAddressByCustomerId);
router.post('/customers/:customerId/address', createAddressByCustomerId);
router.get('/customers/:customerId', getCustomerById);
router.patch('/customers/:customerId', updateCustomer);

router.get('/admin', getAllAdmins);
router.get('/admin/:adminId', getAdminById);
router.post('/admin/register', createAdmin);
router.patch('/admin/:adminId', updateAdmin);

router.get('/super-admin', getAllSuperAdmins);
router.get('/super-admin/:adminId', getSuperAdminById);
router.post('/super-admin', createSuperAdmin);
router.patch('/super-admin/:adminId', updateSuperAdmin);

export default router;
