// app.ts
import 'reflect-metadata';
import { Injectable, Module, Control, AtomFactory } from './di';

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
class AppModule {
    // constructor(public cat: CatsController) { }
}

interface Constructor<T> {
    new(...args: any[]): T;
}

function getController<T>(app: any, controller: Constructor<T>): T {
    return app[controller.name] as T;
}

async function main() {
    const app = await AtomFactory.create(AppModule, {
        debug: true
    });
    const cat = getController(app, CatsController);
    console.log(cat.greet());
}

main();
