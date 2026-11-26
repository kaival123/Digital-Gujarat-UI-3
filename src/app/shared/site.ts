import { signal } from '@angular/core';
import { MenuItem } from 'primeng/api';

/** Tab shown on the Latest Update page; the header dropdown sets it directly (works even when already on that page). */
export const LATEST_TAB = signal<'news' | 'circular'>('news');

export const SITE = 'https://www.digitalgujarat.gov.in/';
export const A = 'assets/';
/** Images mirrored from the old site live under assets/site/. */
export const IMG = A + 'site/';

export interface SiteLink { label: string; route?: string; url?: string; }

export const NAV: MenuItem[] = [
  { label: 'Home', icon: 'pi pi-home', routerLink: '/', routerLinkActiveOptions: { exact: true } },
  { label: 'About Us', routerLink: '/about-us' },
  {
    label: 'Schemes',
    items: [
      { label: 'Government Schemes (Mari Yojana)', icon: 'pi pi-star', url: 'https://mariyojana.gujarat.gov.in/', target: '_blank' },
      { label: 'Department Schemes & Subsidies', icon: 'pi pi-briefcase', routerLink: '/services/digital-sevasetu' },
      { label: 'Scholarship Schemes', icon: 'pi pi-graduation-cap', routerLink: '/scholarships' },
      { label: 'Agriculture Schemes (iKhedut)', icon: 'pi pi-sun', url: 'https://ikhedut.gujarat.gov.in/', target: '_blank' },
      { label: 'Find Central Schemes (myScheme)', icon: 'pi pi-search', url: 'https://www.myscheme.gov.in/', target: '_blank' },
    ],
  },
  {
    label: 'Services',
    items: [
      { label: 'Citizen Services', icon: 'pi pi-users', routerLink: '/services/citizen' },
      { label: 'Sugam Digital Gujarat', icon: 'pi pi-bolt', routerLink: '/sugam-digital-gujarat' },
      { label: 'Certificates', icon: 'pi pi-verified', routerLink: '/services/certificates' },
      { label: 'Digital SevaSetu Services', icon: 'pi pi-briefcase', routerLink: '/services/digital-sevasetu' },
      { label: 'Janseva Services', icon: 'pi pi-building', routerLink: '/services/janseva' },
      { label: 'Scholarship Services', icon: 'pi pi-graduation-cap', url: 'https://gssp.gujarat.gov.in/' },
      { label: 'Linked Services', icon: 'pi pi-link', routerLink: '/services/linked' },
    ],
  },
  { label: 'Policy', url: 'https://gujaratindia.gov.in/PolicyDetails' },
  {
    label: 'Latest Update',
    items: [
      { label: 'News & Updates', icon: 'pi pi-megaphone', routerLink: '/latest-update', queryParams: { tab: 'news' }, command: () => LATEST_TAB.set('news') },
      { label: 'Circular / Notification', icon: 'pi pi-file', routerLink: '/latest-update', queryParams: { tab: 'circular' }, command: () => LATEST_TAB.set('circular') },
      // external portals (same links as the page's "Related portals" rail); they open in a new tab like there
      { label: 'Government Scheme / Service', icon: 'pi pi-briefcase', url: 'https://mariyojana.gujarat.gov.in/', target: '_blank' },
      { label: 'Government Tenders', icon: 'pi pi-file-edit', url: 'https://gil.gujarat.gov.in/Tenders', target: '_blank' },
    ],
  },
];

export const LOGIN_MENU: MenuItem[] = [
  { label: 'Citizen Login', icon: 'pi pi-user', routerLink: '/citizen-login' },
  { label: 'Office Login', icon: 'pi pi-building', url: 'https://sso.gujarat.gov.in/SSO.aspx?Rurl=https://www.digitalgujarat.gov.in/OfficeApp/frmMain.aspx' },
  { label: 'School / Institution Login', icon: 'pi pi-graduation-cap', url: 'https://gssp.gujarat.gov.in/LoginApp/SJEDLogin.aspx' },
];

export const QUICK_LINKS: SiteLink[] = [
  { label: 'Gujarat At A Glance', url: 'https://gujaratindia.gov.in/Home/GujaratAtAGlance' },
  { label: 'Gujarat History', url: 'https://gujaratindia.gov.in/Index' },
  { label: 'Getting to Gujarat', url: 'https://gujaratindia.gov.in/Home/Getting-to-Gujarat' },
  { label: 'FAQ', route: '/faq' },
  { label: 'Site Map', route: '/sitemap' },
  { label: 'Feedback', route: '/feedback' },
  { label: 'Write to Grievance (Swagat)', url: 'https://swagat.gujarat.gov.in/' },
  { label: 'Collectors', url: 'https://revenuedepartment.gujarat.gov.in/collectorate' },
];

export const IMPORTANT_LINKS: SiteLink[] = [
  { label: 'Terms & Conditions', route: '/terms-conditions' },
  { label: 'Privacy Policy', route: '/privacy-policy' },
  { label: 'Copyright Policy', route: '/copyright-policy' },
  { label: 'Disclaimer', route: '/disclaimer' },
  { label: 'Help', route: '/help-desk' },
  { label: 'Hyperlinking Policy', route: '/hyperlinking-policy' },
  { label: 'Accessibility Statement', route: '/accessibility-statement' },
  { label: 'Videos', route: '/videos' },
  { label: 'Feedback Response', route: '/feedback-dashboard' },
  { label: 'Promotional Campaign', route: '/promotional-campaign' },
];

export const SOCIAL = [
  { icon: 'pi pi-facebook', label: 'Facebook', url: 'https://www.facebook.com/sugamdigitalgujarat' },
  { icon: 'pi pi-instagram', label: 'Instagram', url: 'https://www.instagram.com/sugamdigitalgujarat' },
  { icon: 'pi pi-youtube', label: 'YouTube', url: 'https://www.youtube.com/@digitalgujarat-dit' },
];

/** Turn a relative link scraped from the old site into an absolute one. */
export function abs(u: string): string {
  if (!u) return '';
  if (/^https?:/i.test(u)) return u;
  return SITE + u.replace(/^\.\.\//, '').replace(/^\//, '').replace(/ /g, '%20');
}

const ROUTES: Record<string, string> = {
  'AboutUs.aspx': '/about-us',
  'SugamDGAbhiyanServices.aspx': '/sugam-digital-gujarat',
  'CitizenServices.aspx': '/services/citizen',
  'DSSServices.aspx': '/services/digital-sevasetu',
  'JansevaServices.aspx': '/services/janseva',
  'NesdaServices.aspx': '/services/linked',
  'LatestUpdate.aspx': '/latest-update',
  'FAQ.aspx': '/faq',
  'Sitemap.aspx': '/sitemap',
  'Feedback.aspx': '/feedback',
  'FeedbackDashboard.aspx': '/feedback-dashboard',
  'HelpDesk.aspx': '/help-desk',
  'Videos.aspx': '/videos',
  'Campaign.aspx': '/promotional-campaign',
  'SugamUserManual.aspx': '/user-manual',
  'TermsCondition.aspx': '/terms-conditions',
  'PrivacyPolicy.aspx': '/privacy-policy',
  'CopyrightPolicy.aspx': '/copyright-policy',
  'Disclaimer.aspx': '/disclaimer',
  'HyperlinkPolicy.aspx': '/hyperlinking-policy',
  'AccessibilityStatement.aspx': '/accessibility-statement',
  'HomePage.aspx': '/',
  'index.html': '/',
};

/** Map a link from the old site onto the matching route of this app, if there is one. */
export function routeFor(u: string): string | null {
  if (/^https?:/i.test(u) && !u.startsWith(SITE)) return null;
  const file = u.split(/[?#]/)[0].split('/').pop() ?? '';
  return ROUTES[file] ?? null;
}
