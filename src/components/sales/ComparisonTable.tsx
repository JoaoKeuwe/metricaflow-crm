import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

const comparisons = [
  {
    feature: "Preço Acessível",
    workflow360: true,
    excel: true,
    others: false,
  },
  {
    feature: "Fácil de Usar",
    workflow360: true,
    excel: false,
    others: "partial",
  },
  {
    feature: "Gamificação Incluída",
    workflow360: true,
    excel: false,
    others: false,
  },
  {
    feature: "Manual do Vendedor Automático",
    workflow360: true,
    excel: false,
    others: false,
  },
  {
    feature: "Relatórios com IA",
    workflow360: true,
    excel: false,
    others: "partial",
  },
  {
    feature: "Dashboard em Tempo Real",
    workflow360: true,
    excel: false,
    others: true,
  },
  {
    feature: "Suporte em Português",
    workflow360: true,
    excel: false,
    others: "partial",
  },
  {
    feature: "Agenda Integrada",
    workflow360: true,
    excel: false,
    others: true,
  },
  {
    feature: "WhatsApp Integrado",
    workflow360: true,
    excel: false,
    others: "partial",
  },
  {
    feature: "Setup Rápido (< 5 min)",
    workflow360: true,
    excel: true,
    others: false,
  },
];

const StatusIcon = ({ status }: { status: boolean | string }) => {
  if (status === true) {
    return (
      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
        <Check className="w-4 h-4 text-green-500" />
      </div>
    );
  }
  if (status === false) {
    return (
      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20">
        <X className="w-4 h-4 text-red-500" />
      </div>
    );
  }
  return (
    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20">
      <Minus className="w-4 h-4 text-yellow-500" />
    </div>
  );
};

export const ComparisonTable = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Comparativo
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Por que escolher o{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              WorkFlow360
            </span>
            ?
          </h2>
          <p className="text-lg text-muted-foreground">
            Veja como nos comparamos com outras soluções do mercado.
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-2xl border border-border/50 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 border-b border-border/50">
              <div className="text-sm font-medium text-muted-foreground">Recurso</div>
              <div className="text-center">
                <div className="font-bold text-primary">WorkFlow360</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Excel/Planilhas</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Outros CRMs</div>
              </div>
            </div>

            {/* Table Body */}
            {comparisons.map((row, index) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 gap-4 p-4 items-center ${
                  index % 2 === 0 ? "bg-card/30" : "bg-transparent"
                } ${index < comparisons.length - 1 ? "border-b border-border/30" : ""}`}
              >
                <div className="text-sm text-foreground">{row.feature}</div>
                <div className="text-center">
                  <StatusIcon status={row.workflow360} />
                </div>
                <div className="text-center">
                  <StatusIcon status={row.excel} />
                </div>
                <div className="text-center">
                  <StatusIcon status={row.others} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
