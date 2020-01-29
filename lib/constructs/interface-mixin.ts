export class InterfaceMixin {
  ctx: any;
  idl: any;
  name: any;
  type: string = "interface mixin";
  constructor(ctx, idl) {
    this.ctx = ctx;
    this.idl = idl;
    this.name = idl.name;
  }
}
