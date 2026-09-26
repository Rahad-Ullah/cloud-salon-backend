import { registerApiRoute } from '../../../helpers/openapi-helper';
import { ChatValidations } from './chat.validation';

export function registerChatDocs() {
  const registerChat = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Chat'], ...opts });
  };

  // create chat
  registerChat({
    method: 'post',
    path: '/chats/create',
    summary: 'Create chat',
    body: ChatValidations.createChatValidation.shape.body,
    isAuth: true,
  });

  // delete chat
  registerChat({
    method: 'delete',
    path: '/chats/:id',
    summary: 'Delete chat',
    params: ChatValidations.deleteChatValidation.shape.params,
    isAuth: true,
  });

  // get single chat
  registerChat({
    method: 'get',
    path: '/chats/single/:id',
    summary: 'Get single chat',
    params: ChatValidations.getSingleChatValidation.shape.params,
    isAuth: true,
  });

  // get my chats
  registerChat({
    method: 'get',
    path: '/chats/me',
    summary: 'Get my chats',
    query: ChatValidations.getMyChatsValidation.shape.query,
    isAuth: true,
  });
}
