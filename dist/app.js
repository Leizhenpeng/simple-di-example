"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/app.ts
var import_reflect_metadata2 = require("reflect-metadata");

// src/di.ts
var import_reflect_metadata = require("reflect-metadata");
var DIContainer = /* @__PURE__ */ new Map();
function Injectable(constructor) {
  Reflect.defineMetadata("design:paramtypes", Reflect.getMetadata("design:paramtypes", constructor) || [], constructor);
  const paramTypes = Reflect.getMetadata("design:paramtypes", constructor);
  const instance = new constructor(...paramTypes.map((type) => DIContainer.get(type)));
  DIContainer.set(constructor, instance);
  return constructor;
}
__name(Injectable, "Injectable");
function Module(options) {
  return function(constructor) {
    Reflect.defineMetadata("module:providers", options.providers, constructor);
    Reflect.defineMetadata("module:controllers", options.controllers, constructor);
    return constructor;
  };
}
__name(Module, "Module");
function Control(name) {
  return function(constructor) {
    Reflect.defineMetadata("control:name", name, constructor);
    Injectable(constructor);
  };
}
__name(Control, "Control");
var _a;
var AtomFactory = (_a = class {
  static async create(module2, options) {
    const moduleInstance = new module2();
    DIContainer.set(module2, moduleInstance);
    const providersMetadata = Reflect.getMetadata("module:providers", module2) || [];
    providersMetadata.forEach((provider) => {
      if (!DIContainer.has(provider)) {
        Injectable(provider);
      }
    });
    const controllersMetadata = Reflect.getMetadata("module:controllers", module2) || [];
    controllersMetadata.forEach((controller) => {
      if (!DIContainer.has(controller)) {
        Injectable(controller);
      }
      const name = Reflect.getMetadata("control:name", controller);
      if (name) {
        moduleInstance[name] = DIContainer.get(controller);
      }
    });
    return moduleInstance;
  }
}, __name(_a, "AtomFactory"), _a);

// src/app.ts
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate, "_ts_decorate");
function _ts_metadata(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
__name(_ts_metadata, "_ts_metadata");
var _a2;
var CatsService = (_a2 = class {
  meow() {
    return "Meow!";
  }
}, __name(_a2, "CatsService"), _a2);
CatsService = _ts_decorate([
  Injectable
], CatsService);
var _a3;
var CatsController = (_a3 = class {
  constructor(catsService) {
    __publicField(this, "catsService");
    this.catsService = catsService;
  }
  greet() {
    return this.catsService.meow();
  }
}, __name(_a3, "CatsController"), _a3);
CatsController = _ts_decorate([
  Control("cat"),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", [
    typeof CatsService === "undefined" ? Object : CatsService
  ])
], CatsController);
var _a4;
var AppModule = (_a4 = class {
}, __name(_a4, "AppModule"), _a4);
AppModule = _ts_decorate([
  Module({
    providers: [
      CatsService
    ],
    controllers: [
      CatsController
    ]
  })
], AppModule);
async function main() {
  const app = await AtomFactory.create(AppModule, {
    debug: true
  });
  console.log(app.cat.greet());
}
__name(main, "main");
main();
//# sourceMappingURL=app.js.map