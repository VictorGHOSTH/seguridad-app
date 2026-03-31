class PermisosPerfilModule {
    constructor(token, permisos = {}) {
        this.token = token;
        this.permisos = permisos;
        this.currentPage = 1;
        this.pageSize = 5;
        this.perfiles = [];
        this.modulos = [];
        this.filtroPerfilId = '';
        this.init();
    }

    async init() {
        await Promise.all([
            this.loadPerfiles(),
            this.loadModulos()  // ✅ cargar módulos al inicio
        ]);
        await this.loadPermisos();
        this.aplicarPermisos();
        this.bindEvents();
    }

    aplicarPermisos() {
        const btnNuevo = document.getElementById('btnNuevoPermiso');
        if (btnNuevo && !this.permisos.bitAgregar) {
            btnNuevo.style.display = 'none';
        }
    }

    async loadPerfiles() {
        try {
            const response = await fetch('/api/perfiles?page=1', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                this.perfiles = data.data;
                this.populatePerfilSelects();
            }
        } catch (error) {
            console.error('Error loading perfiles:', error);
        }
    }

    // ✅ método que faltaba
    async loadModulos() {
        try {
            const response = await fetch('/api/modulos/all', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                this.modulos = await response.json();
            }
        } catch (error) {
            console.error('Error loading modulos:', error);
        }
    }

    populatePerfilSelects() {
        const selectModal = document.getElementById('permisosPerfil');
        if (selectModal) {
            selectModal.innerHTML = '<option value="">Seleccione un perfil</option>';
            this.perfiles.forEach(p => {
                selectModal.innerHTML += `<option value="${p.id}">${this.escapeHtml(p.strNombrePerfil)}</option>`;
            });
        }

        const selectFiltro = document.getElementById('filtroPerfil');
        if (selectFiltro) {
            selectFiltro.innerHTML = '<option value="">Todos los perfiles</option>';
            this.perfiles.forEach(p => {
                selectFiltro.innerHTML += `<option value="${p.id}">${this.escapeHtml(p.strNombrePerfil)}</option>`;
            });
        }
    }

    async onPerfilChange() {
        const perfilId = document.getElementById('permisosPerfil').value;

        if (!perfilId) {
            document.getElementById('modulosContainer').style.display = 'none';
            document.getElementById('modulosLoading').style.display = 'none';
            return;
        }

        document.getElementById('modulosLoading').style.display = 'block';
        document.getElementById('modulosContainer').style.display = 'none';

        try {
            const permisosActuales = await this.getPermisosByPerfil(parseInt(perfilId));
            this.renderModulosPermisos(permisosActuales);
            document.getElementById('modulosLoading').style.display = 'none';
            document.getElementById('modulosContainer').style.display = 'block';
        } catch (error) {
            console.error('Error en onPerfilChange:', error);
            document.getElementById('modulosLoading').style.display = 'none';
        }
    }

    async getPermisosByPerfil(perfilId) {
        try {
            const response = await fetch(`/api/permisos-perfil?page=1`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const totalPages = Math.ceil(data.total / data.pageSize);
                let todosLosPermisos = [...data.data];

                if (totalPages > 1) {
                    const peticiones = [];
                    for (let page = 2; page <= totalPages; page++) {
                        peticiones.push(
                            fetch(`/api/permisos-perfil?page=${page}`, {
                                headers: { 'Authorization': `Bearer ${this.token}` }
                            }).then(r => r.json())
                        );
                    }
                    const resultados = await Promise.all(peticiones);
                    resultados.forEach(r => {
                        todosLosPermisos = [...todosLosPermisos, ...r.data];
                    });
                }

                return todosLosPermisos.filter(p => p.idPerfil === perfilId);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        return [];
    }

    renderModulosPermisos(permisosActuales) {
        const tbody = document.getElementById('modulosPermisosBody');
        if (!tbody) return;

        tbody.innerHTML = this.modulos.map(modulo => {
            const permisoExistente = permisosActuales.find(p => p.idModulo === modulo.id);
            const visible = !!permisoExistente;
            const ag = permisoExistente?.bitAgregar || false;
            const ed = permisoExistente?.bitEditar || false;
            const co = permisoExistente?.bitConsulta || false;
            const el = permisoExistente?.bitEliminar || false;
            const de = permisoExistente?.bitDetalle || false;
            const pid = permisoExistente?.id || '';

            return `
                <tr id="row-modulo-${modulo.id}" class="${visible ? '' : 'table-light text-muted'}">
                    <td>
                        <input type="hidden" id="permiso-id-${modulo.id}" value="${pid}">
                        <strong>${this.escapeHtml(modulo.strNombreModulo)}</strong>
                    </td>
                    <td class="text-center">
                        <input type="checkbox" class="form-check-input chk-visible"
                            id="visible-${modulo.id}"
                            ${visible ? 'checked' : ''}
                            onchange="window.permisosPerfilModule.onVisibleChange(${modulo.id})">
                    </td>
                    <td class="text-center">
                        <input type="checkbox" class="form-check-input crud-check"
                            id="agregar-${modulo.id}" ${ag ? 'checked' : ''} ${!visible ? 'disabled' : ''}>
                    </td>
                    <td class="text-center">
                        <input type="checkbox" class="form-check-input crud-check"
                            id="editar-${modulo.id}" ${ed ? 'checked' : ''} ${!visible ? 'disabled' : ''}>
                    </td>
                    <td class="text-center">
                        <input type="checkbox" class="form-check-input crud-check"
                            id="consultar-${modulo.id}" ${co ? 'checked' : ''} ${!visible ? 'disabled' : ''}>
                    </td>
                    <td class="text-center">
                        <input type="checkbox" class="form-check-input crud-check"
                            id="eliminar-${modulo.id}" ${el ? 'checked' : ''} ${!visible ? 'disabled' : ''}>
                    </td>
                    <td class="text-center">
                        <input type="checkbox" class="form-check-input crud-check"
                            id="detalle-${modulo.id}" ${de ? 'checked' : ''} ${!visible ? 'disabled' : ''}>
                    </td>
                </tr>
            `;
        }).join('');
    }

    onVisibleChange(moduloId) {
        const visible = document.getElementById(`visible-${moduloId}`).checked;
        const row = document.getElementById(`row-modulo-${moduloId}`);
        const crudChecks = row.querySelectorAll('.crud-check');
        crudChecks.forEach(chk => {
            chk.disabled = !visible;
            if (!visible) chk.checked = false;
        });
        row.className = visible ? '' : 'table-light text-muted';
    }

    marcarTodos(valor) {
        this.modulos.forEach(modulo => {
            const visibleChk = document.getElementById(`visible-${modulo.id}`);
            if (visibleChk) {
                visibleChk.checked = valor;
                this.onVisibleChange(modulo.id);
                if (valor) {
                    ['agregar', 'editar', 'consultar', 'eliminar', 'detalle'].forEach(accion => {
                        const chk = document.getElementById(`${accion}-${modulo.id}`);
                        if (chk) chk.checked = valor;
                    });
                }
            }
        });
    }

    async savePermisos() {
        const perfilId = parseInt(document.getElementById('permisosPerfil').value);
        if (!perfilId) {
            this.showError('Por favor seleccione un perfil');
            return;
        }

        const operaciones = [];

        for (const modulo of this.modulos) {
            const visible = document.getElementById(`visible-${modulo.id}`)?.checked || false;
            const permisoId = document.getElementById(`permiso-id-${modulo.id}`)?.value;

            if (visible) {
                const permiso = {
                    id: permisoId ? parseInt(permisoId) : 0,
                    idPerfil: perfilId,
                    idModulo: modulo.id,
                    bitAgregar: document.getElementById(`agregar-${modulo.id}`)?.checked || false,
                    bitEditar: document.getElementById(`editar-${modulo.id}`)?.checked || false,
                    bitConsulta: document.getElementById(`consultar-${modulo.id}`)?.checked || false,
                    bitEliminar: document.getElementById(`eliminar-${modulo.id}`)?.checked || false,
                    bitDetalle: document.getElementById(`detalle-${modulo.id}`)?.checked || false
                };

                if (permisoId) {
                    operaciones.push(fetch(`/api/permisos-perfil/${permisoId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                        body: JSON.stringify(permiso)
                    }));
                } else {
                    operaciones.push(fetch('/api/permisos-perfil', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                        body: JSON.stringify(permiso)
                    }));
                }
            } else if (permisoId) {
                operaciones.push(fetch(`/api/permisos-perfil/${permisoId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                }));
            }
        }

        try {
            await Promise.all(operaciones);
            bootstrap.Modal.getInstance(document.getElementById('permisosModal')).hide();
            await this.loadPermisos();
            alert('Permisos guardados exitosamente');
        } catch (error) {
            this.showError('Error al guardar los permisos');
        }
    }

    showCreateModal() {
        document.getElementById('permisosModalTitle').textContent = 'Configurar Permisos';
        document.getElementById('permisosPerfil').value = '';
        document.getElementById('modulosContainer').style.display = 'none';
        document.getElementById('modulosLoading').style.display = 'none';
        new bootstrap.Modal(document.getElementById('permisosModal')).show();
    }

    async editPermisos(perfilId) {
        document.getElementById('permisosModalTitle').textContent = 'Editar Permisos';
        document.getElementById('permisosPerfil').value = perfilId;
        new bootstrap.Modal(document.getElementById('permisosModal')).show();
        await this.onPerfilChange();
    }

    filtrarPorPerfil() {
        this.filtroPerfilId = document.getElementById('filtroPerfil').value;
        this.currentPage = 1;
        this.loadPermisos();
    }

    // ✅ Una sola definición de loadPermisos con paginación manual
    async loadPermisos() {
        try {
            const response = await fetch(`/api/permisos-perfil?page=1`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const totalPages = Math.ceil(data.total / data.pageSize);
                let todosLosPermisos = [...data.data];

                // Traer todas las páginas
                if (totalPages > 1) {
                    const peticiones = [];
                    for (let page = 2; page <= totalPages; page++) {
                        peticiones.push(
                            fetch(`/api/permisos-perfil?page=${page}`, {
                                headers: { 'Authorization': `Bearer ${this.token}` }
                            }).then(r => r.json())
                        );
                    }
                    const resultados = await Promise.all(peticiones);
                    resultados.forEach(r => {
                        todosLosPermisos = [...todosLosPermisos, ...r.data];
                    });
                }

                // Filtrar si hay filtro activo
                if (this.filtroPerfilId) {
                    todosLosPermisos = todosLosPermisos.filter(
                        p => p.idPerfil === parseInt(this.filtroPerfilId)
                    );
                }

                // Paginar manualmente
                const total = todosLosPermisos.length;
                const offset = (this.currentPage - 1) * this.pageSize;
                const paginados = todosLosPermisos.slice(offset, offset + this.pageSize);

                this.renderTable(paginados);
                this.renderPagination(total, this.currentPage, this.pageSize);
            }
        } catch (error) {
            this.showError('Error de conexión');
        }
    }

    renderTable(permisos) {
        const tbody = document.getElementById('permisosTableBody');
        if (!tbody) return;

        if (!permisos || permisos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay permisos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = permisos.map(permiso => {
            const perfil = this.perfiles.find(p => p.id === permiso.idPerfil);
            const modulo = this.modulos.find(m => m.id === permiso.idModulo);
            return `
                <tr>
                    <td>${perfil ? this.escapeHtml(perfil.strNombrePerfil) : 'N/A'}</td>
                    <td>${modulo ? this.escapeHtml(modulo.strNombreModulo) : 'N/A'}</td>
                    <td class="text-center"><i class="fas ${permiso.bitAgregar ? 'fa-check text-success' : 'fa-times text-danger'}"></i></td>
                    <td class="text-center"><i class="fas ${permiso.bitEditar ? 'fa-check text-success' : 'fa-times text-danger'}"></i></td>
                    <td class="text-center"><i class="fas ${permiso.bitConsulta ? 'fa-check text-success' : 'fa-times text-danger'}"></i></td>
                    <td class="text-center"><i class="fas ${permiso.bitEliminar ? 'fa-check text-success' : 'fa-times text-danger'}"></i></td>
                    <td class="text-center"><i class="fas ${permiso.bitDetalle ? 'fa-check text-success' : 'fa-times text-danger'}"></i></td>
                    <td>
                        <div class="btn-group">
                            ${this.permisos.bitEditar !== false ? `
                                <button class="btn btn-sm btn-warning"
                                    onclick="window.permisosPerfilModule.editPermisos(${permiso.idPerfil})">
                                    <i class="fas fa-edit"></i>
                                </button>` : ''}
                            ${this.permisos.bitEliminar !== false ? `
                                <button class="btn btn-sm btn-danger"
                                    onclick="window.permisosPerfilModule.deletePermiso(${permiso.id})">
                                    <i class="fas fa-trash"></i>
                                </button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async deletePermiso(id) {
        if (confirm('¿Eliminar este permiso?')) {
            try {
                const response = await fetch(`/api/permisos-perfil/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                if (response.ok) {
                    await this.loadPermisos();
                    alert('Permiso eliminado');
                } else {
                    this.showError('Error al eliminar');
                }
            } catch (error) {
                this.showError('Error de conexión');
            }
        }
    }

    renderPagination(total, currentPage, pageSize) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(total / pageSize);
        if (totalPages <= 1) { paginationContainer.innerHTML = ''; return; }

        let html = `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.permisosPerfilModule.changePage(${currentPage - 1}); return false;">Anterior</a>
            </li>`;

        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="window.permisosPerfilModule.changePage(${i}); return false;">${i}</a>
            </li>`;
        }

        html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="window.permisosPerfilModule.changePage(${currentPage + 1}); return false;">Siguiente</a>
        </li>`;

        paginationContainer.innerHTML = html;
    }

    changePage(page) {
        this.currentPage = page;
        this.loadPermisos();
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

    showError(message) { alert(message); }
}

window.permisosPerfilModule = null;