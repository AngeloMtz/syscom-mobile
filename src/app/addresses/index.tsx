// src/app/addresses/index.tsx — Mis direcciones / elegir dirección de envío.
// Solo presentación: la lista viene de useAddresses y las reglas (cuál es la
// elegida, formato) de features/addresses. Con `?select=1` (desde el carrito)
// elegir una vuelve a la pantalla anterior. Exige sesión.
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { addressErrorMessage } from "@/features/addresses/addressErrors";
import { formatAddressLine, resolveSelectedAddress } from "@/features/addresses/addressSelectors";
import { useCheckoutStore } from "@/features/addresses/checkoutStore";
import AddressCard from "@/features/addresses/components/AddressCard";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { useDeleteAddress } from "@/features/addresses/hooks/useDeleteAddress";
import type { Address } from "@/features/addresses/types";
import RequireAuth from "@/features/auth/components/RequireAuth";
import { spacing, useColors } from "@/shared/theme/useColors";

function AddressesList() {
  const c = useColors();
  const { select } = useLocalSearchParams<{ select?: string }>();
  const selectMode = select === "1";

  const { data, isLoading, isError, error, refetch, isRefetching } = useAddresses();
  const selectedId = useCheckoutStore((s) => s.selectedAddressId);
  const selectAddress = useCheckoutStore((s) => s.selectAddress);
  const remove = useDeleteAddress();

  const title = <Stack.Screen options={{ title: selectMode ? "Dirección de envío" : "Mis direcciones" }} />;
  const addNew = () => router.push("/addresses/form");

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Cargando tus direcciones…</Text>
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>No pudimos cargar tus direcciones</Text>
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

  const addresses = data ?? [];
  const current = resolveSelectedAddress(addresses, selectedId);

  const onSelect = (address: Address) => {
    selectAddress(address.id_direccion);
    if (selectMode) router.back();
  };

  const onDelete = (address: Address) => {
    Alert.alert("Eliminar dirección", `¿Quieres eliminar ${formatAddressLine(address)}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () =>
          remove.mutate(address.id_direccion, {
            onError: (e) => Alert.alert("No se pudo eliminar la dirección", addressErrorMessage(e)),
          }),
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {title}
      <FlatList
        data={addresses}
        keyExtractor={(a) => String(a.id_direccion)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <AddressCard
            address={item}
            selected={current?.id_direccion === item.id_direccion}
            onSelect={() => onSelect(item)}
            onEdit={() =>
              router.push({ pathname: "/addresses/form", params: { id: String(item.id_direccion) } })
            }
            onDelete={() => onDelete(item)}
          />
        )}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="location-outline" size={44} color={c.textMuted} />
            <Text style={[styles.titleText, { color: c.text }]}>Aún no tienes direcciones</Text>
            <Text style={[styles.hint, { color: c.textMuted }]}>
              Agrega una para recibir tus pedidos.
            </Text>
          </View>
        }
      />
      <View style={[styles.footer, { backgroundColor: c.card, borderColor: c.border }]}>
        <Pressable
          onPress={addNew}
          accessibilityRole="button"
          accessibilityLabel="Agregar dirección"
          style={[styles.primary, styles.cta, { backgroundColor: c.brandPrimary }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.primaryText}>Agregar dirección</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AddressesScreen() {
  return (
    <RequireAuth>
      <AddressesList />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  list: { padding: spacing.lg, flexGrow: 1 },
  footer: { padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
  primary: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
