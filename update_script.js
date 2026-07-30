const fs = require('fs');
const file = '/Users/THERENCE/Private/West Digital Hub/beautySpace/remix-of-remix-of-fid-le-beaut/src/components/finances/GlobalCashReport.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add searchQuery and currentPage state
content = content.replace(
  "const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]);",
  `const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;`
);

// 2. Add lucide icons Search, ChevronLeft, ChevronRight if not there
if (!content.includes('Search')) {
  content = content.replace('Calendar, Download', 'Calendar, Download, Search, ChevronLeft, ChevronRight');
}

// 3. Process transactions array
content = content.replace(
  `                {[
                  ...filteredVentes.map(v => ({ id: v.id, date: v.date, type: 'vente' as const, desc: v.items.map(i => i.nom).join(', '), montant: v.totalMontant })),
                  ...filteredDepenses.map(d => ({ id: d.id, date: d.date, type: 'depense' as const, desc: d.description, montant: d.montant })),
                ].sort((a, b) => b.date.localeCompare(a.date)).map(t => (`,
  `                {(() => {
                    const allTransactions = [
                      ...filteredVentes.map(v => ({ id: v.id, date: v.date, type: 'vente' as const, desc: v.items.map(i => i.nom).join(', '), montant: v.totalMontant })),
                      ...filteredDepenses.map(d => ({ id: d.id, date: d.date, type: 'depense' as const, desc: d.description, montant: d.montant })),
                    ].sort((a, b) => b.date.localeCompare(a.date));
                    
                    const searched = allTransactions.filter(t => 
                      t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      new Date(t.date).toLocaleDateString('fr-FR').includes(searchQuery)
                    );
                    
                    const totalPages = Math.ceil(searched.length / itemsPerPage);
                    const paginated = searched.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                    
                    return (
                      <>
                        {paginated.map(t => (`
);

content = content.replace(
  `                  </TableRow>
                ))}
                {nbTransactions === 0 && (`,
  `                  </TableRow>
                ))}
                {searched.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucune transaction trouvée</TableCell>
                  </TableRow>
                )}
                {totalPages > 1 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Page {currentPage} sur {totalPages}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </>
              );
            })()}`
);

// 4. Add search bar UI in CardHeader
content = content.replace(
  `<CardHeader className="pb-2">
          <CardTitle className="text-sm">Détail des transactions</CardTitle>
        </CardHeader>`,
  `<CardHeader className="pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-sm">Détail des transactions</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher (description, date)..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </CardHeader>`
);

fs.writeFileSync(file, content);
console.log('GlobalCashReport updated');
