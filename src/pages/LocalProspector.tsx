import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Download, Upload, Trash2, CheckSquare, Square, Sparkles, Brain, Clock, Lightbulb, AlertTriangle } from "lucide-react";

// ======= Types =======
interface LeadAIAnalysis {
  qualityScore: number;
  approachSuggestions: string[];
  bestContactTime: string;
  probableObjections: string[];
  insights: string;
  analyzedAt: string;
}

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  estado: string;
  rating: number;
  notas: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  site?: string;
  vendedor?: string;
  aiAnalysis?: LeadAIAnalysis;
  isAnalyzing?: boolean;
}

// ======= Utils =======
const STORAGE_KEYS = {
  leads: "lp_leads"
};
function loadLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.leads);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erro ao carregar leads:", e);
    return [];
  }
}
function saveLeads(leads: Lead[]) {
  localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads));
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function cleanPhoneBR(phone: string) {
  const digits = ("" + phone).replace(/\D/g, "");
  return digits;
}
function toE164BR(phone: string) {
  const d = cleanPhoneBR(phone);
  if (!d) return "";
  if (d.startsWith("55")) return d;
  return "55" + d;
}
function hasValidWhatsapp(phone: string) {
  const d = cleanPhoneBR(phone);
  return d.length >= 10;
}
function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function toCSV(rows: Lead[], delimiter = ",") {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(delimiter);
  const lines = rows.map(row => headers.map(h => {
    const val = (row as any)[h] ?? "";
    const s = String(val).replace(/"/g, '""');
    return s.includes(delimiter) || s.includes("\n") ? `"${s}"` : s;
  }).join(delimiter));
  return [headerLine, ...lines].join("\n");
}
function fromCSV(text: string, delimiter = ",") {
  const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const data: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let j = 0; j < lines[i].length; j++) {
      const c = lines[i][j];
      if (c === '"') {
        if (inQuotes && lines[i][j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === delimiter && !inQuotes) {
        row.push(current);
        current = "";
      } else {
        current += c;
      }
    }
    row.push(current);
    const obj: any = {};
    headers.forEach((h, idx) => obj[h] = row[idx] ?? "");
    data.push(obj);
  }
  return data;
}

// ======= Component =======
export default function LocalProspector() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [onlyWhats, setOnlyWhats] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [allowNoPhone, setAllowNoPhone] = useState(false);
  const [searchSite, setSearchSite] = useState("");
  const [searchVendedor, setSearchVendedor] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setLeads(loadLeads());
  }, []);
  useEffect(() => {
    saveLeads(leads);
  }, [leads]);
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  }
  function selectAllCurrentPage() {
    paginated.forEach(l => selectedIds.add(l.id));
    setSelectedIds(new Set(selectedIds));
    toast.info(`${paginated.length} leads selecionados`);
  }
  function clearSelection() {
    setSelectedIds(new Set());
    toast.info("Seleção limpa");
  }
  function updateLead(id: string, patch: Partial<Lead>) {
    setLeads(prev => prev.map(l => l.id === id ? {
      ...l,
      ...patch,
      updatedAt: new Date().toISOString()
    } : l));
  }
  function deleteLead(id: string) {
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelectedIds(prev => {
      const copy = new Set(prev);
      copy.delete(id);
      return copy;
    });
    toast.success("Lead excluído");
  }
  function markSelectedStatus(status: string) {
    if (!selectedIds.size) return toast.error("Nenhum lead selecionado.");
    setLeads(prev => prev.map(l => selectedIds.has(l.id) ? {
      ...l,
      status,
      updatedAt: new Date().toISOString()
    } : l));
    toast.success(`${selectedIds.size} leads marcados como ${status}`);
  }
  const filtered = useMemo(() => {
    let f = [...leads];
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      f = f.filter(l => l.nome.toLowerCase().includes(t) || l.cidade?.toLowerCase().includes(t) || l.estado?.toLowerCase().includes(t) || l.telefone?.includes(t) || l.notas?.toLowerCase().includes(t));
    }
    if (onlyWhats) {
      f = f.filter(l => hasValidWhatsapp(l.telefone));
    }
    if (minRating > 0) {
      f = f.filter(l => (Number(l.rating) || 0) >= minRating);
    }
    return f;
  }, [leads, q, onlyWhats, minRating]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const normalizedPage = Math.min(page, totalPages);
  const paginated = filtered.slice((normalizedPage - 1) * pageSize, normalizedPage * pageSize);
  useEffect(() => {
    setPage(1);
  }, [q, onlyWhats, minRating]);
  function exportCSVAll() {
    if (!leads.length) return toast.error("Sem leads para exportar.");
    const csv = toCSV(leads);
    downloadTextFile("leads.csv", csv);
    toast.success("CSV exportado!");
  }
  function exportCSVSelected() {
    const rows = leads.filter(l => selectedIds.has(l.id));
    if (!rows.length) return toast.error("Selecione pelo menos um lead.");
    const csv = toCSV(rows);
    downloadTextFile("leads-selecionados.csv", csv);
    toast.success("CSV selecionados exportado!");
  }
  function exportDisparadorPRO() {
    const rows = leads.filter(l => selectedIds.has(l.id));
    if (!rows.length) return toast.error("Selecione pelo menos um lead.");
    const header = "Nome;Telefone";
    const lines = rows.map(l => `${l.nome};${toE164BR(l.telefone)}`);
    const content = [header, ...lines].join("\n");
    downloadTextFile("disparador-pro.csv", content);
    toast.success("Disparador PRO exportado!");
  }
  function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const text = String(evt.target?.result || "");
      const parsed = fromCSV(text);
      const normalized: Lead[] = parsed.map((r: any) => ({
        id: uid(),
        nome: String(r.nome || r.Nome || r.name || "").trim(),
        telefone: cleanPhoneBR(r.telefone || r.celular || r.phone || r.Telefone || ""),
        cidade: String(r.cidade || r.Cidade || "").trim(),
        estado: String(r.estado || r.uf || r.UF || "").toUpperCase().trim(),
        rating: Number(r.rating || r.Rating || 0) || 0,
        notas: String(r.notas || r.Observacoes || r.obs || "").trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "importado"
      }));
      const byPhone = new Map<string, Lead>();
      [...leads, ...normalized].forEach(l => {
        const p = cleanPhoneBR(l.telefone);
        if (!p) return;
        if (!byPhone.has(p)) byPhone.set(p, l);
      });
      const merged = Array.from(byPhone.values()).sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);
      setLeads(merged);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success(`${normalized.length} registros importados!`);
    };
    reader.readAsText(file, "utf-8");
  }
  function clearAll() {
    setLeads([]);
    setSelectedIds(new Set());
    toast.success("Todos os leads foram apagados");
  }

  async function analyzeLead(leadId: string) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Marcar como analisando
    updateLead(leadId, { isAnalyzing: true });
    toast.info(`Analisando ${lead.nome} com IA...`);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-local-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ lead })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao analisar lead');
      }

      updateLead(leadId, { 
        aiAnalysis: data.analysis,
        isAnalyzing: false,
        rating: data.analysis.qualityScore
      });
      
      toast.success(`✨ ${lead.nome} analisado! Score: ${data.analysis.qualityScore}/100`);
    } catch (error) {
      console.error('Erro ao analisar lead:', error);
      updateLead(leadId, { isAnalyzing: false });
      toast.error(error instanceof Error ? error.message : 'Erro ao analisar lead');
    }
  }

  async function analyzeSelectedLeads() {
    const selected = leads.filter(l => selectedIds.has(l.id));
    if (!selected.length) {
      return toast.error('Selecione pelo menos um lead');
    }

    toast.info(`Analisando ${selected.length} leads com IA...`);
    
    for (const lead of selected) {
      await analyzeLead(lead.id);
      // Delay entre requisições para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Auto-correção simples de typos comuns
  function autoCorrectQuery(query: string): string {
    const corrections: Record<string, string> = {
      "salaod": "salão",
      "salaão": "salão",
      "barberia": "barbearia",
      "bluemnau": "blumenau",
      "blumemau": "blumenau",
      "florianoplis": "florianópolis",
      "curitba": "curitiba"
    };
    let corrected = query;
    for (const [typo, correct] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(typo, "gi"), correct);
    }
    return corrected;
  }
  async function searchLeadsOnline() {
    if (!searchQuery.trim()) {
      return toast.error("Digite o que você quer buscar");
    }
    const correctedQuery = autoCorrectQuery(searchQuery);
    if (correctedQuery !== searchQuery) {
      console.log(`Auto-correção: "${searchQuery}" → "${correctedQuery}"`);
    }
    setIsSearching(true);
    toast.info("Buscando leads no Google Places, LinkedIn e Instagram...");
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          query: correctedQuery
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        const errorMsg = data.error || `Erro ${response.status}: ${response.statusText}`;
        const details = data.details || "";
        console.error("Erro da API:", errorMsg, details);

        // Mensagem específica para erro de autorização
        if (response.status === 403 || errorMsg.includes("403") || errorMsg.includes("Unauthorized")) {
          toast.error("❌ Erro de Autorização do Serper\n\n" + "A chave da API está inválida, expirada ou sem créditos.\n" + "Entre em contato com o suporte para renovar a chave.", {
            duration: 8000
          });
        } else if (data.errors) {
          // Mostrar erros detalhados de cada provedor
          const errorList = Object.entries(data.errors).map(([provider, error]) => `• ${provider}: ${error}`).join("\n");
          toast.error(`Erro ao buscar leads:\n${errorMsg}\n\nDetalhes:\n${errorList}`, {
            duration: 8000
          });
        } else {
          toast.error(`Erro ao buscar leads:\n${errorMsg}${details ? `\n${details}` : ""}`, {
            duration: 6000
          });
        }
        return;
      }
      console.log("Leads encontrados:", data.leads);

      // Se houve erros parciais mas ainda temos resultados
      if (data.errors) {
        console.warn("Alguns provedores falharam:", data.errors);
      }

      // Estatísticas
      let withPhone = 0;
      let withoutPhone = 0;
      let addedCount = 0;
      let duplicates = 0;
      for (const foundLead of data.leads) {
        const phone = cleanPhoneBR(foundLead.telefone);
        if (phone) {
          withPhone++;
          // Verifica duplicatas por telefone
          if (leads.some(l => cleanPhoneBR(l.telefone) === phone)) {
            duplicates++;
            continue;
          }
        } else {
          withoutPhone++;
          // Se não permite sem telefone, pula
          if (!allowNoPhone) continue;

          // Verifica duplicatas por link + nome
          const isDuplicate = leads.some(l => l.notas.includes(foundLead.link || "") && l.nome.toLowerCase() === foundLead.nome.toLowerCase());
          if (isDuplicate) {
            duplicates++;
            continue;
          }
        }
        const newLead: Lead = {
          id: uid(),
          nome: foundLead.nome || "Lead sem nome",
          telefone: phone,
          cidade: foundLead.cidade || "",
          estado: foundLead.estado || "",
          rating: 0,
          notas: `Fonte: ${foundLead.source}\n${foundLead.snippet || ""}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: phone ? "novo" : "incompleto",
          site: searchSite || foundLead.website || foundLead.link || "",
          vendedor: searchVendedor
        };
        setLeads(prev => [newLead, ...prev]);
        addedCount++;
      }

      // Resumo detalhado
      const totalFound = data.leads.length;
      console.log(`Resumo: Total=${totalFound} | Com tel=${withPhone} | Sem tel=${withoutPhone} | Adicionados=${addedCount} | Duplicados=${duplicates}`);
      if (addedCount === 0) {
        toast.warning(`${totalFound} leads encontrados, mas nenhum novo foi adicionado.\n` + `${duplicates} duplicados ignorados.` + (withoutPhone > 0 && !allowNoPhone ? `\n${withoutPhone} sem telefone (ative a opção para importar).` : ""));
      } else {
        toast.success(`${addedCount} leads adicionados!\n` + `Total encontrado: ${totalFound} | Com telefone: ${withPhone} | Sem telefone: ${withoutPhone}` + (duplicates > 0 ? `\n${duplicates} duplicados ignorados` : ""));
      }
      setSearchQuery("");
      setSearchSite("");
      setSearchVendedor("");
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao buscar leads");
    } finally {
      setIsSearching(false);
    }
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Local Prospector</h1>
          <p className="text-sm text-muted-foreground">Sistema 100% local - dados salvos no navegador</p>
        </div>
      </div>

      {/* Busca Automática de Leads */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Buscar Leads Automaticamente
          </CardTitle>
          <CardDescription>Digite o tipo de negócio e localização (ex: "salão de beleza blumenau") e encontraremos leads no Google.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input placeholder="Ex: salão de beleza blumenau" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchLeadsOnline()} disabled={isSearching} />
              </div>
              <Button onClick={searchLeadsOnline} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? <>
                    <Search className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </> : <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Buscar Leads
                  </>}
              </Button>
            </div>
            
            
            
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={allowNoPhone} onChange={e => setAllowNoPhone(e.target.checked)} className="rounded border-input" disabled={isSearching} />
              Importar resultados sem telefone (LinkedIn/Instagram - permitir completar depois)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros & Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="search" placeholder="Nome, cidade, estado, telefone, notas..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-rating">Rating mínimo</Label>
              <Input id="min-rating" type="number" min="0" max="5" value={minRating} onChange={e => setMinRating(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={onlyWhats} onChange={e => setOnlyWhats(e.target.checked)} className="rounded border-input" />
              Somente WhatsApp válido
            </label>
            <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
              <span>Exibindo {paginated.length} de {filtered.length}</span>
              <Badge variant="secondary">{leads.length} total</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import/Export */}
      <Card>
        <CardHeader>
          <CardTitle>Importar / Exportar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={exportCSVAll} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV (todos)
            </Button>
            <Button onClick={exportCSVSelected} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV (selecionados)
            </Button>
            <Button onClick={exportDisparadorPRO} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Disparador PRO
            </Button>
            <div className="relative">
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Importar CSV
              </Button>
            </div>
            <Button onClick={clearAll} variant="destructive" size="sm" className="ml-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar todos
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            CSV com cabeçalhos: nome, telefone, cidade, estado, rating, notas
          </p>
        </CardContent>
      </Card>

      {/* Ações em massa */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={selectAllCurrentPage} variant="outline" size="sm">
          <CheckSquare className="h-4 w-4 mr-2" />
          Selecionar página
        </Button>
        <Button onClick={clearSelection} variant="outline" size="sm">
          <Square className="h-4 w-4 mr-2" />
          Limpar seleção
        </Button>
        <Button onClick={analyzeSelectedLeads} variant="default" size="sm" className="bg-primary">
          <Brain className="h-4 w-4 mr-2" />
          Analisar com IA
        </Button>
        <Button onClick={() => markSelectedStatus("contatado")} variant="outline" size="sm">
          Marcar Contatado
        </Button>
        <Button onClick={() => markSelectedStatus("qualificado")} variant="outline" size="sm">
          Marcar Qualificado
        </Button>
        <Badge variant="secondary" className="ml-auto">
          {selectedIds.size} selecionados
        </Badge>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 w-10">Sel</th>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Telefone</th>
                  <th className="text-left p-3">Cidade</th>
                  <th className="text-left p-3">UF</th>
                  <th className="text-left p-3">Site</th>
                  <th className="text-left p-3">Vendedor</th>
                  <th className="text-left p-3">Score/IA</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Notas</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(l => <tr key={l.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedIds.has(l.id)} onChange={() => toggleSelect(l.id)} className="rounded border-input" />
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{l.nome}</div>
                      <div className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-3">
                      <div>{l.telefone}</div>
                      <Badge variant={hasValidWhatsapp(l.telefone) ? "default" : "secondary"} className="text-xs mt-1">
                        {hasValidWhatsapp(l.telefone) ? "WhatsApp" : "Inválido"}
                      </Badge>
                    </td>
                    <td className="p-3">{l.cidade}</td>
                    <td className="p-3">{l.estado}</td>
                    <td className="p-3">
                      {l.site ? <a href={l.site.startsWith('http') ? l.site : `https://${l.site}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                          Visitar Site
                        </a> : <span className="text-muted-foreground text-xs">-</span>}
                    </td>
                    <td className="p-3">
                      <Select value={l.vendedor || "none"} onValueChange={val => updateLead(l.id, {
                    vendedor: val === "none" ? "" : val
                  })}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Sem vendedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem vendedor</SelectItem>
                          <SelectItem value="João Silva">João Silva</SelectItem>
                          <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                          <SelectItem value="Pedro Costa">Pedro Costa</SelectItem>
                          <SelectItem value="Ana Lima">Ana Lima</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Badge variant={l.rating >= 80 ? "default" : l.rating >= 50 ? "secondary" : "outline"}>
                            {l.rating}/100
                          </Badge>
                          {l.aiAnalysis && (
                            <span className="text-xs text-primary font-medium flex items-center gap-1">
                              <Brain className="h-3 w-3" /> IA
                            </span>
                          )}
                          {l.isAnalyzing && (
                            <span className="text-xs text-muted-foreground animate-pulse">Analisando...</span>
                          )}
                        </div>
                        {l.aiAnalysis && (
                          <div className="space-y-1 text-xs">
                            <div className="flex items-start gap-1">
                              <Clock className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">{l.aiAnalysis.bestContactTime}</span>
                            </div>
                            {l.aiAnalysis.approachSuggestions[0] && (
                              <div className="flex items-start gap-1">
                                <Lightbulb className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                                <span className="line-clamp-2">{l.aiAnalysis.approachSuggestions[0]}</span>
                              </div>
                            )}
                            {l.aiAnalysis.probableObjections[0] && (
                              <div className="flex items-start gap-1">
                                <AlertTriangle className="h-3 w-3 mt-0.5 text-orange-500 flex-shrink-0" />
                                <span className="text-muted-foreground line-clamp-1">{l.aiAnalysis.probableObjections[0]}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Select value={l.status} onValueChange={value => updateLead(l.id, {
                    status: value
                  })}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="incompleto">Incompleto</SelectItem>
                          <SelectItem value="contatado">Contatado</SelectItem>
                          <SelectItem value="qualificado">Qualificado</SelectItem>
                          <SelectItem value="fechado">Fechado</SelectItem>
                          <SelectItem value="perdido">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <Textarea value={l.notas} onChange={e => updateLead(l.id, {
                    notas: e.target.value
                  })} className="min-w-[200px]" rows={2} />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          onClick={() => analyzeLead(l.id)} 
                          disabled={l.isAnalyzing}
                          variant="ghost" 
                          size="sm"
                          title="Analisar com IA"
                        >
                          <Brain className={`h-4 w-4 ${l.isAnalyzing ? 'animate-pulse text-primary' : ''}`} />
                        </Button>
                        <Button onClick={() => deleteLead(l.id)} variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>)}
                {!paginated.length && <tr>
                    <td colSpan={11} className="p-8 text-center text-muted-foreground">
                      Nenhum lead encontrado.
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Página {normalizedPage} de {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button disabled={normalizedPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} variant="outline" size="sm">
            Anterior
          </Button>
          <Button disabled={normalizedPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} variant="outline" size="sm">
            Próxima
          </Button>
        </div>
      </div>
    </div>;
}