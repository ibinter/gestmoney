# Données de démonstration GESTMONEY

Jeux de données pour présenter les modules **Comptabilité**, **Stock** et
**Audit / IA**. Tout ce qui est créé porte le marqueur `[DÉMO]` afin d'être
identifiable et retirable sans toucher aux données réelles.

> ⚠️ Le compte démo et le compte admin partagent le même tenant. Les écritures
> ci-dessous apparaissent donc aussi dans la comptabilité de l'admin. C'est
> voulu pour la démonstration — utiliser `purge-demo-data.js` pour les retirer.

## Comptabilité + Audit (persistants, en base)

```bash
docker cp scripts/demo/seed-demo-data.js gestmoney_api:/app/apps/api/
docker exec -w /app/apps/api gestmoney_api node seed-demo-data.js
```

Crée : l'exercice fiscal courant, 21 comptes SYSCOHADA, 16 écritures
équilibrées et réparties sur l'année, ~185 entrées de journal d'audit.
Le script est **idempotent** : le relancer ne duplique rien.

### Rafraîchir l'alerte d'audit

L'alerte `EXCESSIVE_ACTIVITY` porte sur une fenêtre **glissante d'une heure**
(plus de 50 actions par utilisateur). Un pic seedé il y a plus d'une heure
disparaît donc naturellement — ce n'est pas un bug. Avant une démonstration :

```bash
docker exec -w /app/apps/api gestmoney_api node refresh-alerte-audit.js
```

## Stock (ÉPHÉMÈRE — à rejouer après chaque redémarrage)

`StockService` conserve ses données dans des **tableaux en mémoire**
(`const products: IProduct[] = []`), pas en base. Le jeu de données disparaît
donc à chaque redémarrage ou redéploiement du conteneur API.

```bash
bash scripts/demo/seed-stock.sh
```

Crée 12 produits (SIM, terminaux, accessoires, consommables), leur stock
initial et quelques sorties. Quatre produits passent volontairement sous leur
seuil pour déclencher les alertes de stock bas.

Le script est idempotent (il sort si la démo est déjà présente). Pour repartir
de zéro : `docker restart gestmoney_api`, puis le relancer.

Les chaînes accentuées y sont écrites en échappement JSON (`unité`) : le
passage par bash/curl sous Windows corrompait l'UTF-8 littéral.

> Pour rendre ce module durable, il faudrait faire écrire `StockService` dans
> Prisma (les modèles `Product`, `Inventory`, `StockMovement` existent déjà).

## Retirer les données de démonstration

```bash
docker cp scripts/demo/purge-demo-data.js gestmoney_api:/app/apps/api/
docker exec -w /app/apps/api gestmoney_api node purge-demo-data.js              # à blanc
docker exec -w /app/apps/api -e CONFIRMER=oui gestmoney_api node purge-demo-data.js
```

Supprime les écritures `DEM-*` et les logs `[DÉMO]`. Le plan comptable et
l'exercice fiscal sont **conservés** : ils sont réutilisables pour de vraies
écritures, et les supprimer casserait toute écriture réelle qui s'y rattache.
Le stock disparaît de lui-même au redémarrage.
