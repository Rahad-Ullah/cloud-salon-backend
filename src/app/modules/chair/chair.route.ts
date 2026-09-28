import express from 'express';
import { ChairController } from './chair.controller';

const router = express.Router();

router.get('/', ChairController);

export const chairRoutes = router;