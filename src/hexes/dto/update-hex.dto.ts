import { PartialType } from '@nestjs/mapped-types';
import { CreateHexDto } from './create-hex.dto';

export class UpdateHexDto extends PartialType(CreateHexDto) {
  iso3?: string;
  strength?: number;
}
