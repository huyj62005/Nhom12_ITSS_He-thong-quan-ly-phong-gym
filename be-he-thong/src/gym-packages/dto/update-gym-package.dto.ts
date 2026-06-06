import { PartialType } from '@nestjs/mapped-types';
import { CreateGymPackageDto } from './create-gym-package.dto';

export class UpdateGymPackageDto extends PartialType(CreateGymPackageDto) {}
