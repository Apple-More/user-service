import { Router } from 'express';
import {
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

// Customer routes
router.get(
  '/customers/:customerId',
  allowRoles('Admin', 'Customer', 'SuperAdmin'),
  getCustomerById,
);
router.patch('/customers/:customerId', allowRoles('Customer'), updateCustomer);
router.get(
  '/customers/:customerId/address',
  allowRoles('Customer'),
  getAllAddressByCustomerId,
);
router.post(
  '/customers/:customerId/address',
  allowRoles('Customer'),
  createAddressByCustomerId,
);
router
  .route('/customers')
  .get(allowRoles('Admin', 'SuperAdmin'), getAllCustomers);

// Admin routes
router.get('/admins', allowRoles('SuperAdmin'), getAllAdmins);
router.get('/admins/:adminId', allowRoles('Admin', 'SuperAdmin'), getAdminById);
router.post('/admins/register', allowRoles('SuperAdmin'), createAdmin);
router.patch(
  '/admins/:adminId',
  allowRoles('Admin', 'SuperAdmin'),
  updateAdmin,
);

// SuperAdmin routes
router.get('/super-admins', allowRoles('SuperAdmin'), getAllSuperAdmins);
router.get(
  '/super-admins/:adminId',
  allowRoles('SuperAdmin'),
  getSuperAdminById,
);
router.post('/super-admins', allowRoles('SuperAdmin'), createSuperAdmin);
router.patch(
  '/super-admins/:adminId',
  allowRoles('SuperAdmin'),
  updateSuperAdmin,
);

export default router;
