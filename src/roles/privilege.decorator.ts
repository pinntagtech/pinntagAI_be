import { SetMetadata } from '@nestjs/common';

export const PRIVILEGE_KEY = 'privilege';
export const Privilege = (resource: string, action: string) =>
  SetMetadata(PRIVILEGE_KEY, { resource, action });
