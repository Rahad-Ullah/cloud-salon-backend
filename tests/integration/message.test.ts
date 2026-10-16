import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Chat } from '../../src/app/modules/chat/chat.model';
import { Message } from '../../src/app/modules/message/message.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { MessageType } from '../../src/app/modules/message/message.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Message Module API Endpoints', () => {
  const senderData = {
    firstName: 'Sender',
    lastName: 'User',
    email: 'sender.msg@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const recipientData = {
    firstName: 'Recipient',
    lastName: 'Stylist',
    email: 'recipient.msg@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const thirdPartyData = {
    firstName: 'Stranger',
    lastName: 'User',
    email: 'stranger.msg@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const setupChat = async () => {
    const sender = await User.create(senderData);
    const recipient = await User.create(recipientData);
    const stranger = await User.create(thirdPartyData);

    const chat = await Chat.create({
      participants: [sender._id, recipient._id],
    });

    const senderToken = createTestToken(
      UserRole.Customer,
      sender._id.toString(),
      sender.email,
    );
    const recipientToken = createTestToken(
      UserRole.Professional,
      recipient._id.toString(),
      recipient.email,
    );
    const strangerToken = createTestToken(
      UserRole.Customer,
      stranger._id.toString(),
      stranger.email,
    );

    return {
      sender,
      recipient,
      stranger,
      chat,
      senderToken,
      recipientToken,
      strangerToken,
    };
  };

  describe('POST /api/v1/messages/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/messages/create')
        .send({ content: 'Hello' });

      expect(res.status).toBe(401);
    });

    it('should return 400 when sender is not a participant of the chat', async () => {
      const { chat, strangerToken } = await setupChat();

      const res = await request(app)
        .post('/api/v1/messages/create')
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({
          chat: chat._id.toString(),
          type: MessageType.Text,
          content: 'I should not be here',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not a participant/i);
    });

    it('should create message successfully and link to chat', async () => {
      const { chat, senderToken, sender } = await setupChat();

      const res = await request(app)
        .post('/api/v1/messages/create')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          chat: chat._id.toString(),
          type: MessageType.Text,
          content: 'Hello, what time is our appointment?',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Message created successfully');
      expect(res.body.data.content).toBe('Hello, what time is our appointment?');
      expect(res.body.data.sender._id).toBe(sender._id.toString());

      // Verify chat was updated with lastMessage
      const updatedChat = await Chat.findById(chat._id);
      expect(updatedChat?.lastMessage?.toString()).toBe(res.body.data._id);
    });
  });

  describe('PATCH /api/v1/messages/:id', () => {
    it('should return 404 when message not found', async () => {
      const { senderToken } = await setupChat();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/messages/${fakeId}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ content: 'Updated text' });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Message not found/i);
    });

    it('should return 401 when user is not the sender', async () => {
      const { chat, sender, recipientToken } = await setupChat();

      const message = await Message.create({
        chat: chat._id,
        sender: sender._id,
        content: 'Original message',
        type: MessageType.Text,
      });

      const res = await request(app)
        .patch(`/api/v1/messages/${message._id}`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({ content: 'Trying to modify someone else msg' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('should update message content when called by sender', async () => {
      const { chat, sender, senderToken } = await setupChat();

      const message = await Message.create({
        chat: chat._id,
        sender: sender._id,
        content: 'Original message',
        type: MessageType.Text,
      });

      const res = await request(app)
        .patch(`/api/v1/messages/${message._id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ content: 'Updated message content' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Message updated successfully');
      expect(res.body.data.content).toBe('Updated message content');
    });
  });

  describe('DELETE /api/v1/messages/:id', () => {
    it('should soft delete message when called by sender', async () => {
      const { chat, sender, senderToken } = await setupChat();

      const message = await Message.create({
        chat: chat._id,
        sender: sender._id,
        content: 'To be deleted',
        type: MessageType.Text,
      });

      const res = await request(app)
        .delete(`/api/v1/messages/${message._id}`)
        .set('Authorization', `Bearer ${senderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Message deleted successfully');

      const deletedMsg = await Message.findById(message._id);
      expect(deletedMsg?.isDeleted).toBe(true);
    });
  });

  describe('GET /api/v1/messages/chat/:id', () => {
    it('should return 401 when requester is not a participant', async () => {
      const { chat, strangerToken } = await setupChat();

      const res = await request(app)
        .get(`/api/v1/messages/chat/${chat._id}`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not a participant/i);
    });

    it('should return paginated messages and mark unseen messages as seen', async () => {
      const { chat, sender, recipientToken, recipient } = await setupChat();

      await Message.create([
        {
          chat: chat._id,
          sender: sender._id,
          content: 'Message 1',
          type: MessageType.Text,
          seenBy: [sender._id],
        },
        {
          chat: chat._id,
          sender: sender._id,
          content: 'Message 2',
          type: MessageType.Text,
          seenBy: [sender._id],
        },
      ]);

      const res = await request(app)
        .get(`/api/v1/messages/chat/${chat._id}?page=1&limit=10`)
        .set('Authorization', `Bearer ${recipientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Messages retrieved successfully');
      expect(res.body.data.length).toBe(2);

      // Verify unseen messages were marked as seen by recipient
      const msgs = await Message.find({ chat: chat._id });
      msgs.forEach(msg => {
        expect(msg.seenBy.map(String)).toContain(recipient._id.toString());
      });
    });
  });
});
