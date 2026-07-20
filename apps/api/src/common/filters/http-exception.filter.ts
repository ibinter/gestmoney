import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let errors: any = null;
    /** Identifiant renvoyé au client et écrit dans les logs : permet de
     *  retrouver l'erreur exacte sans rien divulguer côté client. */
    let reference: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || message;
        errors = Array.isArray(resp.message) ? resp.message : null;
        if (Array.isArray(resp.message)) {
          message = 'Erreur de validation';
        }
      }
    } else if (exception instanceof Error) {
      // Erreur non prévue (Prisma, TypeError…). Son `message` ne doit JAMAIS
      // partir au client : Prisma y détaille la requête complète, avec les
      // noms de modèles, les champs et les valeurs — dont le tenantId et des
      // identifiants d'utilisateurs. On journalise tout côté serveur et on ne
      // renvoie qu'un message générique accompagné d'une référence.
      reference = randomUUID();
      this.logger.error(
        `Erreur non gérée [${reference}] ${request.method} ${request.url} : ${exception.message}`,
        exception.stack,
      );
      message = 'Erreur interne du serveur';
    }

    // Les HttpException portent des messages écrits pour l'utilisateur : on
    // peut les journaliser tels quels. Les autres ont déjà été tracées plus
    // haut avec leur référence.
    if (!reference) {
      this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      ...(reference ? { reference } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
