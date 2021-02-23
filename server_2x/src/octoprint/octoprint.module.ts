import { Module } from '@nestjs/common';
import { OctoprintService } from './services/octoprint.service';
import { OctoprintGateway } from './gateway/octoprint.gateway';

@Module({
  providers: [OctoprintGateway, OctoprintService]
})
export class OctoprintModule {}
