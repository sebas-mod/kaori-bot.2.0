const { createCanvas } = require('@napi-rs/canvas')
const { performance } = require('perf_hooks')
const os = require('os')
const { execSync } = require('child_process')
const config = require('../../config')
const { getDatabase } = require('../../src/lib/ourin-database')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'ping',
    alias: ['speed', 'p', 'latency', 'sys', 'status'],
    category: 'main',
    description: 'Verifica el rendimiento y estado del sistema del bot en tiempo real',
    usage: '.ping',
    example: '.ping',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const fmtSize = (b) => {
    if (!b || b === 0) return '0 B'
    const u = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(b) / Math.log(1024))
    return (b / Math.pow(1024, i)).toFixed(1) + ' ' + u[i]
}

const fmtUp = (s) => {
    s = Number(s)
    const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sc = Math.floor(s % 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${sc}s`
    return `${m}m ${sc}s`
}

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r) }

async function render(s, pf) {
    const W = 900, H = 540
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#1a1025')
    bg.addColorStop(0.25, '#12101f')
    bg.addColorStop(0.5, '#0d1117')
    bg.addColorStop(0.75, '#0a1628')
    bg.addColorStop(1, '#0f0a1e')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 22px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('⚡ MONITOR DE RENDIMIENTO', 30, 38)
    ctx.fillStyle = '#64748b'
    ctx.font = '10px Arial'
    ctx.fillText(`${config.bot?.name || 'Ourin-AI'} • ${require('moment-timezone')().tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm:ss')} WIB`, 30, 56)
    ctx.restore()

    return canvas.toBuffer('image/png')
}

function getNetwork() {
    try {
        const ifaces = os.networkInterfaces()
        let active = 'N/A'
        for (const [name, addrs] of Object.entries(ifaces)) {
            if (name.toLowerCase().includes('lo')) continue
            for (const a of addrs) { if (a.family === 'IPv4' && !a.internal) { active = name; break } }
        }
        return { rx: 0, tx: 0, iface: active }
    } catch { return { rx: 0, tx: 0, iface: 'N/A' } }
}

async function handler(m, { sock }) {
    const execStart = performance.now()
    await m.react('🕕')

    try {
        sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
        const t0 = m.messageTimestamp ? (m.messageTimestamp * 1000) : Date.now()
        const waRoundtrip = Math.max(1, Date.now() - t0)

        const cpus = os.cpus()
        const totalMem = os.totalmem(), freeMem = os.freemem()

        const cpuPct = Math.max(1, Math.min(100, os.loadavg()[0] / cpus.length * 100)).toFixed(1)

        const net = getNetwork()
        const heap = process.memoryUsage()

        let dbUsers = 0, dbGroups = 0, dbPremium = 0
        try { const db = getDatabase(); if (db?.data) { dbUsers = Object.keys(db.data.users || {}).length; dbGroups = Object.keys(db.data.groups || {}).length; dbPremium = Object.values(db.data.users || {}).filter(u => u.isPremium).length } } catch {}

        const s = {
            ping: waRoundtrip,
            hostname: os.hostname(), platform: os.platform(), arch: os.arch(),
            nodeVersion: process.version, v8Version: process.versions.v8,
            uptimeBot: fmtUp(process.uptime()), uptimeServer: fmtUp(os.uptime()),
            cpuModel: cpus[0]?.model?.trim() || 'Unknown', cpuSpeed: cpus[0]?.speed || 0,
            cpuCores: cpus.length, cpuLoad: cpuPct,
            loadAvg: os.loadavg().map(l => l.toFixed(2)).join(', '),
            ramTotal: totalMem, ramUsed: totalMem - freeMem,
            diskTotal: 0, diskUsed: 0,
            networkRx: net.rx, networkTx: net.tx, networkInterface: net.iface,
            heapUsed: fmtSize(heap.heapUsed), heapTotal: fmtSize(heap.heapTotal),
            rss: fmtSize(heap.rss), external: fmtSize(heap.external),
            arrayBuffers: fmtSize(heap.arrayBuffers || 0),
            pid: process.pid,
            activeHandles: process._getActiveHandles?.()?.length ?? 'N/A',
            activeRequests: process._getActiveRequests?.()?.length ?? 'N/A',
            dbUsers, dbGroups, dbPremium,
        }

        const img = await render(s, {})
        const ramPct = ((s.ramUsed / s.ramTotal) * 100).toFixed(1)

        const caption =
            `╭─〔 🏓 *respuesta* 〕───⬣\n` +
            `│  ◦ WA Roundtrip: *${waRoundtrip}ms*\n` +
            `│  ◦ Estado: *Online*\n` +
            `╰───────⬣\n\n` +
            `╭─〔 🖥 *servidor* 〕───⬣\n` +
            `│  ◦ Host: *${s.hostname}*\n` +
            `│  ◦ SO: *${s.platform}* (${s.arch})\n` +
            `│  ◦ Node: *${s.nodeVersion}*\n` +
            `╰───────⬣\n\n` +
            `╭─〔 🧠 *memoria* 〕───⬣\n` +
            `│  ◦ *${fmtSize(s.ramUsed)}* / *${fmtSize(s.ramTotal)}* (${ramPct}%)\n` +
            `│  ◦ Heap: *${s.heapUsed}* / *${s.heapTotal}*\n` +
            `╰───────⬣\n\n` +
            `╭─〔 🗄 *base de datos* 〕───⬣\n` +
            `│  ◦ Usuarios: *${dbUsers}* │ Premium: *${dbPremium}*\n` +
            `│  ◦ Grupos: *${dbGroups}*\n` +
            `╰───────⬣`

        await sock.sendMessage(m.chat, {
            image: img, caption
        }, { quoted: m })

        await m.react('✅')
    } catch (error) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = { config: pluginConfig, handler }
