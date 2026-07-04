import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export const KAFKA_PRODUCER = 'KAFKA_PRODUCER';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(
    @Inject(KAFKA_PRODUCER) private readonly client: ClientKafka
  ) {}

  async onModuleInit() {
    await this.client.connect();
    this.logger.log('Kafka producer bağlandı');
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  async emit<T extends object>(topic: string, payload: T): Promise<void> {
    await firstValueFrom(this.client.emit(topic, payload));
    this.logger.debug(`Event yayınlandı: ${topic}`);
  }
}
