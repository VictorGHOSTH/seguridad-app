class DashboardApp {
    constructor() {
        this.token = localStorage.getItem('token');
        this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        this.esAdministrador = localStorage.getItem('esAdministrador') === 'true';
        this.permisos = JSON.parse(localStorage.getItem('permisos') || '[]'); // ✅
        this.currentModule = null;
        this.init();
    }

    // ✅ Nuevo método para verificar permisos
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
                // ✅ Filtrar menús según permisos
                const menusFiltrados = this.filtrarMenusPorPermisos(menus);
                this.renderMenus(menusFiltrados);
            }
        } catch (error) {
            console.error('Error loading menus:', error);
        }
    }

    // ✅ Filtrar menús — solo mostrar módulos con permisos
    filtrarMenusPorPermisos(menus) {
        if (this.esAdministrador) return menus;

        return menus.map(menu => ({
            ...menu,
            modulos: menu.modulos.filter(modulo =>
                this.permisos.some(p => p.strNombreModulo === modulo.strNombreModulo)
            )
        })).filter(menu => menu.modulos.length > 0);
    }

    async loadModule(modulo) {
        this.currentModule = modulo;
        this.updateBreadcrumbs(modulo);

        const permiso = this.getPermisoModulo(modulo.strNombreModulo);

        // ✅ Pasar permisos al cargar el módulo
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
                    // ✅ Pasar permisos a cada módulo
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