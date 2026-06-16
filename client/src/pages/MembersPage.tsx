import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Users, FileJson, Trash2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MembersPage() {
  const utils = trpc.useUtils();
  const [jsonText, setJsonText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: members, isLoading: isLoadingMembers } = trpc.members.list.useQuery();

  const uploadMutation = trpc.members.upload.useMutation({
    onSuccess: (data) => {
      toast.success(`Dados carregados com sucesso! ${data.totalMembers} sócios importados`);
      setJsonText("");
      utils.members.list.invalidate();
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(`Erro ao carregar dados: ${error.message}`);
      setIsUploading(false);
    }
  });

  const clearMutation = trpc.members.clear.useMutation({
    onSuccess: () => {
      toast.success("Dados limpos com sucesso");
      utils.members.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao limpar dados: ${error.message}`);
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const content = e.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleUpload = () => {
    try {
      const data = JSON.parse(jsonText);
      setIsUploading(true);
      uploadMutation.mutate(data);
    } catch (error) {
      toast.error("JSON inválido! Verifique o formato");
    }
  };

  const handleClear = () => {
    if (confirm("Tem certeza que quer limpar todos os dados de sócios?")) {
      clearMutation.mutate();
    }
  };

  const exampleJson = JSON.stringify({
    "1": ["VIRGINIA CARNEIRO DE MENDONCA", "THOMAS A. DE MOL VAN OTTERLOO", "Convidado 1", "Convidado 2"],
    "2": ["MARIA SILVA", "JOSE SOUZA"]
  }, null, 2);

  return (
    <div className="space-y-8 md:space-y-12 max-w-[1400px] mx-auto pb-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Sócios</h1>
          <p className="text-muted-foreground">
            Importe e gerencie dados de sócios via arquivo JSON
          </p>
        </div>
      </header>

      <div className="grid gap-6">
        <div>
          <Card className="apple-card-shadow border-0 bg-white dark:bg-slate-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Upload className="h-6 w-6 text-blue-500" />
                Importar Dados
              </CardTitle>
              <CardDescription>
                Cole o JSON ou selecione um arquivo no formato {`{"numeroSocio": ["nome1", "nome2"]}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">JSON</Label>
                <Textarea
                  placeholder={`Exemplo:\n${exampleJson}`}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div>
                  <input
                    type="file"
                    id="file-upload"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    className="rounded-full"
                  >
                    <FileJson className="w-4 h-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !jsonText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                >
                  {isUploading ? "Carregando..." : "Importar Dados"}
                </Button>
                {members && members.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleClear}
                    className="rounded-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Dados
                  </Button>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Formato Esperado:</p>
                    <pre className="mt-2 text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                      {exampleJson}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {members && members.length > 0 && (
          <div>
            <Card className="apple-card-shadow border-0 bg-white dark:bg-slate-950">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-green-500" />
                    <CardTitle>Sócios Importados</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {members.length} Sócios
                  </Badge>
                </div>
                <CardDescription>
                  Lista de todos os sócios e seus convidados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-900">
                        <TableHead>Número</TableHead>
                        <TableHead>Nomes</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-semibold">{member.numeroSocio}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {member.nomes.map((nome, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Badge variant="outline" className="rounded-full">
                                    {idx === 0 ? "Titular" : `Convidado ${idx}`}
                                  </Badge>
                                  <span>{nome}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="rounded-full">{member.nomes.length}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoadingMembers && (!members || members.length === 0) && (
          <div>
            <Card className="apple-card-shadow border-0 bg-white dark:bg-slate-950">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum Sócio Importado</h3>
                <p className="text-muted-foreground">
                  Importe um arquivo JSON para começar
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
