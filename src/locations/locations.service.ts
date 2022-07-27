import { Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PrismaService } from '../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class LocationsService {
  constructor(
    private prismaService: PrismaService,
    @InjectQueue('tasks') private taskQueue: Queue,
  ) {}

  create(createLocationDto: CreateLocationDto) {
    return 'This action adds a new location';
  }

  async findAll() {
    return this.prismaService.prisma.covid_location.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} location`;
  }

  update(id: number, updateLocationDto: UpdateLocationDto) {
    return `This action updates a #${id} location`;
  }

  remove(id: number) {
    return `This action removes a #${id} location`;
  }
}
