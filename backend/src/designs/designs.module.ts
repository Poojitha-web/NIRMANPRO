import { Module } from '@nestjs/common';
import { DesignsService } from './designs.service';
import { DesignsController } from './designs.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  providers: [DesignsService],
  controllers: [DesignsController],
  exports: [DesignsService],
})
export class DesignsModule {}
