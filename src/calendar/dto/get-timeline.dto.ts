import { IsDateString, IsNotEmpty } from 'class-validator';
export class GetTimelineDto {
  @IsNotEmpty() @IsDateString() startDate!: string;
  @IsNotEmpty() @IsDateString() endDate!: string;
}
