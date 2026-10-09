import { act, renderHook } from "@testing-library/react-native";

import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("devuelve el valor inicial de inmediato", async () => {
    const { result } = await renderHook(() => useDebouncedValue("a", 400));
    expect(result.current).toBe("a");
  });

  it("no cambia antes de que pase el retardo", async () => {
    const { result, rerender } = await renderHook(
      ({ v }: { v: string }) => useDebouncedValue(v, 400),
      { initialProps: { v: "a" } },
    );

    await rerender({ v: "b" });
    await act(async () => {
      jest.advanceTimersByTime(399);
    });

    expect(result.current).toBe("a");
  });

  it("cambia cuando se cumple el retardo", async () => {
    const { result, rerender } = await renderHook(
      ({ v }: { v: string }) => useDebouncedValue(v, 400),
      { initialProps: { v: "a" } },
    );

    await rerender({ v: "b" });
    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(result.current).toBe("b");
  });

  it("con cambios rápidos solo se propaga el último valor", async () => {
    const vistos: string[] = [];
    const { result, rerender } = await renderHook(
      ({ v }: { v: string }) => {
        const d = useDebouncedValue(v, 400);
        vistos.push(d);
        return d;
      },
      { initialProps: { v: "r" } },
    );

    for (const v of ["ro", "rou", "rout", "route"]) {
      await rerender({ v });
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }
    expect(result.current).toBe("r");

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(result.current).toBe("route");
    expect(new Set(vistos)).toEqual(new Set(["r", "route"]));
  });

  it("usa 400 ms por defecto", async () => {
    const { result, rerender } = await renderHook(
      ({ v }: { v: string }) => useDebouncedValue(v),
      { initialProps: { v: "a" } },
    );

    await rerender({ v: "b" });
    await act(async () => {
      jest.advanceTimersByTime(399);
    });
    expect(result.current).toBe("a");

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("b");
  });

  it("al desmontar cancela el temporizador pendiente", async () => {
    const clearSpy = jest.spyOn(globalThis, "clearTimeout");
    const { rerender, unmount } = await renderHook(
      ({ v }: { v: string }) => useDebouncedValue(v, 400),
      { initialProps: { v: "a" } },
    );

    await rerender({ v: "b" });
    clearSpy.mockClear();
    await unmount();

    expect(clearSpy).toHaveBeenCalledTimes(1);
    clearSpy.mockRestore();
  });
});
