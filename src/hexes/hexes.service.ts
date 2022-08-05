import { Injectable } from '@nestjs/common';
import { CreateHexDto } from './dto/create-hex.dto';
import { UpdateHexDto } from './dto/update-hex.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HexesService {
  constructor(private prismaService: PrismaService) {}

  create(createHexDto: CreateHexDto) {
    return 'This action adds a new hex';
  }

  findAll(level) {
    return this.prismaService.prisma.hexes.findMany({
      where: {
        level,
      },
    });
  }

  findOne(hindex: string) {
    return `This action returns a #${hindex} hex`;
  }

  async update(hindex: string, updateHexDto: UpdateHexDto) {
    if (updateHexDto.iso3 && 'strength' in updateHexDto) {
      await this.prismaService.prisma.country_hex_share.deleteMany({
        where: {
          country_iso3: updateHexDto.iso3,
          hindex,
        },
      });
      return this.prismaService.prisma.country_hex_share.create({
        data: {
          country_iso3: updateHexDto.iso3,
          strength: updateHexDto.strength,
          hindex,
        },
      });
    }
    return {};
  }

  remove(hindex: string) {
    return `This action removes a #${hindex} hex`;
  }
}
