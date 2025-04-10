import { Module } from '@nestjs/common';
import { ThirdPartyAdsController } from './third-party-ads.controller';
import { ThirdPartyAdsService } from './third-party-ads.service';

@Module({
  controllers: [ThirdPartyAdsController],
  providers: [ThirdPartyAdsService]
})
export class ThirdPartyAdsModule {}
