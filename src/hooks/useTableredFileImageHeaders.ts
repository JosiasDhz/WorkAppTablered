import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiBaseUrl } from "../api/http-common";

export function useTableredFileImageHeaders(
  uri: string | null | undefined,
): Record<string, string> | undefined {
  const [headers, setHeaders] = useState<Record<string, string> | undefined>();

  useEffect(() => {
    const trimmed = String(uri ?? "").trim();
    if (!trimmed || !apiBaseUrl || !trimmed.startsWith(apiBaseUrl)) {
      setHeaders(undefined);
      return;
    }
    let alive = true;
    void AsyncStorage.getItem("tablered-token").then((token) => {
      if (!alive) return;
      if (token) {
        setHeaders({ Authorization: `Bearer ${token}` });
      } else {
        setHeaders(undefined);
      }
    });
    return () => {
      alive = false;
    };
  }, [uri]);

  return headers;
}
