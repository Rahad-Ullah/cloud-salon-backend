import express from 'express';
import { ProfessionalController } from './professional.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { ProfessionalValidations } from './professional.validation';
import { ChairRentalValidations } from '../chairRental/chairRental.validation';

const router = express.Router();

// update professional
router.patch(
  '/me',
  auth(UserRole.Professional),
  validateRequest(ProfessionalValidations.updateProfessionalValidation),
  ProfessionalController.updateProfessional,
);

// get active professionals
router.get(
  '/active',
  validateRequest(ProfessionalValidations.getAllActiveProfessionalsValidation),
  ProfessionalController.getActiveProfessionals,
);

export const professionalRoutes = router;
