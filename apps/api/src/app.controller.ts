import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { SansLicence } from "./common/decorators/sans-licence.decorator";

@ApiTags("health")
// Sonde de santé : elle doit répondre même si aucune licence n'est valide,
// sinon un load balancer conclurait à une panne applicative.
@SansLicence()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  @ApiOperation({ summary: "Verifier la sante de l API" })
  getHealth() {
    return this.appService.getHealth();
  }
}
