import { queryClient } from "@/shared/api/queryClient";

afterAll(() => {
  queryClient.clear();
});

describe("queryClient", () => {
  it("reintenta las consultas 2 veces", () => {
    expect(queryClient.defaultQueryOptions({ queryKey: ["x"] }).retry).toBe(2);
  });

  it("considera frescos los datos durante 5 minutos", () => {
    expect(queryClient.defaultQueryOptions({ queryKey: ["x"] }).staleTime).toBe(5 * 60 * 1000);
  });

  it("vuelve a consultar al recuperar la conexión", () => {
    expect(queryClient.defaultQueryOptions({ queryKey: ["x"] }).refetchOnReconnect).toBe(true);
  });

  it("no reintenta las mutaciones fallidas", async () => {
    const mutationFn = jest.fn().mockRejectedValue(new Error("fallo"));
    // gcTime Infinity: sin temporizador de limpieza que mantenga vivo el proceso de Jest.
    const mutation = queryClient
      .getMutationCache()
      .build(queryClient, { mutationFn, gcTime: Infinity });

    await expect(mutation.execute(undefined)).rejects.toThrow("fallo");

    expect(mutationFn).toHaveBeenCalledTimes(1);
  });

  it("es una instancia única compartida", () => {
    const otraImportacion = jest.requireActual<typeof import("@/shared/api/queryClient")>(
      "@/shared/api/queryClient",
    ).queryClient;
    expect(otraImportacion).toBe(queryClient);
  });
});
