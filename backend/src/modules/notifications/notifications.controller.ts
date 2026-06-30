import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Mes notifications' })
  findAll(
    @CurrentUser() user: { id: string },
    @Query() pagination: PaginationDto,
  ) {
    return this.notificationsService.findAll(user.id, pagination);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre de notifications non lues' })
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllRead(user.id);
  }
}
