import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from 'react-native-chart-kit';
import { Colors } from '../../src/constants/colors';
import { commissionApi } from '../../src/services/api';
import { formatCurrency, formatDate } from '../../src/utils/helpers';

const { width } = Dimensions.get('window');

const PERIODS = [
  { key: 'day', label: 'Aujourd\'hui' },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
] as const;

type Period = typeof PERIODS[number]['key'];

export default function CommissionsScreen() {
  const [period, setPeriod] = useState<Period>('day');

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['commissions-summary', period],
    queryFn: () => commissionApi.summary(period).then((r) => r.data),
  });

  const { data: list, isLoading: loadingList } = useQuery({
    queryKey: ['commissions-list'],
    queryFn: () => commissionApi.list({ limit: 30 }).then((r) => r.data),
  });

  const chartData = {
    labels: summary?.weeklyChart?.labels ?? ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    datasets: [{ data: summary?.weeklyChart?.values ?? [0, 0, 0, 0, 0, 0, 0] }],
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Mes Commissions</Text>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        {loadingSummary ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryAmount}>{formatCurrency(summary?.total ?? 0)}</Text>
            <Text style={styles.summaryLabel}>
              {PERIODS.find((p) => p.key === period)?.label}
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemValue}>{summary?.count ?? 0}</Text>
                <Text style={styles.summaryItemLabel}>Transactions</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemValue}>{formatCurrency(summary?.average ?? 0)}</Text>
                <Text style={styles.summaryItemLabel}>Moy. / transaction</Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly Chart */}
        <Text style={styles.sectionTitle}>7 derniers jours</Text>
        <View style={styles.chartCard}>
          <BarChart
            data={chartData}
            width={width - 64}
            height={160}
            fromZero
            withInnerLines={false}
            showBarTops={false}
            chartConfig={{
              backgroundGradientFrom: Colors.card,
              backgroundGradientTo: Colors.card,
              color: () => Colors.primary,
              labelColor: () => Colors.textSecondary,
              barPercentage: 0.6,
              propsForBackgroundLines: { stroke: 'transparent' },
            }}
            style={{ borderRadius: 12 }}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>

        {/* Commission List */}
        <Text style={styles.sectionTitle}>Dernières commissions</Text>
        {loadingList ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          (list?.data ?? list ?? []).map((c: any) => (
            <View key={c.id} style={styles.commRow}>
              <View style={styles.commLeft}>
                <Text style={styles.commType}>{c.transactionType}</Text>
                <Text style={styles.commDate}>{formatDate(c.createdAt)}</Text>
              </View>
              <Text style={styles.commAmount}>+{formatCurrency(c.amount)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { color: Colors.text, fontSize: 22, fontWeight: '800', marginBottom: 16 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  periodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  periodTextActive: { color: '#000' },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  summaryAmount: { color: Colors.primary, fontSize: 32, fontWeight: '900' },
  summaryLabel: { color: Colors.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryItemValue: { color: Colors.text, fontWeight: '700', fontSize: 16 },
  summaryItemLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: Colors.cardBorder },
  sectionTitle: { color: Colors.text, fontWeight: '700', fontSize: 15, marginBottom: 12 },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  commRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  commLeft: { flex: 1 },
  commType: { color: Colors.text, fontWeight: '600', fontSize: 13 },
  commDate: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  commAmount: { color: Colors.success, fontWeight: '800', fontSize: 15 },
});
