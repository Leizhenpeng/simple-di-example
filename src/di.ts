/* eslint-disable @typescript-eslint/no-explicit-any */

import 'reflect-metadata';

type Constructor<T = any> = new (...args: any[]) => T;

const DIContainer = new Map<Constructor, any>();

function Injectable<T>(constructor: Constructor<T>): Constructor<T> {
    Reflect.defineMetadata('design:paramtypes', Reflect.getMetadata('design:paramtypes', constructor) || [], constructor);
    const paramTypes: Constructor[] = Reflect.getMetadata('design:paramtypes', constructor);
    const instance = new constructor(...paramTypes.map(type => DIContainer.get(type)));
    DIContainer.set(constructor, instance);
    return constructor;
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
        Injectable(constructor);  // 确保控制器也是可注入的
    };
}


function get<T>(constructor: Constructor<T>): T {
    if (!DIContainer.has(constructor)) {
        throw new Error(`No instance found for ${constructor.name}`);
    }
    return DIContainer.get(constructor);
}

class AtomFactory {
    static async create<T>(module: Constructor<T>, options: any): Promise<T> {
        const moduleInstance = new module();
        DIContainer.set(module, moduleInstance);

        // 实例化 providers
        const providersMetadata = Reflect.getMetadata('module:providers', module) || [];
        providersMetadata.forEach((provider: { new(...args: any[]): any; new(...args: any[]): unknown; }) => {
            if (!DIContainer.has(provider)) {
                Injectable(provider);
            }
        });

        const controllersMetadata = Reflect.getMetadata('module:controllers', module) || [];
        controllersMetadata.forEach((controller: Constructor) => {
            if (!DIContainer.has(controller)) {
                Injectable(controller);
            }
            const name = Reflect.getMetadata('control:name', controller) as keyof T;
            if (name) {
                moduleInstance[name] = DIContainer.get(controller);
            }
        });

        return moduleInstance;
    }
}


export {
    Injectable,
    Module,
    Control,
    get,
    AtomFactory
};