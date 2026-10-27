import { Module, forwardRef } from '@nestjs/common';
import { BoqService } from './boq.service';
import { BoqController } from './boq.controller';
import { ProjectsModule } from '../projects/projects.module';
import { CalculationsModule } from '../calculations/calculations.module';

@Module({
  imports: [forwardRef(() => ProjectsModule), forwardRef(() => CalculationsModule)],
  providers: [BoqService],
  controllers: [BoqController],
  exports: [BoqService],
})
export class BoqModule {}
