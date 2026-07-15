import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseInterceptors } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ZodBody, ZodQueries } from "../openapi/zod-openapi";
import { ZodValidationPipe, idParamSchema } from "@is-kontrol/shared-validation";
import type { IdParamDto } from "@is-kontrol/shared-validation";
import { CreateProductCategoryCommand } from "../../../application/commands/product-categories/create-product-category/create-product-category.command";
import { CreateProductCategoryHandler } from "../../../application/commands/product-categories/create-product-category/create-product-category.handler";
import { UpdateProductCategoryCommand } from "../../../application/commands/product-categories/update-product-category/update-product-category.command";
import { UpdateProductCategoryHandler } from "../../../application/commands/product-categories/update-product-category/update-product-category.handler";
import { DeleteProductCategoryCommand } from "../../../application/commands/product-categories/delete-product-category/delete-product-category.command";
import { DeleteProductCategoryHandler } from "../../../application/commands/product-categories/delete-product-category/delete-product-category.handler";
import { GetProductCategoryQuery } from "../../../application/queries/product-categories/get-product-category/get-product-category.query";
import { GetProductCategoryHandler } from "../../../application/queries/product-categories/get-product-category/get-product-category.handler";
import { GetCategoryTreeQuery } from "../../../application/queries/product-categories/get-category-tree/get-category-tree.query";
import { GetCategoryTreeHandler } from "../../../application/queries/product-categories/get-category-tree/get-category-tree.handler";
import { categoryTreeQuerySchema, createCategorySchema, updateCategorySchema } from "../dto/categories/category.dto";
import type { CategoryTreeQueryDto, CreateCategoryDto, UpdateCategoryDto } from "../dto/categories/category.dto";
import { InventoryDomainResultInterceptor } from "../domain-result.interceptor";

@ApiTags("product-categories")
@Controller("product-categories")
@UseInterceptors(InventoryDomainResultInterceptor)
export class ProductCategoriesController {
  constructor(
    private readonly createCategory: CreateProductCategoryHandler,
    private readonly updateCategory: UpdateProductCategoryHandler,
    private readonly deleteCategory: DeleteProductCategoryHandler,
    private readonly getCategory: GetProductCategoryHandler,
    private readonly getCategoryTree: GetCategoryTreeHandler,
  ) {}

  @ZodBody(createCategorySchema)
  @Post() @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(createCategorySchema)) body: CreateCategoryDto) {
    return this.createCategory.execute(
      new CreateProductCategoryCommand(body.companyId, body.name, body.parentId ?? null));
  }
  @ZodBody(updateCategorySchema)
  @Patch(":id")
  async update(@Param("id", new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateCategorySchema)) body: UpdateCategoryDto) {
    return this.updateCategory.execute(
      new UpdateProductCategoryCommand(id, body.name, body.parentId ?? null));
  }
  @Delete(":id") @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id", new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deleteCategory.execute(new DeleteProductCategoryCommand(id));
  }
  @ZodQueries(categoryTreeQuerySchema)
  @Get("tree")
  async tree(@Query(new ZodValidationPipe(categoryTreeQuerySchema)) query: CategoryTreeQueryDto) {
    return this.getCategoryTree.execute(new GetCategoryTreeQuery(query.companyId));
  }
  @Get(":id")
  async get(@Param("id", new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.getCategory.execute(new GetProductCategoryQuery(id));
  }
}
