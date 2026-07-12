import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../src/constants/colors';
import { floatApi } from '../../src/services/api';
import { formatCurrency, formatDate } from '../../src/utils/helpers';
import { getOperator, OPERATORS } from '../../src/constants/operators';

function FloatBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = pct < 30 ? Colors.danger : pct < 60 ? Colors.warning : Colors.success;
  return (
    <View style={bar.track}>
      <View style={[bar.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const bar = StyleSheet.create({
  track: { height: 6, backgroundColor: Colors.cardBorder, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

export default function FloatScreen() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedOp, setSelectedOp] = useState('');
  const [amount, setAmount] = useState('');

  const { data: floats, isLoading, refetch } = useQuery({
    queryKey: ['float'],
    queryFn: () => floatApi.list().then((r) => r.data),
  });

  const { data: history } = useQuery({
    queryKey: ['float-history'],
    queryFn: () => floatApi.history().then((r) => r.data),
  });

  const restockMutation = useMutation({
    mutationFn: ({ opId, amt }: { opId: string; amt: number }) =>
      floatApi.requestRestock(opId, amt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['float'] });
      Alert.alert('Demande envoyée', 'Votre demande de réapprovisionnement a été transmise.');
      setShowModal(false);
      setAmount('');
    },
    onError: () => Alert.alert('Erreur', 'Impossible d\'envoyer la demande.'),
  });

  const handleRestock = () => {
    const amt = parseFloat(amount.replace(/\s/g, ''));
    if (!selectedOp || !amt || amt <= 0) {
      Alert.alert('Validation', 'Sélectionnez un opérateur et saisissez un montant valide.');
      return;
    }
    restockMutation.mutate({ opId: selectedOp, amt });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Float Opérateurs</Text>
          <TouchableOpacity
            style={styles.restockBtn}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.restockBtnText}>Réappro.</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          floats?.map((f: any) => {
            const op = getOperator(f.operatorId);
            const isLow = f.balance < f.minThreshold;
            return (
              <View key={f.operatorId} style={[styles.card, isLow && styles.cardAlert]}>
                <View style={styles.cardTop}>
                  <View style={styles.opInfo}>
                    <View style={[styles.opDot, { backgroundColor: op?.color ?? '#888' }]} />
                    <Text style={styles.opName}>{op?.name ?? f.operatorId}</Text>
                  </View>
                  {isLow && (
                    <View style={styles.alertBadge}>
                      <Ionicons name="warning" size={12} color={Colors.danger} />
                      <Text style={styles.alertText}>FLOAT BAS</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.balance, isLow && { color: Colors.danger }]}>
                  {formatCurrency(f.balance)}
                </Text>
                <FloatBar value={f.balance} max={f.minThreshold * 3} />
                <View style={styles.thresholdRow}>
                  <Text style={styles.thresholdLabel}>Seuil minimum</Text>
                  <Text style={styles.thresholdValue}>{formatCurrency(f.minThreshold)}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Historique */}
        <Text style={styles.sectionTitle}>Mouvements récents</Text>
        {history?.slice(0, 10).map((h: any) => (
          <View key={h.id} style={styles.histRow}>
            <View style={[styles.histIcon, { backgroundColor: h.type === 'IN' ? `${Colors.success}22` : `${Colors.danger}22` }]}>
              <Ionicons
                name={h.type === 'IN' ? 'arrow-down' : 'arrow-up'}
                size={14}
                color={h.type === 'IN' ? Colors.success : Colors.danger}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.histOp}>{getOperator(h.operatorId)?.name ?? h.operatorId}</Text>
              <Text style={styles.histDate}>{formatDate(h.createdAt)}</Text>
            </View>
            <Text style={[styles.histAmount, { color: h.type === 'IN' ? Colors.success : Colors.danger }]}>
              {h.type === 'IN' ? '+' : '-'}{formatCurrency(h.amount)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Restock Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Demande de réapprovisionnement</Text>

            <Text style={styles.modalLabel}>Opérateur</Text>
            <View style={styles.opButtons}>
              {OPERATORS.map((op) => (
                <TouchableOpacity
                  key={op.id}
                  style={[styles.opSelectBtn, selectedOp === op.id && { borderColor: op.color, backgroundColor: `${op.color}22` }]}
                  onPress={() => setSelectedOp(op.id)}
                >
                  <Text style={[styles.opSelectText, selectedOp === op.id && { color: op.color }]}>{op.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Montant (FCFA)</Text>
            <TextInput
              style={styles.modalInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Ex: 200000"
              placeholderTextColor={Colors.textMuted}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleRestock}
                disabled={restockMutation.isPending}
              >
                {restockMutation.isPending ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.confirmText}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  restockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  restockBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardAlert: { borderColor: Colors.danger },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  opInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  opDot: { width: 12, height: 12, borderRadius: 6 },
  opName: { color: Colors.text, fontWeight: '600', fontSize: 15 },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${Colors.danger}22`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  alertText: { color: Colors.danger, fontSize: 11, fontWeight: '800' },
  balance: { color: Colors.text, fontSize: 24, fontWeight: '800' },
  thresholdRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  thresholdLabel: { color: Colors.textMuted, fontSize: 12 },
  thresholdValue: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  sectionTitle: { color: Colors.text, fontWeight: '700', fontSize: 15, marginTop: 8, marginBottom: 12 },
  histRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
  histIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  histOp: { color: Colors.text, fontWeight: '600', fontSize: 13 },
  histDate: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  histAmount: { fontWeight: '800', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '800', marginBottom: 20 },
  modalLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  opButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  opSelectBtn: { borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  opSelectText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  modalInput: { backgroundColor: Colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, color: Colors.text, padding: 14, fontSize: 16, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '700' },
  confirmBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#000', fontWeight: '800' },
});
