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

### Alerte d'audit — automatisée

L'alerte `EXCESSIVE_ACTIVITY` porte sur une fenêtre **glissante d'une heure**
(plus de 50 actions par utilisateur). Un pic seedé il y a plus d'une heure
disparaît donc naturellement — ce n'est pas un bug.

Une tâche cron sur le VPS s'en charge **toutes les 30 minutes**, aucune action
manuelle n'est requise :

```
*/30 * * * * /opt/gestmoney/cron-demo.sh     # journal : /var/log/gestmoney-demo.log
```

Pour forcer un rafraîchissement immédiat :

```bash
docker exec -w /app/apps/api gestmoney_api node refresh-alerte-audit.js
```

## Stock (persistant depuis le 20/07/2026)

```bash
bash scripts/demo/seed-stock.sh
```

À lancer **une seule fois** : `StockService` écrit désormais en base (modèles
`Product`, `Inventory`, `StockMovement`), les données survivent aux
redémarrages et redéploiements.

Crée 12 produits (SIM, terminaux, accessoires, consommables), leur stock
initial et quelques sorties. Quatre produits passent volontairement sous leur
seuil pour déclencher les alertes de stock bas.

Le script est idempotent : il sort sans rien faire si la démo est déjà en
place. Pour repartir de zéro, supprimer les produits en base puis le relancer.

Les chaînes accentuées y sont écrites en échappement JSON (`unité`) : le
passage par bash/curl sous Windows corrompait l'UTF-8 littéral.

> Restent volatils : **fournisseurs** et **bons de commande**, faute de modèles
> `Supplier` / `PurchaseOrder` au schéma Prisma.

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
