import Link from "next/link"
import { Button } from "@/components/ui/button"
import { QrCode, Building2, MessageSquare, ArrowRight, Sparkles, Shield, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-secondary backdrop-blur-sm bg-black/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-medium text-white tracking-tight">
              AttendAI
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-sm text-muted-foreground hover:text-white transition-colors duration-200"
              >
                Features
              </Link>
              <Link
                href="#about"
                className="text-sm text-muted-foreground hover:text-white transition-colors duration-200"
              >
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:bg-secondary" asChild>
              <Link href="#contact">Contact</Link>
            </Button>
            <Button className="bg-white text-black hover:bg-white/90 rounded-full" asChild>
              <Link href="/attendai">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-8">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">Google TechSprint 2025</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-white mb-6 text-balance">
            AI-Powered Campus Management
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
            Transform your college experience with intelligent attendance tracking, optimized room allocation, and a
            collaborative community platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-full" asChild>
              <Link href="/attendai">
                Start Using AttendAI
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-secondary rounded-full hover:bg-secondary bg-transparent"
              asChild
            >
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">Three Powerful Solutions</h2>
            <p className="text-muted-foreground text-lg">Choose the tool that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* AttendAI Card */}
            <Link href="/attendai" className="group">
              <div className="relative h-full p-8 rounded-2xl border border-secondary bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-200">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-2xl font-medium text-white mb-3">AttendAI</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  AI-powered attendance system with secure QR codes, event tracking, and automated email notifications.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">QR Generation</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">Event Tracking</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">Auto Emails</span>
                </div>

                <div className="flex items-center text-sm text-primary group-hover:gap-2 transition-all duration-200">
                  <span>Get started</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
            </Link>

            {/* RoomSync Card */}
            <Link href="/roomsync" className="group">
              <div className="relative h-full p-8 rounded-2xl border border-secondary bg-card hover:border-accent/50 transition-all duration-200 hover:shadow-lg hover:shadow-accent/5">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors duration-200">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>

                <h3 className="text-2xl font-medium text-white mb-3">RoomSync</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Intelligent room allocation platform with AI-based suggestions for optimal space utilization.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">AI Suggestions</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">Admin Only</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">Live Updates</span>
                </div>

                <div className="flex items-center text-sm text-accent group-hover:gap-2 transition-all duration-200">
                  <span>Official access</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
            </Link>

            {/* IssueHub Card */}
            <Link href="/issuehub" className="group">
              <div className="relative h-full p-8 rounded-2xl border border-secondary bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-200">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-2xl font-medium text-white mb-3">IssueHub</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Collaborative community platform where students share knowledge and solve campus issues together.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">Q&A Forum</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">Community</span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground">Knowledge Base</span>
                </div>

                <div className="flex items-center text-sm text-primary group-hover:gap-2 transition-all duration-200">
                  <span>Join community</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Quick QR generation and instant room allocation with AI optimization
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Non-shareable QR codes with screenshot protection for attendance integrity
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">AI-Powered</h3>
              <p className="text-muted-foreground">
                Smart suggestions and automated workflows powered by artificial intelligence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-secondary py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">© 2025 AttendAI. Google TechSprint Project.</p>
        </div>
      </footer>
    </div>
  )
}
