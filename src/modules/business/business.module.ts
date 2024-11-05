import { Module } from '@nestjs/common';

import { ProductsModule } from '@modules/business/products/products.module';
import { ProjectsModule } from '@modules/business/projects/projects.module';
import { BusinessController } from '@modules/business/business.controller';
import { BusinessService } from '@modules/business/business.service';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService],
  imports: [ProductsModule, ProjectsModule],
})
export class BusinessModule {}
