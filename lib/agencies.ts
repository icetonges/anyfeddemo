// lib/agencies.ts — Federal agency registry for the AnyFed FM Portal
// `toptier` = USAspending.gov toptier agency code (live-data fallback).
// `hasLocalData` = agency folder exists under ./sourcedata (default source).

export interface Agency {
  id:           string
  name:         string
  abbrev:       string
  toptier:      string          // USAspending toptier_code
  cfoAct:       boolean
  hasLocalData: boolean
  funding:      'appropriated' | 'fee-funded' | 'mixed'
  accent:       string          // brand accent color
  seal:         string          // emoji placeholder for seal
}

export const AGENCIES: Agency[] = [
  { id:'DOD',  name:'Department of Defense',                    abbrev:'DoD',   toptier:'097', cfoAct:true,  hasLocalData:true,  funding:'appropriated', accent:'#4f6d3a', seal:'🛡️' },
  { id:'SEC',  name:'Securities and Exchange Commission',       abbrev:'SEC',   toptier:'050', cfoAct:false, hasLocalData:true,  funding:'fee-funded',   accent:'#0ea5e9', seal:'🏛️' },
  { id:'FDIC', name:'Federal Deposit Insurance Corporation',    abbrev:'FDIC',  toptier:'051', cfoAct:false, hasLocalData:false, funding:'fee-funded',   accent:'#1d4ed8', seal:'🏦' },
  { id:'TREAS',name:'Department of the Treasury',               abbrev:'Treasury', toptier:'020', cfoAct:true, hasLocalData:false, funding:'appropriated', accent:'#0d9488', seal:'💵' },
  { id:'HHS',  name:'Department of Health and Human Services',  abbrev:'HHS',   toptier:'075', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#dc2626', seal:'⚕️' },
  { id:'DHS',  name:'Department of Homeland Security',          abbrev:'DHS',   toptier:'070', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#b45309', seal:'🦅' },
  { id:'DOE',  name:'Department of Energy',                     abbrev:'DOE',   toptier:'089', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#16a34a', seal:'⚛️' },
  { id:'DOJ',  name:'Department of Justice',                    abbrev:'DOJ',   toptier:'015', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#7c3aed', seal:'⚖️' },
  { id:'DOS',  name:'Department of State',                      abbrev:'State', toptier:'019', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#0369a1', seal:'🌐' },
  { id:'DOT',  name:'Department of Transportation',             abbrev:'DOT',   toptier:'069', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#ea580c', seal:'🚦' },
  { id:'ED',   name:'Department of Education',                  abbrev:'ED',    toptier:'091', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#2563eb', seal:'🎓' },
  { id:'VA',   name:'Department of Veterans Affairs',           abbrev:'VA',    toptier:'036', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#65532e', seal:'🎖️' },
  { id:'USDA', name:'Department of Agriculture',                abbrev:'USDA',  toptier:'012', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#15803d', seal:'🌾' },
  { id:'DOC',  name:'Department of Commerce',                   abbrev:'Commerce', toptier:'013', cfoAct:true, hasLocalData:false, funding:'appropriated', accent:'#0e7490', seal:'📈' },
  { id:'DOL',  name:'Department of Labor',                      abbrev:'DOL',   toptier:'016', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#9333ea', seal:'👷' },
  { id:'HUD',  name:'Department of Housing and Urban Development', abbrev:'HUD', toptier:'086', cfoAct:true, hasLocalData:false, funding:'appropriated', accent:'#c026d3', seal:'🏘️' },
  { id:'DOI',  name:'Department of the Interior',               abbrev:'DOI',   toptier:'014', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#92400e', seal:'🏞️' },
  { id:'EPA',  name:'Environmental Protection Agency',          abbrev:'EPA',   toptier:'068', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#059669', seal:'🌿' },
  { id:'NASA', name:'National Aeronautics and Space Administration', abbrev:'NASA', toptier:'080', cfoAct:true, hasLocalData:false, funding:'appropriated', accent:'#4338ca', seal:'🚀' },
  { id:'GSA',  name:'General Services Administration',          abbrev:'GSA',   toptier:'047', cfoAct:true,  hasLocalData:false, funding:'mixed',        accent:'#475569', seal:'🏢' },
  { id:'NSF',  name:'National Science Foundation',              abbrev:'NSF',   toptier:'049', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#7e22ce', seal:'🔬' },
  { id:'OPM',  name:'Office of Personnel Management',           abbrev:'OPM',   toptier:'024', cfoAct:true,  hasLocalData:false, funding:'mixed',        accent:'#be185d', seal:'🗂️' },
  { id:'SBA',  name:'Small Business Administration',            abbrev:'SBA',   toptier:'073', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#b91c1c', seal:'🏪' },
  { id:'SSA',  name:'Social Security Administration',           abbrev:'SSA',   toptier:'028', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#1e40af', seal:'👥' },
  { id:'USAID',name:'Agency for International Development',     abbrev:'USAID', toptier:'072', cfoAct:true,  hasLocalData:false, funding:'appropriated', accent:'#0f766e', seal:'🤝' },
  { id:'NRC',  name:'Nuclear Regulatory Commission',            abbrev:'NRC',   toptier:'031', cfoAct:true,  hasLocalData:false, funding:'fee-funded',   accent:'#a16207', seal:'☢️' },
  { id:'FCC',  name:'Federal Communications Commission',        abbrev:'FCC',   toptier:'027', cfoAct:false, hasLocalData:false, funding:'fee-funded',   accent:'#3730a3', seal:'📡' },
  { id:'CFTC', name:'Commodity Futures Trading Commission',     abbrev:'CFTC',  toptier:'339', cfoAct:false, hasLocalData:false, funding:'appropriated', accent:'#0891b2', seal:'📊' },
]

export const DEFAULT_AGENCY_ID = 'DOD'   // folder data loads first by design

export function getAgency(id: string): Agency {
  return AGENCIES.find(a => a.id === id) ?? AGENCIES[0]
}
