import { defineConfig, normalizePath, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const esToolkitCompatModules = {
  get: ["object/get.mjs", "get"],
  isPlainObject: ["predicate/isPlainObject.mjs", "isPlainObject"],
  last: ["array/last.mjs", "last"],
  maxBy: ["math/maxBy.mjs", "maxBy"],
  minBy: ["math/minBy.mjs", "minBy"],
  omit: ["object/omit.mjs", "omit"],
  range: ["math/range.mjs", "range"],
  sortBy: ["array/sortBy.mjs", "sortBy"],
  sumBy: ["math/sumBy.mjs", "sumBy"],
  throttle: ["function/throttle.mjs", "throttle"],
  uniqBy: ["array/uniqBy.mjs", "uniqBy"],
} as const;

const esToolkitCompatPrefix = "\0es-toolkit-compat:";
const esToolkitCompatModuleCode = (
  name: keyof typeof esToolkitCompatModules,
) => {
  const [path, exportName] = esToolkitCompatModules[name];
  const modulePath = normalizePath(
    fileURLToPath(
      new URL(
        `../../node_modules/es-toolkit/dist/compat/${path}`,
        import.meta.url,
      ),
    ),
  );

  return `export { ${exportName}, ${exportName} as default } from ${JSON.stringify(modulePath)}`;
};

function esToolkitCompatDefaultExports(): Plugin {
  return {
    name: "es-toolkit-compat-default-exports",
    enforce: "pre",
    resolveId(id) {
      const name = id.replace(/^es-toolkit\/compat\//, "");

      if (name in esToolkitCompatModules) {
        return `${esToolkitCompatPrefix}${name}`;
      }

      return null;
    },
    load(id) {
      if (!id.startsWith(esToolkitCompatPrefix)) {
        return null;
      }

      const name = id.slice(
        esToolkitCompatPrefix.length,
      ) as keyof typeof esToolkitCompatModules;

      return esToolkitCompatModuleCode(name);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), esToolkitCompatDefaultExports()],
  optimizeDeps: {
    rolldownOptions: {
      plugins: [esToolkitCompatDefaultExports()],
    },
  },
});
