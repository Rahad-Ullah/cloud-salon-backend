import express from 'express';
import { WishlistController } from './wishlist.controller';

const router = express.Router();

router.get('/', WishlistController);

export const wishlistRoutes = router;