import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  server: { port: 5190, strictPort: true },
  plugins: [tailwindcss(), react()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
})
