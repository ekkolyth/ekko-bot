import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'
import { authClient } from '@/lib/auth/client'
import { useNavigate } from '@tanstack/react-router'
import { Heart, LogIn, LogOut, LayoutDashboard } from 'lucide-react'

export default function Header() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: '/auth/sign-in' })
        },
      },
    })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/50 bg-slate-950/50 backdrop-blur supports-[backdrop-filter]:bg-slate-950/50">
      <div className="w-full flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-xl text-white hover:opacity-80 transition-opacity"
        >
          <Heart className="size-7 mr-1 text-indigo-500 fill-indigo-500" />
          <span className='text-2xl'>Ekko Bot</span>
        </Link>

        {/* Right side navigation */}
        <nav className="flex items-center gap-4">
          {session ? (
            <>
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
              asChild
            >
              <Link to="/auth/sign-in">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
