const fs = require('fs');
const file = '/Users/THERENCE/Private/West Digital Hub/beautySpace/remix-of-remix-of-fid-le-beaut/src/pages/Rappels.tsx';
let content = fs.readFileSync(file, 'utf8');

// Regex to catch t('key', 'string with single quote inside') or similar
// Or simply replace all single quotes in fallbacks to avoid any SWC syntax error
content = content.replace(/'Envoyez un message personnalisé à n'importe quelle cliente'/g, `"Envoyez un message personnalisé à n'importe quelle cliente"`);
content = content.replace(/'Pas d'anniversaire à célébrer ce mois-ci'/g, `"Pas d'anniversaire à célébrer ce mois-ci"`);
content = content.replace(/'Clientes proches d'un cadeau'/g, `"Clientes proches d'un cadeau"`);
content = content.replace(/'Incitez vos clientes à revenir pour débloquer leur réduction\.'/g, `"Incitez vos clientes à revenir pour débloquer leur réduction."`);
content = content.replace(/'Définissez après combien de jours relancer le client pour lui demander son avis sur la prestation\.'/g, `"Définissez après combien de jours relancer le client pour lui demander son avis sur la prestation."`);
content = content.replace(/'Souhaitez-leur une belle journée !'/g, `"Souhaitez-leur une belle journée !"` );

// General regex fix for t('key', 'text...') where text has single quote inside
content = content.replace(/t\(\s*('|\")([^'\"]+)('|\")\s*,\s*'([^'\n]*'[^'\n]*)'\s*(,|\))/g, (match, q1, key, q2, text, rest) => {
  const cleanText = text.replace(/'/g, "’");
  return `t('${key}', "${cleanText}"${rest}`;
});

fs.writeFileSync(file, content);
console.log('Fixed all t() quote issues in Rappels.tsx');
