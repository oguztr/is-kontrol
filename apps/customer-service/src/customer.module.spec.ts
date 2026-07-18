import { Test } from '@nestjs/testing';
import { CustomerModule } from './customer.module';

describe('CustomerModule', () => {
  it('resolves the complete dependency graph', async () => {
    const module = await Test.createTestingModule({
      imports: [CustomerModule],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });
});
