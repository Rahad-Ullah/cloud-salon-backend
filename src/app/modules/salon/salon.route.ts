import express from 'express';
import { SalonController } from './salon.controller';

const router = express.Router();

router.get('/', SalonController);

export const salonRoutes = router;