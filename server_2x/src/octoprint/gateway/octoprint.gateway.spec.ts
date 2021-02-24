import { Test, TestingModule } from '@nestjs/testing';
import { OctoprintGateway } from './octoprint.gateway';
import { OctoPrintClientService } from '../services/octoprint-client.service';

describe('OctoprintGateway', () => {
  let gateway: OctoprintGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OctoprintGateway, OctoPrintClientService],
    }).compile();

    gateway = module.get<OctoprintGateway>(OctoprintGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
