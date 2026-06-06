import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GymPackagesService } from './gym-packages.service';
import { CreateGymPackageDto } from './dto/create-gym-package.dto';
import { UpdateGymPackageDto } from './dto/update-gym-package.dto';

@Controller('gym-packages')
export class GymPackagesController {
  constructor(private readonly gymPackagesService: GymPackagesService) {}

  @Post()
  create(@Body() createGymPackageDto: CreateGymPackageDto) {
    return this.gymPackagesService.create(createGymPackageDto);
  }

  @Get()
  findAll() {
    return this.gymPackagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gymPackagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGymPackageDto: UpdateGymPackageDto) {
    return this.gymPackagesService.update(+id, updateGymPackageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gymPackagesService.remove(+id);
  }
}
