import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, TransactionColors } from '../../src/constants/colors';
import { useTransactionStore } from '../../src/store/transactionStore';
import { formatCurrency, formatTime } from '../../src/utils/helpers';

const TX_LABELS: Record<string, string> = {
  DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait',
  CASH_IN: 'Cash In',
  CASH_OUT: 'Cash Out',
};

const TX_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  DEPOSIT: 'arrow-down-circle',
  WITHDRAWAL: 'arrow-up-circle',
  CASH_IN: 'enter',
  CASH_OUT: 'exit',
};

function ActionButton({
  label,
  type,
  color,
}: {
  label: string;
  type: string;
  color: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { borderColor: color }]}
      onPress={() => router.push({ pathname: '/modals/new-transaction', params: { type } })}
      activeOpacity={0.8}
    >
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function TransactionsScreen() {
  const { transactions, isLoading, fetchToday } = useTransactionStore();

  useEffect(() => {
    fetchToday();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>Aujourd'hui — {transactions.length} opération(s)</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <ActionButton label="+ Dépôt" type="DEPOSIT" color={Colors.success} />
        <ActionButton label="+ Retrait" type="WITHDRAWAL" color={Colors.danger} />
        <ActionButton label="+ Cash In" type="CASH_IN" color={Colors.info} />
        <ActionButton label="+ Cash Out" type="CASH_OUT" color={Colors.warning} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchToday}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="swap-horizontal-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Aucune transaction aujourd'hui</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.txCard}
              onPress={() => router.push({ pathname: '/modals/receipt', params: { id: item.id } })}
              activeOpacity={0.85}
            >
              <View style={[styles.txIconWrap, { backgroundColor: `${TransactionColors[item.type]}22` }]}>
                <Ionicons
                  name={TX_ICONS[item.type]}
                  size={22}
                  color={TransactionColors[item.type]}
                />
              </View>
              <View style={styles.txBody}>
                <View style={styles.txTop}>
                  <Text style={styles.txType}>{TX_LABELS[item.type]}</Text>
                  <Text style={[styles.txAmount, { color: TransactionColors[item.type] }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
                <View style={styles.txBottom}>
                  <Text style={styles.txPhone}>{item.phone}</Text>
                  <View style={styles.txMeta}>
                    <Text style={styles.txTime}>{formatTime(item.createdAt)}</Text>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            item.status === 'SUCCESS'
                              ? Colors.success
                              : item.status === 'FAILED'
                              ? Colors.danger
                              : Colors.warning,
                        },
                      ]}
                    />
                    {!item.synced && (
                      <Ionicons
                        name="cloud-offline-outline"
                        size={12}
                        color={Colors.warning}
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 16, paddingBottom: 8 },
  title: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionBtnText: { fontWeight: '700', fontSize: 13 },
  list: { padding: 16, paddingTop: 4, paddingBottom: 32 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txBody: { flex: 1 },
  txTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  txType: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  txAmount: { fontWeight: '800', fontSize: 14 },
  txBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txPhone: { color: Colors.textSecondary, fontSize: 12 },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txTime: { color: Colors.textMuted, fontSize: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
