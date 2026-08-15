import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('api/health')
@ApiTags('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
