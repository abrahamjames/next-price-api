import { ProductEntity } from './entity/product.entity';
import { ProductsService } from './products.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  SetMetadata,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ValidationPipe } from './../../core/shared/pipes/validation.pipe.pipe';
import { Request, Response } from 'express';

import { JwtAuthGuard } from '../auth/guard/jwt.auth.guard';
import * as Joi from 'joi';
import { RolesGuard } from '../auth/guard/role.guard';
import { ProductDTO } from './dto/product';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdateProductDTO } from './dto/update_product_dto';
import { Role } from 'src/core/models/enums/Role';
import { Permission } from 'src/core/models/enums/Permission';

const productSchema = Joi.object({
  title: Joi.string().required(),
  address: Joi.string().required(),
  price: Joi.number().required(),
  uom: Joi.string().required(),
  company: Joi.string().required(),
  description: Joi.string(),
});

@ApiBearerAuth()
@Controller('api/v1/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productService: ProductsService) {}

  @Get('/')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', [Role.SUPER_ADMIN, Role.ADMIN, Role.USER])
  async getProducts(
    @Req() request: Request,
    @Query(
      'page',
      // new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    page: number,
    @Query(
      'size',
      // new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    size: number,

    @Query(
      'start_date',
      // new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    startDate: Date,

    @Query(
      'end_date',
      // new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    endDate: Date,
    @Query(
      'search',
      // new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    search: string,
  ) {
    const { roles, permission }: any = request.user;
    if (roles === Role.SUPER_ADMIN && permission === Permission.WRITE_ALL) {
      return await this.productService.adminGetProducts(
        page ?? 0,
        size ?? 20,
        startDate,
        endDate,
        search,
      );
    }
    return await this.productService.getProducts(
      page ?? 0,
      size ?? 20,
      startDate,
      endDate,
      search,
    );
  }

  @Get('/:productId')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', [Role.SUPER_ADMIN, Role.ADMIN, Role.USER])
  async getProduct(
    @Req() req: Request,
    @Res() res: Response,
    @Param() params: { productId: number },
  ) {
    console.log(req.user);
    this.productService
      .getProduct(params.productId)
      .then((response) =>
        res.status(HttpStatus.OK).json({ metaData: { ...response } }),
      )
      .catch((error) =>
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error }),
      );
  }

  @Post('/')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', [Role.SUPER_ADMIN, Role.ADMIN])
  @UsePipes(new ValidationPipe(productSchema))
  async createProduct(
    @Req() request: Request,
    @Res() response: Response,
    @Body() product: ProductDTO,
  ): Promise<any> {
    this.productService
      .addProduct(product)
      .then((res: ProductEntity) => {
        return response.status(HttpStatus.CREATED).json({
          success: true,
          message: 'Product was successfully created',
          metaData: res,
        });
      })
      .catch((err) => {
        return response
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: err, success: false });
      });
  }

  @Put('/:productId')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', [Role.SUPER_ADMIN, Role.ADMIN])
  // @UsePipes(new ValidationPipe(productSchema))
  async updateProduct(
    @Req() request: Request,
    @Res() response: Response,
    @Param('productId') productId: number,
    @Body() product: UpdateProductDTO,
  ): Promise<any> {
    this.productService
      .updateProduct(productId, product)
      .then((res) => {
        return response.status(HttpStatus.OK).json({
          metaData: {
            success: true,
            message: 'Product successfully updated',
          },
        });
      })
      .catch((err) => {
        return response
          .status(HttpStatus.NOT_FOUND)
          .json({ error: err, success: false });
      });
  }

  @Delete('/:productId')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', [Role.SUPER_ADMIN])
  // @UsePipes(new ValidationPipe(productSchema))
  async deleteProduct(
    @Req() request: Request,
    @Res() response: Response,
    @Param('productId') productId: number,
  ): Promise<any> {
    this.productService
      .deleteProduct(productId)
      .then((res) =>
        response
          .status(HttpStatus.OK)
          .json({ message: 'Product successfully deleted' }),
      )
      .catch((err) => {
        return response.status(HttpStatus.NOT_FOUND).send(err);
      });
  }

  @Put('/approve/:productId')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', [Role.SUPER_ADMIN])
  async approveProduct(
    @Req() request: Request,
    @Res() response: Response,
    @Param('productId') productId: number,
  ) {
    this.productService
      .approveProduct(productId)
      .then((res) =>
        response
          .status(HttpStatus.OK)
          .json({ message: 'Product successfully approved' }),
      )
      .catch((err) => {
        return response.status(HttpStatus.NOT_FOUND).send(err);
      });
  }
}
