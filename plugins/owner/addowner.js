const config = require('../../config')
const { getDatabase } = require('../../src/lib/ourin-database')
const { addJadibotOwner, removeJadibotOwner, getJadibotOwners } = require('../../src/lib/ourin-jadibot-database')
const fs = require('fs')
const path = require('path')
const { isLid, lidToJid } = require('../../src/lib/ourin-lid')
const { getGroupMode } = require('../group/botmode')

const pluginConfig = {
    name: 'addowner',
    alias: ['addown', 'setowner', 'delowner', 'delown', 'ownerlist', 'listowner'],
    category: 'owner',
    description: 'Gestionar propietarios del bot (según modo)',
    usage: '.addowner <número/@tag/reply>',
    example: '.addowner 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function cleanJid(jid) {
    if (!jid) return null
    if (isLid(jid)) jid = lidToJid(jid)
    return jid.includes('@') ? jid : jid + '@s.whatsapp.net'
}

function extractNumber(m) {
    const { resolveAnyLidToJid, isLid, isLidConverted } = require('../../src/lib/ourin-lid')
    let targetNumber = ''
    
    if (m.quoted) {
        let sender = m.quoted.sender || ''
        if (isLid(sender) || isLidConverted(sender)) {
            sender = resolveAnyLidToJid(sender, m.groupMembers || [])
        }
        targetNumber = sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        let jid = cleanJid(m.mentionedJid[0])
        if (isLid(jid) || isLidConverted(jid)) {
            jid = resolveAnyLidToJid(jid, m.groupMembers || [])
        }
        targetNumber = jid?.replace(/[^0-9]/g, '') || ''
    } else if (m.args[0]) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
        if (targetNumber.startsWith('08')) {
            targetNumber = '62' + targetNumber.slice(1)
        }
    }
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    if (targetNumber.length > 15) {
        return ''
    }
    
    return targetNumber
}

function savePanelConfig() {
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let content = fs.readFileSync(configPath, 'utf8')
        
        const ownerPanelsStr = JSON.stringify(config.pterodactyl.ownerPanels || [])
        content = content.replace(
            /ownerPanels:\s*\[.*?\]/s,
            `ownerPanels: ${ownerPanelsStr}`
        )
        
        const sellersStr = JSON.stringify(config.pterodactyl.sellers || [])
        content = content.replace(
            /sellers:\s*\[.*?\]/s,
            `sellers: ${sellersStr}`
        )
        
        fs.writeFileSync(configPath, content, 'utf8')
        return true
    } catch (e) {
        console.error('[AddOwner] Error al guardar config del panel:', e.message)
        return false
    }
}

function removeFromSellers(targetNumber) {
    if (!config.pterodactyl.sellers) return false
    const idx = config.pterodactyl.sellers.findIndex(s => String(s).trim() === String(targetNumber).trim())
    if (idx !== -1) {
        config.pterodactyl.sellers.splice(idx, 1)
        return true
    }
    return false
}

function removeFromOwnerPanels(targetNumber) {
    if (!config.pterodactyl.ownerPanels) return false
    const idx = config.pterodactyl.ownerPanels.findIndex(s => String(s).trim() === String(targetNumber).trim())
    if (idx !== -1) {
        config.pterodactyl.ownerPanels.splice(idx, 1)
        return true
    }
    return false
}

async function handler(m, { sock, jadibotId, isJadibot }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    const groupMode = m.isGroup ? getGroupMode(m.chat, db) : 'private'
    const isCpanelMode = m.isGroup && groupMode === 'cpanel'
    
    const isAdd = ['addowner', 'addown', 'setowner'].includes(cmd)
    const isDel = ['delowner', 'delown'].includes(cmd)
    const isList = ['ownerlist', 'listowner'].includes(cmd)
    
    if (!config.pterodactyl) config.pterodactyl = {}
    if (!config.pterodactyl.ownerPanels) config.pterodactyl.ownerPanels = []
    if (!config.pterodactyl.sellers) config.pterodactyl.sellers = []
    if (!db.data.owner) db.data.owner = []
    
    if (isList) {
        if (isJadibot && jadibotId) {
            const jbOwners = getJadibotOwners(jadibotId)
            if (jbOwners.length === 0) {
                return m.reply(`📋 *LISTA DE OWNERS JADIBOT*\n\n> Aún no hay owners registrados.\n> Usa \`${m.prefix}addowner\` para agregar.`)
            }
            let txt = `📋 *LISTA DE OWNERS JADIBOT* — ${jadibotId}\n\n`
            jbOwners.forEach((s, i) => { txt += `${i + 1}. \`${s}\`\n` })
            txt += `\nTotal: *${jbOwners.length}* owners`
            return m.reply(txt)
        } else if (isCpanelMode) {
            const panelOwners = config.pterodactyl.ownerPanels || []
            const fullOwners = db.data.owner || []
            const allOwners = [...new Set([...panelOwners, ...fullOwners])]
            
            if (allOwners.length === 0) {
                return m.reply(`📋 *LISTA DE OWNERS PANEL*\n\n> Aún no hay owners del panel.`)
            }
            let txt = `📋 *LISTA DE OWNERS PANEL*\n\n`
            allOwners.forEach((s, i) => {
                const label = panelOwners.includes(s) && fullOwners.includes(s) ? '👑🖥️' : (fullOwners.includes(s) ? '👑' : '🖥️')
                txt += `${i + 1}. ${label} \`${s}\`\n`
            })
            txt += `\nTotal: *${allOwners.length}* owners | 👑 Completo, 🖥️ Panel`
            return m.reply(txt)
        } else {
            const fullOwners = db.data.owner || []
            if (fullOwners.length === 0) {
                return m.reply(`📋 *LISTA DE FULL OWNERS*\n\n> Aún no hay owners completos.`)
            }
            let txt = `📋 *LISTA DE FULL OWNERS*\n\n`
            fullOwners.forEach((s, i) => { txt += `${i + 1}. 👑 \`${s}\`\n` })
            txt += `\nTotal: *${fullOwners.length}* owners`
            return m.reply(txt)
        }
    }
    
    const targetNumber = extractNumber(m)
    
    if (!targetNumber) {
        return m.reply(
            `👑 *${isAdd ? 'AGREGAR' : 'ELIMINAR'} OWNER*\n\n` +
            `Responde/etiqueta/escribe el número del usuario\n` +
            `\`Ejemplo: ${m.prefix}${cmd} 6281234567890\``
        )
    }
    
    if (targetNumber.length < 10 || targetNumber.length > 15) {
        return m.reply(`❌ *ERROR*\n\n> Formato de número inválido`)
    }
    
    if (isJadibot && jadibotId) {
        if (isAdd) {
            if (addJadibotOwner(jadibotId, targetNumber)) {
                m.react('👑')
                return m.reply(`✅ Se agregó correctamente *${targetNumber}* como owner del jadibot`)
            } else {
                return m.reply(`❌ \`${targetNumber}\` ya es owner de este Jadibot.`)
            }
        } else if (isDel) {
            if (removeJadibotOwner(jadibotId, targetNumber)) {
                m.react('✅')
                return m.reply(`✅ Se eliminó correctamente *${targetNumber}* del jadibot`)
            } else {
                return m.reply(`❌ \`${targetNumber}\` no es owner de este Jadibot.`)
            }
        }
        return
    }
    
    if (isCpanelMode) {
        if (isAdd) {
            if (config.pterodactyl.ownerPanels.includes(targetNumber)) {
                return m.reply(`❌ \`${targetNumber}\` ya es owner del panel.`)
            }
            
            let roleChanged = ''
            if (removeFromSellers(targetNumber)) {
                roleChanged = `\n> ⚡ Auto-ascendido de Seller a Owner Panel`
            }
            
            config.pterodactyl.ownerPanels.push(targetNumber)
            if (savePanelConfig()) {
                m.react('👑')
                return m.reply(`✅ Se agregó correctamente *${targetNumber}* como owner del panel${roleChanged}`)
            } else {
                config.pterodactyl.ownerPanels = config.pterodactyl.ownerPanels.filter(s => s !== targetNumber)
                return m.reply(`❌ Error al guardar en config.js`)
            }
        } else if (isDel) {
            const ownerList = config.pterodactyl.ownerPanels || []
            const found = ownerList.find(o => String(o).trim() === String(targetNumber).trim())
            if (!found) {
                return m.reply(`❌ \`${targetNumber}\` no es owner del panel.\n\n> Lista actual: ${ownerList.join(', ') || 'vacía'}`)
            }
            config.pterodactyl.ownerPanels = ownerList.filter(s => String(s).trim() !== String(targetNumber).trim())
            if (savePanelConfig()) {
                m.react('✅')
                return m.reply(`✅ Se eliminó correctamente *${targetNumber}* del panel`)
            } else {
                return m.reply(`❌ Error al guardar en config.js`)
            }
        }
    } else {
        if (isAdd) {
            if (db.data.owner.includes(targetNumber)) {
                return m.reply(`❌ \`${targetNumber}\` ya es full owner.`)
            }
            
            let roleChanged = ''
            if (removeFromSellers(targetNumber)) {
                roleChanged = `\n> ⚡ Auto-ascendido desde Seller`
                savePanelConfig()
            }
            if (removeFromOwnerPanels(targetNumber)) {
                roleChanged = `\n> ⚡ Auto-ascendido desde Owner Panel`
                savePanelConfig()
            }
            
            db.data.owner.push(targetNumber)
            db.save()
            
            m.react('👑')
            return m.reply(`✅ Se agregó correctamente *${targetNumber}* como full owner${roleChanged}`)
        } else if (isDel) {
            const index = db.data.owner.indexOf(targetNumber)
            if (index === -1) {
                return m.reply(`❌ \`${targetNumber}\` no es full owner.`)
            }
            
            db.data.owner.splice(index, 1)
            db.save()
            
            m.react('✅')
            return m.reply(`✅ Se eliminó correctamente *${targetNumber}* de full owner`)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    removeFromSellers,
    removeFromOwnerPanels
}
