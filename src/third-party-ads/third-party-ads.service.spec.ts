import { Test, TestingModule } from '@nestjs/testing';
import { ThirdPartyAdsService } from './third-party-ads.service';

describe('ThirdPartyAdsService', () => {
  let service: ThirdPartyAdsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThirdPartyAdsService],
    }).compile();

    service = module.get<ThirdPartyAdsService>(ThirdPartyAdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
