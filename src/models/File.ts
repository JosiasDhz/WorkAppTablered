export interface IFileProperties {
  id: string;
  name: string;
  extension: string;
  url: string;
}

export class File implements IFileProperties {
  id: string;
  name: string;
  extension: string;
  url: string;

  constructor(data: IFileProperties) {
    this.id = data.id;
    this.name = data.name;
    this.extension = data.extension;
    this.id = data.id;
    this.url = data?.url;
  }
}
