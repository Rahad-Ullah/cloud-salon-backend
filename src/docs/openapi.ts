import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import { registerAuthDocs } from '../app/modules/auth/auth.doc';
import { registerUserDocs } from '../app/modules/user/user.doc';
import config from '../config';
import { registerProfessionalDocs } from '../app/modules/professional/professional.doc';
import { registerDisclaimerDocs } from '../app/modules/disclaimer/disclaimer.doc';
import { registerFaqDocs } from '../app/modules/faq/faq.doc';
import { registerNotificationDocs } from '../app/modules/notification/notification.doc';
import { registerSupportDocs } from '../app/modules/support/support.doc';
import { registerMediaUploadDocs } from '../app/modules/mediaUpload/mediaUpload.doc';
import { registerChatDocs } from '../app/modules/chat/chat.doc';
import { registerMessageDocs } from '../app/modules/message/message.doc';
import { registerSalonDocs } from '../app/modules/salon/salon.doc';

export const registry = new OpenAPIRegistry();

// Register Bearer Auth (optional, for secured endpoints)
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

export function generateOpenApiDocumentV1() {
  registerAuthDocs();
  registerUserDocs();
  registerProfessionalDocs();
  registerMediaUploadDocs();
  registerSalonDocs();
  registerChatDocs();
  registerMessageDocs();
  registerDisclaimerDocs();
  registerFaqDocs();
  registerNotificationDocs();
  registerSupportDocs();

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: `${config.server_name} Backend API`,
      version: '1.0.0',
      description: 'API documentation generated automatically from Zod schemas',
    },
    servers: [{ url: '/api/v1' }],
  });
}
