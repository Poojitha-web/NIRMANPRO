import { Module } from '@nestjs/common';
import { FloorsService } from './floors.service';
import { FloorsController } from './floors.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  providers: [FloorsService],
  controllers: [FloorsController],
  exports: [FloorsService],
})
export class FloorsModule {}
