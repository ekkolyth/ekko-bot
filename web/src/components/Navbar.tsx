import { Link, useRouterState } from '@tanstack/react-router'
import { authClient } from '@/lib/auth/client'
import { useNavigate } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import {
  AlarmClock,
  BarChart3,
  Bell,
  Code2,
  Coins,
  Disc3,
  ExternalLink,
  FileText,
  Gamepad2,
  Heart,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Moon,
  MoreVertical,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  SunMedium,
  UsersRound,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WeatherCard } from '@/components/weather-card'
import { useAppearance } from '@/contexts/appearance'
import { cn } from '@/lib/utils'

type SidebarItem = { label: string; href: string; icon: LucideIcon; isExternal?: boolean }

export type SidebarSection = {
  label: string
  items: SidebarItem[]
}

export const sidebarSections: SidebarSection[] = [
  {
    label: 'ESSENTIALS',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Jukebox', href: '/music', icon: Disc3 },
      { label: 'Games', href: '/games', icon: Gamepad2 },
    ],
  },
  {
    label: 'MOD TOOLS',
    items: [
      { label: 'Welcome Channel', href: '/welcome-channel', icon: Sparkles },
      { label: 'Reaction Roles', href: '/reaction-roles', icon: UsersRound },
      { label: 'Moderator Controls', href: '/moderator-controls', icon: ShieldCheck },
      { label: 'Commands', href: '/commands', icon: Code2 },
    ],
  },
  {
    label: 'UTILITIES',
    items: [
      { label: 'Polls', href: '/polls', icon: BarChart3 },
      { label: 'Message Embeds', href: '/message-embeds', icon: FileText },
      { label: 'Reminders', href: '/reminders', icon: AlarmClock },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Donations', href: '/donations', icon: Coins },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      { label: 'Help', href: '/help', icon: LifeBuoy },
      {
        label: 'Extra Life',
        href: 'https://extralife.ekkolyth.com/',
        icon: HeartHandshake,
        isExternal: true,
      },
      {
        label: 'Merch',
        href: 'https://ghostboy.co',
        icon: ShoppingBag,
        isExternal: true,
      },
    ],
  },
]

export function Navbar() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const router = useRouterState()
  const currentPath = router.location.pathname
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const { accentId, colors, setAccentId, mode, setMode } = useAppearance()

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: '/auth/sign-in' })
        },
      },
    })
  }

  const userInitials = session?.user?.name
    ? session.user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'U'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <Link to="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Heart className="size-4 fill-white" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Ekko Bot</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {!isCollapsed && <SidebarTrigger />}
        </div>
        {!isCollapsed && (
          <div className="">
            <WeatherCard />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {sidebarSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = !item.isExternal && currentPath === item.href
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        {item.isExternal ? (
                          <a href={item.href} target="_blank" rel="noreferrer">
                            <ItemIcon />
                            <span className="flex items-center gap-1">
                              {item.label}
                              <ExternalLink className="size-3.5" />
                            </span>
                          </a>
                        ) : (
                          <Link to={item.href}>
                            <ItemIcon />
                            <span>{item.label}</span>
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        {isCollapsed && (
          <div className="flex items-center justify-center px-2 pb-2">
            <SidebarTrigger />
          </div>
        )}
        <DropdownMenu>
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-2 group-data-[collapsible=icon]:justify-center">
            {!isCollapsed && (
              <>
                <Avatar className="size-8">
                  <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    {session?.user?.name || 'User'}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {session?.user?.email || ''}
                  </span>
                </div>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="sm"
                    className="size-8 data-[state=open]:bg-sidebar-accent"
                  >
                    <MoreVertical className="size-4" />
                    <span className="sr-only">More options</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
              </>
            )}
            {isCollapsed && (
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center size-8 rounded-md hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                  <Avatar className="size-8">
                    <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
            )}
          </div>
          <DropdownMenuContent side="right" align="end" className="w-64 space-y-2">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
              Appearance
            </DropdownMenuLabel>
            <div className="rounded-xl border border-border/60 bg-card/80 p-3 shadow-sm">
              <div className="flex items-center justify-between text-[0.75rem] font-medium text-muted-foreground">
                <span>Theme</span>
                <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/40 p-1">
                  <button
                    type="button"
                    onClick={() => setMode('light')}
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full transition',
                      mode === 'light'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-pressed={mode === 'light'}
                    aria-label="Switch to light mode"
                  >
                    <SunMedium className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('dark')}
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full transition',
                      mode === 'dark'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-pressed={mode === 'dark'}
                    aria-label="Switch to dark mode"
                  >
                    <Moon className="size-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 text-[0.75rem] font-medium text-muted-foreground">
                Accent
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setAccentId(color.id)}
                    className={cn(
                      'relative flex size-8 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      accentId === color.id ? 'ring-2 ring-primary' : 'ring-0'
                    )}
                    aria-label={`${color.label} accent`}
                    aria-pressed={accentId === color.id}
                    style={{ backgroundColor: color.value }}
                  >
                    {accentId === color.id && (
                      <span className="pointer-events-none absolute inset-1 rounded-full border border-white/70" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
