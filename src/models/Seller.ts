import { IBranch } from "./Branch";
import { IPosition } from "./Position";

export interface ISellerProperties {
  id:       string;
  code:     string;
  branch:   IBranch;
  position: IPosition;
}

