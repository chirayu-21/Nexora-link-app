import { useEffect, useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'

const communityPreview = [
  { name: 'AI Builders Guild', focus: 'AI/ML · Research', members: '120 students', accent: 'from-violet-500/20 to-cyan-500/20' },
  { name: 'Campus Code Crew', focus: 'Full-stack · Open Source', members: '96 students', accent: 'from-cyan-500/20 to-blue-500/20' },
  { name: 'RoboClub NXT', focus: 'Robotics · Hardware', members: '84 students', accent: 'from-fuchsia-500/20 to-violet-500/20' },
]

const featuredHackathons = [
  { title: 'Build for Bharat', tag: 'AI + Social Impact', date: '18–20 Oct', host: 'Inter-college' },
  { title: 'Campus Catalyst', tag: 'Startup Sprint', date: '02 Nov', host: 'Product Lab' },
  { title: 'Quantum Forge', tag: 'Hardware + Code', date: '14 Nov', host: 'Innovation Council' },
]

const clubHighlights = [
  'AI and data communities',
  'Design and product squads',
  'Robotics and hardware labs',
  'Startup and entrepreneurship circles',
]

const eventSections = [
  { title: 'Technical fests', summary: 'Discover product showcases, workshops, and campus-level innovation events.' },
  { title: 'Hackathons', summary: 'Find teammates and project ideas before registration windows close.' },
  { title: 'Guest lectures', summary: 'Stay close to founders, researchers, and alumni conversations.' },
]

const testimonials = [
  { quote: 'NEXORA helped our team find a product-minded designer, backend engineer, and a research partner in one weekend.', author: 'Aarav, CSE student' },
  { quote: 'The event discovery flow gives students a cleaner way to find opportunities without the clutter of random campus spam.', author: 'Meher, design student' },
]

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'https://nexora-api-xl76.onrender.com')).replace(/\/+$/, '')

class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function apiFetch<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error(`Could not reach the backend API${apiBaseUrl ? ` at ${apiBaseUrl}` : ''}. Check that it is deployed and allows requests from this website.`)
  }

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
      ? data.message
      : `The backend API returned HTTP ${response.status}. Check the API URL and backend deployment.`
    throw new ApiError(message, response.status)
  }

  if (data === null) {
    throw new Error('The backend API returned an invalid response. Check that VITE_API_BASE_URL points to the API server.')
  }

  return data as T
}

type DashboardEvent = {
  id: string
  title: string
  description?: string
  hostName?: string
  location?: string
  startDate?: string
  registrationDeadline?: string
  category?: string
  registrationLink?: string
  isInterested: boolean
  status?: string
}

type ChatMessage = {
  id: string
  senderId: string
  content: string
  createdAt: string
}

type DashboardConnection = {
  id: string
  senderId: string
  receiverId: string
  status: string
  message?: string | null
  sender?: { id: string; fullName: string }
  receiver?: { id: string; fullName: string }
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080b14] text-slate-100 antialiased">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080b14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-black text-slate-950 shadow-[0_0_25px_rgba(94,234,212,0.6)]">
              N
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[0.18em] text-white">NEXORA</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#discover" className="transition hover:text-white">Discover</a>
            <a href="#communities" className="transition hover:text-white">Communities</a>
            <a href="#events" className="transition hover:text-white">Events</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/auth" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-violet-400 hover:text-white">
              Log in
            </Link>
            <Link to="/auth" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(168,85,247,0.45)] transition hover:scale-[1.02]">
              Join NEXORA
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.3),_transparent_35%),radial-gradient(circle_at_right,_rgba(34,211,238,0.2),_transparent_35%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-28">
            <div className="flex flex-col justify-center">
              <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-violet-200 uppercase">
                Build, connect, compete
              </span>

              <h1 className="max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl">
                Find your people. Launch your next big idea.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                NEXORA is a student-first network for cross-college collaboration, hackathon recruiting, club communities, and campus event discovery.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to="/auth" className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_0_40px_rgba(168,85,247,0.5)] transition hover:scale-[1.02]">
                  Find Your Team
                </Link>
                <Link to="/auth" className="rounded-full border border-sky-400/40 bg-sky-500/5 px-6 py-3 text-base font-semibold text-sky-100 transition hover:border-sky-300 hover:bg-sky-500/10">
                  Explore Campus Events
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-5 text-sm text-slate-300">
                <span>Password-protected accounts</span>
                <span className="h-1 w-1 rounded-full bg-slate-500" />
                <span>Student team formation</span>
                <span className="h-1 w-1 rounded-full bg-slate-500" />
                <span>Event discovery across colleges</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-violet-500/20 via-transparent to-cyan-500/20 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-slate-900/80 p-4 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl">
                <div className="rounded-[1.5rem] border border-white/10 bg-[#0d1424] p-4">
                  <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                    <span>Community board</span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">Demo preview</span>
                  </div>

                  <div className="space-y-4">
                    {communityPreview.map((community) => (
                      <div key={community.name} className={`rounded-2xl border border-white/10 bg-gradient-to-r ${community.accent} p-4`}>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-base font-semibold text-white">{community.name}</p>
                            <p className="mt-1 text-sm text-slate-300">{community.focus}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-slate-950/50 px-2 py-1 text-xs text-slate-200">
                            {community.members}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Trending match</p>
                    <p className="mt-3 text-lg font-semibold text-white">AI + Python + Product strategy</p>
                    <p className="mt-2 text-sm text-slate-300">Recommended because you both work with AI and Python.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="discover" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">Illustrative preview</p>
              <h2 className="mt-2 text-3xl font-bold text-white">Hackathons and opportunities</h2>
            </div>
            <Link to="/auth" className="text-sm text-cyan-300 transition hover:text-cyan-200">Explore after sign in</Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {featuredHackathons.map((item) => (
              <article key={item.title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_0_40px_rgba(15,23,42,0.4)] transition duration-200 hover:-translate-y-1 hover:border-violet-400/50">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-violet-200">
                    {item.tag}
                  </span>
                  <span className="text-xs text-slate-400">{item.date}</span>
                </div>
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm text-slate-400">Hosted by {item.host}</p>
                <Link to="/auth" className="mt-5 block w-full rounded-full border border-cyan-400/30 bg-cyan-500/5 px-4 py-2 text-center text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/10">
                  View brief
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section id="communities" className="bg-slate-950/80 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">Communities</p>
                <h2 className="mt-3 text-3xl font-bold text-white">Find clubs, groups, and projects that match your energy.</h2>
                <p className="mt-4 max-w-lg text-slate-300">
                  Whether you are building open-source tools, leading a design sprint, or exploring research, NEXORA makes it easier to discover communities beyond your own campus.
                </p>

                <ul className="mt-6 space-y-3 text-slate-200">
                  {clubHighlights.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {['Coding Clubs', 'AI/ML Communities', 'Robotics Societies', 'Design Networks', 'Startup Circles', 'Open Source Hubs'].map((label) => (
                  <div key={label} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                    <div className="mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20" />
                    <p className="text-lg font-semibold text-white">{label}</p>
                    <p className="mt-2 text-sm text-slate-400">Access public and approval-based communities with moderator-led discussions.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="events" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">Discovery</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Events worth showing up for</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {eventSections.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                <div className="mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="bg-[#0a1220] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">How it works</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Built for real student collaboration</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: 'Create your profile', body: 'Add your skills, interests, academic context, and preferred roles so your network feels relevant from day one.' },
                { title: 'Discover and connect', body: 'Search for teammates, communities, clubs, and opportunities with filters designed for students across colleges.' },
                { title: 'Collaborate securely', body: 'Use private team workspaces, group chats, and moderation flows that keep the platform safe and manageable.' },
              ].map((step, index) => (
                <div key={step.title} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 text-sm font-bold text-slate-950">
                    0{index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">Testimonials</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Demo feedback from student users</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((item) => (
              <blockquote key={item.author} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                <p className="text-lg leading-8 text-slate-200">“{item.quote}”</p>
                <footer className="mt-4 text-sm font-medium text-cyan-300">{item.author}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#070b12]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-5 lg:px-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-black text-slate-950">
                N
              </div>
              <p className="text-lg font-semibold tracking-[0.18em] text-white">NEXORA</p>
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
              A future-facing student network for collaboration, communities, and discovery across colleges and universities.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">About</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>About</li>
              <li>Contact</li>
              <li>Community Guidelines</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>Privacy Policy</li>
              <li>Terms</li>
              <li>Safety Center</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Resources</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>Student verification</li>
              <li>Reporting tools</li>
              <li>Security overview</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ fullName:'', email:'', mobileNumber:'', password:'', age:'', collegeName:'', degree:'', branch:'', academicYear:'', skills:'', interests:'', identifier:'' })
  const handleChange = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }))
  const switchMode = (next: 'login' | 'register') => { setMode(next); setError('') }
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const payload = mode === 'register' ? { fullName:form.fullName.trim(), email:form.email.trim().toLowerCase(), mobileNumber:form.mobileNumber.replace(/[\s()-]/g,''), password:form.password, age:Number(form.age), collegeName:form.collegeName.trim(), degree:form.degree.trim(), branch:form.branch.trim(), academicYear:form.academicYear.trim(), skills:form.skills ? form.skills.split(',').map(v=>v.trim()).filter(Boolean):[], interests:form.interests ? form.interests.split(',').map(v=>v.trim()).filter(Boolean):[] } : { identifier:form.identifier.trim(), password:form.password }
      await apiFetch(mode === 'register' ? '/auth/register' : '/auth/login','POST',payload)
      navigate('/dashboard')
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  const inputClass = 'nexora-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition'
  return <div className="auth-shell flex min-h-screen items-center justify-center px-4 py-10 text-slate-100"><div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/><div className="auth-card relative z-10 w-full max-w-3xl rounded-[2rem] p-6 sm:p-9">
    <div className="mb-8 flex items-start justify-between gap-4"><div><Link to="/" className="mb-5 inline-flex items-center gap-3"><span className="brand-glyph">N</span><span className="text-sm font-black tracking-[.28em]">NEXORA</span></Link><p className="eyebrow">YOUR NEXT COLLABORATION STARTS HERE</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{mode==='login'?'Welcome back.':'Create your orbit.'}</h1><p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">A smarter space for student builders, teams, and big ideas.</p></div><Link to="/" className="text-sm text-slate-400 hover:text-cyan-200">← Home</Link></div>
    <div className="mb-7 flex rounded-2xl border border-white/10 bg-black/20 p-1.5"><button type="button" onClick={()=>switchMode('login')} className={`auth-tab ${mode==='login'?'active':''}`}>Log in</button><button type="button" onClick={()=>switchMode('register')} className={`auth-tab ${mode==='register'?'active':''}`}>Create account</button></div>
    <form onSubmit={handleSubmit} className="space-y-4">{mode==='register' ? <div className="grid gap-4 sm:grid-cols-2">
      <label className="field-label">Full name<input autoComplete="name" className={inputClass} value={form.fullName} onChange={e=>handleChange('fullName',e.target.value)} placeholder="Your full name" required minLength={2} maxLength={80}/></label>
      <label className="field-label">Email address<input type="email" autoComplete="email" className={inputClass} value={form.email} onChange={e=>handleChange('email',e.target.value)} placeholder="you@college.edu" required/></label>
      <label className="field-label">Mobile number<input type="tel" autoComplete="tel" inputMode="tel" pattern="[+0-9 ()-]{8,20}" className={inputClass} value={form.mobileNumber} onChange={e=>handleChange('mobileNumber',e.target.value)} placeholder="+91 98765 43210" required/></label>
      <label className="field-label">Age<input type="number" min="13" max="100" className={inputClass} value={form.age} onChange={e=>handleChange('age',e.target.value)} placeholder="Age" required/></label>
      <label className="field-label sm:col-span-2">College / university<input autoComplete="organization" className={inputClass} value={form.collegeName} onChange={e=>handleChange('collegeName',e.target.value)} placeholder="College or university name" required maxLength={160}/></label>
      <label className="field-label">Degree / course <span className="optional">optional</span><input className={inputClass} value={form.degree} onChange={e=>handleChange('degree',e.target.value)} placeholder="B.Tech CSE"/></label>
      <label className="field-label">Branch / department <span className="optional">optional</span><input className={inputClass} value={form.branch} onChange={e=>handleChange('branch',e.target.value)} placeholder="CSE (AI & ML)"/></label>
      <label className="field-label sm:col-span-2">Skills <span className="optional">comma separated</span><input className={inputClass} value={form.skills} onChange={e=>handleChange('skills',e.target.value)} placeholder="Python, React, UI/UX"/></label>
    </div> : <label className="field-label">Email or mobile number<input autoComplete="username" className={inputClass} value={form.identifier} onChange={e=>handleChange('identifier',e.target.value)} placeholder="you@example.com or +91…" required/></label>}
    <label className="field-label">Password<input type="password" autoComplete={mode==='register'?'new-password':'current-password'} className={inputClass} value={form.password} onChange={e=>handleChange('password',e.target.value)} placeholder="At least 12 characters recommended" required minLength={8} maxLength={128}/></label>
    {mode==='register' && <p className="text-xs leading-5 text-slate-500">Use a unique password. NEXORA stores a one-way password hash, never a readable password.</p>}{error&&<p role="alert" className="status-error">{error}</p>}
    <button type="submit" disabled={busy} className="neon-button w-full rounded-xl px-5 py-3.5 font-bold text-slate-950 disabled:opacity-50">{busy?'Signing you in…':mode==='login'?'Log in ↗':'Create account ↗'}</button><p className="text-center text-xs text-slate-500">Password-protected session · Rate-limited authentication</p></form>
  </div></div>
}

function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ id?: string; fullName?: string; email?: string; isEmailVerified?: boolean; role?: string; collegeName?: string; degree?: string; branch?: string; academicYear?: string; bio?: string; skills?: string[]; interests?: string[] } | null>(null)
  const [recommendations, setRecommendations] = useState<Array<{
    id: string
    fullName: string
    collegeName?: string
    degree?: string
    skills?: string[]
    interests?: string[]
    matchScore?: number
    reasons?: string[]
  }>>([])
  const [teams, setTeams] = useState<Array<{
    id: string
    name: string
    projectTitle?: string
    description?: string
    technologies?: string[]
    requiredRoles?: string[]
    memberCount?: number
    maxTeamSize?: number
    isMember?: boolean
  }>>([])
  const [communities, setCommunities] = useState<Array<{
    id: string
    name: string
    description?: string
    category?: string
    membershipPolicy?: string
    visibility?: string
    memberCount?: number
    isMember?: boolean
    isAdmin?: boolean
    chatConversationId?: string
  }>>([])
  const [communityRequests, setCommunityRequests] = useState<Record<string, Array<{ id: string; userId: string; fullName: string }>>>({})
  const [connections, setConnections] = useState<DashboardConnection[]>([])
  const [communityInviteTarget, setCommunityInviteTarget] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Array<{
    id: string
    name?: string | null
    isGroup?: boolean
    communityId?: string | null
    participants?: Array<{ id: string; fullName: string; role?: string }>
    lastMessage?: { content?: string } | null
  }>>([])
  const [events, setEvents] = useState<DashboardEvent[]>([])
  const [pendingEvents, setPendingEvents] = useState<DashboardEvent[]>([])
  const [eventAlerts, setEventAlerts] = useState(true)
  const [eventForm, setEventForm] = useState({ title: '', hostName: '', location: '', startDate: '', registrationLink: '', category: '' })
  const [eventBusy, setEventBusy] = useState(false)
  const [eventNotice, setEventNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [connectionBusyId, setConnectionBusyId] = useState<string | null>(null)
  const [teamBusyId, setTeamBusyId] = useState<string | null>(null)
  const [connectionMessage, setConnectionMessage] = useState('Would love to connect and collaborate on exciting student projects.')
  const [quickAction, setQuickAction] = useState<'teammate' | 'team' | 'community' | 'events'>('teammate')
  const [teamForm, setTeamForm] = useState({
    name: '',
    projectTitle: '',
    description: '',
    technologies: '',
    requiredRoles: '',
    maxTeamSize: '5',
  })
  const [communityForm, setCommunityForm] = useState({
    name: '',
    description: '',
    category: '',
    membershipPolicy: 'OPEN',
    visibility: 'PUBLIC',
  })
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [creatingCommunity, setCreatingCommunity] = useState(false)
  const [studentQuery, setStudentQuery] = useState('')
  const [studentResults, setStudentResults] = useState<Array<{
    id: string
    fullName: string
    collegeName?: string
    degree?: string
    skills?: string[]
    interests?: string[]
    bio?: string
  }>>([])
  const [studentSearchBusy, setStudentSearchBusy] = useState(false)
  const [profileDraft, setProfileDraft] = useState({
    collegeName: '',
    degree: '',
    branch: '',
    academicYear: '',
    bio: '',
    skills: '',
    interests: '',
  })
  const [profileBusy, setProfileBusy] = useState(false)
  const [messageDraft, setMessageDraft] = useState('')
  const [messageBusy, setMessageBusy] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedGroupParticipantIds, setSelectedGroupParticipantIds] = useState<string[]>([])
  const [groupBusy, setGroupBusy] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([])
  const [messageHistoryBusy, setMessageHistoryBusy] = useState(false)
  const [chatNotice, setChatNotice] = useState('')
  const [actionNotice, setActionNotice] = useState('')
  const [notificationBusy, setNotificationBusy] = useState(false)

  const refreshDashboard = async () => {
    const profileResponse = await apiFetch<{ user?: { id?: string; fullName?: string; email?: string; isEmailVerified?: boolean; role?: string; collegeName?: string; degree?: string; branch?: string; academicYear?: string; bio?: string; skills?: string[]; interests?: string[] } }>('/auth/me')
    const optionalErrors: string[] = []
    const fetchOptional = async <T,>(path: string, fallback: T): Promise<T> => {
      try {
        return await apiFetch<T>(path)
      } catch (error) {
        optionalErrors.push(`${path}: ${(error as Error).message}`)
        return fallback
      }
    }
    const [recommendationResponse, teamsResponse, communitiesResponse, conversationsResponse, eventsResponse, settingsResponse, connectionsResponse] = await Promise.all([
      fetchOptional<{ data?: Array<{ id: string; fullName: string; collegeName?: string; degree?: string; skills?: string[]; interests?: string[]; matchScore?: number; reasons?: string[] }> }>('/discovery/recommendations', {}),
      fetchOptional<{ data?: Array<{ id: string; name: string; projectTitle?: string; description?: string; technologies?: string[]; requiredRoles?: string[]; memberCount?: number; maxTeamSize?: number; isMember?: boolean }> }>('/teams', {}),
      fetchOptional<{ data?: Array<{ id: string; name: string; description?: string; category?: string; membershipPolicy?: string; visibility?: string; memberCount?: number; isMember?: boolean; isAdmin?: boolean; chatConversationId?: string }> }>('/communities', {}),
      fetchOptional<{ data?: Array<{ id: string; name?: string | null; isGroup?: boolean; communityId?: string | null; participants?: Array<{ id: string; fullName: string; role?: string }>; lastMessage?: { content?: string } | null }> }>('/messages/conversations', {}),
      fetchOptional<{ data?: DashboardEvent[] }>('/events', {}),
      fetchOptional<{ settings?: { eventAlerts?: boolean } }>('/users/me/notifications', {}),
      fetchOptional<{ data?: DashboardConnection[] }>('/connections/requests', {}),
    ])

    setUser(profileResponse.user ?? null)
    setProfileDraft({
      collegeName: profileResponse.user?.collegeName ?? '',
      degree: profileResponse.user?.degree ?? '',
      branch: profileResponse.user?.branch ?? '',
      academicYear: profileResponse.user?.academicYear ?? '',
      bio: profileResponse.user?.bio ?? '',
      skills: Array.isArray(profileResponse.user?.skills) ? profileResponse.user!.skills.join(', ') : '',
      interests: Array.isArray(profileResponse.user?.interests) ? profileResponse.user!.interests.join(', ') : '',
    })
    setRecommendations(recommendationResponse.data ?? [])
    setTeams(teamsResponse.data ?? [])
    setCommunities(communitiesResponse.data ?? [])
    const requests = await Promise.all((communitiesResponse.data ?? [])
      .filter((community) => community.isAdmin)
      .map(async (community) => {
        const response = await fetchOptional<{ data?: Array<{ id: string; userId: string; fullName: string }> }>(`/communities/${community.id}/requests`, {})
        return [community.id, response.data ?? []] as const
      }))
    setCommunityRequests(Object.fromEntries(requests))
    setConversations(conversationsResponse.data ?? [])
    setConnections(connectionsResponse.data ?? [])
    setEvents(eventsResponse.data ?? [])
    setEventAlerts(settingsResponse.settings?.eventAlerts ?? true)
    if (profileResponse.user?.role === 'ADMIN') {
      const pendingResponse = await fetchOptional<{ data?: DashboardEvent[] }>('/events/pending', {})
      setPendingEvents(pendingResponse.data ?? [])
    } else {
      setPendingEvents([])
    }
    setDashboardError(optionalErrors.length ? optionalErrors.join(' ') : '')
  }

  useEffect(() => {
    async function loadDashboard() {
      try {
        await refreshDashboard()
        setDashboardError('')
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          navigate('/auth')
        } else {
          setDashboardError((error as Error).message)
        }
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [navigate])

  useEffect(() => {
    if (!selectedConversationId) return
    let active = true
    const refreshMessages = async () => {
      try {
        const response = await apiFetch<{ data?: ChatMessage[] }>(`/messages/conversations/${selectedConversationId}/messages`)
        if (active) setActiveMessages(response.data ?? [])
      } catch (error) {
        if (active) setChatNotice((error as Error).message)
      }
    }
    const interval = setInterval(() => void refreshMessages(), 5000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [selectedConversationId])

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', 'POST')
      navigate('/auth')
    } catch {
      navigate('/auth')
    }
  }

  const handleConnect = async (targetUserId: string) => {
    try {
      setConnectingId(targetUserId)
      setActionNotice('')
      await apiFetch('/connections/request', 'POST', { targetUserId, message: connectionMessage.trim() || undefined })
      setActionNotice('Connection request sent.')
      await refreshDashboard()
    } catch (error) {
      setActionNotice((error as Error).message)
    } finally {
      setConnectingId(null)
    }
  }

  const handleRespondToConnection = async (requestId: string, action: 'ACCEPT' | 'DECLINE') => {
    try {
      setConnectionBusyId(requestId)
      setActionNotice('')
      await apiFetch('/connections/respond', 'POST', { requestId, action })
      setActionNotice(action === 'ACCEPT' ? 'Connection accepted. You can now start a private chat.' : 'Connection request declined.')
      await refreshDashboard()
    } catch (error) {
      setActionNotice((error as Error).message)
    } finally {
      setConnectionBusyId(null)
    }
  }

  const handleMessageConnection = async (personId: string) => {
    try {
      setMessageBusy(true)
      setChatNotice('')
      const response = await apiFetch<{ data?: { id: string } }>('/messages/conversations', 'POST', {
        participantIds: [personId],
        isGroup: false,
      })
      if (!response.data?.id) throw new Error('The conversation was not created.')
      setSelectedConversationId(response.data.id)
      setActiveMessages([])
      await refreshDashboard()
      setChatNotice('Private conversation opened. Send the first message below.')
    } catch (error) {
      setChatNotice((error as Error).message)
    } finally {
      setMessageBusy(false)
    }
  }

  const handleJoinTeam = async (teamId: string) => {
    try {
      setTeamBusyId(teamId)
      setActionNotice('')
      await apiFetch(`/teams/${teamId}/join`, 'POST')
      setActionNotice('You joined the team.')
      await refreshDashboard()
    } catch (error) {
      setActionNotice((error as Error).message)
    } finally {
      setTeamBusyId(null)
    }
  }

  const getConnection = (personId: string) => connections.find((request) =>
    (request.senderId === user?.id && request.receiverId === personId)
    || (request.receiverId === user?.id && request.senderId === personId),
  )

  const handleCreateTeam = async () => {
    try {
      setCreatingTeam(true)
      await apiFetch('/teams', 'POST', {
        name: teamForm.name,
        projectTitle: teamForm.projectTitle,
        description: teamForm.description,
        technologies: teamForm.technologies.split(',').map((value) => value.trim()).filter(Boolean),
        requiredRoles: teamForm.requiredRoles.split(',').map((value) => value.trim()).filter(Boolean),
        maxTeamSize: Number(teamForm.maxTeamSize) || 5,
        visibility: 'PUBLIC',
      })
      setTeamForm({ name: '', projectTitle: '', description: '', technologies: '', requiredRoles: '', maxTeamSize: '5' })
      setQuickAction('team')
      await refreshDashboard()
    } catch (error) {
      setActionNotice((error as Error).message)
    } finally {
      setCreatingTeam(false)
    }
  }

  const handleCreateCommunity = async () => {
    try {
      setCreatingCommunity(true)
      await apiFetch('/communities', 'POST', {
        name: communityForm.name,
        description: communityForm.description,
        category: communityForm.category,
        membershipPolicy: communityForm.membershipPolicy,
        visibility: communityForm.visibility,
      })
      setCommunityForm({ name: '', description: '', category: '', membershipPolicy: 'OPEN', visibility: 'PUBLIC' })
      setQuickAction('community')
      await refreshDashboard()
    } catch (error) {
      setActionNotice((error as Error).message)
    } finally {
      setCreatingCommunity(false)
    }
  }

  const handleStudentSearch = async (nextQuery = studentQuery) => {
    try {
      setStudentSearchBusy(true)
      const params = new URLSearchParams()
      if (nextQuery.trim()) params.set('q', nextQuery.trim())
      params.set('limit', '5')

      const response = await apiFetch<{ data?: Array<{ id: string; fullName: string; collegeName?: string; degree?: string; skills?: string[]; interests?: string[]; bio?: string }> }>(`/discovery/students?${params.toString()}`)
      setStudentResults(response.data ?? [])
    } catch (error) {
      setActionNotice((error as Error).message)
      setStudentResults([])
    } finally {
      setStudentSearchBusy(false)
    }
  }

  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || selectedGroupParticipantIds.length === 0) return
    try {
      setGroupBusy(true)
      setChatNotice('')
      const response = await apiFetch<{ data?: { id: string } }>('/messages/conversations', 'POST', {
        name: groupName.trim(),
        participantIds: selectedGroupParticipantIds,
        isGroup: true,
      })
      if (!response.data?.id) throw new Error('The group chat was not created.')
      setGroupName('')
      setSelectedGroupParticipantIds([])
      setSelectedConversationId(response.data.id)
      setActiveMessages([])
      setChatNotice('Private group chat created. Only its members can read or send messages.')
      await refreshDashboard()
    } catch (error) {
      setChatNotice((error as Error).message)
    } finally {
      setGroupBusy(false)
    }
  }

  const handleOpenConversation = async (conversationId: string) => {
    try {
      setMessageHistoryBusy(true)
      setChatNotice('')
      setSelectedConversationId(conversationId)
      const response = await apiFetch<{ data?: ChatMessage[] }>(`/messages/conversations/${conversationId}/messages`)
      setActiveMessages(response.data ?? [])
    } catch (error) {
      setChatNotice((error as Error).message)
      setActiveMessages([])
    } finally {
      setMessageHistoryBusy(false)
    }
  }

  const handleSendChatMessage = async () => {
    if (!selectedConversationId || !messageDraft.trim()) return
    try {
      setMessageBusy(true)
      setChatNotice('')
      await apiFetch(`/messages/conversations/${selectedConversationId}/messages`, 'POST', {
        content: messageDraft.trim(),
      })
      setMessageDraft('')
      const response = await apiFetch<{ data?: ChatMessage[] }>(`/messages/conversations/${selectedConversationId}/messages`)
      setActiveMessages(response.data ?? [])
      await refreshDashboard()
    } catch (error) {
      setChatNotice((error as Error).message)
    } finally {
      setMessageBusy(false)
    }
  }

  const handleJoinCommunity = async (communityId: string) => {
    try {
      setActionNotice('')
      const response = await apiFetch<{ status?: string; message?: string }>(`/communities/${communityId}/join`, 'POST')
      setActionNotice(response.message ?? 'Club membership updated.')
      await refreshDashboard()
    } catch (error) {
      setActionNotice((error as Error).message)
    }
  }

  const handleLeaveCommunity = async (communityId: string) => {
    try {
      setActionNotice('')
      const response = await apiFetch<{ message?: string }>(`/communities/${communityId}/leave`, 'POST')
      setActionNotice(response.message ?? 'You left the club.')
      await refreshDashboard()
    } catch (error) {
      setActionNotice((error as Error).message)
    }
  }

  const handleInviteToCommunity = async (communityId: string, userId: string) => {
    try {
      const response = await apiFetch<{ added?: number }>(`/communities/${communityId}/invite`, 'POST', { userIds: [userId] })
      setActionNotice(response.added ? 'Student added to the club and its private chat.' : 'That student is already a club member.')
      await refreshDashboard()
    } catch (error) {
      setActionNotice((error as Error).message)
    }
  }

  const handleReviewCommunityRequest = async (communityId: string, requestId: string, action: 'APPROVE' | 'DECLINE') => {
    try {
      await apiFetch(`/communities/${communityId}/requests/${requestId}`, 'POST', { action })
      setActionNotice(action === 'APPROVE' ? 'Student approved and added to the club chat.' : 'Membership request declined.')
      await refreshDashboard()
    } catch (error) {
      setActionNotice((error as Error).message)
    }
  }

  const handleToggleEventInterest = async (event: DashboardEvent) => {
    try {
      setEventNotice('')
      await apiFetch(`/events/${event.id}/interest`, event.isInterested ? 'DELETE' : 'POST')
      setEvents((current) => current.map((item) => item.id === event.id ? { ...item, isInterested: !event.isInterested } : item))
      setEventNotice(event.isInterested ? 'Event reminder cancelled.' : 'You are interested. We will email a reminder about 24 hours before it starts if email alerts are enabled.')
    } catch (error) {
      setEventNotice((error as Error).message)
    }
  }

  const handleReviewEvent = async (eventId: string, action: 'PUBLISH' | 'REJECT') => {
    try {
      await apiFetch(`/events/${eventId}/review`, 'POST', { action })
      setEventNotice(action === 'PUBLISH' ? 'Event published and visible to students.' : 'Event submission rejected.')
      await refreshDashboard()
    } catch (error) {
      setEventNotice((error as Error).message)
    }
  }

  const handleSaveEventAlerts = async () => {
    try {
      setNotificationBusy(true)
      const response = await apiFetch<{ settings?: { eventAlerts?: boolean } }>('/users/me/notifications', 'PUT', {
        eventAlerts,
      })
      setEventAlerts(response.settings?.eventAlerts ?? eventAlerts)
      setEventNotice(eventAlerts ? 'Upcoming-event email alerts are enabled.' : 'Upcoming-event email alerts are disabled.')
    } catch (error) {
      setEventNotice((error as Error).message)
    } finally {
      setNotificationBusy(false)
    }
  }

  const handleSubmitEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.startDate) return
    try {
      setEventBusy(true)
      setEventNotice('')
      const startDate = new Date(eventForm.startDate).toISOString()
      await apiFetch('/events', 'POST', {
        title: eventForm.title.trim(),
        hostName: eventForm.hostName.trim() || undefined,
        location: eventForm.location.trim() || undefined,
        startDate,
        registrationLink: eventForm.registrationLink.trim() || undefined,
        category: eventForm.category.trim() || undefined,
      })
      setEventForm({ title: '', hostName: '', location: '', startDate: '', registrationLink: '', category: '' })
      setEventNotice('Event submitted for admin review. It will appear in discovery once approved.')
    } catch (error) {
      setEventNotice((error as Error).message)
    } finally {
      setEventBusy(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setProfileBusy(true)
      await apiFetch('/users/me/onboarding', 'PUT', {
        collegeName: profileDraft.collegeName,
        degree: profileDraft.degree,
        branch: profileDraft.branch,
        academicYear: profileDraft.academicYear,
        bio: profileDraft.bio,
        skills: profileDraft.skills.split(',').map((value) => value.trim()).filter(Boolean),
        interests: profileDraft.interests.split(',').map((value) => value.trim()).filter(Boolean),
      })
      await refreshDashboard()
    } catch (error) {
      setActionNotice((error as Error).message)
    } finally {
      setProfileBusy(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#080b14] text-slate-100">Loading dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-[#080b14] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_0_50px_rgba(15,23,42,0.7)]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Welcome back, {user?.fullName ?? 'Student'}</h1>
          </div>
          <button onClick={handleLogout} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-violet-400 hover:text-white">
            Log out
          </button>
        </div>
        {actionNotice && <p role="status" className="mb-5 rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-100">{actionNotice}</p>}
        {dashboardError && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            <span>Dashboard data could not be loaded: {dashboardError}</span>
            <button type="button" onClick={() => void refreshDashboard().then(() => setDashboardError('')).catch((error) => setDashboardError((error as Error).message))} className="rounded-full border border-rose-300/40 px-3 py-1.5 font-semibold hover:bg-rose-500/20">
              Retry
            </button>
          </div>
        )}
        <nav aria-label="Dashboard sections" className="sticky top-2 z-10 mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/95 p-2 backdrop-blur">
          {[
            ['people', 'People'],
            ['connections', 'Requests'],
            ['workspace', 'Workspace'],
            ['teams', 'Teams'],
            ['communities', 'Clubs'],
            ['messages', 'Messages'],
            ['events', 'Events'],
            ['profile', 'Profile'],
          ].map(([id, label]) => (
            <a
              key={id}
              href={id === 'events' ? '#workspace' : `#${id}`}
              onClick={id === 'events' ? () => setQuickAction('events') : undefined}
              className="shrink-0 rounded-full px-3 py-2 text-sm text-slate-200 transition hover:bg-violet-500/15 hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <p className="text-slate-400">Email</p>
            <p className="mt-2 text-lg font-semibold text-white">{user?.email ?? 'N/A'}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <p className="text-slate-400">Verification</p>
            <p className="mt-2 text-lg font-semibold text-white">{user?.isEmailVerified ? 'Verified' : 'Pending'}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <p className="text-slate-400">Next action</p>
            <p className="mt-2 text-lg font-semibold text-white">Connect with builders</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div id="people" className="scroll-mt-24 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm uppercase tracking-[0.22em] text-violet-300">Recommended people</p>
              <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200">{recommendations.length} matches</span>
            </div>

            {recommendations.length === 0 ? (
              <p className="text-slate-300">No recommendations yet. Complete your onboarding profile to unlock stronger matches.</p>
            ) : (
              <div className="space-y-4">
                {recommendations.map((person) => (
                  <div key={person.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-white">{person.fullName}</p>
                        <p className="text-sm text-slate-400">{person.collegeName ?? 'Student'} • {person.degree ?? 'Open to collaboration'}</p>
                      </div>
                      <button
                        onClick={() => void handleConnect(person.id)}
                        disabled={connectingId === person.id || Boolean(getConnection(person.id))}
                        className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {connectingId === person.id ? 'Sending...' : getConnection(person.id)?.status === 'ACCEPT' ? 'Connected' : getConnection(person.id)?.status === 'DECLINE' ? 'Request declined' : getConnection(person.id) ? 'Request pending' : 'Connect'}
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(person.skills ?? []).slice(0, 3).map((skill) => (
                        <span key={skill} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">{skill}</span>
                      ))}
                    </div>

                    <div className="mt-3 text-sm text-slate-300">
                      <p className="font-medium text-violet-200">Match score: {person.matchScore ?? 0}</p>
                      <ul className="mt-2 space-y-1 text-slate-300">
                        {(person.reasons ?? []).map((reason) => (
                          <li key={reason}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div id="connections" className="mt-6 scroll-mt-24 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-violet-100">Connection requests</p>
                <span className="rounded-full border border-violet-300/20 px-2 py-1 text-xs text-violet-100">
                  {connections.filter((request) => request.receiverId === user?.id && request.status === 'PENDING').length} to review
                </span>
              </div>
              <label className="mt-3 block text-xs text-slate-300">
                Note to include with your requests
                <input value={connectionMessage} onChange={(event) => setConnectionMessage(event.target.value)} maxLength={300} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" />
              </label>
              <div className="mt-3 space-y-2">
                {connections.filter((request) => request.status === 'PENDING' || request.status === 'ACCEPT').length === 0 ? (
                  <p className="text-sm text-slate-400">New incoming and outgoing requests will appear here.</p>
                ) : connections.filter((request) => request.status === 'PENDING' || request.status === 'ACCEPT').map((request) => {
                  const incoming = request.receiverId === user?.id
                  const otherPerson = incoming ? request.sender : request.receiver
                  return (
                    <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{otherPerson?.fullName ?? 'NEXORA member'}</p>
                        <p className="mt-1 text-xs text-slate-400">{request.status === 'ACCEPT' ? 'Connected' : incoming ? 'Wants to connect with you' : 'Request sent'}{request.message ? ` · “${request.message}”` : ''}</p>
                      </div>
                      {request.status === 'ACCEPT' ? (
                        <button type="button" onClick={() => void handleMessageConnection(otherPerson?.id ?? (incoming ? request.senderId : request.receiverId))} disabled={messageBusy} className="rounded-full border border-cyan-400/30 px-3 py-1.5 text-xs text-cyan-100 disabled:opacity-50">
                          {messageBusy ? 'Opening...' : 'Message'}
                        </button>
                      ) : incoming ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => void handleRespondToConnection(request.id, 'ACCEPT')} disabled={connectionBusyId === request.id} className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs text-emerald-100 disabled:opacity-50">
                            {connectionBusyId === request.id ? 'Saving...' : 'Accept'}
                          </button>
                          <button type="button" onClick={() => void handleRespondToConnection(request.id, 'DECLINE')} disabled={connectionBusyId === request.id} className="rounded-full border border-rose-400/30 px-3 py-1.5 text-xs text-rose-100 disabled:opacity-50">
                            Decline
                          </button>
                        </div>
                      ) : <span className="text-xs text-amber-200">Pending</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div id="workspace" className="scroll-mt-24 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Quick actions</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { id: 'teammate', label: 'Find a teammate' },
                  { id: 'team', label: 'Create a team' },
                  { id: 'community', label: 'Explore clubs' },
                  { id: 'events', label: 'Discover events' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setQuickAction(item.id as typeof quickAction)}
                    className={`rounded-full border px-3 py-2 text-sm ${quickAction === item.id ? 'border-violet-400 bg-violet-500/10 text-violet-100' : 'border-white/10 bg-slate-900 text-slate-200'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {quickAction === 'teammate' && (
                <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                  <div className="flex gap-2">
                    <input value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Search by skill, name, or college" />
                    <button type="button" onClick={() => handleStudentSearch()} disabled={studentSearchBusy} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
                      {studentSearchBusy ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {studentResults.length === 0 ? (
                      <p className="text-sm text-slate-300">No students matched yet. Try a skill like React, AI, or Design.</p>
                    ) : (
                      studentResults.map((student) => (
                        <div key={student.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-white">{student.fullName}</p>
                              <p className="text-xs text-slate-400">{student.collegeName ?? 'Student'} • {student.degree ?? 'Open to collaboration'}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleConnect(student.id)}
                              disabled={connectingId === student.id || Boolean(getConnection(student.id))}
                              className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {connectingId === student.id ? 'Sending...' : getConnection(student.id)?.status === 'ACCEPT' ? 'Connected' : getConnection(student.id)?.status === 'DECLINE' ? 'Request declined' : getConnection(student.id) ? 'Request pending' : 'Connect'}
                            </button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <label className="flex items-center gap-2 text-xs text-slate-300">
                              <input
                                type="checkbox"
                                checked={selectedGroupParticipantIds.includes(student.id)}
                                onChange={(event) => setSelectedGroupParticipantIds((current) =>
                                  event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id),
                                )}
                              />
                              Add to new group chat
                            </label>
                            {communityInviteTarget && (
                              <button
                                type="button"
                                onClick={() => void handleInviteToCommunity(communityInviteTarget, student.id)}
                                className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-100"
                              >
                                Invite to club
                              </button>
                            )}
                          </div>
                          <p className="mt-2 text-xs text-slate-300">{student.bio ?? 'Looking to build and learn with a motivated, cross-functional team.'}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(student.skills ?? []).slice(0, 3).map((skill) => (
                              <span key={skill} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-200">{skill}</span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-2 rounded-xl border border-violet-400/20 bg-violet-500/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-200">Create private group chat</p>
                    <input
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white"
                      placeholder="Group name"
                      maxLength={80}
                    />
                    <p className="text-xs text-slate-400">{selectedGroupParticipantIds.length} student(s) selected. Search above and select members.</p>
                    <button
                      type="button"
                      onClick={handleCreateGroupChat}
                      disabled={groupBusy || selectedGroupParticipantIds.length === 0 || !groupName.trim()}
                      className="w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {groupBusy ? 'Creating private chat...' : 'Create group chat'}
                    </button>
                  </div>
                </div>
              )}

              {quickAction === 'team' && (
                <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                  <input value={teamForm.name} onChange={(event) => setTeamForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Team name" />
                  <input value={teamForm.projectTitle} onChange={(event) => setTeamForm((current) => ({ ...current, projectTitle: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Project title" />
                  <textarea value={teamForm.description} onChange={(event) => setTeamForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Short team description" rows={3} />
                  <input value={teamForm.technologies} onChange={(event) => setTeamForm((current) => ({ ...current, technologies: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Technologies, comma separated" />
                  <input value={teamForm.requiredRoles} onChange={(event) => setTeamForm((current) => ({ ...current, requiredRoles: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Roles needed" />
                  <div className="flex items-center gap-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Size</label>
                    <input type="number" min={2} max={12} value={teamForm.maxTeamSize} onChange={(event) => setTeamForm((current) => ({ ...current, maxTeamSize: event.target.value }))} className="w-20 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" />
                  </div>
                  <button type="button" onClick={handleCreateTeam} disabled={creatingTeam || !teamForm.name.trim()} className="w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">
                    {creatingTeam ? 'Creating team...' : 'Create team'}
                  </button>
                </div>
              )}

              {quickAction === 'community' && (
                <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                  <input value={communityForm.name} onChange={(event) => setCommunityForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Community name" />
                  <input value={communityForm.category} onChange={(event) => setCommunityForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Category" />
                  <textarea value={communityForm.description} onChange={(event) => setCommunityForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Community description" rows={3} />
                  <select value={communityForm.membershipPolicy} onChange={(event) => setCommunityForm((current) => ({ ...current, membershipPolicy: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white">
                    <option value="OPEN">Open</option>
                    <option value="APPROVAL_REQUIRED">Approval required</option>
                  </select>
                  <select value={communityForm.visibility} onChange={(event) => setCommunityForm((current) => ({ ...current, visibility: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white">
                    <option value="PUBLIC">Public club listing</option>
                    <option value="PRIVATE">Private, invite-only club</option>
                  </select>
                  <button type="button" onClick={handleCreateCommunity} disabled={creatingCommunity || !communityForm.name.trim()} className="w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">
                    {creatingCommunity ? 'Creating community...' : 'Create community'}
                  </button>
                </div>
              )}

              {quickAction === 'events' && (
                <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                  {user?.role === 'ADMIN' && (
                    <div className="space-y-2 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-200">Event review queue ({pendingEvents.length})</p>
                      {pendingEvents.length === 0 ? <p className="text-xs text-slate-400">No pending submissions.</p> : pendingEvents.map((event) => (
                        <div key={event.id} className="rounded-lg border border-white/10 p-2">
                          <p className="text-sm font-medium text-white">{event.title}</p>
                          <p className="text-xs text-slate-400">{event.startDate ? new Date(event.startDate).toLocaleString() : 'Date unavailable'}</p>
                          <div className="mt-2 flex gap-3 text-xs">
                            <button type="button" onClick={() => void handleReviewEvent(event.id, 'PUBLISH')} className="text-emerald-200">Publish</button>
                            <button type="button" onClick={() => void handleReviewEvent(event.id, 'REJECT')} className="text-rose-200">Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">Upcoming published events</p>
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input type="checkbox" checked={eventAlerts} onChange={(event) => setEventAlerts(event.target.checked)} />
                      Email me reminders
                    </label>
                  </div>
                  <button type="button" onClick={handleSaveEventAlerts} disabled={notificationBusy} className="rounded-full border border-cyan-400/30 px-3 py-1.5 text-xs text-cyan-100 disabled:opacity-50">
                    {notificationBusy ? 'Saving...' : 'Save email preference'}
                  </button>
                  {events.length === 0 ? (
                    <p className="text-sm text-slate-300">No upcoming published events yet. Student submissions appear after admin review.</p>
                  ) : events.map((event) => (
                    <div key={event.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">{event.title}</p>
                        {event.category && <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-violet-200">{event.category}</span>}
                      </div>
                      <p className="mt-2 text-sm text-slate-300">
                        {event.startDate ? new Date(event.startDate).toLocaleString() : 'Date to be announced'}
                        {event.location ? ` • ${event.location}` : ''}
                      </p>
                      {event.hostName && <p className="mt-1 text-xs text-slate-400">Hosted by {event.hostName}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => void handleToggleEventInterest(event)} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950">
                          {event.isInterested ? 'Cancel reminder' : 'I’m interested'}
                        </button>
                        {event.registrationLink && <a href={event.registrationLink} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-200">Registration link</a>}
                      </div>
                    </div>
                  ))}
                  <details className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-cyan-200">Submit a hackathon or campus event</summary>
                    <div className="mt-3 space-y-2">
                      <input value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Event title" maxLength={160} />
                      <input value={eventForm.hostName} onChange={(event) => setEventForm((current) => ({ ...current, hostName: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Organizer" maxLength={160} />
                      <input value={eventForm.location} onChange={(event) => setEventForm((current) => ({ ...current, location: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Location or online" maxLength={200} />
                      <input type="datetime-local" value={eventForm.startDate} onChange={(event) => setEventForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" aria-label="Event start date and time" />
                      <input value={eventForm.registrationLink} onChange={(event) => setEventForm((current) => ({ ...current, registrationLink: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Registration URL (optional)" type="url" />
                      <input value={eventForm.category} onChange={(event) => setEventForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Category (e.g. Hackathon)" maxLength={60} />
                      <button type="button" onClick={handleSubmitEvent} disabled={eventBusy || !eventForm.title.trim() || !eventForm.startDate} className="w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
                        {eventBusy ? 'Submitting...' : 'Submit for review'}
                      </button>
                    </div>
                  </details>
                  {eventNotice && <p role="status" className="text-sm text-cyan-100">{eventNotice}</p>}
                </div>
              )}

              <div id="profile" className="mt-4 scroll-mt-24 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Profile</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input value={profileDraft.collegeName} onChange={(event) => setProfileDraft((current) => ({ ...current, collegeName: event.target.value }))} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="College" />
                  <input value={profileDraft.degree} onChange={(event) => setProfileDraft((current) => ({ ...current, degree: event.target.value }))} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Degree" />
                  <input value={profileDraft.branch} onChange={(event) => setProfileDraft((current) => ({ ...current, branch: event.target.value }))} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Branch" />
                  <input value={profileDraft.academicYear} onChange={(event) => setProfileDraft((current) => ({ ...current, academicYear: event.target.value }))} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Academic year" />
                </div>
                <textarea value={profileDraft.bio} onChange={(event) => setProfileDraft((current) => ({ ...current, bio: event.target.value }))} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" rows={3} placeholder="Bio" />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input value={profileDraft.skills} onChange={(event) => setProfileDraft((current) => ({ ...current, skills: event.target.value }))} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Skills, comma separated" />
                  <input value={profileDraft.interests} onChange={(event) => setProfileDraft((current) => ({ ...current, interests: event.target.value }))} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Interests, comma separated" />
                </div>
                <button type="button" onClick={handleSaveProfile} disabled={profileBusy} className="mt-3 w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
                  {profileBusy ? 'Saving profile...' : 'Save profile'}
                </button>
              </div>

            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-violet-300">Status</p>
              <p className="mt-4 text-slate-300">Your session protects dashboard and chat APIs. Local mock-data changes are temporary; configure PostgreSQL for persistent accounts and messages.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          <div id="teams" className="scroll-mt-24 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.22em] text-violet-300">Teams</p>
              <span className="text-xs text-slate-400">{teams.length} live</span>
            </div>
            <div className="space-y-3">
              {teams.length === 0 ? (
                <p className="text-slate-300">No teams yet — be the first to start one.</p>
              ) : (
                teams.slice(0, 3).map((team) => (
                  <div key={team.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-white">{team.name}</p>
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200">{team.memberCount ?? 1}/{team.maxTeamSize ?? 5} members</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{team.projectTitle ?? 'Open project idea'}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(team.technologies ?? []).slice(0, 3).map((tech) => (
                        <span key={tech} className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-[10px] text-violet-200">{tech}</span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleJoinTeam(team.id)}
                      disabled={team.isMember || teamBusyId === team.id || (team.memberCount ?? 0) >= (team.maxTeamSize ?? 5)}
                      className="mt-3 rounded-full border border-cyan-400/30 px-3 py-1.5 text-xs text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {team.isMember ? 'Joined' : teamBusyId === team.id ? 'Joining...' : (team.memberCount ?? 0) >= (team.maxTeamSize ?? 5) ? 'Team full' : 'Join team'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div id="communities" className="scroll-mt-24 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Communities</p>
              <span className="text-xs text-slate-400">{communities.length} active</span>
            </div>
            <div className="space-y-3">
              {communities.length === 0 ? (
                <p className="text-slate-300">No communities yet — start a new student circle.</p>
              ) : (
                communities.map((community) => (
                  <div key={community.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-white">{community.name}</p>
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200">{community.membershipPolicy ?? 'OPEN'}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{community.description ?? community.category ?? 'Student community'}</p>
                    <p className="mt-2 text-xs text-slate-400">{community.memberCount ?? 0} members</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {community.isMember ? (
                        <>
                          <button type="button" onClick={() => community.chatConversationId && void handleOpenConversation(community.chatConversationId)} disabled={!community.chatConversationId} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-50">
                            Open private club chat
                          </button>
                          <button type="button" onClick={() => void handleLeaveCommunity(community.id)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300">Leave club</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => void handleJoinCommunity(community.id)} className="rounded-full border border-cyan-400/30 px-3 py-1.5 text-xs text-cyan-100">
                          {community.membershipPolicy === 'APPROVAL_REQUIRED' ? 'Request to join' : 'Join club'}
                        </button>
                      )}
                      {community.isAdmin && (
                        <button type="button" onClick={() => { setCommunityInviteTarget(community.id); setQuickAction('teammate') }} className="rounded-full border border-violet-400/30 px-3 py-1.5 text-xs text-violet-100">
                          Find members to invite
                        </button>
                      )}
                    </div>
                    {community.isAdmin && (communityRequests[community.id] ?? []).length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                        <p className="text-xs font-semibold text-violet-200">Membership requests</p>
                        {(communityRequests[community.id] ?? []).map((request) => (
                          <div key={request.id} className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-slate-200">{request.fullName}</span>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => void handleReviewCommunityRequest(community.id, request.id, 'APPROVE')} className="text-emerald-200">Approve</button>
                              <button type="button" onClick={() => void handleReviewCommunityRequest(community.id, request.id, 'DECLINE')} className="text-rose-200">Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div id="messages" className="scroll-mt-24 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.22em] text-violet-300">Messages</p>
              <span className="text-xs text-slate-400">{conversations.length} chats</span>
            </div>
            <div className="space-y-3">
              {conversations.length === 0 ? (
                <p className="text-slate-300">No conversations yet — find collaborators and start chatting.</p>
              ) : (
                conversations.map((conversation) => (
                  <button type="button" key={conversation.id} onClick={() => void handleOpenConversation(conversation.id)} className={`w-full rounded-2xl border p-3 text-left ${selectedConversationId === conversation.id ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/10 bg-slate-900/60'}`}>
                    <p className="font-semibold text-white">{conversation.name ?? conversation.participants?.map((person) => person.fullName).join(', ') ?? 'Conversation'}</p>
                    <p className="mt-1 text-sm text-slate-300">{conversation.lastMessage?.content ?? 'Start the conversation'}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-cyan-200">{conversation.communityId ? 'Private club chat' : conversation.isGroup ? 'Private group chat' : 'Private direct chat'}</p>
                  </button>
                ))
              )}
            </div>
            {selectedConversationId && (
              <div className="mt-4 rounded-2xl border border-violet-400/20 bg-slate-900/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-200">Private conversation</p>
                <div className="my-3 max-h-64 space-y-2 overflow-y-auto">
                  {messageHistoryBusy ? <p className="text-sm text-slate-400">Loading messages...</p> : activeMessages.length === 0 ? <p className="text-sm text-slate-400">No messages yet. Start the conversation.</p> : activeMessages.map((message) => (
                    <div key={message.id} className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${message.senderId === user?.id ? 'ml-auto bg-violet-500/20 text-violet-50' : 'bg-slate-950 text-slate-200'}`}>
                      <p>{message.content}</p>
                      <time className="mt-1 block text-[10px] text-slate-400">{new Date(message.createdAt).toLocaleString()}</time>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void handleSendChatMessage() }} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white" placeholder="Write a private message" maxLength={2000} />
                  <button type="button" onClick={handleSendChatMessage} disabled={messageBusy || !messageDraft.trim()} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{messageBusy ? 'Sending...' : 'Send'}</button>
                </div>
                {chatNotice && <p role="status" className="mt-2 text-xs text-cyan-100">{chatNotice}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  )
}
