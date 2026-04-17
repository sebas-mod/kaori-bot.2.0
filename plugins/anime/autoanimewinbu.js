const {
    loadSent, saveSent, loadState, saveState,
    getOngoingAnimeList, startAutoCheck, stopAutoCheck,
    runCheck, isRunning
} = require('../../src/lib/ourin-auto-anime')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'autoanimewinbu',
    alias: ['aaw', 'autoanime'],
    category: 'anime',
    description: 'Auto subida de anime y donghua en emisión desde winbu.net (720p Pixeldrain)',
    usage: '.autoanimewinbu <start|stop|status|check|list|reset|addgroup|delgroup>',
    example: '.autoanimewinbu start',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, args }) {
    const sub = m.text
    const state = loadState()

    switch (sub) {
        case 'start': {
            if (isRunning()) {
                return m.reply(`⚠️ ¡AutoAnime ya está en ejecución!`)
            }

            const groups = state.groups || []
            if (groups.length === 0) {
                return m.reply(
                    `❌ ¡Aún no hay grupos objetivo!\n\n` +
                    `> Agrega primero un grupo:\n` +
                    `> \`${m.prefix}autoanimewinbu addgroup\` (en el grupo objetivo)\n` +
                    `> \`${m.prefix}autoanimewinbu addgroup 120363xxx@g.us\``
                )
            }

            const interval = state.interval || 5
            startAutoCheck(sock, interval)
            saveState({ ...state, enabled: true })

            return sock.sendMessage(m.chat, {
                text: `✅ *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ ɪɴɪᴄɪᴀᴅᴏ*\n\n` +
                    `> 📲 Grupos objetivo: *${groups.length}*\n` +
                    `> ⏱️ Intervalo: *${interval} minutos*\n` +
                    `> 🎞️ Filtro: *Pixeldrain 720p+*\n` +
                    `> ⏰ Edad máxima: *24 horas*\n\n` +
                    `Iniciando la primera verificación...`,
                interactiveButtons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📊 Estado',
                            id: `${m.prefix}autoanimewinbu status`
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🛑 Detener',
                            id: `${m.prefix}autoanimewinbu stop`
                        })
                    }
                ]
            }, { quoted: m })
        }

        case 'stop': {
            stopAutoCheck()
            saveState({ ...state, enabled: false })
            return m.reply(`🛑 *AutoAnime detenido*`)
        }

        case 'status': {
            const sent = loadSent()
            const running = isRunning()
            const groups = state.groups || []

            let txt = `📊 *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ ᴇsᴛᴀᴅᴏ*\n\n`
            txt += `> 🔄 Estado: *${running ? '🟢 ON' : '🔴 OFF'}*\n`
            txt += `> 💾 Auto-inicio: *${state.enabled ? 'Sí' : 'No'}*\n`
            txt += `> 📋 Enviados: *${sent.size}* episodios\n`
            txt += `> ⏱️ Intervalo: *${state.interval || 5} minutos*\n`
            txt += `> 📲 Grupos objetivo: *${groups.length}*\n`

            if (groups.length > 0) {
                txt += `\n*Grupos:*\n`
                groups.forEach((g, i) => {
                    txt += `> ${i + 1}. \`${g}\`\n`
                })
            }

            return sock.sendMessage(m.chat, { text: txt }, { quoted: m })
        }

        case 'cek':
        case 'check': {
            if (!isRunning()) {
                startAutoCheck(sock, state.interval || 5)
            }
            await m.reply('🔍 Verificando anime más reciente...')
            try {
                await runCheck()
                return m.reply('✅ Verificación completada')
            } catch (e) {
                m.reply(te(m.prefix, m.command, m.pushName))
            }
        }

        case 'list': {
            await m.reply('📺 Obteniendo lista de anime...')
            try {
                const list = await getOngoingAnimeList()
                if (list.length === 0) return m.reply('❌ No se encontraron animes')

                let txt = `📺 *ʟɪsᴛᴀ ᴅᴇ ᴀɴɪᴍᴇ ʀᴇᴄɪᴇɴᴛᴇ*\n\n`
                txt += `> Total: *${list.length}* animes\n\n`
                list.slice(0, 15).forEach((a, i) => {
                    txt += `*${i + 1}.* ${a.title}\n`
                })
                if (list.length > 15) txt += `\n> ...y ${list.length - 15} más`

                return sock.sendMessage(m.chat, { text: txt }, { quoted: m })
            } catch (e) {
                m.reply(te(m.prefix, m.command, m.pushName))
            }
        }

        case 'reset': {
            const sent = loadSent()
            const count = sent.size
            saveSent(new Set())
            return m.reply(`✅ ¡Reiniciado! *${count}* episodios eliminados del historial.\n> Todos pueden enviarse nuevamente.`)
        }

        case 'addgrup':
        case 'addgroup': {
            const rest = (typeof args === 'string' ? args : '').replace(/^(addgrup|addgroup)\s*/i, '').trim()
            let grupId = rest

            if (!grupId && m.isGroup) {
                grupId = m.chat
            }

            if (!grupId || !grupId.includes('@g.us')) {
                return m.reply(
                    `❌ ID de grupo inválido\n\n` +
                    `> Úsalo dentro del grupo, o:\n` +
                    `> \`${m.prefix}autoanimewinbu addgroup 120363xxx@g.us\``
                )
            }

            const groups = state.groups || []
            if (groups.includes(grupId)) {
                return m.reply(`⚠️ El grupo ya está en la lista`)
            }

            groups.push(grupId)
            saveState({ ...state, groups })
            return m.reply(`✅ Grupo \`${grupId}\` agregado\n> Total: *${groups.length}* grupos`)
        }

        case 'delgrup':
        case 'delgroup': {
            const rest = (typeof args === 'string' ? args : '').replace(/^(delgrup|delgroup)\s*/i, '').trim()
            let grupId = rest

            if (!grupId && m.isGroup) {
                grupId = m.chat
            }

            const groups = state.groups || []
            const idx = groups.indexOf(grupId)
            if (idx === -1) {
                return m.reply(`❌ Grupo no encontrado`)
            }

            groups.splice(idx, 1)
            saveState({ ...state, groups })
            return m.reply(`✅ Grupo \`${grupId}\` eliminado\n> Restantes: *${groups.length}* grupos`)
        }

        case 'interval': {
            const rest = (typeof args === 'string' ? args : '').replace(/^interval\s*/i, '').trim()
            const mins = parseInt(rest)
            if (!mins || mins < 1 || mins > 60) {
                return m.reply(`❌ El intervalo debe ser entre 1 y 60 minutos\n\n> Ejemplo: \`${m.prefix}autoanimewinbu interval 10\``)
            }

            saveState({ ...state, interval: mins })

            if (isRunning()) {
                stopAutoCheck()
                startAutoCheck(sock, mins)
            }

            return m.reply(`✅ Intervalo cambiado a *${mins} minutos*`)
        }

        default: {
            const running = isRunning()
            return sock.sendMessage(m.chat, {
                text: `🎬 *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ ᴡɪɴʙᴜ*\n\n` +
                    `> Estado: *${running ? '🟢 ON' : '🔴 OFF'}*\n\n` +
                    `*ᴄᴏᴍᴀɴᴅᴏs:*\n` +
                    `> \`${m.prefix}aaw start\` — Iniciar auto-check\n` +
                    `> \`${m.prefix}aaw stop\` — Detener\n` +
                    `> \`${m.prefix}aaw status\` — Ver estado\n` +
                    `> \`${m.prefix}aaw check\` — Verificar ahora\n` +
                    `> \`${m.prefix}aaw list\` — Lista de anime\n` +
                    `> \`${m.prefix}aaw addgroup\` — Agregar grupo\n` +
                    `> \`${m.prefix}aaw delgroup\` — Eliminar grupo\n` +
                    `> \`${m.prefix}aaw interval 10\` — Cambiar intervalo\n` +
                    `> \`${m.prefix}aaw reset\` — Reiniciar historial`,
                interactiveButtons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: running ? '🛑 Detener' : '▶️ Iniciar',
                            id: `${m.prefix}autoanimewinbu ${running ? 'stop' : 'start'}`
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📊 Estado',
                            id: `${m.prefix}autoanimewinbu status`
                        })
                    }
                ]
            }, { quoted: m })
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
