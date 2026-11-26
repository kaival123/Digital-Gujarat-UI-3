import { Component, ChangeDetectionStrategy, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../shared/page-hero';
import { SCHOLARSHIPS, SchCategory, SchLevel, Scholarship, fmtDate, levelLabel, schStatus } from '../data/scholarships';

const ROWS_PER_LOAD = 5;

/* Listing state lives outside the component so "Back" from a details page returns to the same filters and loaded rows. */
const listState = { rows: signal(ROWS_PER_LOAD), query: signal(''), category: signal<SchCategory | ''>(''), level: signal<SchLevel | ''>(''), openOnly: signal(false) };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-scholarships',
  imports: [RouterLink, PageHero],
  template: `
    <app-page-hero title="Scholarship Schemes" subtitle="Find a scholarship you are eligible for and apply online." [trail]="[{ label: 'Schemes' }]" />
    <section class="section sch" data-main tabindex="-1">
      <div class="container">
        <!-- filters -->
        <div class="sch-tools" role="search">
          <label class="sch-search">
            <i class="pi pi-search" aria-hidden="true"></i>
            <span class="sr-only">Search scholarships</span>
            <input type="search" placeholder="Search by name, eligibility or department" [value]="s.query()" (input)="setQuery($any($event.target).value)">
          </label>
          <label class="sch-level">
            <span class="sr-only">Education level</span>
            <select [value]="s.level()" (change)="setLevel($any($event.target).value)">
              <option value="">All levels</option>
              @for (l of levels; track l.value) { <option [value]="l.value">{{ l.label }}</option> }
            </select>
            <i class="pi pi-angle-down" aria-hidden="true"></i>
          </label>
          <label class="sch-open"><input type="checkbox" [checked]="s.openOnly()" (change)="setOpenOnly($any($event.target).checked)"> Open for applications</label>
        </div>
        <div class="sch-cats" role="group" aria-label="Category">
          @for (c of categories; track c.value) {
            <button type="button" [class.on]="s.category() === c.value" [attr.aria-pressed]="s.category() === c.value" (click)="setCategory(c.value)">{{ c.label }}</button>
          }
        </div>

        <p class="sch-count" aria-live="polite">Showing <b>{{ visible().length }}</b> of <b>{{ filtered().length }}</b> scholarships</p>

        @if (filtered().length) {
          <ul class="sch-grid">
            @for (x of visible(); track x.id; let i = $index) {
              <li>
                <a class="sch-card" [routerLink]="['/scholarships', x.id]" [attr.data-i]="i" [attr.aria-label]="x.name + ' — view details'">
                  <div class="sch-card-top">
                    <span class="sch-ic" [attr.data-cat]="x.category"><i [class]="x.icon" aria-hidden="true"></i></span>
                    <span class="sch-tags">
                      <span class="sch-tag">{{ x.category === 'All' ? 'All categories' : x.category }}</span>
                      <span class="sch-status" [attr.data-s]="status(x)">{{ statusLabel[status(x)] }}</span>
                    </span>
                  </div>
                  <h2>{{ x.name }}</h2>
                  <p class="sch-short">{{ x.short }}</p>
                  <p class="sch-elig"><i class="pi pi-check-circle" aria-hidden="true"></i> {{ x.eligibilitySummary }}</p>
                  <div class="sch-foot">
                    <span class="sch-amt"><small>Benefit</small><b>{{ x.amount }}</b></span>
                    <span class="sch-more">View Details <i class="pi pi-arrow-right" aria-hidden="true"></i></span>
                  </div>
                  <span class="sch-dates"><i class="pi pi-calendar" aria-hidden="true"></i> {{ fmt(x.start) }} – {{ fmt(x.end) }} · {{ level[x.level] }}</span>
                </a>
              </li>
            }
          </ul>
          @if (visible().length < filtered().length) {
            <div class="sch-loadmore">
              <button type="button" (click)="loadMore()"><i class="pi pi-plus-circle" aria-hidden="true"></i> Load More <small>({{ filtered().length - visible().length }} more)</small></button>
            </div>
          } @else if (filtered().length > pageSize()) {
            <p class="sch-end"><i class="pi pi-check" aria-hidden="true"></i> All {{ filtered().length }} scholarships are shown.</p>
          }
        } @else {
          <div class="sch-empty"><i class="pi pi-inbox" aria-hidden="true"></i><p>No scholarships match your filters.</p><button type="button" (click)="clear()">Clear filters</button></div>
        }
        <p class="sch-note"><i class="pi pi-info-circle" aria-hidden="true"></i> Amounts, income limits and dates shown here are indicative. Always confirm with the scheme's official notification before applying.</p>
      </div>
    </section>
  `,
})
export class ScholarshipsPage {
  readonly s = listState;
  readonly level = levelLabel;
  readonly fmt = fmtDate;
  readonly statusLabel = { open: 'Open', upcoming: 'Opens soon', closed: 'Closed' } as const;
  readonly levels = (Object.keys(levelLabel) as SchLevel[]).map((v) => ({ value: v, label: levelLabel[v] }));
  readonly categories: { value: SchCategory | ''; label: string }[] = [
    { value: '', label: 'All' }, { value: 'SC', label: 'SC' }, { value: 'ST', label: 'ST' }, { value: 'SEBC', label: 'SEBC' }, { value: 'EWS', label: 'EWS' },
    { value: 'NT-DNT', label: 'NT-DNT' }, { value: 'Minority', label: 'Minority' }, { value: 'All', label: 'Open to all' },
  ];

  /** Cards per row follows the grid's breakpoints (3 / 2 / 1), so "5 rows" stays 5 rows on every screen. */
  private cols = signal(this.colsNow());
  pageSize = computed(() => ROWS_PER_LOAD * this.cols());

  constructor() {
    const onResize = () => this.cols.set(this.colsNow());
    window.addEventListener('resize', onResize, { passive: true });
    inject(DestroyRef).onDestroy(() => window.removeEventListener('resize', onResize));
  }
  private colsNow() { return innerWidth >= 1024 ? 3 : innerWidth >= 640 ? 2 : 1; }

  status(x: Scholarship) { return schStatus(x); }

  filtered = computed(() => {
    const q = this.s.query().trim().toLowerCase(), cat = this.s.category(), lvl = this.s.level(), open = this.s.openOnly();
    return SCHOLARSHIPS.filter((x) =>
      (!cat || x.category === cat) && (!lvl || x.level === lvl) && (!open || schStatus(x) === 'open') &&
      (!q || [x.name, x.short, x.eligibilitySummary, x.department].some((t) => t.toLowerCase().includes(q))));
  });
  visible = computed(() => this.filtered().slice(0, this.s.rows() * this.cols()));

  loadMore() {
    const first = this.visible().length;
    this.s.rows.update((r) => r + ROWS_PER_LOAD);
    // move keyboard focus to the first newly shown card
    setTimeout(() => document.querySelector<HTMLElement>(`.sch-card[data-i="${first}"]`)?.focus());
  }
  private resetRows() { this.s.rows.set(ROWS_PER_LOAD); }
  setQuery(v: string) { this.s.query.set(v); this.resetRows(); }
  setCategory(v: SchCategory | '') { this.s.category.set(v); this.resetRows(); }
  setLevel(v: SchLevel | '') { this.s.level.set(v); this.resetRows(); }
  setOpenOnly(v: boolean) { this.s.openOnly.set(v); this.resetRows(); }
  clear() { this.s.query.set(''); this.s.category.set(''); this.s.level.set(''); this.s.openOnly.set(false); this.resetRows(); }
}
