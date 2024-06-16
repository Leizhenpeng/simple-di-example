import 'reflect-metadata';

// 定义构造函数类型
type Constructor<T = any> = new (...args: any[]) => T;

// DI容器模块
class DIContainer {
    private static container = new Map<Constructor, any>();

    static async resolve<T>(constructor: Constructor<T>): Promise<T> {
        if (this.container.has(constructor)) {
            return this.container.get(constructor);
        }
        const paramTypes: Constructor[] = Reflect.getMetadata('design:paramtypes', constructor) || [];
        const dependencies = await Promise.all(paramTypes.map(param => this.resolve(param)));
        const instance = new constructor(...dependencies);
        this.container.set(constructor, instance);
        return instance;
    }

    static get<T>(constructor: Constructor<T>): T {
        return this.container.get(constructor);
    }

    static set<T>(constructor: Constructor<T>, instance: T) {
        this.container.set(constructor, instance);
    }

    static delete<T>(constructor: Constructor<T>) {
        this.container.delete(constructor);
    }
}

function Injectable(): ClassDecorator {
    return function (target: Function) {
        // 装饰器逻辑（如果需要的话）
    };
}

// 模块解析器
type ModuleMetadata = {
    providers?: Constructor[];
    controllers?: Constructor[];
    imports?: Constructor[];
};

function Module(metadata: ModuleMetadata): ClassDecorator {
    return function (target: Function) {
        Reflect.defineMetadata('module:metadata', metadata, target);
    };
}

function getModuleMetadata(module: Constructor): ModuleMetadata {
    return Reflect.getMetadata('module:metadata', module) || {};
}

class ModuleResolver {
    static async resolveModule<T>(module: Constructor<T>): Promise<T> {
        const moduleInstance = new module();
        DIContainer.set(module, moduleInstance);

        const metadata = getModuleMetadata(module);
        const imports = metadata.imports || [];
        const providers = metadata.providers || [];
        const controllers = metadata.controllers || [];

        await Promise.all(imports.map(importedModule => this.resolveModule(importedModule)));
        await Promise.all(providers.map(provider => DIContainer.resolve(provider)));

        await Promise.all(controllers.map(async (controller) => {
            const instance = await DIContainer.resolve(controller);
            const name = Reflect.getMetadata('control:name', controller);
            if (name) {
                (moduleInstance as any)[name] = instance;
            }
        }));

        return moduleInstance as T;
    }
}

// 控制器管理模块
class ControllerRegistry {
    private static controllers = new Map<string, Constructor>();

    static register(name: string, controller: Constructor) {
        this.controllers.set(name, controller);
    }

    static get(name: string): Constructor {
        return this.controllers.get(name);
    }
}

function Control(name: string) {
    return function (constructor: Constructor) {
        Reflect.defineMetadata('control:name', name, constructor);
        ControllerRegistry.register(name, constructor);
        Injectable()(constructor);
    };
}
