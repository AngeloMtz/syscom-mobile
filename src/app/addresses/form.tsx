// src/app/addresses/form.tsx — Crear o editar una dirección.
// Con `?id=` edita esa dirección; sin id crea una nueva. La validación local usa
// las reglas del backend y los errores 400 del servidor se muestran por campo.
// Guardar deja la dirección disponible para compras futuras (queda en la cuenta).
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { addressErrorMessage, mapServerFieldErrors } from "@/features/addresses/addressErrors";
import { addressToInput } from "@/features/addresses/addressSelectors";
import { toCreatePayload, toUpdatePayload } from "@/features/addresses/addressValidation";
import AddressForm from "@/features/addresses/components/AddressForm";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { useCreateAddress } from "@/features/addresses/hooks/useCreateAddress";
import { useUpdateAddress } from "@/features/addresses/hooks/useUpdateAddress";
import type { AddressErrors, AddressInput } from "@/features/addresses/types";
import RequireAuth from "@/features/auth/components/RequireAuth";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

function AddressFormScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = id && /^\d+$/.test(id) ? Number(id) : null;

  const { data: addresses, isLoading, isError, error, refetch } = useAddresses();
  const create = useCreateAddress();
  const update = useUpdateAddress();

  const [serverErrors, setServerErrors] = useState<AddressErrors>({});
  const [general, setGeneral] = useState<string | null>(null);

  const title = <Stack.Screen options={{ title: editId ? "Editar dirección" : "Nueva dirección" }} />;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/addresses"));

  const editing = editId !== null ? addresses?.find((a) => a.id_direccion === editId) : undefined;

  if (editId !== null && isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <ActivityIndicator size="large" color={c.brandPrimary} />
      </View>
    );
  }

  if (editId !== null && isError && !addresses) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Text style={[styles.titleText, { color: c.text }]}>No pudimos cargar la dirección</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>{addressErrorMessage(error)}</Text>
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (editId !== null && !editing) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Text style={[styles.titleText, { color: c.text }]}>Dirección no encontrada</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>Es posible que ya se haya eliminado.</Text>
        <Pressable
          onPress={back}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const submitting = create.isPending || update.isPending;

  const onSubmit = async (input: AddressInput) => {
    setServerErrors({});
    setGeneral(null);
    try {
      if (editId !== null) {
        await update.mutateAsync({ id: editId, payload: toUpdatePayload(input) });
      } else {
        await create.mutateAsync(toCreatePayload(input));
      }
      back();
    } catch (e) {
      const { fields, general: message } = mapServerFieldErrors(e);
      setServerErrors(fields);
      setGeneral(message ?? null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {title}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {general ? (
          <View
            style={[styles.banner, { backgroundColor: c.danger + "14", borderColor: c.danger + "40" }]}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text style={{ color: c.danger, fontSize: 13, lineHeight: 18 }}>{general}</Text>
          </View>
        ) : null}

        <AddressForm
          initial={editing ? addressToInput(editing) : undefined}
          submitLabel={editId !== null ? "Guardar cambios" : "Guardar dirección"}
          submitting={submitting}
          serverErrors={serverErrors}
          onSubmit={onSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function AddressFormRoute() {
  return (
    <RequireAuth>
      <AddressFormScreen />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  banner: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  primary: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  primaryText: { color: "#fff", fontWeight: "700" },
});
