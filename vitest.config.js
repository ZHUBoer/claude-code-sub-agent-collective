import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // 限定 Vitest 仅运行 .claude-collective 下的测试，避免执行使用 Jest API 的用例
    include: ['.claude-collective/tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['tests/**'],
    pool: 'forks'  // Fix for Node 16 ERR_REQUIRE_ESM compatibility
  }
})