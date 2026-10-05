// src/app/catalog/[categoryId].tsx — Listado de productos de una categoría.
// Destino del tap en una categoría (#6). El listado real llega con el issue #7;
// mientras tanto muestra la categoría elegida para dejar la navegación completa.
import { Stack, useLocalSearchParams } from "expo-router";

import ScreenPlaceholder from "@/shared/ui/ScreenPlaceholder";

export default function CategoryProductsScreen() {
  const { categoryId, nombre } = useLocalSearchParams<{ categoryId: string; nombre?: string }>();

  return (
    <>
      <Stack.Screen options={{ title: nombre ?? "Categoría" }} />
      <ScreenPlaceholder
        title={nombre ?? "Categoría"}
        hint={`Categoría #${categoryId}. El listado de productos llega en el issue #7.`}
      />
    </>
  );
}
