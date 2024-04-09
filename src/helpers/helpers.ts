import { plainToInstance } from 'class-transformer';

export const ErrorMessages = {
  AUTH: {
    USER_INACTIVE: 'This user has been deactivated',
    CREDENTIALS_INCORRECT: 'Credentials incorrect',
    INVALID_TOKEN: 'Invalid token',
  },
  USER: {
    USER_NOT_FOUND: 'User not found',
    USER_INVALID: 'User invalid',
    USER_INACTIVE: 'Please activate this user first',
  },
};

export const APISummaries = {
  UNAUTH: 'No token required',
  USER: 'User permission required',
  ADMIN: 'Admin permission required',
};

export const sensitiveFields = [
  'isActivated',
  'isDeleted',
  'verifyAt',
  'createdAt',
  'updatedAt',
  'role',
];

export function genRandomString(length = 6): string {
  let random = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength: number = characters.length;
  let counter = 0;

  while (counter < length) {
    random += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return random;
}

export function PlainToInstance(model: any, response: any): any {
  return plainToInstance(model, response, {
    excludeExtraneousValues: true,
    enableImplicitConversion: true,
    strategy: 'excludeAll',
  });
}
