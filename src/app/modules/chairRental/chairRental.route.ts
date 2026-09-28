import express from 'express';
import { ChairRentalController } from './chairRental.controller';

const router = express.Router();

router.get('/', ChairRentalController);

export const chairRentalRoutes = router;