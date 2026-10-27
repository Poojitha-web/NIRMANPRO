import { Module, forwardRef } from '@nestjs/common';
import { CalculationsService } from './calculations.service';
import { CalculationsController } from './calculations.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [forwardRef(() => ProjectsModule)],
  providers: [CalculationsService],
  controllers: [CalculationsController],
  exports: [CalculationsService],
})
export class CalculationsModule {}
