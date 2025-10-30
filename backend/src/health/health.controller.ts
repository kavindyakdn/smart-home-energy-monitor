import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Throttle({ short: { limit: 100, ttl: 1000 } }) // 100 requests per second for health checks
  getHealth() {
    return this.healthService.getHealth();
  }
}
