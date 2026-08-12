import { useEffect, useState } from 'react'
import Cover from './Cover'

const installCommand = 'npx --yes github:lMysticl/bug-receipt install'

function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? 'mark mark--compact' : 'mark'} aria-hidden="true">
      <svg viewBox="0 0 48 48" role="img">
        <path d="M11 7h26v34l-4-3-4 3-5-3-5 3-4-3-4 3V7Z" />
        <path className="mark__check" d="m17 23 5 5 10-11" />
      </svg>
    </span>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m4 10 4 4 8-9" />
    </svg>
  )
}

function ReceiptPreview({ compact = false }: { compact?: boolean }) {
  return (
    <article className={compact ? 'receipt receipt--compact' : 'receipt'} aria-label="Verified bug receipt example">
      <div className="receipt__top">
        <div>
          <p className="eyebrow">Problem · BR-042</p>
          <h2>Checkout discount regression</h2>
        </div>
        <span className="status"><span /> Verified</span>
      </div>
      <div className="receipt__rule" />
      <dl className="receipt__rows">
        <div>
          <dt>Baseline</dt>
          <dd><code>npm test -- discount</code><span className="result result--fail">Fail observed</span></dd>
        </div>
        <div>
          <dt>Root cause</dt>
          <dd><code>src/pricing.ts:42</code><span>rounding ran before discount</span></dd>
        </div>
        <div>
          <dt>Change</dt>
          <dd><code>src/pricing.ts</code><span>discount subtotal before rounding</span></dd>
        </div>
        <div>
          <dt>Proof</dt>
          <dd className="proof-pills"><span><CheckIcon /> focused</span><span><CheckIcon /> suite</span><span><CheckIcon /> build</span></dd>
        </div>
      </dl>
      <div className="receipt__footer">
        <span>Source</span><strong>Executed now</strong><span className="receipt__hash">Gaps · none</span>
      </div>
    </article>
  )
}

function EvidenceDemo() {
  const [mode, setMode] = useState<'claim' | 'receipt'>('receipt')

  return (
    <div className="demo-shell">
      <div className="demo-shell__bar">
        <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
        <div className="segmented" aria-label="Compare agent responses">
          <button className={mode === 'claim' ? 'is-active' : ''} onClick={() => setMode('claim')}>Claim only</button>
          <button className={mode === 'receipt' ? 'is-active' : ''} onClick={() => setMode('receipt')}>With receipt</button>
        </div>
        <span className="demo-shell__label">Live comparison</span>
      </div>
      <div className="demo-shell__body" aria-live="polite">
        {mode === 'claim' ? (
          <div className="claim-card">
            <span className="claim-card__avatar">AI</span>
            <div>
              <p>Fixed! The rounding issue should now be resolved.</p>
              <div className="missing-proof">
                <span>Baseline missing</span><span>Root cause assumed</span><span>Tests unspecified</span>
              </div>
            </div>
            <strong>Unverified</strong>
          </div>
        ) : <ReceiptPreview compact />}
      </div>
    </div>
  )
}

function App() {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const coverMode = new URLSearchParams(window.location.search).has('cover')

  useEffect(() => {
    if (copyState === 'idle') return
    const timer = window.setTimeout(() => setCopyState('idle'), 1800)
    return () => window.clearTimeout(timer)
  }, [copyState])

  if (coverMode) return <Cover />

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(installCommand)
      setCopyState('copied')
    } catch {
      const input = document.createElement('textarea')
      input.value = installCommand
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.append(input)
      input.select()
      const copied = document.execCommand('copy')
      input.remove()
      setCopyState(copied ? 'copied' : 'failed')
    }
  }

  return (
    <div className="site-shell">
      <header className="nav wrap">
        <a className="brand" href="#top" aria-label="Bug Receipt home"><Mark compact /><span>Bug Receipt</span></a>
        <nav aria-label="Primary navigation">
          <a href="#proof">How it works</a>
          <a href="#benchmark">Benchmark</a>
          <a href="#install">Install</a>
          <a className="nav__github" href="https://github.com/lMysticl/bug-receipt">GitHub <ArrowIcon /></a>
        </nav>
      </header>

      <main id="top">
        <section className="hero wrap">
          <div className="hero__glow" aria-hidden="true" />
          <div className="hero__copy">
            <div className="pill"><span /> Discoverable Agent Skill <b>v1.4</b></div>
            <h1>No <em>“fixed”</em><br />without receipts.</h1>
            <p className="hero__lead">A strict evidence gate for coding agents. Reproduce the failure, trace the cause, run the proof—and only then declare victory.</p>
            <div className="hero__actions">
              <a className="button button--primary" href="#install">Install the skill <ArrowIcon /></a>
              <a className="button button--ghost" href="https://github.com/lMysticl/bug-receipt/blob/main/skills/bug-receipt/SKILL.md">Read SKILL.md</a>
            </div>
            <div className="hero__meta">
              <span><CheckIcon /> No API key</span>
              <span><CheckIcon /> Local only</span>
              <span><CheckIcon /> MIT licensed</span>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__image" aria-hidden="true" />
            <ReceiptPreview />
          </div>
        </section>

        <section className="trust-strip" aria-label="Compatible agents">
          <div className="wrap trust-strip__inner">
            <p>One receipt contract. Your agent of choice.</p>
            <div><span>Codex</span><span>Claude Code</span><span>Copilot</span><span>Cursor</span><span>Agent Skills</span></div>
          </div>
        </section>

        <section className="section wrap" id="proof">
          <div className="section-heading">
            <div><p className="kicker">Proof, not posture</p><h2>Turn a confident claim<br />into an auditable result.</h2></div>
            <p>Bug Receipt changes the finish line. Passing syntax or a plausible diff is not completion; the agent must account for every proof layer.</p>
          </div>
          <EvidenceDemo />
        </section>

        <section className="principles wrap" aria-label="Bug Receipt workflow">
          <article><span>01</span><h3>Observe the failure</h3><p>Capture the exact command, symptom, and failing evidence before the patch whenever the environment allows it.</p></article>
          <article><span>02</span><h3>Own the cause</h3><p>Trace the responsible path and cite the concrete source or runtime evidence. Nearest symptom is not enough.</p></article>
          <article><span>03</span><h3>Close the loop</h3><p>Run the direct check, relevant regression coverage, and build. Missing proof downgrades the status automatically.</p></article>
        </section>

        <section className="benchmark-section" id="benchmark">
          <div className="wrap">
            <div className="section-heading">
              <div><p className="kicker">Measured, with limits</p><h2>A real lift.<br />Receipts included.</h2></div>
              <p>Four frozen v1.4 robustness cases, identical natural prompts, isolated treatment, and blind judges. The pre-registered gate covered security redaction, rollback recovery, diagnosis-only authority, and version skew.</p>
            </div>
            <div className="benchmark-grid">
              <article><strong>90%</strong><span>skills-ON accuracy</span><p>18/20 blind-judged requirements passed; the complete receipt appeared in all four cases.</p></article>
              <article><strong>25%</strong><span>skills-OFF accuracy</span><p>The same model and prompts without Bug Receipt passed 5/20 requirements.</p></article>
              <article><strong>+65 pp</strong><span>measured quality lift</span><p>Correct status and a complete receipt appeared in all four ON cases.</p></article>
              <article><strong>p=.00024</strong><span>paired significance</span><p>Exact McNemar test; routing was 4/4 and candidate actions were zero in both arms.</p></article>
            </div>
            <a className="benchmark-link" href="https://github.com/lMysticl/bug-receipt/blob/main/benchmarks/RESULTS.md">Inspect the protocol, SHA-verified raw reports, and limitations <ArrowIcon /></a>
          </div>
        </section>

        <section className="install-section" id="install">
          <div className="wrap install-grid">
            <div>
              <p className="kicker">Install in seconds</p>
              <h2>Drop the skill into<br />your agent workflow.</h2>
              <p className="install-lead">The default uses the portable global skills directory. Choose a target when you want an agent-specific or repository-local installation.</p>
              <div className="target-grid">
                <span>default <b>~/.agents/skills</b></span>
                <span>--target codex <b>~/.codex/skills</b></span>
                <span>--target claude <b>~/.claude/skills</b></span>
                <span>--target project <b>./.agents/skills</b></span>
              </div>
            </div>
            <div className="terminal-card">
              <div className="terminal-card__top"><span>Terminal</span><i>safe install · no overwrite</i></div>
              <div className="terminal-command"><span aria-hidden="true">$</span><code>{installCommand}</code><button onClick={copyInstall} aria-label="Copy install command">{copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Select' : 'Copy'}</button></div>
              <div className="terminal-output">
                <p><span>✓</span> Validated bundled skill package</p>
                <p><span>✓</span> Installed to ~/.agents/skills/bug-receipt</p>
                <p className="terminal-output__ready">Ready. Ask your agent to use <b>$bug-receipt</b>.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="final-cta wrap">
          <Mark />
          <p className="kicker">Evidence compounds</p>
          <h2>Make “fixed” mean something.</h2>
          <p>Small skill. Hard boundary. Better engineering conversations.</p>
          <div><a className="button button--primary" href="https://github.com/lMysticl/bug-receipt">View on GitHub <ArrowIcon /></a><a className="button button--ghost" href="#install">Install now</a></div>
        </section>
      </main>

      <footer className="footer wrap">
        <a className="brand" href="#top"><Mark compact /><span>Bug Receipt</span></a>
        <p>Built for evidence-first engineering.</p>
        <div><a href="https://github.com/lMysticl/bug-receipt">GitHub</a><a href="https://github.com/lMysticl/bug-receipt/blob/main/LICENSE">MIT</a></div>
      </footer>
    </div>
  )
}

export default App
