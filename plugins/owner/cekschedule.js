const { getFullSchedulerStatus, formatTimeRemaining, getMsUntilTime } = require('../../src/lib/ourin-scheduler');
const { initSholatScheduler, stopSholatScheduler } = require('../../src/lib/ourin-sholat-scheduler');
const { getDatabase } = require('../../src/lib/ourin-database');
const { getTodaySchedule, extractPrayerTimes } = require('../../src/lib/ourin-sholat-api');
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'cekschedule',
    alias: ['cekscheduler', 'schedulerstatus', 'schedstatus'],
    category: 'owner',
    description: 'Ver el estado de todos los schedulers del bot',
    usage: '.cekschedule',
    example: '.cekschedule',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const status = getFullSchedulerStatus();
        const db = getDatabase();
        const sholatEnabled = db.setting('autoSholat') || false;

        let text = `📊 *ᴇsᴛᴀᴅᴏ ᴅᴇʟ sᴄʜᴇᴅᴜʟᴇʀ*\n\n`;

        for (const sched of status.schedulers) {
            const statusIcon = sched.running ? '✅' : '❌';
            text += `${statusIcon} *${sched.name}*\n`;
            text += `   └ Clave: \`${sched.key}\`\n`;
            text += `   └ ${sched.description}\n`;

            if (sched.lastRun && sched.lastRun !== '-' && sched.lastRun !== 'Never') {
                text += `   └ Última ejecución: ${sched.lastRun}\n`;
            }

            if (sched.stats) {
                if (sched.stats.totalResets) {
                    text += `   └ Total reinicios: ${sched.stats.totalResets}\n`;
                }
                if (sched.stats.activeMessages !== undefined) {
                    text += `   └ Activos: ${sched.stats.activeMessages} | Enviados: ${sched.stats.totalSent}\n`;
                }
            }
            text += `\n`;
        }

        const sholatIcon = sholatEnabled ? '✅' : '❌';
        text += `${sholatIcon} *Scheduler de Sholat*\n`;
        text += `   └ Clave: \`sholat\`\n`;
        text += `   └ Notificaciones de horarios de oración (tiempo real)\n`;

        if (sholatEnabled) {
            const kotaSetting = db.setting('autoSholatKota') || { id: '1301', nama: 'KOTA JAKARTA' };
            text += `   └ Ubicación: ${kotaSetting.nama}\n`;

            try {
                const { schedule } = await getTodaySchedule(kotaSetting.id);
                const times = extractPrayerTimes(schedule);
                const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
                const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                let nextSholat = null;
                let nextTime = null;

                for (const [name, time] of Object.entries(times)) {
                    if (time > currentTime && time !== '-') {
                        nextSholat = name.charAt(0).toUpperCase() + name.slice(1);
                        nextTime = time;
                        break;
                    }
                }

                if (!nextSholat) {
                    nextSholat = 'Imsak';
                    nextTime = times.imsak;
                }

                text += `   └ Próximo: ${nextSholat} (${nextTime} WIB)\n`;
            } catch {
                text += `   └ _Error al cargar el horario_\n`;
            }
        }

        text += `\n`;
        text += `━━━━━━━━━━━━━━━━━━━\n`;
        text += `✅ Activos: ${status.summary.totalActive + (sholatEnabled ? 1 : 0)}\n`;
        text += `❌ Inactivos: ${status.summary.totalInactive + (!sholatEnabled ? 1 : 0)}\n\n`;

        text += `> Usa \`.stopschedule <clave>\` para detener\n`;
        text += `> Usa \`.startschedule <clave>\` para iniciar`;

        await m.reply(text);
    } catch (error) {
        console.error('[CekSchedule Error]', error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
