import express from 'express';
import { MessageController } from './message.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { MessageValidations } from './message.validation';

const router = express.Router();

// create message
router.post(
  '/create',
  auth(),
  validateRequest(MessageValidations.createMessageSchema),
  MessageController.createMessage,
);

// update message
router.patch(
  '/:id',
  auth(),
  validateRequest(MessageValidations.updateMessageSchema),
  MessageController.updateMessage,
);

// get messages by chat id
router.get(
  '/chat/:id',
  auth(),
  validateRequest(MessageValidations.getChatMessagesSchema),
  MessageController.getChatMessages,
);

export const MessageRoutes = router;
