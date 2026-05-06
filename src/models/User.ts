import { File } from "./File";

export interface IUserProperties {
  id: string;
  name: string;
  lastName: string;
  secondLastName: string;
  position: string;
  email: string;
  phone: string;
  status: boolean;
  createdAt: Date;
  updateAt: Date;
  recoveryCode: null;
  recoveryCodeLifetime: null;
  avatar: File;
  rol: string;
}
