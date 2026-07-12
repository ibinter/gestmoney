# Migrations GESTMONEY

Les migrations de base de données sont gérées par **Prisma Migrate**.

## Créer une nouvelle migration

```bash
# Depuis le répertoire packages/database
npx prisma migrate dev --name nom_de_la_migration
```

## Appliquer les migrations en production

```bash
npx prisma migrate deploy
```

## Réinitialiser la base de données (développement uniquement)

```bash
npx prisma migrate reset
```

## Workflow recommandé

1. Modifier `schema.prisma`
2. Exécuter `npx prisma migrate dev --name description_courte`
3. Prisma génère le fichier SQL et met à jour le client
4. Committer le fichier de migration généré dans `prisma/migrations/`
