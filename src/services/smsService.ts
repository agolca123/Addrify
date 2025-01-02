import { supabase } from '../config/supabase';

interface SMSSettings {
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
}

export const sendSMS = async (phoneNumber: string, content: string, userId: string) => {
  try {
    // SMS ayarlarını al
    const { data: settings, error: settingsError } = await supabase
      .from('sms_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) throw new Error('SMS ayarları bulunamadı');
    if (!settings) throw new Error('SMS ayarları yapılandırılmamış');

    // Telefon numarasını formatla (başında + işareti olduğundan emin ol)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Önce doğrulanmış numaraları kontrol et
    const { data: verifiedNumbers } = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${settings.twilio_account_sid}/OutgoingCallerIds.json`, {
      headers: {
        'Authorization': 'Basic ' + btoa(settings.twilio_account_sid + ':' + settings.twilio_auth_token)
      }
    }).then(res => res.json());

    const isVerified = verifiedNumbers?.caller_ids?.some(
      (number: any) => number.phone_number === formattedPhone
    );

    if (!isVerified) {
      // Doğrulama gerekiyorsa, doğrulama isteği gönder
      const verificationResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${settings.twilio_account_sid}/OutgoingCallerIds.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(settings.twilio_account_sid + ':' + settings.twilio_auth_token),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'PhoneNumber': formattedPhone
        })
      });

      const verificationResult = await verificationResponse.json();
      
      if (!verificationResponse.ok) {
        throw new Error(`Bu numara doğrulanmamış. Lütfen ${formattedPhone} numarasını Twilio panelinden doğrulayın: twilio.com/console/phone-numbers/verified`);
      }

      // Doğrulama bekliyor durumunda mesajı kaydet
      await supabase
        .from('sms_messages')
        .insert([{
          user_id: userId,
          phone_number: formattedPhone,
          content: content,
          direction: 'outbound',
          status: 'pending_verification',
          metadata: { verification_sid: verificationResult.sid }
        }]);

      throw new Error(`${formattedPhone} numarasına doğrulama kodu gönderildi. Lütfen Twilio panelinden doğrulama işlemini tamamlayın.`);
    }

    // Doğrulanmış numaraya mesaj gönder
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + settings.twilio_account_sid + '/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(settings.twilio_account_sid + ':' + settings.twilio_auth_token),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'To': formattedPhone,
        'From': settings.twilio_phone_number,
        'Body': content
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'SMS gönderilemedi');
    }

    // Başarılı mesajı veritabanına kaydet
    const { error: insertError } = await supabase
      .from('sms_messages')
      .insert([{
        user_id: userId,
        phone_number: formattedPhone,
        content: content,
        direction: 'outbound',
        status: 'sent',
        twilio_sid: result.sid,
        metadata: {}
      }]);

    if (insertError) throw insertError;

    return result;
  } catch (error) {
    console.error('SMS gönderme hatası:', error);
    throw error;
  }
};