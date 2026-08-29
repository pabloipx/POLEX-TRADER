import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Bitcoin,
  Blocks,
  Check,
  ChevronRight,
  CircleDollarSign,
  Globe2,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react"
import { CryptoTicker } from "@/components/landing/crypto-ticker"
import { LiveChart } from "@/components/landing/live-chart"
import { HeroBackground } from "@/components/landing/hero-background"

export const metadata = {
  title: "POLEX — Trading de cripto em tempo real",
  description:
    "Acompanhe o mercado cripto, teste estratégias na conta demo e opere em uma plataforma rápida, simples e segura.",
}

const features = [
  {
    icon: Zap,
    eyebrow: "VELOCIDADE",
    title: "Execução em tempo real",
    desc: "Uma experiência fluida para acompanhar movimentos do mercado sem perder o ritmo.",
  },
  {
    icon: BarChart3,
    eyebrow: "MERCADO",
    title: "Gráficos que fazem sentido",
    desc: "Leitura direta de candles, tendências e variações em uma interface focada na decisão.",
  },
  {
    icon: WalletCards,
    eyebrow: "CONTROLE",
    title: "Sua banca, suas regras",
    desc: "Visão clara de saldo, histórico e movimentações para operar com mais controle.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "PROTEÇÃO",
    title: "Segurança em cada etapa",
    desc: "Camadas de proteção para acesso, dados e movimentações dentro da plataforma.",
  },
]

const marketRows = [
  { pair: "BTC / USDT", price: "$64.973,78", change: "+1,47%", volume: "$28,4B" },
  { pair: "ETH / USDT", price: "$3.481,20", change: "+2,96%", volume: "$14,8B" },
  { pair: "SOL / USDT", price: "$142,88", change: "+0,84%", volume: "$3,7B" },
]

export default function HomePage() {
  return (
    <main id="top" className="landing-crypto min-h-screen overflow-hidden bg-[var(--landing-bg)] text-[var(--landing-text)]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--landing-line)] bg-[color:var(--landing-bg)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="#top" aria-label="POLEX — início" className="flex items-center gap-3">
            <img src="/images/fidelity-logo.png" alt="POLEX" className="h-8 w-auto object-contain" />
            <span className="hidden items-center gap-2 border-l border-[var(--landing-line)] pl-3 font-mono text-[10px] tracking-[0.16em] text-[var(--landing-muted)] sm:flex">
              <span className="size-1.5 rounded-full bg-[var(--landing-primary)] shadow-[0_0_10px_var(--landing-primary)]" />
              MARKET ONLINE
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
            <Link href="#mercado" className="text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-text)]">Mercado</Link>
            <Link href="#plataforma" className="text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-text)]">Plataforma</Link>
            <Link href="#recursos" className="text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-text)]">Recursos</Link>
            <Link href="#seguranca" className="text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-text)]">Segurança</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="px-3 py-2 text-sm font-semibold text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-text)]">Entrar</Link>
            <Link href="/auth/sign-up" className="inline-flex items-center gap-2 rounded-md bg-[var(--landing-primary)] px-4 py-2 text-sm font-bold text-[var(--landing-primary-foreground)] transition-transform hover:-translate-y-0.5">
              Criar conta <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative border-b border-[var(--landing-line)] pt-16">
        <HeroBackground />
        <div className="relative z-10 mx-auto grid min-h-[720px] max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--landing-primary)]/30 bg-[var(--landing-primary)]/10 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-[var(--landing-primary)]">
              <Radio className="size-3" /> MERCADO CRIPTO 24/7
            </div>
            <h1 className="text-balance text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              O mercado cripto,
              <span className="mt-2 block text-[var(--landing-primary)]">na sua frequência.</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
              Acompanhe ativos digitais, teste estratégias com saldo demo e opere em uma plataforma construída para decisões rápidas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/sign-up" className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--landing-primary)] px-7 py-3.5 font-bold text-[var(--landing-primary-foreground)] transition-transform hover:-translate-y-0.5">
                Começar agora <ArrowRight className="size-4" />
              </Link>
              <Link href="#plataforma" className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--landing-line-strong)] bg-[var(--landing-panel)] px-7 py-3.5 font-semibold transition-colors hover:border-[var(--landing-primary)]/50">
                Explorar plataforma <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[11px] text-[var(--landing-muted)]">
              {['Conta demo gratuita', 'Acesso 24/7', 'Ambiente protegido'].map((item) => (
                <span key={item} className="flex items-center gap-2"><Check className="size-3 text-[var(--landing-primary)]" />{item}</span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="mb-3 flex items-center justify-between font-mono text-[10px] tracking-wider text-[var(--landing-muted)]">
              <span>POLEX / LIVE TERMINAL</span>
              <span className="flex items-center gap-2 text-[var(--landing-primary)]"><span className="size-1.5 rounded-full bg-current" /> CONECTADO</span>
            </div>
            <LiveChart />
            <div className="mt-3 grid grid-cols-3 border border-[var(--landing-line)] bg-[var(--landing-panel)]">
              {[['VOLUME 24H', '$46,8B'], ['DOMINÂNCIA BTC', '54,2%'], ['ATIVOS ONLINE', '60+']].map(([label, value], index) => (
                <div key={label} className={`px-3 py-3 ${index ? 'border-l border-[var(--landing-line)]' : ''}`}>
                  <p className="font-mono text-[9px] text-[var(--landing-muted)]">{label}</p>
                  <p className="mt-1 font-mono text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div id="mercado" className="relative z-10 scroll-mt-16 border-t border-[var(--landing-line)] bg-[var(--landing-bg)]/85">
          <CryptoTicker />
        </div>
      </section>

      <section id="plataforma" className="scroll-mt-16 border-b border-[var(--landing-line)] px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="font-mono text-xs tracking-[0.16em] text-[var(--landing-primary)]">02 / MERCADO AO VIVO</p>
              <h2 className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-5xl">Dados claros. Decisões sem ruído.</h2>
              <p className="mt-5 text-pretty leading-relaxed text-[var(--landing-muted)]">Uma visão direta dos principais pares, com preço, variação e volume organizados como em uma exchange profissional.</p>
            </div>
            <div className="overflow-hidden border border-[var(--landing-line)] bg-[var(--landing-panel)]">
              <div className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr] border-b border-[var(--landing-line)] px-4 py-3 font-mono text-[9px] tracking-wider text-[var(--landing-muted)]">
                <span>PAR</span><span>PREÇO</span><span>24H</span><span className="text-right">VOLUME</span>
              </div>
              {marketRows.map((row) => (
                <div key={row.pair} className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr] items-center border-b border-[var(--landing-line)] px-4 py-4 font-mono text-xs last:border-0 sm:text-sm">
                  <span className="flex items-center gap-2 font-bold"><Bitcoin className="size-4 text-[var(--landing-primary)]" />{row.pair}</span>
                  <span>{row.price}</span><span className="text-[var(--landing-primary)]">{row.change}</span><span className="text-right text-[var(--landing-muted)]">{row.volume}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="scroll-mt-16 px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-mono text-xs tracking-[0.16em] text-[var(--landing-primary)]">03 / INFRAESTRUTURA</p>
            <h2 className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-5xl">Feita para quem leva o mercado a sério.</h2>
          </div>
          <div className="mt-12 grid border-l border-t border-[var(--landing-line)] sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="group border-b border-r border-[var(--landing-line)] bg-[var(--landing-panel)] p-6 transition-colors hover:bg-[var(--landing-panel-raised)]">
                <div className="flex items-center justify-between">
                  <feature.icon className="size-6 text-[var(--landing-primary)]" />
                  <span className="font-mono text-[9px] tracking-widest text-[var(--landing-muted)]">{feature.eyebrow}</span>
                </div>
                <h3 className="mt-16 text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)]">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="seguranca" className="scroll-mt-16 border-y border-[var(--landing-line)] bg-[var(--landing-panel)] px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative overflow-hidden border border-[var(--landing-line-strong)] bg-[var(--landing-bg)] p-8">
            <div className="landing-security-grid absolute inset-0 opacity-40" />
            <LockKeyhole className="relative size-10 text-[var(--landing-primary)]" />
            <p className="relative mt-24 font-mono text-[10px] tracking-[0.16em] text-[var(--landing-primary)]">SECURITY LAYER / ACTIVE</p>
            <p className="relative mt-3 max-w-md text-2xl font-black">Proteção não é detalhe. É infraestrutura.</p>
          </div>
          <div>
            <p className="font-mono text-xs tracking-[0.16em] text-[var(--landing-primary)]">04 / SEGURANÇA</p>
            <h2 className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-5xl">Sua experiência protegida, ponta a ponta.</h2>
            <div className="mt-8 flex flex-col gap-5">
              {[
                [Blocks, 'Arquitetura monitorada', 'Processos estruturados para manter a plataforma estável e disponível.'],
                [CircleDollarSign, 'Movimentações transparentes', 'Histórico e saldos apresentados com clareza em cada etapa.'],
                [Globe2, 'Acesso em qualquer dispositivo', 'Uma experiência consistente no desktop, tablet ou celular.'],
              ].map(([Icon, title, desc]) => {
                const ItemIcon = Icon as typeof Blocks
                return <div key={title as string} className="flex gap-4"><ItemIcon className="mt-1 size-5 shrink-0 text-[var(--landing-primary)]" /><div><h3 className="font-bold">{title as string}</h3><p className="mt-1 text-sm leading-relaxed text-[var(--landing-muted)]">{desc as string}</p></div></div>
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 border border-[var(--landing-primary)]/30 bg-[var(--landing-primary)]/[0.06] p-8 sm:p-12 lg:flex-row lg:items-center">
          <div><p className="font-mono text-xs tracking-[0.16em] text-[var(--landing-primary)]">READY TO TRADE?</p><h2 className="mt-3 text-balance text-3xl font-black sm:text-5xl">Entre no ritmo do mercado.</h2><p className="mt-4 text-[var(--landing-muted)]">Comece pela conta demo. Evolua no seu tempo.</p></div>
          <Link href="/auth/sign-up" className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[var(--landing-primary)] px-7 py-4 font-bold text-[var(--landing-primary-foreground)] transition-transform hover:-translate-y-0.5">Criar conta grátis <Sparkles className="size-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-[var(--landing-line)] px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <img src="/images/fidelity-logo.png" alt="POLEX" className="h-7 w-auto object-contain" />
          <p className="font-mono text-[10px] text-[var(--landing-muted)]">© {new Date().getFullYear()} POLEX. TODOS OS DIREITOS RESERVADOS.</p>
        </div>
      </footer>
    </main>
  )
}
