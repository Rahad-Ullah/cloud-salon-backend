import express from 'express';
import { ServiceController } from './service.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { ServiceValidations } from './service.validation';

const router = express.Router();

// create service
router.post(
  '/create',
  auth(UserRole.Professional),
  validateRequest(ServiceValidations.createServiceValidation),
  ServiceController.createService,
);

// update service
router.patch(
  '/:id',
  auth(UserRole.Professional, UserRole.Admin, UserRole.SuperAdmin),
  validateRequest(ServiceValidations.updateServiceValidation),
  ServiceController.updateService,
);

// delete service
router.delete(
  '/:id',
  auth(UserRole.Professional, UserRole.Admin, UserRole.SuperAdmin),
  validateRequest(ServiceValidations.deleteServiceValidation),
  ServiceController.deleteService,
);

// get single service
router.get(
  '/single/:id',
  validateRequest(ServiceValidations.getServiceByIdValidation),
  ServiceController.getSingleService,
);

// get my services
router.get(
  '/my-services',
  auth(UserRole.Professional),
  validateRequest(ServiceValidations.getMyServicesValidation),
  ServiceController.getMyServices,
);

// get by professional
router.get(
  '/professional/:id',
  validateRequest(ServiceValidations.getProfessionalServicesValidation),
  ServiceController.getServicesByProfessional,
);

// get all services
router.get(
  '/all',
  validateRequest(ServiceValidations.getAllServicesValidation),
  ServiceController.getAllServices,
);

export const serviceRoutes = router;
