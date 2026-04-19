const { getDatabase } = require('../../src/lib/ourin-database')
const ms = require('ms')

const pluginConfig = {
    name: 'acceso',
    alias: ['daracceso', 'quitaracceso', 'listacceso'],
    category: 'owner',
    description: 'Dar acceso temporal o permanente a comandos',
    usage: '.daracceso <cmd> <duración> <usuario>',
    example: '.daracceso addowner 30d @user',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()

    const isAdd = ['daracceso'].includes(cmd)
    const isDel = ['quitaracceso'].includes(cmd)
    const isList = ['listacceso'].includes(cmd)

    let target = m.mentionedJid?.[0]
    if (!target && m.quoted) target = m.quoted.sender

    if (!target && m.args.length > 0) {
        for (const arg of m.args) {
            if (/^\d{5,15}$/.test(arg)) {
                target = arg + '@s.whatsapp.net'
                break
            } else if (/^@\d+/.test(arg)) {
                target = arg.replace('@', '') + '@s.whatsapp.net'
                break
            }
        }
    }

    let commandTarget = null
    let durationTarget = null

    if (isAdd) {
        if (!target) return m.reply(`❌ Usuario inválido\n\nTag / reply o número`)

        const cleanArgs = m.args.filter(a => !a.includes('@') && !/^\d{10,}$/.test(a))

        if (cleanArgs.length < 2) {
            return m.reply(
                `⚠️ Formato incorrecto\n\n` +
                `Uso: \`${m.prefix}daracceso <cmd> <duración> <usuario>\`\n\n` +
                `Ejemplo:\n` +
                `> ${m.prefix}daracceso addowner 30d @user\n` +
                `> ${m.prefix}daracceso ban permanente @user`
            )
        }

        commandTarget = cleanArgs[0].toLowerCase()
        durationTarget = cleanArgs[1].toLowerCase()
    }

    const user = db.getUser(target) || {}
    if (!user.access) user.access = []

    // LISTAR
    if (isList) {
        if (!target) target = m.sender

        const targetData = db.getUser(target) || {}
        const accessList = targetData.access || []
        const now = Date.now()

        const active = accessList.filter(a => a.expired === null || a.expired > now)

        if (active.length !== accessList.length) {
            targetData.access = active
            db.setUser(target, targetData)
        }

        if (active.length === 0) {
            return m.reply(`📊 Accesos\n\n@${target.split('@')[0]} no tiene accesos`)
        }

        let txt = `📊 *ACCESOS*\n\n`
        txt += `Usuario: @${target.split('@')[0]}\n`
        txt += `Total: ${active.length}\n\n`

        active.forEach((acc, i) => {
            let exp = '∞ Permanente'
            if (acc.expired) {
                const left = acc.expired - now
                exp = left > 0 ? ms(left, { long: true }) : 'Expirado'
            }

            txt += `${i + 1}. ${acc.cmd}\n`
            txt += `   └ ${exp}\n`
        })

        return sock.sendMessage(m.chat, { text: txt, mentions: [target] }, { quoted: m })
    }

    // AGREGAR
    if (isAdd) {
        let expiredTime = null

        if (durationTarget !== 'permanente' && durationTarget !== 'perm') {
            const durationMs = ms(durationTarget)
            if (!durationMs) return m.reply(`❌ Duración inválida (usa: 1h, 1d, 30d)`)
            expiredTime = Date.now() + durationMs
        }

        const idx = user.access.findIndex(a => a.cmd === commandTarget)

        if (idx !== -1) {
            user.access[idx].expired = expiredTime
            db.setUser(target, user)

            return m.reply(
                `✅ Acceso actualizado\n\n` +
                `Cmd: ${commandTarget}\n` +
                `Duración: ${durationTarget}\n` +
                `Usuario: @${target.split('@')[0]}`
            )
        }

        user.access.push({
            cmd: commandTarget,
            expired: expiredTime
        })

        db.setUser(target, user)

        return sock.sendMessage(m.chat, {
            text:
                `✅ Acceso otorgado\n\n` +
                `Cmd: ${commandTarget}\n` +
                `Duración: ${durationTarget}\n` +
                `Usuario: @${target.split('@')[0]}`,
            mentions: [target]
        }, { quoted: m })
    }

    // ELIMINAR
    if (isDel) {
        if (!target) return m.reply(`❌ Tag usuario`)

        let specificCmd = m.args.find(a => !a.includes('@') && !/^\d+$/.test(a))

        if (specificCmd) {
            specificCmd = specificCmd.toLowerCase()

            const idx = user.access.findIndex(a => a.cmd === specificCmd)
            if (idx === -1) return m.reply(`❌ No tiene ese acceso`)

            user.access.splice(idx, 1)
            db.setUser(target, user)

            return m.reply(`✅ Acceso ${specificCmd} eliminado`)
        }

        user.access = []
        db.setUser(target, user)

        return m.reply(`✅ Todos los accesos eliminados`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
