import { Controller, Get } from '@nestjs/common';
import { isMultiTenantEnabled } from './feature-flags';

@Controller('config')
export class ConfigController {
  @Get('feature-flags')
  getFeatureFlags() {
    return {
      MULTI_TENANT_ENABLED: isMultiTenantEnabled(),
    };
  }
}
