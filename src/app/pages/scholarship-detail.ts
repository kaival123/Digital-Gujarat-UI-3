import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { PageHero } from '../shared/page-hero';
import { SCHOLARSHIPS, Scholarship, fmtDate, levelLabel, schStatus } from '../data/scholarships';
import locations from '../data/locations.json';

const num = (v: unknown) => Number(String(v ?? '').replace(/,/g, ''));
/** value must be ≤ max (number) */
const maxNum = (max: () => number | undefined): ValidatorFn => (c) => { const m = max(); return m !== undefined && c.value !== '' && num(c.value) > m ? { over: m } : null; };
/** value must be ≥ min (number) */
const minNum = (min: () => number | undefined): ValidatorFn => (c) => { const m = min(); return m !== undefined && c.value !== '' && num(c.value) < m ? { under: m } : null; };
const notFuture: ValidatorFn = (c) => (c.value && new Date(c.value) > new Date() ? { future: true } : null);
const mustBeTrue: ValidatorFn = (c) => (c.value === true ? null : { required: true });

const MESSAGES: Record<string, Record<string, string>> = {
  fullName: { required: 'Enter your full name as on Aadhaar.' },
  gender: { required: 'Select your gender.' },
  dob: { required: 'Enter your date of birth.', future: 'Date of birth cannot be in the future.' },
  category: { required: 'Select your category.' },
  aadhaar: { required: 'Enter your 12-digit Aadhaar number.', pattern: 'Aadhaar must be 12 digits and cannot start with 0 or 1.' },
  mobile: { required: 'Enter your mobile number.', pattern: 'Enter a 10-digit mobile number starting with 6–9.' },
  email: { required: 'Enter your e-mail address.', email: 'Enter a valid e-mail address.' },
  address: { required: 'Enter your address.' },
  district: { required: 'Select your district.' },
  disType: { required: 'Select the type of disability.' },
  disPercent: { required: 'Enter the disability percentage.', pattern: 'Enter a number from 0 to 100.', under: 'This scheme needs a disability of at least 40%.' },
  school: { required: 'Enter the school name.' },
  standard: { required: 'Select the standard you are studying in.' },
  board: { required: 'Select the board.' },
  course: { required: 'Enter the course name.' },
  institute: { required: 'Enter the college / institute name.' },
  yearOfStudy: { required: 'Select the year of study.' },
  admissionYear: { required: 'Select the admission year.' },
  lastExam: { required: 'Select the last exam you passed.' },
  lastPercent: { required: 'Enter the percentage scored.', pattern: 'Enter a percentage from 0 to 100.' },
  stream: { required: 'Select the stream.' },
  hostel: { required: 'Tell us whether you stay in a hostel.' },
  father: { required: "Enter the father's / guardian's name." },
  mother: { required: "Enter the mother's name." },
  occupation: { required: "Select the parent's / guardian's occupation." },
  income: { required: 'Enter the annual family income.', pattern: 'Use digits only.' },
  incomeCertNo: { required: 'Enter the income certificate number.' },
  members: { required: 'Enter the number of family members.', pattern: 'Enter a number from 1 to 30.' },
  holder: { required: 'Enter the account holder’s name.' },
  bankName: { required: 'Enter the bank name.' },
  accountNo: { required: 'Enter the account number.', pattern: 'Account number must be 9–18 digits.' },
  confirmAccount: { required: 'Re-enter the account number.', mismatch: 'Account numbers do not match.' },
  ifsc: { required: 'Enter the IFSC code.', pattern: 'IFSC is 11 characters, e.g. SBIN0001234.' },
  seeded: { required: 'Confirm the account is Aadhaar-seeded for DBT.' },
  declaration: { required: 'Please accept the declaration to submit.' },
};

const SECTIONS: [string, string[]][] = [
  ['Personal details', ['fullName', 'gender', 'dob', 'category', 'aadhaar', 'mobile', 'email', 'address', 'district']],
  ['Disability details', ['disType', 'disPercent']],
  ['Education details', ['school', 'standard', 'board', 'course', 'institute', 'yearOfStudy', 'admissionYear', 'lastExam', 'lastPercent', 'stream', 'hostel']],
  ['Family & income', ['father', 'mother', 'occupation', 'income', 'incomeCertNo', 'members']],
  ['Bank details', ['holder', 'bankName', 'accountNo', 'confirmAccount', 'ifsc', 'seeded']],
  ['Declaration', ['declaration']],
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-scholarship-detail',
  imports: [ReactiveFormsModule, RouterLink, ButtonDirective, InputText, PageHero],
  template: `
    @if (sch(); as s) {
      <app-page-hero [title]="s.name" [subtitle]="s.department" [trail]="[{ label: 'Schemes' }, { label: 'Scholarship Schemes', routerLink: '/scholarships' }]" />
      <section class="section sch sd" data-main tabindex="-1">
        <div class="container">
          <a class="sch-back" routerLink="/scholarships"><i class="pi pi-arrow-left" aria-hidden="true"></i> Back to Scholarship Schemes</a>

          @if (done(); as d) {
            <div class="cert-card cert-done" role="status">
              <span class="cert-done-ic"><i class="pi pi-check"></i></span>
              <h2>Application submitted</h2>
              <p>Your application for <b>{{ s.name }}</b> has been received in this demo.</p>
              <dl class="cert-meta">
                <div><dt>Application No</dt><dd>{{ d.no }}</dd></div>
                <div><dt>Applicant</dt><dd>{{ d.name }}</dd></div>
                <div><dt>Submitted on</dt><dd>{{ d.date }}</dd></div>
              </dl>
              <p class="cert-hint">Keep the application number to track your scholarship status.</p>
              <div class="sd-done-actions">
                <a pButton routerLink="/scholarships" [outlined]="true"><i class="pi pi-th-large"></i> Browse more scholarships</a>
                <button pButton type="button" (click)="reset()"><i class="pi pi-refresh"></i> Start a new application</button>
              </div>
            </div>
          } @else {
            <!-- ===== overview ===== -->
            <div class="sd-overview">
              <article class="cert-card sd-about">
                <div class="sd-head">
                  <span class="sch-ic" [attr.data-cat]="s.category"><i [class]="s.icon" aria-hidden="true"></i></span>
                  <div>
                    <span class="sch-tags">
                      <span class="sch-tag">{{ s.category === 'All' ? 'All categories' : s.category }}</span>
                      <span class="sch-tag">{{ level[s.level] }}</span>
                      <span class="sch-status" [attr.data-s]="status()">{{ statusLabel[status()] }}</span>
                    </span>
                    <p class="sd-overview-text">{{ s.overview }}</p>
                  </div>
                </div>
                <div class="sd-cols">
                  <section><h3><i class="pi pi-verified" aria-hidden="true"></i> Eligibility criteria</h3>
                    <ul class="ov-list">@for (e of s.eligibility; track e) { <li><i class="pi pi-check-square" aria-hidden="true"></i><span>{{ e }}</span></li> }</ul></section>
                  <section><h3><i class="pi pi-gift" aria-hidden="true"></i> Benefits</h3>
                    <ul class="ov-list">@for (b of s.benefits; track b) { <li><i class="pi pi-check-square" aria-hidden="true"></i><span>{{ b }}</span></li> }</ul></section>
                  <section><h3><i class="pi pi-folder-open" aria-hidden="true"></i> Required documents</h3>
                    <ul class="ov-chips">@for (d of s.documents; track d.key) { <li>{{ d.label }}{{ d.optional ? ' (optional)' : '' }}</li> }</ul></section>
                </div>
              </article>
              <aside class="cert-card sd-facts">
                <div class="sd-amt"><small>Scholarship benefit</small><b>{{ s.amount }}</b></div>
                <dl>
                  <div><dt>Application opens</dt><dd>{{ fmt(s.start) }}</dd></div>
                  <div><dt>Last date</dt><dd>{{ fmt(s.end) }}</dd></div>
                  @if (s.incomeLimit) { <div><dt>Family income limit</dt><dd>₹{{ s.incomeLimit.toLocaleString('en-IN') }}</dd></div> }
                  @if (s.minPercent) { <div><dt>Minimum marks</dt><dd>{{ s.minPercent }}%</dd></div> }
                  <div><dt>Payment</dt><dd>{{ s.bank ? 'Direct Benefit Transfer' : 'Through the institute' }}</dd></div>
                </dl>
                @if (status() !== 'open') {
                  <p class="sd-window" [attr.data-s]="status()"><i class="pi pi-clock" aria-hidden="true"></i>
                    {{ status() === 'closed' ? 'Applications closed on ' + fmt(s.end) + '.' : 'Applications open on ' + fmt(s.start) + '.' }}</p>
                }
                <a class="sd-jump" href="#sd-form" (click)="jump($event)"><i class="pi pi-pencil" aria-hidden="true"></i> Fill the application</a>
              </aside>
            </div>

            <!-- ===== application form ===== -->
            <form id="sd-form" class="cert-card sd-form" [formGroup]="f" (ngSubmit)="submit()" novalidate tabindex="-1">
              <p class="cert-pill"><i class="pi pi-file-edit" aria-hidden="true"></i> Scholarship Application</p>
              @if (tried() && problems().length) {
                <p class="cert-alert" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true"></i><span>Please fix the highlighted fields: {{ problems().join(' · ') }}</span></p>
              }

              <fieldset class="cert-box">
                <legend><i class="pi pi-user" aria-hidden="true"></i> Applicant personal details</legend>
                <div class="cert-grid cert-grid-3">
                  <label class="cert-f"><span>Full Name (as on Aadhaar) <b aria-hidden="true">*</b></span>
                    <input pInputText formControlName="fullName" autocomplete="name" [attr.aria-invalid]="!!msg('fullName')"><small class="cert-err">{{ msg('fullName') }}</small></label>
                  <label class="cert-f"><span>Gender <b aria-hidden="true">*</b></span>
                    <select class="sd-select" formControlName="gender" [attr.aria-invalid]="!!msg('gender')"><option value="">Select</option><option>Female</option><option>Male</option><option>Transgender</option></select>
                    <small class="cert-err" [class.sd-hint]="!msg('gender')">{{ msg('gender') || (s.gender ? 'This scheme is for girls only.' : '') }}</small></label>
                  <label class="cert-f"><span>Date of Birth <b aria-hidden="true">*</b></span>
                    <input pInputText type="date" formControlName="dob" [max]="today" [attr.aria-invalid]="!!msg('dob')"><small class="cert-err">{{ msg('dob') }}</small></label>
                  <label class="cert-f"><span>Category <b aria-hidden="true">*</b></span>
                    <select class="sd-select" formControlName="category" [attr.aria-invalid]="!!msg('category')"><option value="">Select</option>@for (c of categories; track c) { <option>{{ c }}</option> }</select>
                    <small class="cert-err" [class.sd-hint]="!msg('category')">{{ msg('category') || (s.category !== 'All' ? 'Fixed by this scheme.' : '') }}</small></label>
                  <label class="cert-f"><span>Aadhaar Number <b aria-hidden="true">*</b></span>
                    <input pInputText formControlName="aadhaar" inputmode="numeric" maxlength="12" autocomplete="off" [attr.aria-invalid]="!!msg('aadhaar')"><small class="cert-err">{{ msg('aadhaar') }}</small></label>
                  <label class="cert-f"><span>Mobile No <b aria-hidden="true">*</b></span>
                    <input pInputText formControlName="mobile" inputmode="numeric" maxlength="10" autocomplete="tel-national" [attr.aria-invalid]="!!msg('mobile')"><small class="cert-err">{{ msg('mobile') }}</small></label>
                  <label class="cert-f"><span>E-mail <b aria-hidden="true">*</b></span>
                    <input pInputText type="email" formControlName="email" autocomplete="email" [attr.aria-invalid]="!!msg('email')"><small class="cert-err">{{ msg('email') }}</small></label>
                  <label class="cert-f"><span>District <b aria-hidden="true">*</b></span>
                    <select class="sd-select" formControlName="district" [attr.aria-invalid]="!!msg('district')"><option value="">Select</option>@for (d of districts; track d) { <option>{{ d }}</option> }</select>
                    <small class="cert-err">{{ msg('district') }}</small></label>
                  <label class="cert-f cert-full"><span>Address <b aria-hidden="true">*</b></span>
                    <textarea pInputText formControlName="address" rows="2" autocomplete="street-address" [attr.aria-invalid]="!!msg('address')"></textarea><small class="cert-err">{{ msg('address') }}</small></label>
                </div>
              </fieldset>

              @if (s.disability) {
                <fieldset class="cert-box">
                  <legend><i class="pi pi-users" aria-hidden="true"></i> Disability details</legend>
                  <div class="cert-grid cert-grid-3">
                    <label class="cert-f"><span>Type of Disability <b aria-hidden="true">*</b></span>
                      <select class="sd-select" formControlName="disType" [attr.aria-invalid]="!!msg('disType')"><option value="">Select</option>@for (d of disabilities; track d) { <option>{{ d }}</option> }</select><small class="cert-err">{{ msg('disType') }}</small></label>
                    <label class="cert-f"><span>Disability Percentage <b aria-hidden="true">*</b></span>
                      <input pInputText formControlName="disPercent" inputmode="numeric" maxlength="3" [attr.aria-invalid]="!!msg('disPercent')"><small class="cert-err">{{ msg('disPercent') }}</small></label>
                    <label class="cert-f"><span>UDID Number</span>
                      <input pInputText formControlName="udid" maxlength="18"><small class="cert-err"></small></label>
                  </div>
                </fieldset>
              }

              <fieldset class="cert-box">
                <legend><i class="pi pi-book" aria-hidden="true"></i> Educational qualification details</legend>
                <div class="cert-grid cert-grid-3">
                  @if (s.level === 'pre') {
                    <label class="cert-f"><span>School Name <b aria-hidden="true">*</b></span>
                      <input pInputText formControlName="school" maxlength="120" [attr.aria-invalid]="!!msg('school')"><small class="cert-err">{{ msg('school') }}</small></label>
                    <label class="cert-f"><span>Standard (current) <b aria-hidden="true">*</b></span>
                      <select class="sd-select" formControlName="standard" [attr.aria-invalid]="!!msg('standard')"><option value="">Select</option>@for (x of s.standards ?? []; track x) { <option [value]="x">Std {{ x }}</option> }</select><small class="cert-err">{{ msg('standard') }}</small></label>
                    <label class="cert-f"><span>Board <b aria-hidden="true">*</b></span>
                      <select class="sd-select" formControlName="board" [attr.aria-invalid]="!!msg('board')"><option value="">Select</option><option>GSEB</option><option>CBSE</option><option>ICSE</option><option>Other</option></select><small class="cert-err">{{ msg('board') }}</small></label>
                  } @else {
                    <label class="cert-f"><span>Course Name <b aria-hidden="true">*</b></span>
                      <input pInputText formControlName="course" maxlength="100" placeholder="e.g. B.Sc. Physics" [attr.aria-invalid]="!!msg('course')"><small class="cert-err">{{ msg('course') }}</small></label>
                    <label class="cert-f"><span>College / Institute <b aria-hidden="true">*</b></span>
                      <input pInputText formControlName="institute" maxlength="120" [attr.aria-invalid]="!!msg('institute')"><small class="cert-err">{{ msg('institute') }}</small></label>
                    <label class="cert-f"><span>Year of Study <b aria-hidden="true">*</b></span>
                      <select class="sd-select" formControlName="yearOfStudy" [attr.aria-invalid]="!!msg('yearOfStudy')"><option value="">Select</option>@for (y of years; track y) { <option>{{ y }}</option> }</select><small class="cert-err">{{ msg('yearOfStudy') }}</small></label>
                    <label class="cert-f"><span>Admission Year <b aria-hidden="true">*</b></span>
                      <select class="sd-select" formControlName="admissionYear" [attr.aria-invalid]="!!msg('admissionYear')"><option value="">Select</option>@for (y of admissionYears; track y) { <option>{{ y }}</option> }</select><small class="cert-err">{{ msg('admissionYear') }}</small></label>
                  }
                  <label class="cert-f"><span>Last Exam Passed <b aria-hidden="true">*</b></span>
                    <select class="sd-select" formControlName="lastExam" [attr.aria-invalid]="!!msg('lastExam')"><option value="">Select</option>@for (x of lastExams(); track x) { <option>{{ x }}</option> }</select><small class="cert-err">{{ msg('lastExam') }}</small></label>
                  <label class="cert-f"><span>Percentage Scored <b aria-hidden="true">*</b></span>
                    <input pInputText formControlName="lastPercent" inputmode="decimal" maxlength="5" [attr.aria-invalid]="!!msg('lastPercent')">
                    <small class="cert-err" [class.sd-hint]="!msg('lastPercent')">{{ msg('lastPercent') || (s.minPercent ? 'Minimum ' + s.minPercent + '% required.' : '') }}</small></label>
                  @if (s.stream) {
                    <label class="cert-f"><span>Stream <b aria-hidden="true">*</b></span>
                      <select class="sd-select" formControlName="stream"><option>Science</option></select><small class="cert-err sd-hint">Fixed by this scheme.</small></label>
                  }
                  @if (s.hostel) {
                    <label class="cert-f"><span>Staying in a Hostel? <b aria-hidden="true">*</b></span>
                      <select class="sd-select" formControlName="hostel" [attr.aria-invalid]="!!msg('hostel')"><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select><small class="cert-err">{{ msg('hostel') }}</small></label>
                  }
                </div>
              </fieldset>

              <fieldset class="cert-box">
                <legend><i class="pi pi-home" aria-hidden="true"></i> Family and income details</legend>
                <div class="cert-grid cert-grid-3">
                  <label class="cert-f"><span>Father's / Guardian's Name <b aria-hidden="true">*</b></span>
                    <input pInputText formControlName="father" maxlength="100" [attr.aria-invalid]="!!msg('father')"><small class="cert-err">{{ msg('father') }}</small></label>
                  <label class="cert-f"><span>Mother's Name <b aria-hidden="true">*</b></span>
                    <input pInputText formControlName="mother" maxlength="100" [attr.aria-invalid]="!!msg('mother')"><small class="cert-err">{{ msg('mother') }}</small></label>
                  <label class="cert-f"><span>Parent's / Guardian's Occupation <b aria-hidden="true">*</b></span>
                    <select class="sd-select" formControlName="occupation" [attr.aria-invalid]="!!msg('occupation')"><option value="">Select</option>@for (o of occupations; track o) { <option>{{ o }}</option> }</select><small class="cert-err">{{ msg('occupation') }}</small></label>
                  <label class="cert-f"><span>Annual Family Income <b aria-hidden="true">*</b></span>
                    <span class="cert-money"><i aria-hidden="true">₹</i><input pInputText formControlName="income" inputmode="numeric" maxlength="9" [attr.aria-invalid]="!!msg('income')"></span>
                    <small class="cert-err" [class.sd-hint]="!msg('income')">{{ msg('income') || (s.incomeLimit ? 'Limit: ₹' + s.incomeLimit.toLocaleString('en-IN') : '') }}</small></label>
                  <label class="cert-f"><span>Income Certificate No <b aria-hidden="true">*</b></span>
                    <input pInputText formControlName="incomeCertNo" maxlength="30" [attr.aria-invalid]="!!msg('incomeCertNo')"><small class="cert-err">{{ msg('incomeCertNo') }}</small></label>
                  <label class="cert-f"><span>Family Members <b aria-hidden="true">*</b></span>
                    <input pInputText formControlName="members" inputmode="numeric" maxlength="2" [attr.aria-invalid]="!!msg('members')"><small class="cert-err">{{ msg('members') }}</small></label>
                </div>
              </fieldset>

              @if (s.bank) {
                <fieldset class="cert-box">
                  <legend><i class="pi pi-building-columns" aria-hidden="true"></i> Bank account details (for DBT)</legend>
                  <div class="cert-grid cert-grid-3">
                    <label class="cert-f"><span>Account Holder Name <b aria-hidden="true">*</b></span>
                      <input pInputText formControlName="holder" maxlength="100" [attr.aria-invalid]="!!msg('holder')"><small class="cert-err">{{ msg('holder') }}</small></label>
                    <label class="cert-f"><span>Bank Name <b aria-hidden="true">*</b></span>
                      <input pInputText formControlName="bankName" maxlength="100" [attr.aria-invalid]="!!msg('bankName')"><small class="cert-err">{{ msg('bankName') }}</small></label>
                    <label class="cert-f"><span>IFSC Code <b aria-hidden="true">*</b></span>
                      <input pInputText class="sd-upper" formControlName="ifsc" maxlength="11" autocomplete="off" (input)="upperIfsc()" [attr.aria-invalid]="!!msg('ifsc')"><small class="cert-err">{{ msg('ifsc') }}</small></label>
                    <label class="cert-f"><span>Account Number <b aria-hidden="true">*</b></span>
                      <input pInputText formControlName="accountNo" inputmode="numeric" maxlength="18" autocomplete="off" [attr.aria-invalid]="!!msg('accountNo')"><small class="cert-err">{{ msg('accountNo') }}</small></label>
                    <label class="cert-f"><span>Confirm Account Number <b aria-hidden="true">*</b></span>
                      <input pInputText formControlName="confirmAccount" inputmode="numeric" maxlength="18" autocomplete="off" (paste)="$event.preventDefault()" [attr.aria-invalid]="!!msg('confirmAccount')"><small class="cert-err">{{ msg('confirmAccount') }}</small></label>
                    <label class="cert-f sd-check"><input type="checkbox" formControlName="seeded"> <span>This account is Aadhaar-seeded for Direct Benefit Transfer <b aria-hidden="true">*</b></span><small class="cert-err">{{ msg('seeded') }}</small></label>
                  </div>
                </fieldset>
              }

              <fieldset class="cert-box dz">
                <legend><i class="pi pi-paperclip" aria-hidden="true"></i> Document upload</legend>
                <p class="cert-hint">PDF, JPG or PNG up to 1 MB each.</p>
                <ul class="sd-docs">
                  @for (d of s.documents; track d.key) {
                    <li [class.done]="files()[d.key]" [class.bad]="tried() && !d.optional && !files()[d.key]">
                      <span class="dz-ic" aria-hidden="true"><i [class]="files()[d.key] ? 'pi pi-file-check' : 'pi pi-file'"></i></span>
                      <span class="sd-doc-text"><b>{{ d.label }} @if (!d.optional) { <b class="req" aria-hidden="true">*</b> }</b>
                        @if (files()[d.key]; as file) { <small class="ok"><i class="pi pi-check-circle"></i> {{ file.name }} · {{ size(file.size) }}</small> }
                        @else if (fileErr()[d.key]) { <small class="no">{{ fileErr()[d.key] }}</small> }
                        @else { <small class="no">{{ d.optional ? 'Optional' : 'Not attached' }}</small> }
                      </span>
                      <span class="sd-doc-act">
                        <label class="dz-btn"><input type="file" class="sr-only" accept=".pdf,.jpg,.jpeg,.png" (change)="pick(d.key, $event)" [attr.aria-label]="'Choose file for ' + d.label"><i class="pi pi-upload" aria-hidden="true"></i> {{ files()[d.key] ? 'Replace' : 'Choose file' }}</label>
                        @if (files()[d.key]) { <button type="button" class="dz-remove" (click)="unpick(d.key)" [attr.aria-label]="'Remove ' + d.label"><i class="pi pi-trash"></i></button> }
                      </span>
                    </li>
                  }
                </ul>
              </fieldset>

              <label class="cert-same cert-declare sd-declare" [class.bad]="!!msg('declaration')">
                <input type="checkbox" formControlName="declaration">
                <span>I declare that the information and documents given above are true to the best of my knowledge. I understand that the scholarship can be cancelled and recovered if any information is found to be false, and I consent to my details being verified with the issuing authorities.</span>
              </label>
              <small class="cert-err sd-declare-err">{{ msg('declaration') }}</small>

              <footer class="cert-actions">
                <a pButton routerLink="/scholarships" severity="secondary" [outlined]="true"><i class="pi pi-arrow-left"></i> Back</a>
                <button pButton type="submit" [disabled]="status() !== 'open'"><i class="pi pi-send"></i> Submit Application</button>
              </footer>
              @if (status() !== 'open') { <p class="sd-window-note">Submission is disabled because applications are {{ status() === 'closed' ? 'closed' : 'not open yet' }} for this scheme.</p> }
            </form>
          }
        </div>
      </section>
    } @else {
      <app-page-hero title="Scholarship not found" [trail]="[{ label: 'Schemes' }, { label: 'Scholarship Schemes', routerLink: '/scholarships' }]" />
      <section class="section sch" data-main tabindex="-1">
        <div class="container sch-empty">
          <i class="pi pi-question-circle" aria-hidden="true"></i>
          <p>We couldn't find that scholarship. It may have been renamed or removed.</p>
          <a class="sch-back" routerLink="/scholarships"><i class="pi pi-arrow-left" aria-hidden="true"></i> Back to Scholarship Schemes</a>
        </div>
      </section>
    }
  `,
})
export class ScholarshipDetailPage {
  private fb = inject(FormBuilder);
  private id = toSignal(inject(ActivatedRoute).paramMap, { requireSync: true });
  sch = computed<Scholarship | undefined>(() => SCHOLARSHIPS.find((x) => x.id === this.id().get('id')));
  status = computed(() => (this.sch() ? schStatus(this.sch()!) : 'closed'));

  readonly level = levelLabel;
  readonly fmt = fmtDate;
  readonly statusLabel = { open: 'Open', upcoming: 'Opens soon', closed: 'Closed' } as const;
  readonly today = new Date().toISOString().slice(0, 10);
  readonly categories = ['General', 'EWS', 'SC', 'ST', 'SEBC', 'NT-DNT', 'Minority'];
  readonly districts = (locations.districts as { en: string }[]).map((d) => d.en);
  readonly disabilities = ['Locomotor', 'Visual', 'Hearing', 'Speech & Language', 'Intellectual', 'Multiple', 'Other'];
  readonly occupations = ['Farmer', 'Labourer', 'Private Job', 'Government Job', 'Business / Self-employed', 'Homemaker', 'Unemployed', 'Other'];
  readonly years = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
  readonly admissionYears = (() => { const y = new Date().getFullYear(); return [0, 1, 2, 3, 4].map((k) => `${y - k}-${String((y - k + 1) % 100).padStart(2, '0')}`); })();
  lastExams = computed(() => {
    const s = this.sch();
    if (!s) return [];
    if (s.level === 'pre') return ['Std 1–7', 'Std 8', 'Std 9', 'Std 10', 'Std 11'];
    if (s.level === 'post') return ['Std 10 (SSC)', 'Std 12 (HSC)', 'Diploma', 'Graduation'];
    return ['Std 10 (SSC)', 'Std 12 (HSC)', 'Diploma', 'Graduation', 'Post-Graduation'];
  });

  f = this.fb.nonNullable.group({
    fullName: ['', Validators.required], gender: ['', Validators.required], dob: ['', [Validators.required, notFuture]], category: ['', Validators.required],
    aadhaar: ['', [Validators.required, Validators.pattern(/^[2-9]\d{11}$/)]], mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    email: ['', [Validators.required, Validators.email]], address: ['', Validators.required], district: ['', Validators.required],
    disType: ['', Validators.required], disPercent: ['', [Validators.required, Validators.pattern(/^(100|\d{1,2})$/), minNum(() => 40)]], udid: [''],
    school: ['', Validators.required], standard: ['', Validators.required], board: ['', Validators.required],
    course: ['', Validators.required], institute: ['', Validators.required], yearOfStudy: ['', Validators.required], admissionYear: ['', Validators.required],
    lastExam: ['', Validators.required], lastPercent: ['', [Validators.required, Validators.pattern(/^(100(\.0{1,2})?|\d{1,2}(\.\d{1,2})?)$/), minNum(() => this.sch()?.minPercent)]],
    stream: [''], hostel: ['', [Validators.required, Validators.pattern(/^yes$/)]],
    father: ['', Validators.required], mother: ['', Validators.required], occupation: ['', Validators.required],
    income: ['', [Validators.required, Validators.pattern(/^\d+$/), maxNum(() => this.sch()?.incomeLimit)]], incomeCertNo: ['', Validators.required],
    members: ['', [Validators.required, Validators.pattern(/^([1-9]|[12]\d|30)$/)]],
    holder: ['', Validators.required], bankName: ['', Validators.required], accountNo: ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]],
    confirmAccount: ['', Validators.required], ifsc: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]], seeded: [false, mustBeTrue],
    declaration: [false, mustBeTrue],
  }, { validators: (g: AbstractControl): ValidationErrors | null => {
    const a = g.get('accountNo'), b = g.get('confirmAccount');
    if (b && b.enabled && b.value && a?.value !== b.value) b.setErrors({ ...(b.errors ?? {}), mismatch: true });
    else if (b?.hasError('mismatch')) { const { mismatch, ...rest } = b.errors!; b.setErrors(Object.keys(rest).length ? rest : null); }
    return null;
  } });
  private fv = toSignal(this.f.valueChanges, { initialValue: this.f.getRawValue() });

  tried = signal(false);
  files = signal<Record<string, File | undefined>>({});
  fileErr = signal<Record<string, string>>({});
  done = signal<{ no: string; name: string; date: string } | null>(null);

  constructor() {
    // rebuild the form for whichever scholarship the URL points at
    inject(ActivatedRoute).paramMap.pipe(takeUntilDestroyed()).subscribe(() => this.configure());
  }

  /** Enable only the controls this scheme uses, and lock values the scheme fixes (category, gender, stream). */
  private configure() {
    const s = this.sch();
    this.f.reset();
    this.tried.set(false); this.files.set({}); this.fileErr.set({}); this.done.set(null);
    if (!s) return;
    const on = (keys: string[], yes: boolean) => keys.forEach((k) => { const c = this.f.get(k)!; if (yes) c.enable({ emitEvent: false }); else c.disable({ emitEvent: false }); });
    on(['disType', 'disPercent', 'udid'], !!s.disability);
    on(['school', 'standard', 'board'], s.level === 'pre');
    on(['course', 'institute', 'yearOfStudy', 'admissionYear'], s.level !== 'pre');
    on(['hostel'], !!s.hostel);
    on(['holder', 'bankName', 'accountNo', 'confirmAccount', 'ifsc', 'seeded'], s.bank);
    on(['stream'], false);
    const lock = (key: string, value: string | undefined) => { const c = this.f.get(key)!; if (value) { c.setValue(value); c.disable({ emitEvent: false }); } else c.enable({ emitEvent: false }); };
    lock('category', s.category !== 'All' ? s.category : undefined);
    lock('gender', s.gender);
    this.f.get('stream')!.setValue(s.stream ?? '');
    this.f.updateValueAndValidity();
  }

  /** Error text for a control, once it has been touched or the user tried to submit. */
  msg(name: string): string {
    this.fv(); this.tried(); // re-evaluate as values / attempts change
    const c = this.f.get(name);
    if (!c || c.disabled || !c.errors || !(c.touched || this.tried())) return '';
    const e = c.errors, key = Object.keys(e)[0];
    if (key === 'over') return `Income is above this scheme's limit of ₹${(e['over'] as number).toLocaleString('en-IN')}.`;
    if (key === 'under' && name === 'lastPercent') return `This scheme needs at least ${e['under']}% marks.`;
    if (key === 'pattern' && name === 'hostel') return 'This scheme is only for students staying in a hostel.';
    return MESSAGES[name]?.[key] ?? 'Please check this field.';
  }

  missingDocs = computed(() => (this.sch()?.documents ?? []).filter((d) => !d.optional && !this.files()[d.key]));
  problems = computed(() => {
    this.fv(); this.tried();
    const out = SECTIONS.filter(([, keys]) => keys.some((k) => { const c = this.f.get(k); return c && c.enabled && c.invalid; })).map(([label]) => label);
    if (this.missingDocs().length) out.splice(out.length - (out.includes('Declaration') ? 1 : 0), 0, 'Documents');
    return out;
  });

  pick(key: string, e: Event) {
    const input = e.target as HTMLInputElement, file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const err = !/\.(pdf|jpe?g|png)$/i.test(file.name) ? 'Only PDF, JPG or PNG files are allowed.' : file.size > 1024 * 1024 ? `File is ${this.size(file.size)} — the limit is 1 MB.` : '';
    this.fileErr.update((m) => ({ ...m, [key]: err }));
    if (!err) this.files.update((m) => ({ ...m, [key]: file }));
  }
  unpick(key: string) { this.files.update((m) => ({ ...m, [key]: undefined })); }
  size(b: number) { return b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`; }
  upperIfsc() { const c = this.f.controls.ifsc; c.setValue(c.value.toUpperCase(), { emitEvent: true }); }

  jump(e: Event) {
    e.preventDefault();
    const el = document.getElementById('sd-form');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.focus({ preventScroll: true });
  }

  submit() {
    this.tried.set(true);
    this.f.markAllAsTouched();
    if (this.status() !== 'open') return;
    if (this.f.invalid || this.missingDocs().length) {
      setTimeout(() => {
        const bad = document.querySelector<HTMLElement>('.sd-form [aria-invalid="true"], .sd-form .sd-docs li.bad input, .sd-declare.bad input');
        bad?.focus();
        bad?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    const v = this.f.getRawValue();
    this.done.set({ no: `SCH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`, name: v.fullName, date: new Date().toLocaleDateString('en-GB') });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  reset() { this.configure(); }
}
