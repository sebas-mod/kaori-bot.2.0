const config = require('../../config');
const { generateWAMessageFromContent, proto } = require('ourin');

const pluginConfig = {
    name: 'setmenu',
    alias: ['menuvariant', 'menustyle'],
    category: 'owner',
    description: 'Configurar la variante de visualización del menú',
    usage: '.setmenu <v1-v15>',
    example: '.setmenu v15',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const VARIANTS = {
    v1: { id: 1, name: 'Simple', desc: 'Imagen básica sin contextInfo' },
    v2: { id: 2, name: 'Estándar', desc: 'Imagen + contextInfo completo' },
    v3: { id: 3, name: 'Documento', desc: 'Documento + jpegThumbnail + quoted verificado' },
    v4: { id: 4, name: 'Video', desc: 'Video + contextInfo + quoted verificado' },
    v5: { id: 5, name: 'Botones', desc: 'Imagen + botones' },
    v6: { id: 6, name: 'Documento Premium', desc: 'Documento + jpegThumbnail + contextInfo' },
    v7: { id: 7, name: 'Carrusel', desc: 'Tarjetas deslizables por categoría' },
    v8: { id: 8, name: 'Minimalista', desc: 'Imagen + diseño moderno' },
    v9: { id: 9, name: 'Flujo Nativo', desc: 'Interactivo con botones nativos' },
    v10: { id: 10, name: 'Flujo Nativo 2', desc: 'Producto interactivo' },
    v11: { id: 11, name: 'Documento Interactivo', desc: 'Documento + nativeFlowMessage' },
    v12: { id: 12, name: 'Menú Versión 12', desc: 'Diseño alternativo' },
    v13: { id: 13, name: 'Miniatura Canvas', desc: 'Banner canvas personalizado' },
    v14: { id: 14, name: 'Menú Versión 14', desc: 'Diseño alternativo 14' },
    v15: { id: 15, name: 'Banner URL', desc: 'Menú personalizado que lee el banner desde banner-config.json' }
};

async function handler(m, { sock, db }) {
    const args = m.args || [];
    const variant = args[0]?.toLowerCase();

    if (variant) {
        const selected = VARIANTS[variant];
        if (!selected) {
            await m.reply(`❌ ¡Variante no válida!\n\nUsa: v1 hasta v15`);
            return;
        }

        db.setting('menuVariant', selected.id);
        await db.save();

        await m.reply(
            `✅ Variante del menú cambiada a *V${selected.id}*\n\n` +
            `> *${selected.name}*\n` +
            `> _${selected.desc}_`
        );
        return;
    }

    const current = db.setting('menuVariant') || config.ui?.menuVariant || 2;

    const rows = Object.entries(VARIANTS).map(([key, val]) => ({
        title: `${key.toUpperCase()}${val.id === current ? ' ✓' : ''} — ${val.name}`,
        description: val.desc,
        id: `${m.prefix}setmenu ${key}`
    }));

    const bodyText =
        `🎨 *CONFIGURAR VARIANTE DEL MENÚ*\n\n` +
        `> Variante actual: *V${current}*\n` +
        `> _${VARIANTS[`v${current}`]?.name || 'Desconocido'}_\n\n` +
        `> Selecciona una variante de la lista`;

    try {
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '🎨 ELEGIR VARIANTE',
                    sections: [{
                        title: 'LISTA DE VARIANTES DE MENÚ',
                        rows
                    }]
                })
            }
        ];

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: bodyText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: config.bot?.name || 'Ourin-AI'
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: '🎨 Variante del Menú',
                            subtitle: `${Object.keys(VARIANTS).length} variantes disponibles`,
                            hasMediaAttachment: false
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: interactiveButtons
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: config.saluran?.id || '120363208449943317@newsletter',
                                newsletterName: config.saluran?.name || config.bot?.name || 'Ourin-AI',
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m });

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    } catch {
        let txt = `🎨 *CONFIGURAR VARIANTE DEL MENÚ*\n\n`;
        txt += `> Variante actual: *V${current}*\n\n`;
        for (const [key, val] of Object.entries(VARIANTS)) {
            const mark = val.id === current ? ' ✓' : '';
            txt += `> *${key.toUpperCase()}*${mark} — _${val.desc}_\n`;
        }
        txt += `\n_Usa: \`.setmenu v15\`_`;
        await m.reply(txt);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
