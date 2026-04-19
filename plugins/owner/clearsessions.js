const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'clearsessions',
    alias: ['clearsession', 'delsession', 'delsessions'],
    category: 'owner',
    description: 'Eliminar todas las sesiones en storage/sessions/',
    usage: '.clearsessions',
    example: '.clearsessions',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function handler(m)  {
    const sessionsPath = path.join(process.cwd(), 'storage', 'sessions')
    
    if (!fs.existsSync(sessionsPath)) {
        return m.reply(`❌ ¡Carpeta sessions no encontrada!`)
    }
    
    m.react('🗑️')
    
    try {
        const files = fs.readdirSync(sessionsPath)
        
        if (files.length === 0) {
            return m.reply(`📁 ¡La carpeta sessions ya está vacía!`)
        }
        
        let deleted = 0
        let skipped = 0
        
        for (const file of files) {
            if (file === 'creds.json') {
                skipped++
                continue
            }
            
            const filePath = path.join(sessionsPath, file)
            try {
                const stat = fs.statSync(filePath)
                if (stat.isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true })
                } else {
                    fs.unlinkSync(filePath)
                }
                deleted++
            } catch {}
        }
        
        m.react('✅')
        await m.reply(
            `╭┈┈⬡「 🗑️ *ʟɪᴍᴘɪᴀʀ sᴇssɪᴏɴᴇs* 」
┃
┃ ㊗ ᴇʟɪᴍɪɴᴀᴅᴏs: *${deleted}* archivos
┃ ㊗ ᴏᴍɪᴛɪᴅᴏs: *${skipped}* archivos
┃ ㊗ ɴᴏᴛᴀ: creds.json no se elimina
┃
╰┈┈⬡

> _¡Archivos de sesión limpiados con éxito!_
> _Reinicia el bot si es necesario._`
        )
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
