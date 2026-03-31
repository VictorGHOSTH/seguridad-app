class PerfilModule {
    constructor(token, permisos = {}) {
        this.token = token;
        this.permisos = permisos;
        this.currentPage = 1;
        this.pageSize = 5;
        this.init();
    }

    async init() {
        await this.loadPerfiles();
        this.bindEvents();
        this.aplicarPermisos(); // ocultar botones según permisos
    }

    // Ocultar botón "Nuevo" si no tiene permiso de agregar
    aplicarPermisos() {
        const btnNuevo = document.getElementById('btnNuevoPerfil');
        if (btnNuevo && !this.permisos.bitAgregar) {
            btnNuevo.style.display = 'none';
        }
    }

    async loadPerfiles() {
        try {
            const response = await fetch(`/api/perfiles?page=${this.currentPage}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderTable(data.data);
                this.renderPagination(data.total, data.page, data.pageSize);
            } else {
                this.showError('Error al cargar los perfiles');
            }
        } catch (error) {
            this.showError('Error de conexión');
        }
    }

    renderTable(perfiles) {
        const tbody = document.getElementById('perfilTableBody');
        if (!tbody) return;

        if (!perfiles || perfiles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay perfiles registrados</td></tr>';
            return;
        }

        // perfil.js - renderTable
        tbody.innerHTML = perfiles.map(perfil => `
            <tr>
                <td>${this.escapeHtml(perfil.strNombrePerfil)}</td>
                <td>
                    <span class="badge ${perfil.bitAdministrador ? 'badge-success' : 'badge-secondary'}">
                        ${perfil.bitAdministrador ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        ${this.permisos.bitDetalle !== false ? `
                            <button class="btn btn-sm btn-info" onclick="window.perfilModule.viewDetail(${perfil.id})">
                                <i class="fas fa-eye"></i>
                            </button>` : ''}
                        ${this.permisos.bitEditar !== false ? `
                            <button class="btn btn-sm btn-warning" onclick="window.perfilModule.editPerfil(${perfil.id})">
                                <i class="fas fa-edit"></i>
                            </button>` : ''}
                        ${this.permisos.bitEliminar !== false ? `
                            <button class="btn btn-sm btn-danger" onclick="window.perfilModule.deletePerfil(${perfil.id})">
                                <i class="fas fa-trash"></i>
                            </button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination(total, currentPage, pageSize) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(total / pageSize);
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHtml = `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.perfilModule.changePage(${currentPage - 1}); return false;">Anterior</a>
            </li>
        `;

        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="window.perfilModule.changePage(1); return false;">1</a></li>`;
            if (startPage > 2) paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="window.perfilModule.changePage(${i}); return false;">${i}</a>
                </li>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="window.perfilModule.changePage(${totalPages}); return false;">${totalPages}</a></li>`;
        }

        paginationHtml += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.perfilModule.changePage(${currentPage + 1}); return false;">Siguiente</a>
            </li>`;

        paginationContainer.innerHTML = paginationHtml;
    }

    changePage(page) {
        this.currentPage = page;
        this.loadPerfiles();
    }

    showCreateModal() {
        document.getElementById('perfilModalTitle').textContent = 'Crear Perfil';
        document.getElementById('perfilId').value = '';
        document.getElementById('perfilNombre').value = '';
        document.getElementById('perfilAdministrador').checked = false;
        new bootstrap.Modal(document.getElementById('perfilModal')).show();
    }

    async editPerfil(id) {
        try {
            const response = await fetch(`/api/perfiles/${id}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const perfil = await response.json();
                document.getElementById('perfilModalTitle').textContent = 'Editar Perfil';
                document.getElementById('perfilId').value = perfil.id;
                document.getElementById('perfilNombre').value = perfil.strNombrePerfil;
                document.getElementById('perfilAdministrador').checked = perfil.bitAdministrador;
                new bootstrap.Modal(document.getElementById('perfilModal')).show();
            } else {
                this.showError('Error al cargar el perfil');
            }
        } catch (error) {
            this.showError('Error al cargar el perfil');
        }
    }

    async savePerfil() {
        const id = document.getElementById('perfilId').value;
        const perfil = {
            id: id ? parseInt(id) : 0,
            strNombrePerfil: document.getElementById('perfilNombre').value.trim(),
            bitAdministrador: document.getElementById('perfilAdministrador').checked
        };

        if (!perfil.strNombrePerfil) {
            this.showError('Por favor ingrese el nombre del perfil');
            return;
        }

        try {
            const url = id ? `/api/perfiles/${id}` : '/api/perfiles';
            const method = id ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(perfil)
            });

            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('perfilModal')).hide();
                await this.loadPerfiles();
                alert(id ? 'Perfil actualizado exitosamente' : 'Perfil creado exitosamente');
            } else {
                const error = await response.json();
                this.showError(error.error || 'Error al guardar el perfil');
            }
        } catch (error) {
            this.showError('Error al guardar el perfil');
        }
    }

    async deletePerfil(id) {
        if (confirm('¿Está seguro de eliminar este perfil?')) {
            try {
                const response = await fetch(`/api/perfiles/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });

                if (response.ok) {
                    await this.loadPerfiles();
                    alert('Perfil eliminado exitosamente');
                } else {
                    const error = await response.json();
                    this.showError(error.error || 'Error al eliminar el perfil');
                }
            } catch (error) {
                this.showError('Error al eliminar el perfil');
            }
        }
    }

    async viewDetail(id) {
        try {
            const response = await fetch(`/api/perfiles/${id}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const perfil = await response.json();
                //document.getElementById('detailId').textContent = perfil.id;
                document.getElementById('detailNombre').textContent = perfil.strNombrePerfil;
                document.getElementById('detailAdministrador').textContent = perfil.bitAdministrador ? 'Sí' : 'No';
                new bootstrap.Modal(document.getElementById('perfilDetailModal')).show();
            } else {
                this.showError('Error al cargar el detalle del perfil');
            }
        } catch (error) {
            this.showError('Error al cargar el detalle del perfil');
        }
    }

    bindEvents() {
        const form = document.getElementById('perfilForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePerfil();
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

window.perfilModule = null;