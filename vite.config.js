import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default {
  worker: {
    format: "es",
    plugins: [wasm(), topLevelAwait()],
  },
  plugins: [wasm(), topLevelAwait(), importMetaUrlPlugin],
  define: {
    "process.env": {},
  },
  build: {
    outDir: "dist",
    target: "esnext",
    rollupOptions: {
      input: "docs/index.html",
    },
  },
  resolve: {
    dedupe: ["vscode"],
  },
};
