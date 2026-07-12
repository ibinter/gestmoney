import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { getOperator } from '../../src/constants/operators';

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  color = Colors.text,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, danger && { borderColor: Colors.danger }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={20} color={danger ? Colors.danger : Colors.primary} />
      <Text style={[styles.actionLabel, { color: danger ? Colors.danger : Colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { agent, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{agent?.name?.charAt(0) ?? 'A'}</Text>
          </View>
          <Text style={styles.agentName}>{agent?.name ?? '—'}</Text>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>Code agent : {agent?.code ?? '—'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{agent?.role ?? 'AGENT'}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations</Text>
          <ProfileRow icon="mail-outline" label="Email" value={agent?.email ?? '—'} />
          <ProfileRow icon="business-outline" label="Agence" value={agent?.agencyName ?? '—'} />
        </View>

        {/* Active operators */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Opérateurs actifs</Text>
          <View style={styles.opsRow}>
            {(agent?.activeOperators ?? []).map((opId) => {
              const op = getOperator(opId);
              return (
                <View key={opId} style={[styles.opBadge, { borderColor: op?.color ?? '#888' }]}>
                  <View style={[styles.opDot, { backgroundColor: op?.color ?? '#888' }]} />
                  <Text style={[styles.opName, { color: op?.color ?? Colors.text }]}>{op?.name ?? opId}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Paramètres</Text>
          <ActionButton
            icon="lock-closed-outline"
            label="Changer le mot de passe"
            onPress={() => {/* navigate */}}
          />
          <ActionButton
            icon="settings-outline"
            label="Paramètres de l'application"
            onPress={() => {/* navigate */}}
          />
          <ActionButton
            icon="help-circle-outline"
            label="Aide & Support"
            onPress={() => {/* navigate */}}
          />
        </View>

        <ActionButton
          icon="log-out-outline"
          label="Se déconnecter"
          onPress={handleLogout}
          danger
        />

        <Text style={styles.version}>GESTMONEY v1.0.0 — IBIG SOFT</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#000', fontWeight: '800', fontSize: 32 },
  agentName: { color: Colors.text, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  codeBadge: {
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  codeText: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'monospace' },
  roleBadge: {
    backgroundColor: `${Colors.primary}22`,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  roleText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardTitle: { color: Colors.text, fontWeight: '700', fontSize: 14, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoLabel: { color: Colors.textMuted, fontSize: 11, marginBottom: 2 },
  infoValue: { color: Colors.text, fontWeight: '600', fontSize: 14 },
  opsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  opDot: { width: 8, height: 8, borderRadius: 4 },
  opName: { fontSize: 12, fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  version: { color: Colors.textMuted, textAlign: 'center', marginTop: 16, fontSize: 12 },
});
