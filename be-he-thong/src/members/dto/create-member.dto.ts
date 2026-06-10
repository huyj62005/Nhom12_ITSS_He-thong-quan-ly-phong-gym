export class CreateMemberDto {
  userId!: number;

  managerId?: number;

  fullName!: string;

  phone?: string;

  dateOfBirth?: Date;

  memberType?: string;

  joinDate!: Date;

  status!: string;
}
