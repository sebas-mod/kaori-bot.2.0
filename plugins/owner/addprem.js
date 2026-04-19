const config = require('../../config')
const { getDatabase } = require('../../src/lib/ourin-database')
const { addJadibotPremium, removeJadibotPremium, getJadibotPremiums } = require('../../src/lib/ourin-jadibot-database')

const pluginConfig = {
    name: 'addprem',
    alias: ['addpremium', 'setprem', 'delprem', 'delpremium', 'listprem', 'premlist'],
    category: 'owner',
    description: 'Gestionar usuarios premium',
    usage: '.addprem <número/@tag> [días]\n.delprem <número/@tag>\n.listprem\n.cekprem <número/@tag>',
    example: '.addprem 6281234567890 30',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function extractTarget(m) {
    if (m.quoted) return m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    if (m.mentionedJid?.length) return m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    if (m.args?.length) return m.args[0].replace(/[^0-9]/g, '')
    return ''
}

async function handler(m, { sock, jadibotId, isJadibot }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()

    const isAdd = ['addprem', 'addpremium', 'setprem'].includes(cmd)
    const isDel = ['delprem', 'delpremium'].includes(cmd)
    const isList = ['listprem', 'premlist'].includes(cmd)

    if (!db.data.premium) db.data.premium = []

    if (isList) {
        if (isJadibot && jadibotId) {
            const jbPremiums = getJadibotPremiums(jadibotId)
            if (jbPremiums.length === 0) {
                return m.reply(`💎 No hay usuarios premium en este jadibot\nUsa \`${m.prefix}addprem\` para agregar`)
            }
            let txt = `💎 *LISTA PREMIUM JADIBOT* — ${jadibotId}\n\n`
            jbPremiums.forEach((p, i) => {
                const num = typeof p === 'string' ? p : p.jid
                txt += `${i + 1}. \`${num}\`\n`
            })
            txt += `\nTotal: *${jbPremiums.length}* premium`
            return m.reply(txt)
        }

        if (db.data.premium.length === 0) {
            return m.reply(`💎 No hay usuarios premium registrados`)
        }
        let txt = `💎 *LISTA PREMIUM*\n\n`
        const now = Date.now()
        db.data.premium.forEach((p, i) => {
            const num = typeof p === 'string' ? p : p.id
            const remaining = typeof p === 'object' && p.expired
                ? Math.ceil((p.expired - now) / (1000 * 60 * 60 * 24))
                : null
            const status = remaining === null ? 'Permanente' : (remaining > 0 ? remaining + 'd' : 'Expirado')
            txt += `${i + 1}. \`${num}\` — ${status}\n`
        })
        txt += `\nTotal: *${db.data.premium.length}* premium`
        return m.reply(txt)
    }

    let targetNumber = extractTarget(m)

    if (!targetNumber) {
        return m.reply(`💎 *${isAdd ? 'AGREGAR' : 'ELIMINAR'} PREMIUM*\n\nIngresa el número o etiqueta al usuario\n\`Ejemplo: ${m.prefix}${cmd} 6281234567890\``)
    }

    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }

    if (targetNumber.length < 10 || targetNumber.length > 15) {
        return m.reply(`❌ Formato de número inválido`)
    }

    if (isJadibot && jadibotId) {
        if (isAdd) {
            if (addJadibotPremium(jadibotId, targetNumber)) {
                m.react('💎')
                return m.reply(`✅ Se agregó correctamente *${targetNumber}* como premium del jadibot`)
            } else {
                return m.reply(`❌ \`${targetNumber}\` ya es premium en este Jadibot`)
            }
        } else if (isDel) {
            if (removeJadibotPremium(jadibotId, targetNumber)) {
                m.react('✅')
                return m.reply(`✅ Se eliminó correctamente *${targetNumber}* del jadibot`)
            } else {
                return m.reply(`❌ \`${targetNumber}\` no es premium en este Jadibot`)
            }
        }
        return
    }

    if (isAdd) {
        const existingIndex = db.data.premium.findIndex(p =>
            typeof p === 'string' ? p === targetNumber : p.id === targetNumber
        )

        const days = parseInt(m.args?.find(a => /^\d+$/.test(a) && a.length <= 4)) || 30
        const pushName = m.quoted?.pushName || m.pushName || 'Desconocido'
        const now = Date.now()

        let newExpired

        if (existingIndex !== -1) {
            const currentData = db.data.premium[existingIndex]
            const currentExpired = typeof currentData === 'string' ? now : (currentData.expired || now)
            const baseTime = currentExpired > now ? currentExpired : now
            newExpired = baseTime + (days * 24 * 60 * 60 * 1000)

            if (typeof currentData === 'string') {
                db.data.premium[existingIndex] = {
                    id: targetNumber,
                    expired: newExpired,
                    name: pushName,
                    addedAt: now
                }
            } else {
                db.data.premium[existingIndex].expired = newExpired
                db.data.premium[existingIndex].name = pushName
            }
        } else {
            newExpired = now + (days * 24 * 60 * 60 * 1000)
            db.data.premium.push({
                id: targetNumber,
                expired: newExpired,
                name: pushName,
                addedAt: now
            })
        }

        const jid = targetNumber + '@s.whatsapp.net'
        const user = db.getUser(jid) || db.setUser(jid)

        if (user.energi !== -1) {
            user.energi = config.limits?.premium || 100
        }
        user.isPremium = true

        db.setUser(jid, user)
        db.updateExp(jid, 200000)
        db.updateKoin(jid, 20000)

        db.save()

        m.react('💎')
        return m.reply(`✅ Se ${existingIndex !== -1 ? 'extendió' : 'agregó'} el premium a *${targetNumber}* por *${days} días*\nExpira: *${formatDate(newExpired)}*`)
    } else if (isDel) {
        const index = db.data.premium.findIndex(p =>
            typeof p === 'string' ? p === targetNumber : p.id === targetNumber
        )

        if (index === -1) {
            return m.reply(`❌ *${targetNumber}* no es premium`)
        }

        db.data.premium.splice(index, 1)

        const jid = targetNumber + '@s.whatsapp.net'
        const user = db.getUser(jid)
        if (user) {
            user.isPremium = false
            db.setUser(jid, user)
        }

        db.save()
        m.react('✅')
        return m.reply(`✅ Se eliminó correctamente *${targetNumber}* de premium`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
