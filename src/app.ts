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

const controllerMap = new Map<string, Constructor>();

function Control(name: string) {
    return function (constructor: Constructor) {
        Reflect.defineMetadata('control:name', name, constructor);
        controllerMap.set(name, constructor);
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

type ModuleMetadata = {
    providers?: Constructor[];
    controllers?: Constructor[];
    imports?: Constructor[];
};

function getModuleMetadata(module: Constructor): ModuleMetadata {
    return {
        providers: Reflect.getMetadata('module:providers', module) || [],
        controllers: Reflect.getMetadata('module:controllers', module) || [],
        imports: Reflect.getMetadata('module:imports', module) || []
    };
}

class AtomFactory {
    static async create<T>(module: Constructor<T>, options: any = {}): Promise<T> {
        const moduleInstance = new module();
        DIContainer.set(module, moduleInstance);

        const metadata = getModuleMetadata(module);
        const importsMetadata = metadata.imports || [];
        const providersMetadata = metadata.providers || [];
        const controllersMetadata = metadata.controllers || [];

        // 实例化 imports
        await Promise.all(importsMetadata.map(async (importedModule: Constructor) => {
            const importedInstance = await AtomFactory.create(importedModule, options);
            Object.assign(moduleInstance as object, importedInstance);
        }));

        // 实例化 providers
        await Promise.all(providersMetadata.map(resolveDependencies));

        // 实例化 controllers
        await Promise.all(controllersMetadata.map(async (controller: Constructor) => {
            const instance = await resolveDependencies(controller);
            const name = Reflect.getMetadata('control:name', controller);
            if (name) {
                (moduleInstance as any)[name] = instance;
            }
        }));

        // 处理 options 配置，例如 debug
        if (options.debug) {
            console.log(`Module ${module.name} initialized with options:`, options);
        }

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

@Injectable()
class CatsService {
    meow() {
        return 'Meow!';
    }
}

@Control('cat')
class CatsController {
    constructor(private catsService: CatsService) { }

    greet() {
        return this.catsService.meow();
    }
}

@Module({
    providers: [CatsService],
    controllers: [CatsController]
})
class CatModule {
}

@Injectable()
class DogsService {
    bark() {
        return 'Waw!';
    }
}

@Control('dog')
class DogsController {
    constructor(private dogsService: DogsService) { }

    greet() {
        return this.dogsService.bark();
    }
}

@Module({
    providers: [DogsService],
    controllers: [DogsController]
})
class DogModule {
}

@Module({
    imports: [CatModule, DogModule]
})
class AppModule {
    constructor(
        public cat: CatsController,
        public dog: DogsController
    ) { }
}

// 自动生成的接口


async function main() {
    const app = await AtomFactory.create<AppModule>(AppModule, {
        debug: true
    });

    const catControl = await get(CatsController)
    catControl.greet()

    app.cat.greet();
    console.log(app.cat.greet());
    console.log(app.dog.greet());
}

main();
