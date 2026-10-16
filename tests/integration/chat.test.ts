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

describe('Chat Module API Endpoints', () => {
  const user1Data = {
    firstName: 'Amara',
    lastName: 'Client',
    email: 'amara.chat@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const user2Data = {
    firstName: 'Julian',
    lastName: 'Stylist',
    email: 'julian.chat@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Professional,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  const user3Data = {
    firstName: 'Third',
    lastName: 'Party',
    email: 'third.party@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  describe('POST /api/v1/chats/create', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/chats/create')
        .send({ participants: [new mongoose.Types.ObjectId().toString()] });

      expect(res.status).toBe(401);
    });

    it('should return 400 when participants array is empty', async () => {
      const u1 = await User.create(user1Data);
      const token1 = createTestToken(UserRole.Customer, u1._id.toString(), u1.email);

      const res = await request(app)
        .post('/api/v1/chats/create')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participants: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create a chat including requester in participants', async () => {
      const u1 = await User.create(user1Data);
      const u2 = await User.create(user2Data);
      const token1 = createTestToken(UserRole.Customer, u1._id.toString(), u1.email);

      const res = await request(app)
        .post('/api/v1/chats/create')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participants: [u2._id.toString()] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Chat created successfully');
      expect(res.body.data.participants).toContain(u1._id.toString());
      expect(res.body.data.participants).toContain(u2._id.toString());
    });

    it('should return existing chat if chat already exists for participants', async () => {
      const u1 = await User.create(user1Data);
      const u2 = await User.create(user2Data);
      const token1 = createTestToken(UserRole.Customer, u1._id.toString(), u1.email);

      // First creation
      const res1 = await request(app)
        .post('/api/v1/chats/create')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participants: [u2._id.toString()] });

      // Second creation attempt
      const res2 = await request(app)
        .post('/api/v1/chats/create')
        .set('Authorization', `Bearer ${token1}`)
        .send({ participants: [u2._id.toString()] });

      expect(res2.status).toBe(200);
      expect(res2.body.data._id).toBe(res1.body.data._id);
    });
  });

  describe('DELETE /api/v1/chats/:id', () => {
    it('should return 404 when chat not found', async () => {
      const u1 = await User.create(user1Data);
      const token1 = createTestToken(UserRole.Customer, u1._id.toString(), u1.email);
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/v1/chats/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Chat not found/i);
    });

    it('should soft delete chat successfully', async () => {
      const u1 = await User.create(user1Data);
      const u2 = await User.create(user2Data);
      const token1 = createTestToken(UserRole.Customer, u1._id.toString(), u1.email);

      const chat = await Chat.create({
        participants: [u1._id, u2._id],
      });

      const res = await request(app)
        .delete(`/api/v1/chats/${chat._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deletedChat = await Chat.findById(chat._id);
      expect(deletedChat?.isDeleted).toBe(true);
    });
  });

  describe('GET /api/v1/chats/single/:id', () => {
    it('should return 400 when requester is not a participant of the chat', async () => {
      const u1 = await User.create(user1Data);
      const u2 = await User.create(user2Data);
      const u3 = await User.create(user3Data);
      const token3 = createTestToken(UserRole.Customer, u3._id.toString(), u3.email);

      const chat = await Chat.create({
        participants: [u1._id, u2._id],
      });

      const res = await request(app)
        .get(`/api/v1/chats/single/${chat._id}`)
        .set('Authorization', `Bearer ${token3}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not a participant/i);
    });

    it('should return chat with anotherParticipant populated for participant', async () => {
      const u1 = await User.create(user1Data);
      const u2 = await User.create(user2Data);
      const token1 = createTestToken(UserRole.Customer, u1._id.toString(), u1.email);

      const chat = await Chat.create({
        participants: [u1._id, u2._id],
      });

      const res = await request(app)
        .get(`/api/v1/chats/single/${chat._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Chat retrieved successfully');
      expect(res.body.data._id).toBe(chat._id.toString());
      expect(res.body.data.anotherParticipant._id).toBe(u2._id.toString());
      expect(res.body.data.anotherParticipant.firstName).toBe(user2Data.firstName);
    });
  });

  describe('GET /api/v1/chats/me', () => {
    it('should list all chats for authenticated user with lastMessage populated', async () => {
      const u1 = await User.create(user1Data);
      const u2 = await User.create(user2Data);
      const token1 = createTestToken(UserRole.Customer, u1._id.toString(), u1.email);

      const chat = await Chat.create({
        participants: [u1._id, u2._id],
      });

      const message = await Message.create({
        chat: chat._id,
        sender: u2._id,
        content: 'Hey there! Ready for your appointment?',
        type: MessageType.Text,
      });

      await Chat.findByIdAndUpdate(chat._id, { lastMessage: message._id });

      const res = await request(app)
        .get('/api/v1/chats/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Chats retrieved successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].lastMessage.content).toBe('Hey there! Ready for your appointment?');
    });
  });
});
