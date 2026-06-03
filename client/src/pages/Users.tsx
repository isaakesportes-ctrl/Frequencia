import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, User, Mail, ShieldAlert, Users, Plus, Edit, Trash2, Key, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ScrollArea } from "@/components/ui/scroll-area";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const utils = trpc.useUtils();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: number; name: string; password?: string; role: "user" | "admin" | "monitor" } | null>(null);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin" | "monitor">("user");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", role: "user" as "user" | "admin" | "monitor" });

  const { data: users, isLoading } = trpc.users.list.useQuery();
  
  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso");
      setIsCreateOpen(false);
      setFormData({ name: "", role: "user" });
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    }
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário removido com sucesso");
      utils.users.list.invalidate();
    }
  });

  const updatePasswordMutation = trpc.users.updatePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso");
      setEditingUser(null);
      setNewPassword("");
      utils.users.list.invalidate();
      utils.professores.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar senha: ${error.message}`);
    }
  });

  const updateNameMutation = trpc.users.updateName.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      utils.professores.list.invalidate();
      utils.aulas.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar nome: ${error.message}`);
    }
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar cargo: ${error.message}`);
    }
  });

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      let changed = false;
      if (newName && newName !== editingUser.name) {
        await updateNameMutation.mutateAsync({ id: editingUser.id, name: newName });
        changed = true;
      }
      if (newPassword && newPassword !== editingUser.password) {
        await updatePasswordMutation.mutateAsync({ id: editingUser.id, password: newPassword });
        changed = true;
      }
      if (newRole && newRole !== editingUser.role) {
        await updateRoleMutation.mutateAsync({ id: editingUser.id, role: newRole });
        changed = true;
      }
      
      if (changed) {
        toast.success("Usuário atualizado com sucesso");
        setEditingUser(null);
      }
    } catch (e) {
      // Erros já tratados nos callbacks
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 max-w-[1400px] mx-auto pb-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Equipe
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-xl text-slate-500 font-medium tracking-tight"
          >
            Gerencie os níveis de acesso e as permissões dos colaboradores.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black hover:opacity-90 rounded-full px-8 py-4 text-base font-heavy apple-card-shadow transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Usuário
          </Button>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:gap-8">
        <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">Colaboradores</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-8 pt-0">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="min-w-full inline-block align-middle">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-32 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
                    ))
                  ) : users?.map((user: any) => (
                    <motion.div 
                      key={user.id}
                      variants={item}
                      initial="hidden"
                      animate="show"
                    >
                      <Card className="border-0 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-[2rem] transition-all duration-300 group border border-transparent hover:border-slate-100 dark:hover:border-slate-700 apple-card-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center font-black text-blue-600 shadow-sm shrink-0">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-heavy text-base md:text-lg text-slate-900 dark:text-white truncate leading-tight">{user.name}</span>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {user.id === 1 ? (
                                    <Badge className="bg-blue-600 text-white border-0 font-black px-2 py-0.5 text-[8px] uppercase tracking-widest">
                                      MASTER
                                    </Badge>
                                  ) : user.role === "monitor" || (user.id >= 1000 && user.role === "monitor") ? (
                                    <Badge className="bg-orange-600 text-white border-0 font-black px-2 py-0.5 text-[8px] uppercase tracking-widest">
                                      MONITOR
                                    </Badge>
                                  ) : user.id >= 1000 || user.role === "user" ? (
                                    <Badge className="bg-emerald-600 text-white border-0 font-black px-2 py-0.5 text-[8px] uppercase tracking-widest">
                                      PROFESSOR
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-slate-500 text-white border-0 font-black px-2 py-0.5 text-[8px] uppercase tracking-widest">
                                      {user.role}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-10 h-10 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
                                onClick={() => {
                                  setEditingUser({ 
                                    id: user.id, 
                                    name: user.name || "", 
                                    password: user.password || "",
                                    role: user.role as "user" | "admin" | "monitor"
                                  });
                                  setNewName(user.name || "");
                                  setNewPassword(user.password || "");
                                  setNewRole(user.role as "user" | "admin" | "monitor");
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              {user.id !== 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-10 h-10 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                  onClick={() => deleteMutation.mutate({ id: user.id })}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Criar Usuário */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[450px] w-[95vw] bg-white dark:bg-slate-950 border-0 apple-card-shadow rounded-[2.5rem] p-0 overflow-hidden">
          <div className="bg-black dark:bg-white p-8 text-white dark:text-black">
            <DialogHeader>
              <DialogTitle className="text-3xl font-heavy tracking-tight">Novo Colaborador</DialogTitle>
              <DialogDescription className="text-slate-400 dark:text-slate-500 font-medium">
                Cadastre um novo professor ou monitor no sistema.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Ex: João Silva"
                  className="pl-11 h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo / Permissão</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: "user" | "admin" | "monitor") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-4 font-bold">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                  <SelectItem value="user" className="rounded-xl py-3">Professor (Acesso Restrito)</SelectItem>
                  <SelectItem value="monitor" className="rounded-xl py-3">Monitor de Recreação (Restrito)</SelectItem>
                  <SelectItem value="admin" className="rounded-xl py-3">Administrador (Acesso Total)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-full font-heavy h-12">
              Cancelar
            </Button>
            <Button 
              className="bg-black dark:bg-white text-white dark:text-black hover:opacity-90 rounded-full px-8 h-12 font-heavy apple-card-shadow"
              onClick={() => createMutation.mutate(formData as any)}
              disabled={!formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Usuário */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[450px] w-[95vw] bg-white dark:bg-slate-950 border-0 apple-card-shadow rounded-[2.5rem] p-0 overflow-hidden">
          <div className="bg-[#0071e3] p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-3xl font-heavy tracking-tight">Editar Perfil</DialogTitle>
              <DialogDescription className="text-white/70 font-medium">
                Atualize as informações de <strong>{editingUser?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Nome do usuário..."
                  className="pl-11 h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl font-bold"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={editingUser?.id === 1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo / Permissão</Label>
              <Select 
                value={newRole} 
                onValueChange={(value: "user" | "admin" | "monitor") => setNewRole(value)}
                disabled={editingUser?.id === 1}
              >
                <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-4 font-bold">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                  <SelectItem value="user" className="rounded-xl py-3">Professor (Acesso Restrito)</SelectItem>
                  <SelectItem value="monitor" className="rounded-xl py-3">Monitor de Recreação (Restrito)</SelectItem>
                  <SelectItem value="admin" className="rounded-xl py-3">Administrador (Acesso Total)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Senha de Acesso</Label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nova senha..."
                  className="pl-11 pr-12 h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl font-bold tracking-widest"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setEditingUser(null)} className="rounded-full font-heavy h-12">
              Cancelar
            </Button>
            <Button 
              className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-8 h-12 font-heavy apple-card-shadow"
              onClick={handleUpdateUser}
              disabled={updatePasswordMutation.isPending || updateNameMutation.isPending}
            >
              {updatePasswordMutation.isPending || updateNameMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
