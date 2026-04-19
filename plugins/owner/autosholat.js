const { getDatabase } = require('../../src/lib/ourin-database');
const config = require('../../config');
const { getTodaySchedule, extractPrayerTimes, searchKota } = require('../../src/lib/ourin-sholat-api');
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'autosholat',
    alias: ['sholat', 'autoadzan'],
    category: 'owner',
    description: 'Activar/desactivar recordatorios automáticos de oración con audio de adzan y cierre del grupo',
    usage: '.autosholat on/off/status/kota <nombre>',
    example: '.autosholat on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

const AUDIO_ADZAN = 'https://media.vocaroo.com/mp3/1ofLT2YUJAjQ';

async function handler(m, { sock, db }) {
    const args = m.args[0]?.toLowerCase();
    const database = getDatabase();

    if (!args || args === 'status') {
        const status = database.setting('autoSholat') ? '✅ Activo' : '❌ Inactivo';
        const closeGroup = database.setting('autoSholatCloseGroup') ? '✅ Sí' : '❌ No';
        const duration = database.setting('autoSholatDuration') || 5;
        const kotaSetting = database.setting('autoSholatKota') || { id: '1301', nama: 'CIUDAD JAKARTA' };

        let jadwalText = '';
        try {
            const jadwalData = await getTodaySchedule(kotaSetting.id);
            const times = extractPrayerTimes(jadwalData);
            for (const [nama, waktu] of Object.entries(times)) {
                jadwalText += `┃ ${nama.charAt(0).toUpperCase() + nama.slice(1)}: \`${waktu}\`\n`;
            }
        } catch {
            jadwalText = '┃ _Error al cargar el horario_\n';
        }

        return m.reply(
            `🕌 *AUTO ORACIÓN*\n\n` +
            `╭┈┈⬡「 📋 *ESTADO* 」\n` +
            `┃ 🔔 Auto oración: ${status}\n` +
            `┃ 🔒 Cerrar grupo: ${closeGroup}\n` +
            `┃ ⏱️ Duración: \`${duration}\` minutos\n` +
            `┃ 📍 Ciudad: \`${kotaSetting.nama}\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🕐 *HORARIO DE HOY* 」\n` +
            jadwalText +
            `╰┈┈⬡\n\n` +
            `> *Uso:*\n` +
            `> \`${m.prefix}autosholat on\` - Activar\n` +
            `> \`${m.prefix}autosholat off\` - Desactivar\n` +
            `> \`${m.prefix}autosholat close on/off\` - Activar cierre del grupo\n` +
            `> \`${m.prefix}autosholat duration <minutos>\` - Ajustar duración\n` +
            `> \`${m.prefix}autosholat kota <nombre>\` - Establecer ubicación\n\n` +
            `> _Fuente: myquran.com (tiempo real)_`
        );
    }

    if (args === 'on') {
        database.setting('autoSholat', true);
        m.react('✅');
        const kota = database.setting('autoSholatKota') || { nama: 'CIUDAD JAKARTA' };
        return m.reply(
            `✅ *AUTO ORACIÓN ACTIVADA*\n\n` +
            `> Los recordatorios están activos\n` +
            `> El audio del adzan será enviado a todos los grupos\n` +
            `> Ubicación: ${kota.nama} (tiempo real)`
        );
    }

    if (args === 'off') {
        database.setting('autoSholat', false);
        m.react('❌');
        return m.reply(`❌ *AUTO ORACIÓN DESACTIVADA*`);
    }

    if (args === 'close') {
        const subArg = m.args[1]?.toLowerCase();
        if (subArg === 'on') {
            database.setting('autoSholatCloseGroup', true);
            m.react('🔒');
            return m.reply(`🔒 *CIERRE DE GRUPO ACTIVADO*\n\n> El grupo se cerrará durante la oración`);
        }
        if (subArg === 'off') {
            database.setting('autoSholatCloseGroup', false);
            m.react('🔓');
            return m.reply(`🔓 *CIERRE DE GRUPO DESACTIVADO*\n\n> El grupo no se cerrará`);
        }
        return m.reply(`❌ *ERROR*\n\n> Usa: \`${m.prefix}autosholat close on/off\``);
    }

    if (args === 'duration') {
        const duration = parseInt(m.args[1]);
        if (isNaN(duration) || duration < 1 || duration > 60) {
            return m.reply(`❌ *ERROR*\n\n> La duración debe ser entre 1 y 60 minutos`);
        }
        database.setting('autoSholatDuration', duration);
        m.react('⏱️');
        return m.reply(`⏱️ *DURACIÓN ESTABLECIDA*\n\n> El grupo se cerrará por \`${duration}\` minutos`);
    }

    if (args === 'kota') {
        const kotaName = m.args.slice(1).join(' ').trim();
        if (!kotaName) {
            return m.reply(`❌ *ERROR*\n\n> Usa: \`${m.prefix}autosholat kota Jakarta\``);
        }

        m.react('🔍');
        try {
            const result = await searchKota(kotaName);
            if (!result) {
                return m.reply(`❌ Ciudad "${kotaName}" no encontrada`);
            }

            database.setting('autoSholatKota', {
                id: result.id,
                nama: result.lokasi
            });

            m.react('📍');
            return m.reply(
                `📍 *UBICACIÓN ESTABLECIDA*\n\n` +
                `> Ciudad: *${result.lokasi}*\n\n` +
                `> El horario de oración seguirá esta ubicación`
            );
        } catch (e) {
            m.reply(te(m.prefix, m.command, m.pushName));
        }
    }

    return m.reply(`❌ *ACCIÓN INVÁLIDA*\n\n> Usa: \`on\`, \`off\`, \`close on/off\`, \`duration <minutos>\`, \`kota <nombre>\``);
}

async function runAutoSholat(sock) {
    const db = getDatabase();

    if (!db.setting('autoSholat')) return;

    const kotaSetting = db.setting('autoSholatKota') || { id: '1301', nama: 'CIUDAD JAKARTA' };

    let times;
    try {
        const jadwalData = await getTodaySchedule(kotaSetting.id);
        times = extractPrayerTimes(jadwalData);
    } catch {
        return;
    }

    const JADWAL = {
        subuh: times.subuh,
        dzuhur: times.dzuhur,
        ashar: times.ashar,
        maghrib: times.maghrib,
        isya: times.isya
    };

    const timeHelper = require('../../src/lib/ourin-time');
    const timeNow = timeHelper.getCurrentTimeString();

    if (!global.autoSholatLock) global.autoSholatLock = {};

    for (const [sholat, waktu] of Object.entries(JADWAL)) {
        if (waktu === '-') continue;
        if (timeNow === waktu && !global.autoSholatLock[sholat]) {
            global.autoSholatLock[sholat] = true;
            try {
                global.isFetchingGroups = true;
                const groupsObj = await sock.groupFetchAllParticipating();
                global.isFetchingGroups = false;
                const groupList = Object.keys(groupsObj);

                const closeGroup = db.setting('autoSholatCloseGroup') || false;
                const duration = db.setting('autoSholatDuration') || 5;

                for (const jid of groupList) {
                    try {
                        const caption = `🕌 *HORA DE ORACIÓN ${sholat.toUpperCase()}*\n\n` +
                            `> Hora: \`${waktu}\`\n` +
                            `> Ubicación: \`${kotaSetting.nama}\`\n` +
                            `> ¡Es momento de rezar! 🤲\n\n` +
                            (closeGroup ? `> _Grupo cerrado por ${duration} minutos_` : '');

                        await sock.sendMessage(jid, {
                            audio: { url: AUDIO_ADZAN },
                            mimetype: 'audio/mpeg',
                            ptt: false
                        });

                        if (closeGroup) {
                            await sock.groupSettingUpdate(jid, 'announcement');
                        }

                    } catch (e) {
                        console.log(`[AutoSholat] Error en ${jid}:`, e.message);
                    }
                }

                if (closeGroup) {
                    setTimeout(async () => {
                        for (const jid of groupList) {
                            try {
                                await sock.groupSettingUpdate(jid, 'not_announcement');
                            } catch (e) {}
                        }
                    }, duration * 60 * 1000);
                }

            } catch (error) {
                global.isFetchingGroups = false;
                console.error('[AutoSholat] Error:', error.message);
            }

            setTimeout(() => {
                delete global.autoSholatLock[sholat];
            }, 2 * 60 * 1000);
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    runAutoSholat,
    AUDIO_ADZAN
};
