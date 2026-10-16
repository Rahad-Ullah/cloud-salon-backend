import { describe, expect, it, vi } from 'vitest';
import { registerApiRoute } from './openapi-helper';
import { registry } from '../docs/openapi';

describe('openapi-helper', () => {
  it('should transform Express route params to OpenAPI braces and register path', () => {
    const registerSpy = vi.spyOn(registry, 'registerPath');

    registerApiRoute({
      method: 'get',
      path: '/api/v1/salons/:id/chairs/:chairId',
      summary: 'Get Chair Details',
      isAuth: true,
      roles: ['admin', 'super_admin'],
    });

    expect(registerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'get',
        path: '/api/v1/salons/{id}/chairs/{chairId}',
        summary: 'Get Chair Details',
        security: [{ bearerAuth: [] }],
      }),
    );
  });
});
