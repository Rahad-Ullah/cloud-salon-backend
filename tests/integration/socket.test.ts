import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { socketHelper } from '../../src/helpers/socketHelper';
import { User } from '../../src/app/modules/user/user.model';
import { Chat } from '../../src/app/modules/chat/chat.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Socket.IO Gateway Integration', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let serverPort: number;
  const activeClients: ClientSocket[] = [];

  beforeAll(async () => {
    httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: { origin: '*' },
    });

    socketHelper.socket(io);

    await new Promise<void>(resolve => {
      httpServer.listen(0, () => {
        const address = httpServer.address();
        serverPort = typeof address === 'object' && address ? address.port : 0;
        resolve();
      });
    });
  });

  afterAll(async () => {
    io.close();
    await new Promise<void>(resolve => httpServer.close(() => resolve()));
  });

  afterEach(() => {
    for (const client of activeClients) {
      if (client.connected) {
        client.disconnect();
      }
    }
    activeClients.length = 0;
  });

  const createSocketClient = (token?: string): ClientSocket => {
    const client = ioClient(`http://localhost:${serverPort}`, {
      auth: token ? { token } : {},
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      autoConnect: false,
    });
    activeClients.push(client);
    return client;
  };

  const connectSocketClient = (client: ClientSocket): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (client.connected) {
        resolve();
        return;
      }
      client.once('connect', () => resolve());
      client.once('connect_error', err => reject(err));
      client.connect();
    });
  };

  it('should reject connection when no authentication token is provided', async () => {
    const client = createSocketClient();

    const errorPromise = new Promise<string>(resolve => {
      client.once('connect_error', err => {
        resolve(err.message);
      });
    });

    client.connect();

    const errorMessage = await errorPromise;
    expect(errorMessage).toMatch(/Authentication error/i);
  });

  it('should authenticate user, mark online, and join user room', async () => {
    const user = await User.create({
      firstName: 'Socket',
      lastName: 'User',
      email: 'socket.user@cloudsalon.com',
      password: 'Password123!',
      role: UserRole.Customer,
      isEmailVerified: true,
      status: UserStatus.Active,
    });

    const token = createTestToken(
      UserRole.Customer,
      user._id.toString(),
      user.email,
    );
    const client = createSocketClient(token);

    await connectSocketClient(client);
    expect(client.connected).toBe(true);

    // Wait a brief moment for async DB update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify online status was updated in DB
    const onlineUser = await User.findById(user._id);
    expect(onlineUser?.isOnline).toBe(true);
  });

  it('should handle room:join for chat participants with ack callback', async () => {
    const u1 = await User.create({
      firstName: 'Member1',
      lastName: 'Chat',
      email: 'm1.socket@cloudsalon.com',
      password: 'Password123!',
      role: UserRole.Customer,
      isEmailVerified: true,
      status: UserStatus.Active,
    });
    const u2 = await User.create({
      firstName: 'Member2',
      lastName: 'Chat',
      email: 'm2.socket@cloudsalon.com',
      password: 'Password123!',
      role: UserRole.Professional,
      isEmailVerified: true,
      status: UserStatus.Active,
    });

    const chat = await Chat.create({
      participants: [u1._id, u2._id],
    });

    const token1 = createTestToken(
      UserRole.Customer,
      u1._id.toString(),
      u1.email,
    );
    const client = createSocketClient(token1);

    await connectSocketClient(client);

    // Emit room:join with acknowledgment callback
    const joinResponse = await new Promise<{
      success: boolean;
      message: string;
    }>(resolve => {
      client.emit('room:join', { chatId: chat._id.toString() }, (res: any) => {
        resolve(res);
      });
    });

    expect(joinResponse.success).toBe(true);
    expect(joinResponse.message).toContain(
      `Successfully joined chat:${chat._id}`,
    );
  });

  it('should reject room:join when user is not a participant of the chat', async () => {
    const u1 = await User.create({
      firstName: 'Member1',
      lastName: 'Chat',
      email: 'm1_rej.socket@cloudsalon.com',
      password: 'Password123!',
      role: UserRole.Customer,
      isEmailVerified: true,
      status: UserStatus.Active,
    });
    const u2 = await User.create({
      firstName: 'Member2',
      lastName: 'Chat',
      email: 'm2_rej.socket@cloudsalon.com',
      password: 'Password123!',
      role: UserRole.Professional,
      isEmailVerified: true,
      status: UserStatus.Active,
    });
    const outsider = await User.create({
      firstName: 'Outsider',
      lastName: 'User',
      email: 'outsider.socket@cloudsalon.com',
      password: 'Password123!',
      role: UserRole.Customer,
      isEmailVerified: true,
      status: UserStatus.Active,
    });

    const chat = await Chat.create({
      participants: [u1._id, u2._id],
    });

    const outsiderToken = createTestToken(
      UserRole.Customer,
      outsider._id.toString(),
      outsider.email,
    );
    const client = createSocketClient(outsiderToken);

    await connectSocketClient(client);

    const joinResponse = await new Promise<{
      success: boolean;
      message: string;
    }>(resolve => {
      client.emit('room:join', { chatId: chat._id.toString() }, (res: any) => {
        resolve(res);
      });
    });

    expect(joinResponse.success).toBe(false);
    expect(joinResponse.message).toMatch(/not a participant/i);
  });

  it('should handle room:leave successfully', async () => {
    const u1 = await User.create({
      firstName: 'Leaver',
      lastName: 'User',
      email: 'leaver.socket@cloudsalon.com',
      password: 'Password123!',
      role: UserRole.Customer,
      isEmailVerified: true,
      status: UserStatus.Active,
    });

    const token = createTestToken(
      UserRole.Customer,
      u1._id.toString(),
      u1.email,
    );
    const client = createSocketClient(token);

    await connectSocketClient(client);
    const fakeChatId = new mongoose.Types.ObjectId().toString();

    const leaveResponse = await new Promise<{
      success: boolean;
      message: string;
    }>(resolve => {
      client.emit('room:leave', { chatId: fakeChatId }, (res: any) => {
        resolve(res);
      });
    });

    expect(leaveResponse.success).toBe(true);
    expect(leaveResponse.message).toContain(
      `Successfully left chat:${fakeChatId}`,
    );
  });
});
