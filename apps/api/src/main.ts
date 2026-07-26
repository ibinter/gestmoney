import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import compression from "compression";
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

  // Compression HTTP (gzip/br) — réduit la taille des réponses JSON de ~70 %
  // Placé avant helmet pour couvrir toutes les réponses
  app.use(compression({
    filter: (req: any, res: any) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6, // compromis vitesse / taux de compression
  }));

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

  // Swagger / OpenAPI — disponible en dev et en staging (pas en prod)
  if (configService.get("NODE_ENV") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("GESTMONEY API")
      .setDescription(`
API REST de GESTMONEY — Plateforme SaaS de gestion des réseaux Mobile Money.

**Authentification** : Bearer JWT — obtenez un token via \`POST /api/v1/auth/login\`,
puis cliquez sur le bouton **Authorize** en haut à droite et collez-le.

**Multi-tenant** : le \`tenantId\` est embarqué dans le JWT.
Le header optionnel \`X-Tenant-ID\` doit correspondre au tenant du JWT.

**Éditeur** : IBIG Soft — gestmoney@ibigsoft.com
      `)
      .setVersion("1.0.0")
      .setContact("IBIG Soft", "https://gestmoney.ibigsoft.com", "gestmoney@ibigsoft.com")
      .addBearerAuth(
        { type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" },
        "JWT-auth"
      )
      // Même clé utilisée dans certains controllers legacy
      .addBearerAuth(
        { type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" },
        "access-token"
      )
      .addTag("Auth", "Authentification et gestion des sessions")
      .addTag("Transactions", "Enregistrement et gestion des transactions Mobile Money")
      .addTag("Float", "Gestion des flottes d'agents")
      .addTag("Caisse", "Opérations de caisse (cashier)")
      .addTag("Commissions", "Plans et calculs de commission")
      .addTag("Comptabilité SYSCOHADA", "Comptabilité OHADA — journaux, bilan, résultat")
      .addTag("Stock", "Gestion des stocks (SIM, terminaux, accessoires)")
      .addTag("Customers", "KYC et gestion des clients")
      .addTag("Agents", "Gestion des agents Mobile Money")
      .addTag("Agencies", "Gestion des agences")
      .addTag("Licences", "Abonnements et licences")
      .addTag("Support", "Tickets de support")
      .addTag("Notifications", "Notifications email et in-app")
      .addTag("Import", "Import XLSX/CSV")
      .addTag("Analytics", "Statistiques et rapports")
      .addTag("Public", "Endpoints publics (sans authentification)")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "none",        // sections fermées par défaut
        filter: true,                // barre de recherche
        showRequestDuration: true,   // durée des requêtes de test
        tryItOutEnabled: false,      // désactive "Try it out" par défaut
      },
      customSiteTitle: "GESTMONEY API Docs",
    });
  }

  await app.listen(port);
  console.log(`GESTMONEY API is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
