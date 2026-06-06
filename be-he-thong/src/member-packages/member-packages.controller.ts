import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MemberPackagesService } from './member-packages.service';
import { CreateMemberPackageDto } from './dto/create-member-package.dto';
import { UpdateMemberPackageDto } from './dto/update-member-package.dto';

@Controller('member-packages')
export class MemberPackagesController {
  constructor(private readonly memberPackagesService: MemberPackagesService) {}

  @Post()
  create(@Body() createMemberPackageDto: CreateMemberPackageDto) {
    return this.memberPackagesService.create(createMemberPackageDto);
  }

  @Get()
  findAll() {
    return this.memberPackagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.memberPackagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMemberPackageDto: UpdateMemberPackageDto) {
    return this.memberPackagesService.update(+id, updateMemberPackageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.memberPackagesService.remove(+id);
  }
}
