import Image from "next/image"
import Link from "next/link"
import { BarChart3, Check, Clock3, Globe2, Headphones, ShieldCheck, Smartphone, WalletCards, Zap } from "lucide-react"

export const metadata = {
  title: "FIDELITY Broker — Negocie nos mercados globais",
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
    <main className="bullex-page min-h-screen overflow-x-clip bg-[var(--landing-bg)] text-[var(--landing-text)]">
      <div className="bg-[var(--landing-primary)] px-4 py-2 text-center text-[11px] font-semibold text-[var(--landing-primary-foreground)]">
        Negociar envolve riscos. Opere com responsabilidade e utilize apenas valores que pode administrar.
      </div>

      <header className="sticky top-0 z-40 mx-auto flex max-w-7xl items-center justify-between bg-[var(--landing-bg)]/88 px-5 py-5 backdrop-blur-xl lg:px-8">
        <Link href="#inicio" aria-label="Fidelity Option — início" className="shrink-0">
          <Image src="/images/fidelity-option-logo.png" alt="Fidelity Option" width={2176} height={734} className="h-auto w-24 object-contain sm:w-44 lg:w-56" priority />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/auth/login" className="rounded-lg border border-[var(--landing-line-strong)] bg-[var(--landing-panel-raised)] px-2 py-2 text-[9px] font-semibold uppercase sm:rounded-xl sm:px-8 sm:py-4 sm:text-sm"><span className="sm:hidden">Entrar</span><span className="hidden sm:inline">Entre agora</span></Link>
          <Link href="/auth/sign-up" className="rounded-lg bg-[var(--landing-primary)] px-2 py-2 text-[9px] font-bold uppercase text-[var(--landing-primary-foreground)] sm:rounded-xl sm:px-8 sm:py-4 sm:text-sm"><span className="sm:hidden">Criar conta</span><span className="hidden sm:inline">Criar uma conta</span></Link>
        </div>
      </header>

      <section id="inicio" className="fidelity-hero relative min-h-[760px] overflow-hidden border-t border-[var(--landing-line)] px-5 py-16 lg:min-h-[860px] lg:px-8">
        <div className="bullex-hero-glow absolute inset-0" />
        <div className="relative z-10 mx-auto flex max-w-7xl justify-center">
          <Link href="/auth/sign-up" className="fidelity-float inline-flex min-h-16 w-full max-w-sm items-center justify-center rounded-xl border-2 border-[var(--landing-text)] bg-[var(--landing-primary)] px-8 text-center text-lg font-bold uppercase text-[var(--landing-primary-foreground)] shadow-[0_0_48px_rgb(66_216_121/0.24)] sm:max-w-md">Abra sua conta gratuita</Link>
        </div>
        <div className="relative z-10 mx-auto mt-24 grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="fidelity-phone-stage relative min-h-[410px] lg:min-h-[520px]">
            <div className="absolute inset-12 rounded-full bg-[var(--landing-primary)]/15 blur-3xl" />
            <Image src="/images/fidelity-mobile-platform.png" alt="Aplicativo Fidelity Option exibindo histórico de lucros e plataforma de negociação" width={1137} height={1387} className="fidelity-phone relative mx-auto max-h-[570px] w-auto object-contain drop-shadow-2xl" priority />
          </div>
          <div className="fidelity-reveal">
            <h1 className="text-balance text-5xl font-normal leading-[1.18] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Negocie no mercado financeiro a qualquer momento!</h1>
            <p className="mt-8 max-w-xl text-xl leading-relaxed text-[var(--landing-text)]">Acesse oportunidades onde quer que você esteja. Negociar nunca foi tão simples.</p>
            <p className="mt-5 text-lg text-[var(--landing-primary)]">Compatível com computador, tablet e celular.</p>
          </div>
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

      <section className="fidelity-scroll-section mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="fidelity-scroll-copy max-w-2xl">
          <span className="rounded-full border border-[var(--landing-primary)]/30 px-3 py-1 text-xs text-[var(--landing-primary)]">MAIS POSSIBILIDADES</span>
          <h2 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl">Mais de 200 ativos em uma plataforma descomplicada</h2>
          <p className="mt-5 leading-relaxed text-[var(--landing-muted)]">Escolha o mercado que combina com sua estratégia e acompanhe tudo em uma única interface.</p>
        </div>
        <div className="fidelity-asset-track mt-12 flex gap-3">
          {assets.map(([name, price, change]) => <div key={name} className="w-[78vw] max-w-sm shrink-0 rounded-xl border border-[var(--landing-line)] bg-[var(--landing-panel)] p-5"><div className="flex justify-between"><b>{name}</b><span className="text-[var(--landing-primary)]">{change}</span></div><p className="mt-8 font-mono text-2xl">{price}</p></div>)}
        </div>
      </section>

      <section className="fidelity-view-reveal mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div><p className="text-sm text-[var(--landing-muted)]">Quer saber o que você recebe?</p><h2 className="mt-3 text-balance text-3xl font-bold sm:text-5xl">A FIDELITY pode oferecer mais para a sua forma de negociar</h2><p className="mt-5 max-w-2xl text-[var(--landing-muted)]">Abra sua conta e conheça uma experiência construída para você evoluir no mercado.</p><Link href="/auth/sign-up" className="mt-7 inline-flex rounded-lg bg-[var(--landing-primary)] px-8 py-3.5 font-bold text-[var(--landing-primary-foreground)]">Começar agora</Link></div>
        <Image src="/images/fidelity-profit.png" alt="Notificação de lucro realizado na Fidelity Option" width={2086} height={724} className="fidelity-profit-banner h-auto w-full object-contain" />
      </section>

      <section id="vantagens" className="fidelity-view-reveal mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <h2 className="max-w-2xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">Por que a FIDELITY é uma plataforma para grandes decisões?</h2>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(([Icon,title,desc]) => { const FeatureIcon=Icon as typeof Zap; return <article key={title as string} className="rounded-xl border border-[var(--landing-line)] bg-[var(--landing-panel)] p-6"><FeatureIcon className="size-6 text-[var(--landing-primary)]"/><h3 className="mt-8 text-lg font-bold">{title as string}</h3><p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)]">{desc as string}</p></article> })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <h2 className="text-center text-3xl font-bold sm:text-5xl">Condições FIDELITY</h2>
        <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {specials.map(([label,value,desc]) => <article key={label} className="bullex-special rounded-xl border border-[var(--landing-line)] p-7"><p className="text-xs text-[var(--landing-primary)]">{label}</p><h3 className="mt-4 text-3xl font-bold">{value}</h3><p className="mt-2 text-sm text-[var(--landing-muted)]">{desc}</p></article>)}
        </div>
        <div className="mt-10 text-center"><Link href="/auth/sign-up" className="inline-flex rounded-lg bg-[var(--landing-primary)] px-8 py-3.5 font-bold text-[var(--landing-primary-foreground)]">Abrir minha conta</Link></div>
      </section>

      <section id="plataforma" className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 lg:grid-cols-2 lg:px-8">
        <Image src="/images/fidelity-platform.png" alt="Plataforma Fidelity Option no notebook e celular" width={1668} height={928} className="fidelity-platform-device h-auto w-full object-contain drop-shadow-2xl" />
        <div><span className="text-xs font-semibold text-[var(--landing-primary)]">MERCADO NA SUA TELA</span><h2 className="mt-5 text-balance text-4xl font-bold sm:text-5xl">Negocie no mercado financeiro em tempo real</h2><p className="mt-5 leading-relaxed text-[var(--landing-muted)]">Acesse cotações, gráficos e suas operações sem complicação. A plataforma se adapta ao seu dispositivo para você acompanhar o mercado onde estiver.</p><div className="mt-8 flex flex-col gap-4">{["Conta demo para praticar", "Gráficos e indicadores integrados", "Histórico completo de operações"].map(item=><div key={item} className="flex items-center gap-3"><Check className="size-5 text-[var(--landing-primary)]"/><span>{item}</span></div>)}</div></div>
      </section>

      <section className="overflow-hidden py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8"><span className="text-xs font-semibold text-[var(--landing-primary)]">FLEXIBILIDADE</span><h2 className="mt-5 max-w-2xl text-balance text-4xl font-normal sm:text-6xl">Negocie diretamente do seu celular.</h2><p className="mt-6 text-xl">Experiência perfeita em todas as telas.</p></div>
        <div className="fidelity-testimonials mt-16 flex w-max gap-4 px-4">
          {[...Array(2)].flatMap((_, copy) => [["Estou encantado com as ferramentas de análise da plataforma. Os indicadores me ajudam a identificar tendências e tomar decisões mais informadas.","J. G. Marins"],["Minha rotina sempre dificultou encontrar tempo para investir. A FIDELITY transformou essa experiência com uma plataforma intuitiva e acessível pelo celular.","David Gama"],["Eu estava perdido no mercado até conhecer esta plataforma. Os gráficos são claros e a equipe de suporte sempre me ajuda quando preciso.","Maria Elisa Cara"]].map(([quote,name],i)=><article key={`${copy}-${i}`} className="w-[86vw] max-w-xl shrink-0 rounded-2xl border border-[var(--landing-line-strong)] bg-[var(--landing-panel)] p-8 sm:p-12"><p className="text-lg leading-relaxed sm:text-xl">{quote}</p><p className="mt-10 text-lg font-semibold text-[var(--landing-primary)]">{name}</p></article>))}
        </div>
        <div className="mt-8 flex justify-center gap-3" aria-hidden="true"><span className="size-2 rounded-full bg-[var(--landing-text)]"/><span className="size-2 rounded-full bg-[var(--landing-primary)]"/><span className="size-2 rounded-full bg-[var(--landing-text)]"/></div>
      </section>

      <section id="duvidas" className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div><span className="inline-flex rounded-full border border-[var(--landing-primary)] px-6 py-3 text-sm font-medium">PERGUNTAS FREQUENTES</span><h2 className="mt-5 text-5xl font-normal sm:text-6xl">Sobre a FIDELITY</h2></div>
        <div className="flex flex-col">{[["O que é a conta demo?","É um ambiente de prática com saldo virtual para conhecer a plataforma sem usar dinheiro real."],["Quais mercados estão disponíveis?","Você encontra moedas, criptomoedas, ações e outros ativos disponíveis na plataforma."],["Posso acessar pelo celular?","Sim. A interface é responsiva e funciona nos principais navegadores móveis."],["Como começo?","Crie sua conta, conheça a conta demo e avance no seu ritmo."]].map(([q,a],i)=><details key={q} className="group border-b border-[var(--landing-line-strong)] py-7"><summary className="cursor-pointer list-none text-lg font-medium marker:hidden">{String(i + 1).padStart(2,"0")}. {q}<span className="float-right text-2xl text-[var(--landing-primary)] transition-transform group-open:rotate-45">+</span></summary><p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--landing-muted)]">{a}</p></details>)}</div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8"><div className="bullex-cta overflow-hidden rounded-2xl border border-[var(--landing-primary)]/20 px-6 py-12 text-center"><Image src="/images/fidelity-withdrawal.png" alt="Saque Fidelity Option em até 24 horas" width={2086} height={750} className="fidelity-withdrawal mx-auto h-auto w-full max-w-5xl object-contain"/><h2 className="mx-auto mt-6 max-w-2xl text-balance text-3xl font-bold sm:text-5xl">O mercado não para. Sua próxima decisão começa agora.</h2><Link href="/auth/sign-up" className="mt-8 inline-flex rounded-lg bg-[var(--landing-primary)] px-8 py-3.5 font-bold text-[var(--landing-primary-foreground)]">Criar conta gratuita</Link></div></section>

      <footer className="border-t border-[var(--landing-line)] px-5 py-10 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row"><Image src="/images/fidelity-option-logo.png" alt="Fidelity Option" width={2176} height={734} className="h-auto w-40 object-contain" /><div className="flex items-center gap-5 text-xs text-[var(--landing-muted)]"><Globe2 className="size-4"/><span>Português</span><span>© {new Date().getFullYear()} FIDELITY Broker</span></div></div></footer>
    </main>
  )
}
