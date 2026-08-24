import { AppSidebar } from "#renderer/components/app-sidebar";
import { ModeToggle } from "#renderer/components/mode-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#renderer/components/ui/breadcrumb";
import { Separator } from "#renderer/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "#renderer/components/ui/sidebar";
import { MenubarDemo } from "./menu";

export const Component = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 bg-inherit transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="my-auto mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Build Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="mx-auto"></div>
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video" />
            <div className="bg-muted/50 aspect-video" />
            <div className="bg-muted/50 aspect-video" />
          </div>
          <div className="bg-muted/50 min-h-dvh flex-1 p-6 md:min-h-min">
            <MenubarDemo />
            <hr className="my-5" />
            <span>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Voluptate, quam. Blanditiis delectus facere vero nemo repellendus
              cupiditate excepturi amet numquam corrupti odio nam reiciendis
              laudantium eum, nobis eius eligendi soluta.
            </span>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
