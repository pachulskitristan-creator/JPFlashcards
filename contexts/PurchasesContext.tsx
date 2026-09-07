// contexts/PurchasesContext.tsx
// Shared Pro-entitlement state — previously each screen that cared
// (just Settings) called isPro() itself with a one-shot state, so
// HomeScreen's range gate and the study screens' daily-cap check had
// no way to know it. Subscribes to RevenueCat's own customerInfo
// listener (the SDK's real-time push, not polling) so entitlement
// changes the instant a purchase/restore completes anywhere in the app.

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { isPurchasesConfigured, hasProEntitlement, isPro as fetchIsPro } from '../services/purchasesService';
import { PRO_ENTITLEMENT_ID } from '../config/revenueCatConfig';
import { useAuth } from './AuthContext';

interface PurchasesContextValue {
  isPro: boolean;
  loading: boolean;
  /** Presents RevenueCat's hosted paywall; resolves true if it resulted in an active Pro entitlement. */
  presentPaywall: () => Promise<boolean>;
}

const PurchasesContext = createContext<PurchasesContextValue | undefined>(undefined);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  // RevenueCat starts every install on an anonymous, random appUserID.
  // Logging in with the Supabase user's id attaches purchases to that
  // account instead, so restoring on a new device (or reinstalling)
  // just requires signing back in. Tracked in a ref, not state, purely
  // to detect the transition without re-running on every render.
  const loggedInUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isPurchasesConfigured()) {
      setLoading(false);
      return;
    }

    fetchIsPro().then((pro) => {
      setIsPro(pro);
      setLoading(false);
    });

    const listener = (info: CustomerInfo) => setIsPro(hasProEntitlement(info));
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  useEffect(() => {
    if (!isPurchasesConfigured()) return;
    const uid = session?.user?.id ?? null;
    if (uid === loggedInUserId.current) return;

    (async () => {
      try {
        if (uid) {
          const { customerInfo } = await Purchases.logIn(uid);
          setIsPro(hasProEntitlement(customerInfo));
        } else if (loggedInUserId.current) {
          const customerInfo = await Purchases.logOut();
          setIsPro(hasProEntitlement(customerInfo));
        }
        loggedInUserId.current = uid;
      } catch (e) {
        console.warn('Failed to sync RevenueCat identity with the account', e);
      }
    })();
  }, [session?.user?.id]);

  const presentPaywall = async () => {
    if (!isPurchasesConfigured()) return false;
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
    });
    const nowPro = result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
    if (nowPro) setIsPro(true);
    return nowPro;
  };

  const value = useMemo(() => ({ isPro, loading, presentPaywall }), [isPro, loading]);

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): PurchasesContextValue {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used within a PurchasesProvider');
  return ctx;
}
