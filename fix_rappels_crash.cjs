const fs = require('fs');
const path = '/Users/THERENCE/Private/West Digital Hub/beautySpace/remix-of-remix-of-fid-le-beaut/src/pages/Rappels.tsx';

let content = fs.readFileSync(path, 'utf8');

// Replace client filtering logic with bulletproof safe calculations
const oldLogic = /const joursRappelInactivite = [\s\S]*?const totalActions = clientesInactives\.length \+ clientesAnniversaire\.length \+ clientesSuivi\.length \+ clientesProcheCadeau\.length;/;

const newLogic = `const joursRappelInactivite = (salon && 'joursRappelInactivite' in salon && typeof (salon as any).joursRappelInactivite === 'number') ? (salon as any).joursRappelInactivite : 30;
  const joursRappelSuivi = (salon && 'joursRappelSuivi' in salon && typeof (salon as any).joursRappelSuivi === 'number') ? (salon as any).joursRappelSuivi : 14;
  const configFidelite = salon && 'configFidelite' in salon ? (salon as any).configFidelite : null;

  const safeClients = useMemo(() => Array.isArray(clients) ? clients : [], [clients]);

  const clientesInactives = useMemo(() => {
    if (!safeClients.length) return [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (joursRappelInactivite || 30));
    return safeClients.filter(c => {
      if (!c.derniereVisite) return true;
      const d = new Date(c.derniereVisite);
      return !isNaN(d.getTime()) && d < cutoffDate;
    });
  }, [safeClients, joursRappelInactivite]);

  const clientesAnniversaire = useMemo(() => safeClients.filter(c => {
    if (!c.dateAnniversaire) return false;
    const today = new Date();
    const anniv = new Date(c.dateAnniversaire);
    return !isNaN(anniv.getTime()) && anniv.getMonth() === today.getMonth();
  }), [safeClients]);

  const clientesSuivi = useMemo(() => safeClients.filter(c => {
    if (!c.derniereVisite) return false;
    const dateObj = new Date(c.derniereVisite);
    if (isNaN(dateObj.getTime())) return false;
    const daysSince = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 7 && daysSince <= (joursRappelSuivi || 14);
  }), [safeClients, joursRappelSuivi]);

  const clientesProcheCadeau = useMemo(() => safeClients.filter(c => {
    if (!configFidelite || !configFidelite.visitesRequises) return false;
    const pts = c.pointsFidelite || 0;
    const req = configFidelite.visitesRequises || 10;
    const remaining = req - (pts % req);
    return remaining <= 2 && remaining > 0 && pts > 0;
  }), [safeClients, configFidelite]);

  const clientesNouvelles = useMemo(() => safeClients.filter(c => (c.nombreVisites || 0) <= 1), [safeClients]);

  const totalActions = (clientesInactives?.length || 0) + (clientesAnniversaire?.length || 0) + (clientesSuivi?.length || 0) + (clientesProcheCadeau?.length || 0);`;

content = content.replace(oldLogic, newLogic);

// Replace filterClients with safe array check
content = content.replace(
  `const filterClients = (list: typeof clients) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(c => c.nom.toLowerCase().includes(q) || c.telephone.includes(q));
  };`,
  `const filterClients = (list: typeof clients) => {
    if (!list || !Array.isArray(list)) return [];
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(c => (c.nom && c.nom.toLowerCase().includes(q)) || (c.telephone && c.telephone.includes(q)));
  };`
);

fs.writeFileSync(path, content);
console.log('Rappels.tsx safely updated to prevent runtime crashes');
