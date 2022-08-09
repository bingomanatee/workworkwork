import { Module } from '@nestjs/common';
import { HexesService } from './hexes.service';
import { HexesController } from './hexes.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [HexesController],
  providers: [HexesService, PrismaService],
})
export class HexesModule {}
