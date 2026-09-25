import { registry } from '../docs/openapi';
import { AnyZodObject, ZodType } from 'zod';

interface RegisterRouteOptions {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  tags?: string[];
  summary: string;
  body?: ZodType<any>;
  headers?: AnyZodObject;
  isAuth?: boolean;
  successDescription?: string;
}

export function registerApiRoute({
  method,
  path,
  tags,
  summary,
  body,
  headers,
  isAuth = false,
  successDescription = 'Success',
}: RegisterRouteOptions) {
  registry.registerPath({
    method,
    path,
    tags,
    summary,
    ...(isAuth && { security: [{ bearerAuth: [] }] }),
    request: {
      ...(headers && { headers }),
      ...(body && {
        body: {
          content: {
            'application/json': { schema: body },
          },
        },
      }),
    },
    responses: {
      200: { description: successDescription },
      400: { description: 'Validation failed or invalid input' },
      ...(isAuth && { 401: { description: 'Unauthorized access' } }),
    },
  });
}
