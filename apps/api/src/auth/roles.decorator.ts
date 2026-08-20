import { SetMetadata } from '@nestjs/common';

export const ROLE_KEY = 'afghan-it:roles';
export const Roles = (...roles: Array<'teacher' | 'admin' | 'super_admin'>) => SetMetadata(ROLE_KEY, roles);
