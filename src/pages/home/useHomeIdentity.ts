import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store/store";
import { buildUserFirstName } from "../../utils/userDisplayName";
import { resolveWorkerRoleLabel } from "../../utils/workerRoleLabelEs";

export type HomeIdentity = {
  firstName: string;
  roleLabel: string;
  profession: string | null;
  welcomeHeadline: string;
};

function resolveProfession(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;
  const raw = (user as { profession?: unknown }).profession;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

export function useHomeIdentity(): HomeIdentity {
  const { user, seller } = useSelector((state: RootState) => state.auth);

  return useMemo(() => {
    const firstName = buildUserFirstName(user, seller);
    const profession = resolveProfession(user);
    return {
      firstName,
      roleLabel: resolveWorkerRoleLabel(user, seller),
      profession,
      welcomeHeadline: profession ?? firstName,
    };
  }, [user, seller]);
}
