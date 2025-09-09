import { PartialType } from '@nestjs/swagger';
import { CreateEtlDto } from './create-etl.dto';

export class UpdateEtlDto extends PartialType(CreateEtlDto) {}
