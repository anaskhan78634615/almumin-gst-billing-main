let currentId=null;const ids=['invoice','date','customer','gstin','address','email','mobile','supply','transport','eway','po','reverse'];const $=x=>document.getElementById(x);const num=v=>Math.max(0,Number(v)||0);const money=n=>'₹'+n.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function addRow(d={}){let tr=document.createElement('tr');tr.innerHTML=`<td class="sn"></td><td><input class="desc" value="${esc(d.desc||'')}"></td><td><input class="hsn" value="${esc(d.hsn||'')}"></td><td><select class="tax">${[0,5,12,18,28].map(v=>`<option value="${v}" ${Number(d.tax??18)===v?'selected':''}>${v}%</option>`).join('')}</select></td><td><input class="qty" type="number" min="0" step="any" value="${d.qty??1}"></td><td><input class="rate" type="number" min="0" step="any" value="${d.rate??0}"></td><td><input class="disc" type="number" min="0" max="100" step="any" value="${d.disc??0}"></td><td class="taxable money">₹0.00</td><td><button class="secondary" onclick="this.closest('tr').remove();calculate()">×</button></td>`;$('items').append(tr);tr.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',calculate));calculate()}
function getRows(){return [...$('items').children].map(tr=>({desc:tr.querySelector('.desc').value,hsn:tr.querySelector('.hsn').value,tax:num(tr.querySelector('.tax').value),qty:num(tr.querySelector('.qty').value),rate:num(tr.querySelector('.rate').value),disc:Math.min(100,num(tr.querySelector('.disc').value))}))}
function numberWords(n){n=Math.floor(n);if(n===0)return 'Zero';let ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];function small(x){return x<20?ones[x]:x<100?tens[Math.floor(x/10)]+(x%10?' '+ones[x%10]:''):ones[Math.floor(x/100)]+' Hundred'+(x%100?' '+small(x%100):'')}let out=[];for(let [v,name] of [[10000000,'Crore'],[100000,'Lakh'],[1000,'Thousand'],[1,'']]){let k=Math.floor(n/v);if(k){out.push(small(k)+(name?' '+name:''));n%=v}}return out.join(' ')}
// Round each displayed invoice line to paise; MRP is GST-INCLUSIVE.
const paisa=x=>Math.round((x+Number.EPSILON)*100)/100;
function lineCalc(r){
 const gross=paisa(r.qty*r.rate*(1-r.disc/100));
 const taxable=paisa(gross/(1+r.tax/100));
 const halfRate=r.tax/2;
 const cgst=paisa(taxable*halfRate/100);
 const sgst=paisa(taxable*halfRate/100);
 return {gross,taxable,cgst,sgst};
}
function calculate(){
 const rows=getRows(), lines=rows.map(lineCalc);
 let base=paisa(lines.reduce((a,x)=>a+x.taxable,0));
 let cg=paisa(lines.reduce((a,x)=>a+x.cgst,0));
 let sg=paisa(lines.reduce((a,x)=>a+x.sgst,0));
 let gross=paisa(lines.reduce((a,x)=>a+x.gross,0));
 let total=Math.round(gross),round=paisa(total-base-cg-sg);
 rows.forEach((r,i)=>{let tr=$('items').children[i];tr.querySelector('.sn').textContent=i+1;tr.querySelector('.taxable').textContent=money(lines[i].taxable)});
 $('subtotal').textContent=money(base);$('cgst').textContent=money(cg);$('sgst').textContent=money(sg);$('roundoff').textContent=round.toFixed(2);$('grand').textContent=money(total);$('words').textContent=numberWords(total)+' Rupees Only';
 let d=Object.fromEntries(ids.map(k=>[k,$(k).value]));
 let date=d.date?new Date(d.date+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'';
 $('printCustomer').innerHTML=`<b>Party Details :</b><div class="party-name">${esc(d.customer)}</div><div>${esc(d.address).replace(/\n/g,'<br>')}</div><div><b>Email</b> &nbsp; : &nbsp; ${esc(d.email)}</div><div><b>Party Mobile No</b> &nbsp; : &nbsp; ${esc(d.mobile)}</div><div><b>GSTIN / UIN</b> &nbsp; : &nbsp; ${esc(d.gstin)}</div>`;
 $('printMeta').innerHTML=`<div><b>Invoice No.</b> &nbsp; : &nbsp; ${esc(d.invoice)}</div><div><b>Dated</b> &nbsp; : &nbsp; ${esc(date)}</div><div><b>Place of Supply</b> &nbsp; : &nbsp; ${esc(d.supply)}</div><div><b>Reverse Charge</b> &nbsp; : &nbsp; ${esc(d.reverse)}</div><div><b>GR/RR No.</b> &nbsp; : &nbsp; </div><div><b>Transport</b> &nbsp; : &nbsp; ${esc(d.transport)}</div><div><b>E-Way Bill No.</b> &nbsp; : &nbsp; ${esc(d.eway)}</div><div><b>PO No.</b> &nbsp; : &nbsp; ${esc(d.po)}</div>`;
 $('printRows').innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.desc)}</td><td>${esc(r.hsn)}</td><td>${r.tax}%</td><td>${r.qty.toFixed(2)}</td><td>${r.rate.toFixed(2)}</td><td>${r.disc}%</td><td>${lines[i].taxable.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr>`).join('');
 let taxGroups={};rows.forEach((r,i)=>{let k=r.tax; if(!taxGroups[k])taxGroups[k]={base:0,cg:0,sg:0};taxGroups[k].base+=lines[i].taxable;taxGroups[k].cg+=lines[i].cgst;taxGroups[k].sg+=lines[i].sgst});
 $('printTaxes').innerHTML=`<div class="tax-add"><span>Add &nbsp; : &nbsp; CGST</span><span>${Object.keys(taxGroups).length===1?((rows[0]?.tax??18)/2).toFixed(2)+'%':'Various'}</span><span class="amount">${cg.toFixed(2)}</span></div><div class="tax-add"><span>Add &nbsp; : &nbsp; SGST</span><span>${Object.keys(taxGroups).length===1?((rows[0]?.tax??18)/2).toFixed(2)+'%':'Various'}</span><span class="amount">${sg.toFixed(2)}</span></div>${round !== 0 ? `<div class="tax-add"><span>Add &nbsp; : &nbsp; Rounded off</span><span></span><span class="amount">${round.toFixed(2)}</span></div>` : ''}`;
 $('printGrand').textContent=money(total);
 $('printWords').textContent=$('words').textContent;
 $('printQty').textContent=rows.reduce((a,r)=>a+r.qty,0).toFixed(2);
 $('printTaxSummary').innerHTML=Object.entries(taxGroups).map(([rate,v])=>`<tr><td>${rate}%</td><td>${money(paisa(v.base))}</td><td>${money(paisa(v.cg))}</td><td>${money(paisa(v.sg))}</td><td>${money(paisa(v.cg+v.sg))}</td></tr>`).join('');
}

// Browser-local invoice database. Netlify does not run the original Flask /api endpoints.
const STORAGE_KEY='almumin_invoices_v1';
function readInvoices(){
 const raw=localStorage.getItem(STORAGE_KEY);
 const data=raw?JSON.parse(raw):[];
 if(!Array.isArray(data))throw Error('Invalid local invoice data');
 return data;
}
function writeInvoices(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}
function saveInvoice(){
 calculate();
 const d=Object.fromEntries(ids.map(k=>[k,$(k).value]));
 d.rows=getRows();
 try {
  const all=readInvoices();
  const id=currentId??(all.reduce((max,v)=>Math.max(max,Number(v.id)||0),0)+1);
  const existing=all.find(v=>v.id===id);
  const entry={id,number:d.invoice,customer:d.customer,created:existing?.created??new Date().toISOString(),payload:{...d,id}};
  const idx=all.findIndex(v=>v.id===id);
  if(idx>=0)all[idx]=entry;else all.push(entry);
  writeInvoices(all);
  currentId=id;
  alert('Invoice saved on this browser successfully');
  loadList();
 }catch(err){console.error(err);alert('Unable to save invoice. Check browser storage permissions and available space.');}
}
function loadList(){
 try {
  const data=readInvoices().sort((a,b)=>b.id-a.id);
  $('savedList').innerHTML=data.length?data.map(d=>`<button class="secondary" onclick="openInvoice(${Number(d.id)})">${esc(d.number)} — ${esc(d.customer)} (${esc(String(d.created||'').slice(0,10))})</button>`).join(''):'No saved invoices yet.';
 }catch(err){console.error(err);$('savedList').textContent='Could not load saved invoices';}
}
function openInvoice(id){
 try {
  const d=readInvoices().find(v=>v.id===id)?.payload;
  if(!d)throw Error('Invoice not found');
  ids.forEach(k=>$(k).value=d[k]??'');
  $('items').innerHTML='';
  (d.rows||[]).forEach(addRow);
  currentId=id;calculate();window.scrollTo(0,0);
 }catch(err){console.error(err);alert('Could not open invoice');}
}
function exportInvoices(){
 try {
  const data=readInvoices();
  const blob=new Blob([JSON.stringify({format:'almumin-browser-invoices-v1',invoices:data},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='almumin-invoices-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(err){console.error(err);alert('Could not export invoices');}
}
async function importInvoices(input){
 const file=input.files?.[0];if(!file)return;
 try {
  const parsed=JSON.parse(await file.text());
  if(parsed.format!=='almumin-browser-invoices-v1'||!Array.isArray(parsed.invoices)||!parsed.invoices.every(v=>Number.isSafeInteger(v.id)&&v.id>0&&v.payload&&typeof v.payload==='object'))throw Error('Not an AL-MUMIN invoice backup');
  if(!confirm('Restore '+parsed.invoices.length+' invoices? This will replace invoices currently saved in this browser.'))return;
  writeInvoices(parsed.invoices);currentId=null;loadList();alert('Backup restored successfully');
 }catch(err){console.error(err);alert('Invalid backup or import failed');}
 finally{input.value='';}
}
function newInvoice(){currentId=null;ids.forEach(k=>$(k).value='');$('reverse').value='No';const now=new Date();$('date').value=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');$('items').innerHTML='';addRow();calculate()}
newInvoice();window.addEventListener('beforeprint',calculate);
