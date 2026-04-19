const { sendStoreBackup, SCHEMA_VERSION } = require('../../src/lib/ourin-store-backup')

const pluginConfig = {
    name: 'backupdb',
    alias: ['dbbackup', 'backupstore', 'storebackup'],
    category: 'owner',
    description: 'Respaldar base de datos/store y enviarlo al owner',
    usage: '.backupdb',
    isOwner: true,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    const backupContents = [
        '📁 database/*.json (todos los archivos JSON)',
        '📁 database/cpanel/* (datos de cPanel)',
        '📄 storage/database.json (base de datos principal)',
        '📄 db.json (base de datos raíz)',
        '📄 database/main/*.json (base de datos principal)',
        '📋 backup_metadata.json (info del esquema)'
    ]
    
    await m.reply(
        `🕕 *Creando backup de la base de datos...*\n\n` +
        `╭┈┈⬡「 📦 *QUÉ SE RESPALDA* 」\n` +
        backupContents.map(c => `┃ ${c}`).join('\n') +
        `\n╰┈┈┈┈┈┈┈┈⬡`
    )
    
    const result = await sendStoreBackup(sock)
    
    if (result.success) {
        await m.reply(
            `✅ *¡Backup exitoso!*\n\n` +
            `📦 Tamaño: ${result.size}\n` +
            `📁 Archivos: ${result.files}\n` +
            `🔖 Esquema: v${SCHEMA_VERSION}\n\n` +
            `> Backup seguro por tipos, compatible con futuras actualizaciones.\n` +
            `> El backup ha sido enviado al owner principal.`
        )
    } else {
        await m.reply(`❌ Error en el backup: ${result.error}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
