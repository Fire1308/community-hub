import { supabase } from '@/integrations/supabase/client';

interface SendNotificationParams {
  type: 'reply' | 'mention' | 'reaction';
  recipientEmail: string;
  recipientName: string;
  actorName: string;
  threadTitle: string;
  threadSlug: string;
  content?: string;
  reactionType?: string;
}

export async function sendNotificationEmail(params: SendNotificationParams) {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: params,
    });

    if (error) {
      console.error('Error sending notification email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error invoking notification function:', error);
    return { success: false, error };
  }
}
