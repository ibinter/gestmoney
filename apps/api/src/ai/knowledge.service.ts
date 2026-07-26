import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_CONTEXTE_CHARS = 8000; // ~2000 tokens

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Recherche textuelle simple dans la base documentaire.
   * Cherche dans le titre, le contenu et les mots-clés.
   */
  async chercher(query: string, limite = 3): Promise<Array<{
    id: string; slug: string; titre: string; categorie: string;
    contenu: string; mots_cles: string[]; source: string;
  }>> {
    try {
      const mots = query
        .toLowerCase()
        .split(/\s+/)
        .filter((m) => m.length > 2);

      const docs = await this.prisma.documentBase.findMany({
        where: {
          OR: [
            { titre: { contains: query, mode: 'insensitive' } },
            { contenu: { contains: query, mode: 'insensitive' } },
            ...mots.map((mot) => ({ mots_cles: { has: mot } })),
          ],
        },
        take: limite,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          titre: true,
          categorie: true,
          contenu: true,
          mots_cles: true,
          source: true,
        },
      });

      return docs;
    } catch (error) {
      // La table peut ne pas exister avant la migration
      this.logger.debug(`KnowledgeService.chercher erreur silencieuse : ${error.message}`);
      return [];
    }
  }

  /**
   * Construit le bloc de contexte documentaire à injecter dans le prompt.
   * Limite à MAX_CONTEXTE_CHARS pour ne pas exploser le contexte LLM.
   */
  async construireContexte(query: string): Promise<string> {
    const docs = await this.chercher(query, 3);
    if (!docs.length) return '';

    let contexte =
      '\n## Contexte documentaire pertinent (base de connaissance GESTMONEY)\n\n';
    let total = contexte.length;

    for (const doc of docs) {
      const extrait = doc.contenu.slice(0, 800);
      const bloc = `### ${doc.titre}\n${extrait}${doc.contenu.length > 800 ? '…' : ''}\n\n`;
      if (total + bloc.length > MAX_CONTEXTE_CHARS) break;
      contexte += bloc;
      total += bloc.length;
    }

    return contexte;
  }

  /**
   * Synchronise (upsert) un tableau d'entrées documentaires.
   * Utilisé par le seed et l'endpoint admin /admin/knowledge/sync.
   */
  async synchroniser(
    entrees: Array<{
      slug: string;
      titre: string;
      categorie: string;
      contenu: string;
      mots_cles: string[];
      source: string;
      langue?: string;
    }>,
  ): Promise<number> {
    let count = 0;
    for (const e of entrees) {
      await this.prisma.documentBase.upsert({
        where: { slug: e.slug },
        update: {
          titre: e.titre,
          categorie: e.categorie,
          contenu: e.contenu,
          mots_cles: e.mots_cles,
          source: e.source,
          langue: e.langue ?? 'fr',
        },
        create: {
          slug: e.slug,
          titre: e.titre,
          categorie: e.categorie,
          contenu: e.contenu,
          mots_cles: e.mots_cles,
          source: e.source,
          langue: e.langue ?? 'fr',
        },
      });
      count++;
    }
    return count;
  }
}
