import { registry } from '../docs/openapi';
import { AnyZodObject, ZodType } from 'zod';

interface RegisterRouteOptions {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  tags?: string[];
  summary: string;
  description?: string;
  body?: ZodType<any>;
  query?: AnyZodObject;
  params?: AnyZodObject;
  headers?: AnyZodObject;
  isAuth?: boolean;
  roles?: string[];
  successDescription?: string;
}

export function registerApiRoute({
  method,
  path,
  tags,
  summary,
  description = '',
  body,
  query,
  params,
  headers,
  isAuth = false,
  roles,
  successDescription = 'Success',
}: RegisterRouteOptions) {
  // Converts Express-style "/users/:id" to OpenAPI-style "/users/{id}"
  const openApiPath = path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');

  const roleDescription = roles?.length
    ? `\n\n**Required Roles:** \`${roles.join('`, `')}\``
    : '';

  const finalDescription = `${description}${roleDescription}`.trim();

  registry.registerPath({
    method,
    path: openApiPath,
    tags,
    summary: summary,
    description: finalDescription,
    ...(isAuth && { security: [{ bearerAuth: [] }] }),
    request: {
      ...(params && { params }),
      ...(query && { query }),
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
