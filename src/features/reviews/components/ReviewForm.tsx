// src/features/reviews/components/ReviewForm.tsx — Formulario de reseña (calificación, título y comentario).
// Valida con validateReview antes de entregar los valores; no sabe nada de la red. Evita el doble toque:
// mientras la entrega anterior sigue en curso, otro toque se ignora, y si falla conserva lo escrito.
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import RatingInput from "@/features/reviews/components/RatingInput";
import { COMMENT_MAX, COMMENT_MIN, TITLE_MAX, validateReview } from "@/features/reviews/reviewValidation";
import type { ReviewFormErrors, ReviewFormField, ReviewFormValues } from "@/features/reviews/types";
import FormField from "@/shared/ui/FormField";
import { radius, spacing, useColors } from "@/shared/theme/useColors";

type Props = {
  submitting: boolean;
  /** Mensaje del servidor del último intento (por ejemplo un 400). */
  serverError?: string | null;
  /** Puede ser asíncrona; si rechaza, el formulario se queda como está y permite reintentar. */
  onSubmit: (values: ReviewFormValues) => void | Promise<void>;
};

const EMPTY: ReviewFormValues = { calificacion: 0, titulo: "", comentario: "" };

export default function ReviewForm({ submitting, serverError, onSubmit }: Props) {
  const c = useColors();
  const [values, setValues] = useState<ReviewFormValues>(EMPTY);
  const [errors, setErrors] = useState<ReviewFormErrors>({});
  // true mientras la entrega anterior sigue en curso (evita el doble toque aunque el padre aún no re-renderice).
  const busy = useRef(false);

  const set = <K extends ReviewFormField>(field: K) => (value: ReviewFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async () => {
    if (busy.current || submitting) return;
    const found = validateReview(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    busy.current = true;
    try {
      await onSubmit(values);
    } catch {
      // El padre muestra el error; el formulario conserva lo escrito para reintentar.
    } finally {
      busy.current = false;
    }
  };

  return (
    <View>
      {serverError ? (
        <View
          style={[styles.banner, { backgroundColor: c.danger + "14", borderColor: c.danger + "40" }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Text style={{ color: c.danger, fontSize: 13, lineHeight: 18 }}>{serverError}</Text>
        </View>
      ) : null}

      <Text style={[styles.label, { color: c.text }]}>Calificación</Text>
      <RatingInput
        value={values.calificacion}
        onChange={set("calificacion")}
        disabled={submitting}
        error={errors.calificacion}
      />

      <FormField
        label="Título (opcional)"
        value={values.titulo}
        onChangeText={set("titulo")}
        error={errors.titulo}
        hint={`Hasta ${TITLE_MAX} caracteres`}
        returnKeyType="next"
        editable={!submitting}
        accessibilityLabel="Título"
      />
      <FormField
        label="Comentario"
        value={values.comentario}
        onChangeText={set("comentario")}
        error={errors.comentario}
        hint={`De ${COMMENT_MIN} a ${COMMENT_MAX} caracteres`}
        multiline
        textAlignVertical="top"
        style={styles.comment}
        editable={!submitting}
        accessibilityLabel="Comentario"
      />

      <Pressable
        onPress={() => {
          // No se devuelve la promesa: onPress no debe esperarla.
          submit();
        }}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Enviar reseña"
        accessibilityState={{ disabled: submitting, busy: submitting }}
        style={[styles.button, { backgroundColor: c.brandPrimary, opacity: submitting ? 0.6 : 1 }]}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar reseña</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "700", marginBottom: spacing.xs },
  comment: { minHeight: 110 },
  button: {
    marginTop: spacing.md,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
