import 'reflect-metadata';

type Constructor<T = any> = new (...args: any[]) => T;

const DIContainer = new Map<Constructor, any>();

function Injectable(): ClassDecorator {
    return function <T extends Function>(constructor: T) {
        Reflect.defineMetadata('design:paramtypes', Reflect.getMetadata('design:paramtypes', constructor) || [], constructor);
    };
}

function Module(options: { providers?: Constructor[], controllers?: Constructor[], imports?: Constructor[] }) {
    return function <T extends Constructor>(constructor: T): T {
        Reflect.defineMetadata('module:providers', options.providers || [], constructor);
        Reflect.defineMetadata('module:controllers', options.controllers || [], constructor);
        Reflect.defineMetadata('module:imports', options.imports || [], constructor);
        return constructor;
    };
}

function Control(name: string) {
    return function (constructor: Constructor) {
        Reflect.defineMetadata('control:name', name, constructor);
        DIContainer.set(constructor, null);  // 初始时注册控制器但不实例化
        Injectable()(constructor);  // 确保控制器也是可注入的
    };
}

async function resolveDependencies<T>(constructor: Constructor<T>): Promise<T> {
    if (DIContainer.has(constructor)) {
        return DIContainer.get(constructor);
    }
    const paramTypes: Constructor[] = Reflect.getMetadata('design:paramtypes', constructor) || [];
    const dependencies = await Promise.all(paramTypes.map(resolveDependencies));
    const instance = new constructor(...dependencies);
    DIContainer.set(constructor, instance);
    return instance;
}
