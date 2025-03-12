import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  sender_id: number;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;
}

export class FetchMessageDto {
  id: number;
  sender_id?: number;
  content: string;
  created_at: Date;
  is_admin?: boolean;
  admin_id?: number;
}
