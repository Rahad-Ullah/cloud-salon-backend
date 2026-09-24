import { z } from '../../../docs/zod';
import { registry } from '../../../docs/openapi';
import { AuthValidation } from './auth.validation';

// register the OpenAPI Path
export function registerAuthDocs() {
  // login
  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Auth'],
    summary: 'User login',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AuthValidation.createLoginZodSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User logged in successfully',
      },
      400: {
        description: 'Validation failed or invalid input',
      },
    },
  });

  // forget password
  registry.registerPath({
    method: 'post',
    path: '/auth/forget-password',
    tags: ['Auth'],
    summary: 'User forget password',
    request: {
      body: {
        content: {
          'application/json': {
            schema: AuthValidation.createForgetPasswordZodSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User forget password successfully',
      },
      400: {
        description: 'Validation failed or invalid input',
      },
    },
  });

  // verify email
  registry.registerPath({
    method: 'post',
    path: '/auth/verify-email',
    tags: ['Auth'],
    summary: 'User verify email',
    request: {
      body: {
        content: {
          'application/json': {
            schema: AuthValidation.createVerifyEmailZodSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User verify email successfully',
      },
      400: {
        description: 'Validation failed or invalid input',
      },
    },
  });

  // reset password
  registry.registerPath({
    method: 'post',
    path: '/auth/reset-password',
    tags: ['Auth'],
    summary: 'User reset password',
    request: {
      headers: z.object({
        authorization: z
          .string({ required_error: 'Reset token is required' })
          .openapi({
            description:
              'Raw cryptographic reset token (e.g., generated hash/hex token)',
            example: '4a8f9c1b7e2d3a4f5c6b8a9e0f1d2c3b4a5e6f7a',
          }),
      }),
      body: {
        content: {
          'application/json': {
            schema: AuthValidation.createResetPasswordZodSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User reset password successfully',
      },
      400: {
        description: 'Validation failed or invalid input',
      },
    },
  });

  // change password
  registry.registerPath({
    method: 'post',
    path: '/auth/change-password',
    tags: ['Auth'],
    summary: 'User change password',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AuthValidation.createChangePasswordZodSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User change password successfully',
      },
      400: {
        description: 'Validation failed or invalid input',
      },
    },
  });

  // refresh token
  registry.registerPath({
    method: 'post',
    path: '/auth/refresh-token',
    tags: ['Auth'],
    summary: 'User refresh token',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AuthValidation.refreshTokenZodSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User refresh token successfully',
      },
      400: {
        description: 'Validation failed or invalid input',
      },
    },
  });
}
