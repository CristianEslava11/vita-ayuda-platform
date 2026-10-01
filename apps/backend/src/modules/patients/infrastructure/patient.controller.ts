import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../auth/infrastructure/jwt-auth.guard';
import { GetMyPatientUseCase } from '../application/get-my-patient.use-case';
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientController {
  constructor(private readonly getPatient: GetMyPatientUseCase) {}
  @Get('me')
  async me(@Req() request: AuthenticatedRequest) { return { data: await this.getPatient.execute(request.user.id) }; }
}
