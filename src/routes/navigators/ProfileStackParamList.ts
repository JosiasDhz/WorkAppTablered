export type ProfileStackParamList = {
  Profile: undefined;
  SaleDetail: {
    folio?: string;
    points?: number;
    sucursal?: string;
    date?: string;
  };
  MisExpediente: undefined;
  MisExpedienteDocumento: {
    documentTypeId: string;
    documentTypeName: string;
    isRequired: boolean;
  };
  DriverRoutesHub: undefined;
};
