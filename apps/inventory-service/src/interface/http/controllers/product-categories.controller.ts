import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ProductCategoryManagementUseCase } from "../../../application/use-cases/product-category-management.use-case";
import { idParamSchema } from "../dto/common/id-param.dto";
import type { IdParamDto } from "../dto/common/id-param.dto";
import { categoryTreeQuerySchema, createCategorySchema, updateCategorySchema } from "../dto/categories/category.dto";
import type { CategoryTreeQueryDto, CreateCategoryDto, UpdateCategoryDto } from "../dto/categories/category.dto";
import { unwrapDomainResult } from "../domain-error.mapper";
import { ZodValidationPipe } from "../zod-validation.pipe";

@Controller("product-categories")
export class ProductCategoriesController {
  constructor(private readonly useCase: ProductCategoryManagementUseCase) {}

  @Post() @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(createCategorySchema)) body: CreateCategoryDto) {
    return unwrapDomainResult(await this.useCase.create(body.companyId, body.name, body.parentId ?? null));
  }
  @Patch(":id")
  async update(@Param("id", new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateCategorySchema)) body: UpdateCategoryDto) {
    unwrapDomainResult(await this.useCase.update(id, body.name, body.parentId ?? null));
  }
  @Delete(":id") @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id", new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    unwrapDomainResult(await this.useCase.delete(id));
  }
  @Get("tree")
  async tree(@Query(new ZodValidationPipe(categoryTreeQuerySchema)) query: CategoryTreeQueryDto) {
    return unwrapDomainResult(await this.useCase.tree(query.companyId));
  }
  @Get(":id")
  async get(@Param("id", new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return unwrapDomainResult(await this.useCase.get(id));
  }
}
