import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Music,
  Bot,
  Command,
  Bell,
  Play,
  Users,
  Zap,
  CheckCircle2,
  ArrowRight,
  Volume2,
  Settings,
  Sparkles,
  ServerIcon,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['healthz'],
    queryFn: async () => {
      const res = await fetch('/api/healthz')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: false, // Don't auto-fetch, only when button is clicked
  })

  const features = [
    {
      icon: Shield,
      title: 'Admin & Moderator Automation',
      description: 'Automate moderation tasks, manage roles, and keep your server safe with intelligent auto-moderation.',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      icon: Music,
      title: 'Music Bot with Web UI',
      description: 'Advanced music player with shared playlists, queue management, and a beautiful web dashboard for control.',
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      icon: Bell,
      title: 'Stream & Podcast Alerts',
      description: 'Get instant notifications when your favorite creators go live on Twitch, YouTube, or release new podcast episodes.',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
    },
    {
      icon: Command,
      title: 'Custom Commands',
      description: 'Create unlimited custom commands to automate workflows, respond to members, and personalize your server.',
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      icon: Users,
      title: 'Advanced User Management',
      description: 'Powerful tools for managing members, roles, permissions, and server settings with granular control.',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built for performance with low latency, instant responses, and reliable uptime you can count on.',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
  ]

  const benefits = [
    'Zero downtime deployment',
    'Real-time queue synchronization',
    'Web-based dashboard included',
    'Unlimited custom commands',
    'Multi-guild support',
    'Privacy-focused architecture',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
              <Sparkles className="w-3 h-3 mr-2" />
              All-in-One Discord Solution
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Level Up Your
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Discord Server
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
              Professional-grade moderation, music streaming, alert management, and automation?all in one powerful bot.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/50"
                asChild
              >
                <Link to="/auth/sign-in">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                asChild
              >
                <a href="#features">View Features</a>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={() => refetch()}
                disabled={isLoading}
                variant="outline"
                className="px-6 py-3 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <ServerIcon className="size-4 mr-2" />
                {isLoading ? 'Checking API...' : 'API Healthcheck'}
              </Button>
              {data && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg max-w-2xl w-full border border-slate-700">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
              {error && (
                <div className="mt-4 p-4 bg-red-900/20 rounded-lg max-w-2xl w-full border border-red-800/50">
                  <pre className="text-sm text-red-300 whitespace-pre-wrap">
                    Error: {error.message}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-24 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Powerful features designed for modern Discord communities
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
                >
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}
                    >
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-slate-400 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Music Feature Highlight */}
      <section className="px-6 py-24 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
                <Music className="w-3 h-3 mr-2" />
                Music Experience
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Control Music From Anywhere
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Our web dashboard lets you manage your music queue, create shared playlists, and control playback from any device?no Discord commands needed.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  'Web-based queue management',
                  'Shared playlist sessions',
                  'Cross-platform control',
                  'Real-time synchronization',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-lg">{item}</span>
                  </div>
                ))}
              </div>
              <Button
                size="lg"
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                asChild
              >
                <Link to="/auth/sign-in">
                  Try Web Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <Card className="bg-slate-900/80 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Play className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Now Playing</CardTitle>
                        <CardDescription>Music Bot Session</CardDescription>
                      </div>
                    </div>
                    <Volume2 className="w-5 h-5 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/30">
                      <div className="text-white font-medium mb-1">Current Track</div>
                      <div className="text-slate-400 text-sm">Example Song Title</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-slate-400 text-sm font-medium">Queue (3 tracks)</div>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="bg-slate-800/30 rounded p-3 text-sm text-slate-300"
                        >
                          {i}. Upcoming track #{i}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 rounded-2xl p-12 border border-slate-800">
            <Bot className="w-16 h-16 text-blue-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Server?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of communities using EkkoBot to automate, entertain, and engage their members.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/50"
                asChild
              >
                <Link to="/auth/sign-in">
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-lg px-8 py-6 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Settings className="mr-2 w-5 h-5" />
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
