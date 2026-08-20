import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'afghan-it:is-public';
export const Public = () => SetMetadata(IS_PUBLIC, true);
