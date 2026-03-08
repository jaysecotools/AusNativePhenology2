let currentDataset = 'aus_native_phenology_complete.csv';

let speciesData = [];
let filteredData = [];

let flowerChart;
let seedChart;

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

document.addEventListener('DOMContentLoaded', function(){
    loadData();
});

function loadData(){

const dataFile = 'data/' + currentDataset;

document.getElementById('tableBody').innerHTML =
'<tr><td colspan="6">Loading data...</td></tr>';

Papa.parse(dataFile,{

header:true,
download:true,

complete:function(results){

speciesData = results.data.filter(row => row.scientific_name);

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

const families =
[...new Set(speciesData.map(row=>row.family).filter(Boolean))].sort();

const select = document.getElementById('familyFilter');

while(select.options.length > 1){
select.remove(1);
}

families.forEach(family=>{

const option = document.createElement('option');
option.value = family;
option.textContent = family;

select.appendChild(option);

});

}

function applyFilters(){

const state = document.getElementById('stateFilter').value;
const flowerMonth = document.getElementById('flowerMonth').value;
const seedMonth = document.getElementById('seedMonth').value;
const family = document.getElementById('familyFilter').value;
const both = document.getElementById('bothDataFilter').checked;
const search = document.getElementById('searchInput').value.toLowerCase();

filteredData = speciesData.filter(row=>{

if(state && row.state !== state) return false;

if(flowerMonth && row['flower_'+flowerMonth] !== 1) return false;

if(seedMonth && row['seed_'+seedMonth] !== 1) return false;

if(family && row.family !== family) return false;

if(both){

let hasFlower = months.some(m => row['flower_'+m] === 1);
let hasSeed = months.some(m => row['seed_'+m] === 1);

if(!hasFlower || !hasSeed) return false;

}

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

filteredData = [...speciesData];

updateUI();

}

function updateUI(){

updateTable();
updateCharts();
updateStats();

}

function updateTable(){

const tableBody = document.getElementById('tableBody');

tableBody.innerHTML='';

filteredData.forEach(row=>{

const tr = document.createElement('tr');

const flowerMonths = getActiveMonths(row,'flower');
const seedMonths = getActiveMonths(row,'seed');

tr.innerHTML=`

<td><i>${row.scientific_name}</i></td>
<td>${row.common_name || '-'}</td>
<td>${row.family || '-'}</td>
<td>${row.state || 'Australia'}</td>
<td class="month-cell">${formatMonths(flowerMonths)}</td>
<td class="month-cell">${formatMonths(seedMonths)}</td>

`;

tableBody.appendChild(tr);

});

document.getElementById('resultCount').textContent =
filteredData.length + " species";

}

function getActiveMonths(row,prefix){

return months.filter(m => row[prefix+'_'+m] === 1);

}

function formatMonths(arr){

if(arr.length===0) return '—';

return arr.join(', ');

}

function updateCharts(){

const mode = document.getElementById('chartMode').value;

const flowerCounts = months.map(m=>{

let count =
filteredData.filter(row => row['flower_'+m] === 1).length;

if(mode === "percent"){

return filteredData.length
? ((count / filteredData.length)*100).toFixed(1)
: 0;

}

return count;

});

const seedCounts = months.map(m=>{

let count =
filteredData.filter(row => row['seed_'+m] === 1).length;

if(mode === "percent"){

return filteredData.length
? ((count / filteredData.length)*100).toFixed(1)
: 0;

}

return count;

});

if(flowerChart) flowerChart.destroy();
if(seedChart) seedChart.destroy();

const yLabel =
mode === "percent"
? "Percent of species (%)"
: "Number of species";

flowerChart = new Chart(

document.getElementById('flowerChart'),

{
type:'bar',

data:{
labels:months,
datasets:[{
data:flowerCounts,
backgroundColor:'rgba(76,175,80,0.7)'
}]
},

options:{
plugins:{legend:{display:false}},
scales:{
y:{
beginAtZero:true,
title:{display:true,text:yLabel}
}
}
}

}

);

seedChart = new Chart(

document.getElementById('seedChart'),

{
type:'bar',

data:{
labels:months,
datasets:[{
data:seedCounts,
backgroundColor:'rgba(33,150,243,0.7)'
}]
},

options:{
plugins:{legend:{display:false}},
scales:{
y:{
beginAtZero:true,
title:{display:true,text:yLabel}
}
}
}

}

);

}

function updateStats(){

document.getElementById('speciesCount').textContent =
filteredData.length;

}

function sortTable(columnIndex){

const keys = ['scientific_name','common_name','family','state'];

filteredData.sort((a,b)=>
(a[keys[columnIndex]] || '')
.localeCompare(b[keys[columnIndex]] || '')
);

updateTable();

}
