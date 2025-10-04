import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from "recharts";

interface MonthlyClosedLeadsChartProps {
  data?: Array<{
    month: string;
    count: number;
    value: number;
  }>;
}

const MonthlyClosedLeadsChart = ({ data = [] }: MonthlyClosedLeadsChartProps) => {
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = (props: any) => {
    const { x, y, value } = props;
    return (
      <text
        x={x}
        y={y - 10}
        fill="hsl(var(--chart-2))"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="600"
      >
        R$ {(value / 1000).toFixed(1)}k
      </text>
    );
  };

  const renderCountLabel = (props: any) => {
    const { x, y, value } = props;
    return (
      <text
        x={x}
        y={y + 20}
        fill="hsl(var(--chart-1))"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="500"
      >
        {value}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{payload[0].payload.month}</p>
          <p className="text-sm text-muted-foreground">
            Leads Fechados: <span className="font-semibold text-[hsl(var(--chart-1))]">{payload[0].value}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Valor Total: <span className="font-semibold text-[hsl(var(--chart-2))]">
              R$ {payload[1].value.toLocaleString('pt-BR')}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recorrência de Vendas Fechadas {new Date().getFullYear()}</CardTitle>
        <CardDescription>
          Histórico mensal até o período atual - Quantidade e Valores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px', fontWeight: 500 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                yAxisId="left"
                stroke="hsl(var(--chart-1))"
                style={{ fontSize: '13px', fontWeight: 500 }}
                label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: 'hsl(var(--muted-foreground))' } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--chart-2))"
                style={{ fontSize: '13px', fontWeight: 500 }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Valor (R$)', angle: 90, position: 'insideRight', style: { fontSize: '12px', fill: 'hsl(var(--muted-foreground))' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                iconType="line"
                wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
                formatter={(value) => {
                  if (value === 'count') return 'Leads Fechados';
                  if (value === 'value') return 'Valor Convertido';
                  return value;
                }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2.5}
                dot={{ fill: 'hsl(var(--chart-1))', r: 6, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
                label={renderCountLabel}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--chart-2))', r: 7, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 9 }}
                label={renderCustomLabel}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total de Leads Fechados</p>
            <p className="text-2xl font-bold text-[hsl(var(--chart-1))]">{totalCount}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Valor Total Convertido</p>
            <p className="text-2xl font-bold text-[hsl(var(--chart-2))]">
              R$ {totalValue.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyClosedLeadsChart;
