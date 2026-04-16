const config = require('../../config');
const { formatUptime, getTimeGreeting } = require('../../src/lib/ourin-formatter');
const { getCommandsByCategory, getCategories } = require('../../src/lib/ourin-plugins');
const { getDatabase } = require('../../src/lib/ourin-database');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { generateWAMessageFromContent, proto } = require('ourin');
const { default: axios } = require('axios');

const pluginConfig = {
    name: 'menu',
    alias: ['help', 'bantuan', 'commands', 'm'],
    category: 'main',
    description: 'Mostrar el menú principal del bot',
    usage: '.menu',
    example: '.menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

const CATEGORY_EMOJIS = {
    owner: '👑', main: '🏠', utility: '🔧', fun: '🎮', group: '👥',
    download: '📥', search: '🔍', tools: '🛠️', sticker: '🖼️',
    ai: '🤖', game: '🎯', media: '🎬', info: 'ℹ️', religi: '☪️',
    panel: '🖥️', user: '📊', linode: '☁️', random: '🎲', canvas: '🎨', vps: '🌊'
};

function toSmallCaps(text) {
    const smallCaps = {
        'a': 'ᴀ','b': 'ʙ','c': 'ᴄ','d': 'ᴅ','e': 'ᴇ','f': 'ꜰ','g': 'ɢ',
        'h': 'ʜ','i': 'ɪ','j': 'ᴊ','k': 'ᴋ','l': 'ʟ','m': 'ᴍ','n': 'ɴ',
        'o': 'ᴏ','p': 'ᴘ','q': 'ǫ','r': 'ʀ','s': 's','t': 'ᴛ','u': 'ᴜ',
        'v': 'ᴠ','w': 'ᴡ','x': 'x','y': 'ʏ','z': 'ᴢ'
    };
    return text.toLowerCase().split('').map(c => smallCaps[c] || c).join('');
}

function buildMenuText(m, botConfig, db, uptime, botMode = 'md') {
    const prefix = botConfig.command?.prefix || '.';
    const user = db.getUser(m.sender);

    const timeHelper = require('../../src/lib/ourin-time');
    const timeStr = timeHelper.formatTime('HH:mm');
    const dateStr = timeHelper.formatFull('dddd, DD MMMM YYYY');

    const categories = getCategories();
    const commandsByCategory = getCommandsByCategory();

    let totalCommands = 0;
    for (const category of categories) {
        totalCommands += (commandsByCategory[category] || []).length;
    }

    let userRole = 'Usuario', roleEmoji = '👤';
    if (m.isOwner) { userRole = 'Dueño'; roleEmoji = '👑'; }
    else if (m.isPremium) { userRole = 'Premium'; roleEmoji = '💎'; }

    const uptimeFormatted = formatUptime(uptime);
    const totalUsers = db.getUserCount();

    let txt = `Hola *@${m.pushName || "Usuario"}* 🪸

Soy ${botConfig.bot?.name || 'Ourin-AI'}, un bot de WhatsApp listo para ayudarte.  

Puedes usarme para buscar información, obtener datos o ayudarte con tareas simples directamente desde WhatsApp — práctico y sin complicaciones.`;

    txt += `\n\n╭─〔 🤖 *INFORMACIÓN DEL BOT* 〕\n`;
    txt += `*│* 🖐 Nombre     : *${botConfig.bot?.name || 'Ourin-AI'}*\n`;
    txt += `*│* 🔑 Versión   : *v${botConfig.bot?.version || '1.2.0'}*\n`;
    txt += `*│* ⚙️ Modo      : *${(botConfig.mode || 'public').toUpperCase()}*\n`;
    txt += `*│* 🧶 Prefijo   : *[ ${prefix} ]*\n`;
    txt += `*│* ⏱ Tiempo activo : *${uptimeFormatted}*\n`;
    txt += `*│* 👥 Total     : *${totalUsers} Usuarios*\n`;
    txt += `*│* 🏷 Grupo     : *${botMode.toUpperCase()}*\n`;
    txt += `*│* 👑 Dueño     : *${botConfig.owner?.name || 'Ourin-AI'}*\n`;
    txt += `╰────────────────⬣\n\n`;

    txt += `╭─〔 👤 *INFORMACIÓN DEL USUARIO* 〕\n`;
    txt += `*│* 🙋 Nombre     : *${m.pushName}*\n`;
    txt += `*│* 🎭 Rol        : *${roleEmoji} ${userRole}*\n`;
    txt += `*│* 🎟 Límite     : *${m.isOwner || m.isPremium ? '∞ Ilimitado' : (user?.limit ?? 25)}*\n`;
    txt += `*│* 🕒 Hora       : *${timeStr} WIB*\n`;
    txt += `*│* 📅 Fecha      : *${dateStr}*\n`;
    txt += `╰────────────────⬣\n\n`;

    txt += `📂 *LISTA DE MENÚ*\n`;

    return txt;
}
async function handler(m, { sock, config: botConfig, db, uptime }) {
    const savedVariant = db.setting('menuVariant');
    const menuVariant = savedVariant || botConfig.ui?.menuVariant || 2;
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {};
    const botMode = groupData.botMode || 'md';
    const text = buildMenuText(m, botConfig, db, uptime, botMode);

    const imagePath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg');
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin2.jpg');
    const videoPath = path.join(process.cwd(), 'assets', 'video', 'ourin.mp4');

    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;
    let thumbBuffer = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null;
    let videoBuffer = fs.existsSync(videoPath) ? fs.readFileSync(videoPath) : null;

    try {
        switch (menuVariant) {

            // ===== CASE 1 =====
            case 1:
                if (imageBuffer) {
                    await sock.sendMessage(m.chat, { 
                        image: imageBuffer, 
                        caption: text 
                    });
                } else {
                    await m.reply(text);
                }
                break;

            // ===== CASE 2 =====
            case 2:
                const msgV2 = { 
                    contextInfo: getContextInfo(botConfig, m, thumbBuffer) 
                };

                if (imageBuffer) {
                    msgV2.image = imageBuffer;
                    msgV2.caption = text;
                } else {
                    msgV2.text = text;
                }

                await sock.sendMessage(
                    m.chat, 
                    msgV2, 
                    { quoted: getVerifiedQuoted(botConfig) }
                );
                break;

            // ===== CASE 3 =====
            case 3:
                let resizedThumb = thumbBuffer;

                if (thumbBuffer) {
                    try {
                        resizedThumb = await sharp(thumbBuffer)
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toBuffer();
                    } catch (e) {
                        resizedThumb = thumbBuffer;
                    }
                }

                let contextThumb = thumbBuffer;

                try {
                    const ourinPath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg');
                    if (fs.existsSync(ourinPath)) {
                        contextThumb = fs.readFileSync(ourinPath);
                    }
                } catch (e) {}

                await sock.sendMessage(m.chat, {
                    document: imageBuffer || Buffer.from(''),
                    mimetype: 'image/png',
                    fileLength: 999999999999,
                    fileSize: 999999999999,
                    fileName: `sin dolor no hay ganancia`,
                    caption: text,
                    jpegThumbnail: resizedThumb,
                    contextInfo: getContextInfo(botConfig, m, contextThumb, true)
                }, { quoted: getVerifiedQuoted(botConfig) });

                break;

            // ===== CASE 4 =====
            case 4:
                if (videoBuffer) {
                    await sock.sendMessage(m.chat, {
                        video: videoBuffer,
                        caption: text,
                        gifPlayback: true,
                        contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                    }, { quoted: getVerifiedQuoted(botConfig) });

                } else {
                    const fallback = { 
                        contextInfo: getContextInfo(botConfig, m, thumbBuffer) 
                    };

                    if (imageBuffer) {
                        fallback.image = imageBuffer;
                        fallback.caption = text;
                    } else {
                        fallback.text = text;
                    }

                    await sock.sendMessage(
                        m.chat, 
                        fallback, 
                        { quoted: getVerifiedQuoted(botConfig) }
                    );
                }

                break;
// ===== CASE 5 =====
case 5:
    const prefix = botConfig.command?.prefix || '.';
    const saluranId = botConfig.saluran?.id || '';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';

    const categories = getCategories();
    const commandsByCategory = getCommandsByCategory();
    const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];

    const sortedCats = [...categories].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    const toMonoUpperBold = (text) => {
        const chars = {
            'A': '𝗔','B': '𝗕','C': '𝗖','D': '𝗗','E': '𝗘','F': '𝗙','G': '𝗚',
            'H': '𝗛','I': '𝗜','J': '𝗝','K': '𝗞','L': '𝗟','M': '𝗠','N': '𝗡',
            'O': '𝗢','P': '𝗣','Q': '𝗤','R': '𝗥','S': '𝗦','T': '𝗧','U': '𝗨',
            'V': '𝗩','W': '𝗪','X': '𝗫','Y': '𝗬','Z': '𝗭'
        };
        return text.toUpperCase().split('').map(c => chars[c] || c).join('');
    };

    const categoryRows = [];

    const modeAllowedMap = {
        md: null,
        cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
        store: ['main', 'group', 'sticker', 'owner', 'store'],
        pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
    };

    const modeExcludeMap = {
        md: ['panel', 'pushkontak', 'store'],
        cpanel: null,
        store: null,
        pushkontak: null
    };

    const allowedCats = modeAllowedMap[botMode];
    const excludeCats = modeExcludeMap[botMode] || [];

    for (const cat of sortedCats) {
        if (cat === 'owner' && !m.isOwner) continue;
        if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
        if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;

        const cmds = commandsByCategory[cat] || [];
        if (cmds.length === 0) continue;

        const emoji = CATEGORY_EMOJIS[cat] || '📁';
        const title = `${emoji} ${toMonoUpperBold(cat)}`;

        categoryRows.push({
            title: title,
            id: `${prefix}menucat ${cat}`,
            description: `${cmds.length} comandos`
        });
    }

    let totalCmds = 0;
    for (const cat of categories) {
        totalCmds += (commandsByCategory[cat] || []).length;
    }

    const greeting = getTimeGreeting();
    const uptimeFormatted = formatUptime(uptime);

    let headerText = `*@${m.pushName || "Usuario"}* 🪸

Soy ${botConfig.bot?.name || 'Ourin-AI'}, un bot de WhatsApp listo para ayudarte.  

Puedes usarme para buscar información, obtener datos o ayudarte con tareas simples directamente desde WhatsApp — práctico y sin complicaciones.\n\n`;

    headerText += `╭┈┈⬡「 🤖 *INFORMACIÓN DEL BOT* 」\n`;
    headerText += `┃ \`◦\` Nombre: *${botConfig.bot?.name || 'Ourin-AI'}*\n`;
    headerText += `┃ \`◦\` Versión: *v${botConfig.bot?.version || '1.2.0'}*\n`;
    headerText += `┃ \`◦\` Modo: *${(botConfig.mode || 'public').toUpperCase()}*\n`;
    headerText += `┃ \`◦\` Tiempo activo: *${uptimeFormatted}*\n`;
    headerText += `┃ \`◦\` Total comandos: *${totalCmds}*\n`;
    headerText += `╰┈┈┈┈┈┈┈┈⬡\n\n`;

    headerText += `📋 *Selecciona una categoría abajo para ver los comandos*`;

    try {
        const { generateWAMessageFromContent, proto } = require('ourin');

        const buttons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '📁 Elegir menú',
                    sections: [{
                        title: '📋 SELECCIONAR CATEGORÍA',
                        rows: categoryRows
                    }]
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '📊 TOTAL DE FUNCIONES',
                    id: `${prefix}totalfitur`
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '📊 TODOS LOS MENÚS',
                    id: `${prefix}allmenu`
                })
            }
        ];

        let headerMedia = null;

        if (imageBuffer) {
            try {
                const { prepareWAMessageMedia } = require('ourin');
                headerMedia = await prepareWAMessageMedia({
                    image: imageBuffer
                }, {
                    upload: sock.waUploadToServer
                });
            } catch (e) {}
        }

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: headerText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `© ${botConfig.bot?.name || 'Ourin-AI'} | ${sortedCats.length} Categorías`
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: `${botConfig.bot?.name || 'Ourin-AI'}`,
                            hasMediaAttachment: !!headerMedia,
                            ...(headerMedia || {})
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: buttons
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    } catch (btnError) {
        console.error('[Menu V5] Error en botones:', btnError.message);

        let catListText = `📋 *CATEGORÍAS DEL MENÚ*\n\n`;

        for (const cat of sortedCats) {
            if (cat === 'owner' && !m.isOwner) continue;

            const cmds = commandsByCategory[cat] || [];
            if (cmds.length === 0) continue;

            const emoji = CATEGORY_EMOJIS[cat] || '📁';

            catListText += `> ${emoji} \`${prefix}menucat ${cat}\` - ${toMonoUpperBold(cat)} (${cmds.length})\n`;
        }

        catListText += `\n_Escribe el comando de la categoría para ver sus comandos_`;

        const fallbackMsg = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };

        if (imageBuffer) {
            fallbackMsg.image = imageBuffer;
            fallbackMsg.caption = headerText + '\n\n' + catListText;
        } else {
            fallbackMsg.text = headerText + '\n\n' + catListText;
        }

        await sock.sendMessage(m.chat, fallbackMsg, { quoted: getVerifiedQuoted(botConfig) });
    }

    break;
// ===== CASE 6 =====
case 6:
    const thumbPathV6 = path.join(process.cwd(), 'assets', 'images', 'ourin3.jpg');
    const saluranIdV6 = botConfig.saluran?.id || '';
    const saluranNameV6 = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
    const saluranLinkV6 = botConfig.saluran?.link || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t';

    let bannerThumbV6 = null;

    try {
        const sourceBuffer = fs.existsSync(thumbPathV6) 
            ? fs.readFileSync(thumbPathV6) 
            : (thumbBuffer || imageBuffer);

        if (sourceBuffer) {
            bannerThumbV6 = await sharp(sourceBuffer)
                .resize(200, 200, { fit: 'inside' })
                .jpeg({ quality: 90 })
                .toBuffer();
        }
    } catch (resizeErr) {
        console.error('[Menu V6] Error al redimensionar:', resizeErr.message);
        bannerThumbV6 = thumbBuffer;
    }

    const contextInfoV6 = {
        mentionedJid: [m.sender],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranIdV6,
            newsletterName: saluranNameV6,
            serverMessageId: 127
        },
        externalAdReply: {
            title: botConfig.bot?.name || 'Ourin-AI',
            body: `v${botConfig.bot?.version || '1.0.1'} • Bot de respuesta rápida`,
            sourceUrl: saluranLinkV6,
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail: true,
            thumbnail: thumbBuffer || imageBuffer
        }
    };

    try {
        await sock.sendMessage(m.chat, {
            document: imageBuffer || Buffer.from('Ourin-AI Menu'),
            mimetype: 'application/pdf',
            fileName: `sin dolor no hay ganancia`,
            fileLength: 9999999999,
            caption: text,
            jpegThumbnail: bannerThumbV6,
            contextInfo: contextInfoV6
        }, { quoted: getVerifiedQuoted(botConfig) });

    } catch (v6Error) {
        console.error('[Menu V6] Error:', v6Error.message);

        const fallbackV6 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };

        if (imageBuffer) {
            fallbackV6.image = imageBuffer;
            fallbackV6.caption = text;
        } else {
            fallbackV6.text = text;
        }

        await sock.sendMessage(m.chat, fallbackV6, { quoted: getVerifiedQuoted(botConfig) });
    }

    break;


// ===== CASE 7 =====
case 7:
    try {
        const { prepareWAMessageMedia } = require('ourin');
        const prefixV7 = botConfig.command?.prefix || '.';
        const categoriesV7 = getCategories();
        const commandsByCategoryV7 = getCommandsByCategory();

        const categoryOrderV7 = ['main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info'];

        const modeAllowedMapV7 = {
            md: null,
            cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
            store: ['main', 'group', 'sticker', 'owner', 'store'],
            pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
        };

        const modeExcludeMapV7 = {
            md: ['panel', 'pushkontak', 'store'],
            cpanel: null, 
            store: null, 
            pushkontak: null
        };

        const allowedCatsV7 = modeAllowedMapV7[botMode];
        const excludeCatsV7 = modeExcludeMapV7[botMode] || [];

        const sortedCatsV7 = categoriesV7.sort((a, b) => {
            const indexA = categoryOrderV7.indexOf(a);
            const indexB = categoryOrderV7.indexOf(b);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });

        const carouselCards = [];

        for (const cat of sortedCatsV7) {
            if (cat === 'owner' && !m.isOwner) continue;
            if (allowedCatsV7 && !allowedCatsV7.includes(cat.toLowerCase())) continue;
            if (excludeCatsV7 && excludeCatsV7.includes(cat.toLowerCase())) continue;

            const cmds = commandsByCategoryV7[cat] || [];
            if (cmds.length === 0) continue;

            const emoji = CATEGORY_EMOJIS[cat] || '📁';
            const categoryName = toSmallCaps(cat);

            let cardBody = `━━━━━━━━━━━━━━━\n`;

            for (const cmd of cmds.slice(0, 15)) {
                cardBody += `◦ \`${prefixV7}${toSmallCaps(cmd)}\`\n`;
            }

            if (cmds.length > 15) {
                cardBody += `\n_...y ${cmds.length - 15} comandos más_`;
            }

            cardBody += `\n\n> Total: ${cmds.length} comandos`;

            let cardMedia = null;

            try {
                const catThumbPath = path.join(process.cwd(), 'assets', 'images', `cat-${cat}.jpg`);
                const defaultV7Path = path.join(process.cwd(), 'assets', 'images', 'ourin-v7.jpg');

                let sourceImage = fs.existsSync(defaultV7Path) 
                    ? fs.readFileSync(defaultV7Path) 
                    : thumbBuffer;

                if (fs.existsSync(catThumbPath)) {
                    sourceImage = fs.readFileSync(catThumbPath);
                }

                if (sourceImage) {
                    const resizedImage = await sharp(sourceImage)
                        .resize(300, 300, { fit: 'cover' })
                        .jpeg({ quality: 80 })
                        .toBuffer();

                    cardMedia = await prepareWAMessageMedia({
                        image: resizedImage
                    }, {
                        upload: sock.waUploadToServer
                    });
                }

            } catch (e) {
                console.error('[Menu V7] Error en imagen de tarjeta:', e.message);
            }

            const cardMessage = {
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: `${emoji} ${categoryName.toUpperCase()}`,
                    hasMediaAttachment: !!cardMedia,
                    ...(cardMedia || {})
                }),
                body: proto.Message.InteractiveMessage.Body.fromObject({
                    text: cardBody
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                    text: `${botConfig.bot?.name || 'Ourin'} • ${cat}`
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [{
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: `📋 Ver ${categoryName}`,
                            id: `${prefixV7}menucat ${cat}`
                        })
                    }]
                })
            };

            carouselCards.push(cardMessage);
        }

        if (carouselCards.length === 0) {
            await m.reply(text);
            break;
        }

        const msg = await generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: `${getTimeGreeting()} *${m.pushName}!*\n\n> Desliza para ver las categorías del menú\n> Toca el botón para ver detalles`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `${botConfig.bot?.name || 'Ourin'} v${botConfig.bot?.version || '1.0'}`
                        }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                            cards: carouselCards
                        })
                    })
                }
            }
        }, {
            userJid: m.sender,
            quoted: getVerifiedQuoted(botConfig)
        });

        await sock.relayMessage(m.chat, msg.message, {
            messageId: msg.key.id
        });

    } catch (carouselError) {
        console.error('[Menu V7] Error en carrusel:', carouselError.message);

        const fallbackV7 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };

        if (imageBuffer) {
            fallbackV7.image = imageBuffer;
            fallbackV7.caption = text;
        } else {
            fallbackV7.text = text;
        }

        await sock.sendMessage(m.chat, fallbackV7, { quoted: getVerifiedQuoted(botConfig) });
    }

    break;
// ===== CASE 8 =====
case 8:
    try {
        const prefixV8 = botConfig.command?.prefix || '.';
        const userV8 = db.getUser(m.sender);

        const categoriesV8 = getCategories();
        const commandsByCategoryV8 = getCommandsByCategory();

        let totalCmdsV8 = 0;
        for (const cat of categoriesV8) {
            totalCmdsV8 += (commandsByCategoryV8[cat] || []).length;
        }

        let roleV8 = 'Usuario';
        if (m.isOwner) roleV8 = 'Dueño';
        else if (m.isPremium) roleV8 = 'Premium';

        const uptimeV8 = formatUptime(uptime);
        const greetingV8 = getTimeGreeting();

        let menuTextV8 = `${greetingV8} *@${m.pushName}* 👋

╭─〔 🤖 *INFORMACIÓN DEL BOT* 〕
│ Nombre     : ${botConfig.bot?.name || 'Ourin-AI'}
│ Versión    : v${botConfig.bot?.version || '1.0.0'}
│ Modo       : ${(botConfig.mode || 'public').toUpperCase()}
│ Prefijo    : ${prefixV8}
│ Tiempo activo : ${uptimeV8}
│ Total cmds : ${totalCmdsV8}
╰────────────────⬣

╭─〔 👤 *TU PERFIL* 〕
│ Nombre   : ${m.pushName}
│ Rol      : ${roleV8}
│ Límite   : ${m.isOwner || m.isPremium ? '∞ Ilimitado' : (userV8?.limit ?? 25)}
╰────────────────⬣

📋 *LISTA DE COMANDOS*\n`;

        const categoryOrderV8 = ['main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info'];

        const sortedCatsV8 = categoriesV8.sort((a, b) => {
            const indexA = categoryOrderV8.indexOf(a);
            const indexB = categoryOrderV8.indexOf(b);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });

        for (const cat of sortedCatsV8) {
            if (cat === 'owner' && !m.isOwner) continue;

            const cmds = commandsByCategoryV8[cat] || [];
            if (cmds.length === 0) continue;

            const emoji = CATEGORY_EMOJIS[cat] || '📁';

            menuTextV8 += `\n╭─〔 ${emoji} *${cat.toUpperCase()}* 〕\n`;

            for (const cmd of cmds) {
                menuTextV8 += `│ ◦ ${prefixV8}${cmd}\n`;
            }

            menuTextV8 += `╰────────────────⬣\n`;
        }

        menuTextV8 += `\n💡 *CONSEJOS*  
│ ◦ Usa correctamente los comandos  
│ ◦ Respeta los límites si no eres premium  
│ ◦ Contacta al dueño si necesitas acceso extra  
╰────────────────⬣`;

        const contextInfoV8 = getContextInfo(botConfig, m, thumbBuffer);

        if (imageBuffer) {
            await sock.sendMessage(m.chat, {
                image: imageBuffer,
                caption: menuTextV8,
                contextInfo: contextInfoV8
            }, { quoted: getVerifiedQuoted(botConfig) });
        } else {
            await sock.sendMessage(m.chat, {
                text: menuTextV8,
                contextInfo: contextInfoV8
            }, { quoted: getVerifiedQuoted(botConfig) });
        }

    } catch (errV8) {
        console.error('[Menu V8] Error:', errV8.message);

        const fallbackV8 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };

        if (imageBuffer) {
            fallbackV8.image = imageBuffer;
            fallbackV8.caption = text;
        } else {
            fallbackV8.text = text;
        }

        await sock.sendMessage(m.chat, fallbackV8, { quoted: getVerifiedQuoted(botConfig) });
    }

    break;
// ===== CASE 9 =====
case 9:
    try {
        const prefixV9 = botConfig.command?.prefix || '.';
        const categoriesV9 = getCategories();
        const commandsByCategoryV9 = getCommandsByCategory();

        let totalCmdsV9 = 0;
        for (const cat of categoriesV9) {
            totalCmdsV9 += (commandsByCategoryV9[cat] || []).length;
        }

        let textV9 = `📋 *LISTA COMPLETA DE MENÚS*\n`;
        textV9 += `> Total de comandos: ${totalCmdsV9}\n\n`;

        for (const cat of categoriesV9) {
            if (cat === 'owner' && !m.isOwner) continue;

            const cmds = commandsByCategoryV9[cat] || [];
            if (cmds.length === 0) continue;

            const emoji = CATEGORY_EMOJIS[cat] || '📁';

            textV9 += `╭─〔 ${emoji} *${cat.toUpperCase()}* 〕\n`;

            for (const cmd of cmds) {
                textV9 += `│ ◦ ${prefixV9}${cmd}\n`;
            }

            textV9 += `╰────────────────⬣\n\n`;
        }

        await sock.sendMessage(m.chat, {
            text: textV9,
            contextInfo: getContextInfo(botConfig, m, thumbBuffer)
        }, { quoted: getVerifiedQuoted(botConfig) });

    } catch (errV9) {
        console.error('[Menu V9] Error:', errV9.message);
        await m.reply(text);
    }

    break;


// ===== CASE 10 =====
case 10:
    try {
        const prefixV10 = botConfig.command?.prefix || '.';
        const categoriesV10 = getCategories();
        const commandsByCategoryV10 = getCommandsByCategory();

        const buttonsV10 = [];

        for (const cat of categoriesV10) {
            if (cat === 'owner' && !m.isOwner) continue;

            const cmds = commandsByCategoryV10[cat] || [];
            if (cmds.length === 0) continue;

            buttonsV10.push({
                buttonId: `${prefixV10}menucat ${cat}`,
                buttonText: { displayText: `${CATEGORY_EMOJIS[cat] || '📁'} ${cat}` },
                type: 1
            });
        }

        const buttonMessage = {
            text: `📋 *MENÚ INTERACTIVO*\n\nSelecciona una categoría:`,
            footer: `${botConfig.bot?.name || 'Ourin-AI'}`,
            buttons: buttonsV10.slice(0, 3),
            headerType: 1,
            contextInfo: getContextInfo(botConfig, m, thumbBuffer)
        };

        await sock.sendMessage(
            m.chat,
            buttonMessage,
            { quoted: getVerifiedQuoted(botConfig) }
        );

    } catch (errV10) {
        console.error('[Menu V10] Error:', errV10.message);

        const fallbackV10 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };

        if (imageBuffer) {
            fallbackV10.image = imageBuffer;
            fallbackV10.caption = text;
        } else {
            fallbackV10.text = text;
        }

        await sock.sendMessage(m.chat, fallbackV10, { quoted: getVerifiedQuoted(botConfig) });
    }

    break;
// ===== CASE 11 =====
case 11:
    try {
        const prefixV11 = botConfig.command?.prefix || '.';

        const textV11 = `Gracias por usar nuestro bot 🤖

Presiona el botón de abajo para elegir el menú que deseas ver.`;

        const buttonsV11 = [
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '📋 VER MENÚ',
                    id: `${prefixV11}menu`
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '📊 TODOS LOS MENÚS',
                    id: `${prefixV11}allmenu`
                })
            }
        ];

        const msgV11 = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: textV11
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `${botConfig.bot?.name || 'Ourin-AI'}`
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: 'MENÚ PRINCIPAL',
                            hasMediaAttachment: false
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: buttonsV11
                        })
                    })
                }
            }
        }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });

        await sock.relayMessage(m.chat, msgV11.message, { messageId: msgV11.key.id });

    } catch (errV11) {
        console.error('[Menu V11] Error:', errV11.message);
        await m.reply(text);
    }

    break;


// ===== CASE 12 =====
case 12:
    try {
        const textV12 = `Gracias por escribirnos.

Ahora estás hablando con nuestro bot automático de WhatsApp 🤖

Por favor selecciona una opción del menú para continuar.`;

        const prefixV12 = botConfig.command?.prefix || '.';

        const sectionsV12 = [
            {
                title: '📋 MENÚ PRINCIPAL',
                rows: [
                    {
                        title: 'Ver menú',
                        rowId: `${prefixV12}menu`,
                        description: 'Mostrar lista de comandos'
                    },
                    {
                        title: 'Todos los menús',
                        rowId: `${prefixV12}allmenu`,
                        description: 'Ver todos los comandos disponibles'
                    }
                ]
            }
        ];

        const listMessage = {
            text: textV12,
            footer: `${botConfig.bot?.name || 'Ourin-AI'}`,
            title: 'MENÚ BOT',
            buttonText: 'Seleccionar',
            sections: sectionsV12,
            contextInfo: getContextInfo(botConfig, m, thumbBuffer)
        };

        await sock.sendMessage(
            m.chat,
            listMessage,
            { quoted: getVerifiedQuoted(botConfig) }
        );

    } catch (errV12) {
        console.error('[Menu V12] Error:', errV12.message);

        const fallbackV12 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };

        if (imageBuffer) {
            fallbackV12.image = imageBuffer;
            fallbackV12.caption = text;
        } else {
            fallbackV12.text = text;
        }

        await sock.sendMessage(m.chat, fallbackV12, { quoted: getVerifiedQuoted(botConfig) });
    }

    break;


// ===== DEFAULT =====
default:
    if (imageBuffer) {
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: text,
            contextInfo: getContextInfo(botConfig, m, thumbBuffer)
        }, { quoted: getVerifiedQuoted(botConfig) });
    } else {
        await sock.sendMessage(m.chat, {
            text: text,
            contextInfo: getContextInfo(botConfig, m, thumbBuffer)
        }, { quoted: getVerifiedQuoted(botConfig) });
    }
}

}

// EXPORT FINAL
module.exports = {
    config: pluginConfig,
    handler
};
