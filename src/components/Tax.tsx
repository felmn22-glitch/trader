import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { formatCurrency } from '../utils'
import { useIsMobile } from '../hooks'
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, Building2, User } from 'lucide-react'
import type { Trade } from '../types'

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  return `${MONTHS_PT[parseInt(m) - 1]}/${y}`
}

interface MonthResult {
  month: string
  tradeCount: number
  grossProfit: number
  grossLoss: number
  netBeforeCarry: number
  carryForward: number
  netAfterCarry: number
  irrf: number
  irDue: number
  darf: number
  newCarry: number
}

function calcTax(trades: Trade[], split: number): MonthResult[] {
  const factor = split / 100
  const byMonth: Record<string, Trade[]> = {}
  for (const t of trades) {
    const m = t.date.slice(0, 7)
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(t)
  }

  const sorted = Object.keys(byMonth).sort()
  let carry = 0
  return sorted.map(month => {
    const mt = byMonth[month]
    const grossProfit = mt.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) * factor
    const grossLoss = mt.filter(t => t.pnl < 0).reduce((s, t) => s + Math.abs(t.pnl), 0) * factor
    const netBeforeCarry = grossProfit - grossLoss
    const netAfterCarry = netBeforeCarry - carry
    const irrf = grossProfit * 0.01
    const irDue = netAfterCarry > 0 ? netAfterCarry * 0.20 : 0
    const darf = Math.max(0, irDue - irrf)
    const newCarry = netAfterCarry < 0 ? Math.abs(netAfterCarry) : 0
    const result: MonthResult = { month, tradeCount: mt.length, grossProfit, grossLoss, netBeforeCarry, carryForward: carry, netAfterCarry, irrf, irDue, darf, newCarry }
    carry = newCarry
    return result
  })
}

function AccordionItem({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderRadius: 12, border: '1px solid #1a1d2e', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#12141f', border: 'none', cursor: 'pointer', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon size={18} color="#6c63ff" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0' }}>{title}</span>
        </div>
        {open ? <ChevronUp size={16} color="#4a5170" /> : <ChevronDown size={16} color="#4a5170" />}
      </button>
      {open && (
        <div style={{ padding: '16px 18px', background: '#0e1018', borderTop: '1px solid #1a1d2e' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Step({ n, text, sub }: { n: number; text: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(108,99,255,0.2)', color: '#a78bfa', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{n}</div>
      <div>
        <p style={{ color: '#e8eaf0', fontSize: 13, margin: 0 }}>{text}</p>
        {sub && <p style={{ color: '#4a5170', fontSize: 12, margin: '2px 0 0' }}>{sub}</p>}
      </div>
    </div>
  )
}

export function Tax() {
  const { trades, riskSettings, updateRiskSettings } = useStore()
  const isMobile = useIsMobile()
  const { accountType, propFirmSplit } = riskSettings
  const split = accountType === 'mesa' ? propFirmSplit : 100

  const monthlyData = useMemo(() => calcTax(trades, split), [trades, split])

  const totalGrossProfit = monthlyData.reduce((s, m) => s + m.grossProfit, 0)
  const totalGrossLoss = monthlyData.reduce((s, m) => s + m.grossLoss, 0)
  const totalIRRF = monthlyData.reduce((s, m) => s + m.irrf, 0)
  const totalIRDue = monthlyData.reduce((s, m) => s + m.irDue, 0)
  const totalDARF = monthlyData.reduce((s, m) => s + m.darf, 0)
  const lastCarry = monthlyData.at(-1)?.newCarry ?? 0

  const pad = isMobile ? '14px 14px 80px' : '20px 28px 28px'

  const cell = { padding: isMobile ? '9px 10px' : '10px 14px', fontSize: isMobile ? 12 : 13, borderBottom: '1px solid #1a1d2e', whiteSpace: 'nowrap' as const }
  const hcell = { ...cell, color: '#4a5170', fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', background: '#10121e' }

  return (
    <div style={{ padding: pad, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Account type selector */}
      <div style={{ background: '#12141f', borderRadius: 14, border: '1px solid #1a1d2e', padding: '18px 20px' }}>
        <p style={{ color: '#8892a4', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', margin: '0 0 14px', textTransform: 'uppercase' }}>Tipo de Conta</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => updateRiskSettings({ accountType: 'proprio' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 12, border: `2px solid ${accountType === 'proprio' ? '#6c63ff' : '#1e2235'}`,
              background: accountType === 'proprio' ? 'rgba(108,99,255,0.12)' : '#0e1018', cursor: 'pointer', transition: 'all 0.15s', flex: 1, minWidth: 160,
            }}
          >
            <User size={20} color={accountType === 'proprio' ? '#a78bfa' : '#4a5170'} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: accountType === 'proprio' ? '#c4b5fd' : '#8892a4' }}>Capital Próprio</p>
              <p style={{ margin: 0, fontSize: 11, color: '#4a5170' }}>Conta pessoal · 100% do resultado</p>
            </div>
          </button>
          <button
            onClick={() => updateRiskSettings({ accountType: 'mesa' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 12, border: `2px solid ${accountType === 'mesa' ? '#6c63ff' : '#1e2235'}`,
              background: accountType === 'mesa' ? 'rgba(108,99,255,0.12)' : '#0e1018', cursor: 'pointer', transition: 'all 0.15s', flex: 1, minWidth: 160,
            }}
          >
            <Building2 size={20} color={accountType === 'mesa' ? '#a78bfa' : '#4a5170'} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: accountType === 'mesa' ? '#c4b5fd' : '#8892a4' }}>Mesa Proprietária</p>
              <p style={{ margin: 0, fontSize: 11, color: '#4a5170' }}>Prop firm · divisão de lucros</p>
            </div>
          </button>
        </div>

        {accountType === 'mesa' && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#8892a4', fontSize: 13 }}>Sua % dos lucros:</span>
            <input
              type="number" min={1} max={100}
              value={propFirmSplit}
              onChange={e => updateRiskSettings({ propFirmSplit: Math.min(100, Math.max(1, parseInt(e.target.value) || 80)) })}
              style={{ width: 70, padding: '6px 10px', borderRadius: 8, border: '1px solid #2a2d3e', background: '#0e1018', color: '#fff', fontSize: 14, fontWeight: 700, textAlign: 'center' }}
            />
            <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 14 }}>%</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <AlertTriangle size={13} color="#ffd700" />
              <span style={{ color: '#ffd700', fontSize: 12 }}>Consulte um contador para mesa proprietária</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary cards */}
      {monthlyData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Lucro Bruto Total', value: formatCurrency(totalGrossProfit), color: '#00d084' },
            { label: 'IRRF Retido (1%)', value: formatCurrency(totalIRRF), color: '#ffd700' },
            { label: 'IR Devido (20%)', value: formatCurrency(totalIRDue), color: '#ff8c00' },
            { label: 'DARF a Pagar', value: formatCurrency(totalDARF), color: '#ff4d4d' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#12141f', borderRadius: 12, border: '1px solid #1a1d2e', padding: '16px' }}>
              <p style={{ color: '#4a5170', fontSize: 11, fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
              <p style={{ color, fontSize: 18, fontWeight: 700, margin: 0, fontFamily: 'monospace' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Monthly table */}
      {monthlyData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a5170' }}>
          <FileTextIcon />
          <p style={{ fontSize: 16, color: '#8892a4', margin: '16px 0 8px' }}>Nenhuma operação registrada</p>
          <p style={{ fontSize: 13 }}>Registre trades para ver a apuração de IR</p>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid #1a1d2e', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {isMobile ? (
                    <>
                      <th style={hcell}>Mês</th>
                      <th style={hcell}>Ops</th>
                      <th style={hcell}>Lucro</th>
                      <th style={hcell}>Prejuízo</th>
                      <th style={hcell}>Saldo</th>
                      <th style={hcell}>DARF</th>
                    </>
                  ) : (
                    <>
                      <th style={hcell}>Mês</th>
                      <th style={hcell}>Ops</th>
                      <th style={hcell}>Lucro Bruto</th>
                      <th style={hcell}>Prejuízo</th>
                      <th style={hcell}>Saldo Mensal</th>
                      <th style={hcell}>Prej. Compens.</th>
                      <th style={hcell}>Base de Cálculo</th>
                      <th style={hcell}>IRRF (1%)</th>
                      <th style={hcell}>IR Devido (20%)</th>
                      <th style={hcell}>DARF</th>
                      <th style={hcell}>Novo C.F.</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m, i) => {
                  const bg = i % 2 === 0 ? '#12141f' : '#0e1018'
                  const darfColor = m.darf > 0 ? '#ff4d4d' : m.darf === 0 && m.irDue === 0 ? '#4a5170' : '#00d084'

                  return (
                    <tr key={m.month} style={{ background: bg, borderBottom: '1px solid #1a1d2e' }}>
                      <td style={{ ...cell, fontWeight: 700, color: '#c4b5fd' }}>{fmtMonth(m.month)}</td>
                      <td style={{ ...cell, color: '#8892a4' }}>{m.tradeCount}</td>
                      <td style={{ ...cell, color: '#00d084', fontFamily: 'monospace' }}>{formatCurrency(m.grossProfit)}</td>
                      <td style={{ ...cell, color: m.grossLoss > 0 ? '#ff4d4d' : '#4a5170', fontFamily: 'monospace' }}>
                        {m.grossLoss > 0 ? `-${formatCurrency(m.grossLoss)}` : '—'}
                      </td>
                      <td style={{ ...cell, fontFamily: 'monospace', color: m.netBeforeCarry >= 0 ? '#00d084' : '#ff4d4d', fontWeight: 600 }}>
                        {m.netBeforeCarry >= 0 ? '+' : ''}{formatCurrency(m.netBeforeCarry)}
                      </td>
                      {!isMobile && (
                        <>
                          <td style={{ ...cell, color: m.carryForward > 0 ? '#ffd700' : '#4a5170', fontFamily: 'monospace' }}>
                            {m.carryForward > 0 ? `-${formatCurrency(m.carryForward)}` : '—'}
                          </td>
                          <td style={{ ...cell, color: m.netAfterCarry > 0 ? '#a78bfa' : '#4a5170', fontFamily: 'monospace', fontWeight: 600 }}>
                            {m.netAfterCarry > 0 ? formatCurrency(m.netAfterCarry) : '—'}
                          </td>
                          <td style={{ ...cell, color: '#ffd700', fontFamily: 'monospace' }}>{formatCurrency(m.irrf)}</td>
                          <td style={{ ...cell, color: m.irDue > 0 ? '#ff8c00' : '#4a5170', fontFamily: 'monospace' }}>
                            {m.irDue > 0 ? formatCurrency(m.irDue) : '—'}
                          </td>
                        </>
                      )}
                      <td style={{ ...cell, fontFamily: 'monospace', fontWeight: 700, color: darfColor }}>
                        {m.darf > 0 ? formatCurrency(m.darf) : m.netAfterCarry < 0 ? 'Prej. acum.' : <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> Isento</span>}
                      </td>
                      {!isMobile && (
                        <td style={{ ...cell, color: m.newCarry > 0 ? '#ffd700' : '#4a5170', fontFamily: 'monospace' }}>
                          {m.newCarry > 0 ? formatCurrency(m.newCarry) : '—'}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#10121e', borderTop: '2px solid #2a2d3e' }}>
                  <td colSpan={isMobile ? 2 : 2} style={{ ...cell, color: '#4a5170', fontWeight: 700, fontSize: 12 }}>TOTAL ANUAL</td>
                  <td style={{ ...cell, color: '#00d084', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(totalGrossProfit)}</td>
                  <td style={{ ...cell, color: '#ff4d4d', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(totalGrossLoss)}</td>
                  <td style={{ ...cell, fontFamily: 'monospace', fontWeight: 700, color: (totalGrossProfit - totalGrossLoss) >= 0 ? '#00d084' : '#ff4d4d' }}>
                    {formatCurrency(totalGrossProfit - totalGrossLoss)}
                  </td>
                  {!isMobile && (
                    <>
                      <td style={cell} />
                      <td style={cell} />
                      <td style={{ ...cell, color: '#ffd700', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(totalIRRF)}</td>
                      <td style={{ ...cell, color: '#ff8c00', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(totalIRDue)}</td>
                    </>
                  )}
                  <td style={{ ...cell, color: totalDARF > 0 ? '#ff4d4d' : '#00d084', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(totalDARF)}</td>
                  {!isMobile && <td style={cell} />}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Carry forward banner */}
      {lastCarry > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}>
          <Info size={18} color="#ffd700" />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#ffd700' }}>Prejuízo a compensar: {formatCurrency(lastCarry)}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#4a5170' }}>Este valor será abatido do lucro tributável nos próximos meses</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {monthlyData.length > 0 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'IRRF (1%)', desc: '1% retido na fonte sobre lucros brutos — compensa o DARF' },
            { label: 'DARF', desc: 'Código 6015 · Day Trade em Bolsa · Vence último dia útil do mês seguinte' },
            { label: 'C.F.', desc: 'Carry Forward — prejuízo acumulado que reduz a base de cálculo futura' },
          ].map(({ label, desc }) => (
            <div key={label} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flex: 1, minWidth: 200 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6c63ff', background: 'rgba(108,99,255,0.12)', padding: '2px 8px', borderRadius: 5, flexShrink: 0, marginTop: 1 }}>{label}</span>
              <span style={{ fontSize: 12, color: '#4a5170' }}>{desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* Accordions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AccordionItem title="Como pagar o DARF?" icon={CheckCircle}>
          <div>
            <Step n={1} text='Acesse sicalcweb.receita.fazenda.gov.br ou app "Meu Imposto de Renda"' sub="Ferramenta SICALC da Receita Federal" />
            <Step n={2} text='Preencha: Código 6015 · Período de Apuração (mês/ano referência) · Valor Principal' />
            <Step n={3} text='Subtraia o IRRF retido na fonte do valor calculado (20% do lucro líquido − 1% retido)' sub="Exemplo: IR Due R$200 − IRRF R$15 = DARF R$185" />
            <Step n={4} text='Gere o DARF e pague via internet banking, app do banco ou Pix com código de barras' />
            <Step n={5} text='Vencimento: último dia útil do mês seguinte ao mês de apuração' />
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,208,132,0.06)', border: '1px solid rgba(0,208,132,0.15)' }}>
              <p style={{ color: '#00d084', fontSize: 12, fontWeight: 600, margin: '0 0 4px' }}>Dica importante</p>
              <p style={{ color: '#4a5170', fontSize: 12, margin: 0 }}>Guarde todos os recibos de pagamento do DARF. Eles são necessários para a declaração anual.</p>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Como declarar no IRPF anual (DIRPF)?" icon={Info}>
          <div>
            <Step n={1} text='Abra o programa IRPF (download em gov.br/irpf) ou acesse pelo app "Meu Imposto de Renda"' />
            <Step n={2} text='Vá em: Ficha "Renda Variável" → "Operações em Bolsa" → "Day Trade"' />
            <Step n={3} text='Para cada mês: informe o lucro/prejuízo líquido do mês e o IRRF retido (1%)' sub="Use os demonstrativos de negociação do seu home broker" />
            <Step n={4} text='Informe os DARFs pagos na linha "IR pago em fonte"' />
            <Step n={5} text='O sistema calcula automaticamente se há diferença a pagar ou restituição' />
            <Step n={6} text='Na ficha "Bens e Direitos" você NÃO precisa declarar operações de day trade (apenas o saldo da conta)' />
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.15)' }}>
              <p style={{ color: '#ff6b6b', fontSize: 12, fontWeight: 600, margin: '0 0 4px' }}>Atenção: Day Trade ≠ Swing Trade</p>
              <p style={{ color: '#4a5170', fontSize: 12, margin: 0 }}>Day trade NÃO tem isenção de R$20.000. Todo lucro, mesmo pequeno, é tributado a 20%.</p>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Documentos necessários" icon={Info}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { doc: 'Notas de corretagem', desc: 'Emitida pelo home broker a cada dia de operação — mostra todas as operações, taxas e IRRF' },
              { doc: 'Extrato de IR na Fonte', desc: 'Informe anual do IRRF retido — disponível no home broker em Jan/Fev do ano seguinte' },
              { doc: 'Recibos dos DARFs', desc: 'Comprovante de pagamento de cada DARF mensal (código 6015)' },
              { doc: 'Demonstrativo de Operações', desc: 'Relatório mensal ou anual com consolidado de gains e losses — disponível no home broker' },
            ].map(({ doc, desc }) => (
              <div key={doc} style={{ display: 'flex', gap: 10 }}>
                <CheckCircle size={16} color="#00d084" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ color: '#e8eaf0', fontSize: 13, fontWeight: 600, margin: 0 }}>{doc}</p>
                  <p style={{ color: '#4a5170', fontSize: 12, margin: '2px 0 0' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </AccordionItem>

        {accountType === 'mesa' && (
          <AccordionItem title="Mesa Proprietária — atenção especial" icon={AlertTriangle}>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', marginBottom: 12 }}>
              <p style={{ color: '#ffd700', fontSize: 13, fontWeight: 600, margin: '0 0 6px' }}>A tributação varia conforme o contrato com a mesa</p>
              <p style={{ color: '#4a5170', fontSize: 12, margin: 0 }}>As regras abaixo são genéricas. Consulte sempre um contador especialista em renda variável.</p>
            </div>
            {[
              { title: 'Mesa que opera no CNPJ próprio', desc: 'A empresa (mesa) paga o IR. O trader recebe um percentual como "remuneração por performance" — pode ser tratado como serviço prestado (PJ) ou lucro distribuído.' },
              { title: 'Mesa onde o trader opera no próprio CPF', desc: 'O trader é responsável pelo DARF. A base de cálculo é o lucro total operado (não o valor já descontado pela mesa).' },
              { title: 'Conta parceria / profit sharing', desc: 'Depende do contrato. O trader pode ser tratado como investidor (e pagar IR normalmente) ou como prestador de serviço (emitindo nota fiscal).' },
            ].map(({ title, desc }) => (
              <div key={title} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: '2px solid #2a2d3e' }}>
                <p style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{title}</p>
                <p style={{ color: '#4a5170', fontSize: 12, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </AccordionItem>
        )}
      </div>
    </div>
  )
}

function FileTextIcon() {
  return (
    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
      <Info size={28} color="#6c63ff" />
    </div>
  )
}
