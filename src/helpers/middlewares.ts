import { Response } from 'express';
import { json } from 'body-parser';
import { RequestWithRawBody } from './interfaces';

export function RawBodyMiddleware() {
  return json({
    verify: (request: RequestWithRawBody, _: Response, buffer: Buffer) => {
      if (request.url.includes('webhook') && Buffer.isBuffer(buffer)) {
        request.rawBody = Buffer.from(buffer);
      }
      return true;
    },
  });
}
