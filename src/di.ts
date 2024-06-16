import 'reflect-metadata';

type Constructor<T = any> = new (...args: any[]) => T;

const DIContainer = new Map<Constructor, any>();

function Injectable(): ClassDecorator {
    return function <T extends Function>(constructor: T) {
        Reflect.defineMetadata('design:paramtypes', Reflect.getMetadata('design:paramtypes', constructor) || [], constructor);
    };
}

function Module(options: { providers: Constructor[], controllers: Constructor[] }) {
    return function <T extends Constructor>(constructor: T): T {
        Reflect.defineMetadata('module:providers', options.providers, constructor);
        Reflect.defineMetadata('module:controllers', options.controllers, constructor);
        return constructor;
    };
}

function Control(name: string) {
    return function (constructor: Constructor) {
        Reflect.defineMetadata('control:name', name, constructor);
        Injectable()(constructor); // 确保控制器也是可注入的
    };
}

async function resolveDependencies<T>(constructor: Constructor<T>): Promise<T> {
    if (DIContainer.has(constructor)) {
        return DIContainer.get(constructor);
    }
    const paramTypes: Constructor[] = Reflect.getMetadata('design:paramtypes', constructor);
    const dependencies = await Promise.all(paramTypes.map(resolveDependencies));
    const instance = new constructor(...dependencies);
    DIContainer.set(constructor, instance);
    return instance;
}

async function get<T>(constructor: Constructor<T>): Promise<T> {
    if (!DIContainer.has(constructor)) {
        return resolveDependencies(constructor);
    }
    return DIContainer.get(constructor);
}

class AtomFactory {
    static async create<T>(module: Constructor<T>, options: any): Promise<T> {
        const moduleInstance = new module();
        DIContainer.set(module, moduleInstance);

        // 实例化 providers
        const providersMetadata = Reflect.getMetadata('module:providers', module) || [];
        await Promise.all(providersMetadata.map(resolveDependencies));

        const controllersMetadata = Reflect.getMetadata('module:controllers', module) || [];
        await Promise.all(controllersMetadata.map(async (controller: Constructor) => {
            const instance = await resolveDependencies(controller);
            const name = Reflect.getMetadata('control:name', controller) as keyof T;
            if (name) {
                moduleInstance[name] = instance;
            }
        }));
        return moduleInstance as T;
    }
}

export {
    Injectable,
    Module,
    Control,
    get,
    AtomFactory
};
