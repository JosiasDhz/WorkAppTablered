import type { ComponentType } from "react";
import {
  Box1,
  ClipboardTick,
  Clock,
  CloseCircle,
  Coin,
  Danger,
  Health,
  MessageText,
  MoneyRecive,
  Notification as NotificationIcon,
  TicketDiscount,
  TruckFast,
} from "iconsax-react-native";
import { NOTIFICATION_COLORS } from "./notificationsTheme";

type NotificationIconProps = {
  size?: number;
  color?: string;
  variant?: "Linear" | "Outline" | "Bold" | "Bulk" | "Broken" | "TwoTone";
};

export type NotificationAppearance = {
  Icon: ComponentType<NotificationIconProps>;
  tint: string;
  wash: string;
};

const APPEARANCE_BY_TYPE: Record<string, NotificationAppearance> = {
  PERMISO_APROBADO: {
    Icon: ClipboardTick,
    tint: NOTIFICATION_COLORS.emerald,
    wash: NOTIFICATION_COLORS.emeraldSoft,
  },
  PERMISSION_REQUEST_SUBMITTED: {
    Icon: ClipboardTick,
    tint: NOTIFICATION_COLORS.emerald,
    wash: NOTIFICATION_COLORS.emeraldSoft,
  },
  FALTA_REGISTRADA: {
    Icon: CloseCircle,
    tint: NOTIFICATION_COLORS.rose,
    wash: NOTIFICATION_COLORS.roseSoft,
  },
  ATTENDANCE_NOTICE_REPORTED: {
    Icon: CloseCircle,
    tint: NOTIFICATION_COLORS.rose,
    wash: NOTIFICATION_COLORS.roseSoft,
  },
  RECORDATORIO_CHEQUEO: {
    Icon: Clock,
    tint: NOTIFICATION_COLORS.warning,
    wash: NOTIFICATION_COLORS.warningSoft,
  },
  INCAPACIDAD_APROBADA: {
    Icon: Health,
    tint: NOTIFICATION_COLORS.emerald,
    wash: NOTIFICATION_COLORS.emeraldSoft,
  },
  COMISION_GENERADA: {
    Icon: Coin,
    tint: NOTIFICATION_COLORS.accent,
    wash: NOTIFICATION_COLORS.accentSoft,
  },
  TRANSFER_PENDING: {
    Icon: MoneyRecive,
    tint: NOTIFICATION_COLORS.warning,
    wash: NOTIFICATION_COLORS.warningSoft,
  },
  TRANSFER_RESOLVED: {
    Icon: MoneyRecive,
    tint: NOTIFICATION_COLORS.emerald,
    wash: NOTIFICATION_COLORS.emeraldSoft,
  },
  TRANSFER_RESOLVED_CASHIER: {
    Icon: MoneyRecive,
    tint: NOTIFICATION_COLORS.accent,
    wash: NOTIFICATION_COLORS.accentSoft,
  },
  CAJA_WITHDRAWAL_PENDING: {
    Icon: Coin,
    tint: NOTIFICATION_COLORS.warning,
    wash: NOTIFICATION_COLORS.warningSoft,
  },
  CAJA_WITHDRAWAL_APPROVED_CONFIRM: {
    Icon: Coin,
    tint: NOTIFICATION_COLORS.emerald,
    wash: NOTIFICATION_COLORS.emeraldSoft,
  },
  TRASPASO: {
    Icon: Box1,
    tint: NOTIFICATION_COLORS.accent,
    wash: NOTIFICATION_COLORS.accentSoft,
  },
  SALE_CANCELATION_REGISTERED: {
    Icon: CloseCircle,
    tint: NOTIFICATION_COLORS.rose,
    wash: NOTIFICATION_COLORS.roseSoft,
  },
  WARRANTY_CLAIM_REGISTERED: {
    Icon: Box1,
    tint: NOTIFICATION_COLORS.warning,
    wash: NOTIFICATION_COLORS.warningSoft,
  },
  WARRANTY_WAREHOUSE_COMPLETED: {
    Icon: Box1,
    tint: NOTIFICATION_COLORS.emerald,
    wash: NOTIFICATION_COLORS.emeraldSoft,
  },
  WARRANTY_STOCK_AVAILABLE: {
    Icon: Box1,
    tint: NOTIFICATION_COLORS.accent,
    wash: NOTIFICATION_COLORS.accentSoft,
  },
  DRIVER_INCIDENT_REPORTED: {
    Icon: Danger,
    tint: NOTIFICATION_COLORS.rose,
    wash: NOTIFICATION_COLORS.roseSoft,
  },
  SUPPORT_CHAT_WAITING: {
    Icon: MessageText,
    tint: NOTIFICATION_COLORS.accent,
    wash: NOTIFICATION_COLORS.accentSoft,
  },
  LINE_COUPON_REQUEST_PENDING: {
    Icon: TicketDiscount,
    tint: NOTIFICATION_COLORS.warning,
    wash: NOTIFICATION_COLORS.warningSoft,
  },
  LINE_COUPON_REQUEST_APPROVED: {
    Icon: TicketDiscount,
    tint: NOTIFICATION_COLORS.emerald,
    wash: NOTIFICATION_COLORS.emeraldSoft,
  },
  LINE_COUPON_REQUEST_REJECTED: {
    Icon: TicketDiscount,
    tint: NOTIFICATION_COLORS.rose,
    wash: NOTIFICATION_COLORS.roseSoft,
  },
  LINE_COUPON_REQUEST_CHECKOUT_CANCELLED: {
    Icon: TicketDiscount,
    tint: NOTIFICATION_COLORS.muted,
    wash: NOTIFICATION_COLORS.neutralSoft,
  },
  ECOMMERCE_ORDER_DONE: {
    Icon: TruckFast,
    tint: NOTIFICATION_COLORS.emerald,
    wash: NOTIFICATION_COLORS.emeraldSoft,
  },
};

const FALLBACK_APPEARANCE: NotificationAppearance = {
  Icon: NotificationIcon,
  tint: NOTIFICATION_COLORS.muted,
  wash: NOTIFICATION_COLORS.neutralSoft,
};

export function resolveNotificationAppearance(
  type: string,
): NotificationAppearance {
  return APPEARANCE_BY_TYPE[type] ?? FALLBACK_APPEARANCE;
}
