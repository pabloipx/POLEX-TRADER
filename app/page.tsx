import Image from "next/image"
import Link from "next/link"
import { BarChart3, Check, Clock3, Globe2, Headphones, ShieldCheck, Smartphone, WalletCards, Zap } from "lucide-react"

export const metadata = {
  title: "POLEX Broker — Negocie nos mercados globais",
  description: "Acesse mais de 200 ativos em uma plataforma de negociação simples, rápida e segura.",
}

const assets = [
  ["EUR/USD", "1,08342", "+0,62%"], ["Bitcoin", "$64.973", "+1,47%"],
  ["Ethereum", "$3.481", "+2,96%"], ["Tesla", "$248,42", "+0,84%"],
]

const benefits = [
  [BarChart3, "Gráficos em tempo real", "Indicadores e ferramentas para uma leitura clara do mercado."],
  [Zap, "Execução simples", "Abra suas operações em poucos passos, sem telas desnecessárias."],
  [Smartphone, "Negocie onde estiver", "Uma experiência responsiva no computador, tablet e celular."],
  [Headphones, "Suporte quando precisar", "Atendimento para acompanhar você em cada etapa."],
  [ShieldCheck, "Ambiente protegido", "Tecnologia e processos dedicados à proteção da sua conta."],
  [WalletCards, "Controle do seu saldo", "Depósitos, retiradas e histórico reunidos em um só lugar."],
]

const specials = [
  ["Depósito mínimo", "R$ 60", "Comece com um valor acessível"],
  ["Retirada mínima", "R$ 2,00", "Mais flexibilidade para sua banca"],
  ["Conta demo", "R$ 10.000", "Pratique antes de operar com saldo real"],
  ["Mercados", "200+ ativos", "Forex, cripto, ações e commodities"],
  ["Retorno potencial", "Até 90%", "Conforme o ativo e as condições de mercado"],
  ["Disponibilidade", "24 horas", "Mercados abertos todos os dias"],
]

export default function HomePage() {
  return (
    <main className="bullex-page min-h-screen overflow-hidden bg-[var(--landing-bg)] text-[var(--landing-text)]">
      <div className="bg-[var(--landing-primary)] px-4 py-2 text-center text-[11px] font-semibold text-[var(--landing-primary-foreground)]">
        Negociar envolve riscos. Opere com responsabilidade e utilize apenas valores que pode administrar.
      </div>

      <header className="relative z-40 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="#inicio" aria-label="POLEX Broker — início" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--landing-primary)] text-[var(--landing-primary-foreground)]"><BarChart3 className="size-5" /></span>
          <span className="leading-none"><b className="block text-lg tracking-tight">POLEX</b><span className="text-[9px] tracking-[0.2em] text-[var(--landing-muted)]">BROKER</span></span>
        </Link>
        <nav aria-label="Navegação principal" className="hidden items-center gap-8 text-sm text-[var(--landing-muted)] lg:flex">
          <Link href="#ativos" className="hover:text-[var(--landing-text)]">Ativos</Link>
          <Link href="#vantagens" className="hover:text-[var(--landing-text)]">Por que a POLEX?</Link>
          <Link href="#plataforma" className="hover:text-[var(--landing-text)]">Plataforma</Link>
          <Link href="#duvidas" className="hover:text-[var(--landing-text)]">Dúvidas</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="rounded-lg px-4 py-2.5 text-sm font-semibold">Entrar</Link>
          <Link href="/auth/sign-up" className="rounded-lg bg-[var(--landing-primary)] px-5 py-2.5 text-sm font-bold text-[var(--landing-primary-foreground)]">Criar conta</Link>
        </div>
      </header>

      <section id="inicio" className="relative mx-auto max-w-7xl px-5 pb-20 pt-14 text-center lg:px-8 lg:pt-20">
        <div className="bullex-hero-glow absolute inset-x-0 top-0 -z-10 h-[620px]" />
        <p className="text-sm font-semibold text-[var(--landing-primary)]">UMA PLATAFORMA. TODOS OS MERCADOS.</p>
        <h1 className="mx-auto mt-5 max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
          Negocie ações, criptomoedas e moedas de forma simples
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
          Explore os mercados globais em uma plataforma criada para tornar cada decisão mais clara, rápida e acessível.
        </p>
        <Link href="/auth/sign-up" className="mt-8 inline-flex rounded-lg bg-[var(--landing-primary)] px-8 py-3.5 font-bold text-[var(--landing-primary-foreground)] shadow-[0_0_40px_rgb(0_229_153/0.22)]">Abrir conta gratuita</Link>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute inset-x-24 bottom-0 h-32 bg-[var(--landing-primary)]/15 blur-3xl" />
          <Image src="/images/polex-showcase.png" alt="Plataforma POLEX Broker exibida no computador" width={1024} height={1024} className="relative mx-auto w-full max-w-4xl object-contain drop-shadow-2xl" priority />
        </div>
      </section>

      <section id="ativos" className="border-y border-[var(--landing-line)] py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-[var(--landing-line)] px-5 md:grid-cols-4 lg:px-8">
          {assets.map(([name, price, change]) => (
            <article key={name} className="bg-[var(--landing-bg)] p-5">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold">{name}</span><span className="text-xs text-[var(--landing-primary)]">{change}</span></div>
              <p className="mt-3 font-mono text-xl font-bold">{price}</p>
              <div className="mt-4 flex h-8 items-end gap-1" aria-hidden="true">{[3,6,4,8,5,10,7,12,9,14].map((h,i)=><span key={i} className="w-full bg-[var(--landing-primary)]/50" style={{height:h}} />)}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="max-w-2xl">
          <span className="rounded-full border border-[var(--landing-primary)]/30 px-3 py-1 text-xs text-[var(--landing-primary)]">MAIS POSSIBILIDADES</span>
          <h2 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl">Mais de 200 ativos em uma plataforma descomplicada</h2>
          <p className="mt-5 leading-relaxed text-[var(--landing-muted)]">Escolha o mercado que combina com sua estratégia e acompanhe tudo em uma única interface.</p>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {assets.map(([name, price, change]) => <div key={name} className="rounded-xl border border-[var(--landing-line)] bg-[var(--landing-panel)] p-5"><div className="flex justify-between"><b>{name}</b><span className="text-[var(--landing-primary)]">{change}</span></div><p className="mt-8 font-mono text-2xl">{price}</p></div>)}
        </div>
      </section>

      <section className="px-5 py-20 text-center lg:px-8">
        <p className="text-sm text-[var(--landing-muted)]">Quer saber o que você recebe?</p>
        <h2 className="mx-auto mt-3 max-w-xl text-balance text-3xl font-bold sm:text-5xl">A POLEX pode oferecer mais para a sua forma de negociar</h2>
        <p className="mx-auto mt-5 max-w-2xl text-[var(--landing-muted)]">Abra sua conta e conheça uma experiência construída para você evoluir no mercado.</p>
        <Link href="/auth/sign-up" className="mt-7 inline-flex rounded-lg bg-[var(--landing-primary)] px-8 py-3.5 font-bold text-[var(--landing-primary-foreground)]">Começar agora</Link>
      </section>

      <section id="vantagens" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <h2 className="max-w-2xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">Por que a POLEX é uma plataforma para grandes decisões?</h2>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(([Icon,title,desc]) => { const FeatureIcon=Icon as typeof Zap; return <article key={title as string} className="rounded-xl border border-[var(--landing-line)] bg-[var(--landing-panel)] p-6"><FeatureIcon className="size-6 text-[var(--landing-primary)]"/><h3 className="mt-8 text-lg font-bold">{title as string}</h3><p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)]">{desc as string}</p></article> })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <h2 className="text-center text-3xl font-bold sm:text-5xl">Condições POLEX</h2>
        <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {specials.map(([label,value,desc]) => <article key={label} className="bullex-special rounded-xl border border-[var(--landing-line)] p-7"><p className="text-xs text-[var(--landing-primary)]">{label}</p><h3 className="mt-4 text-3xl font-bold">{value}</h3><p className="mt-2 text-sm text-[var(--landing-muted)]">{desc}</p></article>)}
        </div>
        <div className="mt-10 text-center"><Link href="/auth/sign-up" className="inline-flex rounded-lg bg-[var(--landing-primary)] px-8 py-3.5 font-bold text-[var(--landing-primary-foreground)]">Abrir minha conta</Link></div>
      </section>

      <section id="plataforma" className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 lg:grid-cols-2 lg:px-8">
        <Image src="/images/hero-trading.png" alt="Terminal de negociação POLEX" width={1024} height={1024} className="w-full rounded-2xl border border-[var(--landing-line)]" />
        <div><span className="text-xs font-semibold text-[var(--landing-primary)]">MERCADO NA SUA TELA</span><h2 className="mt-5 text-balance text-4xl font-bold sm:text-5xl">Negocie no mercado financeiro em tempo real</h2><p className="mt-5 leading-relaxed text-[var(--landing-muted)]">Acesse cotações, gráficos e suas operações sem complicação. A plataforma se adapta ao seu dispositivo para você acompanhar o mercado onde estiver.</p><div className="mt-8 flex flex-col gap-4">{["Conta demo para praticar", "Gráficos e indicadores integrados", "Histórico completo de operações"].map(item=><div key={item} className="flex items-center gap-3"><Check className="size-5 text-[var(--landing-primary)]"/><span>{item}</span></div>)}</div></div>
      </section>

      <section id="duvidas" className="mx-auto max-w-3xl px-5 py-24">
        <h2 className="text-center text-3xl font-bold sm:text-5xl">Perguntas frequentes</h2>
        <div className="mt-10 flex flex-col gap-3">{[["O que é a conta demo?","É um ambiente de prática com saldo virtual para conhecer a plataforma sem usar dinheiro real."],["Quais mercados estão disponíveis?","Você encontra moedas, criptomoedas, ações e outros ativos disponíveis na plataforma."],["Posso acessar pelo celular?","Sim. A interface é responsiva e funciona nos principais navegadores móveis."],["Como começo?","Crie sua conta, conheça a conta demo e avance no seu ritmo."]].map(([q,a])=><details key={q} className="group rounded-xl border border-[var(--landing-line)] bg-[var(--landing-panel)] p-5"><summary className="cursor-pointer list-none font-semibold">{q}</summary><p className="mt-4 text-sm leading-relaxed text-[var(--landing-muted)]">{a}</p></details>)}</div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8"><div className="bullex-cta rounded-2xl border border-[var(--landing-primary)]/20 px-6 py-16 text-center"><Clock3 className="mx-auto size-7 text-[var(--landing-primary)]"/><h2 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-bold sm:text-5xl">O mercado não para. Sua próxima decisão começa agora.</h2><Link href="/auth/sign-up" className="mt-8 inline-flex rounded-lg bg-[var(--landing-primary)] px-8 py-3.5 font-bold text-[var(--landing-primary-foreground)]">Criar conta gratuita</Link></div></section>

      <footer className="border-t border-[var(--landing-line)] px-5 py-10 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-[var(--landing-primary)] text-[var(--landing-primary-foreground)]"><BarChart3 className="size-4" /></span><b className="tracking-tight">POLEX BROKER</b></div><div className="flex items-center gap-5 text-xs text-[var(--landing-muted)]"><Globe2 className="size-4"/><span>Português</span><span>© {new Date().getFullYear()} POLEX Broker</span></div></div></footer>
    </main>
  )
}
