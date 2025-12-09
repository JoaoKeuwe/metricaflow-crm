import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell
} from "recharts";
import { BarChart3 } from "lucide-react";

interface SourceData {
  name: string;
  leads: number;
  converted: number;
  conversionRate: number;
}

interface SourceConversionChartProps {
  data: SourceData[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const leads = payload.find((p: any) => p.dataKey === 'leads')?.value || 0;
  const converted = payload.find((p: any) => p.dataKey === 'converted')?.value || 0;
  const rate = leads > 0 ? ((converted / leads) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white dark:bg-[hsl(0_0%_8%)] border border-[hsl(0_0%_90%)] dark:border-[hsl(0_0%_18%)] rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-medium text-[hsl(0_0%_15%)] dark:text-[hsl(0_0%_90%)] mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[hsl(0_0%_50%)]">Total leads:</span>
          <span className="text-sm font-semibold text-[hsl(330_100%_62%)]">{leads}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[hsl(0_0%_50%)]">Convertidos:</span>
          <span className="text-sm font-semibold text-[hsl(142_70%_40%)]">{converted}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-[hsl(0_0%_90%)]">
          <span className="text-xs text-[hsl(0_0%_50%)]">Taxa:</span>
          <span className="text-sm font-bold text-[hsl(0_0%_15%)] dark:text-[hsl(0_0%_90%)]">{rate}%</span>
        </div>
      </div>
    </div>
  );
};

export const SourceConversionChart = ({ 
  data, 
  title = "Conversão por Fonte" 
}: SourceConversionChartProps) => {
  const getBarColor = (rate: number) => {
    if (rate >= 20) return "hsl(142 70% 45%)";
    if (rate >= 10) return "hsl(330 100% 62%)";
    return "hsl(38 90% 50%)";
  };

  return (
    <div className="rounded-xl bg-white dark:bg-[hsl(0_0%_8%)] border border-[hsl(0_0%_90%)] dark:border-[hsl(0_0%_18%)] overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[hsl(330_100%_62%/0.1)]">
            <BarChart3 className="h-4 w-4 text-[hsl(330_100%_62%)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[hsl(0_0%_8%)] dark:text-[hsl(0_0%_95%)] tracking-wide">
              {title}
            </h3>
            <p className="text-xs text-[hsl(0_0%_50%)] mt-0.5">
              Leads e conversões por origem
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 50% / 0.1)" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} dy={10} angle={-15} textAnchor="end" />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} width={40} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(0 0% 50% / 0.05)' }} />
            <Bar dataKey="leads" name="Leads" radius={[4, 4, 0, 0]} fill="hsl(330 100% 62% / 0.3)" />
            <Bar dataKey="converted" name="Convertidos" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.conversionRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)] flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[hsl(330_100%_62%/0.3)]" />
          <span className="text-xs text-[hsl(0_0%_50%)]">Total Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[hsl(142_70%_45%)]" />
          <span className="text-xs text-[hsl(0_0%_50%)]">Convertidos</span>
        </div>
      </div>
    </div>
  );
};