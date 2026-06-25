import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, Calendar, Briefcase, UserCircle, ChevronRight, ClipboardList } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_MENU = [
  { icon: LayoutDashboard, label: "Estatísticas", path: "/dashboard" },
  { icon: Calendar, label: "Grade Geral", path: "/grade" },
  { icon: ClipboardList, label: "Controle de Frequência", path: "/frequencia" },
  { icon: Users, label: "Registros de Frequências", path: "/registros-frequencia" },
  { icon: Briefcase, label: "Gerenciar Aulas", path: "/admin" },
  { icon: UserCircle, label: "Professores", path: "/professores" },
  { icon: Users, label: "Equipe & Acessos", path: "/usuarios" },
  { icon: Users, label: "Gerenciar Sócios", path: "/socios" },
];

const PROFESSOR_MENU = [
  { icon: Calendar, label: "Grade Geral", path: "/grade" },
  { icon: ClipboardList, label: "Controle de Frequência", path: "/frequencia" },
  { icon: UserCircle, label: "Minhas Aulas", path: "/professores" },
];

const APRENDIZ_MENU = [
  { icon: Calendar, label: "Grade Geral", path: "/grade" },
  { icon: ClipboardList, label: "Controle de Frequência", path: "/frequencia" },
];

const CORPO_DOCENTE_MENU = [
  { icon: Calendar, label: "Grade Geral", path: "/grade" },
  { icon: UserCircle, label: "Minhas Aulas", path: "/professores" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 200;
const MIN_WIDTH = 160;
const MAX_WIDTH = 260;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? Math.min(Math.max(parseInt(saved, 10), MIN_WIDTH), MAX_WIDTH) : DEFAULT_WIDTH;
  });
  const { loading } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
          {children}
        </DashboardLayoutContent>
      </div>
    </SidebarProvider>
  );
}

// Function to get role badge style
function getRoleBadgeStyle(role: string) {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-800";
    case "user":
    case "corpo_docente":
      return "bg-blue-100 text-blue-800";
    case "monitor":
      return "bg-teal-100 text-teal-800";
    case "aprendiz":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Function to get role label
function getRoleLabel(role: string) {
  switch (role) {
    case "admin":
      return "Admin";
    case "user":
    case "corpo_docente":
      return "Professor";
    case "monitor":
      return "Monitor";
    case "aprendiz":
      return "Aprendiz";
    default:
      return "Usuário";
  }
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);


  // Determina menu items baseado no tipo de usuário
  let menuItems = ADMIN_MENU;
  
  // Build menu based on user type
  if (user?.role === "admin") {
    menuItems = ADMIN_MENU;
  } else if (user?.role === "aprendiz") {
    menuItems = APRENDIZ_MENU;
  } else if (user?.role === "monitor") {
    menuItems = PROFESSOR_MENU;
  } else if (user?.role === "corpo_docente") {
    menuItems = CORPO_DOCENTE_MENU;
  } else {
    menuItems = PROFESSOR_MENU;
  }
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, setSidebarWidth, isMobile]);

  return (
    <>
      <div className="relative flex h-full flex-col md:flex-row w-full overflow-hidden" ref={sidebarRef}>
        {/* Mobile Header */}
        {isMobile && (
          <header className="h-14 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 shrink-0 z-40">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-md">
                <Calendar className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[10px] tracking-tight leading-none uppercase">Agenda</span>
                <span className="text-[6px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">Master</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-muted">
                <PanelLeft className="h-4 w-4" />
              </SidebarTrigger>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="text-[10px] font-bold">
                        {(user?.name?.charAt(0) || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card/90 backdrop-blur-xl rounded-xl p-1 shadow-2xl border-border">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs font-bold truncate">{user?.name}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${getRoleBadgeStyle(user?.role || "")} px-2 py-0.5 rounded-full inline-block mt-1`}>
                      {getRoleLabel(user?.role || "")}
                    </p>
                  </div>
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-3 py-2 text-destructive font-bold text-xs rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sair da Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        )}

        <Sidebar
          collapsible={isMobile ? "offcanvas" : "icon"}
          className="border-r-0 bg-card/80 backdrop-blur-xl"
        >
          <SidebarHeader className="h-14 justify-center px-4 border-b border-border">
            <div className="flex items-center gap-2.5 w-full">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-md">
                <Calendar className="h-3.5 w-3.5 text-white" />
              </div>
              {(!isCollapsed || isMobile) && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col min-w-0"
                >
                  <span className="font-bold text-xs tracking-tight truncate leading-none">
                    Agenda
                  </span>
                  <span className="text-[7px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                    Master
                  </span>
                </motion.div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-2">
            <SidebarMenu className="gap-0.5">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        setLocation(item.path);
                        if (isMobile) setOpenMobile(false);
                      }}
                      tooltip={item.label}
                      className={`h-8 px-2.5 rounded-lg transition-all duration-300 group ${
                        isActive 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <item.icon
                        className={`h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : ""}`}
                      />
                      <span className="font-bold text-[11px] ml-2 truncate">{item.label}</span>
                      {isActive && (!isCollapsed || isMobile) && (
                        <motion.div layoutId="active-pill" className="ml-auto">
                          <ChevronRight className="h-2.5 w-2.5 opacity-50" />
                        </motion.div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-2 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl p-1 hover:bg-muted transition-all duration-300 w-full group focus:outline-none">
                  <Avatar className="h-7 w-7 border-2 border-card shadow-sm shrink-0">
                    <AvatarFallback className="bg-muted text-foreground font-bold text-[9px]">
                      {(user?.name?.charAt(0) || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {(!isCollapsed || isMobile) && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[11px] font-bold truncate leading-none mb-0.5">
                        {user?.name || "User"}
                      </p>
                      <p className={`text-[7px] font-bold uppercase tracking-widest ${getRoleBadgeStyle(user?.role || "")} px-2 py-0.5 rounded-full inline-block`}>
                        {getRoleLabel(user?.role || "")}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side={isMobile ? "bottom" : "right"}
                className="w-48 bg-card/80 backdrop-blur-xl border-border rounded-xl p-1 shadow-2xl"
              >
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 py-2 text-destructive font-bold text-xs rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {!isMobile && (
          <div
            onMouseDown={() => setIsResizing(true)}
            className={`absolute right-0 top-0 w-1 h-full cursor-col-resize z-50 transition-colors duration-300 hover:bg-primary group ${
              isResizing ? "bg-primary" : ""
            }`}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {[1, 2, 3].map(i => <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />)}
            </div>
          </div>
        )}

        <SidebarInset className="flex-1 bg-background overflow-y-auto">
          <div className={`h-full w-full p-4 md:p-8 ${isMobile ? "pb-24" : ""}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </SidebarInset>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-2xl border-t border-border flex items-center justify-around px-2 z-50 pb-safe">
            {menuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-all duration-300 ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? "bg-muted" : ""}`}>
                    <item.icon className={`h-5 w-5 ${isActive ? "scale-110" : ""}`} />
                  </div>
                  <span className={`text-[9px] font-bold tracking-tight ${isActive ? "opacity-100" : "opacity-60"}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-active"
                      className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </>
  );
}
