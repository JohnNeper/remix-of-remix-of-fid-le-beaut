const fs = require('fs');
const file = '/Users/THERENCE/Private/West Digital Hub/beautySpace/remix-of-remix-of-fid-le-beaut/src/pages/Bilan.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `const periodLabel = period === 'day' ? "Aujourd'hui" : period === 'week' ? 'Cette semaine' : period === 'month' ? 'Ce mois' : 'Cette année';`,
  `const periodLabel = period === 'day' ? (t('bilan.periods.dayLabel') || "Aujourd'hui") : period === 'week' ? (t('bilan.periods.weekLabel') || 'Cette semaine') : period === 'month' ? (t('bilan.periods.monthLabel') || 'Ce mois') : (t('bilan.periods.yearLabel') || 'Cette année');`
);

content = content.replace(
  `<h1 className="text-3xl font-black text-foreground tracking-tight">Bilan du Boss</h1>`,
  `<h1 className="text-3xl font-black text-foreground tracking-tight">{t('bilan.title')}</h1>`
);

content = content.replace(
  `<Activity className="h-4 w-4 text-primary" /> Vue exécutive des performances`,
  `<Activity className="h-4 w-4 text-primary" /> {t('bilan.subtitle')}`
);

content = content.replace(
  `{p === 'day' ? "Jour" : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}`,
  `{t(\`bilan.periods.\${p}\`)}`
);

content = content.replace(
  `<Download className="h-4 w-4 mr-2 text-primary" /> Exporter`,
  `<Download className="h-4 w-4 mr-2 text-primary" /> {t('bilan.export')}`
);

content = content.replace(
  `<h2 className="text-lg font-bold">Aperçu {periodLabel.toLowerCase()}</h2>`,
  `<h2 className="text-lg font-bold">{t('bilan.overview')} ({periodLabel})</h2>`
);

content = content.replace(
  `title="Revenus"`,
  `title={t('bilan.revenue')}`
);

content = content.replace(
  `title="Dépenses"`,
  `title={t('bilan.expenses')}`
);

content = content.replace(
  `title="Bénéfice Net"`,
  `title={t('bilan.netProfit')}`
);

content = content.replace(
  `title="Clients Reçus"`,
  `title={t('bilan.clientsReceived')}`
);

content = content.replace(
  `title="CA Prestations"`,
  `title={t('bilan.revenuePrestations')}`
);

content = content.replace(
  `title="CA Produits"`,
  `title={t('bilan.revenueProducts')}`
);

content = content.replace(
  `title="Rendez-vous"`,
  `title={t('bilan.appointments')}`
);

content = content.replace(
  `title="Nouveaux Clients"`,
  `title={t('bilan.newClients')}`
);

content = content.replace(
  `<TabsTrigger value="prestations" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">🏆 Palmarès Prestations</TabsTrigger>`,
  `<TabsTrigger value="prestations" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">{t('bilan.topPrestationsTab')}</TabsTrigger>`
);

content = content.replace(
  `<TabsTrigger value="employes" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">👩‍💼 Top Employés</TabsTrigger>`,
  `<TabsTrigger value="employes" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">{t('bilan.topStaffTab')}</TabsTrigger>`
);

content = content.replace(
  `<TabsTrigger value="finances" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">💰 Trésorerie</TabsTrigger>`,
  `<TabsTrigger value="finances" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">{t('bilan.treasuryTab')}</TabsTrigger>`
);

content = content.replace(
  `<p className="text-lg font-bold">Aucune prestation réalisée {periodLabel.toLowerCase()}</p>`,
  `<p className="text-lg font-bold">{t('bilan.noServices')}</p>`
);

content = content.replace(
  `<p className="text-lg font-bold">Aucune donnée employé {periodLabel.toLowerCase()}</p>`,
  `<p className="text-lg font-bold">{t('bilan.noStaffData')}</p>`
);

content = content.replace(
  `Répartition par moyen de paiement`,
  `{t('bilan.byPaymentMethod')}`
);

content = content.replace(
  `Dépenses par catégorie`,
  `{t('bilan.expensesByCategory')}`
);

content = content.replace(
  `<p className="text-sm text-muted-foreground text-center py-8">Aucune transaction</p>`,
  `<p className="text-sm text-muted-foreground text-center py-8">{t('bilan.noTransactions')}</p>`
);

content = content.replace(
  `<p className="text-sm text-muted-foreground text-center py-8">Aucune dépense</p>`,
  `<p className="text-sm text-muted-foreground text-center py-8">{t('bilan.noExpenses')}</p>`
);

fs.writeFileSync(file, content);
console.log('Bilan.tsx updated successfully');
