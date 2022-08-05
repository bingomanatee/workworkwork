import { Injectable } from '@nestjs/common';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CountriesService {
  constructor(private prismaService: PrismaService) {}
  create(createCountryDto: CreateCountryDto) {
    return 'This action adds a new country';
  }

  async findAll() {
    return this.prismaService.prisma.countries.findMany({
      include: {
        shapes: true,
      },
    });
  }

  findOne(iso3: string) {
    return this.prismaService.prisma.countries.findUnique({
      where: {
        iso3,
      },
      include: {
        shapes: true,
      },
    });
  }

  update(id: string, updateCountryDto: UpdateCountryDto) {
    return `This action updates a #${id} country`;
  }

  remove(id: string) {
    return `This action removes a #${id} country`;
  }
}
