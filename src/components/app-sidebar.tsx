import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Inbox, MessagesSquare, Users, FileText, Settings, ShieldAlert, BookOpen, FlaskConical, Bell } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Bandeja de casos", url: "/casos", icon: Inbox },
  { title: "Centro de Alertas", url: "/alertas", icon: Bell },
  { title: "Simulador en vivo", url: "/demo", icon: FlaskConical },
  { title: "Chat agente", url: "/chat", icon: MessagesSquare },
  { title: "Proveedores", url: "/proveedores", icon: Users },
  { title: "Reportes", url: "/reportes", icon: FileText },
  { title: "Configuración", url: "/config", icon: Settings },
  { title: "Documentación", url: "/docs", icon: BookOpen },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold">FraudIA Claims</span>
            <span className="text-[10px] text-muted-foreground">Aseguradora del Sur</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
