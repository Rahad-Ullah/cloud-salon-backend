import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';
import { MessageType } from './message.constant';

// Define the validation schema for Message
const createMessageSchema = z.object({
  body: z
    .object({
      chat: objectId('Invalid chat ID'),
      type: z.nativeEnum(MessageType),
      content: z.string().nonempty('Message content is required'),
    })
    .strict(),
});

// update message validation schema
const updateMessageSchema = z.object({
  params: z
    .object({
      id: objectId('Invalid message ID'),
    })
    .strict(),
  body: z
    .object({
      content: z.string().nonempty('Message content is required'),
    })
    .strict(),
});

// get message by chat id
const getChatMessagesSchema = z.object({
  params: z
    .object({
      id: objectId('Invalid chat ID'),
    })
    .strict(),
});

export const MessageValidations = {
  createMessageSchema,
  updateMessageSchema,
  getChatMessagesSchema,
};
