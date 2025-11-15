import { Link, useRouterState } from '@tanstack/react-router'
import { authClient } from '@/lib/auth/client'
import { useNavigate } from '@tanstack/react-router'
import {
  AlarmClock,
  BarChart3,
  Bell,
  Code2,
  Coins,
  Disc3,
  FileText,
  Gamepad2,
  Heart,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MoreVertical,
  Music,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navbar() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const router = useRouterState()
  const currentPath = router.location.pathname
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  // Authenticated sidebar sections
  const navSections: {
    label: string
    items: { label: string; href: string; icon: LucideIcon }[]
  }[] = [
    {
      label: 'ESSENTIALS',
      items: [
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
        { label: 'Extra Life', href: '/extra-life', icon: HeartHandshake },
        { label: 'Merch', href: '/merch', icon: ShoppingBag },
      ],
    },
  ]

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
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
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
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>HOME</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === '/dashboard'}>
                  <Link to="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={currentPath === item.href}>
                        <Link to={item.href}>
                          <ItemIcon />
                          <span>{item.label}</span>
                        </Link>
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
                  <AvatarFallback className="bg-indigo-500 text-white text-xs">
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
                    size="icon"
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
                    <AvatarFallback className="bg-indigo-500 text-white text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
            )}
          </div>
          <DropdownMenuContent side="right" align="end" className="w-48">
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
