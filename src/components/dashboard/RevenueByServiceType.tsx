import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface RevenueByServiceTypeProps {
  data: { nom: string; revenue: number; count: number }[];
}

const COLORS = [
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

export function RevenueByServiceType({ data }: RevenueByServiceTypeProps) {
  const { t } = useLanguage();

  if (data.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900 transition-all">
        <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
            <BarChart2 className="h-4.5 w-4.5 text-rose-500" />
            <span>{t('revenueChart.title') || "Revenus par type de prestation"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 pb-4">
          <div className="text-center py-6">
            <DollarSign className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('revenueChart.noData') || "Aucune donnée disponible ce mois"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900 transition-all">
      <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
        <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
          <BarChart2 className="h-4.5 w-4.5 text-rose-500" />
          <span>{t('revenueChart.title') || "Revenus par type de prestation"}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 pb-4">
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: -10, right: 15, top: 5, bottom: 5 }}>
              <XAxis 
                type="number" 
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                stroke="currentColor"
                className="text-[11px] fill-slate-400 font-medium"
              />
              <YAxis 
                type="category" 
                dataKey="nom" 
                width={100} 
                stroke="currentColor"
                className="text-[11px] fill-slate-700 dark:fill-slate-300 font-bold"
              />
              <Tooltip
                formatter={(value: number) => [formatFCFA(value), t('revenueChart.revenue') || 'Revenu']}
                contentStyle={{ 
                  borderRadius: '16px', 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(51, 65, 85, 0.8)',
                  color: '#ffffff',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              />
              <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {data.map((item, i) => (
            <div key={item.nom} className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.nom}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-bold">{item.count}x</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{formatFCFA(item.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
