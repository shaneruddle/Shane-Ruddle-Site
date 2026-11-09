import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { Bold, Italic, Strikethrough, Heading, List, ListOrdered, ListChecks, ChevronDown } from 'lucide-react';

// Rich text for Inbox notes. The note body stays plain text with light markdown, so the 300+ imported Apple notes,
// search, card previews and the Claude connector all keep working:
//   # Heading   ## Subheading   • bullet (also "- " / "* ")   1. numbered   ☐ / ☑ tick box (also "- [ ]" / "- [x]")
//   **bold**   *italic*   ~~struck~~
// The page edits it as formatted text (contentEditable) and writes it back to that format on every change.

const CHECK_RE = /^\s*(?:- \[([ xX])\]|(☐|☑))\s?/;
const BULLET_RE = /^\s*[•\-*·◦▪]\s+/;
const NUM_RE = /^\s*(\d{1,3})[.)]\s+/;
const H_RE = /^(#{1,3})\s+/;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inlineHtml(text: string) {
  return text.split(/(https?:\/\/\S+)/g).map(part => {
    if (/^https?:\/\//.test(part)) return `<a href="${esc(part)}" target="_blank" rel="noreferrer">${esc(part)}</a>`;
    return esc(part)
      .replace(/\*\*(?=\S)([^*\n]*?\S)\*\*/g, '<b>$1</b>')
      .replace(/~~(?=\S)([^~\n]*?\S)~~/g, '<s>$1</s>')
      .replace(/(^|[^*\w])\*(?=\S)([^*\n]*?\S)\*(?![*\w])/g, '$1<i>$2</i>');
  }).join('');
}

export function mdToHtml(md: string): string {
  const lines = md.replace(/\r/g, '').split('\n');
  const out: string[] = [];
  let list: { tag: string; kind: string; items: string[]; start?: number } | null = null;
  const end = () => {
    if (!list) return;
    const attrs = list.kind === 'check' ? ' data-type="check"' : list.start && list.start !== 1 ? ` start="${list.start}"` : '';
    out.push(`<${list.tag}${attrs}>${list.items.join('')}</${list.tag}>`);
    list = null;
  };
  const push = (tag: string, kind: string, li: string, start?: number) => {
    if (!list || list.kind !== kind) { end(); list = { tag, kind, items: [], start }; }
    list.items.push(li);
  };
  for (const l of lines) {
    let m: RegExpMatchArray | null;
    if ((m = l.match(CHECK_RE))) {
      const done = (m[1] && m[1] !== ' ') || m[2] === '☑';
      push('ul', 'check', `<li data-checked="${done ? 'true' : 'false'}">${inlineHtml(l.slice(m[0].length)) || '<br>'}</li>`);
    } else if ((m = l.match(BULLET_RE))) {
      push('ul', 'bullet', `<li>${inlineHtml(l.slice(m[0].length)) || '<br>'}</li>`);
    } else if ((m = l.match(NUM_RE))) {
      push('ol', 'num', `<li>${inlineHtml(l.slice(m[0].length)) || '<br>'}</li>`, Number(m[1]));
    } else if ((m = l.match(H_RE))) {
      end();
      out.push(`<${m[1].length === 1 ? 'h2' : 'h3'}>${inlineHtml(l.slice(m[0].length)) || '<br>'}</${m[1].length === 1 ? 'h2' : 'h3'}>`);
    } else {
      end();
      out.push(`<p>${inlineHtml(l) || '<br>'}</p>`);
    }
  }
  end();
  return out.join('') || '<p><br></p>';
}

const BLOCKS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'SECTION']);

// Wraps text in a marker, keeping spaces outside it so "**word **" never happens.
const wrap = (s: string, mark: string) => {
  const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
  return m[2] ? `${m[1]}${mark}${m[2]}${mark}${m[3]}` : s;
};

function inlineMd(node: Node, ctx: { b?: boolean; i?: boolean; s?: boolean } = {}): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent || '').replace(/ /g, ' ').replace(/​/g, '');
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as HTMLElement;
  if (el.tagName === 'BR') return '\n';
  const style = el.style;
  const b = !ctx.b && (el.tagName === 'B' || el.tagName === 'STRONG' || /^(bold|[6-9]00)$/.test(style?.fontWeight || ''));
  const i = !ctx.i && (el.tagName === 'I' || el.tagName === 'EM' || style?.fontStyle === 'italic');
  const s = !ctx.s && (el.tagName === 'S' || el.tagName === 'STRIKE' || el.tagName === 'DEL' || /line-through/.test(style?.textDecoration || ''));
  const next = { b: ctx.b || b, i: ctx.i || i, s: ctx.s || s };
  let text = Array.from(el.childNodes).map(c => inlineMd(c, next)).join('');
  if (s) text = wrap(text, '~~');
  if (i) text = wrap(text, '*');
  if (b) text = wrap(text, '**');
  return text;
}

const lineText = (el: Node) => inlineMd(el).replace(/\n+$/, '');

export function htmlToMd(root: HTMLElement): string {
  const lines: string[] = [];
  let loose = '';
  const flushLoose = () => { if (loose) { lines.push(...loose.replace(/\n$/, '').split('\n')); loose = ''; } };
  const block = (el: HTMLElement) => {
    const tag = el.tagName;
    if (tag === 'UL' || tag === 'OL') {
      const check = el.dataset.type === 'check';
      let n = Number(el.getAttribute('start')) || 1;
      for (const li of Array.from(el.children) as HTMLElement[]) {
        if (li.tagName !== 'LI') { block(li); continue; }
        // A list inside a list item (from paste or Tab) is flattened onto its own lines.
        const nested = Array.from(li.children).filter(c => c.tagName === 'UL' || c.tagName === 'OL') as HTMLElement[];
        nested.forEach(x => x.remove());
        const t = lineText(li).replace(/\n/g, ' ');
        lines.push(check ? `${li.dataset.checked === 'true' ? '☑' : '☐'} ${t}` : tag === 'OL' ? `${n++}. ${t}` : `• ${t}`);
        nested.forEach(x => { block(x); li.appendChild(x); });
      }
    } else if (/^H[1-6]$/.test(tag)) {
      lines.push(`${tag === 'H1' || tag === 'H2' ? '#' : '##'} ${lineText(el).replace(/\n/g, ' ')}`);
    } else if (Array.from(el.children).some(c => BLOCKS.has(c.tagName))) {
      walk(el);
    } else {
      const t = lineText(el);
      lines.push(...(t ? t.split('\n') : ['']));
    }
  };
  const walk = (parent: HTMLElement) => {
    for (const n of Array.from(parent.childNodes)) {
      if (n.nodeType === Node.ELEMENT_NODE && BLOCKS.has((n as HTMLElement).tagName)) { flushLoose(); block(n as HTMLElement); }
      else loose += inlineMd(n);
    }
    flushLoose();
  };
  walk(root);
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  return lines.join('\n');
}

// Strips the markers for one-line previews (cards, lists).
export const plainPreview = (md: string) => md
  .replace(/^- \[ \] /gm, '☐ ').replace(/^- \[x\] /gim, '☑ ')
  .replace(/^#{1,3}\s+/gm, '')
  .replace(/\*\*(?=\S)([^*\n]*?\S)\*\*/g, '$1').replace(/~~(?=\S)([^~\n]*?\S)~~/g, '$1')
  .replace(/(^|[^*\w])\*(?=\S)([^*\n]*?\S)\*(?![*\w])/g, '$1$2');

export interface NoteEditorHandle { focusEnd: () => void; addChecklist: () => void }

const closest = (n: Node | null, sel: string, root: HTMLElement): HTMLElement | null => {
  const el = n && (n.nodeType === Node.ELEMENT_NODE ? (n as HTMLElement) : n.parentElement);
  const hit = el?.closest(sel) as HTMLElement | null;
  return hit && root.contains(hit) ? hit : null;
};

export const NoteEditor = forwardRef<NoteEditorHandle, { value: string; onChange: (md: string) => void; color: string; placeholder?: string; onFocusChange?: (f: boolean) => void }>(
  function NoteEditor({ value, onChange, color, placeholder, onFocusChange }, ref) {
    const el = useRef<HTMLDivElement>(null);
    const last = useRef(value);
    const [focused, setFocused] = useState(false);
    const [active, setActive] = useState<Record<string, boolean>>({});
    const [kbOffset, setKbOffset] = useState(0);
    const [empty, setEmpty] = useState(!value.trim());

    // Load the note once, and again only if it changes from outside (e.g. a save from another device).
    useEffect(() => {
      if (!el.current) return;
      if (el.current.innerHTML && value === last.current) return;
      el.current.innerHTML = mdToHtml(value);
      last.current = value;
      setEmpty(!value.trim());
    }, [value]);

    const emit = () => {
      if (!el.current) return;
      const md = htmlToMd(el.current);
      setEmpty(!md.trim() && !el.current.querySelector('li,h2,h3'));
      if (md !== last.current) { last.current = md; onChange(md); }
    };

    const refreshActive = () => {
      const root = el.current;
      const sel = document.getSelection();
      if (!root || !sel?.anchorNode || !root.contains(sel.anchorNode)) return;
      const ul = closest(sel.anchorNode, 'ul', root);
      setActive({
        bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), strike: document.queryCommandState('strikeThrough'),
        heading: !!closest(sel.anchorNode, 'h2,h3', root), check: ul?.dataset.type === 'check', bullet: !!ul && ul.dataset.type !== 'check', num: !!closest(sel.anchorNode, 'ol', root),
      });
    };

    useEffect(() => {
      document.addEventListener('selectionchange', refreshActive);
      return () => document.removeEventListener('selectionchange', refreshActive);
    }, []);

    // Keep the format bar sitting just above the iPhone keyboard.
    useEffect(() => {
      const vv = window.visualViewport;
      if (!vv) return;
      const fit = () => setKbOffset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
      fit();
      vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit);
      return () => { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); };
    }, []);

    const cmd = (name: string, arg?: string) => {
      document.execCommand('styleWithCSS', false, 'false');
      document.execCommand(name, false, arg);
    };

    const placeCaretEnd = () => {
      const root = el.current!;
      root.focus();
      const r = document.createRange();
      r.selectNodeContents(root.lastElementChild?.tagName === 'UL' || root.lastElementChild?.tagName === 'OL' ? root.lastElementChild.lastElementChild || root : root.lastElementChild || root);
      r.collapse(false);
      const s = document.getSelection()!;
      s.removeAllRanges(); s.addRange(r);
    };

    const toggleList = (kind: 'bullet' | 'num' | 'check') => {
      const root = el.current!;
      const sel = document.getSelection();
      const ul = sel?.anchorNode ? closest(sel.anchorNode, 'ul,ol', root) : null;
      const current = !ul ? null : ul.tagName === 'OL' ? 'num' : ul.dataset.type === 'check' ? 'check' : 'bullet';
      if (current === kind) {
        cmd(kind === 'num' ? 'insertOrderedList' : 'insertUnorderedList');
      } else if (current && current !== 'num' && kind !== 'num') {
        // Bullet <-> tick box is the same list, just marked differently.
        if (kind === 'check') { ul!.dataset.type = 'check'; ul!.querySelectorAll('li').forEach(li => { li.dataset.checked = 'false'; }); }
        else { delete ul!.dataset.type; ul!.querySelectorAll('li').forEach(li => { delete li.dataset.checked; }); }
      } else {
        if (closest(sel?.anchorNode || null, 'h2,h3', root)) cmd('formatBlock', '<p>');
        cmd(kind === 'num' ? 'insertOrderedList' : 'insertUnorderedList');
        if (kind === 'check') {
          const made = closest(document.getSelection()?.anchorNode || null, 'ul', root);
          if (made) { made.dataset.type = 'check'; made.querySelectorAll('li').forEach(li => { if (!li.dataset.checked) li.dataset.checked = 'false'; }); }
        }
      }
      emit(); refreshActive();
    };

    const toggleHeading = () => {
      const root = el.current!;
      const h = closest(document.getSelection()?.anchorNode || null, 'h2,h3', root);
      if (!h && closest(document.getSelection()?.anchorNode || null, 'li', root)) {
        const list = closest(document.getSelection()?.anchorNode || null, 'ul,ol', root)!;
        cmd(list.tagName === 'OL' ? 'insertOrderedList' : 'insertUnorderedList');
      }
      cmd('formatBlock', h ? '<p>' : '<h2>');
      emit(); refreshActive();
    };

    useImperativeHandle(ref, () => ({
      focusEnd: () => placeCaretEnd(),
      addChecklist: () => {
        const root = el.current!;
        const lastBlock = root.lastElementChild as HTMLElement | null;
        const blankP = lastBlock?.tagName === 'P' && !lastBlock.textContent?.trim();
        if (lastBlock?.tagName === 'UL' && lastBlock.dataset.type === 'check') {
          const li = document.createElement('li'); li.dataset.checked = 'false'; li.innerHTML = '<br>'; lastBlock.appendChild(li);
        } else {
          const ul = document.createElement('ul'); ul.dataset.type = 'check';
          ul.innerHTML = '<li data-checked="false"><br></li>';
          if (blankP) lastBlock!.replaceWith(ul); else root.appendChild(ul);
        }
        placeCaretEnd(); emit();
      },
    }));

    // Ticking a box: tap the box itself. Works whether or not the keyboard is up.
    const onMouseDown = (e: React.MouseEvent) => {
      const root = el.current!;
      const target = e.target as HTMLElement;
      const li = target.closest('ul[data-type="check"] > li') as HTMLElement | null;
      if (li && root.contains(li) && e.clientX - li.getBoundingClientRect().left < 30) {
        e.preventDefault();
        li.dataset.checked = li.dataset.checked === 'true' ? 'false' : 'true';
        emit();
        return;
      }
      const a = target.closest('a') as HTMLAnchorElement | null;
      if (a && !focused) { e.preventDefault(); window.open(a.href, '_blank', 'noreferrer'); }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && ['b', 'i'].includes(e.key.toLowerCase())) { e.preventDefault(); cmd(e.key.toLowerCase() === 'b' ? 'bold' : 'italic'); emit(); return; }
      if (e.key !== 'Enter' || e.shiftKey) return;
      // A new tick box starts unticked, and Enter after a heading goes back to normal text.
      const root = el.current!;
      setTimeout(() => {
        const sel = document.getSelection();
        const li = closest(sel?.anchorNode || null, 'li', root);
        if (li && li.parentElement?.dataset.type === 'check') li.dataset.checked = 'false';
        const h = closest(sel?.anchorNode || null, 'h2,h3', root);
        if (h && !h.textContent?.trim()) cmd('formatBlock', '<p>');
        emit();
      }, 0);
    };

    const onPaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    };

    const btn = (key: string, label: string, icon: ReactNode, run: () => void) => (
      <button key={key} type="button" aria-label={label} aria-pressed={!!active[key]}
        onMouseDown={e => e.preventDefault()} onClick={run}
        className="flex-1 h-11 flex items-center justify-center rounded-lg transition-colors"
        style={active[key] ? { background: `${color}26`, color } : undefined}>
        {icon}
      </button>
    );

    return (
      <>
        <div className="relative">
          {empty && !focused && <div className="absolute inset-0 pointer-events-none text-black/25 text-[17px] leading-[1.6]">{placeholder}</div>}
          <div ref={el} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
            onInput={emit} onKeyDown={onKeyDown} onPaste={onPaste} onMouseDown={onMouseDown}
            onFocus={() => { setFocused(true); onFocusChange?.(true); document.execCommand('defaultParagraphSeparator', false, 'p'); refreshActive(); }}
            onBlur={() => { setFocused(false); onFocusChange?.(false); emit(); if (el.current) { el.current.innerHTML = mdToHtml(last.current); } }}
            className="note-rich min-h-[40dvh] text-[17px] leading-[1.6] outline-none break-words"
            style={{ ['--tick' as string]: color }} />
        </div>

        {focused && (
          <div className="fixed inset-x-0 z-[60] bg-[#F3EFE6] border-t border-black/[0.08] text-[#3b3628]" style={{ bottom: kbOffset, paddingBottom: kbOffset ? 0 : 'env(safe-area-inset-bottom)' }}>
            <div className="max-w-xl mx-auto flex items-center gap-0.5 px-1.5 py-1">
              {btn('heading', 'Heading', <Heading className="w-[19px] h-[19px]" strokeWidth={2.4} />, toggleHeading)}
              {btn('bold', 'Bold', <Bold className="w-[19px] h-[19px]" strokeWidth={2.8} />, () => { cmd('bold'); emit(); refreshActive(); })}
              {btn('italic', 'Italic', <Italic className="w-[19px] h-[19px]" strokeWidth={2.4} />, () => { cmd('italic'); emit(); refreshActive(); })}
              {btn('strike', 'Strikethrough', <Strikethrough className="w-[19px] h-[19px]" strokeWidth={2.4} />, () => { cmd('strikeThrough'); emit(); refreshActive(); })}
              <span className="w-px h-6 bg-black/10 mx-0.5" />
              {btn('bullet', 'Bullet list', <List className="w-5 h-5" strokeWidth={2.4} />, () => toggleList('bullet'))}
              {btn('num', 'Numbered list', <ListOrdered className="w-5 h-5" strokeWidth={2.4} />, () => toggleList('num'))}
              {btn('check', 'Tick boxes', <ListChecks className="w-5 h-5" strokeWidth={2.4} />, () => toggleList('check'))}
              <span className="w-px h-6 bg-black/10 mx-0.5" />
              {btn('done', 'Hide keyboard', <ChevronDown className="w-5 h-5" strokeWidth={2.4} />, () => el.current?.blur())}
            </div>
          </div>
        )}
      </>
    );
  },
);
