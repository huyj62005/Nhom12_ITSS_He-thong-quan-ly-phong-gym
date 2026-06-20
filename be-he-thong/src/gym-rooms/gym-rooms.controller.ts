import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateGymRoomDto } from './dto/create-gym-room.dto';
import { UpdateGymRoomDto } from './dto/update-gym-room.dto';
import { GymRoomsService } from './gym-rooms.service';

@Controller('gym-rooms')
export class GymRoomsController {
  constructor(private readonly gymRoomsService: GymRoomsService) {}

  @Post()
  create(@Body() createGymRoomDto: CreateGymRoomDto) {
    return this.gymRoomsService.create(createGymRoomDto);
  }

  @Get()
  findAll() {
    return this.gymRoomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gymRoomsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGymRoomDto: UpdateGymRoomDto) {
    return this.gymRoomsService.update(+id, updateGymRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gymRoomsService.remove(+id);
  }
}
