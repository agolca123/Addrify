export interface SMSTemplate {
    id: string;
    user_id: string;
    name: string;
    content: string;
    variables: string[];
    created_at: string;
    updated_at: string;
  }
  
  export interface SMSMessage {
    id: string;
    user_id: string;
    phone_number: string;
    content: string;
    direction: 'inbound' | 'outbound';
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    twilio_sid?: string;
    error_message?: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
  }
  
  export interface SMSWorkflow {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    is_active: boolean;
    trigger_type: 'new_customer' | 'schedule' | 'manual';
    trigger_config: Record<string, any>;
    created_at: string;
    updated_at: string;
  }
  
  export interface SMSWorkflowStep {
    id: string;
    workflow_id: string;
    template_id?: string;
    step_order: number;
    delay_minutes: number;
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    created_at: string;
    updated_at: string;
  }
  
  export interface SMSSettings {
    id: string;
    user_id: string;
    twilio_account_sid?: string;
    twilio_auth_token?: string;
    twilio_phone_number?: string;
    rate_limit: number;
    timezone: string;
    default_auto_reply?: string;
    created_at: string;
    updated_at: string;
  }