import { Request, Response } from 'express';
import { MessageServices } from './message.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

// ----------------- create message -------------------
const createMessage = catchAsync(
  async (req: Request, res: Response) => {
    const payload = { ...req.body, sender: req.user.id };

    const result = await MessageServices.createMessage(payload);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Message created successfully',
      data: result,
    });
  }
);

// ----------------- get messages by chat id -------------------
const getChatMessages = catchAsync(
  async (req: Request, res: Response) => {
    const chatId = req.params.id;
    const user = req.user;

    const result = await MessageServices.getChatMessages(
      chatId,
      req.query,
      user
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Messages retrieved successfully',
      data: result.messages,
      pagination: result.pagination,
    });
  }
);

export const MessageController = { createMessage, getChatMessages };
