// app.ts

import 'reflect-metadata';
import { Service, Container } from 'typedi';

// 定义一个服务
@Service()
class Logger {
    log(message: string) {
        console.log('Logger:', message);
    }
}

// 定义一个依赖于Logger服务的类
@Service()
class UserService {
    constructor(private logger: Logger) { }

    getUser() {
        this.logger.log('Fetching user');
        return { id: 1, name: 'John Doe' };
    }
}

// 获取UserService实例并使用它
const userService_ = Container.get(UserService);
const user = userService_.getUser();
console.log(user);