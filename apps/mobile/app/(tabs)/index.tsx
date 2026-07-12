import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, TransactionColors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { dashboardApi, floatApi } from '../../src/services/api';
import { formatCurrency, formatTime } from '../../src/utils/helpers';
import { getOperator } from '../../src/constants/operators';

const TX_LABELS: Record<string, string> = {
  DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait',
  CASH_IN: 'Cash In',
  CASH_OUT: 'Cash Out',
};

function QuickAction({
  label,
  icon,
  color,
  type,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  type: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickBtn, { borderColor: color }]}
      onPress={() => router.push({ pathname: '/modals/new-transaction', params: { type } })}
      activeOpacity={0.8}
    >
      <View style={[styles.quickIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { agent } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['agent-stats'],
    queryFn: () => dashboardApi.agentStats().then((r) => r.data),
  });

  const { data: floats, refetch: refetchFloat } = useQuery({
    queryKey: ['float'],
    queryFn: () => floatApi.list().then((r) => r.data),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchFloat()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.agentName}>{agent?.name ?? '—'}</Text>
            <Text style={styles.agencyLabel}>{agent?.agencyName}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{agent?.name?.charAt(0) ?? 'A'}</Text>
          </View>
        </View>

        {/* Float Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Float Opérateurs</Text>
          {floats ? (
            floats.map((f: any) => {
              const op = getOperator(f.operatorId);
              const isLow = f.balance < f.minThreshold;
              const pct = Math.min(100, Math.round((f.balance / f.minThreshold) * 50));
              return (
                <View key={f.operatorId} style={styles.floatRow}>
                  <View style={styles.floatLeft}>
                    <View style={[styles.opDot, { backgroundColor: op?.color ?? '#888' }]} />
                    <Text style={styles.floatName}>{op?.name ?? f.operatorId}</Text>
                  </View>
                  <View style={styles.floatRight}>
                    <Text style={[styles.floatBalance, isLow && { color: Colors.danger }]}>
                      {formatCurrency(f.balance)}
                    </Text>
                    {isLow && (
                      <Ionicons name="warning" size={14} color={Colors.danger} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 8 }} />
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: Colors.success }]}>
            <Text style={styles.statValue}>{stats?.todayCount ?? '—'}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statSub}>aujourd'hui</Text>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.primary }]}>
            <Text style={styles.statValue}>{stats ? formatCurrency(stats.todayAmount) : '—'}</Text>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statSub}>aujourd'hui</Text>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.info }]}>
            <Text style={styles.statValue}>{stats ? formatCurrency(stats.todayCommission) : '—'}</Text>
            <Text style={styles.statLabel}>Commissions</Text>
            <Text style={styles.statSub}>aujourd'hui</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickGrid}>
          <QuickAction label="Dépôt" icon="arrow-down-circle" color={Colors.success} type="DEPOSIT" />
          <QuickAction label="Retrait" icon="arrow-up-circle" color={Colors.danger} type="WITHDRAWAL" />
          <QuickAction label="Cash In" icon="enter" color={Colors.info} type="CASH_IN" />
          <QuickAction label="Cash Out" icon="exit" color={Colors.warning} type="CASH_OUT" />
        </View>

        {/* Recent transactions */}
        <Text style={styles.sectionTitle}>Dernières transactions</Text>
        {stats?.recentTransactions?.length > 0 ? (
          stats.recentTransactions.slice(0, 3).map((tx: any) => (
            <TouchableOpacity
              key={tx.id}
              style={styles.txRow}
              onPress={() => router.push({ pathname: '/modals/receipt', params: { id: tx.id } })}
            >
              <View style={[styles.txBadge, { backgroundColor: `${TransactionColors[tx.type]}22` }]}>
                <Text style={[styles.txBadgeText, { color: TransactionColors[tx.type] }]}>
                  {TX_LABELS[tx.type]}
                </Text>
              </View>
              <View style={styles.txMeta}>
                <Text style={styles.txClient}>{tx.phone}</Text>
                <Text style={styles.txTime}>{formatTime(tx.createdAt)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: TransactionColors[tx.type] }]}>
                {formatCurrency(tx.amount)}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune transaction aujourd'hui</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: Colors.textSecondary, fontSize: 13 },
  agentName: { color: Colors.text, fontSize: 20, fontWeight: '700', marginTop: 2 },
  agencyLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#000', fontWeight: '800', fontSize: 20 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardTitle: { color: Colors.text, fontWeight: '700', fontSize: 15, marginBottom: 12 },
  floatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  floatLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  opDot: { width: 10, height: 10, borderRadius: 5 },
  floatName: { color: Colors.textSecondary, fontSize: 14 },
  floatRight: { flexDirection: 'row', alignItems: 'center' },
  floatBalance: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: { color: Colors.text, fontWeight: '800', fontSize: 13, textAlign: 'center' },
  statLabel: { color: Colors.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' },
  statSub: { color: Colors.textMuted, fontSize: 10, textAlign: 'center' },
  sectionTitle: { color: Colors.text, fontWeight: '700', fontSize: 15, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  quickBtn: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel: { fontWeight: '700', fontSize: 14 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  txBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 10 },
  txBadgeText: { fontWeight: '700', fontSize: 11 },
  txMeta: { flex: 1 },
  txClient: { color: Colors.text, fontWeight: '600', fontSize: 13 },
  txTime: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  txAmount: { fontWeight: '800', fontSize: 14 },
  emptyText: { color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
});
