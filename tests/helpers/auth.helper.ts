import { Secret } from 'jsonwebtoken';
import config from '../../src/config';
import { jwtHelper } from '../../src/helpers/jwtHelper';
import { UserRole } from '../../src/app/modules/user/user.constant';

export const createTestToken = (
  role: UserRole = UserRole.Customer,
  userId: string = '665f1234567890abcdef1234',
  email: string = 'customer@cloudsalon.com'
): string => {
  return jwtHelper.createToken(
    { id: userId, role, email },
    (config.jwt.jwt_secret ||
      process.env.JWT_SECRET ||
      'test_jwt_secret_key_12345') as Secret,
    config.jwt.jwt_expire_in || process.env.JWT_EXPIRE_IN || '1h'
  );
};
