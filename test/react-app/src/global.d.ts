// 全局类型：允许在浏览器环境中使用 `process.env.NODE_ENV`
declare global {
  const process: { env: { NODE_ENV?: string } }
}

export {}
