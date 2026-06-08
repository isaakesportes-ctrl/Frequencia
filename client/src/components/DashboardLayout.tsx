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
import { LayoutDashboard, LogOut, PanelLeft, Users, Calendar, Briefcase, UserCircle, ChevronRight } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_MENU = [
  { icon: LayoutDashboard, label: "Estatísticas", path: "/dashboard" },
  { icon: Calendar, label: "Grade Geral", path: "/grade" },
  { icon: Briefcase, label: "Gerenciar Aulas", path: "/admin" },
  { icon: UserCircle, label: "Professores", path: "/professores" },
  { icon: Users, label: "Equipe & Acessos", path: "/usuarios" },
];

const PROFESSOR_MENU = [
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
      <div className="flex h-screen w-full bg-[#f5f5f7] dark:bg-black overflow-hidden">
        <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
          {children}
        </DashboardLayoutContent>
      </div>
    </SidebarProvider>
  );
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
  
  const menuItems = user?.role === "admin" ? ADMIN_MENU : PROFESSOR_MENU;
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
          <header className="h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-50/50 dark:border-slate-800/50 flex items-center justify-between px-4 shrink-0 z-40">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-black dark:bg-white flex items-center justify-center shrink-0 shadow-md">
                <Calendar className="h-3.5 w-3.5 text-white dark:text-black" />
              </div>
              <div className="flex flex-col">
                <span className="font-heavy text-[10px] tracking-tight leading-none uppercase">Sports</span>
                <span className="text-[6px] font-black uppercase tracking-[0.15em] text-slate-400">Dept</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="text-[10px] font-black">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-1 shadow-2xl border-slate-100 dark:border-slate-800">
                  <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-800 mb-1">
                    <p className="text-xs font-heavy truncate">{user?.name}</p>
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{user?.role}</p>
                  </div>
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 font-heavy text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
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
          className="border-r-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl"
        >
          <SidebarHeader className="h-14 justify-center px-4 border-b border-slate-50/50 dark:border-slate-800/50">
            <div className="flex items-center gap-2.5 w-full">
              <div className="w-7 h-7 rounded-lg bg-black dark:bg-white flex items-center justify-center shrink-0 shadow-md">
                <Calendar className="h-3.5 w-3.5 text-white dark:text-black" />
              </div>
              {(!isCollapsed || isMobile) && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col min-w-0"
                >
                  <span className="font-heavy text-xs tracking-tight truncate leading-none">
                    Sports
                  </span>
                  <span className="text-[7px] font-black uppercase tracking-[0.15em] text-slate-400 mt-0.5">
                    Dept
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
                        ? "bg-[#0071e3] text-white shadow-md shadow-blue-500/10 hover:bg-[#0077ed]" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900"
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

          <SidebarFooter className="p-2 border-t border-slate-50/50 dark:border-slate-800/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 w-full group focus:outline-none">
                  <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                    <AvatarFallback className="bg-slate-100 text-slate-900 font-black text-[9px]">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {(!isCollapsed || isMobile) && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[11px] font-heavy truncate leading-none mb-0.5">
                        {user?.name || "User"}
                      </p>
                      <p className="text-[7px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                        {user?.id === 1 ? "MASTER" : user?.role}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side={isMobile ? "bottom" : "right"}
                className="w-48 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-100 dark:border-slate-800 rounded-xl p-1 shadow-2xl"
              >
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 font-heavy text-xs rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
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
            className={`absolute right-0 top-0 w-1 h-full cursor-col-resize z-50 transition-colors duration-300 hover:bg-[#0071e3] group ${
              isResizing ? "bg-[#0071e3]" : ""
            }`}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {[1, 2, 3].map(i => <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />)}
            </div>
          </div>
        )}

        <SidebarInset className="flex-1 bg-[#f5f5f7] dark:bg-black overflow-y-auto">
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
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-2 z-50 pb-safe">
            {menuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-all duration-300 ${
                    isActive ? "text-[#0071e3]" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                    <item.icon className={`h-5 w-5 ${isActive ? "scale-110" : ""}`} />
                  </div>
                  <span className={`text-[9px] font-black tracking-tight ${isActive ? "opacity-100" : "opacity-60"}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-active"
                      className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0071e3]"
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
