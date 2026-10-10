// src/app/product/[id].tsx — Detalle de producto.
// Solo presentación: la consulta y los estados vienen de useProduct y las reglas
// (variante inicial, agotado, descuento, descripción) de features/catalog/productDetail.
// El precio mostrado es `precio_final` del servidor; `precio_extra` no se suma
// porque el backend no confirma esa regla (ver PR).
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import ImageCarousel from "@/features/catalog/components/ImageCarousel";
import VariantSelector from "@/features/catalog/components/VariantSelector";
import { useProduct } from "@/features/catalog/hooks/useProduct";
import {
  cleanDescription,
  formatStock,
  getDiscountInfo,
  getGalleryImageUrls,
  getVisibleAttributes,
  isProductSoldOut,
  isVariantAvailable,
  pickInitialVariant,
} from "@/features/catalog/productDetail";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { radius, spacing, useColors } from "@/shared/theme/useColors";
import { formatPrice } from "@/shared/utils/format";

const CART_SOON = "Disponible próximamente: el carrito llegará en una próxima versión.";

export default function ProductDetailScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading, isError, error, refetch, notFound } = useProduct(id);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cartNotice, setCartNotice] = useState(false);

  const title = <Stack.Screen options={{ title: "Producto" }} />;

  if (notFound) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="cube-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>Producto no encontrado</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>
          Es posible que ya no esté disponible en el catálogo.
        </Text>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={[styles.primary, { backgroundColor: c.brandPrimary }]}
        >
          <Text style={styles.primaryText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <ActivityIndicator size="large" color={c.brandPrimary} />
        <Text style={[styles.hint, { color: c.textMuted }]}>Cargando producto…</Text>
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {title}
        <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
        <Text style={[styles.titleText, { color: c.text }]}>No pudimos cargar el producto</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>{apiErrorMessage(error)}</Text>
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

  const variantes = product.variantes ?? [];
  const soldOut = isProductSoldOut(product);
  const selected =
    variantes.find((v) => v.id === selectedId && isVariantAvailable(v)) ?? pickInitialVariant(variantes);
  const discount = getDiscountInfo(product);
  const description = cleanDescription(product.descripcion);
  const attributes = getVisibleAttributes(product.atributos);
  const stockVariant = selected ?? (variantes.length === 1 ? variantes[0] : null);

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {title}
      <ScrollView contentContainerStyle={styles.scroll}>
        <ImageCarousel urls={getGalleryImageUrls(product.imagenes)} label={product.nombre} />

        <View style={styles.body}>
          {product.marca ? (
            <Text style={[styles.brand, { color: c.textMuted }]}>{product.marca.nombre}</Text>
          ) : null}
          <Text style={[styles.name, { color: c.text }]} accessibilityRole="header">
            {product.nombre}
          </Text>
          {product.modelo ? (
            <Text style={[styles.model, { color: c.textMuted }]}>Modelo: {product.modelo}</Text>
          ) : null}

          <View
            style={styles.priceRow}
            accessible
            accessibilityLabel={
              discount
                ? `Precio ${formatPrice(product.precio_final)}, antes ${formatPrice(discount.precioAnterior)}${
                    discount.porcentaje ? `, ${discount.porcentaje} por ciento de descuento` : ""
                  }`
                : `Precio ${formatPrice(product.precio_final)}`
            }
          >
            <Text style={[styles.price, { color: c.brandDeep }]}>{formatPrice(product.precio_final)}</Text>
            {discount ? (
              <>
                <Text style={[styles.oldPrice, { color: c.textMuted }]}>
                  {formatPrice(discount.precioAnterior)}
                </Text>
                {discount.porcentaje ? (
                  <View style={[styles.badge, { backgroundColor: c.danger }]}>
                    <Text style={styles.badgeText}>-{discount.porcentaje}%</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>

          {product.envio_gratis ? (
            <View style={styles.shipping} accessibilityLabel="Envío gratis" accessible>
              <Ionicons name="car-outline" size={18} color={c.brandPrimary} />
              <Text style={{ color: c.brandPrimary, fontWeight: "700", fontSize: 13 }}>Envío gratis</Text>
            </View>
          ) : null}

          {variantes.length > 1 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Variante</Text>
              <VariantSelector
                variantes={variantes}
                selectedId={selected?.id ?? null}
                onSelect={(v) => setSelectedId(v.id)}
              />
            </View>
          ) : null}

          <Text
            style={[styles.stock, { color: soldOut ? c.danger : c.textMuted }]}
            accessibilityLiveRegion="polite"
          >
            {soldOut ? "Producto agotado" : stockVariant ? formatStock(stockVariant.stock) : ""}
          </Text>

          {description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Descripción</Text>
              <Text style={[styles.description, { color: c.text }]}>{description}</Text>
            </View>
          ) : null}

          {attributes.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Especificaciones</Text>
              {attributes.map((a, i) => (
                <View
                  key={`${a.nombre}-${i}`}
                  style={[styles.attr, { borderColor: c.divider }]}
                  accessible
                  accessibilityLabel={`${a.nombre}: ${a.valor}`}
                >
                  <Text style={[styles.attrName, { color: c.textMuted }]}>{a.nombre}</Text>
                  <Text style={[styles.attrValue, { color: c.text }]}>{a.valor}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: c.card, borderColor: c.border }]}>
        {cartNotice && !soldOut ? (
          <Text style={[styles.notice, { color: c.textMuted }]} accessibilityRole="alert">
            {CART_SOON}
          </Text>
        ) : null}
        <Pressable
          onPress={() => setCartNotice(true)}
          disabled={soldOut}
          accessibilityRole="button"
          accessibilityLabel={soldOut ? "Agregar al carrito, producto agotado" : "Agregar al carrito"}
          accessibilityState={{ disabled: soldOut }}
          style={[styles.primary, styles.cta, { backgroundColor: soldOut ? c.border : c.brandPrimary }]}
        >
          <Ionicons name="cart-outline" size={20} color={soldOut ? c.textMuted : "#fff"} />
          <Text style={[styles.primaryText, soldOut && { color: c.textMuted }]}>
            {soldOut ? "Agotado" : "Agregar al carrito"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  titleText: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  hint: { fontSize: 13, textAlign: "center" },
  body: { padding: spacing.lg, gap: spacing.sm },
  brand: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  name: { fontSize: 20, fontWeight: "800" },
  model: { fontSize: 13 },
  priceRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: spacing.sm, marginTop: spacing.sm },
  price: { fontSize: 26, fontWeight: "800" },
  oldPrice: { fontSize: 15, textDecorationLine: "line-through" },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  shipping: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  section: { gap: spacing.sm, marginTop: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  stock: { fontSize: 13, fontWeight: "600", marginTop: spacing.xs },
  description: { fontSize: 14, lineHeight: 21 },
  attr: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  attrName: { fontSize: 13, flex: 1 },
  attrValue: { fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" },
  footer: { padding: spacing.lg, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  notice: { fontSize: 12, textAlign: "center" },
  primary: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999, marginTop: spacing.sm },
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: 0 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
