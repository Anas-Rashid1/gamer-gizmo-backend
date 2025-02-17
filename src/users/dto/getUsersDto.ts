import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class getAllUsersDto {
  @IsString()
  @IsOptional()
  pageNo: any;
}
