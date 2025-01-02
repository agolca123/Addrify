import { supabase } from '../config/supabase';

export class SMSStatusWorker {
  private static instance: SMSStatusWorker;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval = 6 * 60 * 1000; // 6 dakika

  private constructor() {
    this.startWorker();
  }

  public static getInstance(): SMSStatusWorker {
    if (!SMSStatusWorker.instance) {
      SMSStatusWorker.instance = new SMSStatusWorker();
    }
    return SMSStatusWorker.instance;
  }

  private async checkMessageStatuses() {
    try {
      // Bekleyen veya gönderilmiş mesajları al
      const { data: messages, error } = await supabase
        .from('sms_messages')
        .select('*')
        .in('status', ['pending', 'sent'])
        .not('twilio_sid', 'is', null);

      if (error) throw error;

      for (const message of messages || []) {
        try {
          const { data: settings } = await supabase
            .from('sms_settings')
            .select('*')
            .eq('user_id', message.user_id)
            .single();

          if (!settings) continue;

          // Twilio API'den mesaj durumunu kontrol et
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${settings.twilio_account_sid}/Messages/${message.twilio_sid}.json`,
            {
              headers: {
                'Authorization': 'Basic ' + btoa(settings.twilio_account_sid + ':' + settings.twilio_auth_token)
              }
            }
          );

          const result = await response.json();

          // Mesaj durumunu güncelle
          await supabase
            .from('sms_messages')
            .update({ 
              status: result.status === 'delivered' ? 'delivered' : 'failed',
              error_message: result.error_message
            })
            .eq('id', message.id);

        } catch (err) {
          console.error('Mesaj durumu kontrol hatası:', err);
        }
      }
    } catch (error) {
      console.error('SMS durumu kontrolü hatası:', error);
    }
  }

  public startWorker() {
    if (!this.intervalId) {
      this.checkMessageStatuses(); // İlk kontrolü hemen yap
      this.intervalId = setInterval(() => {
        this.checkMessageStatuses();
      }, this.checkInterval);
    }
  }

  public stopWorker() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
} 