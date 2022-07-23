import { PartialType } from '@nestjs/mapped-types';
import { CreateCovidCaseDto } from './create-covid-case.dto';

export class UpdateCovidCaseDto extends PartialType(CreateCovidCaseDto) {}
