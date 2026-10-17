import appConfig from "/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6737-parallel-20261016/packages/app/vitest.config";
export default {
  ...appConfig,
  root: "/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6737-parallel-20261016/packages/app",
  cacheDir: "/tmp/paseo-pr-gap-20261017/6737-readonly-runtime/cache",
  test: {
    ...appConfig.test,
    projects: undefined,
    include: ["/tmp/paseo-pr-gap-20261017/6737-readonly-runtime/readonly-runtime.test.ts"],
    setupFiles: ["/Users/luopeihuan/workspace/rrd/paseo/.worktrees/pr-6737-parallel-20261016/packages/app/vitest.setup.ts"],
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 90000,
    hookTimeout: 30000,
  },
};
