import { Injectable } from '@nestjs/common';
import type { CreateProductDto, ProductResponseDto } from '@is-kontrol/inventory-contracts';
import { ProductEntity } from '../domain/entities/product.entity';
import { InventoryEventPublisher } from '../infrastructure/inventory-event.publisher';

@Injectable()
export class CreateProductUseCase {
  constructor(private readonly events: InventoryEventPublisher) {}

  async execute(dto: CreateProductDto): Promise<ProductResponseDto> {
    const now = new Date();
    const product = new ProductEntity(
      crypto.randomUUID(),
      dto.name,
      dto.sku,
      dto.barcode ?? null,
      dto.categoryId,
      dto.unit as ProductEntity['unit'],
      true,
      now,
      now
    );

    await this.events.productCreated({
      id: product.id,
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      unit: product.unit,
    });

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      unit: product.unit,
      stock: 0,
    };
  }
}
