export class CreateFeedbackDto {
  memberId!: number;

  title?: string;
  content!: string;
  category?: string;
  priority?: string;
  status?: string;
  adminReply?: string;
  resolvedAt?: Date;
}
