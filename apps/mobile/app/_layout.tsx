import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { offlineDb } from '../src/services/offline';
import { useSync } from '../src/hooks/useSync';
import { Colors } from '../src/constants/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    surface: Colors.card,
    onSurface: Colors.text,
  },
};

function RootContent() {
  const { isAuthenticated, loadSession } = useAuthStore();
  useSync();

  useEffect(() => {
    offlineDb.init().catch(console.warn);
    loadSession();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="modals/new-transaction"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="modals/receipt"
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <Stack.Screen name="(auth)/login" />
        )}
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <RootContent />
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
