import { spawn } from "node:child_process"
import { generateChapters, watchDataDirectory } from "./generate-chapters.mjs"

// 1. Quét và tạo registry chapters trước khi Next.js khởi động
generateChapters()

// 2. Theo dõi thư mục data/ theo thời gian thực
watchDataDirectory()

// 3. Khởi chạy Next dev server
const extraArgs = process.argv.slice(2)
const devProcess = spawn("pnpm", ["exec", "next", "dev", ...extraArgs], {
  stdio: "inherit",
  shell: true,
})

const cleanup = () => {
  if (devProcess && !devProcess.killed) {
    devProcess.kill()
  }
  process.exit(0)
}

process.on("SIGINT", cleanup)
process.on("SIGTERM", cleanup)

devProcess.on("close", (code) => {
  process.exit(code || 0)
})
