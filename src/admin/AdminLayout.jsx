import React from "react";
import {
  BarChart3,
  Database,
  FileText,
  LogOut,
  MessageSquareText,
  Save,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { KnowledgeEditor } from "./KnowledgeEditor.jsx";
import { PromptEditor } from "./PromptEditor.jsx";
import { ResumeEditor } from "./ResumeEditor.jsx";
import { UsageView } from "./UsageView.jsx";

const sections = [
  { value: "Knowledge", label: "知识库", icon: Database },
  { value: "Prompt", label: "Prompt", icon: MessageSquareText },
  { value: "Resume", label: "简历", icon: FileText },
  { value: "Usage", label: "统计", icon: BarChart3 },
];

function ActiveEditor({ activeSection, config, session, updateConfig }) {
  if (activeSection === "Prompt") {
    return (
      <PromptEditor
        config={config.assistant || {}}
        providerStatus={config.providerStatus || {}}
        onChange={(assistant) => updateConfig({ assistant })}
      />
    );
  }

  if (activeSection === "Resume") {
    return (
      <ResumeEditor
        resume={config.resume || {}}
        session={session}
        onChange={(resume) => updateConfig({ resume })}
      />
    );
  }

  if (activeSection === "Usage") {
    return <UsageView usage={config.usage || {}} />;
  }

  return (
    <KnowledgeEditor
      items={config.knowledgeItems || []}
      onChange={(knowledgeItems) => updateConfig({ knowledgeItems })}
    />
  );
}

export function AdminLayout({
  config,
  error,
  saving,
  session,
  onConfigChange,
  onSave,
  onSignOut,
}) {
  const [activeSection, setActiveSection] = React.useState("Knowledge");
  const isLocalAdmin = Boolean(session.localAdmin);
  const isPreview = Boolean(session.localPreview);
  const enabledKnowledgeCount = (config?.knowledgeItems || []).filter(
    (item) => item.enabled !== false
  ).length;
  const callLimit = config?.assistant?.apiLimitPerVisitor || 20;
  const resumeReady = Boolean(
    config?.resume?.filePath || config?.resume?.externalUrl || config?.resume?.url
  );
  const activeLabel =
    sections.find((section) => section.value === activeSection)?.label || "配置";

  const updateConfig = (patch) => {
    onConfigChange({ ...config, ...patch });
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar className="border-sidebar-border" collapsible="icon">
        <SidebarHeader className="p-3 pb-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-14 px-2"
                size="lg"
                tooltip="Portfolio AI"
              >
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Settings2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-none">
                  <span className="truncate text-sm font-semibold leading-5">
                    Portfolio AI
                  </span>
                  <span className="truncate text-xs leading-4 text-sidebar-foreground/70">
                    配置后台
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-3 pt-3">
            <SidebarGroupLabel>Assistant</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {sections.map(({ value, label, icon: Icon }) => (
                  <SidebarMenuItem key={value}>
                    <SidebarMenuButton
                      className="h-10"
                      isActive={activeSection === value}
                      tooltip={label}
                      onClick={() => setActiveSection(value)}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        </Sidebar>

        <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
          <SidebarTrigger />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-medium">{activeLabel}</h1>
              <Badge variant={isPreview ? "outline" : "secondary"}>
                {isLocalAdmin ? "Local admin" : isPreview ? "Local preview" : "Supabase"}
              </Badge>
            </div>
          </div>
          <Button disabled={!config || saving} size="sm" type="button" onClick={onSave}>
            <Save />
            {saving ? "Saving..." : "Save config"}
          </Button>
          <Button size="sm" type="button" variant="outline" onClick={onSignOut}>
            <LogOut />
            Sign out
          </Button>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>启用知识条目</CardDescription>
                <CardTitle>{enabledKnowledgeCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>每个访客调用上限</CardDescription>
                <CardTitle>{callLimit}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>简历下载</CardDescription>
                <CardTitle>{resumeReady ? "Ready" : "Not set"}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {error ? (
            <Card size="sm">
              <CardContent className="text-destructive">{error}</CardContent>
            </Card>
          ) : null}

          {!config ? (
            <Card>
              <CardContent className="text-sm text-muted-foreground">
                Loading config for {session.user.email}...
              </CardContent>
            </Card>
          ) : null}

          {config ? (
            <ActiveEditor
              activeSection={activeSection}
              config={config}
              session={session}
              updateConfig={updateConfig}
            />
          ) : null}
        </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
