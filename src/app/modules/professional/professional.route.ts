import express from 'express';
import { ProfessionalController } from './professional.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { ProfessionalValidations } from './professional.validation';

const router = express.Router();

router.patch(
  '/me',
  auth(UserRole.Professional),
  validateRequest(ProfessionalValidations.updateProfessionalValidation),
  ProfessionalController.updateProfessional,
);

export const professionalRoutes = router;
