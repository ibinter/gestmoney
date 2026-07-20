import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { LicencesModule } from './licences.module';
import { LicencesService } from './licences.service';
import { LicencesScheduler } from './licences.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

// PrismaModule est @Global : comme les autres modules métier, LicencesModule
// ne l'importe pas explicitement. On le charge donc ici pour reproduire le
// contexte réel de l'application.
it('le module licences se câble sans erreur de dépendances', async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      EventEmitterModule.forRoot(),
      ScheduleModule.forRoot(),
      PrismaModule,
      LicencesModule,
    ],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();

  expect(moduleRef.get(LicencesService)).toBeDefined();
  expect(moduleRef.get(LicencesScheduler)).toBeDefined();
  // Les durées par défaut sont bien chargées via ConfigService.
  expect(moduleRef.get(LicencesService).parametres.essaiJours).toBe(14);
  await moduleRef.close();
});
