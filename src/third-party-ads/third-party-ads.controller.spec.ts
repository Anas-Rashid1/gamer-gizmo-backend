import { Test, TestingModule } from '@nestjs/testing';
import { ThirdPartyAdsController } from './third-party-ads.controller';

describe('ThirdPartyAdsController', () => {
  let controller: ThirdPartyAdsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThirdPartyAdsController],
    }).compile();

    controller = module.get<ThirdPartyAdsController>(ThirdPartyAdsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
