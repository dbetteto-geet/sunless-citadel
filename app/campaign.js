// =====================================================================
// SUNLESS CITADEL
// File: app/campaign.js del repo sunless-citadel (progetto Vercel sunless-citadel)
// Campagna nel database: campaign_id = 'sunless'
// Nessuna funzione AI: niente analisi sessioni, scansione schede PG o trascrizione foto
// =====================================================================
'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'


// ─── Rich Text Editor ─────────────────────────────────────────────────────────
// useInsertMd removed - logic moved into RichEditor directly

function renderMd(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 style="margin:10px 0 4px;font-size:16px;font-weight:700;color:#2c1810">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin:12px 0 6px;font-size:18px;font-weight:700;color:#2c1810">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin:14px 0 8px;font-size:20px;font-weight:700;color:#2c1810">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:4px;margin:6px 0;display:block" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#8b6914;text-decoration:underline">$1</a>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:18px;list-style-type:disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:18px;list-style-type:decimal">$1</li>')
    .replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, m => `<ul style="margin:6px 0;padding:0">${m}</ul>`)
    .replace(/\n/g, '<br/>')
}

function RichText({ value, style }) {
  if (!value) return null
  return <div style={{ fontSize: 15, lineHeight: 1.8, color: '#5c3d2e', fontFamily: "'Crimson Text', Georgia, serif", ...style }} dangerouslySetInnerHTML={{ __html: renderMd(value) }} />
}

function RichEditor({ value, onChange, placeholder, height }) {
  const taRef = useRef()
  const valRef = useRef('')
  valRef.current = value == null ? '' : String(value)
  const [preview, setPreview] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [showImg, setShowImg] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [imgUrl, setImgUrl] = useState('')
  const [imgAlt, setImgAlt] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const ins = (before, after, ph) => {
    const el = taRef.current
    const cur = valRef.current
    if (!el) { onChange(cur + before + (ph || '') + (after || '')); return }
    const s = el.selectionStart
    const e = el.selectionEnd
    const sel = cur.substring(s, e) || (ph || '')
    const next = cur.substring(0, s) + before + sel + (after || '') + cur.substring(e)
    onChange(next)
    requestAnimationFrame(() => {
      if (!taRef.current) return
      taRef.current.selectionStart = s + before.length
      taRef.current.selectionEnd = s + before.length + sel.length
      taRef.current.focus()
    })
  }

  const insertLink = () => {
    if (!linkUrl) return
    ins('[' + (linkText || linkUrl) + '](' + linkUrl + ')', '', '')
    setShowLink(false); setLinkUrl(''); setLinkText('')
  }
  const insertImg = () => {
    if (!imgUrl) return
    ins('\n![' + (imgAlt || 'immagine') + '](' + imgUrl + ')\n', '', '')
    setShowImg(false); setImgUrl(''); setImgAlt('')
  }
  const uploadImg = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = 'content/' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('content-images').upload(path, file)
    if (!error) setImgUrl(process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/content-images/' + path)
    setUploading(false)
  }

  const tb = { background: 'none', border: '1px solid #d4b896', borderRadius: 3, padding: '3px 8px', fontSize: 13, cursor: 'pointer', color: '#5c3d2e', minWidth: 28, minHeight: 30 }
  const cur = valRef.current

  return (
    <div style={{ border: '1.5px solid #d4b896', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 3, padding: '5px 8px', background: '#e8d5a3', borderBottom: '1px solid #d4b896', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" style={tb} onMouseDown={e => { e.preventDefault(); ins('**', '**', 'grassetto') }}><strong>G</strong></button>
        <button type="button" style={tb} onMouseDown={e => { e.preventDefault(); ins('*', '*', 'corsivo') }}><em>C</em></button>
        <button type="button" style={tb} onMouseDown={e => { e.preventDefault(); ins('# ', '', 'Titolo') }}>H1</button>
        <button type="button" style={tb} onMouseDown={e => { e.preventDefault(); ins('## ', '', 'Titolo') }}>H2</button>
        <button type="button" style={tb} onMouseDown={e => { e.preventDefault(); ins('### ', '', 'Titolo') }}>H3</button>
        <button type="button" style={tb} onMouseDown={e => { e.preventDefault(); ins('\n- ', '', 'elemento') }}>{'• —'}</button>
        <button type="button" style={tb} onMouseDown={e => { e.preventDefault(); ins('\n1. ', '', 'elemento') }}>{'1. —'}</button>
        <button type="button" style={tb} onMouseDown={e => { e.preventDefault(); setShowLink(true) }}>🔗</button>
        <button type="button" style={tb} onMouseDown={e => { e.preventDefault(); setShowImg(true) }}>🖼</button>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => setPreview(p => !p)}
          style={{ ...tb, background: preview ? '#8b6914' : 'transparent', border: '1px solid #8b6914', color: preview ? '#fff' : '#8b6914', fontWeight: 600, padding: '3px 10px' }}>
          {preview ? '✏️ Modifica' : '👁 Anteprima'}
        </button>
      </div>
      {preview
        ? <div style={{ padding: '12px 14px', minHeight: height || 200, background: '#f4e4c1', fontSize: 15, lineHeight: 1.8, color: '#5c3d2e', fontFamily: "'Crimson Text', Georgia, serif" }}
            dangerouslySetInnerHTML={{ __html: renderMd(cur) || '<span style="color:#8b6355;font-style:italic">Nessun contenuto...</span>' }} />
        : <textarea ref={taRef} value={cur} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Scrivi qui...'}
            style={{ width: '100%', boxSizing: 'border-box', minHeight: height || 200, padding: '12px 14px', background: '#f4e4c1', border: 'none', outline: 'none', fontSize: 15, lineHeight: 1.8, resize: 'vertical', color: '#2c1810', fontFamily: "'Crimson Text', Georgia, serif", display: 'block' }} />
      }
      {showLink && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#f4e4c1', borderRadius: 8, padding: '1.5rem', width: '90%', maxWidth: 400, border: '2px solid #8b6914' }}>
            <h3 style={{ margin: '0 0 16px', color: '#8b1a1a', fontFamily: "'Cinzel', Georgia, serif" }}>Inserisci Link</h3>
            <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 12, color: '#8b6914', marginBottom: 4 }}>TESTO</label><input value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Testo del link" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #d4b896', borderRadius: 4, fontSize: 15, background: '#e8d5a3', color: '#2c1810' }} /></div>
            <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 12, color: '#8b6914', marginBottom: 4 }}>URL</label><input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #d4b896', borderRadius: 4, fontSize: 15, background: '#e8d5a3', color: '#2c1810' }} /></div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowLink(false); setLinkUrl(''); setLinkText('') }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #d4b896', borderRadius: 4, cursor: 'pointer', color: '#8b6355' }}>Annulla</button>
              <button onClick={insertLink} style={{ padding: '8px 16px', background: '#8b6914', border: 'none', borderRadius: 4, cursor: 'pointer', color: '#fff', fontWeight: 600 }}>Inserisci</button>
            </div>
          </div>
        </div>
      )}
      {showImg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#f4e4c1', borderRadius: 8, padding: '1.5rem', width: '90%', maxWidth: 420, border: '2px solid #8b6914' }}>
            <h3 style={{ margin: '0 0 16px', color: '#8b1a1a', fontFamily: "'Cinzel', Georgia, serif" }}>Inserisci Immagine</h3>
            <div style={{ marginBottom: 14, background: '#e8d5a3', border: '1px dashed #d4b896', borderRadius: 6, padding: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#8b6355', margin: '0 0 8px', fontStyle: 'italic' }}>Carica dal dispositivo</p>
              <label style={{ display: 'inline-block', padding: '7px 16px', background: '#1a5c2e', color: '#f8edd8', borderRadius: 4, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: uploading ? 0.7 : 1 }}>
                {uploading ? '⏳ Caricamento...' : '📁 Scegli file'}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={uploadImg} />
              </label>
              {imgUrl && <p style={{ fontSize: 12, color: '#1a5c2e', margin: '8px 0 0' }}>✓ Pronta</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#d4b896' }} /><span style={{ fontSize: 12, color: '#8b6355' }}>oppure da URL</span><div style={{ flex: 1, height: 1, background: '#d4b896' }} />
            </div>
            <div style={{ marginBottom: 12 }}><input value={imgUrl.includes('content-images') ? '' : imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #d4b896', borderRadius: 4, fontSize: 15, background: '#e8d5a3', color: '#2c1810' }} /></div>
            <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 12, color: '#8b6914', marginBottom: 4 }}>TESTO ALTERNATIVO</label><input value={imgAlt} onChange={e => setImgAlt(e.target.value)} placeholder="Descrizione immagine" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #d4b896', borderRadius: 4, fontSize: 15, background: '#e8d5a3', color: '#2c1810' }} /></div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowImg(false); setImgUrl(''); setImgAlt('') }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #d4b896', borderRadius: 4, cursor: 'pointer', color: '#8b6355' }}>Annulla</button>
              <button onClick={insertImg} disabled={!imgUrl} style={{ padding: '8px 16px', background: imgUrl ? '#8b6914' : '#d4b896', border: 'none', borderRadius: 4, cursor: imgUrl ? 'pointer' : 'not-allowed', color: '#fff', fontWeight: 600 }}>Inserisci</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



const T = {
  parchment: '#f4e4c1', parchmentDark: '#e8d5a3', parchmentDarker: '#d4b896',
  ink: '#2c1810', inkLight: '#5c3d2e', inkFaint: '#8b6355',
  red: '#8b1a1a', gold: '#8b6914', goldLight: '#c9a84c', border: '#8b6914',
  green: '#1a5c2e', blue: '#1a3c5c', purple: '#3c1a5c',
}
const ATTITUDE_COLORS = { Alleato: T.green, Neutrale: T.inkFaint, Nemico: T.red, Sconosciuto: T.purple }
const EVENT_COLORS = { scoperta: T.purple, incontro: T.green, combattimento: T.red, mistero: T.blue, altro: T.inkFaint }
const STATUS_COLORS = { visitato: T.green, noto: T.blue, sconosciuto: T.inkFaint, pericoloso: T.red }
const QUEST_STATUS_COLORS = { attiva: T.green, completata: T.inkFaint, fallita: T.red, in_sospeso: T.gold }
const ITEM_TYPE_COLORS = { 'Arma magica': T.purple, Consumabile: T.green, Armatura: T.blue, Vari: T.inkFaint, Arma: T.red }
const VITALITY_COLORS = { vivo: '#1a5c2e', morto: '#8b1a1a', sconosciuto: '#8b6355' }
const SCHOOL_COLORS = { Evocazione: T.red, Illusione: T.purple, Necromanzia: T.inkFaint, Trasformazione: T.green, Divinazione: T.blue, Ammaliamento: '#7a1a4a', Abiurazione: T.gold, Invocazione: '#1a4a3c' }
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

function formatBonus(v) {
  const n = parseInt(v) || 0
  return n >= 0 ? `+${n}` : `${n}`
}

function getPublicUrl(bucket, path) {
  if (!path) return null
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}
async function uploadImage(bucket, file, folder) {
  const ext = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) return null
  return path
}
function feetToMeters(str) {
  if (!str) return str
  return str.replace(/(\d+)\s*feet?/gi, (_, n) => `${Math.round(parseInt(n) * 0.3)} m`)
            .replace(/(\d+)\s*ft\.?/gi, (_, n) => `${Math.round(parseInt(n) * 0.3)} m`)
            .replace(/(\d+)\s*mile[s]?/gi, (_, n) => `${Math.round(parseInt(n) * 1.6)} km`)
}
function formatDate(dateStr) {
  if (!dateStr) return ''
  try { return new Date(dateStr).toLocaleDateString('it-IT') } catch { return dateStr }
}

const parchmentBg = {
  background: `radial-gradient(ellipse at 20% 10%, rgba(180,140,80,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(160,120,60,0.15) 0%, transparent 50%), linear-gradient(135deg, #f8edd8 0%, #f4e4c1 30%, #ede0b8 60%, #f4e4c1 100%)`,
}
const cardStyle = { ...parchmentBg, border: `1.5px solid ${T.parchmentDarker}`, borderRadius: 6, padding: '1rem 1.25rem', boxShadow: `inset 0 1px 3px rgba(255,255,255,0.5), 0 2px 8px rgba(44,24,16,0.12)`, color: T.ink, position: 'relative' }
const headerFont = { fontFamily: "'Cinzel', Georgia, serif", letterSpacing: '0.02em' }
const bodyFont = { fontFamily: "'Crimson Text', Georgia, serif" }

function Badge({ color, children }) {
  return <span style={{ background: color + '22', color, border: `1px solid ${color}66`, borderRadius: 3, padding: '1px 8px', fontSize: 12, fontWeight: 600, ...headerFont, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{children}</span>
}
function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{ ...cardStyle, cursor: onClick ? 'pointer' : 'default', ...style }}>{children}</div>
}
function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)` }} />
      <span style={{ color: T.gold, fontSize: 14 }}>✦</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)` }} />
    </div>
  )
}
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,5,2,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ ...parchmentBg, borderRadius: '12px 12px 0 0', padding: '1.5rem', width: '100%', maxWidth: wide ? 780 : 640, maxHeight: '90vh', overflowY: 'auto', border: `2px solid ${T.gold}`, borderBottom: 'none', boxShadow: `0 -8px 32px rgba(44,24,16,0.4)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 20, color: T.red, ...headerFont }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: T.inkFaint, padding: 4 }}>✕</button>
        </div>
        <Divider />
        {children}
      </div>
    </div>
  )
}
function FF({ label, children }) {
  return <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: 13, color: T.gold, marginBottom: 4, fontWeight: 600, ...headerFont, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>{children}</div>
}
function Input(props) {
  return <input style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: T.parchment, border: `1.5px solid ${T.parchmentDarker}`, borderRadius: 4, fontSize: 16, color: T.ink, fontFamily: "'Crimson Text', Georgia, serif" }} {...props} />
}
function Textarea(props) {
  return <textarea style={{ width: '100%', boxSizing: 'border-box', minHeight: 90, padding: '8px 12px', background: T.parchment, border: `1.5px solid ${T.parchmentDarker}`, borderRadius: 4, fontSize: 16, resize: 'vertical', color: T.ink, fontFamily: "'Crimson Text', Georgia, serif" }} {...props} />
}
function Sel({ children, ...props }) {
  return <select style={{ width: '100%', padding: '8px 12px', background: T.parchment, border: `1.5px solid ${T.parchmentDarker}`, borderRadius: 4, fontSize: 16, color: T.ink, fontFamily: "'Crimson Text', Georgia, serif" }} {...props}>{children}</select>
}
function BtnP({ children, onClick, style, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ background: disabled ? T.inkFaint : `linear-gradient(135deg, ${T.red} 0%, #6b1414 100%)`, color: '#f8edd8', border: `1px solid ${disabled ? T.inkFaint : '#6b1414'}`, borderRadius: 4, padding: '9px 18px', fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', minHeight: 44, boxShadow: disabled ? 'none' : '0 2px 6px rgba(139,26,26,0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.3)', ...headerFont, letterSpacing: '0.03em', ...style }}>{children}</button>
}
function BtnS({ children, onClick, style }) {
  return <button onClick={onClick} style={{ background: T.parchmentDark, color: T.inkLight, border: `1.5px solid ${T.parchmentDarker}`, borderRadius: 4, padding: '9px 18px', fontSize: 15, cursor: 'pointer', minHeight: 44, boxShadow: '0 1px 4px rgba(44,24,16,0.1)', ...bodyFont, ...style }}>{children}</button>
}
function BtnD({ children, onClick, style }) {
  return <button onClick={onClick} style={{ background: '#f8e8e8', color: T.red, border: `1.5px solid ${T.red}44`, borderRadius: 4, padding: '9px 14px', fontSize: 14, cursor: 'pointer', minHeight: 44, ...bodyFont, ...style }}>{children}</button>
}
function BtnGold({ children, onClick, style, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ background: disabled ? T.inkFaint : `linear-gradient(135deg, ${T.gold} 0%, #6b5010 100%)`, color: '#f8edd8', border: 'none', borderRadius: 4, padding: '9px 18px', fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', minHeight: 44, ...headerFont, ...style }}>{children}</button>
}
function SH({ title, action }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.red, ...headerFont }}>{title}</h2>
        {action}
      </div>
      <div style={{ marginTop: 8, height: 2, background: `linear-gradient(to right, ${T.gold}, ${T.goldLight}, transparent)`, borderRadius: 1 }} />
    </div>
  )
}
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: T.parchmentDark, borderRadius: 6, padding: 4, overflowX: 'auto', border: `1px solid ${T.parchmentDarker}` }}>
      {tabs.map(t => <button key={t} onClick={() => onChange(t)} style={{ flex: '1 0 auto', padding: '7px 6px', borderRadius: 4, border: active === t ? `1px solid ${T.gold}` : '1px solid transparent', background: active === t ? T.parchment : 'transparent', fontWeight: active === t ? 600 : 400, fontSize: 13, cursor: 'pointer', color: active === t ? T.red : T.inkLight, boxShadow: active === t ? '0 1px 4px rgba(44,24,16,0.1)' : 'none', whiteSpace: 'nowrap', ...bodyFont }}>{t}</button>)}
    </div>
  )
}
function ImgUpload({ bucket, folder, currentPath, onUploaded, label }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef()
  const url = getPublicUrl(bucket, currentPath)
  const handle = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true); const path = await uploadImage(bucket, file, folder); setUploading(false); if (path) onUploaded(path)
  }
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: 13, color: T.gold, marginBottom: 4, fontWeight: 600, ...headerFont, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label || 'Immagine'}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {url && <img src={url} alt="" style={{ width: 52, height: 52, borderRadius: 4, objectFit: 'cover', border: `2px solid ${T.gold}` }} />}
        <button type="button" onClick={() => ref.current.click()} style={{ background: T.parchmentDark, border: `1.5px solid ${T.parchmentDarker}`, borderRadius: 4, padding: '9px 16px', fontSize: 14, cursor: 'pointer', minHeight: 44, color: T.inkLight, ...bodyFont }}>
          {uploading ? 'Caricamento...' : url ? 'Cambia' : 'Carica immagine'}
        </button>
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handle} />
      </div>
    </div>
  )
}
function CoinsPanel({ values, onChange, editable }) {
  const COINS = [{ key: 'gold', label: 'MO', color: T.gold, icon: '🪙' }, { key: 'silver', label: 'MA', color: T.inkFaint, icon: '🥈' }, { key: 'copper', label: 'MR', color: '#7a4a2e', icon: '🟫' }, { key: 'platinum', label: 'MP', color: T.blue, icon: '💎' }]
  return (
    <Card style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: T.red, ...headerFont, letterSpacing: '0.05em' }}>⚖️ MONETE</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {COINS.map(({ key, label, color, icon }) => (
          <div key={key} style={{ textAlign: 'center', background: T.parchmentDark, border: `1.5px solid ${T.parchmentDarker}`, borderRadius: 4, padding: '10px 4px' }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 6, ...headerFont }}>{label}</div>
            {editable
              ? <input type="number" min="0" value={values[key] ?? 0} onChange={e => onChange(key, parseInt(e.target.value) || 0)} style={{ width: '100%', textAlign: 'center', padding: '4px 2px', border: `1px solid ${T.parchmentDarker}`, borderRadius: 3, fontSize: 16, fontWeight: 700, color, background: T.parchment, boxSizing: 'border-box', fontFamily: "'Crimson Text', Georgia, serif" }} />
              : <div style={{ fontSize: 20, fontWeight: 700, color }}>{values[key] ?? 0}</div>
            }
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Sessioni ─────────────────────────────────────────────────────────────────
function SessionsSection({ isDM }) {
  const [sessions, setSessions] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ number: '', title: '', date: '', summary: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('sessions').select('*').eq('campaign_id', 'sunless').order('number', { ascending: false }).then(({ data }) => { setSessions(data || []); setLoading(false) })
  }, [])

  const openAdd = () => { setEditing(null); setForm({ number: '', title: '', date: '', summary: '' }); setShowModal(true) }
  const openEdit = (e, s) => { e.stopPropagation(); setEditing(s); setForm({ number: s.number || '', title: s.title || '', date: s.date || '', summary: s.summary || '' }); setShowModal(true) }
  const save = async () => {
    if (!form.title) return
    if (editing) { const { data } = await supabase.from('sessions').update(form).eq('id', editing.id).select(); if (data) setSessions(sessions.map(s => s.id === editing.id ? data[0] : s)) }
    else { const { data } = await supabase.from('sessions').insert([{ ...form, campaign_id: 'sunless' }]).select(); if (data) setSessions([data[0], ...sessions]) }
    setShowModal(false)
  }
  const remove = async (e, id) => { e.stopPropagation(); await supabase.from('sessions').delete().eq('id', id); setSessions(sessions.filter(s => s.id !== id)) }

  if (loading) return <p style={{ color: T.inkFaint }}>Caricamento...</p>
  return (
    <div>
      <SH title="📜 Riassunti Sessioni" action={isDM && <BtnP onClick={openAdd}>+ Nuova</BtnP>} />
      {sessions.length === 0 && <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>Nessuna sessione ancora scritta nei libri...</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sessions.map(s => (
          <Card key={s.id} onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: T.gold, display: 'block', marginBottom: 2, ...headerFont, letterSpacing: '0.05em' }}>SESSIONE {s.number} · {formatDate(s.date)}</span>
                <span style={{ fontWeight: 600, color: T.ink, fontSize: 17, ...headerFont }}>{s.title}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                {isDM && (
                  <>
                    <button onClick={e => openEdit(e, s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>✏️</button>
                    <button onClick={e => remove(e, s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>🗑️</button>
                  </>
                )}
                <span style={{ color: T.gold, fontSize: 14, padding: 4 }}>{expanded === s.id ? '▲' : '▼'}</span>
              </div>
            </div>
            {expanded === s.id && (
              <>
                <Divider />
                <RichText value={s.summary} />
              </>
            )}
          </Card>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? 'Modifica Sessione' : 'Nuova Sessione'} onClose={() => setShowModal(false)}>
          <FF label="Numero"><Input type="number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} /></FF>
          <FF label="Titolo"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></FF>
          <FF label="Data"><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></FF>
          <FF label="Riassunto">
            <RichEditor value={form.summary || ''} onChange={v => setForm({ ...form, summary: v })} placeholder="Scrivi il riassunto della sessione..." height={250} />
          </FF>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowModal(false)}>Annulla</BtnS><BtnP onClick={save}>Salva</BtnP></div>
        </Modal>
      )}

    </div>
  )
}

// ─── NPC Grouped ─────────────────────────────────────────────────────────────
function NPCCard({ npc, onSelect }) {
  const img = getPublicUrl('npc-images', npc.image_path)
  return (
    <Card onClick={() => onSelect(npc)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {img ? <img src={img} alt={npc.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center', border: `2px solid ${T.gold}`, flexShrink: 0 }} />
          : <div style={{ width: 48, height: 48, borderRadius: '50%', background: (ATTITUDE_COLORS[npc.attitude] || T.inkFaint) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: ATTITUDE_COLORS[npc.attitude] || T.inkFaint, border: `2px solid ${T.parchmentDarker}`, flexShrink: 0, ...headerFont }}>{npc.name[0]}</div>}
        <div>
          <div style={{ fontWeight: 600, color: T.ink, fontSize: 16, ...headerFont }}>{npc.name}</div>
          <div style={{ fontSize: 13, color: T.inkFaint, fontStyle: 'italic' }}>{npc.role}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <Badge color={ATTITUDE_COLORS[npc.attitude] || T.inkFaint}>{npc.attitude}</Badge>
        <Badge color={VITALITY_COLORS[npc.vitality] || T.inkFaint}>{npc.vitality || 'vivo'}</Badge>
        {npc.faction && <Badge color={T.gold}>{npc.faction}</Badge>}
      </div>
      <p style={{ fontSize: 14, color: T.inkLight, marginTop: 4, marginBottom: 0, lineHeight: 1.5 }}>{npc.description?.substring(0, 100)}{npc.description?.length > 100 ? '...' : ''}</p>
    </Card>
  )
}

function NPCGrouped({ npcs, onSelect }) {
  const [collapsed, setCollapsed] = useState({})
  const toggle = (k) => setCollapsed(c => ({ ...c, [k]: !c[k] }))
  const groups = {}
  npcs.forEach(npc => { const k = npc.faction || '— Nessuna fazione —'; if (!groups[k]) groups[k] = []; groups[k].push(npc) })
  const keys = Object.keys(groups).sort((a, b) => { if (a === '— Nessuna fazione —') return 1; if (b === '— Nessuna fazione —') return -1; return a.localeCompare(b) })
  return (
    <div>
      {keys.map(k => (
        <div key={k} style={{ marginBottom: 16 }}>
          <button onClick={() => toggle(k)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: k === '— Nessuna fazione —' ? T.inkFaint : T.gold, letterSpacing: '0.08em', textTransform: 'uppercase', ...headerFont }}>{k}</span>
              <span style={{ fontSize: 12, color: T.inkFaint }}>({groups[k].length})</span>
            </div>
            <span style={{ display: 'inline-block', width: 0, height: 0, borderTop: collapsed[k] ? '5px solid transparent' : 'none', borderBottom: collapsed[k] ? '5px solid transparent' : 'none', borderRight: collapsed[k] ? `8px solid ${T.gold}` : 'none', borderLeft: collapsed[k] ? 'none' : `8px solid ${T.gold}`, marginTop: collapsed[k] ? 0 : '3px' }} />
          </button>
          {!collapsed[k] && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,240px),1fr))', gap: 12 }}>{groups[k].map(npc => <NPCCard key={npc.id} npc={npc} onSelect={onSelect} />)}</div>}
          <div style={{ height: 1, background: `linear-gradient(to right, ${T.gold}44, transparent)`, marginTop: 8 }} />
        </div>
      ))}
    </div>
  )
}

// ─── NPC ──────────────────────────────────────────────────────────────────────
function NPCSection({ isDM }) {
  const [npcs, setNpcs] = useState([])
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterAttitude, setFilterAttitude] = useState('')
  const [form, setForm] = useState({ name: '', role: '', attitude: 'Neutrale', description: '', notes_dm: '', image_path: '', vitality: 'vivo', first_location: '', current_location: '', faction: '' })
  const [loading, setLoading] = useState(true)
  const [allCharacters, setAllCharacters] = useState([])

  useEffect(() => { supabase.from('npcs').select('*').eq('campaign_id', 'sunless').order('name').then(({ data }) => { setNpcs(data || []); setLoading(false) }) }, [])

  const openAdd = () => { setEditing(null); setForm({ name: '', role: '', attitude: 'Neutrale', description: '', notes_dm: '', image_path: '' }); setShowModal(true) }
  const openEdit = (e, npc) => { e && e.stopPropagation(); setEditing(npc); setForm({ name: npc.name, role: npc.role || '', attitude: npc.attitude, description: npc.description || '', notes_dm: npc.notes_dm || '', image_path: npc.image_path || '', vitality: npc.vitality || 'vivo', first_location: npc.first_location || '', current_location: npc.current_location || '', faction: npc.faction || '' }); setShowModal(true) }
  const save = async () => {
    if (!form.name) return
    if (editing) { const { data } = await supabase.from('npcs').update(form).eq('id', editing.id).select(); if (data) { setNpcs(npcs.map(n => n.id === editing.id ? data[0] : n)); if (selected?.id === editing.id) setSelected(data[0]) } }
    else { const { data } = await supabase.from('npcs').insert([{ ...form, campaign_id: 'sunless' }]).select(); if (data) setNpcs([...npcs, data[0]].sort((a, b) => a.name.localeCompare(b.name))) }
    setShowModal(false)
  }
  const remove = async (id) => { await supabase.from('npcs').delete().eq('id', id); setNpcs(npcs.filter(n => n.id !== id)); setSelected(null) }

  const filtered = npcs.filter(n => {
    const matchSearch = !search || n.name.toLowerCase().includes(search.toLowerCase()) || (n.role || '').toLowerCase().includes(search.toLowerCase())
    const matchAttitude = !filterAttitude || n.attitude === filterAttitude
    return matchSearch && matchAttitude
  })

  if (loading) return <p style={{ color: T.inkFaint }}>Caricamento...</p>
  return (
    <div>
      <SH title="⚔ NPC" action={isDM && <BtnP onClick={openAdd}>+ Aggiungi</BtnP>} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}><Input placeholder="Cerca personaggio..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Sel value={filterAttitude} onChange={e => setFilterAttitude(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          <option value="">Tutti</option>
          {Object.keys(ATTITUDE_COLORS).map(a => <option key={a}>{a}</option>)}
        </Sel>
      </div>
      <p style={{ fontSize: 13, color: T.inkFaint, marginBottom: 12, fontStyle: 'italic' }}>{filtered.length} personaggi{filterAttitude ? ` (${filterAttitude})` : ''}</p>
      <NPCGrouped npcs={filtered} onSelect={setSelected} />
      {selected && (() => {
        const img = getPublicUrl('npc-images', selected.image_path)
        return (
          <Modal title={selected.name} onClose={() => setSelected(null)}>
            {img && <img src={img} alt={selected.name} style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 6, marginBottom: 12, border: `2px solid ${T.gold}`, display: 'block', margin: '0 auto 12px' }} />}
            <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}><Badge color={ATTITUDE_COLORS[selected.attitude] || T.inkFaint}>{selected.attitude}</Badge><Badge color={VITALITY_COLORS[selected.vitality] || T.inkFaint}>{selected.vitality || 'vivo'}</Badge>{selected.faction && <Badge color={T.gold}>{selected.faction}</Badge>}<span style={{ fontSize: 14, color: T.inkFaint, fontStyle: 'italic' }}>{selected.role}</span></div>{(selected.first_location || selected.current_location) && <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>{selected.first_location && <div style={{ fontSize: 13, color: T.inkFaint }}><span style={{ color: T.inkLight, fontWeight: 600 }}>Primo incontro: </span>{selected.first_location}</div>}{selected.current_location && <div style={{ fontSize: 13, color: T.inkFaint }}><span style={{ color: T.inkLight, fontWeight: 600 }}>Posizione: </span>{selected.current_location}</div>}</div>}
            <p style={{ fontSize: 16, lineHeight: 1.7, color: T.inkLight }}>{selected.description}</p>
            {isDM && selected.notes_dm && <><Divider /><div style={{ background: '#fff8e8', border: `1px solid ${T.goldLight}`, borderRadius: 4, padding: '0.75rem 1rem' }}><span style={{ fontSize: 12, fontWeight: 600, color: T.gold, display: 'block', marginBottom: 4, ...headerFont, letterSpacing: '0.05em' }}>NOTE DM</span><span style={{ fontSize: 14, color: T.inkLight }}>{selected.notes_dm}</span></div></>}
            {isDM && <div style={{ display: 'flex', gap: 8, marginTop: 16 }}><BtnS onClick={() => openEdit(null, selected)}>✏️ Modifica</BtnS><BtnD onClick={() => remove(selected.id)}>🗑️ Elimina</BtnD></div>}
          </Modal>
        )
      })()}
      {showModal && (
        <Modal title={editing ? 'Modifica Personaggio' : 'Nuovo Personaggio'} onClose={() => setShowModal(false)}>
          <ImgUpload bucket="npc-images" folder="npcs" currentPath={form.image_path} onUploaded={p => setForm({ ...form, image_path: p })} label="Ritratto" />
          <FF label="Nome"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FF>
          <FF label="Ruolo"><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></FF>
          <FF label="Attitudine"><Sel value={form.attitude} onChange={e => setForm({ ...form, attitude: e.target.value })}>{Object.keys(ATTITUDE_COLORS).map(a => <option key={a}>{a}</option>)}</Sel></FF>
          <FF label="Descrizione"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></FF>
          <FF label="Note DM (segrete)"><Textarea value={form.notes_dm} onChange={e => setForm({ ...form, notes_dm: e.target.value })} /></FF>
          <FF label="Stato"><Sel value={form.vitality} onChange={e => setForm({ ...form, vitality: e.target.value })}><option value="vivo">Vivo</option><option value="morto">Morto</option><option value="sconosciuto">Sconosciuto</option></Sel></FF>
          <FF label="Fazione"><Input value={form.faction || ''} onChange={e => setForm({ ...form, faction: e.target.value })} placeholder="es. Gilda dei Mercanti" /></FF>
          <FF label="Luogo primo incontro"><Input value={form.first_location || ''} onChange={e => setForm({ ...form, first_location: e.target.value })} placeholder="es. Taverna del Corvo" /></FF>
          <FF label="Posizione attuale"><Input value={form.current_location || ''} onChange={e => setForm({ ...form, current_location: e.target.value })} placeholder="es. Castello di Nordveil" /></FF>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowModal(false)}>Annulla</BtnS><BtnP onClick={save}>Salva</BtnP></div>
        </Modal>
      )}
    </div>
  )
}

// ─── Fazioni ─────────────────────────────────────────────────────────────────
function FactionsSection({ isDM }) {
  const [factions, setFactions] = useState([])
  const [sections, setSections] = useState({})
  const [collapsed, setCollapsed] = useState({})
  const [collapsedSections, setCollapsedSections] = useState({})
  const [loading, setLoading] = useState(true)
  const [showFactionModal, setShowFactionModal] = useState(false)
  const [editingFaction, setEditingFaction] = useState(null)
  const [factionForm, setFactionForm] = useState({ name: '', description: '' })
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [activeFactionId, setActiveFactionId] = useState(null)
  const [sectionForm, setSectionForm] = useState({ title: '', content: '' })

  useEffect(() => {
    Promise.all([
      supabase.from('factions').select('*').eq('campaign_id', 'sunless').order('order_index'),
      supabase.from('faction_sections').select('*').eq('campaign_id', 'sunless').order('order_index'),
    ]).then(([f, s]) => {
      const facs = f.data || []
      setFactions(facs)
      const grouped = {}
      const initCollapsed = {}
      facs.forEach(fac => {
        grouped[fac.id] = (s.data || []).filter(sec => sec.faction_id === fac.id)
        initCollapsed[fac.id] = true
      })
      setSections(grouped)
      setCollapsed(initCollapsed)
      setLoading(false)
    })
  }, [])

  const toggleFaction = (id) => setCollapsed(c => ({ ...c, [id]: !c[id] }))
  const toggleSection = (id) => setCollapsedSections(c => ({ ...c, [id]: !c[id] }))

  const openAddFaction = () => { setEditingFaction(null); setFactionForm({ name: '', description: '' }); setShowFactionModal(true) }
  const openEditFaction = (f) => { setEditingFaction(f); setFactionForm({ name: f.name, description: f.description || '' }); setShowFactionModal(true) }
  const saveFaction = async () => {
    if (!factionForm.name) return
    if (editingFaction) {
      const { data } = await supabase.from('factions').update(factionForm).eq('id', editingFaction.id).select()
      if (data) setFactions(factions.map(f => f.id === editingFaction.id ? data[0] : f))
    } else {
      const { data } = await supabase.from('factions').insert([{ campaign_id: 'sunless',  ...factionForm, order_index: factions.length }]).select()
      if (data) { setFactions([...factions, data[0]]); setSections(s => ({ ...s, [data[0].id]: [] })) }
    }
    setShowFactionModal(false)
  }
  const removeFaction = async (id) => {
    await supabase.from('factions').delete().eq('id', id)
    setFactions(factions.filter(f => f.id !== id))
    setSections(s => { const n = { ...s }; delete n[id]; return n })
  }

  const openAddSection = (factionId) => { setEditingSection(null); setActiveFactionId(factionId); setSectionForm({ title: '', content: '' }); setShowSectionModal(true) }
  const openEditSection = (sec, factionId) => { setEditingSection(sec); setActiveFactionId(factionId); setSectionForm({ title: sec.title, content: sec.content || '' }); setShowSectionModal(true) }
  const saveSection = async () => {
    if (!sectionForm.title) return
    if (editingSection) {
      const { data } = await supabase.from('faction_sections').update(sectionForm).eq('id', editingSection.id).select()
      if (data) setSections(s => ({ ...s, [activeFactionId]: s[activeFactionId].map(sec => sec.id === editingSection.id ? data[0] : sec) }))
    } else {
      const order = (sections[activeFactionId] || []).length
      const { data } = await supabase.from('faction_sections').insert([{ campaign_id: 'sunless',  ...sectionForm, faction_id: activeFactionId, order_index: order }]).select()
      if (data) setSections(s => ({ ...s, [activeFactionId]: [...(s[activeFactionId] || []), data[0]] }))
    }
    setShowSectionModal(false)
  }
  const removeSection = async (secId, factionId) => {
    await supabase.from('faction_sections').delete().eq('id', secId)
    setSections(s => ({ ...s, [factionId]: s[factionId].filter(sec => sec.id !== secId) }))
  }

  if (loading) return <p style={{ color: T.inkFaint }}>Caricamento...</p>
  return (
    <div>
      <SH title="⚜ Fazioni" action={isDM && <BtnP onClick={openAddFaction}>+ Fazione</BtnP>} />
      {factions.length === 0 && <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>Nessuna fazione ancora registrata...</p>}
      {factions.map(faction => (
        <div key={faction.id} style={{ marginBottom: 16 }}>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', borderBottom: collapsed[faction.id] ? 'none' : `1px solid ${T.parchmentDarker}` }}
              onClick={() => toggleFaction(faction.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: T.gold, fontSize: 12 }}></span>
                <span style={{ fontWeight: 700, fontSize: 17, color: T.ink, ...headerFont }}>{faction.name}</span>
              </div>
              {isDM && (
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEditFaction(faction)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>✏️</button>
                  <button onClick={() => removeFaction(faction.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>🗑️</button>
                </div>
              )}
            </div>
            {!collapsed[faction.id] && (
              <div style={{ padding: '12px 16px' }}>
                {faction.description && <p style={{ fontSize: 15, color: T.inkLight, lineHeight: 1.7, margin: '0 0 12px', fontStyle: 'italic' }}>{faction.description}</p>}
                {(sections[faction.id] || []).map(sec => (
                  <div key={sec.id} style={{ marginBottom: 8, border: `1px solid ${T.parchmentDarker}`, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer', background: T.parchmentDark + '88' }}
                      onClick={() => toggleSection(sec.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'inline-block', width: 0, height: 0, borderTop: collapsedSections[sec.id] ? '4px solid transparent' : 'none', borderBottom: collapsedSections[sec.id] ? '4px solid transparent' : 'none', borderRight: collapsedSections[sec.id] ? `7px solid ${T.inkFaint}` : 'none', borderLeft: collapsedSections[sec.id] ? 'none' : `7px solid ${T.inkFaint}`, marginTop: collapsedSections[sec.id] ? 0 : '2px' }} />
                        <span style={{ fontWeight: 600, fontSize: 15, color: T.red, ...headerFont }}>{sec.title}</span>
                      </div>
                      {isDM && (
                        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditSection(sec, faction.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4, color: T.inkFaint }}>✏️</button>
                          <button onClick={() => removeSection(sec.id, faction.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4, color: T.inkFaint }}>🗑️</button>
                        </div>
                      )}
                    </div>
                    {!collapsedSections[sec.id] && (
                      <div style={{ padding: '10px 14px' }}>
                        <p style={{ fontSize: 15, lineHeight: 1.8, color: T.inkLight, margin: 0, whiteSpace: 'pre-wrap' }}>{sec.content || <span style={{ fontStyle: 'italic', color: T.inkFaint }}>Nessun contenuto.</span>}</p>
                      </div>
                    )}
                  </div>
                ))}
                {isDM && (
                  <button onClick={() => openAddSection(faction.id)}
                    style={{ marginTop: 8, background: 'transparent', border: `1px dashed ${T.parchmentDarker}`, borderRadius: 4, padding: '8px 14px', fontSize: 14, cursor: 'pointer', color: T.inkFaint, width: '100%', textAlign: 'left', ...bodyFont }}>
                    + Aggiungi sezione
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>
      ))}
      {showFactionModal && (
        <Modal title={editingFaction ? 'Modifica Fazione' : 'Nuova Fazione'} onClose={() => setShowFactionModal(false)}>
          <FF label="Nome"><Input value={factionForm.name} onChange={e => setFactionForm({ ...factionForm, name: e.target.value })} placeholder="es. Impero di Zandria" /></FF>
          <FF label="Descrizione"><Textarea value={factionForm.description} onChange={e => setFactionForm({ ...factionForm, description: e.target.value })} /></FF>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowFactionModal(false)}>Annulla</BtnS><BtnP onClick={saveFaction}>Salva</BtnP></div>
        </Modal>
      )}
      {showSectionModal && (
        <Modal title={editingSection ? 'Modifica Sezione' : 'Nuova Sezione'} onClose={() => setShowSectionModal(false)}>
          <FF label="Titolo"><Input value={sectionForm.title} onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })} placeholder="es. Storia, Sede, Governance..." /></FF>
          <FF label="Contenuto"><Textarea value={sectionForm.content} onChange={e => setSectionForm({ ...sectionForm, content: e.target.value })} style={{ minHeight: 160 }} /></FF>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowSectionModal(false)}>Annulla</BtnS><BtnP onClick={saveSection}>Salva</BtnP></div>
        </Modal>
      )}
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function TimelineSection({ isDM }) {
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ date_ingame: '', title: '', description: '', type: 'altro' })
  const [loading, setLoading] = useState(true)
  const [allCharacters, setAllCharacters] = useState([])

  useEffect(() => { supabase.from('timeline_events').select('*').eq('campaign_id', 'sunless').order('created_at').then(({ data }) => { setEvents(data || []); setLoading(false) }) }, [])

  const openAdd = () => { setEditing(null); setForm({ date_ingame: '', title: '', description: '', type: 'altro' }); setShowModal(true) }
  const openEdit = (e, ev) => { e.stopPropagation(); setEditing(ev); setForm({ date_ingame: ev.date_ingame || '', title: ev.title, description: ev.description || '', type: ev.type }); setShowModal(true) }
  const save = async () => {
    if (!form.title) return
    if (editing) { const { data } = await supabase.from('timeline_events').update(form).eq('id', editing.id).select(); if (data) setEvents(events.map(e => e.id === editing.id ? data[0] : e)) }
    else { const { data } = await supabase.from('timeline_events').insert([{ ...form, campaign_id: 'sunless' }]).select(); if (data) setEvents([...events, data[0]]) }
    setShowModal(false)
  }
  const remove = async (e, id) => { e.stopPropagation(); await supabase.from('timeline_events').delete().eq('id', id); setEvents(events.filter(ev => ev.id !== id)) }

  if (loading) return <p style={{ color: T.inkFaint }}>Caricamento...</p>
  return (
    <div>
      <SH title="📅 Cronaca della Campagna" action={isDM && <BtnP onClick={openAdd}>+ Evento</BtnP>} />
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom, ${T.gold}, ${T.goldLight}, ${T.gold})` }} />
        {events.length === 0 && <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>La storia non è ancora stata scritta...</p>}
        {events.map(ev => (
          <div key={ev.id} style={{ position: 'relative', marginBottom: 20 }}>
            <div style={{ position: 'absolute', left: -22, top: 8, width: 14, height: 14, borderRadius: '50%', background: EVENT_COLORS[ev.type] || T.inkFaint, border: `2px solid ${T.parchment}`, boxShadow: `0 0 0 2px ${EVENT_COLORS[ev.type] || T.inkFaint}44` }} />
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><span style={{ fontSize: 11, color: T.gold, ...headerFont, letterSpacing: '0.05em' }}>{ev.date_ingame}</span><div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontWeight: 600, color: T.ink, fontSize: 16, ...headerFont }}>{ev.title}</span><Badge color={EVENT_COLORS[ev.type] || T.inkFaint}>{ev.type}</Badge></div></div>
                {isDM && <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}><button onClick={e => openEdit(e, ev)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>✏️</button><button onClick={e => remove(e, ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>🗑️</button></div>}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 15, color: T.inkLight, lineHeight: 1.6 }}>{ev.description}</p>
            </Card>
          </div>
        ))}
      </div>
      {showModal && (
        <Modal title={editing ? 'Modifica Evento' : 'Nuovo Evento'} onClose={() => setShowModal(false)}>
          <FF label="Data in-game"><Input value={form.date_ingame} onChange={e => setForm({ ...form, date_ingame: e.target.value })} placeholder="Anno 412, Mese del Vento" /></FF>
          <FF label="Titolo"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></FF>
          <FF label="Tipo"><Sel value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{Object.keys(EVENT_COLORS).map(t => <option key={t}>{t}</option>)}</Sel></FF>
          <FF label="Descrizione"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></FF>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowModal(false)}>Annulla</BtnS><BtnP onClick={save}>Salva</BtnP></div>
        </Modal>
      )}
    </div>
  )
}

// ─── Mappa ────────────────────────────────────────────────────────────────────
function MapSection({ isDM }) {
  const [pins, setPins] = useState([])
  const [mapUrl, setMapUrl] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingPin, setEditingPin] = useState(null)
  const [pendingPos, setPendingPos] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', status: 'sconosciuto' })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.from('map_pins').select('*').eq('campaign_id', 'sunless').then(({ data }) => { setPins(data || []); setLoading(false) })
    // Mappa di Sunless nella cartella sunless/ del bucket, separata da quella dei Cinghiali
    supabase.storage.from('map-images').list('sunless').then(({ data }) => {
      const f = (data || []).find(f => f.name.startsWith('map.'))
      if (f) setMapUrl(getPublicUrl('map-images', `sunless/${f.name}`) + '?t=' + Date.now())
    })
  }, [])

  const uploadMap = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    await supabase.storage.from('map-images').upload(`sunless/map.${ext}`, file, { upsert: true })
    setMapUrl(getPublicUrl('map-images', `sunless/map.${ext}`) + '?t=' + Date.now())
    setUploading(false); setShowUploadModal(false)
  }
  const handleClick = (e) => {
    if (!isDM) return
    const rect = e.currentTarget.getBoundingClientRect()
    setPendingPos({ x_percent: Math.round(((e.clientX - rect.left) / rect.width) * 100), y_percent: Math.round(((e.clientY - rect.top) / rect.height) * 100) })
    setEditingPin(null); setForm({ name: '', description: '', status: 'sconosciuto' }); setShowPinModal(true)
  }
  const openEditPin = (e, pin) => { e.stopPropagation(); setEditingPin(pin); setForm({ name: pin.name, description: pin.description || '', status: pin.status }); setPendingPos(null); setShowPinModal(true) }
  const savePin = async () => {
    if (!form.name) return
    if (editingPin) { const { data } = await supabase.from('map_pins').update(form).eq('id', editingPin.id).select(); if (data) setPins(pins.map(p => p.id === editingPin.id ? data[0] : p)) }
    else if (pendingPos) { const { data } = await supabase.from('map_pins').insert([{ campaign_id: 'sunless',  ...form, ...pendingPos }]).select(); if (data) setPins([...pins, data[0]]) }
    setShowPinModal(false); setPendingPos(null); setEditingPin(null)
  }
  const removePin = async (id) => { await supabase.from('map_pins').delete().eq('id', id); setPins(pins.filter(p => p.id !== id)); setSelected(null) }

  const renderPins = () => pins.map(pin => (
    <div key={pin.id} onClick={e => { e.stopPropagation(); setSelected(pin) }} style={{ position: 'absolute', left: `${pin.x_percent}%`, top: `${pin.y_percent}%`, transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: 10 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: STATUS_COLORS[pin.status] || T.inkFaint, border: '2.5px solid #f4e4c1', boxShadow: '0 2px 6px rgba(0,0,0,0.6)' }} />
    </div>
  ))

  if (loading) return <p style={{ color: T.inkFaint }}>Caricamento...</p>
  return (
    <div>
      <SH title="🗺️ Mappa del Mondo" action={isDM && <BtnS onClick={() => setShowUploadModal(true)}>Carica mappa</BtnS>} />
      {isDM && <p style={{ fontSize: 14, color: T.inkFaint, marginBottom: 12, fontStyle: 'italic' }}>Clicca sulla mappa per segnare un luogo.</p>}
      <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', border: `3px solid ${T.gold}`, boxShadow: `0 4px 16px rgba(44,24,16,0.3)` }}>
        {mapUrl ? (
          <div style={{ position: 'relative', width: '100%', cursor: isDM ? 'crosshair' : 'default' }} onClick={handleClick}>
            <img src={mapUrl} alt="Mappa" style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0 }}>{renderPins()}</div>
          </div>
        ) : (
          <div style={{ width: '100%', paddingBottom: '50%', position: 'relative', cursor: isDM ? 'crosshair' : 'default', background: '#2a1a0a' }} onClick={handleClick}>
            <div style={{ position: 'absolute', inset: 0 }}>{renderPins()}</div>
            {isDM && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><span style={{ color: 'rgba(244,228,193,0.4)', fontSize: 14, fontStyle: 'italic' }}>Terra inesplorata — carica una mappa</span></div>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([k, v]) => <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.inkFaint }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: v, display: 'inline-block' }} />{k}</span>)}
      </div>
      {selected && <Modal title={selected.name} onClose={() => setSelected(null)}><Badge color={STATUS_COLORS[selected.status] || T.inkFaint}>{selected.status}</Badge><p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.7, color: T.inkLight }}>{selected.description}</p>{isDM && <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><BtnS onClick={e => openEditPin(e, selected)}>✏️ Modifica</BtnS><BtnD onClick={() => removePin(selected.id)}>🗑️ Elimina</BtnD></div>}</Modal>}
      {showPinModal && <Modal title={editingPin ? 'Modifica Luogo' : 'Segna Luogo'} onClose={() => { setShowPinModal(false); setPendingPos(null) }}><FF label="Nome"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FF><FF label="Stato"><Sel value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}</Sel></FF><FF label="Descrizione"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></FF><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => { setShowPinModal(false); setPendingPos(null) }}>Annulla</BtnS><BtnP onClick={savePin}>Segna</BtnP></div></Modal>}
      {showUploadModal && <Modal title="Carica Mappa" onClose={() => setShowUploadModal(false)}><p style={{ fontSize: 15, color: T.inkLight, marginTop: 0 }}>Il formato si adatterà automaticamente.</p><input type="file" accept="image/*" onChange={uploadMap} style={{ fontSize: 16, color: T.ink }} />{uploading && <p style={{ color: T.inkFaint, marginTop: 8 }}>Caricamento...</p>}</Modal>}
    </div>
  )
}

// ─── Incantesimi ──────────────────────────────────────────────────────────────
function SpellsSection() {
  const [spells, setSpells] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allCharacters, setAllCharacters] = useState([])

  useEffect(() => { fetch('https://www.dnd5eapi.co/api/spells?limit=500').then(r => r.json()).then(d => { setSpells((d.results || []).map(s => ({ id: s.index, name: s.name, index: s.index }))); setLoading(false) }).catch(() => setLoading(false)) }, [])

  const loadDetail = async (spell) => {
    if (spell.level !== undefined) { setSelected(spell); return }
    const res = await fetch(`https://www.dnd5eapi.co/api/spells/${spell.index}`)
    const d = await res.json()
    setSelected({ ...spell, level: d.level, school: d.school?.name || '', castingTime: d.casting_time, range: d.range, components: (d.components || []).join(', '), duration: d.duration, description: (d.desc || []).join(' '), concentration: d.concentration, ritual: d.ritual })
  }

  const filtered = spells.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))
  if (loading) return <p style={{ color: T.inkFaint }}>Consultazione dei tomi arcani...</p>
  return (
    <div>
      <SH title="✨ Compendio Incantesimi" />
      <p style={{ fontSize: 14, color: T.inkFaint, marginBottom: 12, fontStyle: 'italic' }}>{spells.length} incantesimi dai Tomi Fondamentali.</p>
      <div style={{ marginBottom: 16 }}><Input placeholder="Cerca incantesimo..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,180px),1fr))', gap: 8 }}>
        {filtered.slice(0, 60).map(s => <Card key={s.id} onClick={() => loadDetail(s)} style={{ padding: '0.75rem 1rem' }}><div style={{ fontWeight: 600, fontSize: 15, color: T.ink, ...headerFont }}>{s.name}</div></Card>)}
      </div>
      {filtered.length > 60 && <p style={{ fontSize: 14, color: T.inkFaint, marginTop: 12, fontStyle: 'italic' }}>Mostrando 60 di {filtered.length}. Affina la ricerca.</p>}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          {selected.level !== undefined && <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <Badge color={SCHOOL_COLORS[selected.school] || T.inkFaint}>{selected.school}</Badge>
              <Badge color={T.blue}>{selected.level === 0 ? 'Trucchetto' : `Lv ${selected.level}`}</Badge>
              {selected.concentration && <Badge color={T.red}>Concentrazione</Badge>}
              {selected.ritual && <Badge color={T.gold}>Rituale</Badge>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[['Tempo', selected.castingTime], ['Gittata', feetToMeters(selected.range)], ['Componenti', selected.components], ['Durata', feetToMeters(selected.duration)]].map(([k, v]) => <div key={k} style={{ background: T.parchmentDark, borderRadius: 4, padding: '8px 10px', border: `1px solid ${T.parchmentDarker}` }}><div style={{ fontSize: 11, color: T.gold, marginBottom: 2, ...headerFont, letterSpacing: '0.05em' }}>{k.toUpperCase()}</div><div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{v}</div></div>)}
            </div>
            <Divider />
          </>}
          <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0, color: T.inkLight }}>{selected.description || 'Caricamento...'}</p>
        </Modal>
      )}
    </div>
  )
}

// ─── Note DM ──────────────────────────────────────────────────────────────────
function DMNotesSection() {
  const [noteText, setNoteText] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [noteId, setNoteId] = useState(null)
  const noteRef = useRef('')

  useEffect(() => {
    supabase.from('dm_notes').select('*').eq('campaign_id', 'sunless').limit(1).maybeSingle().then(({ data }) => {
      if (data) { setNoteText(data.content || ''); noteRef.current = data.content || ''; setNoteId(data.id) }
      setLoading(false)
    })
  }, [])

  const save = async () => {
    const textToSave = noteRef.current
    if (noteId) { await supabase.from('dm_notes').update({ content: textToSave, updated_at: new Date().toISOString() }).eq('id', noteId) }
    else { const { data } = await supabase.from('dm_notes').insert([{ campaign_id: 'sunless',  content: textToSave }]).select(); if (data) setNoteId(data[0].id) }
    setEditing(false)
  }

  const handleChange = (val) => { setNoteText(val); noteRef.current = val }

  if (loading) return <p style={{ color: T.inkFaint }}>Caricamento...</p>
  return (
    <div>
      <SH title="🔒 Pergamene Segrete del DM" action={editing ? <BtnP onClick={save}>Sigilla</BtnP> : <BtnS onClick={() => setEditing(true)}>Scrivi</BtnS>} />
      <Card style={{ background: `linear-gradient(135deg, #fff8e8, #f8edd8)`, border: `1.5px solid ${T.goldLight}` }}>
        {editing
          ? <div><textarea value={noteText} onChange={e => handleChange(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', minHeight: 200, background: 'transparent', border: 'none', outline: 'none', fontSize: 16, lineHeight: 1.8, resize: 'vertical', color: T.ink, fontFamily: "'Crimson Text', Georgia, serif" }} /></div>
          : <pre style={{ margin: 0, fontFamily: "'Crimson Text', Georgia, serif", fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: T.inkLight, fontStyle: 'italic' }}>{noteText || 'Nessuna pergamena segreta...'}</pre>}
      </Card>
    </div>
  )
}



// ─── Libro incantesimi PG ─────────────────────────────────────────────────────
function SpellbookTab({ playerId, isOwner }) {
  const [spells, setSpells] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [srdSpells, setSrdSpells] = useState([])
  const [srdSearch, setSrdSearch] = useState('')
  const [srdLoading, setSrdLoading] = useState(false)
  const [selectedSrd, setSelectedSrd] = useState(null)
  const [selectedMulti, setSelectedMulti] = useState([]) // multi-select
  const [expandedSpell, setExpandedSpell] = useState(null)
  const [customForm, setCustomForm] = useState({ spell_name: '', spell_level: 0, school: '', casting_time: '1 azione', is_concentration: false, is_bonus_action: false, is_ritual: false, description: '' })

  useEffect(() => { supabase.from('character_spells').select('*').eq('player_id', playerId).eq('campaign_id', 'sunless').order('spell_level').then(({ data }) => { setSpells(data || []); setLoading(false) }) }, [playerId])

  const searchSrd = async (q) => {
    if (!q || q.length < 2) { setSrdSpells([]); return }
    setSrdLoading(true)
    try { const res = await fetch(`https://www.dnd5eapi.co/api/spells?limit=500`); const data = await res.json(); setSrdSpells((data.results || []).filter(s => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 30)) } catch {}
    setSrdLoading(false)
  }
  const toggleMultiSelect = (spell) => {
    setSelectedMulti(prev => prev.find(s => s.index === spell.index) ? prev.filter(s => s.index !== spell.index) : [...prev, spell])
  }
  const loadSrdDetail = async (spell) => {
    const res = await fetch(`https://www.dnd5eapi.co/api/spells/${spell.index}`); const d = await res.json()
    return { name: spell.name, level: d.level, school: d.school?.name || '', castingTime: d.casting_time, concentration: d.concentration, ritual: d.ritual, description: (d.desc || []).join(' '), isBonus: d.casting_time?.toLowerCase().includes('bonus') }
  }
  const addFromSrd = async () => {
    if (selectedMulti.length === 0 && !selectedSrd) return
    const toAdd = selectedSrd ? [selectedSrd] : await Promise.all(selectedMulti.map(s => loadSrdDetail(s)))
    const rows = toAdd.map(s => ({ player_id: playerId, spell_name: s.name, spell_level: s.level, school: s.school, casting_time: s.castingTime, is_concentration: s.concentration || false, is_bonus_action: s.isBonus || false, is_ritual: s.ritual || false, description: s.description, is_custom: false }))
    const { data } = await supabase.from('character_spells').insert(rows).select()
    if (data) setSpells([...spells, ...data])
    setShowAddModal(false); setSelectedSrd(null); setSrdSearch(''); setSrdSpells([]); setSelectedMulti([])
  }
  const addCustom = async () => {
    if (!customForm.spell_name) return
    const { data } = await supabase.from('character_spells').insert([{ campaign_id: 'sunless',  ...customForm, player_id: playerId, is_custom: true }]).select()
    if (data) setSpells([...spells, data[0]])
    setShowCustomModal(false); setCustomForm({ spell_name: '', spell_level: 0, school: '', casting_time: '1 azione', is_concentration: false, is_bonus_action: false, is_ritual: false, description: '' })
  }
  const toggleField = async (spell, field) => {
    const newVal = !spell[field]
    await supabase.from('character_spells').update({ [field]: newVal }).eq('id', spell.id)
    setSpells(spells.map(s => s.id === spell.id ? { ...s, [field]: newVal } : s))
  }
  const removeSpell = async (id) => { await supabase.from('character_spells').delete().eq('id', id); setSpells(spells.filter(s => s.id !== id)) }

  const byLevel = spells.reduce((acc, s) => { const l = s.spell_level; if (!acc[l]) acc[l] = []; acc[l].push(s); return acc }, {})

  if (loading) return <p style={{ color: T.inkFaint }}>Consultazione del libro...</p>
  return (
    <div>
      {isOwner && <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}><BtnP onClick={() => setShowAddModal(true)}>+ Dal compendio</BtnP><BtnS onClick={() => setShowCustomModal(true)}>+ Personalizzato</BtnS></div>}
      {spells.length === 0 && <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>Il libro è ancora vuoto...</p>}
      {Object.keys(byLevel).sort((a, b) => parseInt(a) - parseInt(b)).map(level => (
        <div key={level} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: '0.08em', ...headerFont }}>{parseInt(level) === 0 ? '✦ TRUCCHETTI' : `✦ LIVELLO ${level}`}</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${T.gold}44, transparent)` }} />
          </div>
          {byLevel[level].map(spell => (
            <Card key={spell.id} style={{ padding: '0.75rem 1rem', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpandedSpell(expandedSpell === spell.id ? null : spell.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 16, color: T.ink, ...headerFont }}>{spell.spell_name}</span>
                    {spell.is_concentration && <Badge color={T.red}>Conc.</Badge>}
                    {spell.is_bonus_action && <Badge color={T.gold}>Azione bonus</Badge>}
                    {spell.is_ritual && <Badge color={T.purple}>Rituale</Badge>}
                    {spell.is_custom && <Badge color={T.inkFaint}>Custom</Badge>}
                    <span style={{ display:'inline-block',width:0,height:0,borderTop:expandedSpell===spell.id?'5px solid transparent':'none',borderBottom:expandedSpell===spell.id?'5px solid transparent':'none',borderRight:expandedSpell===spell.id?'none':`7px solid ${T.inkFaint}`,borderLeft:expandedSpell===spell.id?`7px solid ${T.inkFaint}`:'none',marginTop:expandedSpell===spell.id?'3px':0 }} />
                  </div>
                  {spell.casting_time && <div style={{ fontSize: 13, color: T.inkFaint, fontStyle: 'italic' }}>{spell.casting_time}</div>}
                  {expandedSpell === spell.id && spell.description && <p style={{ fontSize: 14, color: T.inkLight, lineHeight: 1.7, margin: '8px 0 0', fontStyle: 'italic' }}>{spell.description}</p>}
                </div>
                {isOwner && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    {[['is_prepared', 'Preparato', T.green], ['is_used', 'Usato', T.red]].map(([field, label, color]) => (
                      <div key={field} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button onClick={() => toggleField(spell, field)} style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${spell[field] ? color : T.parchmentDarker}`, background: spell[field] ? color : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {spell[field] && <span style={{ color: '#f8edd8', fontSize: 13, lineHeight: 1 }}>✓</span>}
                        </button>
                        <span style={{ fontSize: 12, color: spell[field] ? color : T.inkFaint }}>{label}</span>
                      </div>
                    ))}
                    <button onClick={() => removeSpell(spell.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 2, color: T.inkFaint, textAlign: 'right' }}>🗑️</button>
                  </div>
                )}
                {!isOwner && <div style={{ display: 'flex', gap: 4 }}>{spell.is_prepared && <Badge color={T.green}>Preparato</Badge>}{spell.is_used && <Badge color={T.red}>Usato</Badge>}</div>}
              </div>
            </Card>
          ))}
        </div>
      ))}
      {showAddModal && (
        <Modal title="Aggiungi dal Compendio" onClose={() => { setShowAddModal(false); setSelectedSrd(null); setSrdSearch(''); setSrdSpells([]); setSelectedMulti([]) }}>
          <FF label="Cerca incantesimo"><Input value={srdSearch} onChange={e => { setSrdSearch(e.target.value); searchSrd(e.target.value) }} placeholder="Digita il nome..." /></FF>
          {srdLoading && <p style={{ color: T.inkFaint, fontSize: 14, fontStyle: 'italic' }}>Consultando i tomi...</p>}
          {selectedMulti.length > 0 && <div style={{ background: `${T.green}11`, border: `1px solid ${T.green}44`, borderRadius: 4, padding: '8px 12px', marginBottom: 12, fontSize: 14, color: T.green }}>{selectedMulti.length} incantesimi selezionati</div>}
          {srdSpells.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16, maxHeight: 320, overflowY: 'auto' }}>
              {srdSpells.map(s => {
                const isSelected = selectedMulti.find(m => m.index === s.index)
                return (
                  <label key={s.index} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: `1px solid ${isSelected ? T.green : T.parchmentDarker}`, borderRadius: 4, background: isSelected ? `${T.green}11` : T.parchmentDark, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!isSelected} onChange={() => toggleMultiSelect(s)} style={{ width: 16, height: 16, accentColor: T.green }} />
                    <span style={{ fontSize: 15, color: T.ink, ...bodyFont }}>{s.name}</span>
                  </label>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <BtnS onClick={() => { setShowAddModal(false); setSelectedSrd(null); setSelectedMulti([]) }}>Annulla</BtnS>
            <BtnP onClick={addFromSrd} disabled={selectedMulti.length === 0}>Aggiungi {selectedMulti.length > 0 ? `(${selectedMulti.length})` : ''}</BtnP>
          </div>
        </Modal>
      )}
      {showCustomModal && (
        <Modal title="Incantesimo Personale" onClose={() => setShowCustomModal(false)}>
          <FF label="Nome"><Input value={customForm.spell_name} onChange={e => setCustomForm({ ...customForm, spell_name: e.target.value })} /></FF>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <FF label="Livello (0=trucchetto)"><Input type="number" min="0" max="9" value={customForm.spell_level} onChange={e => setCustomForm({ ...customForm, spell_level: parseInt(e.target.value) || 0 })} /></FF>
            <FF label="Scuola"><Input value={customForm.school} onChange={e => setCustomForm({ ...customForm, school: e.target.value })} /></FF>
          </div>
          <FF label="Tempo di lancio"><Input value={customForm.casting_time} onChange={e => setCustomForm({ ...customForm, casting_time: e.target.value })} /></FF>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            {[['is_concentration', 'Concentrazione'], ['is_bonus_action', 'Azione bonus'], ['is_ritual', 'Rituale']].map(([field, label]) => (
              <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, cursor: 'pointer', color: T.inkLight }}>
                <input type="checkbox" checked={customForm[field]} onChange={e => setCustomForm({ ...customForm, [field]: e.target.checked })} style={{ width: 18, height: 18 }} />
                {label}
              </label>
            ))}
          </div>
          <FF label="Descrizione"><Textarea value={customForm.description} onChange={e => setCustomForm({ ...customForm, description: e.target.value })} /></FF>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowCustomModal(false)}>Annulla</BtnS><BtnP onClick={addCustom}>Trascrivi</BtnP></div>
        </Modal>
      )}
    </div>
  )
}

// ─── Scheda giocatore ─────────────────────────────────────────────────────────
function PlayerTab({ player, currentUserId, isDM, viewLegacyId }) {
  const isOwner = isDM || currentUserId === player.id
  const [activeTab, setActiveTab] = useState('scheda')
  const [character, setCharacter] = useState(null)
  const [inventory, setInventory] = useState([])
  const [companions, setCompanions] = useState([])
  const [sessionNotes, setSessionNotes] = useState([])
  const [editChar, setEditChar] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showCompModal, setShowCompModal] = useState(false)
  const [editingComp, setEditingComp] = useState(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [expandedNote, setExpandedNote] = useState(null)
  const EC = { name: '', class: '', race: '', level: 1, hp: 10, max_hp: 10, ac: 10, initiative_bonus: 0, background: '', image_path: '', str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, attacks: '', spell_slots_total: '', spell_slots_used: '', gold: 0, silver: 0, copper: 0, platinum: 0 }
  const [charForm, setCharForm] = useState(EC)
  const EI = { name: '', type: 'Vari', description: '', quantity: 1 }
  const [itemForm, setItemForm] = useState(EI)
  const ECP = { name: '', type: '', hp: '', ac: '', notes: '', image_path: '' }
  const [compForm, setCompForm] = useState(ECP)
  const EN = { session_title: '', date: '', content: '' }
  const [noteForm, setNoteForm] = useState(EN)
  const [loading, setLoading] = useState(true)
  const [allCharacters, setAllCharacters] = useState([])

  useEffect(() => {
    Promise.all([
      supabase.from('characters').select('*').eq('player_id', player.id).eq('campaign_id', 'sunless').order('created_at', { ascending: false }),
      supabase.from('inventory').select('*').eq('player_id', player.id).eq('campaign_id', 'sunless'),
      supabase.from('companions').select('*').eq('player_id', player.id).eq('campaign_id', 'sunless'),
      supabase.from('player_session_notes').select('*').eq('player_id', player.id).eq('campaign_id', 'sunless').order('created_at', { ascending: false }),
    ]).then(([c, inv, comp, n]) => {
      const chars = Array.isArray(c.data) ? c.data : (c.data ? [c.data] : [])
      // If viewing a specific legacy char, show that one
      const active = viewLegacyId
        ? (chars.find(ch => ch.id === viewLegacyId) || chars.find(ch => !ch.is_legacy) || chars[0] || null)
        : (chars.find(ch => !ch.is_legacy) || chars[0] || null)
      if (active) { setCharacter(active); setCharForm({ ...EC, ...active }) }
      setAllCharacters(chars)
      setInventory(inv.data || []); setCompanions(comp.data || []); setSessionNotes(n.data || []); setLoading(false)
    })
  }, [player.id, viewLegacyId])

  const saveChar = async () => {
    const payload = { ...charForm, initiative_bonus: parseInt(charForm.initiative_bonus) || 0 }
    if (character) {
      const { data } = await supabase.from('characters').update(payload).eq('id', character.id).select()
      if (data) { setCharacter(data[0]); setAllCharacters(prev => prev.map(c => c.id === data[0].id ? data[0] : c)) }
    } else {
      const { data } = await supabase.from('characters').insert([{ ...payload, player_id: player.id, is_legacy: false, campaign_id: 'sunless' }]).select()
      if (data) { setCharacter(data[0]); setAllCharacters(prev => [...prev, data[0]]) }
    }
    setEditChar(false)
  }

  const markAsLegacy = async (charId, note) => {
    const { data } = await supabase.from('characters').update({ is_legacy: true, legacy_note: note }).eq('id', charId).select()
    if (data) { setAllCharacters(prev => prev.map(c => c.id === charId ? data[0] : c)); setCharacter(null); setCharForm(EC) }
  }

  const createNewCharacter = () => {
    setCharacter(null)
    setCharForm(EC)
    setEditChar(true)
  }


  const handleCoin = async (key, val) => { setCharForm(f => ({ ...f, [key]: val })); if (character) { await supabase.from('characters').update({ [key]: val }).eq('id', character.id); setCharacter(c => ({ ...c, [key]: val })) } }
  const openAddItem = () => { setEditingItem(null); setItemForm(EI); setShowItemModal(true) }
  const openEditItem = (item) => { setEditingItem(item); setItemForm({ name: item.name, type: item.type, description: item.description || '', quantity: item.quantity }); setShowItemModal(true) }
  const saveItem = async () => {
    if (!itemForm.name) return
    if (editingItem) { const { data } = await supabase.from('inventory').update(itemForm).eq('id', editingItem.id).select(); if (data) setInventory(inventory.map(i => i.id === editingItem.id ? data[0] : i)) }
    else { const { data } = await supabase.from('inventory').insert([{ ...itemForm, player_id: player.id, campaign_id: 'sunless' }]).select(); if (data) setInventory([...inventory, data[0]]) }
    setShowItemModal(false)
  }
  const removeItem = async (id) => { await supabase.from('inventory').delete().eq('id', id); setInventory(inventory.filter(i => i.id !== id)) }
  const openAddComp = () => { setEditingComp(null); setCompForm(ECP); setShowCompModal(true) }
  const openEditComp = (c) => { setEditingComp(c); setCompForm({ name: c.name, type: c.type || '', hp: c.hp || '', ac: c.ac || '', notes: c.notes || '', image_path: c.image_path || '' }); setShowCompModal(true) }
  const saveComp = async () => {
    if (!compForm.name) return
    if (editingComp) { const { data } = await supabase.from('companions').update(compForm).eq('id', editingComp.id).select(); if (data) setCompanions(companions.map(c => c.id === editingComp.id ? data[0] : c)) }
    else { const { data } = await supabase.from('companions').insert([{ campaign_id: 'sunless',  ...compForm, player_id: player.id }]).select(); if (data) setCompanions([...companions, data[0]]) }
    setShowCompModal(false)
  }
  const removeComp = async (id) => { await supabase.from('companions').delete().eq('id', id); setCompanions(companions.filter(c => c.id !== id)) }
  const openAddNote = () => { setEditingNote(null); setNoteForm(EN); setShowNoteModal(true) }
  const openEditNote = (n) => { setEditingNote(n); setNoteForm({ session_title: n.session_title, date: n.date || '', content: n.content || '' }); setShowNoteModal(true) }
  const saveNote = async () => {
    if (!noteForm.session_title) return
    if (editingNote) { const { data } = await supabase.from('player_session_notes').update(noteForm).eq('id', editingNote.id).select(); if (data) setSessionNotes(sessionNotes.map(n => n.id === editingNote.id ? data[0] : n)) }
    else { const { data } = await supabase.from('player_session_notes').insert([{ campaign_id: 'sunless',  ...noteForm, player_id: player.id }]).select(); if (data) setSessionNotes([data[0], ...sessionNotes]) }
    setShowNoteModal(false)
  }
  const removeNote = async (id) => { await supabase.from('player_session_notes').delete().eq('id', id); setSessionNotes(sessionNotes.filter(n => n.id !== id)) }

  if (loading) return <p style={{ color: T.inkFaint }}>Consultazione degli archivi...</p>

  const hpPct = character ? Math.round((character.hp / character.max_hp) * 100) : 0
  const hpColor = hpPct > 60 ? T.green : hpPct > 30 ? T.gold : T.red
  const imgUrl = character ? getPublicUrl('character-images', character.image_path) : null
  const STATS = [['FOR', 'str'], ['DES', 'dex'], ['COS', 'con'], ['INT', 'int'], ['SAG', 'wis'], ['CAR', 'cha']]
  const mod = (v) => { const m = Math.floor(((v || 10) - 10) / 2); return (m >= 0 ? '+' : '') + m }
  const slotsT = character?.spell_slots_total ? character.spell_slots_total.split(',').map(s => parseInt(s.trim()) || 0) : []
  const slotsU = character?.spell_slots_used ? character.spell_slots_used.split(',').map(s => parseInt(s.trim()) || 0) : []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        {imgUrl ? <img src={imgUrl} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${player.player_color || T.gold}`, flexShrink: 0, boxShadow: '0 2px 8px rgba(44,24,16,0.3)' }} />
          : <div style={{ width: 60, height: 60, borderRadius: '50%', background: (player.player_color || T.gold) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600, color: player.player_color || T.gold, border: `3px solid ${player.player_color || T.gold}`, flexShrink: 0, ...headerFont }}>{player.username[0]}</div>}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 19, color: character?.is_legacy ? T.inkFaint : T.ink, ...headerFont }}>{character?.name || player.username}</span>
            {character?.is_legacy && <span style={{ fontSize: 11, color: T.inkFaint, border: `1px solid ${T.parchmentDarker}`, borderRadius: 4, padding: '2px 6px', fontStyle: 'italic' }}>✝ sola lettura</span>}
          </div>
          {character && <div style={{ fontSize: 15, color: T.inkFaint, fontStyle: 'italic' }}>{character.race} · {character.class}{character.multiclass && character.class2 ? ` ${character.level}/${character.class2} ${character.level2}` : ''} · Livello {character.multiclass && character.class2 ? (parseInt(character.level||0) + parseInt(character.level2||0)) : character.level}</div>}
        </div>
      </div>
      <Tabs tabs={['scheda', 'incantesimi', 'inventario', 'famigli', 'note sessione']} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'scheda' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            {isOwner && !character?.is_legacy && (editChar
              ? <div style={{ display: 'flex', gap: 8 }}><BtnS onClick={() => setEditChar(false)}>Annulla</BtnS><BtnP onClick={saveChar}>Sigilla</BtnP></div>
              : <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <BtnS onClick={() => { setCharForm({ ...EC, ...(character || {}) }); setEditChar(true) }}>Modifica Scheda</BtnS>
                  {isDM && character && <BtnD onClick={() => { if (window.confirm('Segnare ' + character.name + ' come caduto in battaglia?')) markAsLegacy(character.id, 'Caduto in battaglia') }}>⚔️ Legacy</BtnD>}
                </div>
            )}
            {character?.is_legacy && <p style={{ fontSize: 13, color: T.inkFaint, fontStyle: 'italic', margin: 0 }}>Scheda in sola lettura</p>}
            {!character && isOwner && !editChar && (
              <BtnP onClick={createNewCharacter}>+ Crea Personaggio</BtnP>
            )}
            
          </div>
          {editChar ? (
            <Card>
              <ImgUpload bucket="character-images" folder="characters" currentPath={charForm.image_path} onUploaded={p => setCharForm({ ...charForm, image_path: p })} label="Ritratto" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,200px),1fr))', gap: '0 12px' }}>
                <FF label="Nome"><Input value={charForm.name} onChange={e => setCharForm({ ...charForm, name: e.target.value })} /></FF>
                <FF label="Classe">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Input value={charForm.class} onChange={e => setCharForm({ ...charForm, class: e.target.value })} placeholder="es. Ranger" />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: T.inkLight }}>
                      <input type="checkbox" checked={!!charForm.multiclass} onChange={e => setCharForm({ ...charForm, multiclass: e.target.checked, class2: e.target.checked ? (charForm.class2 || '') : '', level2: e.target.checked ? (charForm.level2 || 1) : 0 })} style={{ width: 16, height: 16 }} />
                      Multiclasse
                    </label>
                    {charForm.multiclass && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Input value={charForm.class2 || ''} onChange={e => setCharForm({ ...charForm, class2: e.target.value })} placeholder="Seconda classe" style={{ flex: 1 }} />
                        <Input type="number" min="1" value={charForm.level2 || 1} onChange={e => setCharForm({ ...charForm, level2: parseInt(e.target.value) || 1 })} style={{ width: 70 }} />
                        <span style={{ fontSize: 12, color: T.inkFaint }}>liv.</span>
                      </div>
                    )}
                  </div>
                </FF>
                <FF label="Razza"><Input value={charForm.race} onChange={e => setCharForm({ ...charForm, race: e.target.value })} /></FF>
                <FF label="Background"><Input value={charForm.background} onChange={e => setCharForm({ ...charForm, background: e.target.value })} /></FF>
                <FF label={charForm.multiclass ? "Livello (classe principale)" : "Livello"}><Input type="number" value={charForm.level} onChange={e => setCharForm({ ...charForm, level: e.target.value })} /></FF>
                <FF label="CA"><Input type="number" value={charForm.ac} onChange={e => setCharForm({ ...charForm, ac: e.target.value })} /></FF>
                <FF label="Bonus iniziativa"><Input type="number" value={charForm.initiative_bonus ?? 0} onChange={e => setCharForm({ ...charForm, initiative_bonus: e.target.value })} placeholder="es. 2 o -1" /></FF>
                <FF label="PF attuali"><Input type="number" value={charForm.hp} onChange={e => setCharForm({ ...charForm, hp: e.target.value })} /></FF>
                <FF label="PF massimi"><Input type="number" value={charForm.max_hp} onChange={e => setCharForm({ ...charForm, max_hp: e.target.value })} /></FF>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: T.gold, ...headerFont, letterSpacing: '0.05em' }}>CARATTERISTICHE</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 16 }}>
                {STATS.map(([l, k]) => <FF key={k} label={l}><Input type="number" value={charForm[k]} onChange={e => setCharForm({ ...charForm, [k]: e.target.value })} /></FF>)}
              </div>
              <FF label="Attacchi (Nome | Bonus | Danni, uno per riga)"><Textarea value={charForm.attacks} onChange={e => setCharForm({ ...charForm, attacks: e.target.value })} placeholder="Spada lunga | +5 | 1d8+3" /></FF>
              <FF label="Slot totali (es. 4,3,2)"><Input value={charForm.spell_slots_total} onChange={e => setCharForm({ ...charForm, spell_slots_total: e.target.value })} placeholder="4,3,2" /></FF>
              <FF label="Slot usati (es. 2,1,0)"><Input value={charForm.spell_slots_used} onChange={e => setCharForm({ ...charForm, spell_slots_used: e.target.value })} placeholder="2,1,0" /></FF>
            </Card>
          ) : character ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 120px), 1fr))', gap: 10, marginBottom: 12 }}>
                {[['Classe Armatura', character.ac], ['Iniziativa', formatBonus(character.initiative_bonus)], ['Livello', character.level], ['Background', character.background]].map(([k, v]) => <div key={k} style={{ ...cardStyle, textAlign: 'center' }}><div style={{ fontSize: 11, color: T.gold, marginBottom: 4, ...headerFont, letterSpacing: '0.05em' }}>{k.toUpperCase()}</div><div style={{ fontSize: 18, fontWeight: 700, color: T.ink, ...headerFont }}>{v}</div></div>)}
              </div>
              <Card style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: T.inkFaint, fontStyle: 'italic' }}>Punti Ferita</span>
                  {isOwner ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={async () => { const newHp = Math.max(0, character.hp - 1); await supabase.from('characters').update({ hp: newHp }).eq('id', character.id); setCharacter(c => ({ ...c, hp: newHp })) }} style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${T.red}`, background: T.red + '22', cursor: 'pointer', fontSize: 16, color: T.red, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <input type="number" value={character.hp} onChange={async e => { const v = parseInt(e.target.value) || 0; await supabase.from('characters').update({ hp: v }).eq('id', character.id); setCharacter(c => ({ ...c, hp: v })) }} style={{ width: 48, textAlign: 'center', fontSize: 16, fontWeight: 700, border: `1px solid ${T.parchmentDarker}`, borderRadius: 4, background: T.parchmentDark, color: T.ink, padding: '2px 4px' }} />
                      <span style={{ fontSize: 14, color: T.inkFaint }}>/ {character.max_hp}</span>
                      <button onClick={async () => { const newHp = Math.min(character.max_hp, character.hp + 1); await supabase.from('characters').update({ hp: newHp }).eq('id', character.id); setCharacter(c => ({ ...c, hp: newHp })) }} style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${T.green}`, background: T.green + '22', cursor: 'pointer', fontSize: 16, color: T.green, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 16, fontWeight: 700, color: T.ink, ...headerFont }}>{character.hp} / {character.max_hp}</span>
                  )}
                </div>
                <div style={{ height: 12, background: T.parchmentDarker, borderRadius: 6, overflow: 'hidden' }}><div style={{ height: '100%', width: `${hpPct}%`, background: `linear-gradient(to right, ${hpColor}, ${hpColor}cc)`, borderRadius: 6, transition: 'width 0.4s' }} /></div>
              </Card>
              <Card style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 10px', color: T.gold, ...headerFont, letterSpacing: '0.06em' }}>CARATTERISTICHE</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 4 }}>
                  {STATS.map(([l, k]) => <div key={k} style={{ textAlign: 'center', background: T.parchmentDark, borderRadius: 4, padding: '8px 2px', border: `1px solid ${T.parchmentDarker}` }}><div style={{ fontSize: 10, color: T.gold, marginBottom: 2, ...headerFont }}>{l}</div><div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{character[k] || 10}</div><div style={{ fontSize: 12, color: T.inkFaint }}>{mod(character[k])}</div></div>)}
                </div>
              </Card>
              {/* Abilità e Tiri Salvezza */}
              {(() => {
                const profBonus = Math.ceil(1 + (character.level || 1) / 4)
                const SKILLS_DEF = [
                  { name: 'Acrobazia', stat: 'dex', key: 'acrobatics' },
                  { name: 'Addestrare animali', stat: 'wis', key: 'animal_handling' },
                  { name: 'Arcano', stat: 'int', key: 'arcana' },
                  { name: 'Atletica', stat: 'str', key: 'athletics' },
                  { name: 'Furtività', stat: 'dex', key: 'stealth' },
                  { name: 'Indagare', stat: 'int', key: 'investigation' },
                  { name: 'Inganno', stat: 'cha', key: 'deception' },
                  { name: 'Intimidire', stat: 'cha', key: 'intimidation' },
                  { name: 'Intuizione', stat: 'wis', key: 'insight' },
                  { name: 'Medicina', stat: 'wis', key: 'medicine' },
                  { name: 'Natura', stat: 'int', key: 'nature' },
                  { name: 'Percezione', stat: 'wis', key: 'perception' },
                  { name: 'Performance', stat: 'cha', key: 'performance' },
                  { name: 'Persuasione', stat: 'cha', key: 'persuasion' },
                  { name: 'Rapidità di mano', stat: 'dex', key: 'sleight_of_hand' },
                  { name: 'Religione', stat: 'int', key: 'religion' },
                  { name: 'Storia', stat: 'int', key: 'history' },
                  { name: 'Sopravvivenza', stat: 'wis', key: 'survival' },
                ]
                const SAVES_DEF = [
                  { name: 'Forza', stat: 'str', key: 'save_str' },
                  { name: 'Destrezza', stat: 'dex', key: 'save_dex' },
                  { name: 'Costituzione', stat: 'con', key: 'save_con' },
                  { name: 'Intelligenza', stat: 'int', key: 'save_int' },
                  { name: 'Saggezza', stat: 'wis', key: 'save_wis' },
                  { name: 'Carisma', stat: 'cha', key: 'save_cha' },
                ]
                const skills = character.skills || {}
                const saves = character.saving_throws || {}
                const statMod = (stat) => Math.floor(((character[stat] || 10) - 10) / 2)
                const fmt = (v) => (v >= 0 ? '+' : '') + v
                const getSkill = (sk) => {
                  if (skills[sk.key] !== undefined && skills[sk.key] !== null && skills[sk.key] !== '') return parseInt(skills[sk.key])
                  return skills[sk.key + '_prof'] ? statMod(sk.stat) + profBonus : statMod(sk.stat)
                }
                const getSave = (sv) => {
                  if (saves[sv.key] !== undefined && saves[sv.key] !== null && saves[sv.key] !== '') return parseInt(saves[sv.key])
                  return saves[sv.key + '_prof'] ? statMod(sv.stat) + profBonus : statMod(sv.stat)
                }
                const updateSkill = async (key, val) => {
                  const ns = { ...skills, [key]: val }
                  await supabase.from('characters').update({ skills: ns }).eq('id', character.id)
                  setCharacter(c => ({ ...c, skills: ns }))
                }
                const updateSave = async (key, val) => {
                  const ns = { ...saves, [key]: val }
                  await supabase.from('characters').update({ saving_throws: ns }).eq('id', character.id)
                  setCharacter(c => ({ ...c, saving_throws: ns }))
                }
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 12, marginBottom: 12 }}>
                    <Card style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, ...headerFont, letterSpacing: '0.05em' }}>ABILITÀ</span>
                        <span style={{ fontSize: 10, color: T.inkFaint }}>comp +{profBonus}</span>
                      </div>
                      {SKILLS_DEF.map(sk => {
                        const isProf = !!skills[sk.key + '_prof']
                        const val = getSkill(sk)
                        return (
                          <div key={sk.key} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0', borderBottom: `1px solid ${T.parchmentDarker}44` }}>
                            {isOwner ? (
                              <button onClick={() => updateSkill(sk.key + '_prof', !isProf)} title="Competenza" style={{ width: 12, height: 12, borderRadius: '50%', border: `1.5px solid ${T.gold}`, background: isProf ? T.gold : 'transparent', cursor: 'pointer', flexShrink: 0, padding: 0 }} />
                            ) : (
                              <div style={{ width: 12, height: 12, borderRadius: '50%', border: `1.5px solid ${T.gold}`, background: isProf ? T.gold : 'transparent', flexShrink: 0 }} />
                            )}
                            <span style={{ fontSize: 11, color: T.inkFaint, width: 22, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>{fmt(val)}</span>
                            <span style={{ fontSize: 11, color: T.inkLight, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sk.name}</span>
                            {isOwner && (
                              <input type="number" value={skills[sk.key] ?? ''} placeholder="—"
                                onChange={e => updateSkill(sk.key, e.target.value === '' ? null : parseInt(e.target.value))}
                                style={{ width: 32, fontSize: 10, padding: '1px 2px', border: `1px solid ${T.parchmentDarker}`, borderRadius: 2, background: T.parchmentDark, color: T.ink, textAlign: 'center', flexShrink: 0 }} />
                            )}
                          </div>
                        )
                      })}
                    </Card>
                    <Card style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, ...headerFont, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>TIRI SALVEZZA</span>
                      {SAVES_DEF.map(sv => {
                        const isProf = !!saves[sv.key + '_prof']
                        const val = getSave(sv)
                        return (
                          <div key={sv.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: `1px solid ${T.parchmentDarker}44` }}>
                            {isOwner ? (
                              <button onClick={() => updateSave(sv.key + '_prof', !isProf)} title="Competenza" style={{ width: 12, height: 12, borderRadius: '50%', border: `1.5px solid ${T.gold}`, background: isProf ? T.gold : 'transparent', cursor: 'pointer', flexShrink: 0, padding: 0 }} />
                            ) : (
                              <div style={{ width: 12, height: 12, borderRadius: '50%', border: `1.5px solid ${T.gold}`, background: isProf ? T.gold : 'transparent', flexShrink: 0 }} />
                            )}
                            <span style={{ fontSize: 12, color: T.inkFaint, width: 24, textAlign: 'right', flexShrink: 0, fontWeight: 700 }}>{fmt(val)}</span>
                            <span style={{ fontSize: 13, color: T.inkLight, flex: 1 }}>{sv.name}</span>
                            {isOwner && (
                              <input type="number" value={saves[sv.key] ?? ''} placeholder="—"
                                onChange={e => updateSave(sv.key, e.target.value === '' ? null : parseInt(e.target.value))}
                                style={{ width: 34, fontSize: 11, padding: '1px 3px', border: `1px solid ${T.parchmentDarker}`, borderRadius: 3, background: T.parchmentDark, color: T.ink, textAlign: 'center' }} />
                            )}
                          </div>
                        )
                      })}
                    </Card>
                  </div>
                )
              })()}
              {character.attacks && (
                <Card style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 10px', color: T.gold, ...headerFont, letterSpacing: '0.06em' }}>ATTACCHI</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '6px 14px' }}>
                    {['NOME', 'BONUS', 'DANNI'].map(h => <span key={h} style={{ fontSize: 11, color: T.gold, fontWeight: 700, ...headerFont }}>{h}</span>)}
                    {character.attacks.split('\n').filter(Boolean).map((atk, i) => { const [nome, bonus, danni] = atk.split('|').map(s => s.trim()); return [<span key={`n${i}`} style={{ fontWeight: 600, color: T.ink, fontSize: 15 }}>{nome}</span>, <span key={`b${i}`} style={{ color: T.green, fontWeight: 700, fontSize: 15 }}>{bonus}</span>, <span key={`d${i}`} style={{ color: T.red, fontSize: 15 }}>{danni}</span>] })}
                  </div>
                </Card>
              )}
              {slotsT.length > 0 && (
                <Card style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 12px', color: T.gold, ...headerFont, letterSpacing: '0.06em' }}>SLOT INCANTESIMO</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {slotsT.map((total, i) => {
                      const used = slotsU[i] || 0
                      const rem = total - used
                      const updateUsed = async (newUsed) => {
                        const newArr = slotsT.map((_, j) => j === i ? Math.max(0, Math.min(total, newUsed)) : (slotsU[j] || 0))
                        const newStr = newArr.join(',')
                        await supabase.from('characters').update({ spell_slots_used: newStr }).eq('id', character.id)
                        setCharacter(c => ({ ...c, spell_slots_used: newStr }))
                      }
                      return (
                        <div key={i} style={{ textAlign: 'center', background: T.parchmentDark, borderRadius: 4, padding: '8px 12px', minWidth: 52, border: `1px solid ${T.parchmentDarker}` }}>
                          <div style={{ fontSize: 11, color: T.gold, marginBottom: 6, ...headerFont }}>Lv {i + 1}</div>
                          <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', marginBottom: isOwner ? 6 : 0 }}>
                            {Array.from({ length: total }).map((_, j) => (
                              <div key={j} onClick={() => isOwner && updateUsed(j < rem ? used + 1 : used - 1)}
                                style={{ width: 12, height: 12, borderRadius: '50%', background: j < rem ? T.purple : T.parchmentDarker, border: `1px solid ${j < rem ? T.purple : T.parchmentDarker}`, cursor: isOwner ? 'pointer' : 'default', transition: 'background 0.15s' }} />
                            ))}
                          </div>
                          {isOwner && (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                              <button onClick={() => updateUsed(used + 1)} disabled={rem === 0}
                                style={{ width: 20, height: 20, borderRadius: '50%', border: `1px solid ${T.parchmentDarker}`, background: 'transparent', cursor: rem === 0 ? 'not-allowed' : 'pointer', fontSize: 12, color: T.red, opacity: rem === 0 ? 0.4 : 1 }}>−</button>
                              <span style={{ fontSize: 12, color: T.inkFaint }}>{rem}/{total}</span>
                              <button onClick={() => updateUsed(used - 1)} disabled={used === 0}
                                style={{ width: 20, height: 20, borderRadius: '50%', border: `1px solid ${T.parchmentDarker}`, background: 'transparent', cursor: used === 0 ? 'not-allowed' : 'pointer', fontSize: 12, color: T.green, opacity: used === 0 ? 0.4 : 1 }}>+</button>
                            </div>
                          )}
                          {!isOwner && <div style={{ fontSize: 12, color: T.inkFaint }}>{rem}/{total}</div>}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>
          ) : <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>Nessuna scheda. {isOwner && 'Clicca "Modifica Scheda" per iniziare.'}</p>}
        </div>
      )}

      {activeTab === 'incantesimi' && <SpellbookTab playerId={player.id} isOwner={isOwner} />}

      {activeTab === 'inventario' && (
        <div>
          <CoinsPanel values={character || charForm} onChange={handleCoin} editable={isOwner} />
          <PotionsPanel character={character} isOwner={isOwner} onUpdate={setCharacter} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>{isOwner && <BtnP onClick={openAddItem}>+ Aggiungi Oggetto</BtnP>}</div>
          {inventory.length === 0 && <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>Le borse sono vuote...</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inventory.map(item => (
              <Card key={item.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}><span style={{ fontWeight: 600, fontSize: 16, color: T.ink, ...headerFont }}>{item.name}</span>{item.quantity > 1 && <span style={{ fontSize: 13, color: T.inkFaint, marginLeft: 8 }}>×{item.quantity}</span>}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <Badge color={ITEM_TYPE_COLORS[item.type] || T.inkFaint}>{item.type}</Badge>
                    {isOwner && <><button onClick={() => openEditItem(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>✏️</button><button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>🗑️</button></>}
                  </div>
                </div>
                {item.description && <p style={{ margin: '6px 0 0', fontSize: 14, color: T.inkLight, fontStyle: 'italic' }}>{item.description}</p>}
              </Card>
            ))}
          </div>
          {showItemModal && <Modal title={editingItem ? 'Modifica Oggetto' : 'Nuovo Oggetto'} onClose={() => setShowItemModal(false)}><FF label="Nome"><Input value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} /></FF><FF label="Tipo"><Sel value={itemForm.type} onChange={e => setItemForm({ ...itemForm, type: e.target.value })}>{Object.keys(ITEM_TYPE_COLORS).map(t => <option key={t}>{t}</option>)}</Sel></FF><FF label="Quantità"><Input type="number" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })} /></FF><FF label="Descrizione"><Textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} /></FF><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowItemModal(false)}>Annulla</BtnS><BtnP onClick={saveItem}>Salva</BtnP></div></Modal>}
        </div>
      )}

      {activeTab === 'famigli' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>{isOwner && <BtnP onClick={openAddComp}>+ Aggiungi</BtnP>}</div>
          {companions.length === 0 && <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>Nessun compagno fedele...</p>}
          {companions.map(c => {
            const cImg = getPublicUrl('character-images', c.image_path)
            return (
              <Card key={c.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {cImg ? <img src={cImg} alt={c.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.gold}`, flexShrink: 0 }} /> : <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.parchmentDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, border: `2px solid ${T.parchmentDarker}` }}>🐾</div>}
                    <div><div style={{ fontWeight: 600, fontSize: 16, color: T.ink, ...headerFont }}>{c.name}</div><div style={{ fontSize: 13, color: T.inkFaint, fontStyle: 'italic' }}>{c.type}</div></div>
                  </div>
                  {isOwner && <div style={{ display: 'flex', gap: 4 }}><button onClick={() => openEditComp(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>✏️</button><button onClick={() => removeComp(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>🗑️</button></div>}
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 10 }}><span style={{ fontSize: 14, color: T.inkLight }}><span style={{ color: T.inkFaint }}>PF </span><strong>{c.hp}</strong></span><span style={{ fontSize: 14, color: T.inkLight }}><span style={{ color: T.inkFaint }}>CA </span><strong>{c.ac}</strong></span></div>
                {c.notes && <p style={{ margin: '8px 0 0', fontSize: 14, color: T.inkLight, fontStyle: 'italic' }}>{c.notes}</p>}
              </Card>
            )
          })}
          {showCompModal && <Modal title={editingComp ? 'Modifica Compagno' : 'Nuovo Compagno'} onClose={() => setShowCompModal(false)}><ImgUpload bucket="character-images" folder="companions" currentPath={compForm.image_path} onUploaded={p => setCompForm({ ...compForm, image_path: p })} label="Ritratto" /><FF label="Nome"><Input value={compForm.name} onChange={e => setCompForm({ ...compForm, name: e.target.value })} /></FF><FF label="Tipo"><Input value={compForm.type} onChange={e => setCompForm({ ...compForm, type: e.target.value })} placeholder="es. Famiglio (Gatto)" /></FF><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}><FF label="PF"><Input type="number" value={compForm.hp} onChange={e => setCompForm({ ...compForm, hp: e.target.value })} /></FF><FF label="CA"><Input type="number" value={compForm.ac} onChange={e => setCompForm({ ...compForm, ac: e.target.value })} /></FF></div><FF label="Note"><Textarea value={compForm.notes} onChange={e => setCompForm({ ...compForm, notes: e.target.value })} /></FF><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowCompModal(false)}>Annulla</BtnS><BtnP onClick={saveComp}>Salva</BtnP></div></Modal>}
        </div>
      )}

      {activeTab === 'note sessione' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 17, color: T.red, ...headerFont }}>Diario di Sessione</span>
            {isOwner && <BtnP onClick={openAddNote}>+ Nuova Nota</BtnP>}
          </div>
          <p style={{ fontSize: 13, color: T.inkFaint, marginBottom: 16, fontStyle: 'italic' }}>Visibili solo a te e al DM.</p>
          {sessionNotes.length === 0 && <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>Le pagine del diario sono ancora vuote...</p>}
          {sessionNotes.map(n => (
            <Card key={n.id} style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => setExpandedNote(expandedNote === n.id ? null : n.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><span style={{ fontWeight: 600, fontSize: 16, color: T.ink, ...headerFont }}>{n.session_title}</span>{n.date && <span style={{ fontSize: 12, color: T.gold, marginLeft: 8, ...headerFont }}>{formatDate(n.date)}</span>}</div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {isOwner && <><button onClick={e => { e.stopPropagation(); openEditNote(n) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>✏️</button><button onClick={e => { e.stopPropagation(); removeNote(n.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>🗑️</button></>}
                  <span style={{ color: T.gold, padding: 4 }}>{expandedNote === n.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandedNote === n.id && <><Divider /><pre style={{ margin: 0, fontFamily: "'Crimson Text', Georgia, serif", fontSize: 15, lineHeight: 1.8, color: T.inkLight, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>{n.content}</pre></>}
            </Card>
          ))}
          {showNoteModal && (
            <Modal title={editingNote ? 'Modifica Nota' : 'Nuova Nota di Sessione'} onClose={() => setShowNoteModal(false)}>
              <FF label="Titolo / Sessione"><Input value={noteForm.session_title} onChange={e => setNoteForm({ ...noteForm, session_title: e.target.value })} placeholder="es. Sessione 3 — La cripta" /></FF>
              <FF label="Data"><Input type="date" value={noteForm.date} onChange={e => setNoteForm({ ...noteForm, date: e.target.value })} /></FF>
              <FF label="Note"><Textarea value={noteForm.content} onChange={e => setNoteForm({ ...noteForm, content: e.target.value })} style={{ minHeight: 160 }} /></FF>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowNoteModal(false)}>Annulla</BtnS><BtnP onClick={saveNote}>Sigilla</BtnP></div>
            </Modal>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Pozioni ─────────────────────────────────────────────────────────────────
const POZIONI = [
  { key: 'minore', label: 'Minore', dice: '2d4', bonus: 2, color: '#e74c3c' },
  { key: 'maggiore', label: 'Maggiore', dice: '4d4', bonus: 4, color: '#e67e22' },
  { key: 'superiore', label: 'Superiore', dice: '8d4', bonus: 8, color: '#8e44ad' },
  { key: 'suprema', label: 'Suprema', dice: '10d4', bonus: 20, color: '#2980b9' },
]

function rollDice(diceStr) {
  const [n, d] = diceStr.split('d').map(Number)
  let total = 0
  for (let i = 0; i < n; i++) total += Math.floor(Math.random() * d) + 1
  return total
}

function PotionsPanel({ character, isOwner, onUpdate }) {
  const [result, setResult] = useState(null)
  if (!character) return null
  const potions = character.potions || {}

  const updatePotions = async (newPotions) => {
    await supabase.from('characters').update({ potions: newPotions }).eq('id', character.id)
    onUpdate(c => ({ ...c, potions: newPotions }))
  }

  const usaPozione = async (p) => {
    const qty = potions[p.key] || 0
    if (qty <= 0) return
    const rolled = rollDice(p.dice)
    const total = rolled + p.bonus
    const newPotions = { ...potions, [p.key]: qty - 1 }
    await updatePotions(newPotions)
    // Heal HP
    const newHp = Math.min(character.max_hp, character.hp + total)
    await supabase.from('characters').update({ hp: newHp }).eq('id', character.id)
    onUpdate(c => ({ ...c, hp: newHp, potions: newPotions }))
    setResult({ label: `Pozione ${p.label}`, rolled, bonus: p.bonus, total, dice: p.dice })
    setTimeout(() => setResult(null), 4000)
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 12px', color: T.gold, ...headerFont, letterSpacing: '0.06em' }}>🧪 POZIONI CURATIVE</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: result ? 12 : 0 }}>
        {POZIONI.map(p => {
          const qty = potions[p.key] || 0
          return (
            <div key={p.key} style={{ background: T.parchmentDark, border: `1px solid ${T.parchmentDarker}`, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: p.color, ...headerFont }}>{p.label.toUpperCase()}</span>
                <span style={{ fontSize: 11, color: T.inkFaint }}>{p.dice}+{p.bonus}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isOwner && <button onClick={() => updatePotions({ ...potions, [p.key]: Math.max(0, qty - 1) })} style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${T.parchmentDarker}`, background: 'transparent', cursor: 'pointer', fontSize: 14, color: T.inkFaint }}>−</button>}
                <span style={{ fontSize: 18, fontWeight: 700, color: qty > 0 ? p.color : T.inkFaint, flex: 1, textAlign: 'center' }}>{qty}</span>
                {isOwner && <button onClick={() => updatePotions({ ...potions, [p.key]: qty + 1 })} style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${T.parchmentDarker}`, background: 'transparent', cursor: 'pointer', fontSize: 14, color: T.inkFaint }}>+</button>}
              </div>
              {isOwner && qty > 0 && (
                <button onClick={() => usaPozione(p)} style={{ width: '100%', marginTop: 6, padding: '4px', background: p.color + '22', border: `1px solid ${p.color}44`, borderRadius: 4, cursor: 'pointer', fontSize: 12, color: p.color, fontWeight: 600 }}>
                  Usa Pozione
                </button>
              )}
            </div>
          )
        })}
      </div>
      {result && (
        <div style={{ background: `linear-gradient(135deg, #e8f0e8, #d8e8d8)`, border: `1.5px solid ${T.green}`, borderRadius: 6, padding: '10px 14px', fontSize: 14, color: T.green }}>
          <strong>{result.label}</strong>: {result.dice} → {result.rolled} + {result.bonus} = <strong style={{ fontSize: 18 }}>+{result.total} PF</strong>
        </div>
      )}
    </Card>
  )
}

// ─── Chat Privata ─────────────────────────────────────────────────────────────
function ChatSection({ profile, players, isDM, allContacts }) {
  const [messages, setMessages] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState({})
  const msgEndRef = useRef()
  const inputRef = useRef()
  const selectedUserRef = useRef(null)
  const channelRef = useRef(null)

  const contacts = (allContacts || []).filter(p => p.id !== profile.id)

  // Load initial unread counts
  useEffect(() => {
    supabase.from('messages')
      .select('sender_id')
      .eq('recipient_id', profile.id)
      .eq('read', false)
      .then(({ data }) => {
        const counts = {}
        ;(data || []).forEach(m => { counts[m.sender_id] = (counts[m.sender_id] || 0) + 1 })
        setUnread(counts)
      })
  }, [])

  const openConversation = async (user) => {
    setSelectedUser(user)
    selectedUserRef.current = user
    setLoading(true)
    setMessages([])

    // Cleanup old channel
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }

    // Load messages
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},recipient_id.eq.${user.id}),and(sender_id.eq.${user.id},recipient_id.eq.${profile.id})`)
      .order('created_at')
    setMessages(data || [])
    setLoading(false)

    // Mark received as read
    await supabase.from('messages').update({ read: true })
      .eq('recipient_id', profile.id).eq('sender_id', user.id).eq('read', false)
    setUnread(u => ({ ...u, [user.id]: 0 }))

    // Subscribe to new messages for this conversation
    const ch = supabase.channel('chat_' + [profile.id, user.id].sort().join('_'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        const su = selectedUserRef.current
        if (!su) return
        const mine = msg.sender_id === profile.id && msg.recipient_id === su.id
        const theirs = msg.sender_id === su.id && msg.recipient_id === profile.id
        if (mine || theirs) {
          setMessages(prev => prev.find(x => x.id === msg.id) ? prev : [...prev, msg])
          if (theirs) {
            supabase.from('messages').update({ read: true }).eq('id', msg.id).then(() => {})
          }
        } else if (msg.recipient_id === profile.id) {
          // Message from someone else - update unread badge
          setUnread(u => ({ ...u, [msg.sender_id]: (u[msg.sender_id] || 0) + 1 }))
        }
      })
      .subscribe()
    channelRef.current = ch
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMsg = async () => {
    if (!newMsg.trim() || !selectedUser) return
    const text = newMsg.trim()
    setNewMsg('')
    const tempId = 'temp_' + Date.now()
    const tempMsg = { id: tempId, sender_id: profile.id, recipient_id: selectedUser.id, content: text, created_at: new Date().toISOString(), read: false }
    setMessages(prev => [...prev, tempMsg])
    const { data } = await supabase.from('messages').insert([{ sender_id: profile.id, recipient_id: selectedUser.id, content: text }]).select()
    if (data && data[0]) {
      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempId ? data[0] : m))
    }
    inputRef.current?.focus()
  }

  const fmt = (d) => { try { return new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) } catch { return '' } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SH title="💬 Messaggi Privati" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {contacts.map(c => {
          const u = unread[c.id] || 0
          return (
            <button key={c.id} onClick={() => openConversation(c)}
              style={{ padding: '8px 14px', borderRadius: 20, border: selectedUser?.id === c.id ? `2px solid ${T.gold}` : `1px solid ${T.parchmentDarker}`, background: selectedUser?.id === c.id ? T.gold + '22' : T.parchmentDark, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.player_color || T.gold, flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: T.ink, fontWeight: selectedUser?.id === c.id ? 700 : 400, fontFamily: "'Crimson Text', Georgia, serif" }}>{c.username}</span>
              {u > 0 && <span style={{ background: T.red, color: '#fff', borderRadius: 10, minWidth: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{u}</span>}
            </button>
          )
        })}
      </div>
      {!selectedUser ? (
        <Card><p style={{ color: T.inkFaint, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>Seleziona un contatto per iniziare a chattare in privato</p></Card>
      ) : (
        <div style={{ border: `1.5px solid ${T.parchmentDarker}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', background: T.parchmentDark, borderBottom: `1px solid ${T.parchmentDarker}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedUser.player_color || T.gold }} />
            <span style={{ fontWeight: 700, color: T.ink, fontFamily: "'Cinzel', Georgia, serif", fontSize: 14 }}>{selectedUser.username}</span>
            <span style={{ fontSize: 11, color: T.inkFaint, fontStyle: 'italic' }}>— conversazione privata</span>
          </div>
          <div style={{ height: 320, overflowY: 'auto', padding: '12px', background: T.parchment, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading && <p style={{ color: T.inkFaint, textAlign: 'center', fontStyle: 'italic' }}>Caricamento...</p>}
            {!loading && messages.length === 0 && <p style={{ color: T.inkFaint, textAlign: 'center', fontStyle: 'italic' }}>Nessun messaggio ancora.</p>}
            {messages.map(m => {
              const isMe = m.sender_id === profile.id
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '80%', background: isMe ? T.gold + '33' : T.parchmentDark, border: `1px solid ${isMe ? T.gold + '66' : T.parchmentDarker}`, borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '8px 12px' }}>
                    <p style={{ margin: 0, fontSize: 15, color: T.ink, lineHeight: 1.5, wordBreak: 'break-word' }}>{m.content}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 10, color: T.inkFaint, textAlign: isMe ? 'right' : 'left' }}>{fmt(m.created_at)}</p>
                  </div>
                </div>
              )
            })}
            <div ref={msgEndRef} />
          </div>
          <div style={{ padding: '8px 10px', background: T.parchmentDark, borderTop: `1px solid ${T.parchmentDarker}`, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input ref={inputRef} value={newMsg} onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
              placeholder={'Messaggio a ' + selectedUser.username + '...'}
              style={{ flex: 1, padding: '10px 14px', border: `1px solid ${T.parchmentDarker}`, borderRadius: 20, background: T.parchment, fontSize: 14, color: T.ink, outline: 'none', minWidth: 0 }} />
            <button onClick={sendMsg} disabled={!newMsg.trim()}
              style={{ width: 40, height: 40, borderRadius: '50%', background: newMsg.trim() ? T.gold : T.parchmentDarker, border: 'none', cursor: newMsg.trim() ? 'pointer' : 'not-allowed', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
          </div>
        </div>
      )}
    </div>
  )
}



// ─── Party ────────────────────────────────────────────────────────────────────
function SharedSection({ isDM }) {
  const [lootText, setLootText] = useState('')
  const [lootId, setLootId] = useState(null)
  const [editingLoot, setEditingLoot] = useState(false)
  const [quests, setQuests] = useState([])
  const [groupNotes, setGroupNotes] = useState([])
  const [partyCoins, setPartyCoins] = useState({ gold: 0, silver: 0, copper: 0, platinum: 0 })
  const [showQuestModal, setShowQuestModal] = useState(false)
  const [editingQuest, setEditingQuest] = useState(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [editingGNote, setEditingGNote] = useState(null)
  const [expandedNote, setExpandedNote] = useState(null)
  const [lootForm, setLootForm] = useState({ name: '', quantity: 1, notes: '' })
  const [questForm, setQuestForm] = useState({ title: '', description: '', status: 'attiva', reward: '' })
  const [gnoteForm, setGnoteForm] = useState({ session_title: '', date: '', content: '' })
  const [activeTab, setActiveTab] = useState('loot')
  const [loading, setLoading] = useState(true)
  const [allCharacters, setAllCharacters] = useState([])

  useEffect(() => {
    Promise.all([
      supabase.from('party_loot').select('*').eq('campaign_id', 'sunless').order('created_at'),
      supabase.from('quests').select('*').eq('campaign_id', 'sunless').order('created_at'),
      supabase.from('group_notes').select('*').eq('campaign_id', 'sunless').order('created_at', { ascending: false }),
    ]).then(([l, q, gn]) => {
      const coins = { gold: 0, silver: 0, copper: 0, platinum: 0 }
      let lootEntry = null
      ;(l.data || []).forEach(item => {
        if (item.name === '__coins__') { try { Object.assign(coins, JSON.parse(item.notes || '{}')) } catch {} }
        else if (item.name === '__loot_text__') { lootEntry = item }
      })
      setPartyCoins(coins)
      if (lootEntry) { setLootText(lootEntry.notes || ''); setLootId(lootEntry.id) }
      setQuests(q.data || []); setGroupNotes(gn.data || []); setLoading(false)
    })
  }, [])

  const savePartyCoins = async (newCoins) => {
    setPartyCoins(newCoins)
    const existing = await supabase.from('party_loot').select('id').eq('name', '__coins__').maybeSingle()
    if (existing.data) { await supabase.from('party_loot').update({ notes: JSON.stringify(newCoins) }).eq('id', existing.data.id) }
    else { await supabase.from('party_loot').insert([{ campaign_id: 'sunless',  name: '__coins__', quantity: 1, notes: JSON.stringify(newCoins) }]) }
  }
  const saveLootText = async (text) => {
    setLootText(text)
    if (lootId) { await supabase.from('party_loot').update({ notes: text }).eq('id', lootId) }
    else { const { data } = await supabase.from('party_loot').insert([{ campaign_id: 'sunless',  name: '__loot_text__', quantity: 1, notes: text }]).select(); if (data) setLootId(data[0].id) }
  }
  const openAddQuest = () => { setEditingQuest(null); setQuestForm({ title: '', description: '', status: 'attiva', reward: '' }); setShowQuestModal(true) }
  const openEditQuest = (q) => { setEditingQuest(q); setQuestForm({ title: q.title, description: q.description || '', status: q.status, reward: q.reward || '' }); setShowQuestModal(true) }
  const saveQuest = async () => {
    if (!questForm.title) return
    if (editingQuest) { const { data } = await supabase.from('quests').update(questForm).eq('id', editingQuest.id).select(); if (data) setQuests(quests.map(q => q.id === editingQuest.id ? data[0] : q)) }
    else { const { data } = await supabase.from('quests').insert([{ ...questForm, campaign_id: 'sunless' }]).select(); if (data) setQuests([...quests, data[0]]) }
    setShowQuestModal(false)
  }
  const removeQuest = async (id) => { await supabase.from('quests').delete().eq('id', id); setQuests(quests.filter(q => q.id !== id)) }
  const openAddGNote = () => { setEditingGNote(null); setGnoteForm({ session_title: '', date: '', content: '' }); setShowNoteModal(true) }
  const openEditGNote = (n) => { setEditingGNote(n); setGnoteForm({ session_title: n.session_title, date: n.date || '', content: n.content || '' }); setShowNoteModal(true) }
  const saveGNote = async () => {
    if (!gnoteForm.session_title) return
    if (editingGNote) { const { data } = await supabase.from('group_notes').update(gnoteForm).eq('id', editingGNote.id).select(); if (data) setGroupNotes(groupNotes.map(n => n.id === editingGNote.id ? data[0] : n)) }
    else { const { data } = await supabase.from('group_notes').insert([{ ...gnoteForm, campaign_id: 'sunless' }]).select(); if (data) setGroupNotes([data[0], ...groupNotes]) }
    setShowNoteModal(false)
  }
  const removeGNote = async (id) => { await supabase.from('group_notes').delete().eq('id', id); setGroupNotes(groupNotes.filter(n => n.id !== id)) }

  if (loading) return <p style={{ color: T.inkFaint }}>Caricamento...</p>
  return (
    <div>
      <Tabs tabs={['loot', 'quest', 'note gruppo']} active={activeTab} onChange={setActiveTab} />
      {activeTab === 'loot' && (
        <div>
          <CoinsPanel values={partyCoins} onChange={(k, v) => savePartyCoins({ ...partyCoins, [k]: v })} editable={true} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: T.red, ...headerFont }}>⚔️ Bottino del Gruppo</span>
            {!editingLoot && <BtnS onClick={() => setEditingLoot(true)}>✏️ Modifica</BtnS>}
            {editingLoot && <div style={{ display: 'flex', gap: 8 }}><BtnS onClick={() => setEditingLoot(false)}>Annulla</BtnS><BtnP onClick={() => { saveLootText(lootText); setEditingLoot(false) }}>Salva</BtnP></div>}
          </div>
          {editingLoot ? (
            <RichEditor value={lootText} onChange={v => setLootText(v)} placeholder="Descrivi il bottino: armi, oggetti magici, tesori..." height={350} />
          ) : (
            <Card>
              {lootText ? <RichText value={lootText} /> : <p style={{ color: T.inkFaint, fontStyle: 'italic', margin: 0 }}>Le casse del gruppo sono vuote... Clicca Modifica per aggiungere il bottino.</p>}
            </Card>
          )}
        </div>
      )}
      {activeTab === 'quest' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontWeight: 700, fontSize: 18, color: T.red, ...headerFont }}>📋 Missioni</span><BtnP onClick={openAddQuest}>+ Nuova</BtnP></div>
          {quests.length === 0 && <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>Nessuna missione in corso...</p>}
          {quests.map(q => <Card key={q.id} style={{ marginBottom: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}><span style={{ fontWeight: 600, flex: 1, color: T.ink, fontSize: 16, ...headerFont }}>{q.title}</span><div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}><Badge color={QUEST_STATUS_COLORS[q.status] || T.inkFaint}>{q.status}</Badge><button onClick={() => openEditQuest(q)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>✏️</button>{isDM && <button onClick={() => removeQuest(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>🗑️</button>}</div></div><p style={{ margin: '6px 0', fontSize: 15, color: T.inkLight, lineHeight: 1.6 }}>{q.description}</p>{q.reward && <div style={{ fontSize: 13, color: T.gold, fontStyle: 'italic' }}>⚜️ Ricompensa: {q.reward}</div>}</Card>)}
          {showQuestModal && <Modal title={editingQuest ? 'Modifica Missione' : 'Nuova Missione'} onClose={() => setShowQuestModal(false)}><FF label="Titolo"><Input value={questForm.title} onChange={e => setQuestForm({ ...questForm, title: e.target.value })} /></FF><FF label="Stato"><Sel value={questForm.status} onChange={e => setQuestForm({ ...questForm, status: e.target.value })}>{Object.keys(QUEST_STATUS_COLORS).map(s => <option key={s}>{s}</option>)}</Sel></FF><FF label="Descrizione"><Textarea value={questForm.description} onChange={e => setQuestForm({ ...questForm, description: e.target.value })} /></FF><FF label="Ricompensa"><Input value={questForm.reward} onChange={e => setQuestForm({ ...questForm, reward: e.target.value })} /></FF><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowQuestModal(false)}>Annulla</BtnS><BtnP onClick={saveQuest}>Salva</BtnP></div></Modal>}
        </div>
      )}
      {activeTab === 'note gruppo' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontWeight: 700, fontSize: 18, color: T.red, ...headerFont }}>📜 Cronache del Gruppo</span><BtnP onClick={openAddGNote}>+ Nuova nota</BtnP></div>
          <p style={{ fontSize: 13, color: T.inkFaint, marginBottom: 16, fontStyle: 'italic' }}>Visibili e modificabili da tutta la compagnia.</p>
          {groupNotes.length === 0 && <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>Le cronache sono ancora vergini...</p>}
          {groupNotes.map(n => (
            <Card key={n.id} style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => setExpandedNote(expandedNote === n.id ? null : n.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><span style={{ fontWeight: 600, fontSize: 16, color: T.ink, ...headerFont }}>{n.session_title}</span>{n.date && <span style={{ fontSize: 12, color: T.gold, marginLeft: 8, ...headerFont }}>{formatDate(n.date)}</span>}</div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}><button onClick={e => { e.stopPropagation(); openEditGNote(n) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>✏️</button><button onClick={e => { e.stopPropagation(); removeGNote(n.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>🗑️</button><span style={{ color: T.gold, padding: 4 }}>{expandedNote === n.id ? '▲' : '▼'}</span></div>
              </div>
              {expandedNote === n.id && <><Divider /><pre style={{ margin: 0, fontFamily: "'Crimson Text', Georgia, serif", fontSize: 15, lineHeight: 1.8, color: T.inkLight, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>{n.content}</pre></>}
            </Card>
          ))}
          {showNoteModal && <Modal title={editingGNote ? 'Modifica Cronaca' : 'Nuova Cronaca di Gruppo'} onClose={() => setShowNoteModal(false)}><FF label="Titolo / Sessione"><Input value={gnoteForm.session_title} onChange={e => setGnoteForm({ ...gnoteForm, session_title: e.target.value })} placeholder="es. Sessione 3 — La cripta" /></FF><FF label="Data"><Input type="date" value={gnoteForm.date} onChange={e => setGnoteForm({ ...gnoteForm, date: e.target.value })} /></FF><FF label="Cronaca"><Textarea value={gnoteForm.content} onChange={e => setGnoteForm({ ...gnoteForm, content: e.target.value })} style={{ minHeight: 160 }} /></FF><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowNoteModal(false)}>Annulla</BtnS><BtnP onClick={saveGNote}>Trascrivi</BtnP></div></Modal>}
        </div>
      )}
    </div>
  )
}

// ─── Lore ─────────────────────────────────────────────────────────────────────
function LoreSection({ isDM }) {
  const [lores, setLores] = useState([])
  const [sections, setSections] = useState({})
  const [collapsed, setCollapsed] = useState({})
  const [collapsedSections, setCollapsedSections] = useState({})
  const [loading, setLoading] = useState(true)
  const [showLoreModal, setShowLoreModal] = useState(false)
  const [editingLore, setEditingLore] = useState(null)
  const [loreForm, setLoreForm] = useState({ name: '', description: '' })
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [activeLoreId, setActiveLoreId] = useState(null)
  const [sectionForm, setSectionForm] = useState({ title: '', content: '' })

  useEffect(() => {
    Promise.all([
      supabase.from('lore').select('*').eq('campaign_id', 'sunless').order('order_index'),
      supabase.from('lore_sections').select('*').eq('campaign_id', 'sunless').order('order_index'),
    ]).then(([l, s]) => {
      const ls = l.data || []
      setLores(ls)
      const grouped = {}
      const initCollapsed = {}
      ls.forEach(lore => {
        grouped[lore.id] = (s.data || []).filter(sec => sec.lore_id === lore.id)
        initCollapsed[lore.id] = true
      })
      setSections(grouped)
      setCollapsed(initCollapsed)
      setLoading(false)
    })
  }, [])

  const toggleLore = (id) => setCollapsed(c => ({ ...c, [id]: !c[id] }))
  const toggleSection = (id) => setCollapsedSections(c => ({ ...c, [id]: !c[id] }))

  const openAddLore = () => { setEditingLore(null); setLoreForm({ name: '', description: '' }); setShowLoreModal(true) }
  const openEditLore = (l) => { setEditingLore(l); setLoreForm({ name: l.name, description: l.description || '' }); setShowLoreModal(true) }
  const saveLore = async () => {
    if (!loreForm.name) return
    if (editingLore) {
      const { data } = await supabase.from('lore').update(loreForm).eq('id', editingLore.id).select()
      if (data) setLores(lores.map(l => l.id === editingLore.id ? data[0] : l))
    } else {
      const { data } = await supabase.from('lore').insert([{ campaign_id: 'sunless',  ...loreForm, order_index: lores.length }]).select()
      if (data) { setLores([...lores, data[0]]); setSections(s => ({ ...s, [data[0].id]: [] })) }
    }
    setShowLoreModal(false)
  }
  const removeLore = async (id) => {
    await supabase.from('lore').delete().eq('id', id)
    setLores(lores.filter(l => l.id !== id))
    setSections(s => { const n = { ...s }; delete n[id]; return n })
  }

  const openAddSection = (loreId) => { setEditingSection(null); setActiveLoreId(loreId); setSectionForm({ title: '', content: '' }); setShowSectionModal(true) }
  const openEditSection = (sec, loreId) => { setEditingSection(sec); setActiveLoreId(loreId); setSectionForm({ title: sec.title, content: sec.content || '' }); setShowSectionModal(true) }
  const saveSection = async () => {
    if (!sectionForm.title) return
    if (editingSection) {
      const { data } = await supabase.from('lore_sections').update(sectionForm).eq('id', editingSection.id).select()
      if (data) setSections(s => ({ ...s, [activeLoreId]: s[activeLoreId].map(sec => sec.id === editingSection.id ? data[0] : sec) }))
    } else {
      const order = (sections[activeLoreId] || []).length
      const { data } = await supabase.from('lore_sections').insert([{ campaign_id: 'sunless',  ...sectionForm, lore_id: activeLoreId, order_index: order }]).select()
      if (data) setSections(s => ({ ...s, [activeLoreId]: [...(s[activeLoreId] || []), data[0]] }))
    }
    setShowSectionModal(false)
  }
  const removeSection = async (secId, loreId) => {
    await supabase.from('lore_sections').delete().eq('id', secId)
    setSections(s => ({ ...s, [loreId]: s[loreId].filter(sec => sec.id !== secId) }))
  }

  if (loading) return <p style={{ color: T.inkFaint }}>Caricamento...</p>
  return (
    <div>
      <SH title="📖 Lore" action={isDM && <BtnP onClick={openAddLore}>+ Voce</BtnP>} />
      {lores.length === 0 && <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>Il grande libro del sapere è ancora vuoto...</p>}
      {lores.map(lore => (
        <div key={lore.id} style={{ marginBottom: 16 }}>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', borderBottom: collapsed[lore.id] ? 'none' : `1px solid ${T.parchmentDarker}` }}
              onClick={() => toggleLore(lore.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-block', width: 0, height: 0, borderTop: collapsed[lore.id] ? '5px solid transparent' : 'none', borderBottom: collapsed[lore.id] ? '5px solid transparent' : 'none', borderRight: collapsed[lore.id] ? `8px solid ${T.gold}` : 'none', borderLeft: collapsed[lore.id] ? 'none' : `8px solid ${T.gold}`, marginTop: collapsed[lore.id] ? 0 : '3px' }} />
                <span style={{ fontWeight: 700, fontSize: 17, color: T.ink, ...headerFont }}>{lore.name}</span>
              </div>
              {isDM && (
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEditLore(lore)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>✏️</button>
                  <button onClick={() => removeLore(lore.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, color: T.inkFaint }}>🗑️</button>
                </div>
              )}
            </div>
            {!collapsed[lore.id] && (
              <div style={{ padding: '12px 16px' }}>
                {lore.description && <p style={{ fontSize: 15, color: T.inkLight, lineHeight: 1.7, margin: '0 0 12px', fontStyle: 'italic' }}>{lore.description}</p>}
                {(sections[lore.id] || []).map(sec => (
                  <div key={sec.id} style={{ marginBottom: 8, border: `1px solid ${T.parchmentDarker}`, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer', background: T.parchmentDark + '88' }}
                      onClick={() => toggleSection(sec.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'inline-block', width: 0, height: 0, borderTop: collapsedSections[sec.id] ? '4px solid transparent' : 'none', borderBottom: collapsedSections[sec.id] ? '4px solid transparent' : 'none', borderRight: collapsedSections[sec.id] ? `7px solid ${T.inkFaint}` : 'none', borderLeft: collapsedSections[sec.id] ? 'none' : `7px solid ${T.inkFaint}`, marginTop: collapsedSections[sec.id] ? 0 : '2px' }} />
                        <span style={{ fontWeight: 600, fontSize: 15, color: T.red, ...headerFont }}>{sec.title}</span>
                      </div>
                      {isDM && (
                        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditSection(sec, lore.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4, color: T.inkFaint }}>✏️</button>
                          <button onClick={() => removeSection(sec.id, lore.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4, color: T.inkFaint }}>🗑️</button>
                        </div>
                      )}
                    </div>
                    {!collapsedSections[sec.id] && (
                      <div style={{ padding: '10px 14px' }}>
                        <p style={{ fontSize: 15, lineHeight: 1.8, color: T.inkLight, margin: 0, whiteSpace: 'pre-wrap' }}>{sec.content || <span style={{ fontStyle: 'italic', color: T.inkFaint }}>Nessun contenuto.</span>}</p>
                      </div>
                    )}
                  </div>
                ))}
                {isDM && (
                  <button onClick={() => openAddSection(lore.id)}
                    style={{ marginTop: 8, background: 'transparent', border: `1px dashed ${T.parchmentDarker}`, borderRadius: 4, padding: '8px 14px', fontSize: 14, cursor: 'pointer', color: T.inkFaint, width: '100%', textAlign: 'left', ...bodyFont }}>
                    + Aggiungi sezione
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>
      ))}
      {showLoreModal && (
        <Modal title={editingLore ? 'Modifica Voce' : 'Nuova Voce Lore'} onClose={() => setShowLoreModal(false)}>
          <FF label="Nome"><Input value={loreForm.name} onChange={e => setLoreForm({ ...loreForm, name: e.target.value })} placeholder="es. Il Culto del Vuoto, Le Rune Antiche..." /></FF>
          <FF label="Descrizione breve"><Textarea value={loreForm.description} onChange={e => setLoreForm({ ...loreForm, description: e.target.value })} /></FF>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowLoreModal(false)}>Annulla</BtnS><BtnP onClick={saveLore}>Salva</BtnP></div>
        </Modal>
      )}
      {showSectionModal && (
        <Modal title={editingSection ? 'Modifica Sezione' : 'Nuova Sezione'} onClose={() => setShowSectionModal(false)}>
          <FF label="Titolo"><Input value={sectionForm.title} onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })} placeholder="es. Origine, Rituali, Figure Chiave..." /></FF>
          <FF label="Contenuto"><Textarea value={sectionForm.content} onChange={e => setSectionForm({ ...sectionForm, content: e.target.value })} style={{ minHeight: 160 }} /></FF>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={() => setShowSectionModal(false)}>Annulla</BtnS><BtnP onClick={saveSection}>Salva</BtnP></div>
        </Modal>
      )}
    </div>
  )
}

// ─── Tira Dadi ────────────────────────────────────────────────────────────────
function DiceSection() {
  const DICE = [4, 6, 8, 10, 12, 20, 100]
  const DC = { 4: T.purple, 6: T.green, 8: T.red, 10: T.blue, 12: '#7a1a4a', 20: T.gold, 100: T.inkFaint }
  const [counts, setCounts] = useState({ 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 1, 100: 0 })
  const [mod, setMod] = useState(0)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [rolling, setRolling] = useState(false)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const roll = () => {
    if (total === 0) return; setRolling(true)
    setTimeout(() => {
      const rolled = []; let sum = mod
      Object.entries(counts).forEach(([f, n]) => { for (let i = 0; i < n; i++) { const v = Math.floor(Math.random() * parseInt(f)) + 1; rolled.push({ f: parseInt(f), v }); sum += v } })
      rolled.sort((a, b) => b.f - a.f)
      const label = Object.entries(counts).filter(([, n]) => n > 0).map(([f, n]) => `${n}d${f === '100' ? '%' : f}`).join('+') + (mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : '')
      const r = { rolled, sum, mod, label, time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }
      setResult(r); setHistory(h => [r, ...h].slice(0, 10)); setRolling(false)
    }, 350)
  }
  const reset = () => { setCounts({ 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 1, 100: 0 }); setMod(0); setResult(null) }

  return (
    <div>
      <SH title="🎲 Tira Dadi" />
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 10, marginBottom: 16 }}>
          {DICE.map(f => { const c = DC[f]; const n = counts[f]; return <div key={f} style={{ textAlign: 'center' }}><div style={{ fontSize: 13, fontWeight: 700, color: c, marginBottom: 6, ...headerFont }}>{f === 100 ? 'd%' : `d${f}`}</div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><button onClick={() => setCounts(p => ({ ...p, [f]: Math.max(0, p[f] - 1) }))} style={{ width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${c}66`, background: c + '11', color: c, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>−</button><span style={{ fontSize: 18, fontWeight: 700, minWidth: 22, color: n > 0 ? c : T.parchmentDarker }}>{n}</span><button onClick={() => setCounts(p => ({ ...p, [f]: p[f] + 1 }))} style={{ width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${c}66`, background: c + '11', color: c, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>+</button></div></div> })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: `1px solid ${T.parchmentDarker}`, marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: T.inkLight }}>Modificatore:</span>
          <button onClick={() => setMod(m => m - 1)} style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${T.parchmentDarker}`, background: T.parchmentDark, fontSize: 18, cursor: 'pointer', color: T.inkLight }}>−</button>
          <span style={{ fontSize: 18, fontWeight: 700, minWidth: 34, textAlign: 'center', color: mod > 0 ? T.green : mod < 0 ? T.red : T.inkFaint }}>{mod > 0 ? '+' + mod : mod}</span>
          <button onClick={() => setMod(m => m + 1)} style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${T.parchmentDarker}`, background: T.parchmentDark, fontSize: 18, cursor: 'pointer', color: T.inkLight }}>+</button>
        </div>
        <div style={{ display: 'flex', gap: 10 }}><BtnP onClick={roll} disabled={total === 0 || rolling} style={{ flex: 1, fontSize: 17 }}>{rolling ? '🎲 ...' : `🎲 Tira${total > 0 ? ` (${total})` : ''}`}</BtnP><BtnS onClick={reset} style={{ minWidth: 80 }}>Reset</BtnS></div>
      </Card>
      {result && <Card style={{ marginBottom: 16, border: `2px solid ${T.gold}`, background: `linear-gradient(135deg, #f8f0d8, #f4e4c1)` }}><div style={{ fontSize: 13, color: T.inkFaint, marginBottom: 8 }}>{result.label}</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>{result.rolled.map((r, i) => <div key={i} style={{ width: 46, height: 46, borderRadius: 6, background: DC[r.f] + '22', border: `2px solid ${DC[r.f]}66`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 17, fontWeight: 700, color: DC[r.f], lineHeight: 1 }}>{r.v}</span><span style={{ fontSize: 9, color: DC[r.f] + 'aa' }}>d{r.f}</span></div>)}{result.mod !== 0 && <div style={{ width: 46, height: 46, borderRadius: 6, background: T.parchmentDark, border: `2px solid ${T.parchmentDarker}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 14, fontWeight: 700, color: result.mod > 0 ? T.green : T.red, lineHeight: 1 }}>{result.mod > 0 ? '+' : ''}{result.mod}</span><span style={{ fontSize: 9, color: T.inkFaint }}>mod</span></div>}</div><Divider /><div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 14, color: T.inkFaint }}>Totale:</span><span style={{ fontSize: 44, fontWeight: 700, color: T.red, lineHeight: 1, ...headerFont }}>{result.sum}</span></div></Card>}
      {history.length > 1 && <div><p style={{ fontSize: 13, fontWeight: 600, color: T.inkFaint, marginBottom: 8, ...headerFont, letterSpacing: '0.05em' }}>TIRI PRECEDENTI</p>{history.slice(1).map((h, i) => <Card key={i} style={{ padding: '0.6rem 1rem', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 14, color: T.inkLight }}>{h.label}</span><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 20, fontWeight: 700, color: T.red }}>{h.sum}</span><span style={{ fontSize: 11, color: T.inkFaint }}>{h.time}</span></div></Card>)}</div>}
    </div>
  )
}

// ─── Iniziativa ───────────────────────────────────────────────────────────────
function InitiativeSection({ isDM, profile, players }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddMonster, setShowAddMonster] = useState(false)
  const [monsterForm, setMonsterForm] = useState({ name: '', roll: 0, color: T.red })
  const [myRoll, setMyRoll] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const loadEntries = () =>
    supabase.from('initiative').select('*').eq('campaign_id', 'sunless').order('roll', { ascending: false }).then(({ data }) => {
      const d = data || []
      setEntries(d)
      const mine = d.find(e => e.player_id === profile.id && !e.is_monster)
      setHasSubmitted(!!mine)
      if (mine) setMyRoll(String(mine.roll))
      setLoading(false)
    })

  useEffect(() => {
    loadEntries()
    const ch = supabase.channel('initiative_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'initiative' }, loadEntries)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const submitMyRoll = async () => {
    const roll = parseInt(myRoll)
    if (isNaN(roll)) return
    const playerProfile = players.find(p => p.id === profile.id)
    const existing = entries.find(e => e.player_id === profile.id && !e.is_monster)
    if (existing) {
      await supabase.from('initiative').update({ roll }).eq('id', existing.id)
    } else {
      await supabase.from('initiative').insert([{ campaign_id: 'sunless', 
        name: playerProfile?.username || 'Giocatore',
        roll, player_id: profile.id, is_monster: false,
        color: playerProfile?.player_color || T.gold,
        position: 0, is_active: false
      }])
    }
    setHasSubmitted(true)
  }

  const addMonster = async () => {
    if (!monsterForm.name) return
    await supabase.from('initiative').insert([{ campaign_id: 'sunless', 
      name: monsterForm.name, roll: parseInt(monsterForm.roll) || 0,
      is_monster: true, color: monsterForm.color, position: 0, is_active: false
    }])
    setShowAddMonster(false)
    setMonsterForm({ name: '', roll: 0, color: T.red })
  }

  const removeEntry = async (id) => supabase.from('initiative').delete().eq('id', id)

  const clearAll = async () => {
    await supabase.from('initiative').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setHasSubmitted(false); setMyRoll('')
  }

  const setActive = async (id) => {
    await Promise.all(entries.map(e =>
      supabase.from('initiative').update({ is_active: e.id === id }).eq('id', e.id)
    ))
  }

  const nextTurn = async () => {
    if (entries.length === 0) return
    const activeIdx = entries.findIndex(e => e.is_active)
    const nextIdx = (activeIdx + 1) % entries.length
    await Promise.all(entries.map((e, i) =>
      supabase.from('initiative').update({ is_active: i === nextIdx }).eq('id', e.id)
    ))
  }

  if (loading) return <p style={{ color: T.inkFaint }}>Caricamento...</p>

  // Display: active entry first, then the rest in roll order
  const activeIdx = entries.findIndex(e => e.is_active)
  const displayEntries = activeIdx >= 0
    ? [...entries.slice(activeIdx), ...entries.slice(0, activeIdx)]
    : entries
  const activeEntry = entries.find(e => e.is_active)

  return (
    <div>
      <SH title="⚔️ Iniziativa" action={
        isDM && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <BtnS onClick={() => setShowAddMonster(true)}>+ Mostro</BtnS>
            <BtnD onClick={clearAll}>🗑 Azzera</BtnD>
          </div>
        )
      } />

      {/* Player roll input */}
      {!isDM && (
        <Card style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: T.inkFaint, marginBottom: 10, fontStyle: 'italic' }}>Inserisci il tuo tiro di iniziativa:</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Input type="number" value={myRoll} onChange={e => setMyRoll(e.target.value)}
              placeholder="es. 14" style={{ maxWidth: 90 }} />
            <BtnP onClick={submitMyRoll} disabled={!myRoll}>{hasSubmitted ? '↻ Aggiorna' : '✓ Conferma'}</BtnP>
            {hasSubmitted && <span style={{ fontSize: 13, color: T.green }}>✓ Inviato</span>}
          </div>
        </Card>
      )}

      {/* DM controls */}
      {isDM && entries.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <BtnP onClick={nextTurn} style={{ marginBottom: 8 }}>→ Prossimo turno</BtnP>
          {activeEntry && (
            <p style={{ fontSize: 13, color: T.gold, margin: 0, fontStyle: 'italic' }}>
              Turno di: <strong style={{ color: T.ink, ...headerFont }}>{activeEntry.name}</strong>
            </p>
          )}
        </div>
      )}

      {entries.length === 0 && <p style={{ color: T.inkFaint, fontStyle: 'italic' }}>Nessun partecipante ancora...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {displayEntries.map((entry, i) => (
          <div key={entry.id} style={{
            borderRadius: 8,
            background: entry.is_active
              ? `linear-gradient(135deg, ${entry.color || T.gold}22, ${entry.color || T.gold}11)`
              : T.parchment,
            border: entry.is_active
              ? `2px solid ${entry.color || T.gold}`
              : `1.5px solid ${entry.is_monster ? T.red + '55' : T.parchmentDarker}`,
            boxShadow: entry.is_active ? `0 0 14px ${entry.color || T.gold}33` : 'none',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10 }}>
              {/* Number badge */}
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: entry.color || T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{i + 1}</span>
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.ink, ...headerFont, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                  {entry.is_monster && <span style={{ fontSize: 10, color: T.red, border: `1px solid ${T.red}44`, borderRadius: 3, padding: '0 5px', ...headerFont }}>MOSTRO</span>}
                  {entry.is_active && <span style={{ fontSize: 10, color: entry.color || T.gold, border: `1px solid ${entry.color || T.gold}66`, borderRadius: 3, padding: '0 5px', ...headerFont }}>✦ TURNO</span>}
                </div>
              </div>

              {/* Roll */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: T.inkFaint, ...headerFont, letterSpacing: '0.05em' }}>INIT</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.ink, ...headerFont, lineHeight: 1 }}>{entry.roll}</div>
              </div>

              {/* DM actions */}
              {isDM && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 4 }}>
                  <button onClick={() => setActive(entry.id)} title="Imposta turno"
                    style={{ width: 32, height: 32, borderRadius: 6, background: entry.is_active ? T.gold : T.parchmentDark, border: `1px solid ${T.gold}`, cursor: 'pointer', fontSize: 14, color: entry.is_active ? '#fff' : T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {entry.is_active ? '★' : '☆'}
                  </button>
                  <button onClick={() => removeEntry(entry.id)}
                    style={{ width: 32, height: 32, borderRadius: 6, background: 'none', border: `1px solid ${T.parchmentDarker}`, cursor: 'pointer', fontSize: 14, color: T.inkFaint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddMonster && (
        <Modal title="Aggiungi Mostro" onClose={() => setShowAddMonster(false)}>
          <FF label="Nome"><Input value={monsterForm.name} onChange={e => setMonsterForm({ ...monsterForm, name: e.target.value })} placeholder="es. Goblin, Drago Rosso..." /></FF>
          <FF label="Tiro iniziativa"><Input type="number" value={monsterForm.roll} onChange={e => setMonsterForm({ ...monsterForm, roll: e.target.value })} /></FF>
          <FF label="Colore">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[T.red, T.purple, '#1a4a3c', T.blue, T.inkFaint, '#7a1a4a'].map(c => (
                <button key={c} onClick={() => setMonsterForm({ ...monsterForm, color: c })}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: monsterForm.color === c ? `3px solid ${T.ink}` : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </FF>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <BtnS onClick={() => setShowAddMonster(false)}>Annulla</BtnS>
            <BtnP onClick={addMonster}>Aggiungi</BtnP>
          </div>
        </Modal>
      )}
    </div>
  )
}


// ─── Cambio password ──────────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const save = async () => {
    if (newPassword.length < 6) { setError('Minimo 6 caratteri.'); return }
    if (newPassword !== confirm) { setError('Le password non coincidono.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (err) { setError('Errore: ' + err.message) } else { setSuccess(true); setTimeout(onClose, 2000) }
  }
  return (
    <Modal title="🔐 Cambia Password" onClose={onClose}>
      {success
        ? <div style={{ textAlign: 'center', padding: '2rem' }}><div style={{ fontSize: 48, marginBottom: 12 }}>✅</div><p style={{ color: T.green, fontSize: 16 }}>Password aggiornata!</p></div>
        : <div>
            <p style={{ fontSize: 15, color: T.inkLight, marginBottom: 16 }}>Solo tu conoscerai la nuova password.</p>
            <FF label="Nuova password"><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimo 6 caratteri" /></FF>
            <FF label="Conferma"><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Ripeti la password" /></FF>
            {error && <p style={{ color: T.red, fontSize: 14, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><BtnS onClick={onClose}>Annulla</BtnS><BtnP onClick={save} disabled={loading}>{loading ? 'Salvataggio...' : 'Aggiorna'}</BtnP></div>
          </div>}
    </Modal>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ profile, players, activeSection, setActiveSection, onLogout, isOpen, onClose, isDM, onChangePassword, onExport, unreadCount, onChatOpen, legacyChars }) {
  const DM_SECTIONS = [
    { id: 'sessioni', label: 'Sessioni', icon: '📜' },
    { id: 'npc', label: 'NPC', icon: '⚔' },
    { id: 'mappa', label: 'Mappa', icon: '🗺️' },
    { id: 'fazioni', label: 'Fazioni', icon: '⚜' },
    { id: 'lore', label: 'Lore', icon: '📖' },
    { id: 'timeline', label: 'Cronaca', icon: '📅' },
    { id: 'spells', label: 'Incantesimi', icon: '✨' },
    { id: 'party', label: 'Compagnia', icon: '⚔️' },
    { id: 'dadi', label: 'Tira Dadi', icon: '🎲' },
    { id: 'iniziativa', label: 'Iniziativa', icon: '⚔️' },
    { id: 'messaggi', label: 'Messaggi', icon: '💬' },
  ]
  const DM_ONLY = [{ id: 'note_dm', label: 'Pergamene Segrete', icon: '🔒' }]
  const playerSections = isDM ? players : players.filter(p => p.id === profile?.id)
  const handleNav = (id) => { setActiveSection(id); onClose() }
  const isActive = (id) => activeSection === id
  const btnStyle = (id) => ({
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '10px 12px', borderRadius: 4,
    border: isActive(id) ? `1px solid ${T.goldLight}44` : '1px solid transparent',
    background: isActive(id) ? 'rgba(244,228,193,0.1)' : 'transparent',
    fontSize: 15, cursor: 'pointer', color: isActive(id) ? T.goldLight : T.parchmentDarker,
    fontWeight: isActive(id) ? 600 : 400, textAlign: 'left', minHeight: 44,
    fontFamily: isActive(id) ? "'Cinzel', Georgia, serif" : "'Crimson Text', Georgia, serif",
  })

  return (
    <>
      {isOpen && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,5,2,0.6)', zIndex: 200 }} />}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 270, background: `linear-gradient(180deg, #2a1508 0%, #1a0f05 100%)`, borderRight: `2px solid ${T.gold}44`, display: 'flex', flexDirection: 'column', zIndex: 300, transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', boxShadow: isOpen ? `6px 0 24px rgba(0,0,0,0.5)` : 'none', overflowY: 'auto' }}>
        <div style={{ padding: '1.5rem 1rem 1rem', borderBottom: `1px solid ${T.gold}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8, color: T.parchment, fontFamily: "'Cinzel', Georgia, serif", letterSpacing: '0.03em' }}><span style={{ fontSize: 24 }}>☀️</span> Sunless Citadel</div>
            <div style={{ fontSize: 13, color: T.goldLight, marginTop: 4, fontStyle: 'italic', fontFamily: "'Crimson Text', Georgia, serif" }}>{profile?.username} · {isDM ? 'Dungeon Master' : 'Avventuriero'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: T.goldLight, padding: 4 }}>×</button>
        </div>
        <div style={{ flex: 1, padding: '1rem 0.5rem' }}>
          <div style={{ fontSize: 10, color: T.goldLight, padding: '0 0.75rem', marginBottom: 6, letterSpacing: '0.1em', fontFamily: "'Cinzel', Georgia, serif" }}>LA CAMPAGNA</div>
          {DM_SECTIONS.map(s => (
          <button key={s.id} onClick={() => { handleNav(s.id); if (s.id === 'messaggi') onChatOpen() }} style={btnStyle(s.id)}>
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            {s.label}
            {s.id === 'messaggi' && unreadCount > 0 && <span style={{ marginLeft: 'auto', background: T.red, color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{unreadCount}</span>}
          </button>
        ))}
          {isDM && <>
            <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${T.gold}44, transparent)`, margin: '12px 8px' }} />
            <div style={{ fontSize: 10, color: T.goldLight, padding: '0 0.75rem', marginBottom: 6, letterSpacing: '0.1em', fontFamily: "'Cinzel', Georgia, serif" }}>SEGRETI</div>
            {DM_ONLY.map(s => <button key={s.id} onClick={() => handleNav(s.id)} style={btnStyle(s.id)}><span style={{ fontSize: 16 }}>{s.icon}</span>{s.label}</button>)}
          </>}
          <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${T.gold}44, transparent)`, margin: '12px 8px' }} />
          <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${T.gold}44, transparent)`, margin: '12px 8px' }} />
          <div style={{ fontSize: 10, color: T.goldLight, padding: '0 0.75rem', marginBottom: 6, letterSpacing: '0.1em', fontFamily: "'Cinzel', Georgia, serif" }}>LA COMPAGNIA</div>
          {playerSections.map(p => (
            <button key={p.id} onClick={() => handleNav('player_' + p.id)} style={btnStyle('player_' + p.id)}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.player_color || T.gold, flexShrink: 0, display: 'inline-block', boxShadow: `0 0 4px ${p.player_color || T.gold}88` }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.char_name || p.username}</span>
            </button>
          ))}
        {legacyChars && legacyChars.length > 0 && (
          <div style={{ padding: '0.5rem 0.75rem', borderTop: `1px solid ${T.gold}22` }}>
            <div style={{ fontSize: 10, color: T.inkFaint, padding: '0 0.25rem', marginBottom: 6, letterSpacing: '0.08em', fontFamily: "'Cinzel', Georgia, serif", opacity: 0.7 }}>CADUTI IN BATTAGLIA</div>
            {legacyChars.map(c => (
              <button key={c.id} onClick={() => handleNav('legacy_' + c.id)} style={{ ...btnStyle('legacy_' + c.id), opacity: 0.7 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.profiles?.player_color || T.inkFaint, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>✝ {c.name}</span>
              </button>
            ))}
          </div>
        )}
        </div>
        <div style={{ padding: '0.75rem', borderTop: `1px solid ${T.gold}33`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isDM && <button onClick={() => { onClose(); onExport() }} style={{ width: '100%', padding: '10px 12px', borderRadius: 4, border: `1px solid ${T.green}44`, background: `${T.green}11`, fontSize: 14, cursor: 'pointer', color: T.parchmentDarker, textAlign: 'left', minHeight: 44, fontFamily: "'Crimson Text', Georgia, serif" }}>📦 Esporta Knowledge Base</button>}
          <button onClick={() => { onClose(); onChangePassword() }} style={{ width: '100%', padding: '10px 12px', borderRadius: 4, border: `1px solid ${T.gold}44`, background: `${T.gold}11`, fontSize: 14, cursor: 'pointer', color: T.parchmentDarker, textAlign: 'left', minHeight: 44, fontFamily: "'Crimson Text', Georgia, serif" }}>🔐 Cambia Password</button>
          <button onClick={() => { onClose(); onLogout() }} style={{ width: '100%', padding: '10px 12px', borderRadius: 4, border: `1px solid ${T.red}44`, background: `${T.red}22`, fontSize: 14, cursor: 'pointer', color: T.parchmentDarker, textAlign: 'left', minHeight: 44, fontFamily: "'Crimson Text', Georgia, serif" }}>← Abbandona l'avventura</button>
        </div>
      </div>
    </>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function Campaign({ profile, onLogout }) {
  const [players, setPlayers] = useState([])
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dnd_activeSection') || 'sessioni'
    return 'sessioni'
  })
  const setActiveSectionPersist = (section) => {
    setActiveSection(section)
    if (typeof window !== 'undefined') localStorage.setItem('dnd_activeSection', section)
  }
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const isDM = profile?.role === 'dm'

  useEffect(() => {
    if (!profile) return
    // Load initial unread count
    supabase.from('messages').select('id', { count: 'exact' })
      .eq('recipient_id', profile.id).eq('read', false)
      .then(({ count }) => setUnreadCount(count || 0))
    // Realtime for new messages
    const ch = supabase.channel(`app_unread_${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages',
        filter: `recipient_id=eq.${profile.id}` }, () => {
        setUnreadCount(c => c + 1)
      }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  const exportKnowledgeBase = async () => {
    setExporting(true)
    try {
      const [sessions, npcs, factions, factionSections, lore, loreSections, timeline, quests, players_data, loot] = await Promise.all([
        supabase.from('sessions').select('*').eq('campaign_id', 'sunless').order('number'),
        supabase.from('npcs').select('*').eq('campaign_id', 'sunless').order('name'),
        supabase.from('factions').select('*').eq('campaign_id', 'sunless').order('order_index'),
        supabase.from('faction_sections').select('*').eq('campaign_id', 'sunless').order('order_index'),
        supabase.from('lore').select('*').eq('campaign_id', 'sunless').order('order_index'),
        supabase.from('lore_sections').select('*').eq('campaign_id', 'sunless').order('order_index'),
        supabase.from('timeline_events').select('*').eq('campaign_id', 'sunless').order('created_at'),
        supabase.from('quests').select('*').eq('campaign_id', 'sunless').order('created_at'),
        supabase.from('characters').select('*, profiles(username)'),
        supabase.from('party_loot').select('*').eq('campaign_id', 'sunless'),
      ])

      let md = `# Knowledge Base — Sunless Citadel

`
      md += `*Esportato il ${new Date().toLocaleDateString('it-IT')}*

---

`

      // Sessioni
      md += `# SESSIONI

`
      for (const s of sessions.data || []) {
        md += `## Sessione ${s.number}${s.title ? ` — ${s.title}` : ''}
`
        if (s.date) md += `*Data: ${new Date(s.date).toLocaleDateString('it-IT')}*

`
        if (s.summary) md += `${s.summary}

`
        md += `---

`
      }

      // NPC
      md += `# PERSONAGGI NON GIOCANTI (NPC)

`
      for (const n of npcs.data || []) {
        md += `## ${n.name}
`
        if (n.role) md += `**Ruolo:** ${n.role}
`
        if (n.attitude) md += `**Attitudine:** ${n.attitude}
`
        if (n.vitality) md += `**Stato:** ${n.vitality}
`
        if (n.faction) md += `**Fazione:** ${n.faction}
`
        if (n.first_location) md += `**Primo incontro:** ${n.first_location}
`
        if (n.current_location) md += `**Posizione attuale:** ${n.current_location}
`
        if (n.description) md += `
${n.description}
`
        if (n.notes_dm) md += `
**NOTE DM (riservate):** ${n.notes_dm}
`
        md += `
---

`
      }

      // Fazioni
      if ((factions.data || []).length > 0) {
        md += `# FAZIONI

`
        for (const f of factions.data || []) {
          md += `## ${f.name}
`
          if (f.description) md += `${f.description}

`
          const secs = (factionSections.data || []).filter(s => s.faction_id === f.id)
          for (const sec of secs) {
            md += `### ${sec.title}
`
            if (sec.content) md += `${sec.content}
`
            md += `
`
          }
          md += `---

`
        }
      }

      // Lore
      if ((lore.data || []).length > 0) {
        md += `# LORE

`
        for (const l of lore.data || []) {
          md += `## ${l.name}
`
          if (l.description) md += `${l.description}

`
          const secs = (loreSections.data || []).filter(s => s.lore_id === l.id)
          for (const sec of secs) {
            md += `### ${sec.title}
`
            if (sec.content) md += `${sec.content}
`
            md += `
`
          }
          md += `---

`
        }
      }

      // Timeline
      if ((timeline.data || []).length > 0) {
        md += `# TIMELINE

`
        for (const e of timeline.data || []) {
          md += `## ${e.title}
`
          if (e.date_ingame) md += `*${e.date_ingame}* — `
          if (e.type) md += `[${e.type}]
`
          if (e.description) md += `
${e.description}
`
          md += `
`
        }
        md += `---

`
      }

      // Quest
      if ((quests.data || []).length > 0) {
        md += `# MISSIONI

`
        for (const q of quests.data || []) {
          md += `## ${q.title} [${q.status}]
`
          if (q.description) md += `${q.description}
`
          if (q.reward) md += `*Ricompensa: ${q.reward}*
`
          md += `
`
        }
        md += `---

`
      }

      // Personaggi
      if ((players_data.data || []).length > 0) {
        md += `# PERSONAGGI GIOCANTI

`
        for (const c of players_data.data || []) {
          md += `## ${c.name || 'Personaggio senza nome'}
`
          if (c.race && c.class) md += `**${c.race} ${c.class}** — Livello ${c.level || '?'}
`
          if (c.background) md += `**Background:** ${c.background}
`
          md += `
`
        }
        md += `---

`
      }

      // Loot
      const lootEntry = (loot.data || []).find(l => l.name === '__loot_text__')
      if (lootEntry?.notes) {
        md += `# BOTTINO DEL GRUPPO

${lootEntry.notes}

---

`
      }

      // Download
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sunless-citadel-knowledge-base-${new Date().toISOString().split('T')[0]}.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert("Errore durante l'esportazione: " + err.message)
    }
    setExporting(false)
  }

  const [allContacts, setAllContacts] = useState([])
  const [legacyChars, setLegacyChars] = useState([])
  useEffect(() => {
    const reloadPlayers = () => supabase.from('profiles').select('*').eq('role', 'player').order('username').then(({ data }) => {
      const profs = data || []
      supabase.from('characters').select('player_id, name, is_legacy').eq('campaign_id', 'sunless').eq('is_legacy', false).then(({ data: chars }) => {
        const charMap = {}
        ;(chars || []).forEach(c => { charMap[c.player_id] = c.name })
        setPlayers(profs.map(p => ({ ...p, char_name: charMap[p.id] || null })))
      })
    })
    reloadPlayers()
    const playersCh = supabase.channel('players_chars_watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, () => { reloadPlayers() })
      .subscribe()
    supabase.from('profiles').select('*').order('username').then(({ data }) => setAllContacts(data || []))
    const reloadLegacy = () => supabase.from('characters').select('*, profiles(username, player_color)').eq('campaign_id', 'sunless').eq('is_legacy', true).then(({ data }) => setLegacyChars(data || []))
    reloadLegacy()
    // Reload when characters change
    const legacyCh = supabase.channel('legacy_chars_watch')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters' }, () => reloadLegacy())
      .subscribe()
    return () => supabase.removeChannel(legacyCh)
  }, [])

  const LABELS = { sessioni: '📜 Sessioni', npc: '⚔ NPC', mappa: '🗺️ Mappa', fazioni: '⚜ Fazioni', lore: '📖 Lore', timeline: '📅 Cronaca', spells: '✨ Incantesimi', party: '⚔️ Compagnia', dadi: '🎲 Tira Dadi', iniziativa: '⚔️ Iniziativa', note_dm: '🔒 Pergamene Segrete', messaggi: '💬 Messaggi' }
    const currentLabel = activeSection.startsWith('player_')
    ? (() => { const p = players.find(p => p.id === activeSection.replace('player_', '')); return p ? (p.char_name || p.username) : '' })()
    : activeSection.startsWith('legacy_')
    ? (() => { const c = legacyChars.find(c => c.id === activeSection.replace('legacy_', '')); return c ? ('✝ ' + c.name) : '' })()
    : (LABELS[activeSection] || activeSection)

  const renderSection = () => {
    if (activeSection === 'sessioni') return <SessionsSection isDM={isDM} />
    if (activeSection === 'npc') return <NPCSection isDM={isDM} />
    if (activeSection === 'mappa') return <MapSection isDM={isDM} />
    if (activeSection === 'fazioni') return <FactionsSection isDM={isDM} />
    if (activeSection === 'lore') return <LoreSection isDM={isDM} />
    if (activeSection === 'timeline') return <TimelineSection isDM={isDM} />
    if (activeSection === 'spells') return <SpellsSection />
    if (activeSection === 'party') return <SharedSection isDM={isDM} />
    if (activeSection === 'dadi') return <DiceSection />
    if (activeSection === 'iniziativa') return <InitiativeSection isDM={isDM} profile={profile} players={players} />
    if (activeSection === 'note_dm' && isDM) return <DMNotesSection />
    if (activeSection === 'messaggi') return <ChatSection profile={profile} players={players} isDM={isDM} allContacts={allContacts} />
    if (activeSection.startsWith('player_')) {
      const pid = activeSection.replace('player_', '')
      const player = players.find(p => p.id === pid)
      if (player) return <PlayerTab player={player} currentUserId={profile?.id} isDM={isDM} />
    }
    if (activeSection.startsWith('legacy_')) {
      const charId = activeSection.replace('legacy_', '')
      const legChar = legacyChars.find(c => c.id === charId)
      if (legChar) {
        const fakePlayer = { id: legChar.player_id, username: legChar.profiles?.username || '?' }
        return <PlayerTab player={fakePlayer} currentUserId={profile?.id} isDM={isDM} viewLegacyId={charId} />
      }
    }
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a0f08', fontFamily: "'Crimson Text', Georgia, serif", color: T.ink }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: `linear-gradient(180deg, #2a1508, #1a0f05)`, borderBottom: `1px solid ${T.gold}44`, padding: '0 1rem', height: 54, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 40, minHeight: 40, justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ display: 'block', width: 20, height: 2, background: T.goldLight, borderRadius: 2 }} />
          <span style={{ display: 'block', width: 20, height: 2, background: T.goldLight, borderRadius: 2 }} />
          <span style={{ display: 'block', width: 20, height: 2, background: T.goldLight, borderRadius: 2 }} />
        </button>
        <span style={{ fontSize: 20 }}>☀️</span>
        <span style={{ fontWeight: 600, fontSize: 15, flex: 1, color: T.parchment, fontFamily: "'Cinzel', Georgia, serif", letterSpacing: '0.03em' }}>{currentLabel}</span>
        {exporting && <span style={{ fontSize: 12, color: T.goldLight, fontStyle: 'italic' }}>⏳ Esportazione...</span>}
        <span style={{ fontSize: 13, color: T.goldLight, fontStyle: 'italic' }}>{profile?.username}</span>
      </div>
      <Sidebar profile={profile} players={players} activeSection={activeSection} setActiveSection={setActiveSectionPersist} onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isDM={isDM} onChangePassword={() => setShowPasswordModal(true)} onExport={exportKnowledgeBase} unreadCount={unreadCount} onChatOpen={() => setUnreadCount(0)} legacyChars={legacyChars} />
      <div style={{ padding: '1.25rem 1rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ ...parchmentBg, borderRadius: 8, padding: '1.5rem', minHeight: 'calc(100vh - 80px)', boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)', border: `1px solid ${T.parchmentDarker}` }}>
          {renderSection()}
        </div>
      </div>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  )
}
