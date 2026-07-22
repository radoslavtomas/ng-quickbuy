import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';  ← enable when API is live
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import type { ModuleParametersResponse } from '../models/module-parameters.model';

// API_URL to use once the endpoint is live:
// const API_URL = 'https://myapiexample.test/module-parameters';

// ---------------------------------------------------------------------------
// Mock responses — remove once the API is live and switch to httpClient.get()
// ---------------------------------------------------------------------------
const MOCK_RESPONSES: Record<string, ModuleParametersResponse> = {
  'qld:HC': {
    parameters: {
      address: 'Quoteline Direct, Clipper House, Chester Road, Sale, Manchester M32 8AF',
      brand_name: 'Quoteline Direct',
      code: 'HC',
      description: 'House Insurance',
      description_lower: 'house insurance',
      favicon: 'https://media.quotelinedirect.co.uk/images/favicons/quotelinedirect/favicon.ico',
      icon: 'fa-home',
      icon_internal: 'fa-home',
      open: true,
      opening_hours: 'Mon-Fri: 9am to 5pm',
      phone: '0161 874 8032',
      zendesk_chat: false,
    },
    source: {
      channel_description: 'Web Direct',
      channel_id: 1,
      is_aggregator: false,
      source_code: 'INQQ',
      source_description_no_agg_token: 'QL Direct Web',
      source_description: 'QL Direct Web',
    },
    switches: {
      cpd_show_modal: false,
      cpd_show_modal_autoexpires_at: '',
      cpd_show_modal_autoexpires_in: 0,
      cpd_buyonline_suppressed: false,
      cpd_buyonline_suppressed_autoexpires_at: '',
      cpd_buyonline_suppressed_autoexpires_in: 0,
      xmlhttp_debug_enabled: false,
      xmlhttp_debug_enabled_autoexpires_at: '',
      xmlhttp_debug_enabled_autoexpires_in: 0,
    },
    system: {
      quote_duration_avg: 3,
      quote_duration_max: 6,
      quote_duration_min: 3,
      quote_duration_last: 6,
      switchedoff: false,
      switchedoff_message: '',
    },
    pdfs: {
      pdf_url_importantinformation: 'https://media.quotelinedirect.co.uk/files/pdfs/importantinformation/importantinformation-qld-jun-2026.pdf',
      pdf_url_pcc: 'https://media.quotelinedirect.co.uk/files/pdfs/precontractcreditinfo/Home.pdf',
      pdf_url_privacy: 'https://media.quotelinedirect.co.uk/files/pdfs/privacypolicy/quotelinedirect/QuotelineDirectPrivacyNotice.pdf',
      pdf_url_tob: 'https://media.quotelinedirect.co.uk/files/pdfs/termsofbusiness/quotelinedirect/TOB-Consolidated-26.04.2021.pdf',
      pdf_url_idd: 'https://media.quotelinedirect.co.uk/files/pdfs/idd/IDD-QuotelineDirect-072025.pdf',
    },
    autowrap: { autowrap_enabled: true, autowrap_target_branch: 'D', autowrap_affinity_code: 'BOL' },
    quotes: {
      quotes_allow_buyonline: true,
      quotes_auto_renew: 'Y',
      quotes_branch_available: 'H',
      quotes_branch_default: 'H',
      quotes_partial_email_delay: 5,
      quotes_partial_store: 'Y',
      quotes_payment_day: '00',
      quotes_premium_maximum: 4999,
      quotes_premium_minimum_monthly: 9.33,
      quotes_requested: 50,
      quotes_returned: 10,
      quotes_scheme_list_module: '',
      quotes_scheme_list_notforbuyonline: 'SR',
      quotes_scheme_list_quotelinedirect: '',
      quotes_scheme_list_sdponly: '',
      quotes_scheme_list_wholesale: '',
      quotes_scheme_list: 'N*',
      quotes_vehicleage_maximum: '',
    },
    emails: {
      email_module_description: 'house insurance',
      email_sender_normal: 'onlinequote@quotelinedirect.co.uk',
      email_sender_payment: 'onlinequote@quotelinedirect.co.uk',
      email_recipients_sales_primary: 'home.customerservice@quotelinedirect.co.uk',
      email_recipients_sales_secondary: 'api-sales-alerts@quotelinedirect.co.uk',
      email_recipients_store_primary: 'home.newbusiness@quotelinedirect.co.uk',
    },
    renew_online: { renew_maximum_days_allowed: 30, renew_maximum_premium_allowed: 9999, renew_minimum_premium_allowed: 30 },
  },
  'qld:GV': {
    parameters: {
      address: 'Quoteline Direct, Clipper House, Chester Road, Sale, Manchester M32 8AF',
      brand_name: 'Quoteline Direct',
      code: 'GV',
      description: 'Van Insurance',
      description_lower: 'van insurance',
      favicon: 'https://media.quotelinedirect.co.uk/images/favicons/quotelinedirect/favicon.ico',
      icon: 'fa-truck',
      icon_internal: 'fa-truck',
      open: true,
      opening_hours: 'Mon-Fri: 9am to 5pm',
      phone: '0161 874 7710',
      zendesk_chat: false,
    },
    source: { channel_description: 'Web Direct', channel_id: 1, is_aggregator: false, source_code: 'INQQ', source_description_no_agg_token: 'QL Direct Web', source_description: 'QL Direct Web' },
    switches: { cpd_show_modal: false, cpd_show_modal_autoexpires_at: '', cpd_show_modal_autoexpires_in: 0, cpd_buyonline_suppressed: false, cpd_buyonline_suppressed_autoexpires_at: '', cpd_buyonline_suppressed_autoexpires_in: 0, xmlhttp_debug_enabled: false, xmlhttp_debug_enabled_autoexpires_at: '', xmlhttp_debug_enabled_autoexpires_in: 0 },
    system: { quote_duration_avg: 3, quote_duration_max: 6, quote_duration_min: 3, quote_duration_last: 6, switchedoff: false, switchedoff_message: '' },
    pdfs: { pdf_url_importantinformation: '', pdf_url_pcc: '', pdf_url_privacy: '', pdf_url_tob: '', pdf_url_idd: '' },
    autowrap: { autowrap_enabled: true, autowrap_target_branch: 'D', autowrap_affinity_code: 'BOL' },
    quotes: { quotes_allow_buyonline: true, quotes_auto_renew: 'Y', quotes_branch_available: 'H', quotes_branch_default: 'H', quotes_partial_email_delay: 5, quotes_partial_store: 'Y', quotes_payment_day: '00', quotes_premium_maximum: 4999, quotes_premium_minimum_monthly: 9.33, quotes_requested: 50, quotes_returned: 10, quotes_scheme_list_module: '', quotes_scheme_list_notforbuyonline: '', quotes_scheme_list_quotelinedirect: '', quotes_scheme_list_sdponly: '', quotes_scheme_list_wholesale: '', quotes_scheme_list: 'N*', quotes_vehicleage_maximum: '' },
    emails: { email_module_description: 'van insurance', email_sender_normal: 'onlinequote@quotelinedirect.co.uk', email_sender_payment: 'onlinequote@quotelinedirect.co.uk', email_recipients_sales_primary: '', email_recipients_sales_secondary: '', email_recipients_store_primary: '' },
    renew_online: { renew_maximum_days_allowed: 30, renew_maximum_premium_allowed: 9999, renew_minimum_premium_allowed: 30 },
  },
  'chq:TX': {
    parameters: {
      address: 'ChoiceQuote, Spectrum Building, 55 Blythswood Street, Glasgow G2 7AT',
      brand_name: 'ChoiceQuote',
      code: 'TX',
      description: 'Taxi Insurance',
      description_lower: 'taxi insurance',
      favicon: '',
      icon: 'fa-taxi',
      icon_internal: 'fa-taxi',
      open: true,
      opening_hours: 'Mon-Fri: 9am to 5pm',
      phone: '0161 929 2837',
      zendesk_chat: false,
    },
    source: { channel_description: 'Web Direct', channel_id: 1, is_aggregator: false, source_code: 'INQQ', source_description_no_agg_token: 'CHQ Web', source_description: 'CHQ Web' },
    switches: { cpd_show_modal: false, cpd_show_modal_autoexpires_at: '', cpd_show_modal_autoexpires_in: 0, cpd_buyonline_suppressed: false, cpd_buyonline_suppressed_autoexpires_at: '', cpd_buyonline_suppressed_autoexpires_in: 0, xmlhttp_debug_enabled: false, xmlhttp_debug_enabled_autoexpires_at: '', xmlhttp_debug_enabled_autoexpires_in: 0 },
    system: { quote_duration_avg: 3, quote_duration_max: 6, quote_duration_min: 3, quote_duration_last: 6, switchedoff: false, switchedoff_message: '' },
    pdfs: { pdf_url_importantinformation: '', pdf_url_pcc: '', pdf_url_privacy: '', pdf_url_tob: '', pdf_url_idd: '' },
    autowrap: { autowrap_enabled: false, autowrap_target_branch: '', autowrap_affinity_code: '' },
    quotes: { quotes_allow_buyonline: true, quotes_auto_renew: 'Y', quotes_branch_available: 'H', quotes_branch_default: 'H', quotes_partial_email_delay: 5, quotes_partial_store: 'Y', quotes_payment_day: '00', quotes_premium_maximum: 9999, quotes_premium_minimum_monthly: 20, quotes_requested: 50, quotes_returned: 10, quotes_scheme_list_module: '', quotes_scheme_list_notforbuyonline: '', quotes_scheme_list_quotelinedirect: '', quotes_scheme_list_sdponly: '', quotes_scheme_list_wholesale: '', quotes_scheme_list: 'N*', quotes_vehicleage_maximum: '' },
    emails: { email_module_description: 'taxi insurance', email_sender_normal: '', email_sender_payment: '', email_recipients_sales_primary: '', email_recipients_sales_secondary: '', email_recipients_store_primary: '' },
    renew_online: { renew_maximum_days_allowed: 30, renew_maximum_premium_allowed: 9999, renew_minimum_premium_allowed: 30 },
  },
};

function buildMockKey(brandId: string, moduleCode: string): string {
  return `${brandId}:${moduleCode}`;
}

function buildFallbackMock(brandId: string, moduleCode: string, referrer: string): ModuleParametersResponse {
  return {
    parameters: {
      address: '',
      brand_name: brandId,
      code: moduleCode,
      description: moduleCode,
      description_lower: moduleCode.toLowerCase(),
      favicon: '',
      icon: 'fa-shield-halved',
      icon_internal: 'fa-shield-halved',
      open: true,
      opening_hours: 'Mon-Fri: 9am to 5pm',
      phone: '',
      zendesk_chat: false,
    },
    source: { channel_description: 'Web Direct', channel_id: 1, is_aggregator: false, source_code: referrer || 'INQQ', source_description_no_agg_token: '', source_description: '' },
    switches: { cpd_show_modal: false, cpd_show_modal_autoexpires_at: '', cpd_show_modal_autoexpires_in: 0, cpd_buyonline_suppressed: false, cpd_buyonline_suppressed_autoexpires_at: '', cpd_buyonline_suppressed_autoexpires_in: 0, xmlhttp_debug_enabled: false, xmlhttp_debug_enabled_autoexpires_at: '', xmlhttp_debug_enabled_autoexpires_in: 0 },
    system: { quote_duration_avg: 3, quote_duration_max: 6, quote_duration_min: 3, quote_duration_last: 6, switchedoff: false, switchedoff_message: '' },
    pdfs: { pdf_url_importantinformation: '', pdf_url_pcc: '', pdf_url_privacy: '', pdf_url_tob: '', pdf_url_idd: '' },
    autowrap: { autowrap_enabled: false, autowrap_target_branch: '', autowrap_affinity_code: '' },
    quotes: { quotes_allow_buyonline: true, quotes_auto_renew: 'Y', quotes_branch_available: 'H', quotes_branch_default: 'H', quotes_partial_email_delay: 5, quotes_partial_store: 'Y', quotes_payment_day: '00', quotes_premium_maximum: 9999, quotes_premium_minimum_monthly: 0, quotes_requested: 0, quotes_returned: 0, quotes_scheme_list_module: '', quotes_scheme_list_notforbuyonline: '', quotes_scheme_list_quotelinedirect: '', quotes_scheme_list_sdponly: '', quotes_scheme_list_wholesale: '', quotes_scheme_list: '', quotes_vehicleage_maximum: '' },
    emails: { email_module_description: '', email_sender_normal: '', email_sender_payment: '', email_recipients_sales_primary: '', email_recipients_sales_secondary: '', email_recipients_store_primary: '' },
    renew_online: { renew_maximum_days_allowed: 30, renew_maximum_premium_allowed: 9999, renew_minimum_premium_allowed: 0 },
  };
}

@Injectable({ providedIn: 'root' })
export class ModuleParametersService {
  // TODO: uncomment when the API is live
  // private readonly http = inject(HttpClient);

  /**
   * Fetch module parameters for a given brand, module code and optional referrer.
   *
   * Replace the `of(mock)` call below with:
   *   return this.http.get<ModuleParametersResponse>(API_URL, { params });
   */
  fetchParameters(brandId: string, moduleCode: string, referrer = ''): Observable<ModuleParametersResponse> {
    // TODO: switch to real HTTP when API is ready
    // const params = new HttpParams()
    //   .set('brand', brandId)
    //   .set('module', moduleCode)
    //   .set('referrer', referrer);
    // return this.http.get<ModuleParametersResponse>(API_URL, { params });

    const key = buildMockKey(brandId, moduleCode);
    const mock = MOCK_RESPONSES[key] ?? buildFallbackMock(brandId, moduleCode, referrer);
    return of(mock).pipe(delay(50));
  }
}

