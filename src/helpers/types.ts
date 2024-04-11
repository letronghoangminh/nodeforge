import { User } from '@prisma/client';

export type UserType = Pick<User, 'role' | 'id' | 'username' | 'email'>;
