import { IsDateString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty({ message: 'startDate is required' })
  @IsDateString({}, { message: 'startDate must be a valid date string' })
  startDate!: string;

  @IsNotEmpty({ message: 'endDate is required' })
  @IsDateString({}, { message: 'endDate must be a valid date string' })
  endDate!: string;

  @IsOptional()
  @IsEnum(['BLOCKED', 'RESERVATION'], { message: 'type must be either BLOCKED or RESERVATION' })
  type?: 'BLOCKED' | 'RESERVATION';
}
