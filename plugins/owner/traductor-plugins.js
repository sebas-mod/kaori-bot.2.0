const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const axios = require('axios')
const { hotReloadPlugin } = require('../../src/lib/ourin-plugins')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'traducir-plugins',
    alias: ['traducirplugin', 'traducirplugins', 'espanolizar'],
    category: 'owner',
    description: 'Traduce textos visibles de plugins al espanol y conserva el estado',
    usage: '.traducir-plugins <all|carpeta|carpeta/archivo|archivo>',
    example: '.traducir-plugins owner',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const FOLDER_SKIP = new Set(['node_modules', '.git', 'backup', 'session', 'tmp'])
const DICTIONARY_PATH = path.join(process.cwd(), 'assets', 'json', 'translation-es.json')
const STATE_PATH = path.join(process.cwd(), 'assets', 'json', 'translation-es-state.json')
const CONFIG_PATH = path.join(process.cwd(), 'assets', 'json', 'translation-es-config.json')

const DEFAULT_TRANSLATION_CONFIG = {
    targetLanguage: 'es',
    copyOnlyDirectories: ['.git', 'node_modules', 'assets', 'database'],
    copyOnlyFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
    textExtensions: ['.js', '.json', '.md', '.txt'],
    protectedTerms: [
        'WhatsApp',
        'Baileys',
        'Node.js',
        'API',
        'AI',
        '.menu',
        '.owner',
        '.play',
        '.help'
    ],
    commandPrefixes: ['.', '#', '!', '/', '\\'],
    skipPatterns: [
        '^https?://',
        '^www\\.',
        '^[A-Za-z]:\\\\',
        '^[./~\\\\]',
        '^[A-Za-z0-9_.-]+$'
    ]
}

const SPANISH_HINTS = /\b(hola|adios|bienvenido|hasta|acceso|denegado|procesando|espera|datos|archivo|carpeta|plugin|mensaje|grupo|privado|premium|codigo|descripcion|uso|funcion|proceso|usuario|buscar|mostrar|nuevo|anterior|guardado|fecha|hora|nombre|menu|ajustes|version)\b/i
const SOURCE_HINTS = /\b(tidak|selamat|sampai|akses|ditolak|sedang|silahkan|gagal|mengunduh|grup|khusus|daftar|pengaturan|fitur|pengguna|gunakan|hapus|ubah|simpan|waktu|tanggal|jam|coba|lagi|nanti|berhasil)\b/i

const WORD_MAP = [
    ['tidak ada', 'no hay'],
    ['selamat datang', 'bienvenido'],
    ['sampai jumpa', 'hasta luego'],
    ['akses ditolak', 'acceso denegado'],
    ['sedang diproses', 'se esta procesando'],
    ['silahkan tunggu', 'por favor espera'],
    ['data tidak tersedia', 'datos no disponibles'],
    ['url tidak valid', 'url no valida'],
    ['buffer gambar tidak valid', 'buffer de imagen no valido'],
    ['gagal mengunduh video', 'fallo al descargar el video'],
    ['gagal mengambil detail apk', 'fallo al obtener detalles del apk'],
    ['grup tidak terdaftar', 'grupo no registrado'],
    ['hanya owner yang bisa menggunakan fitur ini', 'solo el owner puede usar esta funcion'],
    ['tidak ditemukan', 'no fue encontrado'],
    ['tidak valid', 'no valido'],
    ['tidak bisa', 'no se puede'],
    ['tidak dapat', 'no se puede'],
    ['saat ini', 'actualmente'],
    ['sudah aktif', 'ya esta activo'],
    ['siap digunakan', 'listo para usar'],
    ['khusus untuk', 'solo para'],
    ['coba lagi nanti', 'intenta de nuevo mas tarde'],
    ['mohon tunggu sebentar ya', 'por favor espera un momento'],
    ['gagal download file', 'fallo al descargar el archivo'],
    ['nama saat ini', 'nombre actual'],
    ['nama bot', 'nombre del bot'],
    ['nama owner', 'nombre del owner'],
    ['nama developer', 'nombre del desarrollador'],
    ['nama baru', 'nombre nuevo'],
    ['mengatur variant tampilan menu', 'configura la variante del menu'],
    ['pilih variant', 'elige una variante'],
    ['daftar variant menu', 'lista de variantes del menu'],
    ['variant aktif', 'variante activa'],
    ['ganti nama bot', 'cambiar nombre del bot'],
    ['ganti nama owner', 'cambiar nombre del owner'],
    ['ganti nama developer', 'cambiar nombre del desarrollador'],
    ['ganti code plugin', 'reemplazar codigo del plugin'],
    ['source code', 'codigo fuente'],
    ['owner only', 'solo owner'],
    ['group only', 'solo grupo'],
    ['private only', 'solo privado'],
    ['premium only', 'solo premium'],
    ['aktifkan', 'activar'],
    ['nonaktifkan', 'desactivar'],
    ['aktif', 'activo'],
    ['tidak', 'no'],
    ['ya', 'si'],
    ['gunakan', 'usa'],
    ['pilih', 'elige'],
    ['daftar', 'lista'],
    ['menu', 'menu'],
    ['owner', 'owner'],
    ['group', 'grupo'],
    ['grup', 'grupo'],
    ['private', 'privado'],
    ['premium', 'premium'],
    ['folder', 'carpeta'],
    ['file', 'archivo'],
    ['plugin', 'plugin'],
    ['plugins', 'plugins'],
    ['kode', 'codigo'],
    ['berhasil', 'exito'],
    ['gagal', 'fallo'],
    ['peringatan', 'advertencia'],
    ['format', 'formato'],
    ['contoh', 'ejemplo'],
    ['ukuran', 'tamano'],
    ['detail', 'detalle'],
    ['pengaturan', 'ajustes'],
    ['prefix', 'prefijo'],
    ['versi', 'version'],
    ['nomor', 'numero'],
    ['deskripsi', 'descripcion'],
    ['penggunaan', 'uso'],
    ['fitur', 'funcion'],
    ['proses', 'proceso'],
    ['tunggu', 'espera'],
    ['akses', 'acceso'],
    ['ditolak', 'denegado'],
    ['pengguna', 'usuario'],
    ['cari', 'buscar'],
    ['tampil', 'mostrar'],
    ['baru', 'nuevo'],
    ['lama', 'anterior'],
    ['diganti', 'cambiado'],
    ['diubah', 'modificado'],
    ['disimpan', 'guardado'],
    ['sukses', 'exito'],
    ['belum', 'todavia no'],
    ['dan', 'y'],
    ['atau', 'o'],
    ['dari', 'de'],
    ['untuk', 'para'],
    ['dengan', 'con'],
    ['hapus', 'eliminar'],
    ['simpan', 'guardar'],
    ['ubah', 'cambiar'],
    ['data', 'datos'],
    ['gambar', 'imagen'],
    ['video', 'video'],
    ['audio', 'audio'],
    ['pesan', 'mensaje'],
    ['admin', 'admin'],
    ['waktu', 'tiempo'],
    ['tanggal', 'fecha'],
    ['jam', 'hora']
]

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeText(text) {
    return String(text || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
}

function hashText(text) {
    return crypto.createHash('sha1').update(String(text || '')).digest('hex')
}

function looksAlreadySpanish(text) {
    const value = String(text || '').trim()
    if (!value) return false
    if (/[áéíóúñ¿¡]/i.test(value)) return true
    return SPANISH_HINTS.test(value) && !SOURCE_HINTS.test(value)
}

function looksLikeSourceLanguage(text) {
    const value = String(text || '').trim()
    if (!value) return false
    return SOURCE_HINTS.test(value)
}

function loadPhraseMap() {
    try {
        const raw = fs.readFileSync(DICTIONARY_PATH, 'utf8')
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed?.phrases)) return []

        const unique = new Map()
        for (const item of parsed.phrases) {
            if (!item || typeof item.from !== 'string' || typeof item.to !== 'string') continue
            const from = item.from.trim()
            const to = item.to.trim()
            if (!from || !to) continue
            if (normalizeText(from) === normalizeText(to) && looksAlreadySpanish(from)) continue
            unique.set(normalizeText(from), [from, to])
        }

        return [...unique.values()]
    } catch {
        return []
    }
}

function savePhraseMap(phraseMap) {
    const unique = new Map()

    for (const [from, to] of phraseMap) {
        if (!from || !to) continue
        if (normalizeText(from) === normalizeText(to) && looksAlreadySpanish(from)) continue
        unique.set(normalizeText(from), { from: from.trim(), to: to.trim() })
    }

    const phrases = [...unique.values()].sort((a, b) => a.from.localeCompare(b.from))

    fs.mkdirSync(path.dirname(DICTIONARY_PATH), { recursive: true })
    fs.writeFileSync(DICTIONARY_PATH, JSON.stringify({ phrases }, null, 2))
}

function loadTranslationState() {
    try {
        const raw = fs.readFileSync(STATE_PATH, 'utf8')
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return { files: {} }
        if (!parsed.files || typeof parsed.files !== 'object') parsed.files = {}
        return parsed
    } catch {
        return { files: {} }
    }
}

function saveTranslationState(state) {
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true })
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
}

function loadTranslationConfig() {
    try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
        const parsed = JSON.parse(raw)
        return {
            ...DEFAULT_TRANSLATION_CONFIG,
            ...parsed,
            protectedTerms: Array.isArray(parsed?.protectedTerms) ? parsed.protectedTerms : DEFAULT_TRANSLATION_CONFIG.protectedTerms,
            commandPrefixes: Array.isArray(parsed?.commandPrefixes) ? parsed.commandPrefixes : DEFAULT_TRANSLATION_CONFIG.commandPrefixes,
            skipPatterns: Array.isArray(parsed?.skipPatterns) ? parsed.skipPatterns : DEFAULT_TRANSLATION_CONFIG.skipPatterns
        }
    } catch {
        return DEFAULT_TRANSLATION_CONFIG
    }
}

function saveTranslationConfig(config) {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

function compileSkipMatchers(config) {
    return (config.skipPatterns || [])
        .map((pattern) => {
            try {
                return new RegExp(pattern, 'i')
            } catch {
                return null
            }
        })
        .filter(Boolean)
}

function escapeReplacement(text) {
    return text.replace(/\$/g, '$$$$')
}

function maskProtectedTerms(text, protectedTerms) {
    let masked = String(text || '')
    const tokens = []

    for (const term of protectedTerms || []) {
        if (!term) continue
        const token = `__PROTECTED_TERM_${tokens.length}__`
        const regex = new RegExp(escapeRegExp(term), 'g')
        if (!regex.test(masked)) continue
        masked = masked.replace(regex, escapeReplacement(token))
        tokens.push({ token, term })
    }

    return { masked, tokens }
}

function unmaskProtectedTerms(text, tokens) {
    let result = String(text || '')
    for (const item of tokens || []) {
        const regex = new RegExp(escapeRegExp(item.token), 'g')
        result = result.replace(regex, item.term)
    }
    return result
}

function applyDictionary(text, phraseMap) {
    let output = text

    for (const [source, target] of [...phraseMap].sort((a, b) => b[0].length - a[0].length)) {
        const regex = new RegExp(escapeRegExp(source), 'gi')
        output = output.replace(regex, (match) => {
            if (match.toUpperCase() === match) return target.toUpperCase()
            if (match[0] === match[0].toUpperCase()) {
                return target.charAt(0).toUpperCase() + target.slice(1)
            }
            return target
        })
    }

    return output
}

function applyWordMap(text) {
    let output = text

    for (const [source, target] of WORD_MAP) {
        const regex = new RegExp(`(?<![A-Za-z])${escapeRegExp(source)}(?![A-Za-z])`, 'gi')
        output = output.replace(regex, (match) => {
            if (match.toUpperCase() === match) return target.toUpperCase()
            if (match[0] === match[0].toUpperCase()) {
                return target.charAt(0).toUpperCase() + target.slice(1)
            }
            return target
        })
    }

    return output
}

function shouldTranslateString(content, runtimeConfig) {
    const trimmed = content.trim()
    if (!trimmed) return false
    if (trimmed.length < 3) return false
    if (/\.(js|json|jpg|jpeg|png|webp|mp3|mp4|pdf)$/i.test(trimmed)) return false
    if (/^[a-z0-9._/-]+$/i.test(trimmed)) return false
    if (/^[-_a-z0-9]+$/i.test(trimmed)) return false
    if (trimmed.includes('require(') || trimmed.includes('module.exports')) return false
    if (looksAlreadySpanish(trimmed)) return false
    if ((runtimeConfig.commandPrefixes || []).some((prefix) => trimmed.startsWith(prefix))) return false
    if ((runtimeConfig.skipMatchers || []).some((regex) => regex.test(trimmed))) return false
    return /[A-Za-z]/.test(trimmed)
}

function translateQuotedString(rawContent, phraseMap, runtimeConfig) {
    if (!shouldTranslateString(rawContent, runtimeConfig)) {
        return { text: rawContent, changed: false }
    }

    const { masked, tokens } = maskProtectedTerms(rawContent, runtimeConfig.protectedTerms)
    let translated = applyDictionary(masked, phraseMap)
    translated = applyWordMap(translated)
    translated = unmaskProtectedTerms(translated, tokens)

    return {
        text: translated,
        changed: translated !== rawContent
    }
}

function translateTemplateLiteral(rawContent, phraseMap, runtimeConfig) {
    let result = ''
    let changed = false
    let segment = ''
    let exprDepth = 0

    for (let i = 0; i < rawContent.length; i++) {
        const char = rawContent[i]
        const next = rawContent[i + 1]
        const prev = rawContent[i - 1]

        if (exprDepth === 0 && char === '$' && next === '{' && prev !== '\\') {
            const translated = translateQuotedString(segment, phraseMap, runtimeConfig)
            result += translated.text
            changed = changed || translated.changed
            segment = ''
            exprDepth = 1
            result += '${'
            i++
            continue
        }

        if (exprDepth > 0) {
            result += char
            if (char === '{' && prev !== '\\') exprDepth++
            if (char === '}' && prev !== '\\') exprDepth--
            continue
        }

        segment += char
    }

    const translated = translateQuotedString(segment, phraseMap, runtimeConfig)
    result += translated.text
    changed = changed || translated.changed

    return { text: result, changed }
}

function translateJavaScriptStrings(code, phraseMap, runtimeConfig) {
    let result = ''
    let changes = 0

    for (let i = 0; i < code.length; i++) {
        const char = code[i]

        if (char === '\'' || char === '"' || char === '`') {
            const quote = char
            let buffer = ''
            let escaped = false
            let closed = false

            for (i = i + 1; i < code.length; i++) {
                const current = code[i]

                if (escaped) {
                    buffer += current
                    escaped = false
                    continue
                }

                if (current === '\\') {
                    buffer += current
                    escaped = true
                    continue
                }

                if (current === quote) {
                    closed = true
                    break
                }

                buffer += current
            }

            const translated = quote === '`'
                ? translateTemplateLiteral(buffer, phraseMap, runtimeConfig)
                : translateQuotedString(buffer, phraseMap, runtimeConfig)

            if (translated.changed) changes++

            result += quote + translated.text + (closed ? quote : '')
            continue
        }

        result += char
    }

    return { code: result, changes }
}

function extractQuotedStrings(code, runtimeConfig) {
    const results = new Set()

    for (let i = 0; i < code.length; i++) {
        const char = code[i]

        if (char !== '\'' && char !== '"' && char !== '`') continue

        const quote = char
        let buffer = ''
        let escaped = false

        for (i = i + 1; i < code.length; i++) {
            const current = code[i]

            if (escaped) {
                buffer += current
                escaped = false
                continue
            }

            if (current === '\\') {
                buffer += current
                escaped = true
                continue
            }

            if (current === quote) {
                break
            }

            buffer += current
        }

        if (quote === '`') {
            const clean = buffer.replace(/\$\{[\s\S]*?\}/g, ' ')
            if (shouldTranslateString(clean, runtimeConfig)) results.add(clean.trim())
        } else if (shouldTranslateString(buffer, runtimeConfig)) {
            results.add(buffer.trim())
        }
    }

    return [...results]
}

function collectPluginFiles(dir, results = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        if (FOLDER_SKIP.has(entry.name)) continue
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            collectPluginFiles(fullPath, results)
            continue
        }
        if (entry.isFile() && entry.name.endsWith('.js')) {
            results.push(fullPath)
        }
    }
    return results
}

function resolveTargets(pluginsDir, args) {
    const value = (args || []).join(' ').trim()
    if (!value || value.toLowerCase() === 'all') {
        return collectPluginFiles(pluginsDir)
    }

    const normalized = value.replace(/\\/g, '/').replace(/\.js$/i, '')
    const directPath = path.join(pluginsDir, normalized)
    const directFile = `${directPath}.js`

    if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
        return collectPluginFiles(directPath)
    }

    if (fs.existsSync(directFile) && fs.statSync(directFile).isFile()) {
        return [directFile]
    }

    const allFiles = collectPluginFiles(pluginsDir)
    const lower = normalized.toLowerCase()

    return allFiles.filter((filePath) => {
        const relative = path.relative(pluginsDir, filePath).replace(/\\/g, '/').replace(/\.js$/i, '').toLowerCase()
        const base = path.basename(filePath, '.js').toLowerCase()
        return relative === lower || base === lower
    })
}

function ensureBackup(filePath, backupRoot, projectRoot) {
    const relative = path.relative(projectRoot, filePath)
    const backupPath = path.join(backupRoot, relative)
    fs.mkdirSync(path.dirname(backupPath), { recursive: true })
    fs.copyFileSync(filePath, backupPath)
}

async function translateTextOnline(text) {
    const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
        params: {
            client: 'gtx',
            sl: 'id',
            tl: 'es',
            dt: 't',
            q: text
        },
        timeout: 30000
    })

    if (!Array.isArray(response.data) || !Array.isArray(response.data[0])) {
        throw new Error('Respuesta invalida del traductor')
    }

    return response.data[0]
        .map((part) => Array.isArray(part) ? part[0] : '')
        .join('')
        .trim()
}

async function translateTextOnlineProtected(text, runtimeConfig) {
    const { masked, tokens } = maskProtectedTerms(text, runtimeConfig.protectedTerms)
    const translated = await translateTextOnline(masked)
    return unmaskProtectedTerms(translated, tokens)
}

async function fillMissingTranslations(targets, phraseMap, runtimeConfig) {
    const existing = new Map(phraseMap.map(([from, to]) => [normalizeText(from), [from, to]]))
    const pending = new Map()

    for (const filePath of targets) {
        const original = fs.readFileSync(filePath, 'utf8')
        for (const text of extractQuotedStrings(original, runtimeConfig)) {
            const key = normalizeText(text)
            const saved = existing.get(key)
            if (saved) continue
            if (looksAlreadySpanish(text)) continue
            pending.set(key, text)
        }
    }

    let translatedCount = 0

    for (const text of pending.values()) {
        try {
            const translated = looksLikeSourceLanguage(text)
                ? await translateTextOnlineProtected(text, runtimeConfig)
                : applyWordMap(text)

            if (translated && normalizeText(translated) !== normalizeText(text)) {
                existing.set(normalizeText(text), [text, translated])
                translatedCount++
            }
        } catch {
            const fallback = applyWordMap(text)
            if (fallback && normalizeText(fallback) !== normalizeText(text)) {
                existing.set(normalizeText(text), [text, fallback])
                translatedCount++
            }
        }
    }

    return {
        phraseMap: [...existing.values()],
        translatedCount
    }
}

async function handler(m) {
    const pluginsDir = path.join(process.cwd(), 'plugins')
    const args = m.args || []
    let phraseMap = loadPhraseMap()
    const rawConfig = loadTranslationConfig()
    const runtimeConfig = {
        ...rawConfig,
        skipMatchers: compileSkipMatchers(rawConfig)
    }
    const translationState = loadTranslationState()

    saveTranslationConfig(rawConfig)

    if (!args.length) {
        return m.reply(
            `*Traducir plugins*\n\n` +
            `Usa este comando para pasar textos visibles de plugins al espanol y recordar el estado.\n\n` +
            `Ejemplos:\n` +
            `> ${m.prefix}traducir-plugins owner\n` +
            `> ${m.prefix}traducir-plugins main/menu\n` +
            `> ${m.prefix}traducir-plugins menu\n` +
            `> ${m.prefix}traducir-plugins all\n\n` +
            `Nota: guarda diccionario, guarda estado por archivo y crea backup antes de cambiar archivos.`
        )
    }

    try {
        const targets = resolveTargets(pluginsDir, args)

        if (!targets.length) {
            return m.reply(`No encontre archivos para traducir con: \`${args.join(' ')}\``)
        }

        await m.reply(`Estoy completando el diccionario y revisando el estado persistente de ${targets.length} archivo(s).`)

        const completed = await fillMissingTranslations(targets, phraseMap, runtimeConfig)
        phraseMap = completed.phraseMap
        savePhraseMap(phraseMap)

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupRoot = path.join(process.cwd(), 'backup', 'translate-plugins', timestamp)
        let changedFiles = 0
        let totalStringChanges = 0
        let skippedAlreadyTranslated = 0
        const changedNames = []

        for (const filePath of targets) {
            const original = fs.readFileSync(filePath, 'utf8')
            const relativeName = path.relative(process.cwd(), filePath).replace(/\\/g, '/')
            const currentHash = hashText(original)
            const fileState = translationState.files[relativeName]

            if (fileState?.translatedHash === currentHash) {
                skippedAlreadyTranslated++
                continue
            }

            const translated = translateJavaScriptStrings(original, phraseMap, runtimeConfig)

            if (!translated.changes || translated.code === original) {
                translationState.files[relativeName] = {
                    sourceHash: currentHash,
                    translatedHash: currentHash,
                    translatedAt: new Date().toISOString()
                }
                continue
            }

            ensureBackup(filePath, backupRoot, process.cwd())
            fs.writeFileSync(filePath, translated.code)

            changedFiles++
            totalStringChanges += translated.changes
            changedNames.push(relativeName)
            translationState.files[relativeName] = {
                sourceHash: currentHash,
                translatedHash: hashText(translated.code),
                translatedAt: new Date().toISOString()
            }

            try {
                hotReloadPlugin(filePath)
            } catch {}
        }

        saveTranslationState(translationState)

        if (!changedFiles) {
            return m.reply(
                `No hice cambios en ${targets.length} archivo(s).\n\n` +
                `> Ya traducidos y conservados: ${skippedAlreadyTranslated}\n` +
                `> Frases nuevas agregadas al diccionario: ${completed.translatedCount}\n` +
                `> Estado guardado en: assets/json/translation-es-state.json`
            )
        }

        let replyText =
            `Traduccion completada.\n\n` +
            `> Frases agregadas al diccionario: ${completed.translatedCount}\n` +
            `> Archivos cambiados: ${changedFiles}\n` +
            `> Archivos ya traducidos que no se tocaron: ${skippedAlreadyTranslated}\n` +
            `> Cadenas ajustadas: ${totalStringChanges}\n` +
            `> Backup: ${path.relative(process.cwd(), backupRoot).replace(/\\/g, '/')}\n` +
            `> Estado: assets/json/translation-es-state.json\n` +
            `> Config: assets/json/translation-es-config.json\n\n`

        replyText += `Primeros archivos tocados:\n`
        changedNames.slice(0, 10).forEach((name) => {
            replyText += `> ${name}\n`
        })

        if (changedNames.length > 10) {
            replyText += `> ...y ${changedNames.length - 10} mas`
        }

        return m.reply(replyText)
    } catch (error) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
