import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Download, Upload, Trash2, CheckSquare, Square } from "lucide-react";

// ======= Types =======
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
}

interface User {
  email: string;
  senha: string;
  nome: string;
}

// ======= Utils =======
const STORAGE_KEYS = {
  user: "lp_user",
  leads: "lp_leads",
};

const DEFAULT_USERS: User[] = [
  { email: "admin@empresa.com", senha: "1234", nome: "Gestor" },
  { email: "vendedor@empresa.com", senha: "1234", nome: "Vendedor" },
];

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
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
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
  const lines = rows.map((row) =>
    headers
      .map((h) => {
        const val = (row as any)[h] ?? "";
        const s = String(val).replace(/"/g, '""');
        return s.includes(delimiter) || s.includes("\n") ? `"${s}"` : s;
      })
      .join(delimiter)
  );
  return [headerLine, ...lines].join("\n");
}

function fromCSV(text: string, delimiter = ",") {
  const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(delimiter).map((h) => h.trim());
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
    headers.forEach((h, idx) => (obj[h] = row[idx] ?? ""));
    data.push(obj);
  }
  return data;
}

// ======= Component =======
export default function LocalProspector() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [rating, setRating] = useState("");
  const [notas, setNotas] = useState("");

  const [q, setQ] = useState("");
  const [onlyWhats, setOnlyWhats] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem(STORAGE_KEYS.user);
    if (rawUser) setUser(JSON.parse(rawUser));
    setLeads(loadLeads());
  }, []);

  useEffect(() => {
    saveLeads(leads);
  }, [leads]);

  function doLogin(e: React.FormEvent) {
    e.preventDefault();
    const match = DEFAULT_USERS.find(
      (u) => u.email === email.trim() && u.senha === password
    );
    if (!match) {
      toast.error("Usuário ou senha inválidos.");
      return;
    }
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(match));
    setUser(match);
    toast.success(`Bem-vindo, ${match.nome}!`);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.user);
    setUser(null);
    toast.info("Logout realizado");
  }

  function addLead() {
    if (!nome.trim()) return toast.error("Informe o nome");
    if (!telefone.trim()) return toast.error("Informe o telefone");

    const phone = cleanPhoneBR(telefone);
    if (!phone) return toast.error("Telefone inválido");

    if (leads.some((l) => cleanPhoneBR(l.telefone) === phone)) {
      return toast.error("Já existe um lead com este telefone.");
    }

    const lead: Lead = {
      id: uid(),
      nome: nome.trim(),
      telefone: phone,
      cidade: cidade.trim(),
      estado: estado.trim().toUpperCase(),
      rating: Number(rating) || 0,
      notas: notas.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "novo",
    };
    setLeads((prev) => [lead, ...prev]);
    clearForm();
    toast.success("Lead adicionado!");
  }

  function clearForm() {
    setNome("");
    setTelefone("");
    setCidade("");
    setEstado("");
    setRating("");
    setNotas("");
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  }

  function selectAllCurrentPage() {
    paginated.forEach((l) => selectedIds.add(l.id));
    setSelectedIds(new Set(selectedIds));
    toast.info(`${paginated.length} leads selecionados`);
  }

  function clearSelection() {
    setSelectedIds(new Set());
    toast.info("Seleção limpa");
  }

  function updateLead(id: string, patch: Partial<Lead>) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l))
    );
  }

  function deleteLead(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      copy.delete(id);
      return copy;
    });
    toast.success("Lead excluído");
  }

  function markSelectedStatus(status: string) {
    if (!selectedIds.size) return toast.error("Nenhum lead selecionado.");
    setLeads((prev) =>
      prev.map((l) => (selectedIds.has(l.id) ? { ...l, status, updatedAt: new Date().toISOString() } : l))
    );
    toast.success(`${selectedIds.size} leads marcados como ${status}`);
  }

  const filtered = useMemo(() => {
    let f = [...leads];
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      f = f.filter(
        (l) =>
          l.nome.toLowerCase().includes(t) ||
          (l.cidade?.toLowerCase().includes(t)) ||
          (l.estado?.toLowerCase().includes(t)) ||
          (l.telefone?.includes(t)) ||
          (l.notas?.toLowerCase().includes(t))
      );
    }
    if (onlyWhats) {
      f = f.filter((l) => hasValidWhatsapp(l.telefone));
    }
    if (minRating > 0) {
      f = f.filter((l) => (Number(l.rating) || 0) >= minRating);
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
    const rows = leads.filter((l) => selectedIds.has(l.id));
    if (!rows.length) return toast.error("Selecione pelo menos um lead.");
    const csv = toCSV(rows);
    downloadTextFile("leads-selecionados.csv", csv);
    toast.success("CSV selecionados exportado!");
  }

  function exportDisparadorPRO() {
    const rows = leads.filter((l) => selectedIds.has(l.id));
    if (!rows.length) return toast.error("Selecione pelo menos um lead.");
    const header = "Nome;Telefone";
    const lines = rows.map((l) => `${l.nome};${toE164BR(l.telefone)}`);
    const content = [header, ...lines].join("\n");
    downloadTextFile("disparador-pro.csv", content);
    toast.success("Disparador PRO exportado!");
  }

  function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
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
        status: "importado",
      }));

      const byPhone = new Map<string, Lead>();
      [...leads, ...normalized].forEach((l) => {
        const p = cleanPhoneBR(l.telefone);
        if (!p) return;
        if (!byPhone.has(p)) byPhone.set(p, l);
      });
      const merged = Array.from(byPhone.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
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

  if (!user) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Entrar no Local Prospector</CardTitle>
            <CardDescription>Sistema 100% local - dados salvos no navegador</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={doLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="1234"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Entrar
              </Button>
              <p className="text-xs text-muted-foreground">
                Dica: admin@empresa.com / 1234 ou vendedor@empresa.com / 1234
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Local Prospector</h1>
          <p className="text-sm text-muted-foreground">Sistema 100% local - dados salvos no navegador</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.nome}</span>
          <Button onClick={logout} variant="outline" size="sm">
            Sair
          </Button>
        </div>
      </div>

      {/* Novo Lead */}
      <Card>
        <CardHeader>
          <CardTitle>Novo Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" placeholder="(11) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" placeholder="São Paulo" value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado (UF)</Label>
              <Input id="estado" placeholder="SP" value={estado} onChange={(e) => setEstado(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input id="rating" type="number" min="0" max="5" placeholder="0" value={rating} onChange={(e) => setRating(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor="notas">Notas</Label>
              <Input id="notas" placeholder="Observações" value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Button onClick={addLead}>Adicionar Lead</Button>
            <Button onClick={clearForm} variant="outline">Limpar</Button>
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
                <Input
                  id="search"
                  placeholder="Nome, cidade, estado, telefone, notas..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-rating">Rating mínimo</Label>
              <Input
                id="min-rating"
                type="number"
                min="0"
                max="5"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={onlyWhats} onChange={(e) => setOnlyWhats(e.target.checked)} className="rounded border-input" />
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
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
                  <th className="text-left p-3">Rating</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Notas</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((l) => (
                  <tr key={l.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(l.id)}
                        onChange={() => toggleSelect(l.id)}
                        className="rounded border-input"
                      />
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
                      <Input
                        type="number"
                        min={0}
                        max={5}
                        value={l.rating}
                        onChange={(e) => updateLead(l.id, { rating: Number(e.target.value) || 0 })}
                        className="w-20"
                      />
                    </td>
                    <td className="p-3">
                      <Select value={l.status} onValueChange={(value) => updateLead(l.id, { status: value })}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="contatado">Contatado</SelectItem>
                          <SelectItem value="qualificado">Qualificado</SelectItem>
                          <SelectItem value="fechado">Fechado</SelectItem>
                          <SelectItem value="perdido">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <Textarea
                        value={l.notas}
                        onChange={(e) => updateLead(l.id, { notas: e.target.value })}
                        className="min-w-[200px]"
                        rows={2}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <Button onClick={() => deleteLead(l.id)} variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!paginated.length && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Nenhum lead encontrado.
                    </td>
                  </tr>
                )}
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
          <Button
            disabled={normalizedPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            variant="outline"
            size="sm"
          >
            Anterior
          </Button>
          <Button
            disabled={normalizedPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            variant="outline"
            size="sm"
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
