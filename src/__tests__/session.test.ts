import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { queryClient } from "@/shared/api/queryClient";
import { TOKEN_KEY, clearToken, getTokenSync, restoreToken, saveToken } from "@/shared/api/secureToken";
import { isOnboardingCompleted, setOnboardingCompleted } from "@/shared/storage/onboarding";
import { useAuthStore } from "@/shared/store/authStore";
import { useOnboardingStore } from "@/shared/store/onboardingStore";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

const secure = SecureStore as jest.Mocked<typeof SecureStore>;
const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const user = { id: 1, nombre: "Angel" } as never;

beforeEach(async () => {
  jest.resetAllMocks();
  await clearToken();
  useAuthStore.setState({ user: null, isAuthenticated: false, isHydrating: true });
  useOnboardingStore.setState({ completed: false, isChecking: true });
  queryClient.clear();
});

afterEach(() => {
  queryClient.clear();
});

describe("secureToken", () => {
  it("guarda el JWT en SecureStore y en memoria", async () => {
    await saveToken("jwt-1");
    expect(secure.setItemAsync).toHaveBeenCalledWith(TOKEN_KEY, "jwt-1");
    expect(getTokenSync()).toBe("jwt-1");
  });
  it("restoreToken hidrata la memoria desde SecureStore", async () => {
    secure.getItemAsync.mockResolvedValueOnce("jwt-2");
    expect(await restoreToken()).toBe("jwt-2");
    expect(getTokenSync()).toBe("jwt-2");
  });
  it("si SecureStore falla al leer, devuelve null", async () => {
    secure.getItemAsync.mockRejectedValueOnce(new Error("boom"));
    expect(await restoreToken()).toBeNull();
  });
  it("clearToken borra la memoria aunque SecureStore falle", async () => {
    await saveToken("jwt-3");
    secure.deleteItemAsync.mockRejectedValueOnce(new Error("boom"));
    await clearToken();
    expect(getTokenSync()).toBeNull();
  });
});

describe("authStore", () => {
  it("setSession guarda el token y marca la sesión", async () => {
    await useAuthStore.getState().setSession(user, "jwt-4");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(getTokenSync()).toBe("jwt-4");
  });
  it("logout limpia token y usuario", async () => {
    await useAuthStore.getState().setSession(user, "jwt-5");
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false });
    expect(getTokenSync()).toBeNull();
  });
  it("logout vacía la caché de consultas para que otra cuenta no vea datos de la anterior", async () => {
    await useAuthStore.getState().setSession(user, "jwt-7");
    queryClient.setQueryData(["me"], { id_usuario: 1, nombre: "Angel" });
    queryClient.setQueryData(["profile"], { nombre: "Angel" });
    expect(queryClient.getQueryCache().getAll()).toHaveLength(2);

    await useAuthStore.getState().logout();

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(queryClient.getQueryData(["me"])).toBeUndefined();
    expect(queryClient.getQueryData(["profile"])).toBeUndefined();
  });
  it("hydrate reconoce la sesión por la presencia del token", async () => {
    secure.getItemAsync.mockResolvedValueOnce("jwt-6");
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: true, isHydrating: false });
  });
  it("hydrate sin token deja la app sin sesión", async () => {
    secure.getItemAsync.mockResolvedValueOnce(null);
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, isHydrating: false });
  });
});

describe("onboarding", () => {
  it("isOnboardingCompleted lee el flag", async () => {
    storage.getItem.mockResolvedValueOnce("true");
    expect(await isOnboardingCompleted()).toBe(true);
    storage.getItem.mockResolvedValueOnce(null);
    expect(await isOnboardingCompleted()).toBe(false);
  });
  it("si el almacenamiento falla, asume que ya se vio (no atrapa al usuario)", async () => {
    storage.getItem.mockRejectedValueOnce(new Error("boom"));
    expect(await isOnboardingCompleted()).toBe(true);
  });
  it("setOnboardingCompleted guarda el flag y no lanza si falla", async () => {
    await setOnboardingCompleted();
    expect(storage.setItem).toHaveBeenCalledWith("onboarding_completed", "true");
    storage.setItem.mockRejectedValueOnce(new Error("boom"));
    await expect(setOnboardingCompleted()).resolves.toBeUndefined();
  });
  it("el store no vuelve a mostrar la bienvenida una vez completada", async () => {
    await useOnboardingStore.getState().complete();
    expect(useOnboardingStore.getState().completed).toBe(true);
    storage.getItem.mockResolvedValueOnce("true");
    useOnboardingStore.setState({ completed: false });
    await useOnboardingStore.getState().hydrate();
    expect(useOnboardingStore.getState()).toMatchObject({ completed: true, isChecking: false });
  });
});
