const App = {
    // --- 1. CENTRAL STORE (Database & Persistence) ---
    Store: {
        data: {
            clients: [],
            infra: [],
            integrations: [],
            security_policies: [],
            security_logs: [],
            talent: [],
            settings: {}
        },
        init() {
            const saved = localStorage.getItem('zaziza_nexus_v7');
            if (saved) {
                this.data = JSON.parse(saved);
            } else {
                this.seed();
            }
        },
        seed() {
            // Pre-load the system with realistic SA Enterprise data
            this.data.clients = [
                { id: 'CL-1042', name: 'Cape Logistics Group', status: 'Active', revenue: 45000, plan: 'Enterprise', next_bill: '15 Oct' },
                { id: 'CL-1043', name: 'Durban Imports', status: 'Onboarding', revenue: 12500, plan: 'Growth', next_bill: '01 Nov' },
                { id: 'CL-1044', name: 'Sandton Legal Partners', status: 'Active', revenue: 85000, plan: 'Enterprise', next_bill: '20 Oct' }
            ];
            this.data.infra = [
                { id: 'i-0af4b', name: 'Primary Cluster (AWS)', type: 't3.xlarge', region: 'af-south-1', status: 'Running', load: 42 },
                { id: 'i-0cd9a', name: 'Replica Node', type: 't3.medium', region: 'af-south-1', status: 'Idle', load: 8 },
                { id: 'db-01', name: 'Postgres RDS', type: 'db.m5', region: 'af-south-1', status: 'Running', load: 65 }
            ];
            this.data.integrations = [
                { name: 'Slack Notifications', status: true, icon: 'ph-slack-logo' },
                { name: 'Xero Accounting', status: true, icon: 'ph-file-text' },
                { name: 'Salesforce CRM', status: false, icon: 'ph-cloud' }
            ];
            this.data.security_policies = [
                { id: 1, name: 'Zero-Trust Pipeline', status: true, desc: 'Strict identity verification for every request.' },
                { id: 2, name: 'POPIA Data Masking', status: true, desc: 'Auto-redact SA ID numbers in logs.' },
                { id: 3, name: 'Geo-Fencing (SA Only)', status: false, desc: 'Block traffic outside South Africa.' }
            ];
            this.data.talent = [
                { id: 1, name: 'Thabo Nkosi', role: 'Senior Engineer', dept: 'Tech', score: 98, trend: 'up' },
                { id: 2, name: 'Sarah Van Zyl', role: 'Data Lead', dept: 'Data', score: 94, trend: 'flat' },
                { id: 3, name: 'Lindiwe M.', role: 'DevOps', dept: 'Ops', score: 88, trend: 'up' }
            ];
            this.data.logs = [
                { time: '10:42', sys: 'ATHASH', msg: 'Blocked IP 192.168.x.x (DDoS)', type: 'alert' },
                { time: '10:40', sys: 'ZAZIZA', msg: 'New Client Onboarded: Cape Logistics', type: 'success' },
                { time: '10:35', sys: 'DELTA', msg: 'Weekly Skill Audit Complete', type: 'info' }
            ];
            this.save();
        },
        save() {
            localStorage.setItem('zaziza_nexus_v7', JSON.stringify(this.data));
            App.Router.refresh(); // Reactive update
        },
        // Helpers
        addClient(c) { this.data.clients.unshift(c); this.addLog('ZAZIZA', `Client Added: ${c.name}`, 'success'); this.save(); },
        addNode(n) { this.data.infra.push(n); this.addLog('BUILDER', `Provisioned ${n.name}`, 'info'); this.save(); },
        togglePolicy(id) { 
            const p = this.data.security_policies.find(x=>x.id===id); 
            p.status = !p.status; 
            this.addLog('GUARDIAN', `Policy ${p.name} ${p.status?'Enabled':'Disabled'}`, 'alert');
            this.save(); 
        },
        addLog(sys, msg, type) {
            this.data.logs.unshift({ time: new Date().toLocaleTimeString('en-GB').slice(0,5), sys, msg, type });
            if(this.data.logs.length > 20) this.data.logs.pop();
        }
    },

    // --- 2. ROUTER ---
    Router: {
        current: 'nexus',
        routes: [
            { id: 'nexus', label: 'Nexus Overview', icon: 'ph-squares-four' },
            { header: 'THE BUILDER (INFRA)' },
            { id: 'infra', label: 'Infrastructure Fleet', icon: 'ph-hard-drives' },
            { id: 'clients', label: 'Client Database', icon: 'ph-users' },
            { id: 'integrations', label: 'API Integrations', icon: 'ph-plugs' },
            { header: 'THE GUARDIAN (SEC)' },
            { id: 'security', label: 'Security Pipeline', icon: 'ph-shield-check' },
            { id: 'compliance', label: 'Governance', icon: 'ph-file-lock' },
            { header: 'THE BRAIN (HR)' },
            { id: 'workforce', label: 'Workforce AI', icon: 'ph-brain' }
        ],
        init() {
            const nav = document.getElementById('nav-menu');
            nav.innerHTML = this.routes.map(r => {
                if(r.header) return `<div class="nav-header">${r.header}</div>`;
                return `<button onclick="App.Router.go('${r.id}')" id="nav-${r.id}" class="nav-item"><i class="ph-bold ${r.icon} text-lg"></i> ${r.label}</button>`;
            }).join('');
            this.go('nexus');
        },
        go(route) {
            this.current = route;
            document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
            const btn = document.getElementById(`nav-${route}`);
            if(btn) btn.classList.add('active');
            
            // Set Title
            const routeDef = this.routes.find(r => r.id === route);
            if(routeDef) document.getElementById('page-title').innerText = routeDef.label;

            // Render View
            const view = document.getElementById('viewport');
            const db = App.Store.data;
            
            // ROUTING LOGIC
            if(route === 'nexus') { view.innerHTML = App.Views.Nexus(db); setTimeout(App.Charts.init, 50); }
            else if(route === 'infra') view.innerHTML = App.Views.Builder_Infra(db);
            else if(route === 'clients') view.innerHTML = App.Views.Builder_Clients(db);
            else if(route === 'integrations') view.innerHTML = App.Views.Builder_Integrations(db);
            else if(route === 'security') view.innerHTML = App.Views.Guardian_Sec(db);
            else if(route === 'compliance') view.innerHTML = App.Views.Guardian_Comp(db);
            else if(route === 'workforce') view.innerHTML = App.Views.Brain_Workforce(db);
        },
        refresh() { this.go(this.current); }
    },

    // --- 3. VIEWS ---
    Views: {
        Nexus(db) {
            const rev = db.clients.reduce((a,b)=>a+parseInt(b.revenue),0);
            return `
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-in">
                    <div class="card-metric border-t-4 border-teal-500">
                        <div class="card-label">Monthly Revenue</div>
                        <div class="card-value text-teal-600">R ${rev.toLocaleString()}</div>
                    </div>
                    <div class="card-metric border-t-4 border-indigo-500">
                        <div class="card-label">Security Score</div>
                        <div class="card-value text-indigo-600">98<span class="text-sm text-slate-400">/100</span></div>
                    </div>
                    <div class="card-metric border-t-4 border-amber-500">
                        <div class="card-label">Active Nodes</div>
                        <div class="card-value text-amber-600">${db.infra.length}</div>
                    </div>
                    <div class="card-metric border-t-4 border-slate-500">
                        <div class="card-label">Avg Skill</div>
                        <div class="card-value text-slate-700">94%</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in" style="animation-delay: 0.1s">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Cross-Layer Telemetry</h3>
                            <div class="flex gap-4 text-[10px] font-bold text-slate-400 uppercase">
                                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-teal-500"></span> Infra</span>
                                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-indigo-500"></span> Sec</span>
                            </div>
                        </div>
                        <div class="h-64 w-full"><canvas id="mainChart"></canvas></div>
                    </div>
                    
                    <div class="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm animate-in" style="animation-delay: 0.2s">
                        <div class="p-4 border-b border-slate-100 bg-slate-50/50"><h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Event Stream</h3></div>
                        <div class="flex-1 overflow-y-auto p-0">
                            ${db.logs.map(l => `
                                <div class="flex items-center gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition">
                                    <span class="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 rounded">${l.time}</span>
                                    <div class="flex-1">
                                        <div class="text-xs font-bold text-slate-700"><span class="${l.type==='alert'?'text-red-500':(l.type==='success'?'text-teal-600':'text-indigo-600')}">${l.sys}</span>: ${l.msg}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        },

        Builder_Infra(db) {
            return `
                <div class="flex justify-between items-center mb-6 animate-in">
                    <div><h2 class="text-lg font-bold text-navy-900">Cloud Fleet</h2><p class="text-slate-500 text-xs">AWS af-south-1 Region</p></div>
                    <button onclick="App.Actions.openModal('node')" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-teal-500 transition flex items-center gap-2"><i class="ph-bold ph-plus"></i> Provision Node</button>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table class="w-full text-left text-sm">
                        <thead class="table-header"><tr><th class="p-4">ID</th><th class="p-4">Name</th><th class="p-4">Type</th><th class="p-4">Load</th><th class="p-4">Status</th></tr></thead>
                        <tbody>${db.infra.map(i => `<tr class="table-row"><td class="p-4 font-mono text-xs text-slate-500">${i.id}</td><td class="p-4 font-bold text-slate-700">${i.name}</td><td class="p-4 text-xs text-slate-500">${i.type}</td><td class="p-4"><div class="w-24 h-1.5 bg-slate-100 rounded-full"><div class="bg-teal-500 h-full" style="width:${i.load}%"></div></div></td><td class="p-4"><span class="status-pill pill-green">${i.status}</span></td></tr>`).join('')}</tbody>
                    </table>
                </div>
            `;
        },

        Builder_Clients(db) {
            return `
                <div class="flex justify-between items-center mb-6 animate-in">
                    <div><h2 class="text-lg font-bold text-navy-900">Client Database</h2><p class="text-slate-500 text-xs">CRM & Billing</p></div>
                    <button onclick="App.Actions.openModal('client')" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-teal-500 transition flex items-center gap-2"><i class="ph-bold ph-user-plus"></i> Onboard Client</button>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table class="w-full text-left text-sm">
                        <thead class="table-header"><tr><th class="p-4">Entity</th><th class="p-4">Plan</th><th class="p-4">Revenue (MRR)</th><th class="p-4">Next Bill</th><th class="p-4">Status</th></tr></thead>
                        <tbody>${db.clients.map(c => `<tr class="table-row"><td class="p-4 font-bold text-slate-700">${c.name}</td><td class="p-4 text-xs text-slate-500">${c.plan}</td><td class="p-4 font-mono text-slate-600">R ${c.revenue.toLocaleString()}</td><td class="p-4 text-xs text-slate-500">${c.next_bill}</td><td class="p-4"><span class="status-pill ${c.status==='Active'?'pill-green':'pill-blue'}">${c.status}</span></td></tr>`).join('')}</tbody>
                    </table>
                </div>
            `;
        },

        Builder_Integrations(db) {
            return `
                <div class="grid md:grid-cols-3 gap-6 animate-in">
                    ${db.integrations.map(i => `
                        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600"><i class="ph-fill ${i.icon} text-2xl"></i></div>
                                <div><div class="font-bold text-slate-700 text-sm">${i.name}</div><div class="text-[10px] text-slate-400">API Connector</div></div>
                            </div>
                            <div class="w-10 h-5 bg-${i.status?'teal-500':'slate-200'} rounded-full relative cursor-pointer transition-colors"><div class="absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${i.status?'translate-x-5':''}"></div></div>
                        </div>
                    `).join('')}
                </div>
            `;
        },

        Guardian_Sec(db) {
            return `
                <div class="grid md:grid-cols-2 gap-6 animate-in">
                    <div class="bg-navy-900 text-white p-8 rounded-xl relative overflow-hidden shadow-lg">
                        <div class="relative z-10">
                            <h3 class="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-2">Guardian Status</h3>
                            <div class="text-4xl font-bold mb-4">Secure</div>
                            <p class="text-slate-400 text-sm mb-6 max-w-xs">Zero-trust pipeline active. 1,402 endpoints monitored in real-time.</p>
                            <button onclick="App.Actions.scan()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition">Run Deep Scan</button>
                        </div>
                        <i class="ph-fill ph-shield-check text-[180px] text-white/5 absolute -right-8 -bottom-8"></i>
                    </div>
                    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div class="p-4 border-b border-slate-100 bg-slate-50"><h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Policies</h3></div>
                        ${db.security_policies.map(p => `
                            <div class="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                                <div><div class="font-bold text-slate-700 text-sm">${p.name}</div><div class="text-[10px] text-slate-400">${p.desc}</div></div>
                                <button onclick="App.Store.togglePolicy(${p.id})"><i class="ph-fill ph-toggle-${p.status?'right text-indigo-600':'left text-slate-300'} text-3xl transition-colors"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        Guardian_Comp(db) {
            return `
                <div class="bg-white p-8 rounded-xl border border-slate-200 text-center animate-in">
                    <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><i class="ph-fill ph-file-lock text-3xl"></i></div>
                    <h2 class="text-xl font-bold text-slate-800">POPIA Compliance: Verified</h2>
                    <p class="text-slate-500 text-sm mt-2 mb-6">Your data architecture meets South African data residency requirements (af-south-1).</p>
                    <button class="px-6 py-2 border border-slate-300 rounded text-slate-600 text-xs font-bold hover:bg-slate-50">Download Audit Report</button>
                </div>
            `;
        },

        Brain_Workforce(db) {
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in">
                    ${db.talent.map(t => `
                        <div class="bg-white p-5 border border-slate-200 rounded-xl hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div class="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                            <div class="flex justify-between items-start mb-4 pl-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">${t.name.charAt(0)}</div>
                                    <div><div class="font-bold text-slate-800 text-sm">${t.name}</div><div class="text-xs text-slate-500">${t.role}</div></div>
                                </div>
                                <span class="text-lg font-bold text-amber-600">${t.score}</span>
                            </div>
                            <div class="pl-3">
                                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2"><div class="bg-amber-500 h-full" style="width:${t.score}%"></div></div>
                                <div class="flex justify-between text-[10px] text-slate-400 uppercase font-bold"><span>${t.dept}</span><span>Match: High</span></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    },

    // --- 4. ACTIONS (Modals) ---
    Actions: {
        openModal(type) {
            const overlay = document.getElementById('modal-overlay');
            const content = document.getElementById('modal-content');
            overlay.classList.remove('hidden');
            setTimeout(()=>overlay.classList.remove('opacity-0'),10);
            
            if(type === 'node') {
                content.innerHTML = `
                    <div class="p-6">
                        <h3 class="text-lg font-bold text-navy-900 mb-4">Provision Resource</h3>
                        <form onsubmit="App.Actions.submitNode(event)" class="space-y-4">
                            <div><label class="text-xs font-bold text-slate-500 uppercase">Node Name</label><input name="name" required class="w-full border border-slate-300 rounded-lg p-2.5 text-sm mt-1 focus:outline-none focus:border-teal-500"></div>
                            <div><label class="text-xs font-bold text-slate-500 uppercase">Instance Type</label><select name="type" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm mt-1 bg-white"><option>t3.medium (General)</option><option>c5.large (Compute)</option></select></div>
                            <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onclick="App.Actions.closeModal()" class="px-4 py-2 text-slate-500 text-sm font-bold hover:text-slate-700">Cancel</button>
                                <button type="submit" class="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-bold shadow-lg">Deploy</button>
                            </div>
                        </form>
                    </div>`;
            } else if (type === 'client') {
                content.innerHTML = `
                    <div class="p-6">
                        <h3 class="text-lg font-bold text-navy-900 mb-4">Onboard Client</h3>
                        <form onsubmit="App.Actions.submitClient(event)" class="space-y-4">
                            <div><label class="text-xs font-bold text-slate-500 uppercase">Company Name</label><input name="name" required class="w-full border border-slate-300 rounded-lg p-2.5 text-sm mt-1 focus:outline-none focus:border-teal-500"></div>
                            <div><label class="text-xs font-bold text-slate-500 uppercase">Plan</label><select name="plan" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm mt-1 bg-white"><option>Growth</option><option>Enterprise</option></select></div>
                            <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onclick="App.Actions.closeModal()" class="px-4 py-2 text-slate-500 text-sm font-bold hover:text-slate-700">Cancel</button>
                                <button type="submit" class="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold shadow-lg">Add to DB</button>
                            </div>
                        </form>
                    </div>`;
            }
        },
        closeModal() {
            const overlay = document.getElementById('modal-overlay');
            overlay.classList.add('opacity-0');
            setTimeout(()=>overlay.classList.add('hidden'), 200);
        },
        submitNode(e) {
            e.preventDefault();
            const fd = new FormData(e.target);
            App.Store.addNode({ id: 'i-'+Math.floor(Math.random()*1000), name: fd.get('name'), type: fd.get('type'), region: 'af-south-1', status: 'Initializing', load: 0 });
            this.closeModal();
            App.UI.toast('Resource Deployed', 'success');
        },
        submitClient(e) {
            e.preventDefault();
            const fd = new FormData(e.target);
            App.Store.addClient({ id: 'C-'+Math.floor(Math.random()*1000), name: fd.get('name'), status: 'Onboarding', revenue: 0, plan: fd.get('plan'), next_bill: 'Pending' });
            this.closeModal();
            App.UI.toast('Client Onboarded', 'success');
        },
        scan() {
            App.UI.toast('Scanning Network...', 'loading');
            setTimeout(() => { App.UI.toast('Scan Complete. System Secure.', 'success'); }, 2000);
        },
        resetSystem() {
            if(confirm('Factory Reset: Clear all data?')) { localStorage.removeItem('zaziza_nexus_v7'); location.reload(); }
        }
    },

    // --- 5. UI & CHARTS ---
    UI: {
        toast(msg, type) {
            const c = document.getElementById('toast-layer');
            const el = document.createElement('div');
            const icon = type==='loading'?'ph-spinner animate-spin':'ph-check-circle';
            el.className = `toast`;
            el.innerHTML = `<i class="ph-bold ${icon} text-teal-600 text-lg"></i> <span>${msg}</span>`;
            c.appendChild(el);
            setTimeout(()=>el.remove(), 3000);
        },
        clock() { setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString('en-GB'); }, 1000); }
    },
    Charts: {
        init() {
            const ctx = document.getElementById('mainChart');
            if(!ctx) return;
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['00:00','04:00','08:00','12:00','16:00','20:00'],
                    datasets: [
                        { label: 'Builder', data: [20,45,30,80,60,40], borderColor:'#14b8a6', tension:0.4 },
                        { label: 'Guardian', data: [5,10,5,15,5,5], borderColor:'#6366f1', tension:0.4 }
                    ]
                },
                options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{grid:{display:false}},x:{grid:{display:false}}} }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => { App.Store.init(); App.Router.init(); App.UI.clock(); });
