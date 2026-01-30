import { IsDateString, IsOptional, IsEnum, IsNotEmpty, IsInt, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsNotEmpty({ message: 'startDate is required' })
  @IsDateString({}, { message: 'startDate must be a valid date string' })
  startDate!: string;

  @IsNotEmpty({ message: 'endDate is required' })
  @IsDateString({}, { message: 'endDate must be a valid date string' })
  endDate!: string;

  @IsOptional()
  @IsEnum(['BLOCKED', 'RESERVATION', 'MAINTENANCE'], { message: 'type must be valid' })
  type?: 'BLOCKED' | 'RESERVATION' | 'MAINTENANCE';

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  guestCount?: number;

  @IsOptional()
  @IsArray()
  guestsDetail?: any[];
}
