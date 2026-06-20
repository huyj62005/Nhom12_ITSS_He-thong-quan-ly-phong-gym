import { PartialType } from '@nestjs/mapped-types';
import { CreateGymRoomDto } from './create-gym-room.dto';

export class UpdateGymRoomDto extends PartialType(CreateGymRoomDto) {}
