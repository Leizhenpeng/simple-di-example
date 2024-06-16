import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/app.ts'],  // 你的入口文件
  splitting: false,  // 没有代码分割
  sourcemap: true,  // 生成源码映射，便于调试
  clean: true,  // 构建前清理输出目录
  format: ['cjs'],  // 输出 CommonJS 格式
  outDir: 'dist',  // 输出目录
});
