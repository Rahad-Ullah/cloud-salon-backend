import express from 'express';
import { ProfessionalController } from './professional.controller';

const router = express.Router();

router.get('/', ProfessionalController);

export const professionalRoutes = router;