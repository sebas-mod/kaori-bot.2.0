const fs = require('fs')
const path = require('path')
const { hotReloadPlugin } = require('../../src/lib/ourin-plugins')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'traducir-plugins',
    alias: ['traducirplugin', 'traducirplugins', 'espanolizar'],
    category: 'owner',
    description: 'Traduce textos visibles de plugins al espanol',
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

function loadPhraseMap() {
    try {
        const raw = fs.readFileSync(DICTIONARY_PATH, 'utf8')
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed?.phrases)) return []

        return parsed.phrases
            .filter((item) => item && typeof item.from === 'string' && typeof item.to === 'string')
            .map((item) => [item.from, item.to])
    } catch {
        return []
    }
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

function shouldTranslateString(content) {
    const trimmed = content.trim()
    if (!trimmed) return false
    if (trimmed.length < 3) return false
    if (/^(https?:\/\/|\.{0,2}\/|[A-Za-z]:\\|@|#)/.test(trimmed)) return false
    if (/\.(js|json|jpg|jpeg|png|webp|mp3|mp4|pdf)$/i.test(trimmed)) return false
    if (/^[a-z0-9._/-]+$/i.test(trimmed)) return false
    if (/^[-_a-z0-9]+$/i.test(trimmed)) return false
    if (trimmed.includes('require(') || trimmed.includes('module.exports')) return false
    return /[A-Za-z]/.test(trimmed)
}

function translateQuotedString(rawContent, phraseMap) {
    if (!shouldTranslateString(rawContent)) {
        return { text: rawContent, changed: false }
    }

    let translated = applyDictionary(rawContent, phraseMap)
    translated = applyWordMap(translated)
    return {
        text: translated,
        changed: translated !== rawContent
    }
}

function translateTemplateLiteral(rawContent, phraseMap) {
    let result = ''
    let changed = false
    let segment = ''
    let exprDepth = 0

    for (let i = 0; i < rawContent.length; i++) {
        const char = rawContent[i]
        const next = rawContent[i + 1]
        const prev = rawContent[i - 1]

        if (exprDepth === 0 && char === '$' && next === '{' && prev !== '\\') {
            const translated = translateQuotedString(segment, phraseMap)
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

    const translated = translateQuotedString(segment, phraseMap)
    result += translated.text
    changed = changed || translated.changed

    return { text: result, changed }
}

function translateJavaScriptStrings(code, phraseMap) {
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
                ? translateTemplateLiteral(buffer, phraseMap)
                : translateQuotedString(buffer, phraseMap)

            if (translated.changed) changes++

            result += quote + translated.text + (closed ? quote : '')
            continue
        }

        result += char
    }

    return {
        code: result,
        changes
    }
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

    const matched = allFiles.filter((filePath) => {
        const relative = path.relative(pluginsDir, filePath).replace(/\\/g, '/').replace(/\.js$/i, '').toLowerCase()
        const base = path.basename(filePath, '.js').toLowerCase()
        return relative === lower || base === lower
    })

    return matched
}

function ensureBackup(filePath, backupRoot, projectRoot) {
    const relative = path.relative(projectRoot, filePath)
    const backupPath = path.join(backupRoot, relative)
    fs.mkdirSync(path.dirname(backupPath), { recursive: true })
    fs.copyFileSync(filePath, backupPath)
}

async function handler(m) {
    const pluginsDir = path.join(process.cwd(), 'plugins')
    const args = m.args || []
    const phraseMap = loadPhraseMap()

    if (!args.length) {
        return m.reply(
            `*Traducir plugins*\n\n` +
            `Usa este comando para pasar textos visibles de plugins al espanol.\n\n` +
            `Ejemplos:\n` +
            `> ${m.prefix}traducir-plugins owner\n` +
            `> ${m.prefix}traducir-plugins main/menu\n` +
            `> ${m.prefix}traducir-plugins menu\n` +
            `> ${m.prefix}traducir-plugins all\n\n` +
            `Nota: usa el diccionario en assets/json/translation-es.json y crea backup antes de cambiar archivos.`
        )
    }

    try {
        if (!phraseMap.length) {
            return m.reply(`No pude cargar el diccionario: \`assets/json/translation-es.json\``)
        }

        const targets = resolveTargets(pluginsDir, args)

        if (!targets.length) {
            return m.reply(`No encontre archivos para traducir con: \`${args.join(' ')}\``)
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupRoot = path.join(process.cwd(), 'backup', 'translate-plugins', timestamp)
        let changedFiles = 0
        let totalStringChanges = 0
        const changedNames = []

        for (const filePath of targets) {
            const original = fs.readFileSync(filePath, 'utf8')
            const translated = translateJavaScriptStrings(original, phraseMap)

            if (!translated.changes || translated.code === original) continue

            ensureBackup(filePath, backupRoot, process.cwd())
            fs.writeFileSync(filePath, translated.code)

            changedFiles++
            totalStringChanges += translated.changes
            changedNames.push(path.relative(process.cwd(), filePath).replace(/\\/g, '/'))

            try {
                hotReloadPlugin(filePath)
            } catch {}
        }

        if (!changedFiles) {
            return m.reply(
                `No hice cambios en ${targets.length} archivo(s).\n\n` +
                `Posibles motivos:\n` +
                `> - ya estaban en espanol\n` +
                `> - no habia textos detectables para traducir\n` +
                `> - eran cadenas tecnicas que el plugin ignora por seguridad`
            )
        }

        let replyText =
            `Traduccion completada.\n\n` +
            `> Archivos cambiados: ${changedFiles}\n` +
            `> Cadenas ajustadas: ${totalStringChanges}\n` +
            `> Backup: ${path.relative(process.cwd(), backupRoot).replace(/\\/g, '/')}\n\n`

        replyText += `Primeros archivos tocados:\n`
        changedNames.slice(0, 10).forEach((name) => {
            replyText += `> ${name}\n`
        })

        if (changedNames.length > 10) {
            replyText += `> ...y ${changedNames.length - 10} mas`
        }

        replyText += `\n\nConsejo: prueba primero con una carpeta como \`owner\` antes de usar \`all\`.`

        return m.reply(replyText)
    } catch (error) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
