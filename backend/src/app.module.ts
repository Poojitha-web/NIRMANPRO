import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { FloorsModule } from './floors/floors.module';
import { DesignsModule } from './designs/designs.module';
import { CalculationsModule } from './calculations/calculations.module';
import { BoqModule } from './boq/boq.module';
import { CostsModule } from './costs/costs.module';
import { MaterialsModule } from './materials/materials.module';
import { RatesModule } from './rates/rates.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    FloorsModule,
    DesignsModule,
    CalculationsModule,
    BoqModule,
    CostsModule,
    MaterialsModule,
    RatesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
