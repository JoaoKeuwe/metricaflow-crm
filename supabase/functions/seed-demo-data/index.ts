import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoDataRequest {
  clearExisting?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil não encontrado');
    }

    const companyId = profile.company_id;

    console.log(`Starting demo data generation for company: ${companyId}`);

    // Arrays de dados fictícios
    const empresas = [
      'TechSolutions Brasil', 'Inovare Consultoria', 'Digital Commerce', 'Logística Express',
      'Agronegócio Futuro', 'Construtora Horizonte', 'EduTech Plataformas', 'HealthCare Sistemas',
      'FinancePro Gestão', 'RetailMax Comércio', 'AutoParts Nacional', 'FoodTech Delivery',
      'CloudFirst Tecnologia', 'SecureNet Segurança', 'MobileTech Apps', 'DataAnalytics Pro',
      'SmartHome Solutions', 'EcoEnergy Sustentável', 'TravelTech Turismo', 'FashionHub Online'
    ];

    const nomes = [
      'Carlos Eduardo Silva', 'Mariana Costa Oliveira', 'Fernando Almeida Santos', 
      'Juliana Rodrigues Lima', 'Roberto Pereira Sousa', 'Patricia Ferreira Costa',
      'André Luis Santos', 'Beatriz Martins Rocha', 'Ricardo Oliveira Nunes',
      'Camila Souza Barros', 'Diego Ferreira Lima', 'Gabriela Santos Cruz',
      'Lucas Rodrigues Dias', 'Renata Almeida Melo', 'Thiago Costa Ribeiro',
      'Amanda Silva Cardoso', 'Bruno Martins Lopes', 'Carolina Pereira Souza',
      'Daniel Santos Araújo', 'Eduarda Lima Castro'
    ];

    const fontes = ['Website', 'Indicação', 'LinkedIn', 'Google Ads', 'WhatsApp', 'Evento'];
    
    const motivosPerdas = [
      'Preço muito alto',
      'Optou pela concorrência',
      'Sem orçamento no momento',
      'Não atende às necessidades',
      'Projeto cancelado',
      'Sem retorno do cliente'
    ];

    // Get all users in the company for assignment
    const { data: companyUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('company_id', companyId)
      .eq('active', true)
      .limit(10);

    if (usersError || !companyUsers || companyUsers.length === 0) {
      throw new Error('Nenhum usuário encontrado na empresa');
    }

    console.log(`Found ${companyUsers.length} users for assignment`);

    // Helper function to get random date in last 12 months
    const getRandomDate = (monthsAgo: number) => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    // Helper to get random item from array
    const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Helper to get random user
    const randomUser = () => random(companyUsers);

    // 1. CREATE LEADS (300 leads)
    console.log('Creating leads...');
    const leadsToInsert = [];
    const statusDistribution = [
      { status: 'novo', count: 40 },
      { status: 'contato', count: 35 },
      { status: 'qualificado', count: 45 },
      { status: 'proposta', count: 50 },
      { status: 'negociacao', count: 40 },
      { status: 'fechado', count: 60 },
      { status: 'perdido', count: 30 }
    ];

    let leadIndex = 0;
    for (const dist of statusDistribution) {
      for (let i = 0; i < dist.count; i++) {
        const monthsAgo = Math.floor(Math.random() * 12);
        const createdAt = getRandomDate(monthsAgo);
        const assignedUser = randomUser();
        
        leadsToInsert.push({
          company_id: companyId,
          name: nomes[leadIndex % nomes.length],
          company: empresas[leadIndex % empresas.length] + ` Ltda`,
          email: `contato${leadIndex}@${empresas[leadIndex % empresas.length].toLowerCase().replace(/\s/g, '')}.com.br`,
          phone: `+55${Math.floor(Math.random() * 90 + 10)}9${Math.floor(Math.random() * 90000000 + 10000000)}`,
          status: dist.status,
          source: random(fontes),
          assigned_to: assignedUser.id,
          qualificado: ['qualificado', 'proposta', 'negociacao', 'fechado'].includes(dist.status),
          motivo_perda: dist.status === 'perdido' ? random(motivosPerdas) : null,
          created_at: createdAt.toISOString(),
          updated_at: new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        leadIndex++;
      }
    }

    const { data: createdLeads, error: leadsError } = await supabase
      .from('leads')
      .insert(leadsToInsert)
      .select('id, status, assigned_to, created_at, company, name');

    if (leadsError) {
      console.error('Error creating leads:', leadsError);
      throw leadsError;
    }

    console.log(`Created ${createdLeads.length} leads`);

    // 2. CREATE LEAD VALUES (for closed leads)
    console.log('Creating lead values...');
    const closedLeads = createdLeads.filter(l => l.status === 'fechado');
    const leadValuesTypes = [
      { name: 'Setup Inicial', type: 'unico', min: 2000, max: 10000 },
      { name: 'Implementação', type: 'unico', min: 5000, max: 25000 },
      { name: 'Consultoria Estratégica', type: 'unico', min: 3000, max: 15000 },
      { name: 'Treinamento', type: 'unico', min: 1500, max: 8000 },
      { name: 'Migração de Dados', type: 'unico', min: 2500, max: 12000 },
      { name: 'Mensalidade Básica', type: 'recorrente', min: 500, max: 2000 },
      { name: 'Mensalidade Premium', type: 'recorrente', min: 2000, max: 5000 },
      { name: 'Suporte Técnico Mensal', type: 'recorrente', min: 300, max: 1500 },
      { name: 'Licença de Software', type: 'recorrente', min: 800, max: 4000 },
      { name: 'Manutenção Preventiva', type: 'recorrente', min: 400, max: 2000 }
    ];

    const leadValuesToInsert = [];
    for (const lead of closedLeads) {
      // Each closed lead gets 2-4 values
      const numValues = Math.floor(Math.random() * 3) + 2;
      const selectedTypes = [...leadValuesTypes].sort(() => 0.5 - Math.random()).slice(0, numValues);
      
      for (const valueType of selectedTypes) {
        const amount = Math.floor(Math.random() * (valueType.max - valueType.min) + valueType.min);
        leadValuesToInsert.push({
          lead_id: lead.id,
          company_id: companyId,
          name: valueType.name,
          value_type: valueType.type,
          amount: amount,
          notes: valueType.type === 'recorrente' ? 'Pagamento mensal via boleto' : 'Pagamento à vista',
          created_by: lead.assigned_to
        });
      }
    }

    if (leadValuesToInsert.length > 0) {
      const { error: valuesError } = await supabase
        .from('lead_values')
        .insert(leadValuesToInsert);

      if (valuesError) {
        console.error('Error creating lead values:', valuesError);
      } else {
        console.log(`Created ${leadValuesToInsert.length} lead values`);
      }
    }

    // 3. CREATE OBSERVATIONS
    console.log('Creating observations...');
    const noteTypes = [
      { type: 'Contato feito', weight: 40 },
      { type: 'Reunião agendada', weight: 15 },
      { type: 'Follow-up', weight: 20 },
      { type: 'Proposta enviada', weight: 10 },
      { type: 'Negociação em andamento', weight: 8 },
      { type: 'Negócio fechado', weight: 5 },
      { type: 'Lead perdido', weight: 2 }
    ];

    const observationContents = {
      'Contato feito': [
        'Cliente respondeu via WhatsApp demonstrando interesse',
        'Ligação realizada, cliente solicitou proposta comercial',
        'Email enviado com informações do produto',
        'Contato via LinkedIn estabelecido'
      ],
      'Reunião agendada': [
        'Reunião marcada para próxima semana às 14h',
        'Demo agendada para demonstração do sistema',
        'Reunião de alinhamento marcada com decisor'
      ],
      'Follow-up': [
        'Aguardando retorno do departamento financeiro',
        'Cliente solicitou mais 5 dias para análise',
        'Enviado material adicional conforme solicitado'
      ],
      'Proposta enviada': [
        'Proposta comercial enviada por email com prazo de 7 dias',
        'Orçamento detalhado enviado conforme requisitos'
      ],
      'Negociação em andamento': [
        'Cliente solicitou desconto de 15%',
        'Negociando condições de pagamento parcelado',
        'Ajustando escopo do projeto conforme feedback'
      ],
      'Negócio fechado': [
        'Contrato assinado! Início previsto para próximo mês',
        'Negócio fechado com sucesso! Cliente muito satisfeito'
      ],
      'Lead perdido': [
        'Cliente optou pela concorrência devido ao preço',
        'Projeto cancelado internamente pelo cliente',
        'Sem orçamento disponível no momento'
      ]
    };

    const observationsToInsert = [];
    for (const lead of createdLeads) {
      // Number of observations based on lead age and status
      const leadAge = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const numObservations = Math.min(Math.floor(leadAge / 15) + 2, 10);
      
      for (let i = 0; i < numObservations; i++) {
        const noteType = random(noteTypes.flatMap(nt => Array(nt.weight).fill(nt.type)));
        const contents = observationContents[noteType as keyof typeof observationContents];
        const content = random(contents);
        
        const obsDate = new Date(new Date(lead.created_at).getTime() + i * 5 * 24 * 60 * 60 * 1000);
        
        observationsToInsert.push({
          lead_id: lead.id,
          user_id: lead.assigned_to,
          note_type: noteType,
          content: content,
          created_at: obsDate.toISOString()
        });
      }
    }

    // Insert in batches to avoid timeout
    const batchSize = 500;
    for (let i = 0; i < observationsToInsert.length; i += batchSize) {
      const batch = observationsToInsert.slice(i, i + batchSize);
      const { error: obsError } = await supabase
        .from('lead_observations')
        .insert(batch);
      
      if (obsError) {
        console.error(`Error creating observations batch ${i}:`, obsError);
      }
    }
    console.log(`Created ${observationsToInsert.length} observations`);

    // 4. CREATE MEETINGS
    console.log('Creating meetings...');
    const meetingsToInsert = [];
    const meetingStatuses = ['agendada', 'realizada', 'cancelada'];
    const meetingTitles = [
      'Reunião de Prospecção',
      'Apresentação de Proposta',
      'Demo do Sistema',
      'Reunião de Negociação',
      'Reunião de Fechamento',
      'Follow-up Pós-Venda'
    ];

    // Create 250 meetings
    for (let i = 0; i < 250; i++) {
      const lead = random(createdLeads.filter(l => ['qualificado', 'proposta', 'negociacao', 'fechado'].includes(l.status)));
      const status = i < 75 ? 'agendada' : (i < 213 ? 'realizada' : 'cancelada'); // 30% agendada, 55% realizada, 15% cancelada
      
      let startTime: Date;
      if (status === 'agendada') {
        // Future meetings
        startTime = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
      } else {
        // Past meetings
        startTime = new Date(new Date(lead.created_at).getTime() + Math.random() * 60 * 24 * 60 * 60 * 1000);
      }
      
      const duration = [30, 45, 60][Math.floor(Math.random() * 3)];
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      
      meetingsToInsert.push({
        company_id: companyId,
        lead_id: lead.id,
        title: random(meetingTitles),
        description: 'Reunião comercial agendada via sistema',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: status,
        created_by: lead.assigned_to,
        feedback: status === 'realizada' ? (Math.random() > 0.3 ? 'Reunião produtiva, cliente interessado' : 'Cliente com dúvidas, necessário novo contato') : null,
        feedback_collected: status === 'realizada'
      });
    }

    const { data: createdMeetings, error: meetingsError } = await supabase
      .from('meetings')
      .insert(meetingsToInsert)
      .select('id, created_by');

    if (meetingsError) {
      console.error('Error creating meetings:', meetingsError);
    } else {
      console.log(`Created ${createdMeetings.length} meetings`);
      
      // Create meeting participants
      const participantsToInsert = [];
      for (const meeting of createdMeetings) {
        // Organizer
        participantsToInsert.push({
          meeting_id: meeting.id,
          user_id: meeting.created_by,
          is_organizer: true
        });
        
        // Add 0-2 additional participants
        const numParticipants = Math.floor(Math.random() * 3);
        const otherUsers = companyUsers.filter(u => u.id !== meeting.created_by);
        for (let i = 0; i < Math.min(numParticipants, otherUsers.length); i++) {
          participantsToInsert.push({
            meeting_id: meeting.id,
            user_id: otherUsers[i].id,
            is_organizer: false
          });
        }
      }
      
      const { error: participantsError } = await supabase
        .from('meeting_participants')
        .insert(participantsToInsert);
      
      if (participantsError) {
        console.error('Error creating participants:', participantsError);
      } else {
        console.log(`Created ${participantsToInsert.length} meeting participants`);
      }
    }

    // 5. CREATE TASKS
    console.log('Creating tasks...');
    const tasksToInsert = [];
    const taskTitles = [
      'Enviar proposta comercial',
      'Realizar follow-up de proposta',
      'Preparar apresentação para reunião',
      'Atualizar cadastro do cliente',
      'Ligar para confirmar reunião',
      'Enviar contrato para assinatura',
      'Agendar demo do sistema',
      'Solicitar referências do cliente'
    ];

    for (let i = 0; i < 400; i++) {
      const lead = random(createdLeads);
      const assignedUser = randomUser();
      const assignmentType = i < 240 ? 'individual' : (i < 360 ? 'multiple' : 'all');
      const status = i < 160 ? 'aberta' : (i < 260 ? 'em_andamento' : 'concluida');
      
      const createdAt = new Date(new Date(lead.created_at).getTime() + Math.random() * 45 * 24 * 60 * 60 * 1000);
      const dueDate = status === 'concluida' 
        ? new Date(createdAt.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000)
        : new Date(createdAt.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000);
      
      tasksToInsert.push({
        company_id: companyId,
        lead_id: lead.id,
        title: `${random(taskTitles)} - ${lead.company}`,
        description: 'Tarefa criada via sistema de gestão',
        assigned_to: assignedUser.id,
        created_by: lead.assigned_to,
        assignment_type: assignmentType,
        status: status,
        due_date: dueDate.toISOString(),
        created_at: createdAt.toISOString(),
        total_assigned: assignmentType === 'all' ? companyUsers.length : (assignmentType === 'multiple' ? Math.floor(Math.random() * 3) + 2 : 1),
        total_completed: status === 'concluida' ? (assignmentType === 'all' ? companyUsers.length : (assignmentType === 'multiple' ? Math.floor(Math.random() * 3) + 2 : 1)) : 0
      });
    }

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksToInsert);

    if (tasksError) {
      console.error('Error creating tasks:', tasksError);
    } else {
      console.log(`Created ${tasksToInsert.length} tasks`);
    }

    // 6. CREATE REMINDERS
    console.log('Creating reminders...');
    const remindersToInsert = [];
    const reminderDescriptions = [
      'Retornar cliente sobre dúvida técnica',
      'Enviar contrato para assinatura',
      'Ligar para confirmar pagamento',
      'Agendar reunião de follow-up',
      'Enviar relatório mensal',
      'Confirmar recebimento de documentos'
    ];

    for (let i = 0; i < 200; i++) {
      const lead = random(createdLeads);
      const completed = i < 120; // 60% completed
      const reminderDate = completed
        ? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      remindersToInsert.push({
        lead_id: lead.id,
        user_id: lead.assigned_to,
        description: random(reminderDescriptions),
        reminder_date: reminderDate.toISOString(),
        completed: completed
      });
    }

    const { error: remindersError } = await supabase
      .from('reminders')
      .insert(remindersToInsert);

    if (remindersError) {
      console.error('Error creating reminders:', remindersError);
    } else {
      console.log(`Created ${remindersToInsert.length} reminders`);
    }

    console.log('Demo data generation completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dados de demonstração criados com sucesso!',
        stats: {
          leads: createdLeads.length,
          leadValues: leadValuesToInsert.length,
          observations: observationsToInsert.length,
          meetings: meetingsToInsert.length,
          tasks: tasksToInsert.length,
          reminders: remindersToInsert.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in seed-demo-data:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
