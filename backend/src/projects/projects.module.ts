import { Module, forwardRef } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { CalculationsModule } from '../calculations/calculations.module';
import { MaterialsModule } from '../materials/materials.module';
import { CostsModule } from '../costs/costs.module';
import { BoqModule } from '../boq/boq.module';

@Module({
  imports: [forwardRef(() => CalculationsModule), MaterialsModule, CostsModule, BoqModule],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
