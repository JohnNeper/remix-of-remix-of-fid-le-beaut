const fs = require('fs');
const file = '/Users/THERENCE/Private/West Digital Hub/beautySpace/remix-of-remix-of-fid-le-beaut/src/pages/Finances.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add lucide imports
content = content.replace(
  "LayoutList, CheckCircle2 } from 'lucide-react';",
  "LayoutList, CheckCircle2, Search, ChevronLeft, ChevronRight } from 'lucide-react';"
);

// Add state variables
content = content.replace(
  "const isMobile = useIsMobile();",
  `const isMobile = useIsMobile();
  const [searchVentes, setSearchVentes] = useState('');
  const [pageVentes, setPageVentes] = useState(1);
  const [searchDepenses, setSearchDepenses] = useState('');
  const [pageDepenses, setPageDepenses] = useState(1);
  const itemsPerPage = 10;`
);

// Add filtering logic
const getClientNameBlock = `  const modePaiementLabels: Record<string, string> = {`;
content = content.replace(
  getClientNameBlock,
  `  const getClientText = (clientId?: any) => {
    if (!clientId) return t('finances.anonymousClient') || 'Client anonyme';
    const targetId = typeof clientId === 'object' ? (clientId._id || clientId.id) : clientId;
    const client = clients.find(c => (c as any)._id === targetId || c.id === targetId);
    return client?.nom || (typeof clientId === 'object' ? (clientId.nom || clientId.name) : (t('finances.anonymousClient') || 'Client anonyme'));
  };

  const processedVentes = ventes
    .filter(v => {
      const cName = getClientText(v.clientId);
      const term = searchVentes.toLowerCase();
      return (
        v.items.some(i => i.nom.toLowerCase().includes(term)) ||
        cName.toLowerCase().includes(term) ||
        formatDate(v.date).toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const paginatedVentes = processedVentes.slice((pageVentes - 1) * itemsPerPage, pageVentes * itemsPerPage);
  const totalPagesVentes = Math.ceil(processedVentes.length / itemsPerPage);

  const processedDepenses = depenses
    .filter(d => {
      const term = searchDepenses.toLowerCase();
      return (
        d.description.toLowerCase().includes(term) ||
        (t(\`finances.categories.\${d.categorie}\`) || '').toLowerCase().includes(term) ||
        formatDate(d.date).toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const paginatedDepenses = processedDepenses.slice((pageDepenses - 1) * itemsPerPage, pageDepenses * itemsPerPage);
  const totalPagesDepenses = Math.ceil(processedDepenses.length / itemsPerPage);

  const modePaiementLabels: Record<string, string> = {`
);

// TabsContent VENTES
content = content.replace(
  /<TabsContent value="ventes" className="mt-6 outline-none">([\s\S]*?)<\/TabsContent>/,
  `<TabsContent value="ventes" className="mt-6 outline-none">
          <div className="mb-4 relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('finances.searchSale') || 'Rechercher une vente...'} className="pl-9 h-10 bg-card border-none shadow-sm rounded-xl" value={searchVentes} onChange={e => { setSearchVentes(e.target.value); setPageVentes(1); }} />
          </div>
          <div className="hidden sm:block">
            <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold min-w-[100px]">{t('finances.date')}</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">{t('finances.client')}</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">{t('finances.articles')}</TableHead>
                    <TableHead className="font-semibold min-w-[100px]">{t('finances.payment')}</TableHead>
                    <TableHead className="text-right font-semibold min-w-[100px]">{t('finances.amount')}</TableHead>
                    <TableHead className="text-right font-semibold w-[80px]">{t('finances.invoice')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedVentes.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('finances.noSales') || 'Aucune vente enregistrée.'}</TableCell></TableRow>}
                  {paginatedVentes.map(v => (
                    <TableRow key={v.id} className="border-border/50">
                      <TableCell className="whitespace-nowrap font-medium text-muted-foreground">{formatDate(v.date)}</TableCell>
                      <TableCell className="font-bold whitespace-nowrap">{getClientName(v.clientId)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm font-medium">{v.items.map(item => item.nom).join(', ')}</TableCell>
                      <TableCell><Badge variant="secondary" className="whitespace-nowrap rounded-lg bg-muted/50">{t(modePaiementLabels[v.modePaiement])}</Badge></TableCell>
                      <TableCell className="text-right font-bold text-primary whitespace-nowrap">{formatCurrency(v.totalMontant)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-primary/10" onClick={() => setInvoiceVente(v)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteVenteTarget(v)} title={t('common.delete') || 'Supprimer'}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPagesVentes > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">{t('common.page') || 'Page'} {pageVentes} {t('common.of') || 'sur'} {totalPagesVentes}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPageVentes(p => Math.max(1, p - 1))} disabled={pageVentes === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPageVentes(p => Math.min(totalPagesVentes, p + 1))} disabled={pageVentes === totalPagesVentes}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="sm:hidden flex flex-col gap-3">
            {processedVentes.length === 0 && <div className="text-center py-8 text-muted-foreground">{t('finances.noSales') || 'Aucune vente enregistrée.'}</div>}
            {paginatedVentes.map(v => (
              <TransactionCard key={v.id} item={v} type="vente" getClientName={getClientName} formatDate={formatDate} formatCurrency={formatCurrency} setInvoiceVente={setInvoiceVente} setDeleteVenteTarget={setDeleteVenteTarget} isOwner={isOwner} modePaiementLabels={modePaiementLabels} t={t} />
            ))}
            {totalPagesVentes > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">{t('common.page') || 'Page'} {pageVentes} {t('common.of') || 'sur'} {totalPagesVentes}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPageVentes(p => Math.max(1, p - 1))} disabled={pageVentes === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPageVentes(p => Math.min(totalPagesVentes, p + 1))} disabled={pageVentes === totalPagesVentes}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>`
);

// TabsContent DEPENSES
content = content.replace(
  /<TabsContent value="depenses" className="mt-6 outline-none">([\s\S]*?)<\/TabsContent>/,
  `<TabsContent value="depenses" className="mt-6 outline-none">
          <div className="mb-4 relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('finances.searchExpense') || 'Rechercher une dépense...'} className="pl-9 h-10 bg-card border-none shadow-sm rounded-xl" value={searchDepenses} onChange={e => { setSearchDepenses(e.target.value); setPageDepenses(1); }} />
          </div>
          <div className="hidden sm:block">
            <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold min-w-[100px]">{t('finances.date')}</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">{t('finances.category')}</TableHead>
                    <TableHead className="font-semibold min-w-[150px]">{t('finances.description')}</TableHead>
                    <TableHead className="text-right font-semibold min-w-[100px]">{t('finances.amount')}</TableHead>
                    {isOwner && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedDepenses.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('finances.noExpenses') || 'Aucune dépense enregistrée.'}</TableCell></TableRow>}
                  {paginatedDepenses.map(d => (
                    <TableRow key={d.id} className="border-border/50">
                      <TableCell className="whitespace-nowrap font-medium text-muted-foreground">{formatDate(d.date)}</TableCell>
                      <TableCell className="whitespace-nowrap"><Badge variant="outline" className="rounded-lg bg-background border-border/50">{t(\`finances.categories.\${d.categorie}\`)}</Badge></TableCell>
                      <TableCell className="max-w-[300px] truncate font-medium">{d.description}</TableCell>
                      <TableCell className="text-right font-bold text-destructive whitespace-nowrap">-{formatCurrency(d.montant)}</TableCell>
                      {isOwner && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteDepenseTarget(d)} title={t('common.delete') || 'Supprimer'}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPagesDepenses > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">{t('common.page') || 'Page'} {pageDepenses} {t('common.of') || 'sur'} {totalPagesDepenses}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPageDepenses(p => Math.max(1, p - 1))} disabled={pageDepenses === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPageDepenses(p => Math.min(totalPagesDepenses, p + 1))} disabled={pageDepenses === totalPagesDepenses}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="sm:hidden flex flex-col gap-3">
            {processedDepenses.length === 0 && <div className="text-center py-8 text-muted-foreground">{t('finances.noExpenses') || 'Aucune dépense enregistrée.'}</div>}
            {paginatedDepenses.map(d => (
              <TransactionCard key={d.id} item={d} type="depense" getClientName={getClientName} formatDate={formatDate} formatCurrency={formatCurrency} setDeleteDepenseTarget={setDeleteDepenseTarget} isOwner={isOwner} t={t} />
            ))}
            {totalPagesDepenses > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">{t('common.page') || 'Page'} {pageDepenses} {t('common.of') || 'sur'} {totalPagesDepenses}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPageDepenses(p => Math.max(1, p - 1))} disabled={pageDepenses === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPageDepenses(p => Math.min(totalPagesDepenses, p + 1))} disabled={pageDepenses === totalPagesDepenses}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>`
);

fs.writeFileSync(file, content);
console.log('Finances.tsx updated successfully');
