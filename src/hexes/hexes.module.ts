import { Module } from '@nestjs/common';
import { HexesService } from './hexes.service';
import { HexesController } from './hexes.controller';

@Module({
  controllers: [HexesController],
  providers: [HexesService]
})
export class HexesModule {}
