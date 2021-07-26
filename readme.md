# 你画我猜 Tinter

## 开发

先启动 `yarn watch:server`, `yarn dev:web`, 再启动 `yarn dev:server`

## 构建

在 `packages/web/.env.production.local` 中编辑:

```ini
VITE_SERVER= #在线服务器地址
```

或使用环境变量 `VITE_SERVER`

随后运行 `yarn build:web` 编译前端, 运行 `yarn build:server` 编译后端