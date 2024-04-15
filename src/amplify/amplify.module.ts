import { Module } from '@nestjs/common';
import { AmplifyService } from './amplify.service';

@Module({
  providers: [AmplifyService],
  exports: [AmplifyService],
})
export class AmplifyModule {}
