import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const demoEmail = 'demo@workflow360.com';
    const demoPassword = 'Demo@2024';
    
    console.log('Criando usuário demo...');

    // Criar usuário demo
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Usuário Demo',
        company_name: 'Empresa Demo - WorkFlow360'
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário:', authError);
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const userId = authData.user.id;
    console.log('Usuário criado:', userId);

    // Aguardar trigger criar perfil e empresa
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Buscar company_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    const companyId = profile?.company_id;
    if (!companyId) {
      throw new Error('Empresa não encontrada após criação do usuário');
    }

    console.log('Empresa criada:', companyId);

    // Dados de exemplo
    const empresas = ['Tech Solutions', 'Marketing Pro', 'Consultoria XYZ', 'Design Studio', 'E-commerce Plus'];
    const nomes = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza', 'Julia Lima', 'Roberto Alves', 'Fernanda Rocha'];
    const fontes = ['Google Ads', 'Facebook Ads', 'Instagram', 'LinkedIn', 'Indicação', 'Site', 'WhatsApp', 'Evento'];
    const motivosPerdas = ['Preço alto', 'Não tem orçamento', 'Escolheu concorrente', 'Não retornou contato', 'Projeto cancelado'];

    const getRandomDate = (startDaysAgo: number, endDaysAgo: number = 0) => {
      const now = new Date();
      const start = new Date(now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() - endDaysAgo * 24 * 60 * 60 * 1000);
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    const random = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    console.log('Gerando 300 leads...');

    // Criar 300 leads distribuídos pelos últimos 12 meses
    const leads = [];
    const statusDistribution = {
      'novo': 50,
      'contatado': 40,
      'qualificado': 35,
      'proposta': 30,
      'negociacao': 25,
      'fechado': 80,
      'perdido': 40
    };

    for (const [status, count] of Object.entries(statusDistribution)) {
      for (let i = 0; i < count; i++) {
        const createdDate = getRandomDate(365, 0);
        const lead = {
          company_id: companyId,
          assigned_to: userId,
          name: random(nomes),
          email: `${random(nomes).toLowerCase().replace(' ', '.')}@example.com`,
          phone: `(11) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
          company: random(empresas),
          source: random(fontes),
          status: status,
          qualificado: ['qualificado', 'proposta', 'negociacao', 'fechado'].includes(status),
          motivo_perda: status === 'perdido' ? random(motivosPerdas) : null,
          created_at: createdDate.toISOString(),
          updated_at: createdDate.toISOString()
        };
        leads.push(lead);
      }
    }

    const { data: insertedLeads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .insert(leads)
      .select('id, status, created_at');

    if (leadsError) throw leadsError;
    console.log(`${insertedLeads.length} leads criados`);

    // Criar valores para leads fechados
    console.log('Gerando valores para leads fechados...');
    const leadValues = [];
    const closedLeads = insertedLeads.filter(l => l.status === 'fechado');
    
    for (const lead of closedLeads) {
      const numValues = Math.floor(Math.random() * 3) + 2; // 2-4 valores
      const valueNames = ['Setup Inicial', 'Mensalidade Básica', 'Consultoria', 'Implementação', 'Suporte Premium'];
      
      for (let i = 0; i < numValues; i++) {
        leadValues.push({
          lead_id: lead.id,
          company_id: companyId,
          created_by: userId,
          name: valueNames[i % valueNames.length],
          value_type: i === 0 ? 'unico' : 'recorrente',
          amount: Math.floor(Math.random() * 5000) + 1000,
          notes: i === 0 ? 'Valor inicial de setup' : 'Valor mensal recorrente'
        });
      }
    }

    if (leadValues.length > 0) {
      const { error: valuesError } = await supabaseAdmin
        .from('lead_values')
        .insert(leadValues);
      if (valuesError) throw valuesError;
      console.log(`${leadValues.length} valores criados`);
    }

    // Criar observações
    console.log('Gerando observações...');
    const observations = [];
    const noteTypes = ['Contato feito', 'Reunião agendada', 'Proposta enviada', 'Negociação em andamento', 'Follow-up'];
    
    for (const lead of insertedLeads) {
      const numObs = Math.floor(Math.random() * 6) + 3; // 3-8 observações
      const leadDate = new Date(lead.created_at);
      
      for (let i = 0; i < numObs; i++) {
        const obsDate = new Date(leadDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        observations.push({
          lead_id: lead.id,
          user_id: userId,
          content: `Observação ${i + 1} para o lead. ${random(noteTypes)}.`,
          note_type: random(noteTypes),
          created_at: obsDate.toISOString()
        });
      }
    }

    const { error: obsError } = await supabaseAdmin
      .from('lead_observations')
      .insert(observations);
    if (obsError) throw obsError;
    console.log(`${observations.length} observações criadas`);

    // Criar reuniões
    console.log('Gerando reuniões...');
    const meetings = [];
    const qualifiedLeads = insertedLeads.filter(l => ['qualificado', 'proposta', 'negociacao', 'fechado'].includes(l.status));
    
    for (let i = 0; i < Math.min(250, qualifiedLeads.length); i++) {
      const lead = qualifiedLeads[i];
      const meetingDate = getRandomDate(365, -30); // Incluindo futuro próximo
      const startTime = new Date(meetingDate);
      startTime.setHours(Math.floor(Math.random() * 8) + 9, 0, 0, 0); // 9h-17h
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1h duração
      
      meetings.push({
        company_id: companyId,
        lead_id: lead.id,
        created_by: userId,
        title: `Reunião com ${lead.id}`,
        description: 'Reunião de apresentação e alinhamento',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: startTime < new Date() ? 'realizada' : 'agendada',
        feedback: startTime < new Date() ? 'Reunião produtiva, cliente interessado' : null
      });
    }

    const { data: insertedMeetings, error: meetingsError } = await supabaseAdmin
      .from('meetings')
      .insert(meetings)
      .select('id');
    if (meetingsError) throw meetingsError;
    console.log(`${insertedMeetings.length} reuniões criadas`);

    // Adicionar participantes
    const participants = insertedMeetings.map(m => ({
      meeting_id: m.id,
      user_id: userId,
      is_organizer: true
    }));
    await supabaseAdmin.from('meeting_participants').insert(participants);

    // Criar tarefas
    console.log('Gerando tarefas...');
    const tasks = [];
    
    for (let i = 0; i < 400; i++) {
      const lead = random(insertedLeads);
      const createdDate = getRandomDate(365);
      const dueDate = new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
      const isCompleted = dueDate < new Date() && Math.random() > 0.3;
      
      tasks.push({
        company_id: companyId,
        lead_id: lead.id,
        assigned_to: userId,
        created_by: userId,
        title: `Tarefa ${i + 1}`,
        description: 'Descrição da tarefa',
        due_date: dueDate.toISOString(),
        status: isCompleted ? 'concluida' : 'aberta',
        assignment_type: 'individual',
        created_at: createdDate.toISOString()
      });
    }

    const { error: tasksError } = await supabaseAdmin
      .from('tasks')
      .insert(tasks);
    if (tasksError) throw tasksError;
    console.log(`${tasks.length} tarefas criadas`);

    // Criar lembretes
    console.log('Gerando lembretes...');
    const reminders = [];
    
    for (let i = 0; i < 200; i++) {
      const lead = random(insertedLeads);
      const reminderDate = getRandomDate(30, -60); // Passado e futuro
      const isCompleted = reminderDate < new Date() && Math.random() > 0.4;
      
      reminders.push({
        lead_id: lead.id,
        user_id: userId,
        description: `Lembrete ${i + 1}`,
        reminder_date: reminderDate.toISOString(),
        completed: isCompleted
      });
    }

    const { error: remindersError } = await supabaseAdmin
      .from('reminders')
      .insert(reminders);
    if (remindersError) throw remindersError;
    console.log(`${reminders.length} lembretes criados`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conta demo criada com sucesso!',
        credentials: {
          email: demoEmail,
          password: demoPassword
        },
        stats: {
          leads: insertedLeads.length,
          values: leadValues.length,
          observations: observations.length,
          meetings: insertedMeetings.length,
          tasks: tasks.length,
          reminders: reminders.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
