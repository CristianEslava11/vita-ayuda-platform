import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../auth/infrastructure/jwt-auth.guard';
import { SaveDailyMonitoringDto } from '../application/vital-sign.dto';
import { VitalSignUseCases } from '../application/vital-sign.use-cases';
@Controller('vital-signs')
@UseGuards(JwtAuthGuard)
export class VitalSignController {
  constructor(private readonly vitals: VitalSignUseCases) {}
  @Get('types')
  async types() { return { data: await this.vitals.listTypes() }; }
  @Get('daily-monitoring/settings')
  settings() { return { data: this.vitals.settings() }; }
  @Post('daily-monitoring/entries/:patientId')
  async createEntry(@Req() req: AuthenticatedRequest, @Param('patientId', ParseUUIDPipe) patientId: string, @Body() dto: SaveDailyMonitoringDto) {
    return { message: 'Nuevo registro guardado.', data: await this.vitals.createDemoEntry(req.user.id, patientId, dto) };
  }
  @Get('patient/:patientId')
  async list(@Req() req: AuthenticatedRequest, @Param('patientId', ParseUUIDPipe) patientId: string, @Query('limit') limit?: string) {
    return { data: await this.vitals.list(req.user.id, patientId, limit) };
  }
  @Get('daily-monitoring/today/:patientId')
  async today(@Req() req: AuthenticatedRequest, @Param('patientId', ParseUUIDPipe) patientId: string) {
    return { data: await this.vitals.today(req.user.id, patientId) };
  }
  @Put('daily-monitoring/today/:patientId')
  async save(@Req() req: AuthenticatedRequest, @Param('patientId', ParseUUIDPipe) patientId: string, @Body() dto: SaveDailyMonitoringDto) {
    return { message: 'Monitoreo diario guardado.', data: await this.vitals.saveToday(req.user.id, patientId, dto) };
  }
}
