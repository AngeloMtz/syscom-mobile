// src/app/(tabs)/index.tsx — Home estilo marketplace (HU #104).
// Solo presentación: los datos y estados vienen de los hooks de cada feature.
// Secciones: carrusel de banners, categorías, destacados, marcas (cada una abre
// su catálogo) y CTA de contacto. Con estados de carga, error con "Reintentar",
// vacío y actualización por pull-to-refresh.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useBrands } from "@/features/catalog/hooks/useBrands";
import { useRootCategories } from "@/features/catalog/hooks/useCategories";
import { useFeaturedProducts } from "@/features/catalog/hooks/useFeaturedProducts";
import { useOnSaleProducts } from "@/features/catalog/hooks/useOnSaleProducts";
import { useProductsPreview } from "@/features/catalog/hooks/useProductsPreview";
import { useServicesPreview } from "@/features/services/hooks/useServicesPreview";
import { getServiceImageUrl } from "@/features/services/selectors";
import OnSaleSection from "@/features/catalog/components/OnSaleSection";
import ProductCard from "@/features/catalog/components/ProductCard";
import type { Brand, Category, ProductListItem } from "@/features/catalog/types";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useInstitutionalContent, useSliders } from "@/features/institutional/hooks/useInstitutional";
import BannerCarousel from "@/shared/ui/BannerCarousel";
import SectionTitle from "@/shared/ui/SectionTitle";
import { brand, cardShadow, radius, spacing, useColors } from "@/shared/theme/useColors";
import { resolveAssetUrl } from "@/shared/utils/url";
import { useAuthStore } from "@/shared/store/authStore";

const { width } = Dimensions.get("window");
const FEATURED_W = 158;
const BRAND_W = (width - spacing.lg * 2 - spacing.md * 3) / 4;
// Dos columnas: ancho de pantalla menos gutters laterales y espacio central.
const GRID_W = (width - spacing.lg * 2 - spacing.md) / 2;
const TELEFONO_FALLBACK = "+52 771 000 0000";

export default function HomeScreen() {
  const c = useColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const sliders = useSliders();
  const categories = useRootCategories();
  const featured = useFeaturedProducts(8);
  const ofertas = useOnSaleProducts();
  const brands = useBrands();
  const productos = useProductsPreview(6);
  const servicios = useServicesPreview(6);
  const info = useInstitutionalContent();
  // Con sesión, la inicial sale del perfil (como en otras pantallas).
  const { data: perfil } = useProfile();

  // El contenido principal son categorías, destacados, marcas y productos; los
  // banners y el contacto son secundarios y no bloquean el estado de la pantalla.
  const nucleo = [categories, featured, brands, productos];
  const cargando = nucleo.some((q) => q.isLoading);
  const errorTotal = nucleo.every((q) => q.isError);
  const sinContenido =
    !cargando &&
    !errorTotal &&
    (categories.data?.length ?? 0) === 0 &&
    (featured.data?.length ?? 0) === 0 &&
    (brands.data?.length ?? 0) === 0 &&
    (productos.data?.length ?? 0) === 0;

  const refreshing =
    sliders.isRefetching ||
    categories.isRefetching ||
    featured.isRefetching ||
    ofertas.isRefetching ||
    brands.isRefetching ||
    productos.isRefetching ||
    servicios.isRefetching ||
    info.isRefetching;

  const reloadAll = () => {
    sliders.refetch();
    categories.refetch();
    featured.refetch();
    ofertas.refetch();
    brands.refetch();
    productos.refetch();
    servicios.refetch();
    info.refetch();
  };

  const inicial = (perfil?.nombre ?? user?.nombre ?? "").charAt(0).toUpperCase();

  const bannerImgs = (sliders.data ?? [])
    .map((s) => resolveAssetUrl(s.imagen_url ?? s.url_imagen ?? s.imagen))
    .filter((u): u is string => !!u);

  const telefono = (info.data?.telefono as string) ?? TELEFONO_FALLBACK;
  const whatsapp = telefono.replace(/[^\d]/g, "");

  const openProduct = (p: ProductListItem) =>
    router.push({ pathname: "/product/[id]", params: { id: String(p.id) } });
  const openCategory = (cat: Category) =>
    router.push({ pathname: "/catalog/[categoryId]", params: { categoryId: String(cat.id), nombre: cat.nombre } });
  const openBrand = (b: Brand) =>
    router.push({ pathname: "/catalog/brand/[brandId]", params: { brandId: String(b.id), nombre: b.nombre } });

  const header = (
    <View style={styles.topBar}>
      <Pressable
        onPress={() => router.push("/search")}
        accessibilityRole="search"
        accessibilityLabel="Buscar productos"
        style={[styles.searchFake, { backgroundColor: c.card, flex: 1 }, cardShadow]}
      >
        <Ionicons name="search" size={19} color={c.textMuted} />
        <Text style={{ color: c.textMuted, fontSize: 15 }}>Buscar productos…</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push(isAuthenticated ? "/(tabs)/more" : "/(auth)/login")}
        accessibilityRole="button"
        accessibilityLabel={isAuthenticated ? "Mi cuenta" : "Iniciar sesión"}
        style={({ pressed }) => [
          styles.cuentaBtn,
          { backgroundColor: isAuthenticated ? c.brandDeep : c.card, opacity: pressed ? 0.85 : 1 },
          cardShadow,
        ]}
      >
        {isAuthenticated && inicial ? (
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>{inicial}</Text>
        ) : (
          <Ionicons name="person-outline" size={21} color={isAuthenticated ? "#fff" : c.brandDeep} />
        )}
      </Pressable>
    </View>
  );

  // Estado de carga inicial.
  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        {header}
        <View style={styles.centro}>
          <Ionicons name="home-outline" size={40} color={c.brandPrimary} />
          <Text style={{ color: c.textMuted, marginTop: spacing.md }}>Cargando inicio…</Text>
        </View>
      </View>
    );
  }

  // Estado de error (todo el contenido principal falló).
  if (errorTotal) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        {header}
        <View style={styles.centro}>
          <Ionicons name="cloud-offline-outline" size={44} color={c.textMuted} />
          <Text style={[styles.errTitle, { color: c.text }]}>No pudimos cargar el inicio</Text>
          <Text style={[styles.errHint, { color: c.textMuted }]}>Revisa tu conexión e intenta de nuevo.</Text>
          <Pressable
            onPress={reloadAll}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
            style={[styles.retry, { backgroundColor: c.brandPrimary }]}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reloadAll} />}
    >
      {header}

      {sinContenido ? (
        <View style={styles.centro}>
          <Ionicons name="cube-outline" size={44} color={c.textMuted} />
          <Text style={[styles.errTitle, { color: c.text }]}>Aún no hay contenido</Text>
          <Text style={[styles.errHint, { color: c.textMuted }]}>Desliza hacia abajo para actualizar.</Text>
        </View>
      ) : (
        <>
          {/* Carrusel de banners (deslizable) o hero de respaldo */}
          <View style={{ marginTop: spacing.lg, paddingHorizontal: spacing.lg }}>
            {bannerImgs.length > 0 ? (
              <BannerCarousel images={bannerImgs} />
            ) : (
              <View style={styles.hero}>
                <Text style={styles.heroTitle}>Tecnología y seguridad</Text>
                <Text style={styles.heroSub}>Equipo profesional y servicios SYSCOM</Text>
                <Pressable style={styles.heroBtn} onPress={() => router.push("/(tabs)/catalog")}>
                  <Text style={{ color: brand.deep, fontWeight: "800", fontSize: 13 }}>Ver catálogo</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Categorías */}
          {(categories.data?.length ?? 0) > 0 ? (
            <View style={{ marginTop: spacing.xl }}>
              <Text style={[styles.h2, { color: c.text, paddingHorizontal: spacing.lg }]}>Categorías</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.md }}
              >
                {categories.data!.slice(0, 12).map((cat) => {
                  const img = resolveAssetUrl(cat.imagen_url);
                  return (
                    <Pressable key={cat.id} style={styles.cat} onPress={() => openCategory(cat)}>
                      <View style={[styles.catIcon, { backgroundColor: c.brandPrimary + "14" }]}>
                        {img ? (
                          <Image source={{ uri: img }} style={styles.catImg} resizeMode="contain" />
                        ) : (
                          <Ionicons name="pricetag-outline" size={24} color={c.brandPrimary} />
                        )}
                      </View>
                      <Text style={[styles.catLabel, { color: c.text }]} numberOfLines={2}>
                        {cat.nombre}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Ofertas: se oculta si no hay promociones vigentes (o si la consulta falla) */}
          <OnSaleSection
            products={(ofertas.data ?? []).slice(0, 8)}
            onSeeAll={() => router.push("/promociones")}
            onOpenProduct={openProduct}
          />

          {/* Destacados */}
          {(featured.data?.length ?? 0) > 0 ? (
            <View style={{ marginTop: spacing.xl }}>
              <View style={{ paddingHorizontal: spacing.lg }}>
                <SectionTitle title="Destacados" action="Ver todo" onAction={() => router.push("/(tabs)/catalog")} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
              >
                {featured.data!.map((p) => (
                  <View key={p.id} style={{ width: FEATURED_W }}>
                    <ProductCard product={p} onPress={openProduct} />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Marcas: al tocar, abre el catálogo de esa marca */}
          {(brands.data?.length ?? 0) > 0 ? (
            <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
              <Text style={[styles.h2, { color: c.text, marginBottom: spacing.md }]}>Marcas</Text>
              <View style={styles.brandGrid}>
                {brands.data!.slice(0, 8).map((b) => {
                  const logo = resolveAssetUrl(b.logo_url);
                  return (
                    <Pressable
                      key={b.id}
                      onPress={() => openBrand(b)}
                      accessibilityRole="button"
                      accessibilityLabel={`Marca ${b.nombre}`}
                      style={({ pressed }) => [
                        styles.brandCard,
                        { backgroundColor: c.card, opacity: pressed ? 0.85 : 1 },
                        cardShadow,
                      ]}
                    >
                      {logo ? (
                        <Image source={{ uri: logo }} style={styles.brandLogo} resizeMode="contain" />
                      ) : (
                        <Text style={[styles.brandName, { color: c.text }]} numberOfLines={1}>
                          {b.nombre}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Servicios: acceso al listado completo */}
          {(servicios.data?.length ?? 0) > 0 ? (
            <View style={{ marginTop: spacing.xl }}>
              <View style={{ paddingHorizontal: spacing.lg }}>
                <SectionTitle title="Servicios" action="Ver todo" onAction={() => router.push("/(tabs)/services")} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
              >
                {servicios.data!.map((s) => {
                  const img = getServiceImageUrl(s);
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => router.push({ pathname: "/service/[id]", params: { id: String(s.id) } })}
                      accessibilityRole="button"
                      accessibilityLabel={s.nombre}
                      style={({ pressed }) => [
                        styles.serviceCard,
                        cardShadow,
                        { backgroundColor: c.card, opacity: pressed ? 0.9 : 1 },
                      ]}
                    >
                      <View style={[styles.serviceMedia, { backgroundColor: c.divider }]}>
                        {img ? (
                          <Image source={{ uri: img }} style={styles.serviceImg} resizeMode="cover" />
                        ) : (
                          <Ionicons name="construct" size={28} color={c.brandPrimary} />
                        )}
                      </View>
                      <Text style={[styles.serviceName, { color: c.text }]} numberOfLines={2}>
                        {s.nombre}
                      </Text>
                      {s.duracion_estimada ? (
                        <Text style={{ color: c.textMuted, fontSize: 11 }} numberOfLines={1}>
                          {s.duracion_estimada}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* CTA de contacto */}
          <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
            <View style={styles.ctaCard}>
              <Ionicons name="headset" size={30} color="#fff" />
              <Text style={styles.ctaTitle}>¿Necesitas asesoría?</Text>
              <Text style={styles.ctaSub}>
                Nuestro equipo te ayuda a encontrar la solución para tu negocio.
              </Text>
              <Pressable
                style={styles.ctaBtn}
                onPress={() => Linking.openURL(`https://wa.me/${whatsapp}`).catch(() => {})}
                accessibilityRole="button"
                accessibilityLabel="Contáctanos por WhatsApp"
              >
                <Ionicons name="logo-whatsapp" size={16} color={brand.deep} />
                <Text style={{ color: brand.deep, fontWeight: "800" }}>Contáctanos</Text>
              </Pressable>
            </View>
          </View>

          {/* Acceso a la información institucional (HU #105) */}
          <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
            <Pressable
              onPress={() => router.push("/informacion")}
              accessibilityRole="button"
              accessibilityLabel="Información de SYSCOM"
              style={({ pressed }) => [styles.infoCard, cardShadow, { backgroundColor: c.card, opacity: pressed ? 0.9 : 1 }]}
            >
              <View style={[styles.infoIcon, { backgroundColor: c.brandPrimary + "18" }]}>
                <Ionicons name="business-outline" size={22} color={c.brandPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: "800", fontSize: 15 }}>Conoce SYSCOM</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 1 }}>
                  Nosotros, políticas, preguntas frecuentes y contacto
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
            </Pressable>
          </View>

          {/* Nuestros productos: cuadrícula de 2 columnas */}
          {(productos.data?.length ?? 0) > 0 ? (
            <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
              <SectionTitle
                title="Nuestros productos"
                action="Ver todos"
                onAction={() => router.push("/(tabs)/catalog")}
              />
              <View style={styles.grid}>
                {productos.data!.map((p) => (
                  <View key={p.id} style={{ width: GRID_W }}>
                    <ProductCard product={p} onPress={openProduct} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // El header nativo de la tab "Inicio" ya cubre el safe-area; aquí solo se
  // separa el buscador. Sube/baja este paddingTop para ajustar ese espacio.
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchFake: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
  },
  cuentaBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm, minHeight: 320 },
  errTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  errHint: { fontSize: 13, textAlign: "center" },
  retry: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "700" },
  hero: { backgroundColor: brand.deep, padding: spacing.xl, borderRadius: radius.lg },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  heroSub: { color: "#cfe3ff", fontSize: 13, marginTop: 4 },
  heroBtn: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  h2: { fontSize: 18, fontWeight: "800" },
  cat: { width: 76, alignItems: "center" },
  catIcon: {
    width: 62,
    height: 62,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  catImg: { width: "70%", height: "70%" },
  catLabel: { fontSize: 11, fontWeight: "600", textAlign: "center", marginTop: 6 },
  brandGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  brandCard: {
    width: BRAND_W,
    height: 60,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  brandLogo: { width: "100%", height: "100%" },
  brandName: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  ctaCard: { backgroundColor: brand.deep, borderRadius: radius.lg, padding: spacing.xl, alignItems: "center" },
  ctaTitle: { color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "center", marginTop: spacing.sm },
  ctaSub: { color: "#cfe3ff", fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 19 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  infoIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  serviceCard: { width: 150, borderRadius: radius.lg, overflow: "hidden", paddingBottom: spacing.sm },
  serviceMedia: { height: 92, alignItems: "center", justifyContent: "center" },
  serviceImg: { width: "100%", height: "100%" },
  serviceName: { fontSize: 13, fontWeight: "700", marginTop: spacing.sm, paddingHorizontal: spacing.sm },
});

