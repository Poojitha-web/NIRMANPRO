import { Module, forwardRef } from '@nestjs/common';
import { CostsService } from './costs.service';
import { CostsController } from './costs.controller';
import { ProjectsModule } from '../projects/projects.module';
import { BoqModule } from '../boq/boq.module';

@Module({
  imports: [forwardRef(() => ProjectsModule), forwardRef(() => BoqModule)],
  providers: [CostsService],
  controllers: [CostsController],
  exports: [CostsService],
})
export class CostsModule {}
