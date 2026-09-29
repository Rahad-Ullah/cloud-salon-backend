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
  auth(UserRole.Professional),
  validateRequest(ServiceValidations.updateServiceValidation),
  ServiceController.updateService,
);

export const serviceRoutes = router;
