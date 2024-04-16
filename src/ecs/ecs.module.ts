import { Module } from '@nestjs/common';
import { EcsService } from './ecs.service';

@Module({
  providers: [EcsService],
})
export class EcsModule {}
