import { Calendar, Home, Inbox, Search, Settings, FileText, ChevronUp, User2, Moon, Sun } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";

const items = [
    {
        title: "Scrap Bill",
        url: "/",
        icon: Home,
    },
    {
        title: "Ingot Bill",
        url: "/bill2",
        icon: FileText,
    },
];

export function AppSidebar() {
    const location = useLocation();
    const { theme, setTheme } = useTheme();

    return (
        <Sidebar>
            <SidebarContent>
                <div className="p-4 border-b border-sidebar-border">
                    <h2 className="text-xl font-bold tracking-tight text-sidebar-foreground px-2">
                        Bill Manager
                    </h2>
                </div>
                <SidebarGroup>
                    <SidebarGroupLabel>Apps</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={location.pathname === item.url}
                                        size="lg"
                                        className="data-[active=true]:bg-zinc-200 data-[active=true]:text-zinc-900 data-[active=true]:font-bold"
                                    >
                                        <Link to={item.url} className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium text-base">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
                                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                                </span>
                                <span className="truncate text-xs">Switch theme</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
