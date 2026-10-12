// src/features/payments/components/PaymentsProvider.tsx — StripeProvider de la app.
// Solo se monta con una clave publicable válida (pk_...). Sin ella, el pago
// queda deshabilitado con un mensaje claro y la app funciona igual.
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import * as Linking from "expo-linking";
import { useEffect, type ReactNode } from "react";

import {
  STRIPE_PUBLISHABLE_KEY,
  getUrlScheme,
} from "@/features/payments/paymentConfig";
import { isStripeConfigured } from "@/features/payments/paymentSelectors";

/** Reenvía al SDK los retornos por enlace (3DS, redirecciones), como indica Stripe. */
function StripeLinkHandler() {
  const { handleURLCallback } = useStripe();

  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      void handleURLCallback(url);
    });
    return () => sub.remove();
  }, [handleURLCallback]);

  return null;
}

export default function PaymentsProvider({ children }: { children: ReactNode }) {
  if (!isStripeConfigured(STRIPE_PUBLISHABLE_KEY)) return <>{children}</>;

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY as string} urlScheme={getUrlScheme()}>
      <StripeLinkHandler />
      <>{children}</>
    </StripeProvider>
  );
}
