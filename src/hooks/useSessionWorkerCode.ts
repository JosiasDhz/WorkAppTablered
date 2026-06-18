import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store/store";

function readCode(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function useSessionWorkerCode(): string {
  const { seller, user } = useSelector((state: RootState) => state.auth);

  return useMemo(() => {
    const fromSeller = readCode(seller?.code);
    if (fromSeller) return fromSeller;
    return readCode(user?.seller?.code);
  }, [seller, user]);
}
