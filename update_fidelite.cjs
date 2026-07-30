const fs = require('fs');
const file = '/Users/THERENCE/Private/West Digital Hub/beautySpace/remix-of-remix-of-fid-le-beaut/src/pages/Fidelite.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace top TIERS definition with placeholder or move inside
content = content.replace(
  /const TIERS = \[[\s\S]*?\];/,
  `// TIERS is moved inside Fidelite for dynamic translations`
);

// Add TIERS definition inside Fidelite component right after useSubscriptionPlan
content = content.replace(
  `const { hasLoyaltyRules, hasBirthdayBonus, getUpgradePlan, plan } = useSubscriptionPlan();`,
  `const { hasLoyaltyRules, hasBirthdayBonus, getUpgradePlan, plan } = useSubscriptionPlan();

  const TIERS = useMemo(() => [
    {
      key: 'nouvelle',
      label: t('loyalty.tier.nouvelle', 'Nouvelle'),
      icon: Heart,
      color: '#a78bfa',
      bg: 'from-violet-500/20 to-purple-500/10',
      border: 'border-violet-400/30',
      badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30',
      minVisits: 0,
      maxVisits: 4,
      description: \`0 – 4 \${t('dashboard.visits', 'visites')}\`,
      tip: t('loyalty.tip.nouvelle', 'Fidélisez-la dès ses premiers soins !'),
    },
    {
      key: 'reguliere',
      label: t('loyalty.tier.reguliere', 'Régulière'),
      icon: Shield,
      color: '#60a5fa',
      bg: 'from-blue-500/20 to-cyan-500/10',
      border: 'border-blue-400/30',
      badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
      minVisits: 5,
      maxVisits: 14,
      description: \`5 – 14 \${t('dashboard.visits', 'visites')}\`,
      tip: t('loyalty.tip.reguliere', 'Bientôt membre du club VIP !'),
    },
    {
      key: 'vip',
      label: t('loyalty.tier.vip', 'VIP ✦'),
      icon: Crown,
      color: '#f59e0b',
      bg: 'from-amber-500/20 to-yellow-500/10',
      border: 'border-amber-400/30',
      badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30 font-bold',
      minVisits: 15,
      maxVisits: Infinity,
      description: \`15+ \${t('dashboard.visits', 'visites')}\`,
      tip: t('loyalty.tip.vip', 'Vos meilleures ambassadrices !'),
    },
  ], [t]);`
);

// Update stats cards labels
content = content.replace(
  `<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Clientes VIP</p>`,
  `<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{t('loyalty.vipClients', 'Clientes VIP')}</p>`
);

content = content.replace(
  `<p className="text-[10px] text-muted-foreground font-semibold">sur {clients.length} clientes</p>`,
  `<p className="text-[10px] text-muted-foreground font-semibold">{t('loyalty.ofClients', 'sur {count} clientes', { count: clients.length })}</p>`
);

content = content.replace(
  `<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Points distribués</p>`,
  `<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{t('loyalty.pointsDistributed', 'Points distribués')}</p>`
);

content = content.replace(
  `<p className="text-[10px] text-muted-foreground font-semibold">au total</p>`,
  `<p className="text-[10px] text-muted-foreground font-semibold">{t('loyalty.total', 'au total')}</p>`
);

content = content.replace(
  `<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Visites totales</p>`,
  `<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{t('loyalty.totalVisits', 'Visites totales')}</p>`
);

content = content.replace(
  `<p className="text-[10px] text-muted-foreground font-semibold">enregistrées</p>`,
  `<p className="text-[10px] text-muted-foreground font-semibold">{t('loyalty.recorded', 'enregistrées')}</p>`
);

content = content.replace(
  `<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Cadeaux prêts</p>`,
  `<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{t('loyalty.giftsReady', 'Cadeaux prêts')}</p>`
);

content = content.replace(
  `<p className="text-[10px] text-emerald-500 font-bold">à offrir</p>`,
  `<p className="text-[10px] text-emerald-500 font-bold">{t('loyalty.toOffer', 'à offrir')}</p>`
);

content = content.replace(
  `Distribution des Niveaux de Fidélité`,
  `{t('loyalty.tierDistribution', 'Distribution des Niveaux de Fidélité')}`
);

content = content.replace(
  `<p className="text-xs text-muted-foreground font-semibold">{pct}% · {tier.description}</p>`,
  `<p className="text-xs text-muted-foreground font-semibold">{pct}% · {tier.description}</p>`
);

content = content.replace(
  `<UpgradePrompt feature={language === 'fr' ? 'Règles de fidélité avancées' : 'Advanced loyalty rules'} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />`,
  `<UpgradePrompt feature={t('loyalty.advancedRules', 'Règles de fidélité avancées')} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />`
);

content = content.replace(
  `{ key: 'progression', label: 'Progression des clientes', icon: TrendingUp },`,
  `{ key: 'progression', label: t('loyalty.progress', 'Progression des clientes'), icon: TrendingUp },`
);

content = content.replace(
  `{ key: 'tiers', label: 'Niveaux & Avantages', icon: Crown },`,
  `{ key: 'tiers', label: t('loyalty.tiersAndBenefits', 'Niveaux & Avantages'), icon: Crown },`
);

content = content.replace(
  `{ key: 'roadmap', label: 'Guide du programme', icon: Target },`,
  `{ key: 'roadmap', label: t('loyalty.programGuide', 'Guide du programme'), icon: Target },`
);

content = content.replace(
  `<span>Progression Fidélité des Clientes</span>`,
  `<span>{t('loyalty.clientLoyaltyProgress', 'Progression Fidélité des Clientes')}</span>`
);

content = content.replace(
  `<p className="font-bold text-foreground">Aucune cliente ne correspond à ces critères</p>`,
  `<p className="font-bold text-foreground">{t('loyalty.noClientsCriteria', 'Aucune cliente ne correspond à ces critères')}</p>`
);

content = content.replace(
  `<p className="text-xs text-muted-foreground">Essayez de modifier votre recherche ou vos filtres</p>`,
  `<p className="text-xs text-muted-foreground">{t('loyalty.tryModifyingSearch', 'Essayez de modifier votre recherche ou vos filtres')}</p>`
);

content = content.replace(
  `<span><strong className="text-foreground">{client.nombreVisites || 0}</strong> visites</span>`,
  `<span><strong className="text-foreground">{client.nombreVisites || 0}</strong> {t('dashboard.visits', 'visites')}</span>`
);

content = content.replace(
  `<span><strong className="text-primary">{client.pointsFidelite || 0}</strong> points accumulés</span>`,
  `<span><strong className="text-primary">{client.pointsFidelite || 0}</strong> {t('loyalty.pointsAccumulated', 'points accumulés')}</span>`
);

content = content.replace(
  `<span>Progression prochain cadeau</span>`,
  `<span>{t('loyalty.nextGiftProgress', 'Progression prochain cadeau')}</span>`
);

content = content.replace(
  `title="Envoyer un rappel de fidélité sur WhatsApp"`,
  `title={t('loyalty.sendWhatsappReminder', 'Envoyer un rappel de fidélité sur WhatsApp')}`
);

content = content.replace(
  `title="Modifier le statut VIP"`,
  `title={t('loyalty.toggleVipStatus', 'Modifier le statut VIP')}`
);

content = content.replace(
  `Fonctionnement du Programme Fidélité`,
  `{t('loyalty.howItWorks', 'Fonctionnement du Programme Fidélité')}`
);

content = content.replace(
  `<h4 className="font-bold text-sm">Prise de rendez-vous / Soin</h4>`,
  `<h4 className="font-bold text-sm">{t('loyalty.step1Title', 'Prise de rendez-vous / Soin')}</h4>`
);

content = content.replace(
  `<p className="text-xs text-muted-foreground leading-relaxed">Chaque soin réalisé rapporte 1 point de fidélité à la cliente.</p>`,
  `<p className="text-xs text-muted-foreground leading-relaxed">{t('loyalty.step1Desc', 'Chaque soin réalisé rapporte 1 point de fidélité à la cliente.')}</p>`
);

content = content.replace(
  `<h4 className="font-bold text-sm">Seuil de Réduction ({visitsReq} visites)</h4>`,
  `<h4 className="font-bold text-sm">{t('loyalty.step2Title', 'Seuil de Réduction')} ({visitsReq} {t('dashboard.visits', 'visites')})</h4>`
);

content = content.replace(
  `<p className="text-xs text-muted-foreground leading-relaxed">Une réduction automatique de -{reductionPct}% est débloquée sur la prochaine facture.</p>`,
  `<p className="text-xs text-muted-foreground leading-relaxed">{t('loyalty.step2Desc', 'Une réduction automatique de -{reductionPct}% est débloquée sur la prochaine facture.')}</p>`
);

content = content.replace(
  `<h4 className="font-bold text-sm">Statut VIP ({vipThreshold}+ visites)</h4>`,
  `<h4 className="font-bold text-sm">{t('loyalty.step3Title', 'Statut VIP')} ({vipThreshold}+ {t('dashboard.visits', 'visites')})</h4>`
);

content = content.replace(
  `<p className="text-xs text-muted-foreground leading-relaxed">Le statut VIP est acquis de façon permanente avec avantages exclusifs.</p>`,
  `<p className="text-xs text-muted-foreground leading-relaxed">{t('loyalty.step3Desc', 'Le statut VIP est acquis de façon permanente avec avantages exclusifs.')}</p>`
);

content = content.replace(
  `Configurer le Programme Fidélité`,
  `{t('loyalty.configTitle', 'Configurer le Programme Fidélité')}`
);

content = content.replace(
  `Modifiez les règles de votre salon pour récompenser vos clientes régulières.`,
  `{t('loyalty.configDesc', 'Modifiez les règles de votre salon pour récompenser vos clientes régulières.')}`
);

content = content.replace(
  `<label className="text-xs font-bold text-foreground">Nombre de visites pour un cadeau / réduction</label>`,
  `<label className="text-xs font-bold text-foreground">{t('loyalty.configVisitsLabel', 'Nombre de visites pour un cadeau / réduction')}</label>`
);

content = content.replace(
  `<p className="text-[11px] text-muted-foreground">Ex: 10 visites pour débloquer une réduction.</p>`,
  `<p className="text-[11px] text-muted-foreground">{t('loyalty.configVisitsHint', 'Ex: 10 visites pour débloquer une réduction.')}</p>`
);

content = content.replace(
  `<label className="text-xs font-bold text-foreground">Pourcentage de réduction offert (%)</label>`,
  `<label className="text-xs font-bold text-foreground">{t('loyalty.configDiscountLabel', 'Pourcentage de réduction offert (%)')}</label>`
);

content = content.replace(
  `<p className="text-[11px] text-muted-foreground">Ex: 10% de réduction offerte.</p>`,
  `<p className="text-[11px] text-muted-foreground">{t('loyalty.configDiscountHint', 'Ex: 10% de réduction offerte.')}</p>`
);

content = content.replace(
  `<label className="text-xs font-bold text-foreground">Nombre de visites pour devenir VIP</label>`,
  `<label className="text-xs font-bold text-foreground">{t('loyalty.configVipLabel', 'Nombre de visites pour devenir VIP')}</label>`
);

content = content.replace(
  `<p className="text-[11px] text-muted-foreground">Ex: 15 visites pour passer automatiquement VIP.</p>`,
  `<p className="text-[11px] text-muted-foreground">{t('loyalty.configVipHint', 'Ex: 15 visites pour passer automatiquement VIP.')}</p>`
);

content = content.replace(
  `<span>Enregistrer les règles</span>`,
  `<span>{t('loyalty.saveRules', 'Enregistrer les règles')}</span>`
);

fs.writeFileSync(file, content);
console.log('Fidelite.tsx updated successfully with full translations');
