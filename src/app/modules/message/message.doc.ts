import { registerApiRoute } from '../../../helpers/openapi-helper';
import { MessageValidations } from './message.validation';

export function registerMessageDocs() {
  const registerMessage = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Message'], ...opts });
  };

  // create message
  registerMessage({
    method: 'post',
    path: '/messages/create',
    summary: 'Create message',
    body: MessageValidations.createMessageSchema.shape.body,
    isAuth: true,
  });

  // update message
  registerMessage({
    method: 'patch',
    path: '/messages/:id',
    summary: 'Update message',
    params: MessageValidations.updateMessageSchema.shape.params,
    body: MessageValidations.updateMessageSchema.shape.body,
    isAuth: true,
  });

  // delete message
  registerMessage({
    method: 'delete',
    path: '/messages/:id',
    summary: 'Delete message',
    params: MessageValidations.deleteMessageSchema.shape.params,
    isAuth: true,
  });

  // get messages by chat id
  registerMessage({
    method: 'get',
    path: '/messages/chat/:id',
    summary: 'Get messages by chat id',
    params: MessageValidations.getChatMessagesSchema.shape.params,
    isAuth: true,
  });
}
