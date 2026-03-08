let currentDataset = 'aus_native_phenology_complete.csv';

let speciesData = [];
let filteredData = [];

let flowerChart;
let seedChart;

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

document.addEventListener('DOMContentLoaded', loadData);



function loadData(){

const dataFile = 'data/' + currentDataset;

document.getElementById('tableBody').innerHTML =
'<tr><td colspan="6">Loading data...</td></tr>';

Papa.parse(dataFile,{

header:true,
download:true,

complete:function(results){

speciesData = results.data.filter(r => r.scientific_name);

speciesData = speciesData.map(row=>{

row.flowerMonths = months.filter(m => row['flower_'+m] == 1);
row.seedMonths = months.filter(m => row['seed_'+m] == 1);

row.hasFlower = row.flowerMonths.length > 0;
row.hasSeed = row.seedMonths.length > 0;

return row;

});

filteredData = [...speciesData];

populateFamilyFilter();

updateUI();

}

});

}



function changeDataset(){

currentDataset = document.getElementById('datasetSelect').value;

loadData();

}



function populateFamilyFilter(){

const families = [...new Set(
speciesData.map(r=>r.family).filter(f=>f)
)].sort();

const select = document.getElementById('familyFilter');

while(select.options.length>1){
select.remove(1);
}

families.forEach(f=>{

let option=document.createElement('option');

option.value=f;
option.textContent=f;

select.appendChild(option);

});

}



function applyFilters(){

const state=document.getElementById('stateFilter').value;
const flowerMonth=document.getElementById('flowerMonth').value;
const seedMonth=document.getElementById('seedMonth').value;
const family=document.getElementById('familyFilter').value;
const search=document.getElementById('searchInput').value.toLowerCase();
const both=document.getElementById('bothDataFilter').checked;

filteredData = speciesData.filter(row=>{

if(state && !row.state?.includes(state)) return false;

if(flowerMonth && !row.flowerMonths.includes(flowerMonth)) return false;

if(seedMonth && !row.seedMonths.includes(seedMonth)) return false;

if(family && row.family !== family) return false;

if(both && (!row.hasFlower || !row.hasSeed)) return false;

if(search){
if(
!row.scientific_name?.toLowerCase().includes(search) &&
!row.common_name?.toLowerCase().includes(search)
) return false;
}

return true;

});

updateUI();

}



function resetFilters(){

document.getElementById('stateFilter').value='';
document.getElementById('flowerMonth').value='';
document.getElementById('seedMonth').value='';
document.getElementById('familyFilter').value='';
document.getElementById('searchInput').value='';
document.getElementById('bothDataFilter').checked=false;

filteredData=[...speciesData];

updateUI();

}



function filterCurrentMonth(){

const m = months[new Date().getMonth()];

document.getElementById('flowerMonth').value=m;

applyFilters();

}



function updateUI(){

updateTable();
updateCharts();
updateStats();
updateSeedPlanner();

}



function updateTable(){

const table=document.getElementById('tableBody');

table.innerHTML='';

filteredData.slice(0,100).forEach(row=>{

const tr=document.createElement('tr');

tr.innerHTML=`

<td><i>${row.scientific_name}</i></td>

<td>${row.common_name || '-'}</td>

<td>${row.family || '-'}</td>

<td>${row.state || 'Australia'}</td>

<td>${formatMonths(row.flowerMonths)}</td>

<td>${formatMonths(row.seedMonths)}</td>

`;

table.appendChild(tr);

});

document.getElementById('resultCount').textContent =
`${filteredData.length} species`;

}



function formatMonths(arr){

if(arr.length==0) return '—';

if(arr.length==12) return 'All year';

return arr.join(', ');

}



function updateCharts(){

const flowerCounts = months.map(m=>{

const c = filteredData.filter(r=>r.flowerMonths.includes(m)).length;

return filteredData.length ? (c/filteredData.length*100).toFixed(1) : 0;

});

const seedCounts = months.map(m=>{

const c = filteredData.filter(r=>r.seedMonths.includes(m)).length;

return filteredData.length ? (c/filteredData.length*100).toFixed(1) : 0;

});


if(flowerChart) flowerChart.destroy();
if(seedChart) seedChart.destroy();


flowerChart = new Chart(
document.getElementById('flowerChart'),
{

type:'bar',

data:{

labels:months,

datasets:[{

label:'% flowering',

data:flowerCounts,

backgroundColor:'rgba(76,175,80,0.7)'

}]

}

});



seedChart = new Chart(
document.getElementById('seedChart'),
{

type:'bar',

data:{

labels:months,

datasets:[{

label:'% seed ready',

data:seedCounts,

backgroundColor:'rgba(33,150,243,0.7)'

}]

}

});

}



function updateStats(){

document.getElementById('speciesCount').textContent =
filteredData.length;

}



function updateSeedPlanner(){

const counts = months.map(m=>
filteredData.filter(r=>r.seedMonths.includes(m)).length
);

let bestIndex = counts.indexOf(Math.max(...counts));

let bestMonth = months[bestIndex];

document.getElementById('seedRecommendation').textContent =
bestMonth;

}



function sortTable(column){

filteredData.sort((a,b)=>{

const keys=['scientific_name','common_name','family','state'];

return (a[keys[column]]||'').localeCompare(b[keys[column]]||'');

});

updateTable();

}
