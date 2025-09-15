"use client";
import { useEffect } from 'react';

export default function OverflowInspector() {
  useEffect(() => {
    const mark = () => {
      // remove previous marks
      document.querySelectorAll('[data-overflow-mark]').forEach(n => n.remove());
      const vw = document.documentElement.clientWidth;
      const all = Array.from(document.body.querySelectorAll<HTMLElement>("*"));
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.width > vw + 1) {
          el.style.outline = '2px solid rgba(255,0,0,.5)';
          el.setAttribute('data-overflowed', 'true');
          const tag = document.createElement('div');
          tag.textContent = `↔ ${Math.round(r.width)}px`;
          tag.style.cssText = `position:absolute; z-index:9999; background:rgba(255,0,0,.8); color:#fff; font:12px/1 sans-serif; padding:2px 4px;`;
          tag.setAttribute('data-overflow-mark','');
          document.body.appendChild(tag);
          tag.style.left = `${Math.max(0, r.left)}px`;
          tag.style.top = `${window.scrollY + r.top - 18}px`;
        } else {
          if (el.getAttribute('data-overflowed')) {
            el.style.outline = '';
            el.removeAttribute('data-overflowed');
          }
        }
      }
    };
    mark();
    window.addEventListener('resize', mark);
    window.addEventListener('load', mark);
    const id = setInterval(mark, 800);
    return () => { clearInterval(id); window.removeEventListener('resize', mark); window.removeEventListener('load', mark); };
  }, []);
  return null;
}

