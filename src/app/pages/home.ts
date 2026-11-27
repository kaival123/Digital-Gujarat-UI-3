import { afterNextRender, Component, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import { Counter, Reveal } from '../shared/motion';
import { GlimpseSlider } from '../shared/glimpse-slider';
import { SearchService } from '../shared/search.service';
import citizenData from '../data/citizen.json';
import sugamData from '../data/sugam.json';
import dssData from '../data/dss.json';
import jansevaData from '../data/janseva.json';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Carousel } from 'primeng/carousel';
import { DatePicker } from 'primeng/datepicker';
import { Image } from 'primeng/image';
import { Tag } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { A, SITE } from '../shared/site';
import { A11yService } from '../shared/a11y.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  imports: [FormsModule, RouterLink, ButtonDirective, Carousel, DatePicker, Image, Tag, Tooltip, Reveal, Counter, GlimpseSlider, Accordion, AccordionPanel, AccordionHeader, AccordionContent],
  templateUrl: './home.html',
})
export class HomePage {
  readonly site = SITE;
  searchSvc = inject(SearchService);

  private pick = (items: { title: string; img: string }[], n = 8) => items.slice(0, n).map((i) => ({ title: i.title, img: A + 'site/' + encodeURI(i.img) }));

  explorer = [
    { key: 'citizen', label: 'Citizen', icon: 'pi pi-users', route: '/services/citizen', total: citizenData.length, items: this.pick(citizenData), blurb: 'Certificates, passes and everyday documents.' },
    { key: 'sugam', label: 'Sugam', icon: 'pi pi-bolt', route: '/sugam-digital-gujarat', total: sugamData.length, items: this.pick(sugamData), blurb: 'Caste, income and ration card services — fully online.' },
    { key: 'dss', label: 'Digital SevaSetu', icon: 'pi pi-briefcase', route: '/services/digital-sevasetu', total: dssData.length, items: this.pick(dssData), blurb: 'Department schemes and subsidies.' },
    { key: 'janseva', label: 'Janseva', icon: 'pi pi-building', route: '/services/janseva', total: jansevaData.length, items: this.pick(jansevaData), blurb: 'Affidavits and services from Janseva Kendras.' },
  ];

  faqs = [
    { q: 'How can I apply for an Income Certificate online?', a: ["Log in with Citizen Login, search for 'Income Certificate', fill in the application form, upload the required documents and submit. You can track the status under 'My Applications'."] },
    { q: 'What documents are required for a Domicile Certificate?', a: ['Proof of identity, proof of residence in Gujarat (such as a ration card, electricity bill or property document) and a birth certificate or school leaving certificate are generally required.'] },
    { q: 'How can I track the status of my application?', a: ["After logging in, open 'My Applications' to see the real-time status of every application and download the certificate once it is approved."] },
    { q: 'Is registration mandatory to apply for services?', a: ['Yes. A one-time registration through Citizen Login is required so that your applications, documents and certificates are linked to your account.'] },
  ];
  cat = signal('citizen');
  catData = computed(() => this.explorer.find((c) => c.key === this.cat()) ?? this.explorer[0]);

  facts = [
    { value: 'Apply Online', label: 'from Anywhere' },
    { value: 'Track Application', label: 'in Real-time' },
    { value: 'Get Certificates', label: 'Digitally' },
  ];

  /* Browse Services by Department */
  quick = [
    { icon: 'pi pi-building', label: 'Revenue', sub: 'Land, property, certificates', route: '/services/citizen' },
    { icon: 'pi pi-book', label: 'Education', sub: 'Scholarships, admissions', route: '/scholarships' },
    { icon: 'pi pi-shopping-cart', label: 'Food & Civil Supplies', sub: 'Ration card, NFSA, PDS', route: '/sugam-digital-gujarat' },
    { icon: 'pi pi-sun', label: 'Agriculture', sub: 'Farmer schemes, subsidies', route: '/services/digital-sevasetu' },
    { icon: 'pi pi-heart', label: 'Health & Family Welfare', sub: 'Health schemes, registration', route: '/services/digital-sevasetu' },
    { icon: 'pi pi-users', label: 'Social Justice', sub: 'Welfare for SC/ST/OBC', route: '/services/digital-sevasetu' },
    { icon: 'pi pi-briefcase', label: 'Labour & Employment', sub: 'Labour services, registrations', route: '/services/digital-sevasetu' },
    { icon: 'pi pi-user', label: 'Women & Child', sub: 'Empowerment schemes', route: '/services/digital-sevasetu' },
    { icon: 'pi pi-home', label: 'Urban Development', sub: 'Municipal services, permissions', route: '/services/linked' },
    { icon: 'pi pi-th-large', label: 'More Departments', sub: 'Explore all departments', route: '/services/citizen' },
  ];

  /* Key Online Services */
  keyServices = ['Birth Certificate', 'Death Certificate', 'Income Certificate', 'Domicile Certificate', 'Caste Certificate'];

  /* Highlights */
  ticker = [
    'Applications for Post Matric Scholarship are now open.',
    'Digital Gujarat – Enhanced citizen experience with new services.',
    'Income Certificate service has been updated with faster approval.',
  ];

  /* Our Impact */
  stats = [
    { icon: 'pi pi-th-large', value: 500, decimals: 0, suffix: '+', label: 'Government Services' },
    { icon: 'pi pi-file-edit', value: 5.2, decimals: 1, suffix: ' Cr+', label: 'Applications Processed' },
    { icon: 'pi pi-verified', value: 4.8, decimals: 1, suffix: ' Cr+', label: 'Certificates Issued' },
    { icon: 'pi pi-map-marker', value: 100, decimals: 0, suffix: '%', label: 'District Coverage' },
  ];

  /* Success Stories */
  story = { quote: 'I got my Income Certificate online in just 2 days. The process was simple and completely paperless.', name: 'Kinjal Patel', place: 'Ahmedabad' };

  /* How It Works */
  steps = [
    { icon: 'pi pi-search', title: 'Search Service', text: 'Find the service you need.' },
    { icon: 'pi pi-pen-to-square', title: 'Apply Online', text: 'Fill the application form.' },
    { icon: 'pi pi-upload', title: 'Upload Documents', text: 'Submit required documents.' },
    { icon: 'pi pi-download', title: 'Track & Download', text: 'Check status and download certificate.' },
  ];

  openSearch(q = '') { this.searchSvc.show(q); }
  query = '';
  calendarDate: Date = new Date();
  today = (() => {
    const d = new Date();
    return { day: d.getDate(), weekday: d.toLocaleDateString('en-IN', { weekday: 'long' }), month: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) };
  })();

  slides = [
    {
      title: 'One Platform for', accent: 'Citizen Services', rest: 'of Gujarat',
      sub: 'Apply online from anywhere, track your application in real-time and get certificates digitally.',
      img: A + 'img/slider/hero-citizen-tablet.jpg', shape: 'rounded', /* Unsplash License: photo-1656236607879 */
      cards: [
        { icon: 'pi pi-book', b: 'Students', small: 'Scholarships' },
        { icon: 'pi pi-sun', b: 'Farmers', small: 'Agri support' },
        { icon: 'pi pi-heart', b: 'Women', small: 'Welfare schemes' },
      ],
    },
    {
      title: 'Viksit Gujarat', accent: 'through Digital Services', rest: '',
      sub: 'Citizen-centric services for all sections of society — students, farmers and women.',
      img: A + 'img/slider/hero-statue-of-unity.jpg', shape: 'circle', /* Unsplash License: photo-1631983097767 */
      cards: [
        { icon: 'pi pi-eye', b: 'Transparent', small: 'Governance' },
        { icon: 'pi pi-users', b: 'Citizen', small: 'Empowerment' },
        { icon: 'pi pi-globe', b: 'Digital', small: 'Inclusiveness' },
      ],
    },
  ];

  services = [
    { title: 'Citizen Services', icon: A + 'img/icon/citizenservice.svg', route: '/services/citizen' },
    { title: 'Digital SevaSetu Services', icon: A + 'img/icon/digitalsevasetu.svg', route: '/services/digital-sevasetu' },
    { title: 'Janseva Services', icon: A + 'img/icon/jansevaservice.svg', route: '/services/janseva' },
    { title: 'Scholarship Services', icon: A + 'img/icon/scholarship.svg', url: 'https://gssp.gujarat.gov.in/' },
    { title: 'Linked Services', icon: A + 'img/icon/eolservice.svg', route: '/services/linked' },
  ];

  /* Popular Services */
  trending = [
    { rank: '01', title: 'Income Certificate', desc: 'Apply for Income Certificate online.', img: A + 'citizen/Income.png' },
    { rank: '02', title: 'Domicile Certificate', desc: 'Apply for Domicile Certificate (Resident Certificate).', img: A + 'citizen/Domicile.png' },
    { rank: '03', title: 'Caste Certificate', desc: 'Apply for Caste Certificate (SC / ST / SEBC / OBC).', img: A + 'site/images/JansevaService/caste_certificate.png' },
    { rank: '04', title: 'Scholarship Application', desc: 'Apply for various scholarship schemes of Gujarat.', img: A + 'site/images/JansevaService/scholarship.png' },
  ];

  /* Featured Schemes */
  perks = [
    { icon: 'pi pi-book', text: 'મુખ્યમંત્રી શિક્ષણ સહાય યોજના — Mukhyamantri Shikshan Sahay Yojana' },
    { icon: 'pi pi-sun', text: 'મુખ્યમંત્રી કૃષિ સહાય યોજના — Mukhyamantri Krushi Sahay Yojana' },
    { icon: 'pi pi-heart', text: 'મહિલા સશક્તિકરણ યોજના — Women Empowerment Schemes' },
    { icon: 'pi pi-users', text: 'Services for everyone — students, farmers and women' },
  ];



  a11y = inject(A11yService);
  /* ---- hero: 3D glass-slab slider. The slides are doubled into a ring of 4 so the wrap-around always happens
     off-stage; copies are aria-hidden + inert, so assistive tech and Tab only ever see the real slides. ---- */
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
  /* Autoplay keeps running under the mouse: the banner fills the first screen, so pausing on hover meant it almost
     never moved. It still pauses while a KEYBOARD user is inside (a mouse click on an arrow/dot also moves focus
     inside, so only :focus-visible counts), and stays off when the user turns motion off in the accessibility panel. */
  private heroKbFocus = false;
  private heroSyncPause() { this.heroPaused.set(this.heroKbFocus); }
  heroEnter(_e: PointerEvent) {}
  heroLeave() { this.heroSwipe = false; }
  heroFocusIn(e: FocusEvent) { this.heroKbFocus = (e.target as Element | null)?.matches?.(':focus-visible') ?? false; this.heroSyncPause(); }
  heroFocusOut(e: FocusEvent) {
    const next = e.relatedTarget as Node | null;
    if (!next || !(e.currentTarget as Element).contains(next)) { this.heroKbFocus = false; this.heroSyncPause(); }
  }
  heroDown(e: PointerEvent) { this.heroX = e.clientX; this.heroSwipe = true; }
  heroUp(e: PointerEvent) {
    if (!this.heroSwipe) return; // pointer went down outside the stage
    this.heroSwipe = false;
    const dx = e.clientX - this.heroX;
    if (Math.abs(dx) > 50) this.heroGo(dx < 0 ? 1 : -1);
  }
  private heroSwipe = false;
  heroKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') { this.heroGo(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { this.heroGo(-1); e.preventDefault(); }
  }
  private lastFocus: HTMLElement | null = null;

  viewer = signal<{ title: string; img: string } | null>(null);
  zoom = signal(1);
  rot = signal(0);
  openViewer(g: { title: string; img: string }) {
    this.lastFocus = document.activeElement as HTMLElement | null;
    this.zoom.set(1); this.rot.set(0); this.viewer.set(g);
    setTimeout(() => document.querySelector<HTMLElement>(".lightbox-tools button:last-child")?.focus(), 30);
  }
  closeViewer() { this.viewer.set(null); this.lastFocus?.focus(); }
  zoomBy(d: number) { this.zoom.update((z) => Math.min(4, Math.max(0.3, +(z + d).toFixed(2)))); }
  rotateBy(d: number) { this.rot.update((r) => r + d); }

  glimpses = [
    { title: 'Great Ran Of Kutch', img: A + 'img/GlimpsesSlider/rann-of-kutch-new.jpg' }, // Unsplash License: photo-1669015881702
    { title: 'Statue Of Unity', img: A + 'img/GlimpsesSlider/statue-of-unity-new.jpg' }, // Unsplash License: photo-1782848775396
    { title: 'Kite Festival', img: A + 'img/GlimpsesSlider/kite-festival-new.jpg' }, // Unsplash License: photo-1558641930
    { title: 'Vibrant Gujarat', img: A + 'img/GlimpsesSlider/vibrant-gujarat-new.jpg' }, // Unsplash License: photo-1790030838058
  ];

  partners = [
    { name: 'ITU WTSA New Delhi 2024', img: A + 'img/partner/img1.png', url: 'https://www.delhiwtsa24.in/' },
    { name: 'Gujarat India', img: A + 'img/partner/img2.png', url: 'https://gujaratindia.gov.in/index' },
    { name: 'India.gov.in', img: A + 'img/partner/img3.png', url: 'https://india.gov.in/' },
    { name: 'Gujarat Tourism', img: A + 'img/partner/img4.png', url: 'https://www.gujarattourism.com/' },
    { name: 'Statue of Unity Tickets', img: A + 'img/partner/img5.png', url: 'https://www.soutickets.in/#/dashboard' },
    { name: 'Swachh Bharat Mission', img: A + 'img/partner/img6.png', url: 'https://swachhbharatmission.ddws.gov.in/' },
    { name: 'SWAGAT', img: A + 'img/partner/img7.png', url: 'https://swagat.gujarat.gov.in/' },
    { name: 'GIGW 3.0', img: A + 'img/partner/img8.png', url: 'https://guidelines.india.gov.in/new-features-of-gigw-3-0/' },
    { name: 'GIGW 3.0 Guidelines', img: A + 'img/partner/img9.png', url: 'https://guidelines.india.gov.in/new-features-of-gigw-3-0/' },
  ];

  partnersRev = this.partners.slice().reverse();

  scrollTo(e: Event) {
    e.preventDefault();
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  }

  search() {
    const q = this.query.trim();
    window.open(SITE + 'AdvanceSearch.aspx' + (q ? '?q=' + encodeURIComponent(q) : ''), '_blank', 'noopener');
  }
}
