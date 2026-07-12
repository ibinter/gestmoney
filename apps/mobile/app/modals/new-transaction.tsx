import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, TransactionColors } from '../../src/constants/colors';
import { useTransactionStore } from '../../src/store/transactionStore';
import { OPERATORS } from '../../src/constants/operators';
import { formatCurrency } from '../../src/utils/helpers';

const TX_CONFIG = {
  DEPOSIT: { label: 'Dépôt', icon: 'arrow-down-circle', description: 'Recevoir de l\'argent du client' },
  WITHDRAWAL: { label: 'Retrait', icon: 'arrow-up-circle', description: 'Remettre de l\'argent au client' },
  CASH_IN: { label: 'Cash In', icon: 'enter', description: 'Approvisionner le compte client' },
  CASH_OUT: { label: 'Cash Out', icon: 'exit', description: 'Décaisser depuis le compte client' },
} as const;

type TxType = keyof typeof TX_CONFIG;

export default function NewTransactionModal() {
  const { type: initialType } = useLocalSearchParams<{ type: string }>();
  const [txType, setTxType] = useState<TxType>((initialType as TxType) ?? 'DEPOSIT');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const { createTransaction } = useTransactionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = TX_CONFIG[txType];
  const color = TransactionColors[txType];
  const parsedAmount = parseFloat(amount.replace(/\s/g, ''));

  const canProceed = phone.trim().length >= 8 && parsedAmount > 0 && operatorId;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const tx = await createTransaction({
      type: txType,
      amount: parsedAmount,
      phone: phone.trim(),
      operatorId,
    });
    setIsSubmitting(false);
    if (tx) {
      router.replace({ pathname: '/modals/receipt', params: { id: tx.id } });
    } else {
      Alert.alert('Erreur', 'Impossible de créer la transaction.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Nouvelle Transaction</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 'form' ? (
            <>
              {/* Type Selector */}
              <Text style={styles.label}>Type d'opération</Text>
              <View style={styles.typeGrid}>
                {(Object.keys(TX_CONFIG) as TxType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, txType === t && { borderColor: TransactionColors[t], backgroundColor: `${TransactionColors[t]}22` }]}
                    onPress={() => setTxType(t)}
                  >
                    <Ionicons
                      name={TX_CONFIG[t].icon as any}
                      size={20}
                      color={txType === t ? TransactionColors[t] : Colors.textSecondary}
                    />
                    <Text style={[styles.typeBtnText, txType === t && { color: TransactionColors[t] }]}>
                      {TX_CONFIG[t].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount */}
              <Text style={styles.label}>Montant (FCFA)</Text>
              <View style={styles.amountWrap}>
                <Text style={styles.currencySymbol}>FCFA</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Phone */}
              <Text style={styles.label}>Numéro client</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="+225 07 00 00 00 00"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Operator */}
              <Text style={styles.label}>Opérateur</Text>
              <View style={styles.opGrid}>
                {OPERATORS.map((op) => (
                  <TouchableOpacity
                    key={op.id}
                    style={[styles.opBtn, operatorId === op.id && { borderColor: op.color, backgroundColor: `${op.color}22` }]}
                    onPress={() => setOperatorId(op.id)}
                  >
                    <Text style={[styles.opBtnText, operatorId === op.id && { color: op.color }]}>{op.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: color }, !canProceed && styles.btnDisabled]}
                onPress={() => setStep('confirm')}
                disabled={!canProceed}
              >
                <Text style={styles.nextBtnText}>Continuer →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.confirmCard}>
              <View style={[styles.confirmIcon, { backgroundColor: `${color}22` }]}>
                <Ionicons name={config.icon as any} size={40} color={color} />
              </View>
              <Text style={styles.confirmType}>{config.label}</Text>
              <Text style={styles.confirmAmount}>{formatCurrency(parsedAmount)}</Text>
              <View style={styles.confirmDetails}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Client</Text>
                  <Text style={styles.confirmValue}>{phone}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Opérateur</Text>
                  <Text style={styles.confirmValue}>
                    {OPERATORS.find((o) => o.id === operatorId)?.name ?? operatorId}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: color }, isSubmitting && styles.btnDisabled]}
                onPress={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.nextBtnText}>Valider la transaction</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('form')}>
                <Text style={styles.backBtnText}>← Modifier</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Colors.text, fontWeight: '800', fontSize: 17 },
  scroll: { padding: 20, paddingBottom: 40 },
  label: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13, marginBottom: 8, marginTop: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.card,
  },
  typeBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
    height: 60,
  },
  currencySymbol: { color: Colors.textMuted, fontSize: 16, marginRight: 8 },
  amountInput: { flex: 1, color: Colors.text, fontSize: 28, fontWeight: '800' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    height: 52,
  },
  input: { flex: 1, color: Colors.text, fontSize: 15 },
  opGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opBtn: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.card,
  },
  opBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  nextBtn: {
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.4 },
  nextBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  confirmCard: { alignItems: 'center', paddingTop: 20 },
  confirmIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmType: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  confirmAmount: { color: Colors.primary, fontSize: 36, fontWeight: '900', marginBottom: 24 },
  confirmDetails: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 8,
  },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  confirmLabel: { color: Colors.textSecondary, fontSize: 14 },
  confirmValue: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  backBtn: { marginTop: 12, padding: 12 },
  backBtnText: { color: Colors.textSecondary, fontWeight: '600' },
});
