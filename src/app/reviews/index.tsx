// src/app/reviews/index.tsx — Mis reseñas (HU #19). Exige sesión.
// Solo presentación: la consulta, el filtro por producto y los estados (carga, error, vacío) viven en
// MyReviewsList y useMyReviews. Las reseñas se escriben desde el detalle de un producto o de un pedido.
import { Stack } from "expo-router";

import RequireAuth from "@/features/auth/components/RequireAuth";
import MyReviewsList from "@/features/reviews/components/MyReviewsList";

export default function MyReviewsScreen() {
  return (
    <RequireAuth>
      <Stack.Screen options={{ title: "Mis reseñas" }} />
      <MyReviewsList />
    </RequireAuth>
  );
}
