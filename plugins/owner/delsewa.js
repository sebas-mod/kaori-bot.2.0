const { getDatabase } = require('../../src/lib/ourin-database')
const fs = require('fs')

const pluginConfig = {
    name: 'delsewa',
    alias: ['sewadel', 'hapussewa', 'removesewa'],
    category: 'owner',
    description: 'Eliminar grupo del whitelist de alquiler',
    usage: '.delsewa <link/id del grupo>',
    example: '.delsewa https://chat.whatsapp.com/xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function resolveGroupId(sock, input) {
    if (input.includes('chat.whatsapp.com/')) {
        const inviteCode = input.split('chat.whatsapp.com/')[1]?.split(/[\s?]/)[0]
        try {
            const metadata = await sock.groupGetInviteInfo(inviteCode)
            if (metadata?.id) return { id: metadata.id, name: metadata.subject }
        } catch {}
        return null
    }
    return { id: input.includes('@g.us') ? input : input + '@g.us', name: null }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const input = m.text?.trim()

    if (!db.db.data.sewa) {
        db.db.data.sewa = { enabled: false, groups: {} }
        db.db.write()
    }

    let groupId = null
    let groupName = null

    if (!input) {
        if (!m.isGroup) {
            return m.reply(
                `📝 *ELIMINAR SEWA*\n\n` +
                `Desde privado: *${m.prefix}delsewa <link/id>*\n` +
                `Desde grupo: escribe *${m.prefix}delsewa* directamente en el grupo\n\n` +
                `Ejemplo:\n` +
                `• ${m.prefix}delsewa https://chat.whatsapp.com/xxx\n` +
                `• ${m.prefix}delsewa 120363xxx\n\n` +
                `⚠️ Si el sistema de alquiler está activo, el bot saldrá automáticamente del grupo eliminado`
            )
        }
        groupId = m.chat
    } else {
        const result = await resolveGroupId(sock, input)
        if (!result) return m.reply(`❌ Link inválido o grupo no encontrado`)
        groupId = result.id
        groupName = result.name
    }

    if (!groupId) return m.reply(`❌ No se pudo determinar el grupo`)

    const sewaData = db.db.data.sewa.groups[groupId]
    if (!sewaData) return m.reply(`❌ El grupo no está registrado en el sistema de alquiler\n\nVer lista: *${m.prefix}listsewa*`)

    groupName = groupName || sewaData.name || groupId.split('@')[0]

    delete db.db.data.sewa.groups[groupId]
    db.db.write()

    m.react('✅')
    await m.reply(`✅ *SEWA ELIMINADO*\n\nGrupo: *${groupName}*\nID: ${groupId.split('@')[0]}`)

    if (db.db.data.sewa.enabled) {
        try {
            await sock.sendText(groupId, `⛔ Este grupo ha sido eliminado del whitelist de alquiler.\nEl bot abandonará el grupo.\n\nContacta al owner para volver a alquilar.`, null, {
                contextInfo: {
                    forwardingScore: 99,
                    isForwarded: true,
                    externalAdReply: {
                        mediaType: 1,
                        title: 'SEWA ELIMINADO',
                        body: 'Grupo eliminado del whitelist',
                        thumbnail: fs.readFileSync('./assets/images/ourin.jpg'),
                        renderLargerThumbnail: true
                    }
                }
            })
            await new Promise(r => setTimeout(r, 2000))
            await sock.groupLeave(groupId)
        } catch {}
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
