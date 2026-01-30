import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { GetTimelineDto } from './dto/get-timeline.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @UseGuards(JwtAuthGuard)
  @Get('timeline')
  async getTimeline(@Query() query: GetTimelineDto, @Request() req: any) {
    const userId = req.user.userId || req.user.id;
    console.log(`📅 API Calendar Timeline hit for user ${userId}:`, query);
    try {
      const result = await this.calendarService.getTimeline(query.startDate, query.endDate, userId);
      console.log('✅ Calendar data fetched, count:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error in CalendarController:', error);
      throw error;
    }
  }
}
