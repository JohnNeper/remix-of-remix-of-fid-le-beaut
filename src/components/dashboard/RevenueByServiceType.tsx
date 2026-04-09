import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RevenueByServiceTypeProps {
  data: { nom: string; revenue: number; count: number }[];
}

const COLORS = [
  'hsl(350, 65%, 55%)',
  'hsl(35, 80%, 55%)',
  'hsl(145, 60%, 45%)',
  'hsl(200, 80%, 50%)',
  'hsl(280, 50%, 55%)',
  'hsl(15, 70%, 50%)',
];

const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

export function RevenueByServiceType({ data }: RevenueByServiceTypeProps) {
  if (data.length === 0) {
    return (
      <Card className="card-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Revenus par type de prestation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Aucune donnée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Revenus par type de prestation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="nom" width={100} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [formatFCFA(value), 'Revenu']}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-1.5">
          {data.map((item, i) => (
            <div key={item.nom} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground">{item.nom}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{item.count}x</span>
                <span className="font-semibold">{formatFCFA(item.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
