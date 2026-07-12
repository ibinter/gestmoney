import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, TransactionColors } from '../../src/constants/colors';
import { transactionApi } from '../../src/services/api';
import { useTransactionStore, Transaction } from '../../src/store/transactionStore';
import { formatCurrency, formatDate } from '../../src/utils/helpers';
import { getOperator } from '../../src/constants/operators';

const TX_LABELS: Record<string, string> = {
  DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait',
  CASH_IN: 'Cash In',
  CASH_OUT: 'Cash Out',
};

function buildReceiptHtml(tx: Transaction, agentName: string): string {
  const op = getOperator(tx.operatorId);
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #F5B800; padding-bottom: 16px; margin-bottom: 16px; }
    .logo { font-size: 28px; font-weight: 900; color: #F5B800; }
    .subtitle { font-size: 12px; color: #666; }
    .amount { text-align: center; font-size: 32px; font-weight: 900; color: #1a1a1a; margin: 16px 0; }
    .type-badge { display: inline-block; background: #F5B800; color: #000; font-weight: 700; padding: 4px 14px; border-radius: 20px; font-size: 14px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .row-label { color: #666; font-size: 13px; }
    .row-value { font-weight: 700; font-size: 13px; }
    .status { text-align: center; margin-top: 16px; color: #22C55E; font-weight: 700; }
    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">GESTMONEY</div>
    <div class="subtitle">Reçu de transaction</div>
  </div>
  <div style="text-align:center; margin-bottom:8px">
    <span class="type-badge">${TX_LABELS[tx.type] ?? tx.type}</span>
  </div>
  <div class="amount">${formatCurrency(tx.amount)}</div>
  <div class="row"><span class="row-label">Référence</span><span class="row-value">${tx.reference}</span></div>
  <div class="row"><span class="row-label">Date</span><span class="row-value">${formatDate(tx.createdAt)}</span></div>
  <div class="row"><span class="row-label">Client</span><span class="row-value">${tx.phone}</span></div>
  <div class="row"><span class="row-label">Opérateur</span><span class="row-value">${op?.name ?? tx.operatorId}</span></div>
  <div class="row"><span class="row-label">Agent</span><span class="row-value">${agentName}</span></div>
  <div class="row"><span class="row-label">Commission</span><span class="row-value">${formatCurrency(tx.commission)}</span></div>
  <div class="status">✓ Transaction ${tx.status === 'SUCCESS' ? 'réussie' : tx.status}</div>
  <div class="footer">Conservez ce reçu comme preuve de transaction<br/>IBIG SOFT — www.gestmoney.com</div>
</body>
</html>`;
}

export default function ReceiptModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const { transactions } = useTransactionStore();

  useEffect(() => {
    // Try local store first
    const local = transactions.find((t) => t.id === id);
    if (local) {
      setTx(local);
      setLoading(false);
      return;
    }
    // Fallback to API
    transactionApi
      .getById(id!)
      .then((r) => setTx(r.data))
      .catch(() => Alert.alert('Erreur', 'Impossible de charger le reçu.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = async () => {
    if (!tx) return;
    const html = buildReceiptHtml(tx, 'Agent');
    try {
      await Print.printAsync({ html });
    } catch {
      Alert.alert('Impression', 'Impossible d\'imprimer le reçu.');
    }
  };

  const handleShare = async () => {
    if (!tx) return;
    const html = buildReceiptHtml(tx, 'Agent');
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Partager le reçu' });
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de partager le reçu.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!tx) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Reçu introuvable</Text>
      </SafeAreaView>
    );
  }

  const op = getOperator(tx.operatorId);
  const color = TransactionColors[tx.type] ?? Colors.primary;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Reçu</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Receipt Card */}
        <View style={styles.receiptCard}>
          {/* Logo */}
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptLogo}>GESTMONEY</Text>
            <Text style={styles.receiptSubtitle}>Reçu de transaction</Text>
          </View>

          {/* Status icon */}
          <View style={[styles.statusIcon, { backgroundColor: `${color}22` }]}>
            <Ionicons
              name={tx.status === 'SUCCESS' ? 'checkmark-circle' : tx.status === 'FAILED' ? 'close-circle' : 'time'}
              size={48}
              color={tx.status === 'SUCCESS' ? Colors.success : tx.status === 'FAILED' ? Colors.danger : Colors.warning}
            />
          </View>
          <Text style={styles.statusLabel}>
            {tx.status === 'SUCCESS' ? 'Transaction réussie' : tx.status === 'FAILED' ? 'Transaction échouée' : 'En attente de sync'}
          </Text>

          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: `${color}22`, borderColor: color }]}>
            <Text style={[styles.typeText, { color }]}>{TX_LABELS[tx.type]}</Text>
          </View>

          {/* Amount */}
          <Text style={[styles.amount, { color }]}>{formatCurrency(tx.amount)}</Text>

          {/* Details */}
          <View style={styles.divider} />
          {[
            { label: 'Référence', value: tx.reference },
            { label: 'Date', value: formatDate(tx.createdAt) },
            { label: 'Client', value: tx.phone },
            { label: 'Opérateur', value: op?.name ?? tx.operatorId },
            { label: 'Commission', value: formatCurrency(tx.commission) },
          ].map(({ label, value }) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
          <View style={styles.divider} />

          <Text style={styles.receiptFooter}>
            Conservez ce reçu comme preuve de transaction{'\n'}IBIG SOFT — www.gestmoney.com
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
          <Ionicons name="print-outline" size={20} color="#000" />
          <Text style={styles.printBtnText}>Imprimer le reçu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.doneBtnText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.text, fontWeight: '800', fontSize: 17 },
  shareBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  receiptCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  receiptHeader: { alignItems: 'center', marginBottom: 20 },
  receiptLogo: { color: Colors.primary, fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  receiptSubtitle: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  statusIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statusLabel: { color: Colors.text, fontWeight: '700', fontSize: 15, marginBottom: 12 },
  typeBadge: { borderRadius: 20, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 16, marginBottom: 8 },
  typeText: { fontWeight: '800', fontSize: 13 },
  amount: { fontSize: 32, fontWeight: '900', marginBottom: 16 },
  divider: { width: '100%', height: 1, backgroundColor: Colors.cardBorder, marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  rowLabel: { color: Colors.textSecondary, fontSize: 13 },
  rowValue: { color: Colors.text, fontWeight: '700', fontSize: 13, maxWidth: '60%', textAlign: 'right' },
  receiptFooter: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 18 },
  printBtn: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  printBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  doneBtn: { height: 50, alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  errorText: { color: Colors.danger, textAlign: 'center', marginTop: 80, fontSize: 16 },
});
