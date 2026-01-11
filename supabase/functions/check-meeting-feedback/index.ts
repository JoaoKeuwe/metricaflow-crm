import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting meeting feedback check...');

    // Find meetings that ended 1 hour ago and need feedback
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select(`
        id,
        title,
        end_time,
        lead_id,
        feedback_collected,
        meeting_participants(user_id)
      `)
      .eq('status', 'agendada')
      .eq('feedback_collected', false)
      .lt('end_time', oneHourAgo.toISOString());

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
      throw meetingsError;
    }

    console.log(`Found ${meetings?.length || 0} meetings needing feedback`);

    if (!meetings || meetings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No meetings needing feedback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log meetings that need feedback (reminders functionality removed)
    const meetingsProcessed = meetings.length;
    console.log(`Processed ${meetingsProcessed} meetings needing feedback`);

    return new Response(
      JSON.stringify({
        message: 'Feedback check completed',
        meetingsProcessed: meetingsProcessed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-meeting-feedback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
