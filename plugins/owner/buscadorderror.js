const fs = require('fs');
const path = require('path');

const pluginConfig = {
  name: 'checkplugins',
  alias: ['chkplugins'],
  category: 'owner',
  description: 'Revisa plugins (incluye subcarpetas)',
  usage: '.checkplugins',
  isOwner: true,
  cooldown: 5
};

function getAllPluginFiles(dir) {
  let results = [];

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllPluginFiles(fullPath)); // 🔁 recursivo
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  }

  return results;
}

async function handler(m) {
  const pluginsPath = path.join(__dirname);

  let errores = [];
  let problemas = [];
  let ok = [];

  const files = getAllPluginFiles(pluginsPath);

  for (const fullPath of files) {
    const file = path.relative(pluginsPath, fullPath);

    // 🚫 evitar analizarse a sí mismo
    if (file === path.basename(__filename)) continue;

    try {
      delete require.cache[require.resolve(fullPath)];
      const plugin = require(fullPath);

      // ❌ ERRORES
      if (!plugin || typeof plugin !== 'object') {
        errores.push(`❌ ${file} → No exporta objeto`);
        continue;
      }

      if (typeof plugin.handler !== 'function') {
        errores.push(`❌ ${file} → Falta handler()`);
        continue;
      }

      // ⚠️ PROBLEMAS
      const code = fs.readFileSync(fullPath, 'utf8');

      if (!plugin.name) {
        problemas.push(`⚠️ ${file} → Falta name`);
      }

      if (code.includes('axios') || code.includes('fetch(')) {
        try {
          const res = await fetch('https://jsonplaceholder.typicode.com/todos/1');
          if (!res.ok) {
            problemas.push(`⚠️ ${file} → API no responde`);
            continue;
          }
        } catch {
          problemas.push(`⚠️ ${file} → API caída / sin conexión`);
          continue;
        }
      }

      // 🧪 ejecución controlada
      try {
        await plugin.handler(
          { chat: 'test', text: '' },
          { sock: null, args: [], text: '' }
        );
        ok.push(`✅ ${file}`);
      } catch (e) {
        problemas.push(`⚠️ ${file} → Error interno: ${e.message}`);
      }

    } catch (err) {
      errores.push(`❌ ${file} → ${err.message}`);
    }
  }

  // 📊 RESULTADO
  let txt = `🧪 *CHECK PLUGINS (CON SUBCARPETAS)*\n\n`;

  txt += `❌ *Errores (${errores.length})*\n`;
  txt += errores.length ? errores.join('\n') : 'Sin errores';
  txt += `\n\n`;

  txt += `⚠️ *Problemas (${problemas.length})*\n`;
  txt += problemas.length ? problemas.join('\n') : 'Sin problemas';
  txt += `\n\n`;

  txt += `✅ *Funcionando (${ok.length})*\n`;
  txt += ok.length ? ok.join('\n') : 'Ninguno verificado';

  return m.reply(txt);
}

module.exports = {
  ...pluginConfig,
  handler
};
