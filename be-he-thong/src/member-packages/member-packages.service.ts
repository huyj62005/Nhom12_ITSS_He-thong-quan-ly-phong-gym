import { Injectable } from '@nestjs/common';
import { CreateMemberPackageDto } from './dto/create-member-package.dto';
import { UpdateMemberPackageDto } from './dto/update-member-package.dto';

@Injectable()
export class MemberPackagesService {
  create(createMemberPackageDto: CreateMemberPackageDto) {
    return 'This action adds a new memberPackage';
  }

  findAll() {
    return `This action returns all memberPackages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} memberPackage`;
  }

  update(id: number, updateMemberPackageDto: UpdateMemberPackageDto) {
    return `This action updates a #${id} memberPackage`;
  }

  remove(id: number) {
    return `This action removes a #${id} memberPackage`;
  }
}
