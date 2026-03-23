class PermisosPerfilModule {
    constructor(token) {
        this.token = token;
        this.currentPage = 1;
        this.pageSize = 5;
        this.perfiles = [];
        this.modulos = [];
        this.init();
    }

    async init() {
        await Promise.all([
            this.loadPerfiles(),
            this.loadModulos(),
            this.loadPermisos()
        ]);
        this.bindEvents();
    }

    async loadPerfiles() {
        try {
            const response = await fetch('/api/perfiles?page=1&pageSize=100', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.perfiles = data.data;
                this.populatePerfilSelect();
            }
        } catch (error) {
            console.error('Error loading perfiles:', error);
        }
    }

    async loadModulos() {
        try {
            const response = await fetch('/api/modulos/all', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.modulos = await response.json();
                this.populateModuloSelect();
            }
        } catch (error) {
            console.error('Error loading modulos:', error);
        }
    }

    populatePerfilSelect() {
        const select = document.getElementById('permisosPerfil');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccione un perfil</option>';
        this.perfiles.forEach(perfil => {
            select.innerHTML += `<option value="${perfil.id}">${this.escapeHtml(perfil.strNombrePerfil)}</option>`;
        });
    }

    populateModuloSelect() {
        const select = document.getElementById('permisosModulo');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccione un módulo</option>';
        this.modulos.forEach(modulo => {
            select.innerHTML += `<option value="${modulo.id}">${this.escapeHtml(modulo.strNombreModulo)}</option>`;
        });
    }

    async loadPermisos() {
        try {
            const response = await fetch(`/api/permisos-perfil?page=${this.currentPage}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderTable(data.data);
                this.renderPagination(data.total, data.page, data.pageSize);
            } else {
                console.error('Error loading permisos');
                this.showError('Error al cargar los permisos');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error de conexión');
        }
    }

    renderTable(permisos) {
        const tbody = document.getElementById('permisosTableBody');
        if (!tbody) return;

        if (!permisos || permisos.length === 0) {
            tbody.innerHTML = '|<td colspan="9" class="text-center">No hay permisos registrados</td>|';
            return;
        }

        tbody.innerHTML = permisos.map(permiso => {
            const perfil = this.perfiles.find(p => p.id === permiso.idPerfil);
            const modulo = this.modulos.find(m => m.id === permiso.idModulo);
            return `
                <tr>
                    <td>${permiso.id}</td>
                    <td>${perfil ? this.escapeHtml(perfil.strNombrePerfil) : 'N/A'}</td>
                    <td>${modulo ? this.escapeHtml(modulo.strNombreModulo) : 'N/A'}</td>
                    <td><i class="fas ${permiso.bitAgregar ? 'fa-check text-success' : 'fa-times text-danger'}"></i></td>
                    <td><i class="fas ${permiso.bitEditar ? 'fa-check text-success' : 'fa-times text-danger'}"></i></td>
                    <td><i class="fas ${permiso.bitConsulta ? 'fa-check text-success' : 'fa-times text-danger'}"></i></td>
                    <td><i class="fas ${permiso.bitEliminar ? 'fa-check text-success' : 'fa-times text-danger'}"></i></td>
                    <td><i class="fas ${permiso.bitDetalle ? 'fa-check text-success' : 'fa-times text-danger'}"></i></td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-warning" onclick="window.permisosPerfilModule.editPermisos(${permiso.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.permisosPerfilModule.deletePermisos(${permiso.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderPagination(total, currentPage, pageSize) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(total / pageSize);
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHtml = '';

        paginationHtml += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.permisosPerfilModule.changePage(${currentPage - 1}); return false;">Anterior</a>
            </li>
        `;

        for (let i = 1; i <= totalPages && i <= 5; i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="window.permisosPerfilModule.changePage(${i}); return false;">${i}</a>
                </li>
            `;
        }

        if (totalPages > 5) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="window.permisosPerfilModule.changePage(${totalPages}); return false;">${totalPages}</a>
                </li>
            `;
        }

        paginationHtml += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.permisosPerfilModule.changePage(${currentPage + 1}); return false;">Siguiente</a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHtml;
    }

    changePage(page) {
        this.currentPage = page;
        this.loadPermisos();
    }

    showCreateModal() {
        document.getElementById('permisosModalTitle').textContent = 'Configurar Permisos';
        document.getElementById('permisosId').value = '';
        document.getElementById('permisosPerfil').value = '';
        document.getElementById('permisosModulo').value = '';
        document.getElementById('permisoAgregar').checked = false;
        document.getElementById('permisoEditar').checked = false;
        document.getElementById('permisoConsultar').checked = false;
        document.getElementById('permisoEliminar').checked = false;
        document.getElementById('permisoDetalle').checked = false;

        const modal = new bootstrap.Modal(document.getElementById('permisosModal'));
        modal.show();
    }

    async editPermisos(id) {
        try {
            const response = await fetch(`/api/permisos-perfil/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const permisos = await response.json();
                document.getElementById('permisosModalTitle').textContent = 'Editar Permisos';
                document.getElementById('permisosId').value = permisos.id;
                document.getElementById('permisosPerfil').value = permisos.idPerfil;
                document.getElementById('permisosModulo').value = permisos.idModulo;
                document.getElementById('permisoAgregar').checked = permisos.bitAgregar;
                document.getElementById('permisoEditar').checked = permisos.bitEditar;
                document.getElementById('permisoConsultar').checked = permisos.bitConsulta;
                document.getElementById('permisoEliminar').checked = permisos.bitEliminar;
                document.getElementById('permisoDetalle').checked = permisos.bitDetalle;

                const modal = new bootstrap.Modal(document.getElementById('permisosModal'));
                modal.show();
            } else {
                this.showError('Error al cargar los permisos');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error al cargar los permisos');
        }
    }

    async savePermisos() {
        const id = document.getElementById('permisosId').value;
        const permisos = {
            id: id ? parseInt(id) : 0,
            idPerfil: parseInt(document.getElementById('permisosPerfil').value),
            idModulo: parseInt(document.getElementById('permisosModulo').value),
            bitAgregar: document.getElementById('permisoAgregar').checked,
            bitEditar: document.getElementById('permisoEditar').checked,
            bitConsulta: document.getElementById('permisoConsultar').checked,
            bitEliminar: document.getElementById('permisoEliminar').checked,
            bitDetalle: document.getElementById('permisoDetalle').checked
        };

        if (!permisos.idPerfil) {
            this.showError('Por favor seleccione un perfil');
            return;
        }

        if (!permisos.idModulo) {
            this.showError('Por favor seleccione un módulo');
            return;
        }

        try {
            let response;
            if (id) {
                response = await fetch(`/api/permisos-perfil/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(permisos)
                });
            } else {
                response = await fetch('/api/permisos-perfil', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(permisos)
                });
            }

            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('permisosModal')).hide();
                await this.loadPermisos();
                alert(id ? 'Permisos actualizados exitosamente' : 'Permisos creados exitosamente');
            } else {
                const error = await response.json();
                this.showError(error.error || 'Error al guardar los permisos');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error al guardar los permisos');
        }
    }

    async deletePermisos(id) {
        if (confirm('¿Está seguro de eliminar estos permisos? Esta acción no se puede deshacer.')) {
            try {
                const response = await fetch(`/api/permisos-perfil/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.ok) {
                    await this.loadPermisos();
                    alert('Permisos eliminados exitosamente');
                } else {
                    const error = await response.json();
                    this.showError(error.error || 'Error al eliminar los permisos');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showError('Error al eliminar los permisos');
            }
        }
    }

    bindEvents() {
        const form = document.getElementById('permisosForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePermisos();
            });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        alert(message);
    }
}

window.permisosPerfilModule = null;