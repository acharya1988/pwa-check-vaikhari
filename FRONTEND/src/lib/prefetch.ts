"use client";
export function prefetchOnIdle(href: string) {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => fetch(href, { credentials: 'include' }).catch(() => {}));
  } else {
    setTimeout(() => fetch(href, { credentials: 'include' }).catch(() => {}), 200);
  }
}

export function prefetchOnHover(el: HTMLElement, href: string) {
  const on = () => fetch(href, { credentials: 'include' }).catch(() => {});
  el.addEventListener('mouseenter', on, { once: true });
}

