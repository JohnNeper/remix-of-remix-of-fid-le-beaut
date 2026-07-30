const fs = require('fs');
const file = '/Users/THERENCE/Private/West Digital Hub/beautySpace/remix-of-remix-of-fid-le-beaut/src/pages/Rappels.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace all t('key', 'default with 'single quote' inside') patterns by using double quotes for fallbacks
// Specific known unescaped quotes:
content = content.replace(`'Pas d'anniversaire à célébrer ce mois-ci'`, `"Pas d'anniversaire à célébrer ce mois-ci"`);
content = content.replace(`'Clientes proches d'un cadeau'`, `"Clientes proches d'un cadeau"`);
content = content.replace(`'Merci d'avoir choisi`, `"Merci d'avoir choisi`);
content = content.replace(`'Pas d'anniversaire`, `"Pas d'anniversaire`);

// Let's also check defaultMessages in handleSendWhatsApp:
content = content.replace(`'reminders.msg.inactivity': '`, `'reminders.msg.inactivity': \``);
content = content.replace(`'reminders.msg.birthday': '`, `'reminders.msg.birthday': \``);
content = content.replace(`'reminders.msg.followUp': '`, `'reminders.msg.followUp': \``);
content = content.replace(`'reminders.msg.loyalty': '`, `'reminders.msg.loyalty': \``);
content = content.replace(`'reminders.msg.welcome': '`, `'reminders.msg.welcome': \``);

fs.writeFileSync(file, content);
console.log('Fixed all single quotes in Rappels.tsx');
