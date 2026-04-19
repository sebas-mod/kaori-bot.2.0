const config = require('../../config')
const { getDatabase } = require('../../src/lib/ourin-database')

const pluginConfig = {
    name: 'owner',
    alias: ['creator', 'dev', 'developer'],
    category: 'main',
    description: 'Muestra el contacto del owner del bot',
    usage: '.owner',
    example: '.owner',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const db = getDatabase()
    const ownerType = db.setting('ownerType') || 1
    const ownerNumbers = botConfig.owner?.number || ['6281234567890']
    const ownerName = botConfig.owner?.name || 'Owner'
    const botName = botConfig.bot?.name || 'Ourin-AI'
    
    if (ownerType === 2) {
        const cards = []
        
        for (const number of ownerNumbers) {
            const cleanNumber = number.replace(/[^0-9]/g, '')
            const jid = cleanNumber + '@s.whatsapp.net'
            
            let ppUrl = 'https://cdn.gimita.id/download/pp%20kosong%20wa%20default%20(1)_1769506608569_52b57f5b.jpg'
            try {
                ppUrl = await sock.profilePictureUrl(jid, 'image')
            } catch {}
            
            cards.push({
                image: { url: ppUrl },
                body: `Owner número ${ownerNumbers.indexOf(number) + 1}
                
Reglas:
- No hacer spam
- No hacer videollamadas/llamadas innecesarias
- No usar para bugs/baneos`,
                footer: botName,
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '💬 Chatear con Owner',
                            url: `https://wa.me/${cleanNumber}`
                        })
                    }
                ]
            })
        }
        
        await sock.sendMessage(m.chat, {
            text: `Hola *${m.pushName}*
                
¿Quieres conocer al owner de este bot?

Aquí abajo están los owners de nuestro bot: ${botName}`,
            title: 'Info del Owner',
            footer: botName,
            cards
        }, { quoted: m.raw })
        
    } else if (ownerType === 3) {
        const contacts = []
        
        for (const number of ownerNumbers) {
            const cleanNumber = number.replace(/[^0-9]/g, '')
            
            const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName} (Owner ${botName})
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}
END:VCARD`
            
            contacts.push({ vcard })
        }
        
        await sock.sendMessage(m.chat, {
            contacts: {
                displayName: `${ownerName} - Owners de ${botName}`,
                contacts
            }
        }, { quoted: m.raw })
        
    } else {
        const ownerText = `👑 *INFORMACIÓN DEL OWNER*

╭┈┈⬡「 📋 *DETALLES* 」
┃ ㊗ Nombre: *${ownerName}*
┃ ㊗ Bot: *${botName}*
┃ ㊗ Estado: *🟢 Online*
╰┈┈⬡

> _Si tienes preguntas o problemas,_
> _contacta al owner de arriba!_
> _📞 Tarjeta de contacto abajo._`
        
        await m.reply(ownerText)
        
        for (const number of ownerNumbers) {
            const cleanNumber = number.replace(/[^0-9]/g, '')
            
            const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName} (Owner ${botName})
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}
END:VCARD`
            
            await sock.sendMessage(m.chat, {
                contacts: {
                    displayName: ownerName,
                    contacts: [{ vcard }]
                }
            }, { quoted: m.raw })
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
