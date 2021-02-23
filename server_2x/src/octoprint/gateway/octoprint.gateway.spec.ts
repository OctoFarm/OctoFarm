import { Test, TestingModule } from '@nestjs/testing';
import { OctoprintGateway } from './octoprint.gateway';
import { OctoprintService } from '../services/octoprint.service';

describe('OctoprintGateway', () => {
  let gateway: OctoprintGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OctoprintGateway, OctoprintService],
    }).compile();

    gateway = module.get<OctoprintGateway>(OctoprintGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
