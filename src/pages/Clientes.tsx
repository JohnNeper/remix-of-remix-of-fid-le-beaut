import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Phone, Calendar, Star, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClients } from '@/hooks/useClients';
import { Client, ClientStatus } from '@/types';
import { ClientForm } from '@/components/clients/ClientForm';
import { ClientDetail } from '@/components/clients/ClientDetail';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { LimitReachedBanner } from '@/components/ui/UpgradePrompt';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';

const statusStyles: Record<ClientStatus, string> = {
  nouvelle: 'bg-muted text-muted-foreground',
  reguliere: 'bg-success/20 text-success',
  vip: 'bg-accent/20 text-accent',
};

export default function Clientes() {
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const { t, language } = useLanguage();

  const statusLabels: Record<ClientStatus, string> = {
    nouvelle: t('clients.nouvelle'),
    reguliere: t('clients.reguliere'),
    vip: t('clients.vip'),
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = 
        client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.telephone.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || client.statut === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const handleAddClient = (data: any) => {
    const parrainId = data.parrainId && data.parrainId !== 'none' ? data.parrainId : undefined;
    const newClient = addClient({ ...data, parrainId });
    // Award bonus points to referrer
    if (parrainId && newClient) {
      updateClient(parrainId, {
        pointsFidelite: (clients.find(c => c.id === parrainId)?.pointsFidelite || 0) + 3,
        filleuls: [...(clients.find(c => c.id === parrainId)?.filleuls || []), newClient.id],
      });
    }
    setShowAddDialog(false);
  };

  const handleEditClient = (data: Partial<Client>) => {
    if (editingClient) {
      updateClient(editingClient.id, data);
      setEditingClient(null);
    }
  };

  const handleDeleteClient = (id: string) => {
    if (confirm(t('clients.deleteConfirm'))) {
      deleteClient(id);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('clients.title')}</h1>
          <p className="text-muted-foreground">{clients.length} {t('clients.registered')}</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          {t('clients.new')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('clients.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            {t('clients.all')}
          </Button>
          {(['nouvelle', 'reguliere', 'vip'] as ClientStatus[]).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {statusLabels[status]}
            </Button>
          ))}
        </div>
      </div>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="card-shadow hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">
                      {client.nom.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{client.nom}</h3>
                    <Badge className={cn('text-xs', statusStyles[client.statut])}>
                      {client.statut === 'vip' && <Star className="h-3 w-3 mr-1" />}
                      {statusLabels[client.statut]}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewingClient(client)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {t('clients.viewDetails')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingClient(client)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {t('clients.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('clients.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{client.telephone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{t('clients.registeredOn')} {new Date(client.dateInscription).toLocaleDateString(language === 'en' ? 'en-GB' : 'fr-FR')}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('clients.visits')}: </span>
                    <span className="font-semibold">{client.nombreVisites}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('clients.points')}: </span>
                    <span className="font-semibold text-primary">{client.pointsFidelite}</span>
                  </div>
                </div>
                {client.parrainId && (
                  <div className="text-xs text-muted-foreground">
                    🤝 Parrainée par <span className="font-medium text-foreground">{clients.find(c => c.id === client.parrainId)?.nom || '—'}</span>
                  </div>
                )}
                {client.filleuls && client.filleuls.length > 0 && (
                  <div className="text-xs">
                    <span className="text-accent font-medium">⭐ {client.filleuls.length} filleul(s)</span>
                    <span className="text-muted-foreground"> • +{client.filleuls.length * 3} pts bonus</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('clients.notFound')}</p>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('clients.new')}</DialogTitle>
          </DialogHeader>
          <ClientForm clients={clients} onSubmit={handleAddClient} onCancel={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('clients.editTitle')}</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <ClientForm 
              client={editingClient}
              clients={clients}
              onSubmit={handleEditClient} 
              onCancel={() => setEditingClient(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingClient} onOpenChange={() => setViewingClient(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingClient && <ClientDetail client={viewingClient} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
