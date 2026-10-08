import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")
const grammaDir = path.join(rootDir, "data", "gramma")
const jlptDir = path.join(rootDir, "data", "jlpt")
const outputFile = path.join(rootDir, "lib", "chapters-registry.ts")

function sanitizeVarName(name) {
  return name.replace(/[^a-zA-Z0-9_$]/g, "_")
}

export function generateChapters() {
  console.log("⚡ [generate-chapters] Quét dữ liệu chapters...")

  // 1. Quét Grammar chapters
  const grammarFiles = []
  if (fs.existsSync(grammaDir)) {
    const files = fs.readdirSync(grammaDir)
    for (const f of files) {
      if (!f.endsWith(".json") || f.startsWith(".")) continue
      const fullPath = path.join(grammaDir, f)
      try {
        const stats = fs.statSync(fullPath)
        if (stats.size === 0) continue
        const content = fs.readFileSync(fullPath, "utf-8").trim()
        if (!content) continue
        const parsed = JSON.parse(content)
        if (!parsed.chapter_id || !Array.isArray(parsed.sections)) {
          console.warn(`⚠️ [generate-chapters] Bỏ qua ${f}: thiếu chapter_id hoặc sections`)
          continue
        }

        const match = f.match(/chapter_(\d+)\.json$/i)
        const num = match ? parseInt(match[1], 10) : 9999
        grammarFiles.push({
          filename: f,
          order: num,
          varName: `ch_${String(num).padStart(2, "0")}`,
          importPath: `@/data/gramma/${f}`,
        })
      } catch (err) {
        console.warn(`⚠️ [generate-chapters] Bỏ qua file lỗi ${f}:`, err.message)
      }
    }
  }

  grammarFiles.sort((a, b) => a.order - b.order || a.filename.localeCompare(b.filename))

  // 2. Quét JLPT Exam chapters
  const examFiles = []
  if (fs.existsSync(jlptDir)) {
    const files = fs.readdirSync(jlptDir)
    for (const f of files) {
      if (!f.endsWith(".json") || f.startsWith(".")) continue
      const fullPath = path.join(jlptDir, f)
      try {
        const stats = fs.statSync(fullPath)
        if (stats.size === 0) {
          // File rỗng (chờ thêm dữ liệu)
          continue
        }
        const content = fs.readFileSync(fullPath, "utf-8").trim()
        if (!content) continue
        const parsed = JSON.parse(content)
        if (!parsed.chapter_id || !Array.isArray(parsed.sections)) {
          console.warn(`⚠️ [generate-chapters] Bỏ qua ${f}: thiếu chapter_id hoặc sections`)
          continue
        }

        // Tách tháng và năm: jlpt_n2_07_2010.json -> month=7, year=2010
        let order = 0
        let varName = sanitizeVarName(f.replace(/\.json$/i, ""))
        const match = f.match(/jlpt_n2_(\d{1,2})_(\d{4})\.json$/i)
        if (match) {
          const month = parseInt(match[1], 10)
          const year = parseInt(match[2], 10)
          order = year * 100 + month
          varName = `jlpt_${year}_${String(month).padStart(2, "0")}`
        } else {
          // Thử trích xuất từ chapter_id nếu có
          const cidMatch = String(parsed.chapter_id).match(/(\d{4})-(\d{1,2})/)
          if (cidMatch) {
            const year = parseInt(cidMatch[1], 10)
            const month = parseInt(cidMatch[2], 10)
            order = year * 100 + month
          }
        }

        examFiles.push({
          filename: f,
          order,
          varName,
          importPath: `@/data/jlpt/${f}`,
        })
      } catch (err) {
        console.warn(`⚠️ [generate-chapters] Bỏ qua file lỗi ${f}:`, err.message)
      }
    }
  }

  examFiles.sort((a, b) => a.order - b.order || a.filename.localeCompare(b.filename))

  // 3. Tạo nội dung file TypeScript
  const lines = [
    `// ============================================================================`,
    `// AUTO-GENERATED FILE BY scripts/generate-chapters.mjs`,
    `// DO NOT EDIT DIRECTLY. Add or update JSON files in data/jlpt or data/gramma.`,
    `// ============================================================================`,
    `import { Chapter } from "./types"`,
    ``,
    `// --- Grammar Chapters (${grammarFiles.length} files) ---`,
  ]

  for (const item of grammarFiles) {
    lines.push(`import ${item.varName} from "${item.importPath}"`)
  }

  lines.push(``)
  lines.push(`// --- JLPT Exam Chapters (${examFiles.length} files) ---`)
  for (const item of examFiles) {
    lines.push(`import ${item.varName} from "${item.importPath}"`)
  }

  lines.push(``)
  lines.push(`export const grammarChapters: Chapter[] = [`)
  for (const item of grammarFiles) {
    lines.push(`  ${item.varName} as Chapter,`)
  }
  lines.push(`]`)

  lines.push(``)
  lines.push(`export const examChapters: Chapter[] = [`)
  for (const item of examFiles) {
    lines.push(`  ${item.varName} as Chapter,`)
  }
  lines.push(`]`)
  lines.push(``)

  const newContent = lines.join("\n")

  // Chỉ ghi đè nếu nội dung thực sự thay đổi để tránh trigger HMR không cần thiết
  if (fs.existsSync(outputFile)) {
    const currentContent = fs.readFileSync(outputFile, "utf-8")
    if (currentContent === newContent) {
      console.log(`✅ [generate-chapters] Chapters đã khớp (${grammarFiles.length} grammar, ${examFiles.length} exams). Không có thay đổi.`)
      return
    }
  }

  fs.writeFileSync(outputFile, newContent, "utf-8")
  console.log(`✅ [generate-chapters] Đã cập nhật lib/chapters-registry.ts thành công:`)
  console.log(`   - Grammar: ${grammarFiles.length} bài`)
  console.log(`   - JLPT: ${examFiles.length} đề thi`)
}

export function watchDataDirectory() {
  let timer = null
  const trigger = (dirName, filename) => {
    if (filename && !filename.endsWith(".json")) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      console.log(`\n🔄 [data-watcher] Phát hiện thay đổi trong data/${dirName} (${filename || ""})`)
      try {
        generateChapters()
      } catch (e) {
        console.error("❌ Lỗi khi tự động cập nhật chapters:", e)
      }
    }, 250)
  }

  if (fs.existsSync(grammaDir)) {
    fs.watch(grammaDir, (event, filename) => trigger("gramma", filename))
  }
  if (fs.existsSync(jlptDir)) {
    fs.watch(jlptDir, (event, filename) => trigger("jlpt", filename))
  }
  console.log("👀 [data-watcher] Đang theo dõi thư mục data/jlpt và data/gramma...")
}

// Chạy trực tiếp qua node scripts/generate-chapters.mjs
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateChapters()
}
