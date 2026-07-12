import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { View, Text, StyleSheet } from 'react-native';
import { useTransactionStore } from '../../src/store/transactionStore';

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
      size={24}
      color={color}
    />
  );
}

function SyncBadge() {
  const count = useTransactionStore((s) => s.pendingCount);
  if (!count) return null;
  return (
    <View style={badge.wrap}>
      <Text style={badge.text}>{count}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  text: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.cardBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabIcon name="swap-horizontal" color={color} focused={focused} />
              <SyncBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="float"
        options={{
          title: 'Float',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="wallet" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="commissions"
        options={{
          title: 'Commissions',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cash" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
