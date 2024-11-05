import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Public } from '@common/decorators';
import { JwtGuard } from '@common/guards';
import { successResponsePayload } from '@common/utils';
import {
  CreateProductDto,
  GetProductDto,
  UpdateProductDto,
} from '@modules/business/products/dtos';
import { ProductsService } from '@modules/business/products/products.service';

@UseGuards(JwtGuard)
@Controller('products')
export class ProductsController {
  constructor(private productService: ProductsService) {}

  @Public()
  @Get()
  async getAllProduct(@Query() query: GetProductDto) {
    const { total, data, newest } =
      await this.productService.getAllProduct(query);

    return successResponsePayload('Get all product', data, total, newest);
  }

  @Public()
  @Get(':productSlug')
  async getProductBySlug(@Param('productSlug') productSlug: string) {
    const product = await this.productService.getProductBySlug(productSlug);

    return successResponsePayload(
      `Get product by slug ${productSlug}`,
      product,
    );
  }

  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    const product = await this.productService.createProduct(dto);

    return successResponsePayload('Create product', product);
  }

  @Patch(':productSlug')
  async updateProductBySlug(
    @Param('productSlug') productSlug: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productService.updateProductBySlug(
      productSlug,
      dto,
    );

    return successResponsePayload(
      `Update product by slug ${productSlug}`,
      product,
    );
  }

  @Delete(':productSlug')
  async deleteProductBySlug(@Param('productSlug') productSlug: string) {
    const product = await this.productService.deleteProductBySlug(productSlug);

    return successResponsePayload(
      `Delete product by slug ${productSlug}`,
      product,
    );
  }
}
