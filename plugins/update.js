const { execSync } = require('child_process')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'up',
    alias: ['update', 'gitpull'],
    category: 'owner',
    description: 'Actualizar el bot desde GitHub usando git pull',
    usage: '.up',
    example: '.up',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

const REPO_URL = 'https://github.com/sebas-mod/kaori-bot.2.0'
const BRANCH = 'main'

function execSafe(cmd, opts = {}) {
    try {
        return { success: true, output: execSync(cmd, { stdio: 'pipe', timeout: 120000, ...opts }).toString().trim() }
    } catch (e) {
        return { success: false, output: e.stderr?.toString().trim() || e.message }
    }
}

async function handler(m, { sock }) {
    const baseDir = process.cwd()

    try {
        await m.react('🕐')

        const gitCheck = execSafe('git --version')
        if (!gitCheck.success) {
            return m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `> Git no está instalado en este servidor\n` +
                `> Instala git: \`apt install git\` / \`pkg install git\``
            )
        }

        const isGitRepo = fs.existsSync(path.join(baseDir, '.git'))
        if (!isGitRepo) {
            await m.reply(
                `⚙️ *ɪɴɪᴄɪᴀʟɪᴢᴀɴᴅᴏ ɢɪᴛ*\n\n` +
                `> El directorio aún no está conectado a git\n` +
                `> Inicializando y conectando al repositorio...`
            )

            execSafe('git init', { cwd: baseDir })
            execSafe(`git remote add origin ${REPO_URL}`, { cwd: baseDir })
            execSafe(`git fetch origin ${BRANCH}`, { cwd: baseDir })

            const resetResult = execSafe(`git reset --hard origin/${BRANCH}`, { cwd: baseDir })
            if (!resetResult.success) {
                await m.react('❌')
                return m.reply(
                    `❌ *ᴇʀʀᴏʀ ᴀʟ ɪɴɪᴄɪᴀʟɪᴢᴀʀ ɢɪᴛ*\n\n` +
                    `> ${resetResult.output?.slice(0, 300)}`
                )
            }

            await m.react('✅')
            return m.reply(
                `✅ *ɢɪᴛ ɪɴɪᴄɪᴀʟɪᴢᴀᴅᴏ*\n\n` +
                `> ¡Repositorio conectado correctamente!\n` +
                `> Ejecuta \`.up\` de nuevo para actualizar.`
            )
        }

        const remoteResult = execSafe('git remote get-url origin', { cwd: baseDir })
        if (!remoteResult.success || !remoteResult.output.includes('sebas-mod/kaori-bot')) {
            execSafe('git remote remove origin', { cwd: baseDir })
            execSafe(`git remote add origin ${REPO_URL}`, { cwd: baseDir })
        }

        await m.reply(
            `🔄 *ᴀᴄᴛᴜᴀʟɪᴢᴀɴᴅᴏ ʙᴏᴛ*\n\n` +
            `> 📦 Repo: \`sebas-mod/kaori-bot.2.0\`\n` +
            `> 🌿 Rama: \`${BRANCH}\`\n\n` +
            `📡 Paso 1/3 — Obteniendo cambios de GitHub...`
        )

        const fetchResult = execSafe(`git fetch origin ${BRANCH}`, { cwd: baseDir })
        if (!fetchResult.success) {
            await m.react('❌')
            return m.reply(
                `❌ *ᴇʀʀᴏʀ ᴀʟ ᴄᴏɴᴇᴄᴛᴀʀ*\n\n` +
                `> No se pudo contactar con GitHub\n` +
                `> ${fetchResult.output?.slice(0, 200)}\n\n` +
                `> Verifica tu conexión a internet`
            )
        }

        const localHash = execSafe('git rev-parse HEAD', { cwd: baseDir }).output
        const remoteHash = execSafe(`git rev-parse origin/${BRANCH}`, { cwd: baseDir }).output

        if (localHash === remoteHash) {
            await m.react('✅')
            return m.reply(
                `✅ *ʙᴏᴛ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴏ*\n\n` +
                `> No hay cambios nuevos en GitHub\n` +
                `> Commit actual: \`${localHash.slice(0, 7)}\`\n\n` +
                `> Vuelve a intentarlo después de hacer push al repo`
            )
        }

        const diffResult = execSafe(`git diff --name-status HEAD origin/${BRANCH}`, { cwd: baseDir })
        let changedFiles = []
        let packageJsonChanged = false

        if (diffResult.success && diffResult.output) {
            changedFiles = diffResult.output
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const parts = line.split('\t')
                    const status = parts[0]
                    const file = parts[1] || parts[0]
                    const statusLabel = status === 'M' ? '✏️ Modificado' :
                                       status === 'A' ? '➕ Agregado' :
                                       status === 'D' ? '🗑️ Eliminado' :
                                       status.startsWith('R') ? '🔄 Renombrado' : '📄 Cambiado'
                    if (file === 'package.json') packageJsonChanged = true
                    return `${statusLabel}: \`${file}\``
                })
        }

        const changedCount = changedFiles.length
        const preview = changedFiles.slice(0, 10).join('\n')
        const extra = changedCount > 10 ? `\n_...y ${changedCount - 10} archivos más_` : ''

        await m.reply(
            `📋 *ᴄᴀᴍʙɪᴏs ᴅᴇᴛᴇᴄᴛᴀᴅᴏs*\n\n` +
            `> 📁 Total de archivos cambiados: \`${changedCount}\`\n\n` +
            (preview ? `${preview}${extra}\n\n` : '') +
            `⬇️ Paso 2/3 — Aplicando actualización...`
        )

        execSafe('git stash', { cwd: baseDir })

        const pullResult = execSafe(`git pull origin ${BRANCH} --rebase`, { cwd: baseDir })
        if (!pullResult.success) {
            execSafe('git stash pop', { cwd: baseDir })
            const forcePull = execSafe(`git reset --hard origin/${BRANCH}`, { cwd: baseDir })
            if (!forcePull.success) {
                await m.react('❌')
                return m.reply(
                    `❌ *ᴇʀʀᴏʀ ᴀʟ ᴀᴄᴛᴜᴀʟɪᴢᴀʀ*\n\n` +
                    `> ${pullResult.output?.slice(0, 300)}\n\n` +
                    `> Intenta manualmente: \`git pull origin ${BRANCH}\``
                )
            }
        }

        if (packageJsonChanged) {
            await m.reply(`🔧 Paso 3/3 — \`package.json\` fue modificado, instalando dependencias...`)
            const npmResult = execSafe('npm install --production', { cwd: baseDir, timeout: 300000 })
            if (!npmResult.success) {
                await m.reply(
                    `⚠️ *ᴇʀʀᴏʀ ᴇɴ ɴᴘᴍ ɪɴsᴛᴀʟʟ*\n\n` +
                    `> ${npmResult.output?.slice(0, 200)}\n` +
                    `> Ejecuta \`npm install\` manualmente si es necesario`
                )
            }
        }

        const newHash = execSafe('git rev-parse HEAD', { cwd: baseDir }).output
        const commitMsg = execSafe('git log -1 --pretty=%s', { cwd: baseDir }).output
        const commitAuthor = execSafe('git log -1 --pretty=%an', { cwd: baseDir }).output
        const commitDate = execSafe('git log -1 --pretty=%ar', { cwd: baseDir }).output

        await m.react('✅')

        await sock.sendMessage(m.chat, {
            text:
                `✅ *¡ᴀᴄᴛᴜᴀʟɪᴢᴀᴄɪóɴ ᴄᴏᴍᴘʟᴇᴛᴀ!*\n\n` +
                `╭┈┈⬡「 📊 *ʀᴇsᴜᴍᴇɴ* 」\n` +
                `┃ 📁 Archivos actualizados: \`${changedCount}\`\n` +
                `┃ 🔖 Commit: \`${newHash.slice(0, 7)}\`\n` +
                `┃ 💬 Mensaje: ${commitMsg || '-'}\n` +
                `┃ 👤 Autor: ${commitAuthor || '-'}\n` +
                `┃ 🕐 Hace: ${commitDate || '-'}\n` +
                `┃ 📦 Repo: \`sebas-mod/kaori-bot.2.0\`\n` +
                `╰┈┈⬡\n\n` +
                `> El bot se reiniciará en 3 segundos...`
        }, { quoted: m })

        setTimeout(() => {
            const child = spawn('node', ['index.js'], {
                cwd: baseDir,
                detached: true,
                stdio: 'ignore',
                env: { ...process.env, RESTARTED: 'true' }
            })
            child.unref()
            process.exit(0)
        }, 3000)

    } catch (error) {
        await m.react('❌')
        return m.reply(
            `❌ *ᴇʀʀᴏʀ ᴀʟ ᴀᴄᴛᴜᴀʟɪᴢᴀʀ*\n\n` +
            `> ${error.message?.slice(0, 300)}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
