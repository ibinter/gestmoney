import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
    // Indispensable aux webhooks de paiement : la signature HMAC se calcule
    // sur les OCTETS BRUTS reçus. Re-sérialiser le corps déjà analysé donne
    // un JSON différent (ordre des clés, espaces) et la vérification échoue
    // toujours — les paiements par passerelle ne s'activeraient jamais.
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("API_PORT", 3001);
  const corsOrigins = configService.get<string>("CORS_ORIGINS", "http://localhost:3000");

  // Derriere le reverse-proxy nginx : faire confiance au premier hop pour que
  // `req.ip` reflete la VRAIE IP client (X-Forwarded-For) et non celle du proxy.
  // Indispensable pour que le rate-limiting (ThrottlerGuard) porte par client
  // et non globalement sur l'IP du proxy (ce qui bloquerait tout le monde).
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  // Securite
  app.use(helmet());

  // En-tetes de securite HTTP explicites (sans dependance supplementaire).
  // Places tot, avant `listen`, pour couvrir toutes les reponses de l'API.
  // Valeurs volontairement strictes pour une API JSON : elle n'est jamais
  // affichee dans une iframe (X-Frame-Options: DENY) et ne doit divulguer
  // aucun referrer (Referrer-Policy: no-referrer).
  app.use((_req: any, res: any, next: any) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-DNS-Prefetch-Control", "off");
    next();
  });

  // Cookie parser (pour les tokens JWT en cookie httpOnly)
  app.use(cookieParser());

  // CORS — en dev, autoriser toutes les origines localhost
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        const allowed = corsOrigins.split(",").map((o) => o.trim());
        callback(allowed.includes(origin) ? null : new Error("Not allowed"), allowed.includes(origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"],
  });

  // Prefix global
  app.setGlobalPrefix("api/v1");

  // Versioning
  app.enableVersioning({ type: VersioningType.URI });

  // Filtre d'exceptions global
  app.useGlobalFilters(new HttpExceptionFilter());

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger / OpenAPI
  if (configService.get("NODE_ENV") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("GESTMONEY API")
      .setDescription("API REST de la plateforme GESTMONEY - Gestion Mobile Money")
      .setVersion("1.0")
      .addBearerAuth(
        { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        "JWT-auth"
      )
      .addTag("auth", "Authentification")
      .addTag("transactions", "Transactions Mobile Money")
      .addTag("agents", "Gestion des agents")
      .addTag("agencies", "Gestion des agences")
      .addTag("float", "Gestion du float")
      .addTag("commissions", "Commissions")
      .addTag("customers", "Clients")
      .addTag("reports", "Rapports et analytiques")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`GESTMONEY API is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
