import { Component, HostListener, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommandPalette } from './shared/command-palette';
import { SearchService } from './shared/search.service';
import { A11yService, A11Y_PROFILES, A11yProfile } from './shared/a11y.service';

interface A11yTile { label: string; icon: string; on: () => boolean; run: () => void; level?: () => number; badge?: boolean }
import { FormsModule } from '@angular/forms';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { Menubar } from 'primeng/menubar';
import { ScrollTop } from 'primeng/scrolltop';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import { IMPORTANT_LINKS, LOGIN_MENU, NAV, QUICK_LINKS, SITE, SOCIAL } from './shared/site';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommandPalette, FormsModule, RouterLink, RouterOutlet, ButtonDirective, Menu, Menubar, ScrollTop, Select, ToggleSwitch, Tooltip,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  readonly site = SITE;
  readonly year = new Date().getFullYear();
  readonly nav = NAV;
  readonly loginMenu = LOGIN_MENU;
  readonly quickLinks = QUICK_LINKS;
  readonly importantLinks = IMPORTANT_LINKS;
  readonly social = SOCIAL;

  /* footer (Figma "Footer" 2053:372) */
  readonly fImg = 'assets/img/home/';
  readonly footerSocial = [
    { label: 'Facebook', icon: 'soc-1.svg', url: SOCIAL[0].url },
    { label: 'X (Twitter)', icon: 'soc-2.svg', url: 'https://x.com/' },
    { label: 'Instagram', icon: 'soc-3.svg', url: SOCIAL[1].url },
    { label: 'YouTube', icon: 'soc-4.svg', url: SOCIAL[2].url, glyph: true },
    { label: 'Wikipedia', icon: 'soc-5.svg', url: 'https://www.wikipedia.org/' },
    { label: 'LinkedIn', icon: 'soc-6.svg', url: 'https://www.linkedin.com/' },
  ];
  readonly footerQuick: { label: string; route?: string; url?: string }[][] = [
    [
      { label: 'Gujarat At A Glance', url: 'https://gujaratindia.gov.in/Home/GujaratAtAGlance' },
      { label: 'Gujarat History', url: 'https://gujaratindia.gov.in/Index' },
      { label: 'Greeting to Gujarat', url: 'https://gujaratindia.gov.in/Home/Getting-to-Gujarat' },
      { label: 'FAQs', route: '/faq' },
      { label: 'Sitemap', route: '/sitemap' },
    ],
    [
      { label: 'Feedback', route: '/feedback' },
      { label: 'Write to Grievance(Swagat)', url: 'https://swagat.gujarat.gov.in/' },
      { label: 'Collectors', url: 'https://revenuedepartment.gujarat.gov.in/collectorate' },
      { label: 'Gujarat Government Achievements', url: 'https://gujaratindia.gov.in/' },
    ],
  ];
  readonly footerImportant: { label: string; route?: string; url?: string }[][] = [
    [
      { label: 'Terms & Conditions', route: '/terms-conditions' },
      { label: 'Privacy Policy', route: '/privacy-policy' },
      { label: 'Copyright Policy', route: '/copyright-policy' },
      { label: 'Disclaimer & Policies', route: '/disclaimer' },
      { label: 'Help', route: '/help-desk' },
    ],
    [
      { label: 'Hyperlink Policy', route: '/hyperlinking-policy' },
      { label: 'Accessibility Statement', route: '/accessibility-statement' },
    ],
  ];
  readonly manuals = ['English', 'Gujarati', 'Sugam'];

  search = inject(SearchService);
  progress = signal(0);
  scrolled = signal(false);

  private ticking = false;

  navigating = signal(false);

  private loginTimer?: ReturnType<typeof setTimeout>;
  private loginHover = false;

  /** Login menu opens on mouse hover (and stays open while the pointer is on the button or the menu); touch and keyboard still use click. */
  loginEnter(m: Menu, e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    this.loginHover = true; clearTimeout(this.loginTimer);
    if (!m.visible) m.show(e);
  }
  loginLeave(m: Menu, e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(this.loginTimer);
    this.loginTimer = setTimeout(() => { this.loginHover = false; m.hide(); }, 200);
  }
  loginClick(m: Menu, e: Event) {
    if (this.loginHover && m.visible) return;
    m.toggle(e);
  }
  /** Keep the menu open while the pointer is over the overlay itself. */
  loginShown(m: Menu) {
    const el = document.querySelector<HTMLElement>('.p-menu-overlay');
    if (!el || el.dataset['hover']) return;
    el.dataset['hover'] = '1';
    el.addEventListener('pointerenter', () => clearTimeout(this.loginTimer));
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') this.loginLeave(m, e); });
  }

  constructor() {
    let navTimer: ReturnType<typeof setTimeout> | undefined;
    inject(Router).events.subscribe((e) => {
      // only show the bar if a navigation is still pending after 150ms, so fast page changes never flash it
      if (e instanceof NavigationStart) { clearTimeout(navTimer); navTimer = setTimeout(() => this.navigating.set(true), 150); }
      else if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) { clearTimeout(navTimer); this.navigating.set(false); }
    });
    document.addEventListener('click', (e) => {
      const li = this.hoverOpened;
      if (li && (e.target as Element).closest?.('.p-menubar-item-content') && li.contains(e.target as Node) && li.getAttribute('aria-expanded') === 'true') { e.stopPropagation(); this.hoverOpened = null; }
    }, true);
    // Teal Saffron is the default; a visitor's own pick (stored under THEME_KEY) wins.
    let saved: (typeof this.themes)[number] | undefined;
    try { const k = localStorage.getItem(App.THEME_KEY); saved = this.themes.find((x) => x.key === k); } catch { /* storage unavailable */ }
    this.setTheme(saved ?? this.defaultTheme);
    // Passive + rAF-throttled: scrolling never blocks, and signals only change when the value does.
    window.addEventListener('scroll', () => {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => { this.ticking = false; this.onScroll(); });
    }, { passive: true });
  }

  private onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
    if (Math.abs(p - this.progress()) > 0.002) this.progress.set(p);
    const s = h.scrollTop > 60;
    if (s !== this.scrolled()) this.scrolled.set(s);
  }


  // Desktop nav: open a submenu on hover, close it shortly after the pointer leaves (PrimeNG menubar is click-only).
  private navTimer: ReturnType<typeof setTimeout> | undefined;
  private hoverOpened: Element | null = null;
  private static readonly ROOT = '.main-nav .p-menubar-root-list > li';

  @HostListener('document:mouseover', ['$event'])
  onNavHover(e: MouseEvent) {
    if (!matchMedia('(hover: hover)').matches) return;
    const li = (e.target as Element | null)?.closest?.(App.ROOT) ?? null;
    const open = document.querySelector(`${App.ROOT}[aria-expanded="true"]`);
    const toggle = (el: Element) => el.querySelector<HTMLElement>('.p-menubar-item-content')?.click();
    clearTimeout(this.navTimer);
    if (li?.hasAttribute('aria-haspopup')) {
      if (open && open !== li) { this.hoverOpened = null; toggle(open); }
      if (li.getAttribute('aria-expanded') === 'false') { this.hoverOpened = li; this.navTimer = setTimeout(() => toggle(li), 70); }
    } else if (open && open !== li) {
      this.navTimer = setTimeout(() => { this.hoverOpened = null; if (open.getAttribute('aria-expanded') === 'true') toggle(open); }, 220);
    }
  }
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName ?? '');
    if (e.ctrlKey && e.key === 'F2') { e.preventDefault(); this.toggleA11yByKey(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.search.open.update((o) => !o); }
    else if (e.key === '/' && !typing) { e.preventDefault(); this.search.show(); }
  }



  a11y = inject(A11yService);
  a11yOpen = signal(false);
  a11yView = signal<'grid' | 'list'>('grid');
  a11yOpenSections = signal<Record<string, boolean>>({ profile: false, color: true, content: true, orient: true });
  readonly profiles = A11Y_PROFILES;
  private a11yTrigger: HTMLElement | null = null;

  openA11y(e: Event) {
    e.stopPropagation();
    if (this.a11yOpen()) { this.closeA11y(); return; }
    this.a11yTrigger = e.currentTarget as HTMLElement;
    this.themeOpen.set(false);
    this.a11yOpen.set(true);
    setTimeout(() => document.querySelector<HTMLElement>('.ax-close')?.focus(), 60);
  }
  closeA11y() { this.a11yOpen.set(false); this.a11yTrigger?.focus(); }
  toggleA11yByKey() {
    if (this.a11yOpen()) { this.closeA11y(); return; }
    this.a11yTrigger = document.activeElement as HTMLElement | null;
    this.themeOpen.set(false);
    this.a11yOpen.set(true);
    setTimeout(() => document.querySelector<HTMLElement>('.ax-close')?.focus(), 60);
  }
  toggleSection(k: string) { this.a11yOpenSections.update((s) => ({ ...s, [k]: !s[k] })); }
  activeProfile = signal<string | null>(null);
  applyProfile(p: A11yProfile) {
    if (this.activeProfile() === p.key) { this.resetA11y(); return; } // tapping the active profile turns it off
    this.a11y.applyProfile(p); this.setFontScale(p.text ?? 100); this.activeProfile.set(p.key);
  }
  resetA11y() { this.activeProfile.set(null); this.a11y.reset(); this.setFontScale(100); if (this.dark()) this.toggleDark(false); }

  /** 0 = normal, 1 = 115 %, 2 = 130 % */
  textLevel = computed(() => (this.fontScale() >= 130 ? 2 : this.fontScale() >= 115 ? 1 : 0));
  cycleText() { this.setFontScale([115, 130, 100][this.textLevel()]); }

  private tile(label: string, icon: string, on: () => boolean, run: () => void, level?: () => number): A11yTile { return { label, icon, on, run, level }; }
  readonly colorTiles: A11yTile[] = [
    this.tile('Monochrome', 'svg:drop-dots', () => this.a11y.prefs().gray, () => this.a11y.toggle('gray')),
    this.tile('High Saturate', 'svg:drop-half', () => this.a11y.prefs().satHigh, () => this.a11y.setSaturation('satHigh')),
    this.tile('Low Saturate', 'svg:drop-fade', () => this.a11y.prefs().satLow, () => this.a11y.setSaturation('satLow')),
    this.tile('Dark Mode', 'pi-moon', () => this.dark(), () => this.toggleDark(!this.dark())),
    this.tile('Invert Color', 'pi-sync', () => this.a11y.prefs().invert, () => this.a11y.toggle('invert')),
    this.tile('High Contrast', 'pi-eye', () => this.a11y.prefs().contrast, () => this.a11y.toggle('contrast')),
  ];
  readonly contentTiles: A11yTile[] = [
    this.tile('Bigger Text', 'A+', () => this.textLevel() > 0, () => this.cycleText(), () => this.textLevel()),
    this.tile('Line Height', 'svg:lineh', () => this.a11y.prefs().lineh > 0, () => this.a11y.cycle('lineh'), () => this.a11y.prefs().lineh),
    this.tile('Text Spacing', 'svg:spacing', () => this.a11y.prefs().spacing > 0, () => this.a11y.cycle('spacing'), () => this.a11y.prefs().spacing),
    this.tile('Highlight Links', 'pi-link', () => this.a11y.prefs().links, () => this.a11y.toggle('links')),
    this.tile('Dyslexia Friendly', 'Df', () => this.a11y.prefs().dyslexia, () => this.a11y.toggle('dyslexia')),
    { ...this.tile('Text Magnify', 'pi-search-plus', () => this.a11y.prefs().magnify, () => this.a11y.toggle('magnify')), badge: true },
    this.tile('Cursor Size', 'pi-arrow-up-left', () => this.a11y.prefs().cursor > 0, () => this.a11y.cycle('cursor'), () => Math.min(2, this.a11y.prefs().cursor)),
  ];
  readonly orientTiles: A11yTile[] = [
    this.tile('Screen Reader', 'pi-volume-up', () => this.a11y.prefs().reader, () => this.a11y.toggle('reader')),
    this.tile('Voice Support', 'pi-microphone', () => this.a11y.prefs().voice, () => this.a11y.toggle('voice')),
    this.tile('Pause Animation', 'pi-pause', () => this.a11y.prefs().motion, () => this.a11y.toggle('motion')),
    this.tile('Hide Images', 'pi-image', () => this.a11y.prefs().images, () => this.a11y.toggle('images')),
    this.tile('Focus Mode', 'pi-bullseye', () => this.a11y.prefs().focusMode, () => this.a11y.toggle('focusMode')),
    this.tile('Reading Guides', 'pi-align-justify', () => this.a11y.prefs().guide, () => this.a11y.toggle('guide')),
    this.tile('Focus Ring', 'pi-stop', () => this.a11y.prefs().focus, () => this.a11y.toggle('focus')),
    this.tile('Light Mode', 'pi-wifi', () => this.a11y.prefs().lite, () => this.a11y.toggle('lite')),
  ];

  setLanguage(code: string) { document.documentElement.lang = code; }
  /* Each theme = main (buttons, links, highlights) + ink (its surface colour: banners, top bar, footer, dark panels,
     dark-mode tint). Every surface in the CSS is derived from these two, so picking a theme recolours the whole site. */
  readonly themes = [
    { key: 'navy', name: 'Govt Blue', main: '#1e40af', a2: '#2563eb', a3: '#bfdbfe', ink: '#0b2a66' },
    { key: 'jade', name: 'Teal Green', main: '#0f766e', a2: '#059669', a3: '#99f6e4', ink: '#073f3b' },
    { key: 'indigo', name: 'Indigo', main: '#4f46e5', a2: '#8b5cf6', a3: '#c4b5fd', ink: '#272270' },
    { key: 'sky', name: 'Sky', main: '#0284c7', a2: '#38bdf8', a3: '#bae6fd', ink: '#0b3a5c' },
    { key: 'emerald', name: 'Emerald', main: '#059669', a2: '#34d399', a3: '#a7f3d0', ink: '#064e3b' },
    { key: 'rose', name: 'Rose', main: '#e11d48', a2: '#fb7185', a3: '#fecdd3', ink: '#5c0d24' },
    { key: 'amber', name: 'Amber', main: '#d97706', a2: '#fbbf24', a3: '#fde68a', ink: '#5a2a06' },
    { key: 'tricolour', name: 'Tricolour', main: '#06038d', a2: '#ff9933', a3: '#ffdcb8', ink: '#0b1f5c', dot: 'linear-gradient(135deg,#ff9933 0 34%,#fff 34% 66%,#138808 66%)' },
    // default: the Digital Gujarat 2.0 Figma colours — orange actions on teal surfaces
    { key: 'saffron', name: 'Teal Saffron', main: '#d97706', a2: '#ff9933', a3: '#ffe0c2', ink: '#084d50', ink2: '#0a6266', dot: 'linear-gradient(135deg, #084d50, #d97706)' },
    { key: 'saffron-plain', name: 'Saffron', main: '#d4570b', a2: '#ff9933', a3: '#ffe3c4', ink: '#3b1a06', ink2: '#7a3510' },
    { key: 'indiagreen', name: 'India Green', main: '#138808', a2: '#22a516', a3: '#c8f7bf', ink: '#0d3f0a' },
    { key: 'chakra', name: 'Chakra Blue', main: '#06038d', a2: '#3f3fd1', a3: '#c9c9ff', ink: '#0b0a52' },
  ] as { key: string; name: string; main: string; a2: string; a3: string; ink: string; ink2?: string; dot?: string }[];
  /** Default theme for visitors who haven't picked one: Teal Saffron. */
  readonly defaultTheme = this.themes.find((x) => x.key === 'saffron') ?? this.themes[0];
  /* storage key, bumped whenever the default changes so every visitor starts on it once: 'dg-theme' and 'dg-theme-v2'
     held picks made before Teal Saffron became the full-site theme. v3 = everyone starts on Teal Saffron; a theme they
     pick afterwards is remembered. Keep in sync with the pre-paint script in index.html. */
  private static readonly THEME_KEY = 'dg-theme-v3';
  theme = signal(this.defaultTheme);
  themeOpen = signal(false);

  setTheme(t: (typeof this.themes)[number]) {
    this.theme.set(t);
    const s = document.documentElement.style;
    const n = parseInt(t.main.slice(1), 16);
    s.setProperty('--brand', t.main);
    s.setProperty('--brand-rgb', `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`);
    s.setProperty('--brand-2', t.a2);
    s.setProperty('--brand-3', t.a3);
    // lets CSS give a theme extra touches that must respect dark mode (e.g. Saffron's brown text, see official.scss)
    document.documentElement.setAttribute('data-dg-theme', t.key);
    // surfaces: every theme brings its own ink; the CSS derives glows, hovers and the dark-mode palette from it
    const k = parseInt(t.ink.slice(1), 16);
    s.setProperty('--ink', t.ink);
    s.setProperty('--ink-2', t.ink2 ?? `color-mix(in srgb, ${t.ink} 78%, #fff)`);
    s.setProperty('--ink-rgb', `${(k >> 16) & 255}, ${(k >> 8) & 255}, ${k & 255}`);
    s.setProperty('--dg-hero-bg', t.ink);
    try { localStorage.setItem(App.THEME_KEY, t.key); } catch { /* storage unavailable */ }
  }

  @HostListener('document:click')
  closeThemePicker() { if (this.themeOpen()) this.themeOpen.set(false); }

  @HostListener('document:keydown.escape')
  escThemePicker() { this.themeOpen.set(false); if (this.a11yOpen()) this.closeA11y(); }
  dark = signal(false);
  fontScale = signal(100);

  languages = [
    { label: 'English', code: 'en' },
    { label: 'ગુજરાતી', code: 'gu' },
  ];
  language = this.languages[0];

  toggleDark(on: boolean) {
    this.dark.set(on);
    document.documentElement.classList.toggle('app-dark', on);
  }

  setFontScale(v: number) { this.fontScale.set(v); document.documentElement.style.fontSize = v + '%'; }

  setFont(delta: number) {
    const v = delta === 0 ? 100 : Math.min(130, Math.max(85, this.fontScale() + delta));
    this.fontScale.set(v);
    document.documentElement.style.fontSize = v + '%';
  }

  /** Jump past the banner/breadcrumb to the first real content block of the current page. */
  skipToMain(e: Event) {
    e.preventDefault();
    const el = document.querySelector<HTMLElement>('[data-main]');
    if (!el) return;
    // Land the main section right under the sticky top bar + navigation, so the whole banner is out of view.
    // (scrollIntoView added the page's scroll-padding AND the section's scroll-margin, stopping ~250px short and
    // leaving the bottom of the banner on screen.)
    const bars = () => [document.querySelector('.site-top'), document.querySelector('.site-header .header-inner')]
      .reduce((m, b) => Math.max(m, b ? b.getBoundingClientRect().bottom : 0), 0);
    const gap = () => el.getBoundingClientRect().top - bars(); // > 0: banner still showing; < 0: section under the header
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-nomotion');
    window.scrollTo({ top: window.scrollY + gap(), behavior: reduce ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
    // The navigation bar changes height when it switches to its scrolled style (an 0.8s morph, and the amount depends
    // on the screen width), so the first measurement can be off by a few pixels on laptops. Once scrolling and the
    // morph have settled, measure again and snap the section exactly under the bars.
    let tries = 0;
    const settle = () => {
      const d = gap();
      if (Math.abs(d) > 1 && tries++ < 3) { window.scrollBy({ top: d, behavior: 'auto' }); setTimeout(settle, 120); }
    };
    setTimeout(settle, reduce ? 50 : 900);
  }
}
