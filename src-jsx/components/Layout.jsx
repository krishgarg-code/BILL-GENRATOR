import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

import { useSidebar } from "@/components/ui/sidebar";

function LayoutContent() {
    const { setOpen } = useSidebar();

    return (
        <>
            <AppSidebar />
            <SidebarInset className="border-0 shadow-none bg-transparent">
                <div
                    className="flex flex-1 flex-col gap-4"
                    onMouseEnter={() => setOpen(false)}
                >
                    <Outlet />
                </div>
            </SidebarInset>
        </>
    );
}

export default function Layout() {
    return (
        <SidebarProvider>
            <LayoutContent />
        </SidebarProvider>
    );
}
