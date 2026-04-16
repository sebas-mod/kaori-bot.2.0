const { execSync, exec } = require('child_process')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'update',
    alias: ['gitpull', 'updatebot', 'pullupdate'],
    category: 'owner',
    description: 'Update bot dari GitHub menggunakan git pull',
    usage: '.update',
    example: '.update',
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

        // Verificar git instalado
        const gitCheck = execSafe('git --version')
        if (!gitCheck.success) {
            return m.reply(
                `❌ *ɢᴀɢᴀʟ*\n\n` +
                `> Git tidak terinstall di server ini\n` +
                `> Install git: \`apt install git\` / \`pkg install git\``
            )
        }

        // Verificar si el directorio tiene git init
        const isGitRepo = fs.existsSync(path.join(baseDir, '.git'))
        if (!isGitRepo) {
            await m.reply(
                `⚙️ *ɪɴɪᴛ ɢɪᴛ*\n\n` +
                `> Direktori belum terhubung ke git\n` +
                `> Menginisialisasi dan menghubungkan ke repo...`
            )

            execSafe('git init', { cwd: baseDir })
            execSafe(`git remote add origin ${REPO_URL}`, { cwd: baseDir })
            execSafe(`git fetch origin ${BRANCH}`, { cwd: baseDir })

            const resetResult = execSafe(`git reset --hard origin/${BRANCH}`, { cwd: baseDir })
            if (!resetResult.success) {
                await m.react('❌')
                return m.reply(
                    `❌ *ɢᴀɢᴀʟ ɪɴɪᴛ ɢɪᴛ*\n\n` +
                    `> ${resetResult.output?.slice(0, 300)}`
                )
            }

            await m.react('✅')
            return m.reply(
                `✅ *ɢɪᴛ ɪɴɪᴛ sᴜᴋsᴇs*\n\n` +
                `> Repo berhasil dihubungkan!\n` +
                `> Jalankan \`.update\` lagi untuk update selanjutnya.`
            )
        }

        // Pastikan remote origin benar
        const remoteResult = execSafe('git remote get-url origin', { cwd: baseDir })
        if (!remoteResult.success || !remoteResult.output.includes('sebas-mod/kaori-bot')) {
            execSafe('git remote remove origin', { cwd: baseDir })
            execSafe(`git remote add origin ${REPO_URL}`, { cwd: baseDir })
        }

        await m.reply(
            `🔄 *ᴜᴘᴅᴀᴛᴇ ʙᴏᴛ*\n\n` +
            `> 📦 Repo: \`sebas-mod/kaori-bot.2.0\`\n` +
            `> 🌿 Branch: \`${BRANCH}\`\n\n` +
            `📡 Step 1/3 — Mengambil perubahan dari GitHub...`
        )

        // Fetch terbaru dari remote
        const fetchResult = execSafe(`git fetch origin ${BRANCH}`, { cwd: baseDir })
        if (!fetchResult.success) {
            await m.react('❌')
            return m.reply(
                `❌ *ɢᴀɢᴀʟ ꜰᴇᴛᴄʜ*\n\n` +
                `> Tidak dapat menghubungi GitHub\n` +
                `> ${fetchResult.output?.slice(0, 200)}\n\n` +
                `> Pastikan koneksi internet aktif`
            )
        }

        // Cek log commit
        const localHash = execSafe('git rev-parse HEAD', { cwd: baseDir }).output
        const remoteHash = execSafe(`git rev-parse origin/${BRANCH}`, { cwd: baseDir }).output

        if (localHash === remoteHash) {
            await m.react('✅')
            return m.reply(
                `✅ *ʙᴏᴛ sᴜᴅᴀʜ ᴜᴘ-ᴛᴏ-ᴅᴀᴛᴇ*\n\n` +
                `> Tidak ada perubahan baru di GitHub\n` +
                `> Commit: \`${localHash.slice(0, 7)}\`\n\n` +
                `> Coba lagi nanti setelah push ke repo`
            )
        }

        // Cek file yang berubah
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
                    const statusLabel = status === 'M' ? '✏️ Modified' :
                                       status === 'A' ? '➕ Added' :
                                       status === 'D' ? '🗑️ Deleted' :
                                       status.startsWith('R') ? '🔄 Renamed' : '📄 Changed'
                    if (file === 'package.json') packageJsonChanged = true
                    return `${statusLabel}: \`${file}\``
                })
        }

        const changedCount = changedFiles.length
        const preview = changedFiles.slice(0, 10).join('\n')
        const extra = changedCount > 10 ? `\n_...dan ${changedCount - 10} file lainnya_` : ''

        await m.reply(
            `📋 *ᴘᴇʀᴜʙᴀʜᴀɴ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
            `> 📁 Total file berubah: \`${changedCount}\`\n\n` +
            (preview ? `${preview}${extra}\n\n` : '') +
            `⬇️ Step 2/3 — Menerapkan update...`
        )

        // Simpan perubahan lokal jika ada (stash)
        execSafe('git stash', { cwd: baseDir })

        // Pull perubahan
        const pullResult = execSafe(`git pull origin ${BRANCH} --rebase`, { cwd: baseDir })
        if (!pullResult.success) {
            // Intento forzado si falla el rebase
            execSafe('git stash pop', { cwd: baseDir })
            const forcePull = execSafe(`git reset --hard origin/${BRANCH}`, { cwd: baseDir })
            if (!forcePull.success) {
                await m.react('❌')
                return m.reply(
                    `❌ *ɢᴀɢᴀʟ ᴘᴜʟʟ*\n\n` +
                    `> ${pullResult.output?.slice(0, 300)}\n\n` +
                    `> Coba jalankan manual: \`git pull origin ${BRANCH}\``
                )
            }
        }

        // Instalar dependencias si package.json cambió
        if (packageJsonChanged) {
            await m.reply(`🔧 Step 3/3 — \`package.json\` berubah, installing dependencies...`)
            const npmResult = execSafe('npm install --production', { cwd: baseDir, timeout: 300000 })
            if (!npmResult.success) {
                await m.reply(
                    `⚠️ *ɴᴘᴍ ɪɴsᴛᴀʟʟ ɢᴀɢᴀʟ*\n\n` +
                    `> ${npmResult.output?.slice(0, 200)}\n` +
                    `> Jalankan \`npm install\` manual jika diperlukan`
                )
            }
        }

        // Obtener info del commit nuevo
        const newHash = execSafe('git rev-parse HEAD', { cwd: baseDir }).output
        const commitMsg = execSafe('git log -1 --pretty=%s', { cwd: baseDir }).output
        const commitAuthor = execSafe('git log -1 --pretty=%an', { cwd: baseDir }).output
        const commitDate = execSafe('git log -1 --pretty=%ar', { cwd: baseDir }).output

        await m.react('✅')

        await sock.sendMessage(m.chat, {
            text:
                `✅ *ᴜᴘᴅᴀᴛᴇ sᴇʟᴇsᴀɪ!*\n\n` +
                `╭┈┈⬡「 📊 *ʀɪɴɢᴋᴀsᴀɴ* 」\n` +
                `┃ 📁 File diperbarui: \`${changedCount}\`\n` +
                `┃ 🔖 Commit: \`${newHash.slice(0, 7)}\`\n` +
                `┃ 💬 Pesan: ${commitMsg || '-'}\n` +
                `┃ 👤 Author: ${commitAuthor || '-'}\n` +
                `┃ 🕐 Waktu: ${commitDate || '-'}\n` +
                `┃ 📦 Repo: \`sebas-mod/kaori-bot.2.0\`\n` +
                `╰┈┈⬡\n\n` +
                `> Bot akan restart dalam 3 detik...`
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
            `❌ *ᴜᴘᴅᴀᴛᴇ ɢᴀɢᴀʟ*\n\n` +
            `> ${error.message?.slice(0, 300)}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
