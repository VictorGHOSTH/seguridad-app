class DashboardApp {
    constructor() {
        this.token = localStorage.getItem('token');
        this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        this.esAdministrador = localStorage.getItem('esAdministrador') === 'true';
        this.permisos = JSON.parse(localStorage.getItem('permisos') || '[]');
        this.currentModule = null;
        this.init();
    }

    // ✅ Método init que faltaba
    async init() {
        if (!this.token) {
            window.location.href = '/login';
            return;
        }
        await this.verifyToken();
        this.loadUserInfo();
        await this.loadMenus();
        this.bindEvents();
    }

    // ✅ Método verifyToken que faltaba
    async verifyToken() {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!response.ok) throw new Error('Token inválido');
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            localStorage.removeItem('esAdministrador');
            localStorage.removeItem('permisos');
            window.location.href = '/login';
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

    // ✅ Método renderMenus que faltaba
    renderMenus(menus) {
        const menuContainer = document.getElementById('menusContainer');
        if (!menuContainer) return;
        menuContainer.innerHTML = '';
        menus.forEach(menu => {
            const menuItem = this.createMenuItem(menu);
            menuContainer.appendChild(menuItem);
        });
    }

    // ✅ Método createMenuItem que faltaba
    createMenuItem(menu) {
        const li = document.createElement('li');
        li.className = 'nav-item';

        // ✅ Icono por nombre de menú
        const iconMap = {
            'Seguridad': 'fa-lock',
            'Principal 1': 'fa-layer-group',
            'Principal 2': 'fa-th-large',
        };
        const icon = iconMap[menu.strNombreMenu] || 'fa-folder';

        const toggleId = `menu-${menu.id}`;

        li.innerHTML = `
            <a class="nav-link dropdown-toggle"
               href="#${toggleId}"
               data-bs-toggle="collapse"
               aria-expanded="false">
                <i class="fas ${icon}"></i>
                <span class="sidebar-text ms-3">${menu.strNombreMenu}</span>
            </a>
            <div class="collapse" id="${toggleId}">
                <ul class="dropdown-menu w-100" id="submenu-${menu.id}"></ul>
            </div>
        `;

        const submenu = li.querySelector(`#submenu-${menu.id}`);

        if (menu.modulos && menu.modulos.length > 0) {
            menu.modulos.forEach(modulo => {
                const subItem = document.createElement('li');
                const subLink = document.createElement('a');
                subLink.className = 'dropdown-item';
                subLink.href = '#';
                subLink.textContent = modulo.strNombreModulo;
                subLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.loadModule(modulo);
                });
                subItem.appendChild(subLink);
                submenu.appendChild(subItem);
            });
        } else {
            submenu.innerHTML = `
                <li><a class="dropdown-item disabled" href="#">Sin módulos</a></li>
            `;
        }

        return li;
    }

    async loadModule(modulo) {
        this.currentModule = modulo;
        this.updateBreadcrumbs(modulo);

        const permiso = this.getPermisoModulo(modulo.strNombreModulo);
        const modulesWithCrud = ['Perfil', 'Módulo', 'Permisos-Perfil', 'Usuario'];

        if (modulesWithCrud.includes(modulo.strNombreModulo)) {
            await this.loadCrudModule(modulo.strNombreModulo, permiso);
        } else {
            this.loadStaticModule(modulo.strNombreModulo, permiso);
        }
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

        const contentContainer = document.getElementById('contentContainer');
        contentContainer.innerHTML = `
            <div class="card">
                <div class="card-header"><h3>${moduleName}</h3></div>
                <div class="card-body">
                    <div class="mb-3">
                        ${p.bitAgregar ? `<button class="btn btn-primary me-1" onclick="alert('Agregar')"><i class="fas fa-plus"></i> Agregar</button>` : ''}
                        ${p.bitEditar ? `<button class="btn btn-warning me-1" onclick="alert('Editar')"><i class="fas fa-edit"></i> Editar</button>` : ''}
                        ${p.bitEliminar ? `<button class="btn btn-danger me-1" onclick="alert('Eliminar')"><i class="fas fa-trash"></i> Eliminar</button>` : ''}
                        ${p.bitConsulta ? `<button class="btn btn-info me-1" onclick="alert('Consultar')"><i class="fas fa-search"></i> Consultar</button>` : ''}
                        ${p.bitDetalle ? `<button class="btn btn-secondary me-1" onclick="alert('Detalle')"><i class="fas fa-info-circle"></i> Detalle</button>` : ''}
                    </div>
                    <div class="alert alert-info">Módulo estático — sin funcionalidad real.</div>
                    <div class="table-container">
                        <table class="table table-striped">
                            <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th></tr></thead>
                            <tbody>
                                <tr><td>1</td><td>Ejemplo 1</td><td>Datos de ejemplo</td></tr>
                                <tr><td>2</td><td>Ejemplo 2</td><td>Datos de ejemplo</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    }

    updateBreadcrumbs(modulo) {
        const breadcrumbsContainer = document.getElementById('breadcrumbs');
        if (!breadcrumbsContainer) return;
        breadcrumbsContainer.innerHTML = `
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="#" onclick="return false;">Inicio</a></li>
                    <li class="breadcrumb-item active" aria-current="page">${modulo.strNombreModulo}</li>
                </ol>
            </nav>`;
    }

    loadUserInfo() {
        const userInfo = document.getElementById('userInfo');
        if (userInfo && this.usuario) {
            userInfo.innerHTML = `
                <div class="d-flex align-items-center">
                    ${this.usuario.strFotoPerfil ?
                        `<img src="${this.usuario.strFotoPerfil}" class="rounded-circle me-2" width="40" height="40" style="object-fit: cover;">` :
                        '<i class="fas fa-user-circle me-2 fa-2x"></i>'
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
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                localStorage.removeItem('esAdministrador');
                localStorage.removeItem('permisos');
                window.location.href = '/login';
            });
        }

        const toggleSidebar = document.getElementById('toggleSidebar');
        if (toggleSidebar) {
            toggleSidebar.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('active');
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
});