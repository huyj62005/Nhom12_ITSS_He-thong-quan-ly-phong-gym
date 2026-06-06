import { PartialType } from '@nestjs/mapped-types';
import { CreateMemberPackageDto } from './create-member-package.dto';

export class UpdateMemberPackageDto extends PartialType(CreateMemberPackageDto) {}
