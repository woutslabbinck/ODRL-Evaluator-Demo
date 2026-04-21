import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import wasm from "vite-plugin-wasm";

export default {
  worker: {
    format: "es",
    plugins: [wasm(), importMetaUrlPlugin],
  },
  plugins: [wasm(), importMetaUrlPlugin, nodePolyfills()],
  define: {
    "process.env": {},
  },
  build: {
    outDir: "dist",
    target: "esnext",
    rollupOptions: {
      input: {
        main: "docs/index.html",
        solidlab: "docs/solidlab.html",
        odrl3: "docs/odrl3.0.html",
      },
    },
  },
  resolve: {
    dedupe: ["vscode"],
  },
};
