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
    constructor(public cat: CatsController) { }
}

async function main() {
    const app = await AtomFactory.create(AppModule, {
        debug: true
    });
    console.log(app.cat.greet());
}

main();
