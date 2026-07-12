import { Test } from '@nestjs/testing';
import { InventoryModule } from './inventory.module';

describe('InventoryModule', () => {
  it('resolves the complete dependency graph', async () => {
    const module = await Test.createTestingModule({
      imports: [InventoryModule],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });
});
