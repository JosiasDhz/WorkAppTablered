export type RootStackParamList = {
  Tabs:
    | undefined
    | {
        screen?:
          | "ProfileStack"
          | "CheckInStack"
          | "NotificationsStack"
          | "UserProfileStack";
        params?: {
          screen?: string;
          params?: {
            notificationId?: string;
            title?: string;
            body?: string;
            type?: string;
          };
        };
      };
  Inventory: undefined;
  InventoryAudit: undefined;
  InventoryAuditDetail: undefined;
  InventoryAuditFamilyProducts: undefined;
  InventoryAuditLossDocuments: undefined;
  InventoryAuditLossDocumentDetail: undefined;
  DriverRouteDetail: { routeId: string };
  DriverRouteConfirmMercancia: { routeId: string };
  DriverRouteProductPickup: { routeId: string };
  DriverRouteNavFirstStop: { routeId: string };
  DriverRouteReportIncident: { routeId: string };
  DriverCollections: undefined;
  Login: undefined;
};
