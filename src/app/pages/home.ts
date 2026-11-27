import { afterNextRender, Component, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SearchService } from '../shared/search.service';
import { A, SITE } from '../shared/site';
import { A11yService } from '../shared/a11y.service';

/** Design assets exported from the Figma home page (node 213:1958). */
const H = A + 'img/home/';

type MediaKind = 'photo' | 'video';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  imports: [FormsModule, RouterLink],
  templateUrl: './home.html',
})
export class HomePage {
  readonly site = SITE;
  readonly h = H;
  searchSvc = inject(SearchService);
  a11y = inject(A11yService);

  openSearch(q = '') { this.searchSvc.show(q); }
  heroQuery = '';
  heroSearch(e: Event) { e.preventDefault(); this.openSearch(this.heroQuery.trim()); }

  /* ---- banner slides: arched photo + two badges on the left, headline + search on the right ---- */
  slides = [
    {
      kicker: 'Service that work around you',
      title: 'Your Gujarat.', title2: 'One digital doorway.',
      sub: 'Discover government services, apply online, and track every request—simply, securely, and in your language.',
      img: H + 'hero-somnath.png', alt: 'Somnath Temple at sunset', pos: '50% 40%',
      /* Figma frames this photo at 1045×697 inside the 468×466 arch, offset (-55, -65) */
      crop: { w: '223.29%', h: '149.57%', l: '-11.75%', t: '-13.95%' } as { w: string; h: string; l: string; t: string } | null,
      badgeTop: { b: 'Safe & Secure', small: 'Verified Government Portal' },
      badgeBottom: { b: '2.4 Cr +', small: 'Application processed' },
    },
    {
      kicker: 'Service that work around you',
      title: 'Viksit Gujarat.', title2: 'Digital by default.',
      sub: 'Certificates, scholarships and welfare schemes for every citizen—apply from anywhere and get them delivered digitally.',
      img: A + 'img/slider/hero-statue-of-unity.jpg', alt: 'Statue of Unity', pos: '50% 30%', crop: null, /* Unsplash License: photo-1631983097767 */
      badgeTop: { b: 'Safe & Secure', small: 'Verified Government Portal' },
      badgeBottom: { b: '800 +', small: 'Services online' },
    },
  ];
  popularSearches = ['Income Certificate', 'Scholarship', 'Farmer Assitance'];

  /* ---- What's new ticker ---- */
  ticker = [
    'DigiLocker integration now live — link your documents to your SPID profile',
    'RFP issued for Unified Registry Citizens Mobile App — submissions open',
  ];

  /* ---- Popular Digital Gujarat Services ---- */
  popular = [
    { title: 'Income Certificate', icon: H + 'pop-1.svg' },
    { title: 'Addition of name in ration card', icon: H + 'pop-2.svg' },
    { title: 'Widow Certificate', icon: H + 'pop-3.svg' },
    { title: 'Domicile Certificate by Birth', icon: H + 'pop-4.svg' },
    { title: 'Senior Citizen Certificate', icon: H + 'pop-5.svg' },
    { title: 'Farmer Certificate', icon: H + 'pop-6.svg' },
  ];

  /* ---- The numbers behind Gujarat's welfare revolution ---- */
  numbers = [
    { icon: H + 'stat-1.svg', value: '45 Cr+', label: 'Citizens covered', tag: 'Registered beneficiaries' },
    { icon: H + 'stat-2.svg', value: '40+', label: 'Departments integrated', tag: 'Data sources connected' },
    { icon: H + 'stat-3.svg', value: '50+', label: 'Welfare schemes', tag: 'Schemes onboarded' },
    { icon: H + 'stat-4.svg', value: '800 +', label: 'Services', tag: 'Service Onboarded' },
    { icon: H + 'stat-5.svg', value: '₹1,200 Cr+', label: 'Benefits Disbursed', tag: 'Across all schemes' },
    { icon: H + 'stat-6.svg', value: '32 L+', label: 'Grievances Resolved', tag: 'Citizen Helped' },
  ];

  /* ---- How does it work? ---- */
  steps = [
    { icon: H + 'step-1.svg', title: 'Visit Portal or App', text: 'Access Digital Gujarat via web or mobile app. Click “Get Your SPID”.' },
    { icon: H + 'step-2.svg', title: 'Aadhaar e-KYC', text: 'Authenticate using your Aadhaar number and OTP. Your identity is verified against UIDAI in real time.' },
    { icon: H + 'step-3.svg', title: 'Profile Review', text: 'Your Golden Record is automatically populated from existing government databases.' },
    { icon: H + 'step-4.svg', title: 'Receive SPID', text: 'Your unique Social Protection ID (SPID) and Family ID are issued. Download or save your digital SPID card.' },
    { icon: H + 'step-5.svg', title: 'Discover Schemes', text: 'The Eligibility Engine instantly shows all welfare schemes you qualify for. Apply with one click.' },
    { icon: H + 'step-6.svg', title: 'Track Benefits', text: 'Monitor all benefits received and raise grievances if needed, all in one dashboard.' },
  ];

  /* ---- Digital Gujarat Services ---- */
  dgServices: { title: string; icon: string; count: string; route?: string; url?: string; wide?: boolean }[] = [
    { title: 'Citizen Services', icon: H + 'dgs-1.svg', count: '12 Schemes', route: '/services/citizen' },
    { title: 'Digital SevaSetu Services', icon: H + 'dgs-2.svg', count: '12 Schemes', route: '/services/digital-sevasetu' },
    { title: 'Janseva Services', icon: H + 'dgs-3.svg', count: '12 Schemes', route: '/services/janseva' },
    { title: 'Scholarship Services', icon: H + 'dgs-4.svg', count: '12 Schemes', url: 'https://gssp.gujarat.gov.in/' },
    { title: 'Linked Services', icon: H + 'dgs-5.svg', count: '12 Schemes', route: '/services/linked', wide: true },
  ];

  /* ---- Photo & Video Gallery ---- */
  mediaFilter = signal<'all' | MediaKind>('all');
  gallery: { title: string; img: string; kind: MediaKind }[] = [
    { title: 'Adalaj Stepwell', img: H + 'gal-adalaj.png', kind: 'photo' },
    { title: 'Statue of Unity', img: H + 'gal-unity.png', kind: 'photo' },
    { title: 'Gir National Park', img: H + 'gal-gir.png', kind: 'video' },
    { title: 'Rann of Kutch', img: H + 'gal-rann.png', kind: 'photo' },
    { title: 'Somnath Temple', img: H + 'gal-somnath.png', kind: 'video' },
    { title: 'Rani Ki Vav', img: H + 'gal-ranikivav.png', kind: 'photo' },
  ];
  galleryView = computed(() => { const f = this.mediaFilter(); return f === 'all' ? this.gallery : this.gallery.filter((g) => g.kind === f); });

  /* ---- Latest Updates ---- */
  updatesTab = signal<'news' | 'circular'>('news');
  news = Array.from({ length: 4 }, () => ({
    text: 'If you are unable to access scholarship services via Digital Gujarat, you can avail of them at https://gssp.gujarat.gov.in.',
    date: '18 Apr 2026 04:00 PM', url: 'https://gssp.gujarat.gov.in/',
  }));
  circulars = Array.from({ length: 4 }, () => ({
    text: 'Circular regarding online submission of applications for welfare schemes through Digital Gujarat portal.',
    date: '18 Apr 2026 04:00 PM', url: SITE,
  }));
  updates = computed(() => (this.updatesTab() === 'news' ? this.news : this.circulars));
  promoCards = [
    { tone: 'green', icon: H + 'upd-1.svg', title: 'Government Services', text: 'Explore 50+ like Agriculture, Welfare, Education, Health and more.', route: '/services/citizen' },
    { tone: 'orange', icon: H + 'upd-2.svg', title: 'Government Services', text: 'Browse live tenders, bids and empanelment notices from departments.', route: '/services/citizen' },
  ];

  /* ---- partner logos (marquee); crop values come from the Figma image fills ---- */
  logos = [
    { name: 'GIGW', img: H + 'logo-1.png', w: 180, h: 60, crop: { w: '116.81%', h: '189.33%', l: '-9.73%', t: '-21.33%' }, url: 'https://guidelines.india.gov.in/' },
    { name: 'ITU WTSA New Delhi 2024', img: H + 'logo-2.png', w: 224, h: 70, url: 'https://www.delhiwtsa24.in/' },
    { name: 'Gujarat State Portal', img: H + 'logo-3.png', w: 224, h: 70, crop: { w: '111.39%', h: '191.89%', l: '-5.91%', t: '-29.73%' }, url: 'https://gujaratindia.gov.in/' },
    { name: 'India.gov.in', img: H + 'logo-4.png', w: 246, h: 70, crop: { w: '100%', h: '175.44%', l: '0', t: '-28.07%' }, url: 'https://india.gov.in/' },
    { name: 'Gujarat Tourism', img: H + 'logo-5.png', w: 66, h: 70, crop: { w: '114.89%', h: '109.01%', l: '-8.44%', t: '-3.77%' }, url: 'https://www.gujarattourism.com/' },
    { name: 'Statue of Unity', img: H + 'logo-6.png', w: 121, h: 70, crop: { w: '111.98%', h: '145.07%', l: '-5.15%', t: '-23.98%' }, url: 'https://www.soutickets.in/' },
    { name: 'Swachh Bharat Mission', img: H + 'logo-7.png', w: 163, h: 70, crop: { w: '100%', h: '232.77%', l: '0', t: '-63.45%' }, url: 'https://swachhbharatmission.ddws.gov.in/' },
    { name: 'SWAGAT', img: H + 'logo-8.png', w: 104, h: 100, crop: { w: '231.01%', h: '135.63%', l: '-63.57%', t: '-20.24%' }, url: 'https://swagat.gujarat.gov.in/' },
    { name: 'GIGW 3.0', img: H + 'logo-9.svg', w: 266, h: 100, url: 'https://guidelines.india.gov.in/new-features-of-gigw-3-0/' },
  ];

  /* ---- hero: 3D glass-slab slider (unchanged behaviour). The slides are doubled into a ring of 4 so the wrap-around
     always happens off-stage; copies are aria-hidden + inert, so assistive tech and Tab only ever see the real slides. ---- */
  readonly heroMs = 5000;
  heroRing = [...this.slides, ...this.slides];
  heroIdx = signal(0);
  heroPaused = signal(false);
  heroAuto = computed(() => this.heroReady() && !this.a11y.motionOff() && !this.heroPaused());
  private heroTimer = effect((onCleanup) => {
    this.heroIdx();
    if (!this.heroAuto()) return;
    const t = setTimeout(() => this.heroGo(1), this.heroMs);
    onCleanup(() => clearTimeout(t));
  });
  private heroX = 0;
  heroOffset(i: number) {
    const m = this.heroRing.length;
    let o = (((i - this.heroIdx()) % m) + m) % m;
    if (o > m / 2) o -= m;
    return o;
  }
  heroGo(d: number) { const m = this.heroRing.length; this.heroIdx.update((v) => (((v + d) % m) + m) % m); }
  heroDot(n: number) { const cur = this.heroIdx() % this.slides.length; this.heroGo(n - cur); }
  /* slabs must not glide into place on first paint: enable their transitions only once the page loader has gone */
  heroReady = signal(false);
  private heroReadyInit = afterNextRender(() => {
    const el = document.documentElement;
    // Two frames normally; the timer covers tabs that aren't painting (background/hidden), where rAF never fires
    // and autoplay used to stay off for good.
    const ready = () => this.heroReady.set(true);
    const go = () => {
      if (el.classList.contains('al-loading')) return;
      obs.disconnect();
      requestAnimationFrame(() => requestAnimationFrame(ready));
      setTimeout(ready, 120);
    };
    const obs = new MutationObserver(go);
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    go();
  });
  /* Autoplay keeps running under the mouse. It pauses while a KEYBOARD user is inside (only :focus-visible counts) or
     while someone is typing in the banner search box, and stays off when motion is turned off in the accessibility panel. */
  private heroKbFocus = false;
  private heroSyncPause() { this.heroPaused.set(this.heroKbFocus); }
  heroEnter(_e: PointerEvent) {}
  heroLeave() { this.heroSwipe = false; }
  heroFocusIn(e: FocusEvent) {
    const t = e.target as Element | null;
    this.heroKbFocus = (t?.matches?.(':focus-visible') ?? false) || t?.tagName === 'INPUT';
    this.heroSyncPause();
  }
  heroFocusOut(e: FocusEvent) {
    const next = e.relatedTarget as Node | null;
    if (!next || !(e.currentTarget as Element).contains(next)) { this.heroKbFocus = false; this.heroSyncPause(); }
  }
  heroDown(e: PointerEvent) {
    if ((e.target as Element | null)?.closest?.('input, button, a')) return; // let taps on the search box / chips through
    this.heroX = e.clientX; this.heroSwipe = true;
  }
  heroUp(e: PointerEvent) {
    if (!this.heroSwipe) return; // pointer went down outside the stage
    this.heroSwipe = false;
    const dx = e.clientX - this.heroX;
    if (Math.abs(dx) > 50) this.heroGo(dx < 0 ? 1 : -1);
  }
  private heroSwipe = false;
  heroKey(e: KeyboardEvent) {
    if ((e.target as Element | null)?.tagName === 'INPUT') return; // arrow keys move the caret in the search box
    if (e.key === 'ArrowRight') { this.heroGo(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { this.heroGo(-1); e.preventDefault(); }
  }

  /* ---- gallery lightbox ---- */
  private lastFocus: HTMLElement | null = null;
  viewer = signal<{ title: string; img: string } | null>(null);
  zoom = signal(1);
  rot = signal(0);
  openViewer(g: { title: string; img: string }) {
    this.lastFocus = document.activeElement as HTMLElement | null;
    this.zoom.set(1); this.rot.set(0); this.viewer.set(g);
    setTimeout(() => document.querySelector<HTMLElement>('.lightbox-tools button:last-child')?.focus(), 30);
  }
  closeViewer() { this.viewer.set(null); this.lastFocus?.focus(); }
  zoomBy(d: number) { this.zoom.update((z) => Math.min(4, Math.max(0.3, +(z + d).toFixed(2)))); }
  rotateBy(d: number) { this.rot.update((r) => r + d); }
}
