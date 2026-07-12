import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useTransactionStore } from '../store/transactionStore';

/**
 * Hook that watches network connectivity and triggers sync
 * of pending offline transactions when the connection is restored.
 */
export function useSync() {
  const syncPending = useTransactionStore((s) => s.syncPending);
  const pendingCount = useTransactionStore((s) => s.pendingCount);
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;

      if (!isConnected) {
        wasOffline.current = true;
        return;
      }

      if (wasOffline.current || pendingCount > 0) {
        wasOffline.current = false;
        syncPending().catch(console.warn);
      }
    });

    return () => unsubscribe();
  }, [pendingCount, syncPending]);

  return { pendingCount };
}
