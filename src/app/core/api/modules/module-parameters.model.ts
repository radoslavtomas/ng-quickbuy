export interface ModuleParametersResponse {
  parameters: {
    address: string;
    brand_name: string;
    code: string;
    description: string;
    description_lower: string;
    favicon: string;
    icon: string;
    icon_internal: string;
    open: boolean;
    opening_hours: string;
    phone: string;
    zendesk_chat: boolean;
  };
  source: {
    channel_description: string;
    channel_id: number;
    is_aggregator: boolean;
    source_code: string;
    source_description_no_agg_token: string;
    source_description: string;
  };
  switches: {
    cpd_show_modal: boolean;
    cpd_show_modal_autoexpires_at: string;
    cpd_show_modal_autoexpires_in: number;
    cpd_buyonline_suppressed: boolean;
    cpd_buyonline_suppressed_autoexpires_at: string;
    cpd_buyonline_suppressed_autoexpires_in: number;
    xmlhttp_debug_enabled: boolean;
    xmlhttp_debug_enabled_autoexpires_at: string;
    xmlhttp_debug_enabled_autoexpires_in: number;
  };
  system: {
    quote_duration_avg: number;
    quote_duration_max: number;
    quote_duration_min: number;
    quote_duration_last: number;
    switchedoff: boolean;
    switchedoff_message: string;
  };
  pdfs: {
    pdf_url_importantinformation: string;
    pdf_url_pcc: string;
    pdf_url_privacy: string;
    pdf_url_tob: string;
    pdf_url_idd: string;
  };
  autowrap: {
    autowrap_enabled: boolean;
    autowrap_target_branch: string;
    autowrap_affinity_code: string;
  };
  quotes: {
    quotes_allow_buyonline: boolean;
    quotes_auto_renew: string;
    quotes_branch_available: string;
    quotes_branch_default: string;
    quotes_partial_email_delay: number;
    quotes_partial_store: string;
    quotes_payment_day: string;
    quotes_premium_maximum: number;
    quotes_premium_minimum_monthly: number;
    quotes_requested: number;
    quotes_returned: number;
    quotes_scheme_list_module: string;
    quotes_scheme_list_notforbuyonline: string;
    quotes_scheme_list_quotelinedirect: string;
    quotes_scheme_list_sdponly: string;
    quotes_scheme_list_wholesale: string;
    quotes_scheme_list: string;
    quotes_vehicleage_maximum: string;
  };
  emails: {
    email_module_description: string;
    email_sender_normal: string;
    email_sender_payment: string;
    email_recipients_sales_primary: string;
    email_recipients_sales_secondary: string;
    email_recipients_store_primary: string;
  };
  renew_online: {
    renew_maximum_days_allowed: number;
    renew_maximum_premium_allowed: number;
    renew_minimum_premium_allowed: number;
  };
}
