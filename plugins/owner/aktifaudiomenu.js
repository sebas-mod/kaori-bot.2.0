const { getDatabase } = require('../../src/lib/ourin-database')

const pluginConfig = {
    name: 'audiomenu',
    alias: ['setaudio', 'toggleaudio', 'menuaudio'],
    category: 'owner',
    description: 'Activar o desactivar audio en el menú',
    usage: '.audiomenu on/off',
    example: '.audiomenu on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { db }) {
    const args = m.args || []
    const option = args[0]?.toLowerCase()

    const current = db.setting('audioMenu') !== false

    if (!option) {
        return m.reply(
            `🔊 *CONFIG AUDIO MENU*\n\n` +
            `Estado: *${current ? '✅ Activado' : '❌ Desactivado'}*\n\n` +
            `Uso:\n` +
            `> \`${m.prefix}audiomenu on\`\n` +
            `> \`${m.prefix}audiomenu off\``
        )
    }

    if (['on', '1', 'activar', 'si', 'sí'].includes(option)) {
        if (current) return m.reply(`⚠️ Ya está activado`)

        db.setting('audioMenu', true)
        await db.save()

        m.react('✅')
        return m.reply(`✅ Audio del menú activado`)
    }

    if (['off', '0', 'desactivar', 'no'].includes(option)) {
        if (!current) return m.reply(`⚠️ Ya está desactivado`)

        db.setting('audioMenu', false)
        await db.save()

        m.react('✅')
        return m.reply(`❌ Audio del menú desactivado`)
    }

    return m.reply(`❌ Opción inválida\nUsa: on / off`)
}

module.exports = {
    config: pluginConfig,
    handler
}
