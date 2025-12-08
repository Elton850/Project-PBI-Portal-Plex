const models = window['powerbi-client'].models;
const reportContainer = document.getElementById('reportContainer');

const DATE_TABLE = 'dCalendario';
const DATE_COLUMN = 'Id Data';
const SLICER_NAME = '82ec0c83f9d9cb6e72e8';

const USER_TABLE = 'dResponsavel';   // ajuste para o nome da tabela no PBI
const USER_COLUMN = 'RESPONSAVEL';

let currentModule = 'PLEX'; // padrão

// ===== Helpers de data =====

function getCurrentMonthRange() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  return { inicio: primeiroDia, fim: hoje };
}

function pbiDateISO(d) {
  return d.toISOString();
}

function pbiDateStringLog(d) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia} 00:00:00`;
}

function buildDateFilter(range) {
  return {
    $schema: 'http://powerbi.com/product/schema#advanced',
    target: {
      table: DATE_TABLE,
      column: DATE_COLUMN
    },
    filterType: models.FilterType.Advanced,
    logicalOperator: 'And',
    conditions: [
      {
        operator: 'GreaterThanOrEqual',
        value: pbiDateISO(range.inicio)
      },
      {
        operator: 'LessThanOrEqual',
        value: pbiDateISO(range.fim)
      }
    ]
  };
}

// ===== Aplicações de filtro/zoom =====

async function applyDateSlicer(report, dateFilter, slicerName) {
  const pages = await report.getPages();
  const activePage = pages.find(p => p.isActive);
  if (!activePage) return;

  const visuals = await activePage.getVisuals();
  const slicer = visuals.find(
    v => v.type === 'slicer' && v.name === slicerName
  );

  if (!slicer) {
    console.warn('Slicer de data não encontrado (verifique SLICER_NAME).');
    return;
  }

  await slicer.setSlicerState({ filters: [dateFilter] });
  console.log('Slicer de data ajustado para módulo', currentModule);
}

async function applyReportDateFilter(report, dateFilter, range) {
  try {
    await report.updateFilters(models.FiltersOperations.ReplaceAll, [dateFilter]);
    console.log(
      `Filtro de data de relatório (${currentModule}):`,
      pbiDateStringLog(range.inicio),
      'até',
      pbiDateStringLog(range.fim)
    );
  } catch (error) {
    console.error('Erro ao aplicar filtro de data no relatório:', error);
  }
}

async function applyDepartmentFilter(report, departamento) {
  if (!departamento) return;

  const pageFilter = {
    $schema: 'http://powerbi.com/product/schema#basic',
    target: {
      table: 'dDep',
      column: 'DEPARTAMENTO'
    },
    operator: 'In',
    values: [departamento],
    filterType: models.FilterType.Basic
  };

  try {
    const activePage = await report.getActivePage();
    await activePage.updateFilters(models.FiltersOperations.Add, [pageFilter]);
    console.log('Filtro de departamento aplicado:', departamento);
  } catch (err) {
    console.error('Erro ao aplicar filtro de departamento:', err);
  }
}

async function applyZoom(report) {
  await report.updateSettings({
    layoutType: models.LayoutType.Custom,
    customLayout: {
      displayOption: models.DisplayOption.FitToWidth
    }
  });
}

async function applyUserNameFilter(report, userName) {
  if (!userName) return;

  const userFilter = {
    $schema: 'https://powerbi.com/product/schema#basic',
    target: {
      table: USER_TABLE,
      column: USER_COLUMN
    },
    operator: 'In',
    values: [userName],
    filterType: models.FilterType.Basic
  };

  try {
    const activePage = await report.getActivePage();
    await activePage.updateFilters(models.FiltersOperations.Add, [userFilter]);
    console.log('Filtro por nome de usuário aplicado (PLEX):', userName);
  } catch (err) {
    console.error('Erro ao aplicar filtro por nome de usuário (PLEX):', err);
  }
}

// ===== Carregar relatório para um módulo =====

async function loadReport(moduleKey) {
  currentModule = moduleKey || 'GDR';

  try {
    const resp = await fetch(`/api/powerbi/embed-config?module=${currentModule}`);
    if (!resp.ok) throw new Error('Falha ao buscar embed-config');

    const data = await resp.json();
    const { reportId, embedUrl, accessToken, user, module } = data;

    // atualiza currentModule com o que veio do backend (caso normalize)
    currentModule = module;

    const config = {
      type: 'report',
      tokenType: models.TokenType.Embed,
      accessToken: accessToken,
      embedUrl: embedUrl,
      id: reportId,
      settings: {
        panes: {
          filters: { visible: false },
          pageNavigation: { visible: false }
        }
      }
    };

    powerbi.reset(reportContainer);
    const report = powerbi.embed(reportContainer, config);

    report.on('loaded', async () => {
      console.log(`Relatório carregado para módulo: ${currentModule}`);


        // <<< AQUI: listar todos os visuais da página ativa >>>
        const pages = await report.getPages();
        const activePage = pages.find(p => p.isActive);

        if (activePage) {
          const visuals = await activePage.getVisuals();
          console.log('VISUAIS DA PÁGINA ATIVA:');
          visuals.forEach(v => {
            console.log({
              name: v.name,
              title: v.title,
              type: v.type
            });
          });
        } else {
          console.warn('Nenhuma página ativa encontrada ao listar visuais.');
        }
        // <<< FIM DO BLOCO DE LISTAGEM >>>


      const range = getCurrentMonthRange();
      const dateFilter = buildDateFilter(range);
      
      // Filtro de RELATÓRIO (data): por enquanto apenas GDR
      switch (currentModule) {
        case 'GDR': {  
          const slicerName = "82ec0c83f9d9cb6e72e8";  // SLICER GDR
          await applyDateSlicer(report, dateFilter, slicerName);
          break;
        }
        case 'PLEX': {
          const slicerName = "2d104d98970d3a7dc1f5";  // SLICER PLEX
          await applyDateSlicer(report, dateFilter, slicerName);
          if (user && user.nome) {
            await applyUserNameFilter(report, user.nome);
          }
          break;
        }
        case 'UGB': {
          const slicerName = "775b9532019047221800";  // SLICER PLEX
          await applyDateSlicer(report, dateFilter, slicerName);
          break;
        }
        default:
          console.warn("Módulo desconhecido:", currentModule);
      }

      // Filtro de DEPARTAMENTO: mantido para todos (se desejar mudar, condicionar aqui)
      if (currentModule === 'GDR') {
        await applyDepartmentFilter(report, user && user.departamento);
      }

      await applyZoom(report);
    });

    report.on('error', event => {
      console.error('Erro no report embed:', event.detail);
    });
  } catch (err) {
    console.error('Erro ao carregar relatório:', err);
    if (reportContainer) {
      reportContainer.innerHTML = '<p>Erro ao carregar o relatório.</p>';
    }
  }
}

function setupSidebarNavigation() {
  const items = document.querySelectorAll('.sidebar-item');

  items.forEach(item => {
    item.addEventListener('click', evt => {
      const module = item.getAttribute('data-module');

      // USERS → navegação normal para /users
      if (module === 'USERS') {
        return;
      }

      // PLEX / GDR / UGB → SPA
      evt.preventDefault();

      // Atualiza visualmente o item ativo
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Atualiza a URL (sem recarregar página)
      const newUrl = `${window.location.pathname}?module=${module}`;
      window.history.pushState({}, '', newUrl);

      // Carrega o relatório
      loadReport(module);
    });
  });
}

// ===== inicialização =====
setupSidebarNavigation();

// lê ?module=XXX da URL (se vier de /users)
const params = new URLSearchParams(window.location.search);
const initialModule = params.get('module') || 'PLEX';

// marca o item correto como ativo
const sidebarItems = document.querySelectorAll('.sidebar-item');
sidebarItems.forEach(i => {
  const module = i.getAttribute('data-module');
  if (module === initialModule) {
    i.classList.add('active');
  } else if (module !== 'USERS') {
    i.classList.remove('active');
  }
});

// carrega o relatório do módulo inicial
loadReport(initialModule);