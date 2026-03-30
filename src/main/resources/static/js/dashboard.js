class DashboardApp {
    constructor() {
        this.token = localStorage.getItem('token');
        this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        this.esAdministrador = localStorage.getItem('esAdministrador') === 'true';
        this.permisos = JSON.parse(localStorage.getItem('permisos') || '[]');
        this.currentModule = null;
        this.currentMenu = null;
        this.init();
    }

    async init() {
        if (!this.token) {
            window.location.replace('/login');
            return;
        }
        await this.verifyToken();
        this.loadUserInfo();
        await this.loadMenus();
        this.bindEvents();
        this.goHome();
    }

    async verifyToken() {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!response.ok) throw new Error('Token inválido');
        } catch (error) {
            localStorage.clear();
            window.location.replace('/login');
        }
    }

    getPermisoModulo(nombreModulo) {
        return this.permisos.find(p => p.strNombreModulo === nombreModulo) || null;
    }

    async loadMenus() {
        try {
            const response = await fetch('/api/menus', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                const menus = await response.json();
                const menusFiltrados = this.filtrarMenusPorPermisos(menus);
                this.renderMenus(menusFiltrados);
            }
        } catch (error) {
            console.error('Error loading menus:', error);
        }
    }

    filtrarMenusPorPermisos(menus) {
        if (this.esAdministrador) return menus;
        return menus.map(menu => ({
            ...menu,
            modulos: menu.modulos.filter(modulo =>
                this.permisos.some(p => p.strNombreModulo === modulo.strNombreModulo)
            )
        })).filter(menu => menu.modulos.length > 0);
    }

    renderMenus(menus) {
        const menuContainer = document.getElementById('menusContainer');
        if (!menuContainer) return;
        menuContainer.innerHTML = '';
        menus.forEach(menu => {
            const menuItem = this.createMenuItem(menu);
            menuContainer.appendChild(menuItem);
        });
    }

    createMenuItem(menu) {
        const li = document.createElement('li');
        li.className = 'nav-item';

        const iconMap = {
            'Seguridad':   'fa-lock',
            'Principal 1': 'fa-layer-group',
            'Principal 2': 'fa-th-large',
        };
        const icon = iconMap[menu.strNombreMenu] || 'fa-folder';

        const navLink = document.createElement('a');
        navLink.className = 'nav-link';
        navLink.href = '#';
        navLink.innerHTML = `
            <i class="fas ${icon}"></i>
            <span class="sidebar-text ms-2">${menu.strNombreMenu}</span>
            <i class="fas fa-chevron-down ms-auto sidebar-text chevron" style="font-size:0.75rem; transition: transform 0.25s;"></i>
        `;

        const submenu = document.createElement('div');
        submenu.className = 'collapse-menu';
        submenu.style.display = 'none';

        if (menu.modulos && menu.modulos.length > 0) {
            menu.modulos.forEach(modulo => {
                const subLink = document.createElement('a');
                subLink.className = 'dropdown-item';
                subLink.href = '#';
                subLink.textContent = modulo.strNombreModulo;
                subLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const menuNombre = navLink.querySelector('.sidebar-text')?.textContent?.trim();
                    this.loadModule(modulo, menuNombre);
                });
                submenu.appendChild(subLink);
            });
        } else {
            const empty = document.createElement('a');
            empty.className = 'dropdown-item disabled';
            empty.href = '#';
            empty.textContent = 'Sin módulos';
            submenu.appendChild(empty);
        }

        navLink.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpen = submenu.style.display === 'block';
            const chevron = navLink.querySelector('.chevron');

            document.querySelectorAll('.sidebar .collapse-menu').forEach(m => {
                m.style.display = 'none';
            });
            document.querySelectorAll('.sidebar .chevron').forEach(c => {
                c.style.transform = 'rotate(0deg)';
            });

            if (!isOpen) {
                submenu.style.display = 'block';
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }
        });

        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.addEventListener('mouseleave', () => {
                document.querySelectorAll('.sidebar .collapse-menu').forEach(m => {
                    m.style.display = 'none';
                });
                document.querySelectorAll('.sidebar .chevron').forEach(c => {
                    c.style.transform = 'rotate(0deg)';
                });
            });
        }

        li.appendChild(navLink);
        li.appendChild(submenu);
        return li;
    }

    // ✅ Un solo loadModule con menuNombre
    async loadModule(modulo, menuNombre = null) {
        this.currentModule = modulo;
        this.currentMenu = menuNombre || this.findMenuByModulo(modulo);
        this.updateBreadcrumbs(modulo);

        const permiso = this.getPermisoModulo(modulo.strNombreModulo);
        const modulesWithCrud = ['Perfil', 'Módulo', 'Permisos-Perfil', 'Usuario'];

        if (modulesWithCrud.includes(modulo.strNombreModulo)) {
            await this.loadCrudModule(modulo.strNombreModulo, permiso);
        } else {
            this.loadStaticModule(modulo.strNombreModulo, permiso);
        }
    }

    findMenuByModulo(modulo) {
        const menus = document.querySelectorAll('#menusContainer .nav-item');
        for (const menuEl of menus) {
            const subLinks = menuEl.querySelectorAll('.dropdown-item');
            for (const link of subLinks) {
                if (link.textContent.trim() === modulo.strNombreModulo) {
                    return menuEl.querySelector('.nav-link .sidebar-text')?.textContent?.trim() || null;
                }
            }
        }
        return null;
    }

    async loadCrudModule(moduleName, permiso) {
        try {
            const fileMap = {
                'Perfil': 'perfil',
                'Módulo': 'modulo',
                'Permisos-Perfil': 'permisos-perfil',
                'Usuario': 'usuario'
            };
            const fileName = fileMap[moduleName];
            const response = await fetch(`/templates/${fileName}.html`);

            if (response.ok) {
                const html = await response.text();
                document.getElementById('contentContainer').innerHTML = html;

                setTimeout(() => {
                    const permisoEfectivo = this.esAdministrador ? {
                        bitAgregar: true, bitEditar: true, bitConsulta: true,
                        bitEliminar: true, bitDetalle: true
                    } : permiso;

                    switch(moduleName) {
                        case 'Perfil':
                            window.perfilModule = new PerfilModule(this.token, permisoEfectivo);
                            break;
                        case 'Usuario':
                            window.usuarioModule = new UsuarioModule(this.token, permisoEfectivo);
                            break;
                        case 'Módulo':
                            window.moduloModule = new ModuloModule(this.token, permisoEfectivo);
                            break;
                        case 'Permisos-Perfil':
                            window.permisosPerfilModule = new PermisosPerfilModule(this.token, permisoEfectivo);
                            break;
                    }
                }, 100);
            }
        } catch (error) {
            document.getElementById('contentContainer').innerHTML =
                `<div class="alert alert-danger">Error al cargar el módulo ${moduleName}</div>`;
        }
    }

    loadStaticModule(moduleName, permiso) {
        const p = this.esAdministrador ? {
            bitAgregar: true, bitEditar: true, bitConsulta: true,
            bitEliminar: true, bitDetalle: true
        } : (permiso || {});

        document.getElementById('contentContainer').innerHTML = `
            <div class="card">
                <div class="card-header"><h3>${moduleName}</h3></div>
                <div class="card-body">
                    <div class="mb-3">
                        ${p.bitAgregar ? `<button class="btn btn-primary me-1"><i class="fas fa-plus"></i> Agregar</button>` : ''}
                        ${p.bitEditar ? `<button class="btn btn-warning me-1"><i class="fas fa-edit"></i> Editar</button>` : ''}
                        ${p.bitEliminar ? `<button class="btn btn-danger me-1"><i class="fas fa-trash"></i> Eliminar</button>` : ''}
                        ${p.bitConsulta ? `<button class="btn btn-info me-1"><i class="fas fa-search"></i> Consultar</button>` : ''}
                        ${p.bitDetalle ? `<button class="btn btn-secondary me-1"><i class="fas fa-info-circle"></i> Detalle</button>` : ''}
                    </div>
                    <div class="alert alert-info">Módulo estático — sin funcionalidad real.</div>
                    <table class="table table-striped mt-3">
                        <thead><tr><th>Nombre</th><th>Descripción</th></tr></thead>
                        <tbody>
                            <tr><td>Ejemplo 1</td><td>Datos de ejemplo</td></tr>
                            <tr><td>Ejemplo 2</td><td>Datos de ejemplo</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    updateBreadcrumbs(modulo) {
        const breadcrumbsContainer = document.getElementById('breadcrumbs');
        if (!breadcrumbsContainer) return;

        const items = [
            `<li class="breadcrumb-item">
                <a href="#" onclick="window.dashboardApp.goHome(); return false;">
                    <i class="fas fa-home me-1"></i>Inicio
                </a>
            </li>`
        ];

        if (this.currentMenu) {
            items.push(`
                <li class="breadcrumb-item">
                    <span style="color: var(--bg-light); cursor: default;">${this.currentMenu}</span>
                </li>`);
        }

        items.push(`
            <li class="breadcrumb-item active" aria-current="page">
                ${modulo.strNombreModulo}
            </li>`);

        breadcrumbsContainer.innerHTML = `
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-0">${items.join('')}</ol>
            </nav>`;
    }

    goHome() {
        this.currentModule = null;
        this.currentMenu = null;
        document.getElementById('breadcrumbs').innerHTML = '';
        document.getElementById('contentContainer').innerHTML = `
            <div style="animation: fadeIn 0.4s ease-out;">
                <div class="row g-3 mb-4">
                    <div class="col-md-3">
                        <div class="card h-100">
                            <div class="card-body d-flex align-items-center gap-3">
                                <div style="background:rgba(249,177,122,0.15);border-radius:12px;padding:14px;">
                                    <i class="fas fa-car fa-lg" style="color:var(--accent);"></i>
                                </div>
                                <div>
                                    <div style="font-size:1.8rem;font-weight:700;color:var(--bg-dark);line-height:1;">1,248</div>
                                    <div style="color:var(--bg-light);font-size:0.85rem;font-weight:600;">Vehículos Registrados</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card h-100">
                            <div class="card-body d-flex align-items-center gap-3">
                                <div style="background:rgba(92,184,92,0.15);border-radius:12px;padding:14px;">
                                    <i class="fas fa-check-circle fa-lg" style="color:#5cb85c;"></i>
                                </div>
                                <div>
                                    <div style="font-size:1.8rem;font-weight:700;color:var(--bg-dark);line-height:1;">987</div>
                                    <div style="color:var(--bg-light);font-size:0.85rem;font-weight:600;">Permisos Vigentes</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card h-100">
                            <div class="card-body d-flex align-items-center gap-3">
                                <div style="background:rgba(224,92,92,0.15);border-radius:12px;padding:14px;">
                                    <i class="fas fa-exclamation-triangle fa-lg" style="color:#e05c5c;"></i>
                                </div>
                                <div>
                                    <div style="font-size:1.8rem;font-weight:700;color:var(--bg-dark);line-height:1;">43</div>
                                    <div style="color:var(--bg-light);font-size:0.85rem;font-weight:600;">Permisos Vencidos</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card h-100">
                            <div class="card-body d-flex align-items-center gap-3">
                                <div style="background:rgba(103,111,157,0.15);border-radius:12px;padding:14px;">
                                    <i class="fas fa-tools fa-lg" style="color:var(--bg-light);"></i>
                                </div>
                                <div>
                                    <div style="font-size:1.8rem;font-weight:700;color:var(--bg-dark);line-height:1;">18</div>
                                    <div style="color:var(--bg-light);font-size:0.85rem;font-weight:600;">En Mantenimiento</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row g-3">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <span>Últimos Vehículos Registrados</span>
                                <span class="badge" style="background:var(--accent);color:var(--bg-dark);">Hoy</span>
                            </div>
                            <div class="card-body p-0">
                                <table class="table mb-0">
                                    <thead>
                                        <tr>
                                            <th>Placa</th>
                                            <th>Propietario</th>
                                            <th>Tipo</th>
                                            <th>Estado</th>
                                            <th>Vencimiento</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td><strong>ABC-1234</strong></td><td>Carlos Mendoza</td><td>Sedán</td><td><span class="badge badge-success">Vigente</span></td><td>15/08/2025</td></tr>
                                        <tr><td><strong>XYZ-5678</strong></td><td>María López</td><td>SUV</td><td><span class="badge badge-success">Vigente</span></td><td>22/11/2025</td></tr>
                                        <tr><td><strong>DEF-9012</strong></td><td>Juan Torres</td><td>Pickup</td><td><span class="badge badge-danger">Vencido</span></td><td>01/01/2025</td></tr>
                                        <tr><td><strong>GHI-3456</strong></td><td>Ana Ramírez</td><td>Moto</td><td><span class="badge badge-success">Vigente</span></td><td>30/06/2025</td></tr>
                                        <tr><td><strong>JKL-7890</strong></td><td>Pedro Castillo</td><td>Camión</td><td><span class="badge badge-warning" style="color:var(--bg-dark);">Por vencer</span></td><td>10/04/2025</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-4 d-flex flex-column gap-3">
                        <div class="card">
                            <div class="card-header">Distribución por Tipo</div>
                            <div class="card-body">
                                ${[
                                    ['Sedán', 42, 'var(--accent)'],
                                    ['SUV', 28, 'var(--bg-mid)'],
                                    ['Pickup', 18, 'var(--bg-light)'],
                                    ['Motocicleta', 8, '#5cb85c'],
                                    ['Otros', 4, '#e05c5c']
                                ].map(([label, pct, color]) => `
                                    <div class="mb-2">
                                        <div class="d-flex justify-content-between mb-1">
                                            <small style="color:var(--bg-mid);font-weight:600;">${label}</small>
                                            <small style="color:var(--bg-mid);">${pct}%</small>
                                        </div>
                                        <div style="background:rgba(66,71,105,0.15);border-radius:4px;height:8px;">
                                            <div style="background:${color};width:${pct}%;height:100%;border-radius:4px;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header"><i class="fas fa-bell me-2"></i>Alertas Recientes</div>
                            <div class="card-body p-0">
                                ${[
                                    ['Permiso por vencer', 'JKL-7890 — vence en 5 días'],
                                    ['Mantenimiento programado', 'MNO-1122 — revisión técnica'],
                                    ['Nuevo registro', 'PQR-3344 registrado hoy']
                                ].map(([titulo, desc], i, arr) => `
                                    <div style="padding:12px 16px;${i < arr.length-1 ? 'border-bottom:1px solid rgba(66,71,105,0.1);' : ''}">
                                        <div style="font-size:0.85rem;font-weight:600;color:var(--bg-dark);">${titulo}</div>
                                        <div style="font-size:0.78rem;color:var(--bg-light);">${desc}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    loadUserInfo() {
        const userInfo = document.getElementById('userInfo');
        if (userInfo && this.usuario) {
            userInfo.innerHTML = `
                <div class="d-flex align-items-center">
                    ${this.usuario.strFotoPerfil ?
                        `<img src="${this.usuario.strFotoPerfil}" class="rounded-circle me-2" width="40" height="40" style="object-fit:cover;">` :
                        '<i class="fas fa-user-circle me-2 fa-2x" style="color:var(--bg-mid);"></i>'
                    }
                    <div>
                        <strong>${this.usuario.strNombreUsuario || 'Usuario'}</strong><br>
                        <small>${this.usuario.strCorreo || 'Sin correo'}</small>
                    </div>
                </div>`;
        }
    }

    bindEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.replace('/login');
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
});