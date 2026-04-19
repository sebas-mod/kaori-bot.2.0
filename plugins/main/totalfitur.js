const { getAllPlugins } = require('../../src/lib/ourin-plugins')
const { createCanvas } = require('@napi-rs/canvas')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'totalfitur',
    alias: ['totalfeature', 'totalcmd', 'countplugin', 'distribusi'],
    category: 'main',
    description: 'Ver el total de funciones/comandos del bot',
    usage: '.totalfitur',
    example: '.totalfitur',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const ICONS = {
    main: '🏠', tools: '🔧', downloader: '📥', download: '📥', sticker: '🎨',
    ai: '🤖', media: '📷', game: '🎮', rpg: '⚔️', maker: '🖼️', fun: '🎭',
    group: '👥', owner: '👑', premium: '💎', info: '📊', search: '🔍',
    canvas: '🎨', anime: '🌸', nsfw: '🔞', utility: '🛠️', economy: '💰',
    stalker: '🔎', random: '🎲', religi: '🕌', islamic: '☪️', cek: '✅',
    store: '🛒', panel: '🖥️', convert: '🔄', primbon: '🔮', tts: '🗣️',
    otp: '🔑', vps: '☁️', pushkontak: '📱', jpm: '🎰', ephoto: '📸',
    other: '📦'
}

const PALETTE = [
    '#a78bfa', '#22d3ee', '#f472b6', '#4ade80', '#fbbf24',
    '#fb923c', '#f87171', '#38bdf8', '#c084fc', '#34d399',
    '#e879f9', '#2dd4bf', '#facc15', '#818cf8', '#fb7185',
]

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r) }

async function renderChart(cats, total, enabled) {
    const sorted = Object.entries(cats).sort((a, b) => b[1].total - a[1].total)
    const top10 = sorted.slice(0, 10)
    const maxVal = Math.max(...top10.map(([, d]) => d.total))

    const W = 920, H = 620
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#0f0a1e')
    bg.addColorStop(0.3, '#0d1117')
    bg.addColorStop(0.7, '#0a1628')
    bg.addColorStop(1, '#12101f')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    const g1 = ctx.createRadialGradient(150, 300, 0, 150, 300, 350)
    g1.addColorStop(0, '#7c3aed10'); g1.addColorStop(1, 'transparent')
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)
    const g2 = ctx.createRadialGradient(W - 150, 200, 0, W - 150, 200, 300)
    g2.addColorStop(0, '#06b6d40c'); g2.addColorStop(1, 'transparent')
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)
    const g3 = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 400)
    g3.addColorStop(0, '#ec489908'); g3.addColorStop(1, 'transparent')
    ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H)

    ctx.save(); ctx.globalAlpha = 0.015
    for (let i = 0; i < W; i += 35) { ctx.strokeStyle = '#a78bfa'; ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke() }
    for (let i = 0; i < H; i += 35) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke() }
    ctx.globalAlpha = 1; ctx.restore()

    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'left'
    ctx.fillText('📊 DISTRIBUCIÓN DE FUNCIONES', 30, 40)
    ctx.fillStyle = '#64748b'; ctx.font = '10px Arial'
    ctx.fillText(`${config.bot?.name || 'Ourin-AI'} • Estadísticas de comandos`, 30, 60)

    const badges = [
        { label: 'TOTAL', val: total, c: '#a78bfa' },
        { label: 'ACTIVO', val: enabled, c: '#4ade80' },
        { label: 'CATEGORÍAS', val: sorted.length, c: '#22d3ee' },
    ]

    const sep = ctx.createLinearGradient(30, 76, W - 30, 76)
    sep.addColorStop(0, '#7c3aed50'); sep.addColorStop(0.5, '#22d3ee30'); sep.addColorStop(1, '#f472b650')
    ctx.strokeStyle = sep; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(30, 76); ctx.lineTo(W - 30, 76); ctx.stroke()

    ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 26px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(total.toString(), 155, 265 - 4)
    ctx.fillStyle = '#94a3b8'; ctx.font = '8px Arial'; ctx.fillText('COMANDOS', 155, 265 + 14)

    ctx.fillStyle = '#a78bfa'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'left'
    ctx.fillText('TODAS LAS CATEGORÍAS', 660 + 14, 90 + 18)

    ctx.fillStyle = '#a78bfa'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'
    ctx.fillText(`⚡ ${total} FUNCIONES DISPONIBLES`, 920 / 2, 620 - 24)
    ctx.fillStyle = '#64748b'; ctx.font = '8px Arial'
    ctx.fillText(`${config.bot?.name || 'Ourin'} • ${require('moment-timezone')().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm')} WIB`, 920 / 2, 620 - 8)

    return canvas.toBuffer('image/png')
}

async function handler(m, { sock }) {
    try {
        const allPlugins = getAllPlugins()
        const cats = {}
        let total = 0, enabled = 0

        for (const p of allPlugins) {
            if (!p.config) continue
            const cat = p.config.category || 'other'
            if (!cats[cat]) cats[cat] = { total: 0, enabled: 0 }
            cats[cat].total++
            total++
            if (p.config.isEnabled !== false) { cats[cat].enabled++; enabled++ }
        }

        await m.react('📊')
        const img = await renderChart(cats, total, enabled)

        let dbUsers = 0, dbGroups = 0
        try {
            const db = require('../../src/lib/ourin-database').getDatabase()
            if (db?.data) {
                dbUsers = Object.keys(db.data.users || {}).length
                dbGroups = Object.keys(db.data.groups || {}).length
            }
        } catch {}

        const sorted = Object.entries(cats).sort((a, b) => b[1].total - a[1].total)

        let caption =
            `╭─〔 📈 *ESTADÍSTICAS* 〕───⬣\n` +
            `│  ◦ Total: *${total}*\n` +
            `│  ◦ Activo: *${enabled}*\n` +
            `│  ◦ Inactivo: *${total - enabled}*\n` +
            `│  ◦ Categorías: *${sorted.length}*\n` +
            `╰───────⬣\n\n` +
            `╭─〔 🗄 *BASE DE DATOS* 〕───⬣\n` +
            `│  ◦ Usuarios: *${dbUsers}*\n` +
            `│  ◦ Grupos: *${dbGroups}*\n` +
            `╰───────⬣\n\n` +
            `╭─〔 📋 *CATEGORÍAS* 〕───⬣\n`

        sorted.forEach(([cat, data]) => {
            const pct = ((data.total / total) * 100).toFixed(1)
            const icon = ICONS[cat] || '📦'
            caption += `│  ${icon} \`${cat.toUpperCase()}\`: *${data.total}* _(${pct}%)_\n`
        })

        caption += `╰───────⬣\n\n> ⚡ *${total}* funciones disponibles`

        await sock.sendMessage(m.chat, {
            image: img, caption,
            contextInfo: { forwardingScore: 99, isForwarded: true }
        }, { quoted: m })

    } catch (error) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = { config: pluginConfig, handler }
