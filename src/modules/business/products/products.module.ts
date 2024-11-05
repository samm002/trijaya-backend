import { Module } from '@nestjs/common';

import { ProductsController } from '@modules/business/products/products.controller';
import { ProductsService } from '@modules/business/products/products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
