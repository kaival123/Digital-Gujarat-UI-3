import { Component, ChangeDetectionStrategy, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { PageHero } from '../shared/page-hero';
import citizenData from '../data/citizen.json';
import sugamData from '../data/sugam.json';
import locations from '../data/locations.json';
import circularData from '../data/circulars.json';
import { abs } from '../shared/site';

interface Opt { label: string; value: string }
type Village = [string, string];
interface Taluka { code: string; en: string; gu: string; villages: Village[] }
interface Member { name: string; relation: string; age: number; source: string; income: number }
interface DocSection { key: string; icon: string; title: string; label: string; options: Opt[]; required: boolean; optionalNote: string }
interface DocState { type: string; number: string; staged?: File; file?: { name: string; size: number }; source?: 'upload' | 'digilocker'; busy?: 'upload' | 'digi'; err?: string }
interface PhotoState { staged?: File; file?: { name: string; size: number }; url?: string; busy?: boolean; err?: string }
interface District { code: string; en: string; gu: string; talukas: Taluka[] }

const DISTRICTS = locations.districts as District[];

/** Rupee amount in words, Indian grouping: 145000 → "One Lakh Forty Five Thousand". */
function inWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x: number) => (x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]} ${ones[x % 10]}`.trim());
  const three = (x: number) => [x >= 100 ? `${ones[Math.floor(x / 100)]} Hundred` : '', two(x % 100)].filter(Boolean).join(' ');
  n = Math.floor(Math.max(0, n));
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7), lakh = Math.floor((n % 1e7) / 1e5), thousand = Math.floor((n % 1e5) / 1e3), rest = n % 1e3;
  if (crore) parts.push(`${crore >= 100 ? inWords(crore) : two(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (rest) parts.push(three(rest));
  return parts.join(' ');
}
const both = (en: string, gu: string) => `${en} (${gu})`;
const DEFAULT_CERT = 'Income Certificate (Panchayat) (Sugam)';

/** Fictional demo profile used by "Update From Profile" (stands in for the signed-in citizen's saved profile). */
const PROFILE = {
  salute: 'shri', surname: 'પટેલ', firstName: 'રમેશભાઈ', middleName: 'કનુભાઈ',
  mobile: '9876543210', email: 'citizen@example.com', mother: 'સવિતાબેન પટેલ', father: 'કનુભાઈ પટેલ', relation: 'son',
  permAddress: '૧૨, શાંતિ નગર સોસાયટી, વેજલપુર, પંચમહાલ, ગુજરાત', permDistrict: 'PNM', permTaluka: 'PNM-KAL', permVillage: 'Vejalpur',
  curAddress: '૧૨, શાંતિ નગર સોસાયટી, વેજલપુર, પંચમહાલ, ગુજરાત', curDistrict: 'PNM', curTaluka: 'PNM-KAL', curVillage: 'Vejalpur',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-certificates',
  imports: [FormsModule, ReactiveFormsModule, ButtonDirective, Dialog, Checkbox, InputText, Select, Textarea, PageHero],
  template: `
    <app-page-hero [title]="cert()" subtitle="Apply online for income, caste, domicile and other certificates." [trail]="[{ label: 'Services' }, { label: 'Certificates' }]" />
    <section class="section cert" data-main tabindex="-1">
      <div class="container">
        @if (phase() === 'overview') {
          <!-- ===== Service / Scheme overview (shown before the application form) ===== -->
          <div class="ov">
            <header class="ov-bar">
              <h2>1. Service/Scheme Overview</h2>
              <span class="ov-progress" aria-label="Step 1 of 2"><small>Step 1 Of 2</small><i class="on"></i><b></b><i></i></span>
            </header>

            <div class="ov-grid">
              <aside class="ov-side">
                <nav class="ov-card ov-nav" aria-label="Overview sections">
                  @for (s of ovSections; track s.id) {
                    <a [href]="'#' + s.id" [class.on]="ovActive() === s.id" [attr.aria-current]="ovActive() === s.id ? 'true' : null" (click)="ovGo($event, s.id)">
                      <i [class]="s.icon" aria-hidden="true"></i> {{ s.label }}
                    </a>
                  }
                </nav>
                <div class="ov-card ov-circ">
                  <h3>Circulars/GO</h3>
                  @for (c of circulars; track c.no) {
                    <a class="ov-doc" [href]="c.link" target="_blank" rel="noopener" [attr.aria-label]="'Download circular: ' + c.title">
                      <i class="pi pi-file-pdf ov-doc-ic" aria-hidden="true"></i>
                      <span><b lang="gu">{{ c.title }}</b><small>PDF · {{ c.date }}</small></span>
                      <i class="pi pi-download" aria-hidden="true"></i>
                    </a>
                  }
                </div>
              </aside>

              <article class="ov-card ov-main">
                <section id="ov-language" class="ov-sec" tabindex="-1">
                  <label class="cert-f ov-lang">
                    <span>Certificate <b aria-hidden="true">*</b></span>
                    <p-select [options]="certGroups" [group]="true" optionGroupLabel="label" optionGroupChildren="items"
                              [ngModel]="cert()" (ngModelChange)="cert.set($event)" [filter]="true" filterBy="label" filterPlaceholder="Search certificates"
                              [checkmark]="true" scrollHeight="300px" appendTo="body" ariaLabel="Certificate" styleClass="cert-select" panelStyleClass="cert-select-panel" />
                  </label>
                  <label class="cert-f ov-lang">
                    <span>Certificate Language <b aria-hidden="true">*</b></span>
                    <p-select [options]="languages" [ngModel]="certLang()" (ngModelChange)="certLang.set($event)" ariaLabel="Certificate Language" appendTo="body" />
                  </label>
                  <p class="ov-note">You are applying for the service: <b>{{ cert() }}</b>. You can continue with this service or fill it up later from your applied services and submit.</p>
                  <div class="ov-fee">
                    <span><i class="pi pi-clock" aria-hidden="true"></i> Approximate time to complete this application is {{ minutes }} min.</span>
                    <b class="ov-fee-tag">Fees ₹{{ fee }}/-</b>
                  </div>
                </section>

                <section id="ov-instructions" class="ov-sec" tabindex="-1">
                  <h3>Instructions</h3>
                  <ul class="ov-list">
                    @for (t of instructions(); track $index) { <li><i class="pi pi-check-square" aria-hidden="true"></i><span>{{ t }}</span></li> }
                  </ul>
                </section>

                <section id="ov-residence" class="ov-sec" tabindex="-1">
                  <h3>Residence Proof Attachment</h3>
                  <p class="ov-sub">Any one of the following:</p>
                  <ul class="ov-chips">@for (d of residenceProofs; track d) { <li>{{ d }}</li> }</ul>
                </section>

                <section id="ov-identity" class="ov-sec" tabindex="-1">
                  <h3>Identity Proof Attachment</h3>
                  <p class="ov-sub">Any one of the following:</p>
                  <ul class="ov-chips">@for (d of identityProofs; track d) { <li>{{ d }}</li> }</ul>
                </section>

                <section id="ov-disclaimer" class="ov-sec" tabindex="-1">
                  <h3>Disclaimer</h3>
                  <p class="ov-disc">The Digital Gujarat portal acts as an online facilitator for citizens, through the designated district approval authority serving as the exclusive Single Point of Contact for service delivery and grievance resolution. Citizens are advised to reach out to their respective district officers for any grievances or RTI queries. The Digital Gujarat team assumes responsibility only in cases involving technical errors.</p>
                </section>
              </article>
            </div>

            <footer class="ov-actions">
              <button pButton type="button" (click)="openMode()">Next <i class="pi pi-arrow-right"></i></button>
            </footer>
          </div>
        } @else if (submitted()) {
          <div class="cert-card cert-done" role="status">
            <span class="cert-done-ic"><i class="pi pi-check"></i></span>
            <h2>Application submitted</h2>
            <p>Your application for <b>{{ cert() }}</b> has been received in this demo.</p>
            <dl class="cert-meta">
              <div><dt>Service Request ID</dt><dd>{{ requestId() }}</dd></div>
              <div><dt>Applicant</dt><dd>{{ fullName() }}</dd></div>
              <div><dt>Submitted on</dt><dd>{{ applyDate }}</dd></div>
            </dl>
            <p class="cert-hint">Keep the request ID to track your application under “My Applications” after you log in.</p>
            <button pButton type="button" (click)="startOver()"><i class="pi pi-plus"></i> Apply for another certificate</button>
          </div>
        } @else {
          <form class="cert-card" [formGroup]="form" (ngSubmit)="next()" novalidate>
            <!-- progress stepper: completed steps are clickable to go back -->
            <ol class="cert-stepper" aria-label="Application steps">
              @for (s of steps; track s; let i = $index) {
                <li [class.done]="step() > i + 1" [class.on]="step() === i + 1" [attr.aria-current]="step() === i + 1 ? 'step' : null">
                  @if (step() > i + 1) {
                    <button type="button" class="cs-dot" (click)="goTo(i + 1)" [attr.aria-label]="'Step ' + (i + 1) + ': ' + s + ' (completed) — go back'"><i class="pi pi-check"></i></button>
                  } @else {
                    <span class="cs-dot" aria-hidden="true">{{ i + 1 }}</span>
                  }
                  <span class="cs-label"><span class="sr-only">Step {{ i + 1 }}: </span>{{ s }}</span>
                </li>
              }
            </ol>

            <div class="cert-entry">
              <span class="cert-entry-k">Service Detail Entry :-</span>
              <label class="cert-pick">
                <span class="sr-only">Certificate</span>
                <p-select [options]="certGroups" [group]="true" optionGroupLabel="label" optionGroupChildren="items"
                          [ngModel]="cert()" (ngModelChange)="cert.set($event)" [ngModelOptions]="{ standalone: true }"
                          [filter]="true" filterBy="label" filterPlaceholder="Search certificates" [checkmark]="true" scrollHeight="300px"
                          appendTo="body" ariaLabel="Certificate" styleClass="cert-select" panelStyleClass="cert-select-panel" />
                <span class="cert-count">{{ certs.length }} certificates</span>
              </label>
            </div>

            @if (step() === 1) {
              @if (tried() && form.invalid) {
                <p class="cert-alert" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true"></i><span>Please fill in the highlighted fields before you continue.</span></p>
              }

              <p class="cert-pill"><i class="pi pi-user" aria-hidden="true"></i> Applicant Information</p>
              <dl class="cert-meta cert-meta-dash">
                <div><dt>Service Request ID</dt><dd>{{ requestId() }}</dd></div>
                <div><dt>Service Apply Year</dt><dd>{{ applyYear }}</dd></div>
                <div><dt>Service Apply Date</dt><dd>{{ applyDate }}</dd></div>
              </dl>

              <div class="cert-grid">
                <label class="cert-f">
                  <span>Salute <b aria-hidden="true">*</b></span>
                  <p-select formControlName="salute" [options]="salutes" placeholder="Select" ariaLabel="Salute" [invalid]="bad('salute')" appendTo="body" />
                  <small class="cert-err">@if (bad('salute')) { Select a salute. }</small>
                </label>
                <label class="cert-f">
                  <span>Surname <b aria-hidden="true">*</b></span>
                  <input pInputText formControlName="surname" [readonly]="locked()" autocomplete="family-name" [attr.aria-invalid]="bad('surname')">
                  <small class="cert-err">@if (bad('surname')) { Enter the surname. }</small>
                </label>
                <label class="cert-f">
                  <span>First Name <b aria-hidden="true">*</b></span>
                  <input pInputText formControlName="firstName" [readonly]="locked()" autocomplete="given-name" [attr.aria-invalid]="bad('firstName')">
                  <small class="cert-err">@if (bad('firstName')) { Enter the first name. }</small>
                </label>
                <label class="cert-f">
                  <span>Middle Name</span>
                  <input pInputText formControlName="middleName" autocomplete="additional-name">
                  <small class="cert-err"></small>
                </label>

                <label class="cert-f">
                  <span>Mobile No <b aria-hidden="true">*</b></span>
                  <input pInputText formControlName="mobile" [readonly]="locked()" inputmode="numeric" maxlength="10" autocomplete="tel-national" [attr.aria-invalid]="bad('mobile')">
                  <small class="cert-err">@if (bad('mobile')) { Enter a 10-digit mobile number starting with 6–9. }</small>
                </label>
                <label class="cert-f">
                  <span>E-mail <b aria-hidden="true">*</b></span>
                  <input pInputText type="email" formControlName="email" autocomplete="email" [attr.aria-invalid]="bad('email')">
                  <small class="cert-err">@if (bad('email')) { Enter a valid e-mail address. }</small>
                </label>
                <label class="cert-f">
                  <span>Mother Full Name <b aria-hidden="true">*</b></span>
                  <input pInputText formControlName="mother" [readonly]="locked()" [attr.aria-invalid]="bad('mother')">
                  <small class="cert-err">@if (bad('mother')) { Enter the mother's full name. }</small>
                </label>
                <label class="cert-f">
                  <span>Father/Husband Full Name <b aria-hidden="true">*</b></span>
                  <input pInputText formControlName="father" [readonly]="locked()" [attr.aria-invalid]="bad('father')">
                  <small class="cert-err">@if (bad('father')) { Enter the father's / husband's full name. }</small>
                </label>

                <label class="cert-f cert-full">
                  <span>Relation with Parent's / Husband's / Guardian</span>
                  <p-select formControlName="relation" [options]="relations" placeholder="Select" ariaLabel="Relation with Parent's / Husband's / Guardian" appendTo="body" />
                  <small class="cert-err"></small>
                </label>
              </div>

              <fieldset class="cert-box">
              <legend><i class="pi pi-home" aria-hidden="true"></i> Permanent Address</legend>
              <div class="cert-grid cert-grid-3">
                <label class="cert-f cert-full">
                  <span>Address <b aria-hidden="true">*</b></span>
                  <textarea pTextarea formControlName="permAddress" rows="3" autocomplete="street-address" [attr.aria-invalid]="bad('permAddress')"></textarea>
                  <small class="cert-err">@if (bad('permAddress')) { Enter the permanent address. }</small>
                </label>
                <label class="cert-f">
                  <span>District <b aria-hidden="true">*</b></span>
                  <p-select formControlName="permDistrict" [options]="districtOpts" placeholder="Select district" [filter]="true" ariaLabel="Permanent address district" [invalid]="bad('permDistrict')" appendTo="body" (onChange)="resetBelow('perm', 'district')" />
                  <small class="cert-err">@if (bad('permDistrict')) { Select a district. }</small>
                </label>
                <label class="cert-f">
                  <span>Taluka <b aria-hidden="true">*</b></span>
                  <p-select formControlName="permTaluka" [options]="talukaOpts(form.controls.permDistrict.value)" placeholder="Select taluka" ariaLabel="Permanent address taluka" [invalid]="bad('permTaluka')" appendTo="body" (onChange)="resetBelow('perm', 'taluka')" />
                  <small class="cert-err">@if (bad('permTaluka')) { Select a taluka. }</small>
                </label>
                <label class="cert-f">
                  <span>Village</span>
                  <p-select formControlName="permVillage" [options]="villageOpts(form.controls.permDistrict.value, form.controls.permTaluka.value)" placeholder="Select village" ariaLabel="Permanent address village" appendTo="body" [showClear]="true" />
                  <small class="cert-err"></small>
                </label>
              </div>
              </fieldset>

              <label class="cert-same">
                <p-checkbox formControlName="sameAsPerm" [binary]="true" inputId="cert-same" (onChange)="syncCurrent()" />
                <span>Same as Permanent Address</span>
              </label>

              <fieldset class="cert-box" [class.cert-locked]="form.controls.sameAsPerm.value">
              <legend><i class="pi pi-map-marker" aria-hidden="true"></i> Current Address</legend>
              <div class="cert-grid cert-grid-3">
                <label class="cert-f cert-full">
                  <span>Address <b aria-hidden="true">*</b></span>
                  <textarea pTextarea formControlName="curAddress" rows="3" [attr.aria-invalid]="bad('curAddress')"></textarea>
                  <small class="cert-err">@if (bad('curAddress')) { Enter the current address. }</small>
                </label>
                <label class="cert-f">
                  <span>District <b aria-hidden="true">*</b></span>
                  <p-select formControlName="curDistrict" [options]="districtOpts" placeholder="Select district" [filter]="true" ariaLabel="Current address district" [invalid]="bad('curDistrict')" appendTo="body" (onChange)="resetBelow('cur', 'district')" />
                  <small class="cert-err">@if (bad('curDistrict')) { Select a district. }</small>
                </label>
                <label class="cert-f">
                  <span>Taluka <b aria-hidden="true">*</b></span>
                  <p-select formControlName="curTaluka" [options]="talukaOpts(form.controls.curDistrict.value)" placeholder="Select taluka" ariaLabel="Current address taluka" [invalid]="bad('curTaluka')" appendTo="body" (onChange)="resetBelow('cur', 'taluka')" />
                  <small class="cert-err">@if (bad('curTaluka')) { Select a taluka. }</small>
                </label>
                <label class="cert-f">
                  <span>Village</span>
                  <p-select formControlName="curVillage" [options]="villageOpts(form.controls.curDistrict.value, form.controls.curTaluka.value)" placeholder="Select village" ariaLabel="Current address village" appendTo="body" [showClear]="true" />
                  <small class="cert-err"></small>
                </label>
              </div>
              </fieldset>

              <footer class="cert-actions">
                <button pButton type="button" severity="secondary" [text]="true" class="cert-prev" (click)="backToOverview()"><i class="pi pi-arrow-left"></i> Service Overview</button>
                <button pButton type="button" severity="secondary" [outlined]="true" (click)="fillFromProfile()"><i class="pi pi-refresh"></i> Update From Profile</button>
                <button pButton type="submit">Next <i class="pi pi-arrow-right"></i></button>
              </footer>
            } @else if (step() === 2) {
              @if (tried2() && step2Errors().length) {
                <p class="cert-alert" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true"></i><span>Please fix the highlighted fields: {{ step2Errors().join(' · ') }}</span></p>
              }
              <div class="cert-stepbody" [formGroup]="svc">
                <p class="cert-pill"><i class="pi pi-briefcase" aria-hidden="true"></i> Service Details</p>

                <div class="cert-grid cert-grid-2">
                  <label class="cert-f">
                    <span>Purpose for which {{ needsIncome() ? 'income certificate' : 'certificate' }} is required <b aria-hidden="true">*</b></span>
                    <p-select formControlName="purpose" [options]="purposes" placeholder="Select" ariaLabel="Purpose" [invalid]="bad2('purpose')" appendTo="body" (onChange)="purposeChanged()" />
                    <small class="cert-err">@if (bad2('purpose')) { Select the purpose. }</small>
                  </label>
                  <label class="cert-f">
                    <span>Enter purpose if Other selected @if (isOther()) { <b aria-hidden="true">*</b> }</span>
                    <input pInputText formControlName="purposeOther" maxlength="150" [attr.aria-invalid]="bad2('purposeOther')">
                    <small class="cert-err">@if (bad2('purposeOther')) { Describe the purpose. }</small>
                  </label>
                </div>

                <fieldset class="cert-occ" [class.bad]="occBad()">
                  <legend>Applicant Occupation Details <b aria-hidden="true">*</b></legend>
                  <div class="cert-chips">
                    @for (o of occupationOpts; track o.key) {
                      <label class="cert-chip" [class.on]="svcValue()[o.key]">
                        <p-checkbox [formControlName]="o.key" [binary]="true" [inputId]="'occ-' + o.key" />
                        <span>{{ o.label }}</span>
                      </label>
                    }
                  </div>
                  <small class="cert-err">@if (occBad()) { Select at least one occupation. }</small>
                </fieldset>

                <!-- one details form per ticked occupation -->
                @if (svcValue().occFarmer) {
                  <fieldset class="cert-box occ-box" [formGroup]="farm">
                    <legend><i class="pi pi-sun" aria-hidden="true"></i> Farmer Details</legend>
                    <div class="cert-grid cert-grid-3">
                      <label class="cert-f"><span>Khata No (8-A) <b aria-hidden="true">*</b></span>
                        <input pInputText formControlName="khata" maxlength="20" [attr.aria-invalid]="badOcc(farm, 'khata')">
                        <small class="cert-err">@if (badOcc(farm, 'khata')) { Enter the Khata number. }</small></label>
                      <label class="cert-f"><span>Survey / Block No <b aria-hidden="true">*</b></span>
                        <input pInputText formControlName="survey" maxlength="40" [attr.aria-invalid]="badOcc(farm, 'survey')">
                        <small class="cert-err">@if (badOcc(farm, 'survey')) { Enter the survey / block number. }</small></label>
                      <label class="cert-f"><span>Total Land (Hectare) <b aria-hidden="true">*</b></span>
                        <input pInputText formControlName="area" inputmode="decimal" maxlength="8" [attr.aria-invalid]="badOcc(farm, 'area')">
                        <small class="cert-err">@if (badOcc(farm, 'area')) { Enter the area, e.g. 1.25. }</small></label>
                      <label class="cert-f"><span>Irrigation</span>
                        <p-select formControlName="irrigation" [options]="irrigationOpts" placeholder="Select" ariaLabel="Irrigation" appendTo="body" />
                        <small class="cert-err"></small></label>
                      <label class="cert-f"><span>Main Crops</span>
                        <input pInputText formControlName="crops" maxlength="80" placeholder="e.g. Cotton, Groundnut">
                        <small class="cert-err"></small></label>
                      <label class="cert-f"><span>Annual Agricultural Income <b aria-hidden="true">*</b></span>
                        <span class="cert-money"><i aria-hidden="true">₹</i><input pInputText formControlName="income" inputmode="numeric" maxlength="9" [attr.aria-invalid]="badOcc(farm, 'income')"></span>
                        <small class="cert-err">@if (badOcc(farm, 'income')) { Enter the yearly income in digits. }</small></label>
                    </div>
                  </fieldset>
                }
                @if (svcValue().occBusiness) {
                  <fieldset class="cert-box occ-box" [formGroup]="biz">
                    <legend><i class="pi pi-shop" aria-hidden="true"></i> Business / Other Occupation Details</legend>
                    <div class="cert-grid cert-grid-3">
                      <label class="cert-f"><span>Name of Business / Occupation <b aria-hidden="true">*</b></span>
                        <input pInputText formControlName="name" maxlength="100" [attr.aria-invalid]="badOcc(biz, 'name')">
                        <small class="cert-err">@if (badOcc(biz, 'name')) { Enter the business or occupation name. }</small></label>
                      <label class="cert-f"><span>Type of Business <b aria-hidden="true">*</b></span>
                        <p-select formControlName="type" [options]="bizTypes" placeholder="Select" ariaLabel="Type of Business" [invalid]="badOcc(biz, 'type')" appendTo="body" />
                        <small class="cert-err">@if (badOcc(biz, 'type')) { Select the type. }</small></label>
                      <label class="cert-f"><span>GST / Registration No</span>
                        <input pInputText formControlName="reg" maxlength="20" [attr.aria-invalid]="badOcc(biz, 'reg')">
                        <small class="cert-err">@if (badOcc(biz, 'reg')) { Use letters and digits only. }</small></label>
                      <label class="cert-f cert-wide"><span>Business Address <b aria-hidden="true">*</b></span>
                        <input pInputText formControlName="address" maxlength="200" [attr.aria-invalid]="badOcc(biz, 'address')">
                        <small class="cert-err">@if (badOcc(biz, 'address')) { Enter the business address. }</small></label>
                      <label class="cert-f"><span>Annual Business Income <b aria-hidden="true">*</b></span>
                        <span class="cert-money"><i aria-hidden="true">₹</i><input pInputText formControlName="income" inputmode="numeric" maxlength="9" [attr.aria-invalid]="badOcc(biz, 'income')"></span>
                        <small class="cert-err">@if (badOcc(biz, 'income')) { Enter the yearly income in digits. }</small></label>
                    </div>
                  </fieldset>
                }
                @if (svcValue().occJob) {
                  <fieldset class="cert-box occ-box" [formGroup]="job">
                    <legend><i class="pi pi-briefcase" aria-hidden="true"></i> Job Details</legend>
                    <div class="cert-grid cert-grid-3">
                      <label class="cert-f"><span>Employer / Office Name <b aria-hidden="true">*</b></span>
                        <input pInputText formControlName="employer" maxlength="100" [attr.aria-invalid]="badOcc(job, 'employer')">
                        <small class="cert-err">@if (badOcc(job, 'employer')) { Enter the employer name. }</small></label>
                      <label class="cert-f"><span>Type of Job <b aria-hidden="true">*</b></span>
                        <p-select formControlName="type" [options]="jobTypes" placeholder="Select" ariaLabel="Type of Job" [invalid]="badOcc(job, 'type')" appendTo="body" />
                        <small class="cert-err">@if (badOcc(job, 'type')) { Select the job type. }</small></label>
                      <label class="cert-f"><span>Designation <b aria-hidden="true">*</b></span>
                        <input pInputText formControlName="designation" maxlength="60" [attr.aria-invalid]="badOcc(job, 'designation')">
                        <small class="cert-err">@if (badOcc(job, 'designation')) { Enter the designation. }</small></label>
                      <label class="cert-f cert-wide"><span>Office Address</span>
                        <input pInputText formControlName="address" maxlength="200">
                        <small class="cert-err"></small></label>
                      <label class="cert-f"><span>Monthly Salary <b aria-hidden="true">*</b></span>
                        <span class="cert-money"><i aria-hidden="true">₹</i><input pInputText formControlName="salary" inputmode="numeric" maxlength="8" [attr.aria-invalid]="badOcc(job, 'salary')"></span>
                        <small class="cert-err">@if (badOcc(job, 'salary')) { Enter the monthly salary in digits. } @else if (jobAnnual()) { ≈ ₹ {{ jobAnnual().toLocaleString('en-IN') }} per year }</small></label>
                    </div>
                  </fieldset>
                }

                @if (needsIncome()) {
                  <fieldset class="cert-box">
                    <legend><i class="pi pi-chart-line" aria-hidden="true"></i> Family Yearly Income</legend>
                    <div class="cert-grid cert-grid-2">
                      <label class="cert-f">
                        <span>No of Family Member <b aria-hidden="true">*</b></span>
                        <input pInputText formControlName="familyCount" inputmode="numeric" maxlength="2" [attr.aria-invalid]="bad2('familyCount')">
                        <small class="cert-err">@if (bad2('familyCount')) { Enter 1–30. }</small>
                      </label>
                      <label class="cert-f">
                        <span>No of Earning Member <b aria-hidden="true">*</b></span>
                        <input pInputText formControlName="earningCount" inputmode="numeric" maxlength="2" [attr.aria-invalid]="bad2('earningCount') || earningTooMany()">
                        <small class="cert-err">@if (bad2('earningCount')) { Enter 0–30. } @else if (earningTooMany()) { Cannot be more than the number of family members. }</small>
                      </label>
                    </div>
                  </fieldset>

                  <fieldset class="cert-box" [class.bad]="membersBad()">
                    <legend><i class="pi pi-users" aria-hidden="true"></i> Family members details (Add at least one member)</legend>
                    <div class="cert-grid cert-grid-3" [formGroup]="mem">
                      <label class="cert-f">
                        <span>Name of member <b aria-hidden="true">*</b></span>
                        <input pInputText formControlName="name" maxlength="80" [attr.aria-invalid]="badMem('name')">
                        <small class="cert-err">@if (badMem('name')) { Enter the name. }</small>
                      </label>
                      <label class="cert-f">
                        <span>Relation of member <b aria-hidden="true">*</b></span>
                        <p-select formControlName="relation" [options]="memberRelations" placeholder="Select" ariaLabel="Relation of member" [invalid]="badMem('relation')" appendTo="body" />
                        <small class="cert-err">@if (badMem('relation')) { Select the relation. }</small>
                      </label>
                      <label class="cert-f">
                        <span>Age of member <b aria-hidden="true">*</b></span>
                        <input pInputText formControlName="age" inputmode="numeric" maxlength="3" [attr.aria-invalid]="badMem('age')">
                        <small class="cert-err">@if (badMem('age')) { Enter an age from 0 to 120. }</small>
                      </label>
                      <label class="cert-f">
                        <span>Source of Income <b aria-hidden="true">*</b></span>
                        <p-select formControlName="source" [options]="incomeSourcesOpts" placeholder="Select" ariaLabel="Source of Income" [invalid]="badMem('source')" appendTo="body" />
                        <small class="cert-err">@if (badMem('source')) { Select the source. }</small>
                      </label>
                      <label class="cert-f">
                        <span>Yearly income of member (Previous Financial Year) <b aria-hidden="true">*</b></span>
                        <span class="cert-money"><i aria-hidden="true">₹</i><input pInputText formControlName="income" inputmode="numeric" maxlength="9" [attr.aria-invalid]="badMem('income')"></span>
                        <small class="cert-err">@if (badMem('income')) { Enter the yearly income in digits (0 if none). }</small>
                      </label>
                      <div class="cert-f cert-addcell">
                        <span aria-hidden="true">&nbsp;</span>
                        <div class="cert-addbtns">
                          <button pButton type="button" size="small" (click)="saveMember()"><i [class]="editIdx() === null ? 'pi pi-plus' : 'pi pi-check'"></i> {{ editIdx() === null ? 'Add Member' : 'Update Member' }}</button>
                          @if (editIdx() !== null) { <button pButton type="button" size="small" severity="secondary" [text]="true" (click)="cancelEdit()">Cancel</button> }
                        </div>
                        <small class="cert-err"></small>
                      </div>
                    </div>

                    <div class="cert-table-wrap" tabindex="0" role="region" aria-label="Family members">
                      <table class="cert-table">
                        <thead><tr><th scope="col">Sr No</th><th scope="col">Name</th><th scope="col">Relation</th><th scope="col">Age</th><th scope="col">Business</th><th scope="col" class="num">Yearly Income</th><th scope="col">Update</th><th scope="col">Delete</th></tr></thead>
                        <tbody>
                          @for (m of members(); track $index; let i = $index) {
                            <tr [class.editing]="editIdx() === i">
                              <td>{{ i + 1 }}</td><td>{{ m.name }}</td><td>{{ label(memberRelations, m.relation) }}</td><td>{{ m.age }}</td>
                              <td>{{ label(incomeSourcesOpts, m.source) }}</td><td class="num">₹ {{ m.income.toLocaleString('en-IN') }}</td>
                              <td><button type="button" class="cert-icon-btn" (click)="editMember(i)" [attr.aria-label]="'Update ' + m.name"><i class="pi pi-pencil"></i></button></td>
                              <td><button type="button" class="cert-icon-btn danger" (click)="deleteMember(i)" [attr.aria-label]="'Delete ' + m.name"><i class="pi pi-trash"></i></button></td>
                            </tr>
                          } @empty {
                            <tr><td colspan="8" class="cert-empty">No family members added yet.</td></tr>
                          }
                        </tbody>
                      </table>
                    </div>
                    <small class="cert-err">@if (membersBad()) { {{ membersMsg() }} }</small>
                  </fieldset>

                  <div class="cert-grid cert-grid-2 cert-totals">
                    <label class="cert-f"><span>Total Annual Income</span><span class="cert-money"><i aria-hidden="true">₹</i><input pInputText readonly [value]="totals().total.toLocaleString('en-IN')"></span></label>
                    <label class="cert-f"><span>Applicant's Income <b aria-hidden="true">*</b></span><span class="cert-money"><i aria-hidden="true">₹</i><input pInputText readonly [value]="totals().self.toLocaleString('en-IN')"></span></label>
                    <label class="cert-f"><span>Applicant's Parents' Income <b aria-hidden="true">*</b></span><span class="cert-money"><i aria-hidden="true">₹</i><input pInputText readonly [value]="totals().parents.toLocaleString('en-IN')"></span></label>
                    <label class="cert-f"><span>Other family Member income <b aria-hidden="true">*</b></span><span class="cert-money"><i aria-hidden="true">₹</i><input pInputText readonly [value]="totals().other.toLocaleString('en-IN')"></span></label>
                  </div>
                }

                <fieldset class="cert-box">
                  <legend><i class="pi pi-bolt" aria-hidden="true"></i> Electricity bill (address proof)</legend>
                  <label class="cert-consent">
                    <p-checkbox formControlName="consent" [binary]="true" inputId="cert-consent" (onChange)="billChanged()" />
                    <span>
                      I hereby provide my voluntary consent to DGVCL / MGVCL / PGVCL / UGVCL / Torrent Power to access and retrieve my Electricity Bill records via the Digital Gujarat portal for availing the service of {{ cert() }} provided by the Government of Gujarat. I understand that my personal details will be used exclusively for this purpose and handled securely to process my application.
                      <span lang="gu" class="cert-consent-gu">હું મારી સ્વૈચ્છિક સંમતિ આપું છું કે ગુજરાત સરકાર દ્વારા આપવામાં આવતી સેવાનો લાભ લેવા માટે ડિજિટલ ગુજરાત પોર્ટલ દ્વારા મારા વીજબિલના રેકોર્ડ મેળવવામાં આવે. મારી વ્યક્તિગત વિગતોનો ઉપયોગ ફક્ત આ હેતુ માટે જ અને સુરક્ષિત રીતે કરવામાં આવશે.</span>
                    </span>
                  </label>

                  <div class="cert-grid">
                    <label class="cert-f">
                      <span>Company</span>
                      <p-select formControlName="company" [options]="companies" placeholder="Select" ariaLabel="Electricity company" appendTo="body" (onChange)="billChanged()" />
                      <small class="cert-err"></small>
                    </label>
                    <label class="cert-f">
                      <span>Electricity bill Consumer Number</span>
                      <input pInputText formControlName="consumerNo" inputmode="numeric" maxlength="15" (input)="billChanged()" [attr.aria-invalid]="bad2('consumerNo')">
                      <small class="cert-err">@if (bad2('consumerNo')) { Use 6–15 digits. }</small>
                    </label>
                    <div class="cert-f">
                      <span>Verify Electricity bill</span>
                      <button type="button" class="cert-verify" (click)="verifyBill()" [disabled]="verify() === 'busy'">
                        <i [class]="verify() === 'busy' ? 'pi pi-spin pi-spinner' : 'pi pi-shield'" aria-hidden="true"></i> Click to Verify Electricity bill
                      </button>
                      <small class="cert-err" role="status">{{ verifyMsg() }}</small>
                    </div>
                    <div class="cert-f">
                      <span>Verify Status</span>
                      <span class="cert-status" [class.yes]="verify() === 'yes'" aria-live="polite">
                        <i [class]="verify() === 'yes' ? 'pi pi-check-circle' : 'pi pi-times-circle'" aria-hidden="true"></i> {{ verify() === 'yes' ? 'Yes' : 'No' }}
                      </span>
                      <small class="cert-err"></small>
                    </div>
                  </div>

                  <div class="cert-grid cert-grid-2">
                    <label class="cert-f">
                      <span>Electricity Bill Consumer Name <b aria-hidden="true">*</b></span>
                      <input pInputText formControlName="consumerName" maxlength="100" [attr.aria-invalid]="bad2('consumerName')">
                      <small class="cert-err">@if (bad2('consumerName')) { Enter the consumer name on the bill. }</small>
                    </label>
                    <label class="cert-f">
                      <span>Last Electricity Bill Amount (in Rs)</span>
                      <span class="cert-money"><i aria-hidden="true">₹</i><input pInputText formControlName="billAmount" inputmode="numeric" maxlength="7" [attr.aria-invalid]="bad2('billAmount')"></span>
                      <small class="cert-err">@if (bad2('billAmount')) { Digits only. }</small>
                    </label>
                    <label class="cert-f">
                      <span>Electricity Bill Consumer Address <b aria-hidden="true">*</b></span>
                      <textarea pTextarea formControlName="consumerAddress" rows="3" maxlength="300" [attr.aria-invalid]="bad2('consumerAddress')"></textarea>
                      <small class="cert-err">@if (bad2('consumerAddress')) { Enter the address on the bill. }</small>
                    </label>
                    <div class="cert-f">
                      <span>Clear Details</span>
                      <button type="button" class="cert-clear" (click)="clearBill()"><i class="pi pi-times-circle" aria-hidden="true"></i> Clear Details</button>
                    </div>
                  </div>
                </fieldset>
              </div>
              <footer class="cert-actions">
                <button pButton type="button" severity="secondary" [outlined]="true" (click)="goTo(1)"><i class="pi pi-arrow-left"></i> Previous</button>
                <button pButton type="button" (click)="next2()">Next <i class="pi pi-arrow-right"></i></button>
              </footer>
            } @else {
              <p class="cert-pill"><i class="pi pi-paperclip" aria-hidden="true"></i> Document Attach</p>
              <p class="cert-hint dz-intro"><i class="pi pi-info-circle" aria-hidden="true"></i> Attach any one document per section — PDF, JPG or PNG up to 1 MB — or fetch it straight from DigiLocker.</p>
              @if (tried3() && step3Errors().length) {
                <p class="cert-alert" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true"></i><span>Complete these sections to submit: {{ step3Errors().join(' · ') }}</span></p>
              }

              @for (sec of docSections(); track sec.key) {
                @let st = doc(sec.key);
                <fieldset class="cert-box dz" [class.bad]="tried3() && secBad(sec)">
                  <legend><i [class]="sec.icon" aria-hidden="true"></i> {{ sec.title }}</legend>
                  @if (!sec.required) { <p class="dz-optional"><i class="pi pi-check-circle" aria-hidden="true"></i> {{ sec.optionalNote }}</p> }
                  <div class="cert-grid cert-grid-2">
                    <label class="cert-f">
                      <span>{{ sec.label }} @if (sec.required) { <b aria-hidden="true">*</b> }</span>
                      <p-select [options]="sec.options" [ngModel]="st.type" (ngModelChange)="setDoc(sec.key, { type: $event })" [ngModelOptions]="{ standalone: true }"
                                placeholder="Select Document for Upload" [ariaLabel]="sec.label" [invalid]="tried3() && sec.required && !st.type" appendTo="body" />
                      <small class="cert-err">@if (tried3() && sec.required && !st.type) { Select a document. }</small>
                    </label>
                    <label class="cert-f">
                      <span>Document Number / Certificate No @if (sec.required) { <b aria-hidden="true">*</b> }</span>
                      <input pInputText [value]="st.number" (input)="setDoc(sec.key, { number: $any($event.target).value })" maxlength="40" autocomplete="off"
                             [attr.aria-invalid]="tried3() && sec.required && !st.number.trim()">
                      <small class="cert-err">@if (tried3() && sec.required && !st.number.trim()) { Enter the document number. }</small>
                    </label>
                  </div>

                  <div class="dz-file" [class.done]="st.file">
                    <span class="dz-ic" aria-hidden="true"><i [class]="st.file ? 'pi pi-file-check' : 'pi pi-file'"></i></span>
                    <div class="dz-body">
                      <b class="dz-title">Select File For Upload</b>
                      <div class="dz-btns">
                        <label class="dz-btn">
                          <input type="file" class="sr-only" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" (change)="browse(sec.key, $event)" [attr.aria-label]="'Browse file for ' + sec.title">
                          <i class="pi pi-search" aria-hidden="true"></i> Browse
                        </label>
                        <button type="button" class="dz-btn solid" (click)="upload(sec.key)" [disabled]="!st.staged || st.busy"><i [class]="st.busy === 'upload' ? 'pi pi-spin pi-spinner' : 'pi pi-upload'" aria-hidden="true"></i> Upload</button>
                        <button type="button" class="dz-btn dark" (click)="digiLocker(sec.key)" [disabled]="!!st.busy"><i [class]="st.busy === 'digi' ? 'pi pi-spin pi-spinner' : 'pi pi-cloud-download'" aria-hidden="true"></i> Attach From DigiLocker</button>
                      </div>
                      <p class="dz-status" role="status">
                        @if (st.file) {
                          <span class="ok"><i class="pi pi-check-circle" aria-hidden="true"></i> {{ st.file.name }} {{ st.source === 'digilocker' ? '— fetched from DigiLocker' : '· ' + size(st.file.size) + ' — attached' }}</span>
                          <button type="button" class="dz-remove" (click)="removeDoc(sec.key)" [attr.aria-label]="'Remove document from ' + sec.title"><i class="pi pi-trash"></i> Remove</button>
                        } @else if (st.staged) {
                          <span class="ready"><i class="pi pi-paperclip" aria-hidden="true"></i> {{ st.staged.name }} · {{ size(st.staged.size) }} — click Upload to attach</span>
                        } @else if (st.err) {
                          <span class="no">{{ st.err }}</span>
                        } @else {
                          <span class="no">Document Not attached.</span>
                        }
                      </p>
                    </div>
                  </div>
                </fieldset>
              }

              <fieldset class="cert-box dz" [class.bad]="tried3() && !photo().file">
                <legend><i class="pi pi-camera" aria-hidden="true"></i> Upload Document — Photo Upload</legend>
                <div class="dz-photo">
                  <div class="dz-body">
                    <b class="dz-title">Attach Photo <b class="req" aria-hidden="true">*</b></b>
                    <div class="dz-btns">
                      <label class="dz-btn">
                        <input type="file" class="sr-only" accept=".jpg,.jpeg,.png,image/jpeg,image/png" (change)="browsePhoto($event)" aria-label="Browse photo">
                        <i class="pi pi-search" aria-hidden="true"></i> Browse
                      </label>
                      <button type="button" class="dz-btn solid" (click)="uploadPhoto()" [disabled]="!photo().staged || photo().busy"><i [class]="photo().busy ? 'pi pi-spin pi-spinner' : 'pi pi-upload'" aria-hidden="true"></i> Upload</button>
                      <label class="dz-btn">
                        <!-- capture opens the camera on phones; desktops fall back to a file picker -->
                        <input type="file" class="sr-only" accept="image/jpeg,image/png" capture="user" (change)="browsePhoto($event)" aria-label="Capture photo with camera">
                        <i class="pi pi-camera" aria-hidden="true"></i> Capture
                      </label>
                    </div>
                    <p class="dz-help"><i class="pi pi-info-circle" aria-hidden="true"></i> Recent passport-size photo, JPG/PNG up to 200 KB.</p>
                    <p class="dz-status" role="status">
                      @if (photo().file) {
                        <span class="ok"><i class="pi pi-check-circle" aria-hidden="true"></i> Photo attached</span>
                        <button type="button" class="dz-remove" (click)="removePhoto()" aria-label="Remove photo"><i class="pi pi-trash"></i> Remove</button>
                      } @else if (photo().staged) {
                        <span class="ready"><i class="pi pi-paperclip" aria-hidden="true"></i> {{ photo().staged!.name }} — click Upload to attach</span>
                      } @else if (photo().err) {
                        <span class="no">{{ photo().err }}</span>
                      } @else {
                        <span class="no">Photo not attached.</span>
                      }
                    </p>
                  </div>
                  <figure class="dz-preview" [class.has]="photo().url">
                    @if (photo().url) { <img [src]="photo().url" alt="Applicant photo preview"> }
                    @else { <i class="pi pi-user" aria-hidden="true"></i><figcaption>No photo</figcaption> }
                  </figure>
                </div>
              </fieldset>

              <footer class="cert-actions">
                <button pButton type="button" severity="secondary" [outlined]="true" (click)="goTo(2)"><i class="pi pi-arrow-left"></i> Previous</button>
                <button pButton type="button" (click)="submit()"><i class="pi pi-send"></i> Submit</button>
              </footer>
            }
          </form>
        }
      </div>
    </section>
    <!-- application mode chooser (opens from the overview's Next) -->
    <p-dialog [visible]="modeOpen()" (visibleChange)="modeOpen.set($event)" [modal]="true" [draggable]="false" [resizable]="false" [dismissableMask]="true"
              header="Select Application Mode" styleClass="mode-dlg" [style]="{ width: 'min(560px, calc(100vw - 32px))' }" [blockScroll]="true">
      <div class="mode-opts" role="radiogroup" aria-label="Application mode">
        <label class="mode-opt" [class.on]="mode() === 'centre'">
          <input type="radio" name="appMode" value="centre" [checked]="mode() === 'centre'" (change)="mode.set('centre')">
          <i class="pi pi-map-marker" aria-hidden="true"></i><span>Visit a Service Centre</span>
        </label>
        <label class="mode-opt" [class.on]="mode() === 'online'">
          <input type="radio" name="appMode" value="online" [checked]="mode() === 'online'" (change)="mode.set('online')">
          <i class="pi pi-globe" aria-hidden="true"></i><span>Apply Online</span>
        </label>
      </div>
      <p class="mode-hint">{{ mode() === 'centre' ? 'Fill in the application here; the service centre operator will verify it with your original documents.' : 'You will sign in with your Citizen Login to apply and pay online.' }}</p>
      <ng-template #footer>
        <button pButton type="button" (click)="submitMode()">Submit</button>
      </ng-template>
    </p-dialog>

    <!-- self-declaration: shown when Document Attach is submitted; the application is only submitted after consent -->
    <p-dialog [visible]="consentOpen()" (visibleChange)="consentOpen.set($event)" [modal]="true" [draggable]="false" [resizable]="false"
              styleClass="consent-dlg" [style]="{ width: 'min(860px, calc(100vw - 32px))' }" [blockScroll]="true" [closable]="true">
      <ng-template #header>
        <h2 class="consent-title"><span class="consent-ic"><i class="pi pi-file-edit" aria-hidden="true"></i></span> {{ needsIncome() ? 'Family members details — Self-Declaration' : 'Self-Declaration' }}</h2>
      </ng-template>
      <label class="consent-body">
        <p-checkbox [binary]="true" inputId="consent-ok" [ngModel]="consentChecked()" (ngModelChange)="consentChecked.set($event)" ariaLabel="I agree to this declaration" />
        <span class="consent-text">
          @for (p of declaration(); track $index) { <span class="consent-p">{{ p }}</span> }
        </span>
      </label>
      <ng-template #footer>
        <button pButton type="button" [disabled]="!consentChecked()" (click)="giveConsent()"><i class="pi pi-check-circle"></i> Give Consent And Submit</button>
        <button pButton type="button" class="consent-close" (click)="consentOpen.set(false)">Close</button>
      </ng-template>
    </p-dialog>
  `,
})
export class CertificatesPage {
  private fb = inject(FormBuilder);

  /** Every certificate service from the Sugam and Citizen catalogues. */
  readonly certs: Opt[] = [...new Set([...sugamData, ...citizenData].map((s) => s.title).filter((t) => /certificate/i.test(t)))]
    .map((t) => ({ label: t, value: t }));
  /** The same list grouped by kind, so the picker is scannable instead of one long wall of titles. */
  readonly certGroups = (() => {
    const kinds: [string, RegExp][] = [
      ['Income & EWS', /income|economically/i], ['Non-Creamy Layer', /creamy/i],
      ['Caste & Community', /caste|sebc|tribe|minority|\bsc\b|\bst\b/i], ['Other Certificates', /./],
    ];
    const groups = kinds.map(([label]) => ({ label, items: [] as Opt[] }));
    for (const c of this.certs) groups[kinds.findIndex(([, re]) => re.test(c.label))].items.push(c);
    return groups.filter((g) => g.items.length);
  })();
  cert = signal(DEFAULT_CERT);

  /* ---- service / scheme overview (first screen) ---- */
  private router = inject(Router);
  phase = signal<'overview' | 'form'>('overview');
  readonly ovSections = [
    { id: 'ov-language', label: 'Certificate Language', icon: 'pi pi-language' },
    { id: 'ov-instructions', label: 'Instructions', icon: 'pi pi-info-circle' },
    { id: 'ov-residence', label: 'Residence Proof Attachment', icon: 'pi pi-home' },
    { id: 'ov-identity', label: 'Identity Proof Attachment', icon: 'pi pi-id-card' },
    { id: 'ov-disclaimer', label: 'Disclaimer', icon: 'pi pi-file' },
  ];
  ovActive = signal('ov-language');
  ovGo(e: Event, id: string) {
    e.preventDefault();
    this.ovActive.set(id);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.focus({ preventScroll: true });
  }
  readonly circulars = circularData.filter((c) => c.url).slice(0, 2).map((c) => ({ ...c, link: abs(c.url) }));
  readonly languages: Opt[] = [{ label: 'Gujarati (ગુજરાતી)', value: 'gu' }, { label: 'English', value: 'en' }];
  certLang = signal('gu');
  readonly fee = 20;
  readonly minutes = 15;
  instructions = computed(() => [
    `This service is available in ${this.certLang() === 'gu' ? 'Gujarati' : 'English'} only.`,
    'Click “Next” and choose how you want to apply: at a service centre, or online after signing in.',
    'Keep your service details ready (occupation, family members and their income) besides the basic applicant details before you start.',
    'All fields marked with a star (*) are mandatory.',
    'Use English or Gujarati in the form, according to the certificate language selected above.',
    'Wrong or misleading information in the application will lead to its rejection by the department.',
    'If your application is returned for changes or incomplete details, resubmit it within 21 days; otherwise it is disposed of with rejection and the fee is not refunded.',
  ]);
  readonly residenceProofs = ['Ration Card', 'True Copy of Electricity Bill', 'True Copy of Telephone Bill', 'True Copy of Passport', 'Driving License',
    'First Page of Bank Passbook / Cancelled Cheque', 'Post Office Account Statement / Passbook', 'Government Photo ID card / Service photo identity card issued by PSU',
    'Water Bill (not older than 3 months)'];
  readonly identityProofs = ['True Copy of Election Card', 'True Copy of Income Tax PAN Card', 'True Copy of Passport', 'Self Attested Copy of Aadhaar Card', 'Driving License',
    'Government Photo ID card / Service photo identity card issued by PSU', 'Any Government document having citizen photo', 'Photo ID issued by Recognized Educational Institute'];

  /* application mode popup */
  modeOpen = signal(false);
  mode = signal<'centre' | 'online'>('centre');
  openMode() { this.modeOpen.set(true); }
  submitMode() {
    this.modeOpen.set(false);
    if (this.mode() === 'online') { void this.router.navigateByUrl('/citizen-login'); return; }
    this.phase.set('form');
    setTimeout(() => document.querySelector('.cert-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  backToOverview() {
    this.phase.set('overview');
    setTimeout(() => document.querySelector('.ov')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  readonly salutes: Opt[] = [
    { label: 'Shri (શ્રીમાન)', value: 'shri' }, { label: 'Smt. (શ્રીમતી)', value: 'smt' }, { label: 'Kumari (કુમારી)', value: 'kumari' },
  ];
  readonly relations: Opt[] = [
    { label: 'Son (પુત્ર)', value: 'son' }, { label: 'Daughter (પુત્રી)', value: 'daughter' }, { label: 'Wife (પત્ની)', value: 'wife' }, { label: 'Ward (આશ્રિત)', value: 'ward' },
  ];
  readonly districtOpts: Opt[] = DISTRICTS.map((d) => ({ label: both(d.en, d.gu), value: d.code }));

  private newRequestId = () => '26' + String(Math.floor(Math.random() * 1e10)).padStart(10, '0');
  requestId = signal(this.newRequestId());
  readonly applyYear = new Date().getFullYear();
  readonly applyDate = new Date().toLocaleDateString('en-GB');

  readonly steps = ['Applicant Information', 'Service Details', 'Upload Documents'];
  step = signal<1 | 2 | 3>(1);
  tried = signal(false);
  tried2 = signal(false);
  tried3 = signal(false);
  declared = signal(false);
  submitted = signal(false);

  form = this.fb.nonNullable.group({
    salute: ['', Validators.required],
    surname: ['', Validators.required],
    firstName: ['', Validators.required],
    middleName: [''],
    mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    email: ['', [Validators.required, Validators.email]],
    mother: ['', Validators.required],
    father: ['', Validators.required],
    relation: [''],
    permAddress: ['', Validators.required],
    permDistrict: ['', Validators.required],
    permTaluka: ['', Validators.required],
    permVillage: [''],
    sameAsPerm: [false],
    curAddress: ['', Validators.required],
    curDistrict: ['', Validators.required],
    curTaluka: ['', Validators.required],
    curVillage: [''],
  });

  /* ---- step 2: service details ---- */
  readonly purposes: Opt[] = ['Education / Scholarship', 'Government Scheme / Subsidy', 'Employment', 'Bank Loan', 'Court / Legal', 'Other']
    .map((p) => ({ label: p, value: p }));
  readonly occupationOpts = [
    { key: 'occFarmer', label: 'Farmer' }, { key: 'occBusiness', label: 'Business / Other Occupation' }, { key: 'occJob', label: 'Job' },
  ] as const;
  readonly memberRelations: Opt[] = [
    ['self', 'Self (સ્વયં)'], ['father', 'Father (પિતા)'], ['mother', 'Mother (માતા)'], ['husband', 'Husband (પતિ)'], ['wife', 'Wife (પત્ની)'],
    ['son', 'Son (પુત્ર)'], ['daughter', 'Daughter (પુત્રી)'], ['brother', 'Brother (ભાઈ)'], ['sister', 'Sister (બહેન)'], ['other', 'Other (અન્ય)'],
  ].map(([value, label]) => ({ label, value }));
  readonly incomeSourcesOpts: Opt[] = ['Agriculture', 'Business', 'Job / Salary', 'Labour', 'Pension', 'No Income', 'Other'].map((p) => ({ label: p, value: p }));
  readonly companies: Opt[] = [
    ['DGVCL', 'DGVCL – Dakshin Gujarat Vij Company'], ['MGVCL', 'MGVCL – Madhya Gujarat Vij Company'], ['PGVCL', 'PGVCL – Paschim Gujarat Vij Company'],
    ['UGVCL', 'UGVCL – Uttar Gujarat Vij Company'], ['TORRENT', 'Torrent Power'],
  ].map(([value, label]) => ({ label, value }));

  private digits = Validators.pattern(/^\d*$/);
  svc = this.fb.nonNullable.group({
    purpose: ['', Validators.required],
    purposeOther: [{ value: '', disabled: true }],
    occFarmer: [false], occBusiness: [false], occJob: [false],
    familyCount: ['', [Validators.required, Validators.pattern(/^([1-9]|[12]\d|30)$/)]],
    earningCount: ['', [Validators.required, Validators.pattern(/^([0-9]|[12]\d|30)$/)]],
    consent: [false],
    company: [''],
    consumerNo: ['', Validators.pattern(/^\d{6,15}$/)],
    consumerName: ['', Validators.required],
    billAmount: ['', this.digits],
    consumerAddress: ['', Validators.required],
  });
  svcValue = toSignal(this.svc.valueChanges, { initialValue: this.svc.getRawValue() });
  /** Income / EWS / non-creamy-layer certificates also ask for family income and members. */
  needsIncome = computed(() => /income|economically|creamy/i.test(this.cert()));
  isOther = computed(() => this.svcValue().purpose === 'Other');
  bad2(name: keyof typeof this.svc.controls) {
    const c = this.svc.controls[name];
    return c.invalid && (c.touched || this.tried2());
  }
  /** "Enter purpose if Other selected" is only editable — and required — when the purpose is Other. */
  purposeChanged() {
    const c = this.svc.controls.purposeOther;
    if (this.svc.controls.purpose.value === 'Other') { c.enable(); c.setValidators(Validators.required); }
    else { c.setValue(''); c.clearValidators(); c.disable(); }
    c.updateValueAndValidity();
  }
  occBad = computed(() => this.tried2() && !this.occupationOpts.some((o) => this.svcValue()[o.key]));

  /* details for each ticked occupation (validated only while that chip is ticked) */
  readonly irrigationOpts: Opt[] = ['Irrigated', 'Non-irrigated (rain-fed)', 'Partly irrigated'].map((p) => ({ label: p, value: p }));
  readonly bizTypes: Opt[] = ['Shop / Trading', 'Manufacturing', 'Services', 'Professional (Doctor, Lawyer, CA…)', 'Transport', 'Daily Wages / Labour', 'Other'].map((p) => ({ label: p, value: p }));
  readonly jobTypes: Opt[] = ['Government', 'Semi-Government / PSU', 'Private', 'Contract / Outsourced'].map((p) => ({ label: p, value: p }));
  farm = this.fb.nonNullable.group({
    khata: ['', Validators.required], survey: ['', Validators.required],
    area: ['', [Validators.required, Validators.pattern(/^\d{1,4}(\.\d{1,4})?$/)]],
    irrigation: [''], crops: [''], income: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
  });
  biz = this.fb.nonNullable.group({
    name: ['', Validators.required], type: ['', Validators.required], reg: ['', Validators.pattern(/^[A-Za-z0-9]*$/)],
    address: ['', Validators.required], income: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
  });
  job = this.fb.nonNullable.group({
    employer: ['', Validators.required], type: ['', Validators.required], designation: ['', Validators.required],
    address: [''], salary: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
  });
  private jobValue = toSignal(this.job.valueChanges, { initialValue: this.job.getRawValue() });
  private farmValue = toSignal(this.farm.valueChanges, { initialValue: this.farm.getRawValue() });
  private bizValue = toSignal(this.biz.valueChanges, { initialValue: this.biz.getRawValue() });
  jobAnnual = computed(() => (Number(this.jobValue().salary) || 0) * 12);
  /** Occupation groups to check, for the occupations currently ticked. */
  private activeOccGroups() {
    const v = this.svc.getRawValue();
    return [[v.occFarmer, this.farm, 'Farmer details'], [v.occBusiness, this.biz, 'Business details'], [v.occJob, this.job, 'Job details']] as const;
  }
  badOcc(group: FormGroup, name: string) { const c = group.get(name); return !!c && c.invalid && (c.touched || this.tried2()); }
  earningTooMany = computed(() => {
    const v = this.svcValue();
    return v.familyCount !== '' && v.earningCount !== '' && Number(v.earningCount) > Number(v.familyCount);
  });

  /* family members table */
  members = signal<Member[]>([]);
  editIdx = signal<number | null>(null);
  memTried = signal(false);
  mem = this.fb.nonNullable.group({
    name: ['', Validators.required],
    relation: ['', Validators.required],
    age: ['', [Validators.required, Validators.pattern(/^(\d{1,2}|1[01]\d|120)$/)]],
    source: ['', Validators.required],
    income: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
  });
  badMem(name: keyof typeof this.mem.controls) { return this.mem.controls[name].invalid && this.memTried(); }
  saveMember() {
    this.memTried.set(true);
    if (this.mem.invalid) return;
    const v = this.mem.getRawValue();
    const m: Member = { name: v.name.trim(), relation: v.relation, age: Number(v.age), source: v.source, income: Number(v.income) };
    const i = this.editIdx();
    this.members.update((list) => (i === null ? [...list, m] : list.map((x, k) => (k === i ? m : x))));
    this.cancelEdit();
  }
  editMember(i: number) {
    const m = this.members()[i];
    this.mem.setValue({ name: m.name, relation: m.relation, age: String(m.age), source: m.source, income: String(m.income) });
    this.editIdx.set(i);
    this.memTried.set(false);
    setTimeout(() => document.querySelector<HTMLInputElement>('.cert [formcontrolname="name"]')?.focus());
  }
  deleteMember(i: number) {
    this.members.update((list) => list.filter((_, k) => k !== i));
    const e = this.editIdx();
    if (e === i) this.cancelEdit(); else if (e !== null && e > i) this.editIdx.set(e - 1);
  }
  cancelEdit() { this.mem.reset(); this.editIdx.set(null); this.memTried.set(false); }
  /** Totals split the way the form asks for them: applicant (Self), parents (Father/Mother), everyone else. */
  totals = computed(() => {
    const t = { total: 0, self: 0, parents: 0, other: 0 };
    for (const m of this.members()) {
      t.total += m.income;
      if (m.relation === 'self') t.self += m.income;
      else if (m.relation === 'father' || m.relation === 'mother') t.parents += m.income;
      else t.other += m.income;
    }
    return t;
  });
  membersMsg = computed(() => {
    const n = this.members().length, fam = Number(this.svcValue().familyCount) || 0;
    if (!n) return 'Add at least one family member.';
    if (fam && n > fam) return `You added ${n} members but No of Family Member is ${fam}.`;
    return '';
  });
  membersBad = computed(() => this.tried2() && this.needsIncome() && !!this.membersMsg());
  label(opts: Opt[], v: string) { return opts.find((o) => o.value === v)?.label ?? v; }

  /* electricity bill (address proof). Verification is simulated here: no request leaves the browser.
     Wire verifyBill() to the DISCOM bill-fetch API when it is available. */
  verify = signal<'no' | 'busy' | 'yes'>('no');
  verifyMsg = signal('');
  private verifyTimer?: ReturnType<typeof setTimeout>;
  /** Any change to consent, company or consumer number invalidates an earlier verification. */
  billChanged() {
    clearTimeout(this.verifyTimer);
    this.verify.set('no');
    this.verifyMsg.set('');
  }
  verifyBill() {
    const v = this.svc.getRawValue();
    const msg = !v.consent ? 'Tick the consent box first.' : !v.company ? 'Select the electricity company.' : !/^\d{6,15}$/.test(v.consumerNo) ? 'Enter a 6–15 digit consumer number.' : '';
    this.verifyMsg.set(msg);
    if (msg) { this.svc.controls.consumerNo.markAsTouched(); return; }
    this.verify.set('busy');
    this.verifyTimer = setTimeout(() => {
      const a = this.form.getRawValue();
      const amount = 300 + ([...v.consumerNo].reduce((s, d) => s + Number(d), 0) * 37) % 1500;
      this.svc.patchValue({
        consumerName: [a.firstName, a.middleName, a.surname].filter(Boolean).join(' ') || this.svc.controls.consumerName.value,
        consumerAddress: a.permAddress || this.svc.controls.consumerAddress.value,
        billAmount: String(amount),
      });
      this.verify.set('yes');
      this.verifyMsg.set('');
    }, 900);
  }
  clearBill() {
    clearTimeout(this.verifyTimer);
    this.svc.patchValue({ company: '', consumerNo: '', consumerName: '', billAmount: '', consumerAddress: '' });
    this.svc.controls.consumerNo.markAsUntouched();
    this.verify.set('no');
    this.verifyMsg.set('');
  }

  /** Short list of what still blocks step 2 (shown in the alert). */
  step2Errors = computed(() => {
    this.svcValue(); this.members(); // track
    const e: string[] = [];
    const c = this.svc.controls;
    if (c.purpose.invalid || c.purposeOther.invalid) e.push('Purpose');
    if (this.occBad()) e.push('Occupation');
    this.jobValue(); this.farmValue(); this.bizValue(); // re-check as these forms change
    for (const [on, g, label] of this.activeOccGroups()) if (on && g.invalid) e.push(label);
    if (this.needsIncome()) {
      if (c.familyCount.invalid || c.earningCount.invalid || this.earningTooMany()) e.push('Family Yearly Income');
      if (this.membersMsg()) e.push('Family members');
    }
    if (c.consumerNo.invalid || c.consumerName.invalid || c.consumerAddress.invalid || c.billAmount.invalid) e.push('Electricity bill');
    return e;
  });

  /* ---- step 3: document attach (sections depend on the chosen certificate) ---- */
  private readonly incomeProofs = ['Salary Slip / Salary Certificate', "Talati-cum-Mantri's Income Report", 'Income Tax Return (ITR)', 'Form 16',
    '7/12 and 8-A Extract (agricultural income)', 'Pension Payment Order', 'Self-Declaration of Income'];
  private readonly casteProofs = ["Father's Caste Certificate", 'School Leaving Certificate showing caste', "Blood relative's Caste Certificate", 'Revenue record showing caste'];
  docSections = computed<DocSection[]>(() => {
    const opts = (list: string[]) => list.map((d) => ({ label: d, value: d }));
    const billOk = this.verify() === 'yes';
    const list: DocSection[] = [{
      key: 'residence', icon: 'pi pi-home', title: 'Residence Proof Attachment (Any One)', label: 'Residence Proof Attachment (Any One)',
      options: opts(this.residenceProofs), required: !billOk, optionalNote: 'Optional — your electricity bill was verified in Service Details.',
    }];
    if (this.needsIncome()) {
      list.push(
        { key: 'income', icon: 'pi pi-wallet', title: "Applicant's Income Proof Attachment (Any One)", label: "Applicant's Income Proof Attachment (Any One)", options: opts(this.incomeProofs), required: true, optionalNote: '' },
        { key: 'famIncome', icon: 'pi pi-users', title: "Family Member's Income Proof Attachment (Any One)", label: "Family Member's Income Proof Attachment (Any One)", options: opts(this.incomeProofs), required: true, optionalNote: '' },
      );
    } else {
      list.push({ key: 'identity', icon: 'pi pi-id-card', title: 'Identity Proof Attachment (Any One)', label: 'Identity Proof Attachment (Any One)', options: opts(this.identityProofs), required: true, optionalNote: '' });
    }
    if (/caste|sebc|tribe|minority/i.test(this.cert())) {
      list.push({ key: 'caste', icon: 'pi pi-sitemap', title: 'Caste / Community Proof Attachment (Any One)', label: 'Caste / Community Proof Attachment (Any One)', options: opts(this.casteProofs), required: true, optionalNote: '' });
    }
    return list;
  });
  private docState = signal<Record<string, DocState>>({});
  private readonly blankDoc: DocState = { type: '', number: '' };
  doc(key: string): DocState { return this.docState()[key] ?? this.blankDoc; }
  setDoc(key: string, patch: Partial<DocState>) { this.docState.update((m) => ({ ...m, [key]: { ...(m[key] ?? this.blankDoc), ...patch } })); }
  /** A section is complete with a document type, its number and an attached file. */
  secBad(sec: DocSection) { const s = this.doc(sec.key); return sec.required && (!s.type || !s.number.trim() || !s.file); }

  private static readonly MAX = 1024 * 1024;
  private static readonly PHOTO_MAX = 200 * 1024;
  /** Browse: validate and stage the file; it is attached once the user clicks Upload. */
  browse(key: string, e: Event) {
    const f = this.takeFile(e);
    if (!f) return;
    const err = !/\.(pdf|jpe?g|png)$/i.test(f.name) ? 'Only PDF, JPG or PNG files are allowed.' : f.size > CertificatesPage.MAX ? `File is ${this.size(f.size)} — the limit is 1 MB.` : '';
    this.setDoc(key, err ? { staged: undefined, err } : { staged: f, err: '' });
  }
  /* Upload and DigiLocker are simulated here — nothing leaves the browser. Wire them to the document-store and DigiLocker APIs. */
  upload(key: string) {
    const s = this.doc(key);
    if (!s.staged) return;
    this.setDoc(key, { busy: 'upload' });
    setTimeout(() => this.setDoc(key, { busy: undefined, file: { name: s.staged!.name, size: s.staged!.size }, staged: undefined, source: 'upload' }), 600);
  }
  digiLocker(key: string) {
    const s = this.doc(key);
    if (!s.type || !s.number.trim()) { this.setDoc(key, { err: 'Select the document and enter its number to fetch it from DigiLocker.' }); return; }
    this.setDoc(key, { busy: 'digi', err: '' });
    setTimeout(() => this.setDoc(key, { busy: undefined, staged: undefined, source: 'digilocker', file: { name: s.type, size: 0 } }), 900);
  }
  removeDoc(key: string) { this.setDoc(key, { file: undefined, staged: undefined, source: undefined, err: '' }); }

  photo = signal<PhotoState>({});
  browsePhoto(e: Event) {
    const f = this.takeFile(e);
    if (!f) return;
    const err = !/\.(jpe?g|png)$/i.test(f.name) && !/^image\/(jpeg|png)$/.test(f.type) ? 'Only JPG or PNG photos are allowed.'
      : f.size > CertificatesPage.PHOTO_MAX ? `Photo is ${this.size(f.size)} — the limit is 200 KB.` : '';
    if (err) { this.photo.update((p) => ({ ...p, staged: undefined, err })); return; }
    this.revokePhoto();
    this.photo.set({ staged: f, url: URL.createObjectURL(f) }); // preview straight away
  }
  uploadPhoto() {
    const p = this.photo();
    if (!p.staged) return;
    this.photo.set({ ...p, busy: true });
    setTimeout(() => this.photo.set({ url: p.url, file: { name: p.staged!.name, size: p.staged!.size } }), 600);
  }
  removePhoto() { this.revokePhoto(); this.photo.set({}); }
  private revokePhoto() { const u = this.photo().url; if (u) URL.revokeObjectURL(u); }
  private takeFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = ''; // the same file can be chosen again after removing it
    return f;
  }

  step3Errors = computed(() => {
    const e = this.docSections().filter((s) => this.secBad(s)).map((s) => s.title.replace(' (Any One)', '').replace(' Attachment', ''));
    if (!this.photo().file) e.push('Photo');
    return e;
  });
  size(b: number) { return b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`; }

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePhoto()); // free the photo preview's object URL
    // ?cert=<title> preselects a certificate (e.g. linked from a service card)
    inject(ActivatedRoute).queryParamMap.pipe(takeUntilDestroyed()).subscribe((q) => {
      const c = q.get('cert');
      if (c && this.certs.some((o) => o.value === c)) this.cert.set(c);
    });
    // while "Same as Permanent Address" is ticked, the current address mirrors the permanent one
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => { if (this.form.controls.sameAsPerm.value) this.copyPermToCurrent(); });
  }

  /** Show a field's error once the user has left it or tried to continue. */
  bad(name: keyof typeof this.form.controls) {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.tried());
  }

  talukaOpts(district: string): Opt[] {
    return DISTRICTS.find((d) => d.code === district)?.talukas.map((t) => ({ label: both(t.en, t.gu), value: t.code })) ?? [];
  }
  villageOpts(district: string, taluka: string): Opt[] {
    const t = DISTRICTS.find((d) => d.code === district)?.talukas.find((x) => x.code === taluka);
    return t?.villages.map(([en, gu]) => ({ label: both(en, gu), value: en })) ?? [];
  }
  /** Changing a district clears its taluka and village; changing a taluka clears its village. */
  resetBelow(which: 'perm' | 'cur', level: 'district' | 'taluka') {
    const c = this.form.controls;
    if (level === 'district') (which === 'perm' ? c.permTaluka : c.curTaluka).setValue('');
    (which === 'perm' ? c.permVillage : c.curVillage).setValue('');
  }

  private readonly curFields = ['curAddress', 'curDistrict', 'curTaluka', 'curVillage'] as const;
  private copyPermToCurrent() {
    const v = this.form.getRawValue();
    this.form.patchValue({ curAddress: v.permAddress, curDistrict: v.permDistrict, curTaluka: v.permTaluka, curVillage: v.permVillage }, { emitEvent: false });
  }
  syncCurrent() {
    const same = this.form.controls.sameAsPerm.value;
    if (same) this.copyPermToCurrent();
    for (const k of this.curFields) {
      const c = this.form.controls[k];
      if (same) c.disable({ emitEvent: false }); else c.enable({ emitEvent: false });
    }
  }

  /** Name, mobile and parents' names come from the citizen profile; once pulled in they are read-only (as on the portal). */
  locked = signal(false);
  fillFromProfile() {
    this.form.patchValue(PROFILE);
    this.locked.set(true);
    if (this.form.controls.sameAsPerm.value) this.copyPermToCurrent();
  }

  fullName = computed(() => {
    this.step(); this.submitted(); // recompute when moving on
    const v = this.form.getRawValue();
    return [v.surname, v.firstName, v.middleName].filter(Boolean).join(' ');
  });

  /** Move focus to the first invalid control of a group (a text input, or a select's combobox). */
  private focusFirstInvalid(group: { controls: Record<string, { invalid: boolean }> }) {
    const first = Object.keys(group.controls).find((k) => group.controls[k].invalid);
    setTimeout(() => {
      const host = document.querySelector(`.cert [formcontrolname="${first}"], .cert [ng-reflect-name="${first}"]`);
      const target = host?.matches('input, textarea') ? host : host?.querySelector('[role="combobox"], input');
      (target as HTMLElement | null)?.focus();
    });
  }
  private show(s: 1 | 2 | 3) {
    this.step.set(s);
    setTimeout(() => document.querySelector('.cert-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  /** Stepper / Back buttons: only already-completed steps can be revisited. */
  goTo(s: number) { if (s < this.step()) this.show(s as 1 | 2 | 3); }

  /** Enter key / step-1 Next. */
  next() {
    if (this.step() === 2) { this.next2(); return; }
    if (this.step() !== 1) return;
    this.tried.set(true);
    if (this.form.invalid) { this.form.markAllAsTouched(); this.focusFirstInvalid(this.form); return; }
    this.show(2);
  }
  next2() {
    this.tried2.set(true);
    if (this.step2Errors().length) {
      this.svc.markAllAsTouched();
      // focus the first problem field that is actually on screen (family fields only exist for income certificates)
      const order = ['purpose', 'purposeOther', 'familyCount', 'earningCount', 'consumerNo', 'consumerName', 'billAmount', 'consumerAddress'] as const;
      const first = order.find((k) => this.svc.controls[k].invalid && (this.needsIncome() || !['familyCount', 'earningCount'].includes(k)));
      if (first) this.focusFirstInvalid({ controls: { [first]: { invalid: true } } });
      return;
    }
    this.declared.set(false);
    this.show(3);
  }

  /** Document Attach "Submit": once everything is attached, ask for the self-declaration first. */
  submit() {
    this.tried3.set(true);
    if (this.step3Errors().length) return;
    this.consentChecked.set(false);
    this.consentOpen.set(true);
  }

  /** "Village, Taluka, District" in English for the chosen codes. */
  private placeName(district: string, taluka: string, village: string) {
    const d = DISTRICTS.find((x) => x.code === district);
    const t = d?.talukas.find((x) => x.code === taluka);
    return [village, t && `Ta. ${t.en}`, d && `Dist. ${d.en}`].filter(Boolean).join(', ');
  }

  /* ---- self-declaration popup ---- */
  consentOpen = signal(false);
  consentChecked = signal(false);
  giveConsent() {
    if (!this.consentChecked()) return;
    this.consentOpen.set(false);
    this.submitted.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  /** Declaration text, filled in from what the applicant entered in steps 1 and 2. */
  declaration = computed(() => {
    if (!this.consentOpen()) return [] as string[];
    const a = this.form.getRawValue(), v = this.svcValue();
    const name = [a.firstName, a.middleName, a.surname].filter(Boolean).join(' ') || '—';
    const self = this.members().find((m) => m.relation === 'self');
    const occ = this.occupationOpts.filter((o) => v[o.key]).map((o) => o.label).join(' / ');
    const place = this.placeName(a.permDistrict, a.permTaluka, a.permVillage);
    const resident = [a.permAddress, place].filter(Boolean).join(', ');
    const intro = `I, the undersigned, ${name}${self ? `, aged ${self.age} year${self.age === 1 ? '' : 's'}` : ''}${occ ? `, ${occ} by occupation` : ''}, resident of ${resident || '—'} in the State of Gujarat, hereby solemnly declare that`;
    const common = 'The information given by me and the documents / enclosures submitted with this application are true to the best of my knowledge and belief, and nothing has been concealed in them. I am aware that submitting false information or documents is punishable under the law, and that any benefit received on the basis of false information or documents is liable to be cancelled.';
    if (!this.needsIncome()) {
      return [
        `${intro} the details given by me in this application for ${this.cert()} are true and correct.`,
        common,
        `Further, if any fact stated in the application is found to be false, or if I have knowingly submitted false facts or details, the certificate issued to me will be cancelled and this will be binding on me.`,
      ];
    }
    const t = this.totals().total, fam = Number(v.familyCount) || this.members().length, earn = Number(v.earningCount) || 0;
    return [
      `${intro} my family includes ${fam} member${fam === 1 ? '' : 's'}, of whom ${earn} ${earn === 1 ? 'member is an earner' : 'members are earners'}, and the total annual income of our family from all sources in the previous financial year is ₹${t.toLocaleString('en-IN')} (Rupees ${inWords(t)} only). We have not received any income certificate in the current financial year, and the details of all members of the family and our total annual income from all sources shown by us are true and correct.`,
      `${common} If any information or document regarding the total annual income of our family is found to be false, legal action may be taken against us under the provisions of the Bharatiya Nyaya Sanhita. Submission of false information constitutes a criminal offence, and we know this well.`,
      'Further, if any fact stated in the application is found to be false, or if it is found that we have knowingly submitted false facts or details, the income certificate issued to us will be cancelled and this will be binding on us.',
      "Further, we understand that the income certificate issued to us will be valid for three years, including the financial year in which it is issued. If there is any change in my or my family's income during this period, I undertake to inform the competent authority that issued the certificate voluntarily. If I make any mistake or omission in voluntarily informing about the additional income, I will be fully responsible for it.",
    ];
  });

  startOver() {
    this.form.reset();
    this.locked.set(false);
    this.svc.reset();
    this.farm.reset(); this.biz.reset(); this.job.reset();
    this.purposeChanged();
    this.members.set([]);
    this.cancelEdit();
    this.clearBill();
    this.syncCurrent();
    this.docState.set({});
    this.removePhoto();
    this.tried.set(false);
    this.tried2.set(false);
    this.tried3.set(false);
    this.declared.set(false);
    this.step.set(1);
    this.submitted.set(false);
    this.phase.set('overview');
    this.requestId.set(this.newRequestId());
  }
}
