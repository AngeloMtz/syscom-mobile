// src/shared/hooks/useDebouncedValue.ts — Retarda un valor que cambia seguido.
import { useEffect, useState } from "react";

/** Devuelve `value` solo después de `delay` ms sin cambios (evita una petición por tecla). */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
