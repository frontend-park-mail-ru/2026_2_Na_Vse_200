import { defineConfig } from "vite"

export default defineConfig({
    oxc: {
        jsx: {
            runtime: "classic",
            pragma: "createElement"
        }
    },
    optimizeDeps: {
        rolldownOptions: {
            transform: {
                jsx: {
                    runtime: "classic",
                    pragma: "createElement"
                }
            }
        }
    }
})
