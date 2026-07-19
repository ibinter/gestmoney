#!/bin/bash
# Peuple le module Stock de GESTMONEY via l'API.
#
# ATTENTION : le StockService garde ses données dans des tableaux EN MÉMOIRE
# (const products = [] ...). Ce jeu de données disparaît donc à chaque
# redémarrage du conteneur API. Relancer ce script après chaque déploiement,
# ou rendre le service persistant (Prisma) pour de bon.
set -e

BASE="https://gestmoney.ibigsoft.com/api/v1"
JAR=$(mktemp)
EMAIL="${SEED_EMAIL:-admin@gestmoney.ibigsoft.com}"
PASS="${SEED_PASS:-Gestmoney@2026}"
TENANT="${SEED_TENANT:-cmrfpl9on0000x4b78n0u1b31}"
AGENCE="${SEED_AGENCE:-agence-plateau}"

echo "→ Connexion…"
curl -s -c "$JAR" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" -o /dev/null

api() { curl -s -b "$JAR" -H "Content-Type: application/json" "$@"; }

# Produit : nom|sku|catégorie|prix|seuil d'alerte|unit\u00e9|quantité initiale
PRODUITS=(
  "SIM Orange Money|SIM-ORG-001|SIM|500|50|unit\u00e9|1200"
  "SIM MTN MoMo|SIM-MTN-001|SIM|500|50|unit\u00e9|850"
  "SIM Wave|SIM-WAV-001|SIM|500|50|unit\u00e9|640"
  "SIM Moov Money|SIM-MOO-001|SIM|500|50|unit\u00e9|30"
  "Terminal POS Ingenico|TRM-ING-001|TERMINAL|145000|5|unit\u00e9|42"
  "Terminal POS Verifone|TRM-VRF-001|TERMINAL|132000|5|unit\u00e9|18"
  "Terminal mobile Sunmi|TRM-SUN-001|TERMINAL|89000|5|unit\u00e9|3"
  "Rouleau papier thermique|ACC-PAP-001|ACCESSOIRE|1200|100|rouleau|340"
  "Chargeur secteur POS|ACC-CHG-001|ACCESSOIRE|7500|20|unit\u00e9|95"
  "Batterie de rechange POS|ACC-BAT-001|ACCESSOIRE|18000|10|unit\u00e9|8"
  "Affiches tarifs A3|CON-AFF-001|CONSOMMABLE|900|50|unit\u00e9|210"
  "Kit de nettoyage terminal|CON-KIT-001|CONSOMMABLE|3500|15|kit|12"
)

# Idempotence : le store étant en mémoire, relancer sans garde dupliquerait
# tout le jeu de données. On sort si la démo est déjà en place.
if api "$BASE/stock/products?page=1&limit=200" | grep -q 'SIM-ORG-001'; then
  echo "Produits de démonstration déjà présents — rien à faire."
  echo "  (pour repartir de zéro : docker restart gestmoney_api, puis relancer)"
  rm -f "$JAR"
  exit 0
fi

echo "→ Création des produits et des entrées de stock…"
CREES=0
for p in "${PRODUITS[@]}"; do
  IFS='|' read -r NOM SKU CAT PRIX SEUIL UNITE QTE <<< "$p"

  ID=$(api -X POST "$BASE/stock/products" -d "{
    \"name\":\"$NOM\",\"sku\":\"$SKU\",\"category\":\"$CAT\",
    \"unitPrice\":$PRIX,\"alertThreshold\":$SEUIL,\"unit\":\"$UNITE\",
    \"description\":\"[D\u00c9MO] $NOM\"
  }" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

  if [ -z "$ID" ]; then echo "  ✗ $NOM"; continue; fi

  api -X POST "$BASE/stock/movements/in" -d "{
    \"productId\":\"$ID\",\"agencyId\":\"$AGENCE\",\"quantity\":$QTE,
    \"reason\":\"PURCHASE\",\"reference\":\"DEM-APPRO\",
    \"notes\":\"[D\u00c9MO] Approvisionnement initial\"
  }" > /dev/null

  CREES=$((CREES+1))
  echo "  ✓ $NOM ($QTE $UNITE)"
done

# Quelques sorties, pour que l'historique des mouvements ne soit pas vide
echo "→ Sorties de stock…"
PREMIER=$(api "$BASE/stock/products?limit=3" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
if [ -n "$PREMIER" ]; then
  for q in 25 40 15; do
    api -X POST "$BASE/stock/movements/out" -d "{
      \"productId\":\"$PREMIER\",\"agencyId\":\"$AGENCE\",\"quantity\":$q,
      \"reason\":\"SALE\",\"reference\":\"DEM-VENTE\",
      \"notes\":\"[D\u00c9MO] Distribution aux agents\"
    }" > /dev/null
  done
  echo "  ✓ 3 sorties enregistrées"
fi

echo
echo "→ Contrôle :"
echo "  produits  : $(api "$BASE/stock/products?limit=100" | grep -o '"id"' | wc -l)"
echo "  alertes   : $(api "$BASE/stock/alerts" | grep -o '"productId"' | wc -l)"
echo "  mouvements: $(api "$BASE/stock/movements?limit=100" | grep -o '"id"' | wc -l)"
rm -f "$JAR"
echo "OK — $CREES produits créés."
