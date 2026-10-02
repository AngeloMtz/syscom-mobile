// src/app/profile/personal-data.tsx — Datos personales: ver y editar.
// Equivale a /client/account/update-data de la web. El correo se muestra pero
// no se puede modificar, igual que allá.
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SubmitButton } from "@/features/auth/components/AuthScaffold";
import RequireAuth from "@/features/auth/components/RequireAuth";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";
import type { Profile, UpdateProfileDTO } from "@/features/profile/types";
import { validateProfile, type ProfileErrors } from "@/features/profile/validation";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { radius, spacing, useColors } from "@/shared/theme/useColors";
import FormField from "@/shared/ui/FormField";

/** Carga el perfil y resuelve los estados; el formulario se monta ya con datos. */
function PersonalData() {
  const c = useColors();
  const { data: perfil, isPending, isError, error: errorCarga, refetch } = useProfile();

  if (isPending) {
    return (
      <View style={[styles.centro, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.brandPrimary} size="large" />
        <Text style={{ color: c.textMuted, marginTop: spacing.md, fontSize: 13 }}>
          Cargando tus datos…
        </Text>
      </View>
    );
  }

  if (isError || !perfil) {
    return (
      <View style={[styles.centro, { backgroundColor: c.background }]}>
        <Text
          style={{ color: c.danger, fontSize: 14, textAlign: "center", marginBottom: spacing.lg }}
          accessibilityLiveRegion="polite"
        >
          {apiErrorMessage(errorCarga, "No pudimos cargar tus datos personales.")}
        </Text>
        <SubmitButton label="Intentar de nuevo" onPress={() => refetch()} />
      </View>
    );
  }

  return <PersonalDataForm perfil={perfil} />;
}

/**
 * Formulario de datos personales. Recibe el perfil ya cargado para inicializar
 * el estado en el primer render, sin sincronizarlo desde un efecto.
 */
function PersonalDataForm({ perfil }: { perfil: Profile }) {
  const c = useColors();
  const guardar = useUpdateProfile();

  const [datos, setDatos] = useState<UpdateProfileDTO>(() => ({
    nombre: perfil.nombre ?? "",
    apellido_paterno: perfil.apellido_paterno ?? "",
    apellido_materno: perfil.apellido_materno ?? "",
    telefono: perfil.telefono ?? "",
  }));
  const [errores, setErrores] = useState<ProfileErrors>({});
  const [guardado, setGuardado] = useState(false);

  const refPaterno = useRef<TextInput>(null);
  const refMaterno = useRef<TextInput>(null);
  const refTelefono = useRef<TextInput>(null);

  const set = (campo: keyof UpdateProfileDTO) => (valor: string) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setGuardado(false);
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  // Sin cambios no hay nada que guardar, igual que en la web.
  const hayCambios =
    datos.nombre !== (perfil.nombre ?? "") ||
    datos.apellido_paterno !== (perfil.apellido_paterno ?? "") ||
    datos.apellido_materno !== (perfil.apellido_materno ?? "") ||
    datos.telefono !== (perfil.telefono ?? "");

  const enviar = async () => {
    const limpio: UpdateProfileDTO = {
      nombre: datos.nombre.trim(),
      apellido_paterno: datos.apellido_paterno.trim(),
      apellido_materno: datos.apellido_materno.trim(),
      telefono: datos.telefono,
    };
    const e = validateProfile(limpio);
    setErrores(e);
    if (Object.values(e).some(Boolean)) return;

    guardar.reset();
    try {
      await guardar.mutateAsync(limpio);
      setGuardado(true);
    } catch {
      // El mensaje queda en guardar.error.
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {guardar.error ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: c.danger + "14", borderColor: c.danger + "40" },
            ]}
            accessibilityLiveRegion="assertive"
          >
            <Ionicons name="alert-circle" size={17} color={c.danger} />
            <Text style={{ color: c.danger, flex: 1, fontSize: 13, lineHeight: 18 }}>
              {apiErrorMessage(guardar.error, "No se pudieron guardar los cambios.")}
            </Text>
          </View>
        ) : null}

        {guardado ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: c.success + "14", borderColor: c.success + "40" },
            ]}
            accessibilityLiveRegion="polite"
          >
            <Ionicons name="checkmark-circle" size={17} color={c.success} />
            <Text style={{ color: c.success, flex: 1, fontSize: 13 }}>
              Tus datos se actualizaron correctamente.
            </Text>
          </View>
        ) : null}

        {/* Correo: visible, no editable (el backend no lo acepta en PUT /profile) */}
        <View style={{ marginBottom: spacing.md }}>
          <Text style={[styles.label, { color: c.textMuted }]}>Correo electrónico</Text>
          <View style={[styles.correoCaja, { backgroundColor: c.divider, borderColor: c.border }]}>
            <Ionicons name="mail-outline" size={18} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontSize: 15, flex: 1 }} accessibilityLabel={`Correo electrónico ${perfil.correo}, no se puede modificar`}>
              {perfil.correo}
            </Text>
            {perfil.email_verified ? (
              <Ionicons name="checkmark-circle" size={17} color={c.success} />
            ) : null}
          </View>
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>
            El correo no se puede modificar
          </Text>
        </View>

        <FormField
          label="Nombre"
          icon="person-outline"
          placeholder="Juan"
          value={datos.nombre}
          onChangeText={set("nombre")}
          error={errores.nombre}
          hint="Entre 4 y 25 caracteres"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => refPaterno.current?.focus()}
          editable={!guardar.isPending}
          maxLength={25}
        />

        <FormField
          ref={refPaterno}
          label="Apellido paterno"
          icon="person-outline"
          placeholder="García"
          value={datos.apellido_paterno}
          onChangeText={set("apellido_paterno")}
          error={errores.apellido_paterno}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => refMaterno.current?.focus()}
          editable={!guardar.isPending}
          maxLength={100}
        />

        <FormField
          ref={refMaterno}
          label="Apellido materno"
          icon="person-outline"
          placeholder="López"
          value={datos.apellido_materno}
          onChangeText={set("apellido_materno")}
          error={errores.apellido_materno}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => refTelefono.current?.focus()}
          editable={!guardar.isPending}
          maxLength={100}
        />

        <FormField
          ref={refTelefono}
          label="Teléfono"
          icon="call-outline"
          prefix="+52"
          placeholder="7711234567"
          value={datos.telefono}
          onChangeText={(t) => set("telefono")(t.replace(/\D/g, ""))}
          error={errores.telefono}
          keyboardType="phone-pad"
          returnKeyType="go"
          onSubmitEditing={enviar}
          editable={!guardar.isPending}
          maxLength={10}
        />

        <SubmitButton
          label="Guardar cambios"
          onPress={enviar}
          loading={guardar.isPending}
          disabled={!hayCambios}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function PersonalDataScreen() {
  return (
    <RequireAuth>
      <PersonalData />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  correoCaja: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
});
