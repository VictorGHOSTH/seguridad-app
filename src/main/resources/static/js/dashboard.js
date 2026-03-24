class DashboardApp {
    constructor() {
        this.token = localStorage.getItem('token');
        this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        this.currentModule = null;
        this.init();
    }

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

    async verifyToken() {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Token inválido');
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login';
        }
    }

    async loadMenus() {
        try {
            const response = await fetch('/api/menus', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const menus = await response.json();
                this.renderMenus(menus);
            } else {
                console.error('Error loading menus');
            }
        } catch (error) {
            console.error('Error loading menus:', error);
        }
    }

    renderMenus(menus) {
        const menuContainer = document.getElementById('menusContainer');
        menuContainer.innerHTML = '';

        menus.forEach(menu => {
            const menuItem = this.createMenuItem(menu);
            menuContainer.appendChild(menuItem);
        });
    }

    createMenuItem(menu) {
        const li = document.createElement('li');
        li.className = 'nav-item dropdown';

        const a = document.createElement('a');
        a.className = 'nav-link dropdown-toggle';
        a.href = '#';
        a.setAttribute('data-bs-toggle', 'dropdown');
        a.textContent = menu.strNombreMenu;

        const ul = document.createElement('ul');
        ul.className = 'dropdown-menu';

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
                ul.appendChild(subItem);
            });
        } else {
            const emptyItem = document.createElement('li');
            const emptyLink = document.createElement('a');
            emptyLink.className = 'dropdown-item disabled';
            emptyLink.href = '#';
            emptyLink.textContent = 'No hay módulos';
            emptyItem.appendChild(emptyLink);
            ul.appendChild(emptyItem);
        }

        li.appendChild(a);
        li.appendChild(ul);
        return li;
    }

    async loadModule(modulo) {
        this.currentModule = modulo;
        this.updateBreadcrumbs(modulo);

        const contentContainer = document.getElementById('contentContainer');
        contentContainer.innerHTML = '<div class="text-center"><div class="loader"></div><p>Cargando módulo...</p></div>';

        const modulesWithCrud = ['Perfil', 'Módulo', 'Permisos-Perfil', 'Usuario'];

        if (modulesWithCrud.includes(modulo.strNombreModulo)) {
            await this.loadCrudModule(modulo.strNombreModulo);
        } else {
            this.loadStaticModule(modulo.strNombreModulo);
        }
    }

    async loadCrudModule(moduleName) {
        try {
            // ✅ fix: nombre de archivo correcto para Permisos-Perfil
            const moduleFileName = moduleName.toLowerCase().replace('ó', 'o').replace('-perfil', 'perfil').replace(' ', '');
            const fileMap = {
                'Perfil': 'perfil',
                'Módulo': 'modulo',
                'Permisos-Perfil': 'permisos-perfil',
                'Usuario': 'usuario'
            };
            const fileName = fileMap[moduleName] || moduleName.toLowerCase();
            const response = await fetch(`/templates/${fileName}.html`);

            if (response.ok) {
                const html = await response.text();
                document.getElementById('contentContainer').innerHTML = html;

                // ✅ fix: siempre instanciar, no verificar window.X
                setTimeout(() => {
                    switch(moduleName) {
                        case 'Perfil':
                            window.perfilModule = new PerfilModule(this.token);
                            break;
                        case 'Usuario':
                            window.usuarioModule = new UsuarioModule(this.token);
                            break;
                        case 'Módulo':
                            window.moduloModule = new ModuloModule(this.token);
                            break;
                        case 'Permisos-Perfil':
                            window.permisosPerfilModule = new PermisosPerfilModule(this.token);
                            break;
                    }
                }, 100);
            } else {
                throw new Error('Error loading template');
            }
        } catch (error) {
            console.error('Error loading CRUD module:', error);
            document.getElementById('contentContainer').innerHTML = `
                <div class="alert alert-danger">
                    Error al cargar el módulo ${moduleName}
                </div>
            `;
        }
    }

    loadStaticModule(moduleName) {
        const contentContainer = document.getElementById('contentContainer');
        contentContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>${moduleName}</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <button class="btn btn-primary" onclick="alert('Funcionalidad de agregar - Módulo estático')">
                            <i class="fas fa-plus"></i> Agregar
                        </button>
                        <button class="btn btn-warning" onclick="alert('Funcionalidad de editar - Módulo estático')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger" onclick="alert('Funcionalidad de eliminar - Módulo estático')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                        <button class="btn btn-info" onclick="alert('Funcionalidad de consultar - Módulo estático')">
                            <i class="fas fa-search"></i> Consultar
                        </button>
                        <button class="btn btn-secondary" onclick="alert('Funcionalidad de detalle - Módulo estático')">
                            <i class="fas fa-info-circle"></i> Detalle
                        </button>
                    </div>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> Este es un módulo estático. Los botones de CRUD no tienen funcionalidad real.
                    </div>
                    <div class="table-container">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td>Ejemplo 1</td>
                                    <td>Datos de ejemplo para módulo estático</td>
                                </tr>
                                <tr>
                                    <td>2</td>
                                    <td>Ejemplo 2</td>
                                    <td>Datos de ejemplo para módulo estático</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    updateBreadcrumbs(modulo) {
        const breadcrumbsContainer = document.getElementById('breadcrumbs');
        breadcrumbsContainer.innerHTML = `
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="#" onclick="return false;">Inicio</a></li>
                    <li class="breadcrumb-item active" aria-current="page">${modulo.strNombreModulo}</li>
                </ol>
            </nav>
        `;
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
                </div>
            `;
        }
    }

    bindEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
});