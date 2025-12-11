const models = window['powerbi-client'].models;
const reportContainer = document.getElementById('reportContainer');

const DATE_TABLE = 'dCalendario';
const DATE_COLUMN = 'Id Data';

const USER_TABLE = 'dResponsavel';
const USER_COLUMN = 'RESPONSAVEL';

let currentModule = 'PLEX';

// ===================== Helpers =====================

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
    target: { table: DATE_TABLE, column: DATE_COLUMN },
    filterType: models.FilterType.Advanced,
    logicalOperator: 'And',
    conditions: [
      { operator: 'GreaterThanOrEqual', value: pbiDateISO(range.inicio) },
      { operator: 'LessThanOrEqual', value: pbiDateISO(range.fim) }
    ]
  };
}

// ===================== Filtros =====================

async function applyDateSlicer(report, dateFilter, slicerName) {
  const pages = await report.getPages();
  const activePage = pages.find(p => p.isActive);
  if (!activePage) return;

  const visuals = await activePage.getVisuals();
  const slicer = visuals.find(v => v.type === 'slicer' && v.name === slicerName);

  if (!slicer) return console.warn('Slicer de data não encontrado:', slicerName);

  await slicer.setSlicerState({ filters: [dateFilter] });
}

async function applyReportDateFilter(report, dateFilter, range) {
  try {
    await report.updateFilters(models.FiltersOperations.ReplaceAll, [dateFilter]);
    console.log(
      `Filtro de data (${currentModule}):`,
      pbiDateStringLog(range.inicio),
      '→',
      pbiDateStringLog(range.fim)
    );
  } catch (err) {
    console.error('Erro ao aplicar filtro de data:', err);
  }
}

async function applyUserNameFilter(report, userName) { 
    if (!userName) return; 
    const userFilter = { 
      $schema: 'https://powerbi.com/product/schema#basic', 
      target: { table: USER_TABLE, column: USER_COLUMN }, 
      operator: 'In', values: [userName], 
      filterType: models.FilterType.Basic 
    }; 
    
    try { 
      const activePage = await report.getActivePage(); 
      await activePage.updateFilters(models.FiltersOperations.Add, [userFilter]); 
      console.log('Filtro por nome de usuário aplicado (PLEX):', userName); 
    } 
    catch (err) { 
      console.error('Erro ao aplicar filtro por nome de usuário (PLEX):', err); 
    } 
  }

// ===================== Filtro direto em dDep =====================

async function applyDepartmentSlicer(report, departamentos) {
  // departamentos pode vir como array ou string
  let filtrosDep = [];

  if (Array.isArray(departamentos)) {
    filtrosDep = departamentos
      .filter(Boolean)                  // tira null/undefined/vazio
      .map(d => d.trim())
      .filter(d => d.length > 0);
  } else if (typeof departamentos === 'string') {
    filtrosDep = departamentos
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);
  }

  if (!filtrosDep.length) {
    console.warn('Nenhum departamento válido para filtro:', departamentos);
    return;
  }

  console.log('Departamentos normalizados para filtro em dDep:', filtrosDep);

  const depFilter = {
    $schema: 'https://powerbi.com/product/schema#basic',
    target: {
      table: 'dDep',
      column: 'DEPARTAMENTO'
    },
    operator: 'In',
    values: filtrosDep,               // <- values: filtrosDep
    filterType: models.FilterType.Basic
  };

  try {
    // aplica no RELATÓRIO todo (todas as páginas)
    await report.updateFilters(models.FiltersOperations.Add, [depFilter]);
    console.log('Filtro de departamento aplicado em dDep:', filtrosDep);
  } catch (err) {
    console.error('Erro ao aplicar filtro de departamento em dDep:', err);
  }
}

// ===================== Menu =====================

function setActiveModule(module) {
  document.querySelectorAll('.sidebar-item').forEach(i => {
    const m = i.getAttribute('data-module');
    i.classList.toggle('active', m === module);
  });
}

// ===================== Carregar Relatório =====================

async function loadReport(moduleKey) {
  currentModule = moduleKey || 'PLEX';

  try {
    const resp = await fetch(`/api/powerbi/embed-config?module=${currentModule}`);
    if (!resp.ok) return;

    const data = await resp.json();
    const { reportId, embedUrl, accessToken, user, module } = data;

    currentModule = module;

    const newUrl = `${window.location.pathname}?module=${currentModule}`;
    window.history.pushState({}, '', newUrl);
    setActiveModule(currentModule);

    const config = {
      type: 'report',
      tokenType: models.TokenType.Embed,
      accessToken,
      embedUrl,
      id: reportId,
      settings: { panes: { filters: { visible: false }, pageNavigation: { visible: false } } }
    };

    powerbi.reset(reportContainer);
    const report = powerbi.embed(reportContainer, config);

    report.on('loaded', async () => {
      const range = getCurrentMonthRange();
      const dateFilter = buildDateFilter(range);

      switch (currentModule) {
        case 'GDR': {
          await applyDateSlicer(report, dateFilter, '82ec0c83f9d9cb6e72e8');
          await applyReportDateFilter(report, dateFilter, range);

          const depsFromUser =
          user && (user.departamentos || user.departamento || []);

          await applyDepartmentSlicer(report,depsFromUser);
          break;
        }

        case 'PLEX': {
          await applyDateSlicer(report, dateFilter, '2d104d98970d3a7dc1f5');
          await applyUserNameFilter(report, user.nome);
          break;
        }

        case 'UGB': {
          await applyDateSlicer(report, dateFilter, '775b9532019047221800');
          break;
        }
      }
    });

  } catch (err) {
    console.error('Erro ao carregar relatório:', err);
  }
}

// ===================== Sidebar =====================

function setupSidebarNavigation() {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', evt => {
      const module = item.getAttribute('data-module');

      if (module === 'USERS') return; // deixa carregar pagina normal
      evt.preventDefault();
      loadReport(module);
    });
  });
}

// ===================== Init =====================

setupSidebarNavigation();

const params = new URLSearchParams(window.location.search);
const initialModule = params.get('module') || 'PLEX';

setActiveModule(initialModule);
loadReport(initialModule);