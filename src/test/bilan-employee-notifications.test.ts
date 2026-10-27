import { describe, it, expect } from 'vitest';

describe('Notification Destination Routing', () => {
  function getNotificationDestination(notif: { id: string; type?: string; title?: string; description?: string }) {
    const type = notif.type || '';
    const titleLower = (notif.title || '').toLowerCase();
    const descLower = (notif.description || '').toLowerCase();
    const combined = `${titleLower} ${descLower}`;

    if (
      type === 'stock' ||
      notif.id.startsWith('stock-') ||
      combined.includes('stock') ||
      combined.includes('rupture') ||
      combined.includes('produit')
    ) {
      return { path: '/stock', label: 'Accéder au Stock' };
    }
    if (
      type === 'rdv' ||
      type === 'booking' ||
      notif.id.startsWith('rdv') ||
      combined.includes('rendez-vous') ||
      combined.includes('rdv') ||
      combined.includes('réservation') ||
      combined.includes('planning') ||
      combined.includes('créneau')
    ) {
      return { path: '/rendez-vous', label: 'Consulter le Planning' };
    }
    if (
      type === 'inactive' ||
      notif.id.startsWith('inactive') ||
      combined.includes('relance') ||
      combined.includes('inactiv') ||
      combined.includes('rappel') ||
      combined.includes('cliente')
    ) {
      return { path: '/rappels', label: 'Relancer les Clientes' };
    }
    if (
      type === 'paiement' ||
      type === 'vente' ||
      combined.includes('vente') ||
      combined.includes('factur') ||
      combined.includes('bilan') ||
      combined.includes('chiffre')
    ) {
      return { path: '/bilan', label: 'Voir le Bilan Boss' };
    }
    return { path: '/rendez-vous', label: 'Consulter' };
  }

  it('routes stock notifications directly to /stock', () => {
    const res = getNotificationDestination({
      id: 'stock-prod123',
      type: 'stock',
      title: 'Alerte Stock : Huile d\'argan',
      description: 'Plus que 2 unités restantes',
    });
    expect(res.path).toBe('/stock');
  });

  it('routes appointment notifications directly to /rendez-vous', () => {
    const res = getNotificationDestination({
      id: 'rdv-today',
      type: 'rdv',
      title: '3 Rendez-vous prévus aujourd\'hui',
      description: 'Consultez votre planning pour organiser la journée',
    });
    expect(res.path).toBe('/rendez-vous');
  });

  it('routes inactive clients notifications directly to /rappels', () => {
    const res = getNotificationDestination({
      id: 'inactive-clients',
      type: 'inactive',
      title: '5 Clientes à relancer',
      description: 'Aucune visite depuis plus de 30 jours',
    });
    expect(res.path).toBe('/rappels');
  });
});

describe('Staff Employee Resolution in Bilan Boss', () => {
  const mockStaff = [
    { _id: '65f011112222333344445555', id: '65f011112222333344445555', name: 'Moussa Diop', role: 'Coiffeur Senior' },
    { _id: '65f022223333444455556666', id: '65f022223333444455556666', name: 'Aminata Touré', role: 'Esthéticienne' },
  ];

  const session = {
    userId: '65f099998888777766665555',
    userName: 'Therence Boss',
    userRole: 'owner',
  };

  function resolveStaffMember(
    rawEmp: any,
    fallbackNom?: string,
    notes?: string
  ): { id: string; name: string; role: string } {
    let cleanFallback = fallbackNom?.trim();
    if (cleanFallback && /^[0-9a-fA-F]{24}$/.test(cleanFallback)) {
      cleanFallback = undefined;
    }

    let rawId = '';
    let rawName = '';
    if (rawEmp && typeof rawEmp === 'object') {
      rawId = String(rawEmp._id || rawEmp.id || '');
      rawName = rawEmp.name || rawEmp.nom || rawEmp.email || '';
    } else if (rawEmp) {
      rawId = String(rawEmp);
      rawName = String(rawEmp);
    }

    if ((!rawName || /^[0-9a-fA-F]{24}$/.test(rawName)) && notes) {
      const match = notes.match(/En charge:\s*([^).,]+)/i);
      if (match && match[1]?.trim()) {
        cleanFallback = match[1].trim();
      }
    }

    const foundStaff = mockStaff.find(s =>
      (rawId && (s.id === rawId || s._id === rawId)) ||
      (rawName && s.name.toLowerCase() === rawName.toLowerCase())
    );

    if (foundStaff) {
      return {
        id: foundStaff._id,
        name: foundStaff.name,
        role: foundStaff.role,
      };
    }

    if (session.userId && (rawId === session.userId || rawName === session.userId)) {
      return {
        id: session.userId,
        name: session.userName,
        role: 'Propriétaire',
      };
    }

    if (cleanFallback) {
      return {
        id: rawId || cleanFallback,
        name: cleanFallback,
        role: 'Collaborateur',
      };
    }

    if (rawName && !/^[0-9a-fA-F]{24}$/.test(rawName)) {
      return {
        id: rawId || rawName,
        name: rawName,
        role: 'Collaborateur',
      };
    }

    return {
      id: rawId || 'unassigned',
      name: 'Collaborateur',
      role: 'Collaborateur',
    };
  }

  it('correctly resolves registered staff member name from ID', () => {
    const res = resolveStaffMember('65f011112222333344445555');
    expect(res.name).toBe('Moussa Diop');
    expect(res.role).toBe('Coiffeur Senior');
  });

  it('correctly resolves Boss / Owner from session ID and never displays raw hex string', () => {
    const res = resolveStaffMember('65f099998888777766665555');
    expect(res.name).toBe('Therence Boss');
    expect(res.role).toBe('Propriétaire');
    expect(res.name).not.toMatch(/^[0-9a-fA-F]{24}$/);
  });

  it('resolves employee snapshot name passed via employeNom fallback', () => {
    const res = resolveStaffMember('unknown-id-1234567890abcdef', 'Sarah Barbershop');
    expect(res.name).toBe('Sarah Barbershop');
  });

  it('extracts employee name from validation notes when ID is unknown', () => {
    const notes = 'Facturation RDV #RDV-2026 (1 pers. - En charge: Kévin Styliste). Règlement comptant.';
    const res = resolveStaffMember('65f0aaaaaaaaaaaaaaaaaaaa', undefined, notes);
    expect(res.name).toBe('Kévin Styliste');
  });
});
