import { JwtPayload } from 'jsonwebtoken';
import { IChat } from './chat.interface';
import { Chat } from './chat.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Message } from '../message/message.model';
import { toObjectId } from '../../../utils/toObjectId';

// ---------------- create chat ----------------
const createChatIntoDB = async (user: JwtPayload, payload: IChat) => {
  const participants = [...payload.participants];
  // push the user id to participants if not already included
  if (!participants.includes(user.id)) {
    participants.push(user.id);
  }

  // create chat if it does not exist
  const isExist = await Chat.findOne({
    participants: { $all: participants },
    isDeleted: false,
  }).lean();
  if (isExist) {
    return isExist;
  }

  const result = await Chat.create({ participants });
  return result;
};

// ---------------- delete chat ----------------
const deleteChatFromDB = async (chatId: string) => {
  const isExist = await Chat.exists({ _id: chatId });
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Chat not found!');
  }

  const result = await Chat.findByIdAndUpdate(
    chatId,
    { isDeleted: true },
    { new: true },
  );
  return result;
};

// ---------------- get single chat by id ----------------
const getSingleChatFromDB = async (chatId: string, userId: string) => {
  const result = await Chat.findById(chatId).populate(
    'participants',
    'firstName lastName image isOnline',
  );

  // check if the user is a participant
  if (
    !result?.participants?.find(
      (participant: any) => participant?._id.toString() === userId,
    )
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not a participant of this chat!',
    );
  }

  if (result) {
    const anotherParticipant = result?.participants?.find(
      (participant: any) => participant?._id.toString() !== userId,
    );
    return { ...result?.toObject(), anotherParticipant };
  }
  return null;
};

// ---------------- get my chats / get by id ----------------
const getMyChatsFromDB = async (
  user: JwtPayload,
  query: Record<string, any>,
) => {
  const currentUserId = toObjectId(user.id);

  // 1. Build participant filter for search
  const participantFilter: Record<string, any> = {
    _id: { $ne: currentUserId },
  };

  if (query?.searchTerm) {
    const term = String(query.searchTerm);
    participantFilter.$or = [
      { firstName: { $regex: term, $options: 'i' } },
      { lastName: { $regex: term, $options: 'i' } },
    ];
  }

  // 2. Fetch chats, populate the other participant and the embedded lastMessage
  const chats = await Chat.find({
    participants: currentUserId,
    isDeleted: false,
  })
    .populate({
      path: 'participants',
      select: 'firstName lastName image isOnline isDeleted',
      match: participantFilter,
    })
    .populate({
      path: 'lastMessage',
      select: 'sender type content isDeleted createdAt',
    })
    .select('participants lastMessage updatedAt')
    .sort({ updatedAt: -1 })
    .lean();

  // 3. Keep only chats where participants matched the search
  const filteredChats = chats.filter(
    (chat: any) => chat.participants && chat.participants.length > 0,
  );

  if (!filteredChats.length) return [];

  // 4. Batch count unread messages in a single aggregation query
  const chatIds = filteredChats.map(c => c._id);

  const unreadCounts = await Message.aggregate([
    {
      $match: {
        chat: { $in: chatIds },
        seenBy: { $nin: [currentUserId] },
      },
    },
    {
      $group: {
        _id: '$chat',
        count: { $sum: 1 },
      },
    },
  ]);

  const unreadMap = new Map(
    unreadCounts.map(item => [item._id.toString(), item.count]),
  );

  // 5. Map the unread count in memory (Zero extra DB calls)
  return filteredChats.map((chat: any) => ({
    ...chat,
    lastMessage: chat.lastMessage || null,
    unreadCount: unreadMap.get(chat._id.toString()) || 0,
  }));
};

export const ChatServices = {
  createChatIntoDB,
  deleteChatFromDB,
  getSingleChatFromDB,
  getMyChatsFromDB,
};
