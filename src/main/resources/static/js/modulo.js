class ModuloModule {
constructor(token, permisos = {}) {
        this.token = token;
        this.permisos = permisos;
        this.currentPage = 1;
        this.pageSize = 5;
        this.init();
    }

    async init() {
        await this.loadModulos();
        this.bindEvents();
        this.aplicarPermisos();
    }

    aplicarPermisos() {
        const btnNuevo = document.getElementById('btnNuevoModulo');
        if (btnNuevo && !this.permisos.bitAgregar) {
            btnNuevo.style.display = 'none';
        }
    }

    async loadModulos() {
        try {
            const response = await fetch(`/api/modulos?page=${this.currentPage}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderTable(data.data);
                this.renderPagination(data.total, data.page, data.pageSize);
            } else {
                console.error('Error loading modulos');
                this.showError('Error al cargar los módulos');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error de conexión');
        }
    }

    renderTable(modulos) {
        const tbody = document.getElementById('moduloTableBody');
        if (!tbody) return;

        if (!modulos || modulos.length === 0) {
            tbody.innerHTML = '|<td colspan="3" class="text-center">No hay módulos registrados</td>|';
            return;
        }

        tbody.innerHTML = modulos.map(modulo => `
            <tr>
                <td>${this.escapeHtml(modulo.strNombreModulo)}</td>
                <td>
                    <div class="btn-group">
                        ${this.permisos.bitDetalle !== false ? `
                            <button class="btn btn-sm btn-info" onclick="window.moduloModule.viewDetail(${modulo.id})">
                                <i class="fas fa-eye"></i>
                            </button>` : ''}
                        ${this.permisos.bitEditar !== false ? `
                            <button class="btn btn-sm btn-warning" onclick="window.moduloModule.editModulo(${modulo.id})">
                                <i class="fas fa-edit"></i>
                            </button>` : ''}
                        ${this.permisos.bitEliminar !== false ? `
                            <button class="btn btn-sm btn-danger" onclick="window.moduloModule.deleteModulo(${modulo.id})">
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

        let paginationHtml = '';

        paginationHtml += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.moduloModule.changePage(${currentPage - 1}); return false;">Anterior</a>
            </li>
        `;

        for (let i = 1; i <= totalPages && i <= 5; i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="window.moduloModule.changePage(${i}); return false;">${i}</a>
                </li>
            `;
        }

        if (totalPages > 5) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="window.moduloModule.changePage(${totalPages}); return false;">${totalPages}</a>
                </li>
            `;
        }

        paginationHtml += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.moduloModule.changePage(${currentPage + 1}); return false;">Siguiente</a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHtml;
    }

    changePage(page) {
        this.currentPage = page;
        this.loadModulos();
    }

    showCreateModal() {
        document.getElementById('moduloModalTitle').textContent = 'Crear Módulo';
        document.getElementById('moduloId').value = '';
        document.getElementById('moduloNombre').value = '';

        const modal = new bootstrap.Modal(document.getElementById('moduloModal'));
        modal.show();
    }

    async editModulo(id) {
        try {
            const response = await fetch(`/api/modulos/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const modulo = await response.json();
                document.getElementById('moduloModalTitle').textContent = 'Editar Módulo';
                document.getElementById('moduloId').value = modulo.id;
                document.getElementById('moduloNombre').value = modulo.strNombreModulo;

                const modal = new bootstrap.Modal(document.getElementById('moduloModal'));
                modal.show();
            } else {
                this.showError('Error al cargar el módulo');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error al cargar el módulo');
        }
    }

    async saveModulo() {
        const id = document.getElementById('moduloId').value;
        const modulo = {
            id: id ? parseInt(id) : 0,
            strNombreModulo: document.getElementById('moduloNombre').value.trim()
        };

        if (!modulo.strNombreModulo) {
            this.showError('Por favor ingrese el nombre del módulo');
            return;
        }

        try {
            let response;
            if (id) {
                response = await fetch(`/api/modulos/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(modulo)
                });
            } else {
                response = await fetch('/api/modulos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(modulo)
                });
            }

            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('moduloModal')).hide();
                await this.loadModulos();
                alert(id ? 'Módulo actualizado exitosamente' : 'Módulo creado exitosamente');
            } else {
                const error = await response.json();
                this.showError(error.error || 'Error al guardar el módulo');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error al guardar el módulo');
        }
    }

    async deleteModulo(id) {
        if (confirm('¿Está seguro de eliminar este módulo? Esta acción no se puede deshacer.')) {
            try {
                const response = await fetch(`/api/modulos/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.ok) {
                    await this.loadModulos();
                    alert('Módulo eliminado exitosamente');
                } else {
                    const error = await response.json();
                    this.showError(error.error || 'Error al eliminar el módulo');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showError('Error al eliminar el módulo');
            }
        }
    }

   async viewDetail(id) {
       try {
           const response = await fetch(`/api/modulos/${id}`, {
               headers: { 'Authorization': `Bearer ${this.token}` }
           });

           if (response.ok) {
               const modulo = await response.json();
               document.getElementById('detailNombre').textContent = modulo.strNombreModulo;
               new bootstrap.Modal(document.getElementById('moduloDetailModal')).show();
           } else {
               this.showError('Error al cargar el detalle del módulo');
           }
       } catch (error) {
           this.showError('Error al cargar el detalle del módulo');
       }
   }

    bindEvents() {
        const form = document.getElementById('moduloForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveModulo();
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

window.moduloModule = null;