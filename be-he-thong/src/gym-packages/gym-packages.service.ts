import { Injectable } from '@nestjs/common';
import { CreateGymPackageDto } from './dto/create-gym-package.dto';
import { UpdateGymPackageDto } from './dto/update-gym-package.dto';

@Injectable()
export class GymPackagesService {
  create(createGymPackageDto: CreateGymPackageDto) {
    return 'This action adds a new gymPackage';
  }

  findAll() {
    return `This action returns all gymPackages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} gymPackage`;
  }

  update(id: number, updateGymPackageDto: UpdateGymPackageDto) {
    return `This action updates a #${id} gymPackage`;
  }

  remove(id: number) {
    return `This action removes a #${id} gymPackage`;
  }
}
