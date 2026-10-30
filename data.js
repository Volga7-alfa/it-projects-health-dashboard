/* ============================================================
   Данные дашборда: дата отчёта и демо-набор проектов
   ============================================================ */

// ================== ДАННЫЕ ==================
const TODAY = new Date('2026-10-29T00:00:00');

const DEFAULT_PROJECTS = [
  { direction:'А', leader:'иванов', project:'А1', status:'открыт', openDate:'2025-01-01', planClose:'2026-12-31', factClose:null, planBudget:1000000, factBudget:500000,
    goals:[
      {name:'цель 1', planDate:'2025-12-31', status:'выполнено'},
      {name:'цель 2', planDate:'2026-03-31', status:'выполнено'},
      {name:'цель 3', planDate:'2026-12-31', status:'в работе'}
    ]},
  { direction:'А', leader:'иванов', project:'А2', status:'открыт', openDate:'2025-01-01', planClose:'2026-12-31', factClose:null, planBudget:1000000, factBudget:700000,
    goals:[
      {name:'цель 4', planDate:'2026-08-31', status:'в работе'},
      {name:'цель 5', planDate:'2026-12-31', status:'в работе'}
    ]},
  { direction:'А', leader:'иванов', project:'А3', status:'закрыт', openDate:'2025-01-01', planClose:'2026-09-30', factClose:'2026-09-30', planBudget:1000000, factBudget:1000000,
    goals:[
      {name:'цель 6', planDate:'2026-09-30', status:'выполнено'},
      {name:'цель 6', planDate:'2026-09-30', status:'выполнено'},
      {name:'цель 7', planDate:'2026-09-30', status:'не выполнено'}
    ]},
  { direction:'А', leader:'иванов', project:'А4', status:'открыт', openDate:'2025-01-01', planClose:'2026-12-31', factClose:null, planBudget:1000000, factBudget:1200000,
    goals:[
      {name:'цель 8', planDate:'2026-12-31', status:'в работе'},
      {name:'цель 9', planDate:'2026-12-31', status:'в работе'}
    ]},
  { direction:'Б', leader:'петров', project:'Б1', status:'открыт', openDate:'2025-01-01', planClose:'2026-12-31', factClose:null, planBudget:1000000, factBudget:600000,
    goals:[
      {name:'цель 10', planDate:'2026-12-31', status:'в работе'},
      {name:'цель 10', planDate:'2026-12-31', status:'в работе'},
      {name:'цель 11', planDate:'2026-12-31', status:'в работе'}
    ]},
  { direction:'Б', leader:'петров', project:'Б2', status:'открыт', openDate:'2025-01-01', planClose:'2026-07-31', factClose:null, planBudget:1000000, factBudget:2000000,
    goals:[
      {name:'цель 12', planDate:null, status:'просрочено'},
      {name:'цель 13', planDate:null, status:'просрочено'}
    ]},
  { direction:'Б', leader:'петров', project:'Б3', status:'закрыт', openDate:'2025-01-01', planClose:'2026-09-30', factClose:'2026-09-30', planBudget:1000000, factBudget:1000000,
    goals:[
      {name:'цель 14', planDate:'2026-09-30', status:'выполнено'},
      {name:'цель 15', planDate:'2026-09-30', status:'выполнено'},
      {name:'цель 16', planDate:'2026-09-30', status:'выполнено'}
    ]},
  { direction:'В', leader:'сидоров', project:'В1', status:'открыт', openDate:'2025-01-01', planClose:'2026-12-31', factClose:null, planBudget:1000000, factBudget:900000,
    goals:[
      {name:'цель 17', planDate:'2026-12-31', status:'в работе'},
      {name:'цель 18', planDate:'2026-12-31', status:'в работе'}
    ]},
  { direction:'В', leader:'сидоров', project:'В2', status:'закрыт', openDate:'2025-01-01', planClose:'2026-09-30', factClose:'2026-09-30', planBudget:1000000, factBudget:800000,
    goals:[
      {name:'цель 19', planDate:'2026-09-30', status:'выполнено'},
      {name:'цель 20', planDate:'2026-09-30', status:'выполнено'},
      {name:'цель 21', planDate:'2026-09-30', status:'выполнено'}
    ]}
];
