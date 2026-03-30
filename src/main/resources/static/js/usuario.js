class UsuarioModule {
constructor(token, permisos = {}) {
        this.token = token;
        this.permisos = permisos;
        this.currentPage = 1;
        this.pageSize = 5;
        this.perfiles = [];
        this.init();
    }

    async init() {
        await this.loadPerfiles();
        await this.loadUsuarios();
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

    populatePerfilSelect() {
        const select = document.getElementById('usuarioPerfil');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccione un perfil</option>';
        this.perfiles.forEach(perfil => {
            select.innerHTML += `<option value="${perfil.id}">${this.escapeHtml(perfil.strNombrePerfil)}</option>`;
        });
    }

    async loadUsuarios() {
        try {
            const response = await fetch(`/api/usuarios?page=${this.currentPage}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderTable(data.data);
                this.renderPagination(data.total, data.page, data.pageSize);
            } else {
                console.error('Error loading usuarios');
                this.showError('Error al cargar los usuarios');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error de conexión');
        }
    }

    renderTable(usuarios) {
        const tbody = document.getElementById('usuarioTableBody');
        if (!tbody) return;

        if (!usuarios || usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay usuarios registrados</td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map(usuario => {
            const perfil = this.perfiles.find(p => p.id === usuario.idPerfil);
            return `
                <tr>
                    <td>
                        ${usuario.strFotoPerfil ?
                            `<img src="${usuario.strFotoPerfil}" width="40" height="40" class="rounded-circle" style="object-fit: cover;">` :
                            '<i class="fas fa-user-circle fa-2x"></i>'
                        }
                    </td>
                    <td>${this.escapeHtml(usuario.strNombreUsuario)}</td>
                    <td>${perfil ? this.escapeHtml(perfil.strNombrePerfil) : 'N/A'}</td>
                    <td>
                        <span class="badge ${usuario.idEstadoUsuario === 1 ? 'badge-success' : 'badge-danger'}">
                            ${usuario.idEstadoUsuario === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>${this.escapeHtml(usuario.strCorreo)}</td>
                    <td>${this.escapeHtml(usuario.strNumeroCelular || 'N/A')}</td>
                    <td>
                        <div class="btn-group">
                            ${this.permisos.bitDetalle !== false ? `
                                <button class="btn btn-sm btn-info" onclick="window.usuarioModule.viewDetail(${usuario.id})">
                                    <i class="fas fa-eye"></i>
                                </button>` : ''}
                            ${this.permisos.bitEditar !== false ? `
                                <button class="btn btn-sm btn-warning" onclick="window.usuarioModule.editUsuario(${usuario.id})">
                                    <i class="fas fa-edit"></i>
                                </button>` : ''}
                            ${this.permisos.bitEliminar !== false ? `
                                <button class="btn btn-sm btn-danger" onclick="window.usuarioModule.deleteUsuario(${usuario.id})">
                                    <i class="fas fa-trash"></i>
                                </button>` : ''}
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
                <a class="page-link" href="#" onclick="window.usuarioModule.changePage(${currentPage - 1}); return false;">Anterior</a>
            </li>
        `;

        for (let i = 1; i <= totalPages && i <= 5; i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="window.usuarioModule.changePage(${i}); return false;">${i}</a>
                </li>
            `;
        }

        if (totalPages > 5) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="window.usuarioModule.changePage(${totalPages}); return false;">${totalPages}</a>
                </li>
            `;
        }

        paginationHtml += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.usuarioModule.changePage(${currentPage + 1}); return false;">Siguiente</a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHtml;
    }

    changePage(page) {
        this.currentPage = page;
        this.loadUsuarios();
    }

    showCreateModal() {
        document.getElementById('usuarioModalTitle').textContent = 'Crear Usuario';
        document.getElementById('usuarioId').value = '';
        document.getElementById('usuarioNombre').value = '';
        document.getElementById('usuarioPassword').value = '';
        document.getElementById('usuarioPassword').required = true;
        document.getElementById('usuarioEstado').value = '1';
        document.getElementById('usuarioCorreo').value = '';
        document.getElementById('usuarioCelular').value = '';
        document.getElementById('usuarioPerfil').value = '';
        document.getElementById('fotoPreview').innerHTML = '';

        const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
        modal.show();
    }

    async editUsuario(id) {
        try {
            const response = await fetch(`/api/usuarios/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const usuario = await response.json();
                document.getElementById('usuarioModalTitle').textContent = 'Editar Usuario';
                document.getElementById('usuarioId').value = usuario.id;
                document.getElementById('usuarioNombre').value = usuario.strNombreUsuario;
                document.getElementById('usuarioPassword').value = '';
                document.getElementById('usuarioPassword').required = false;
                document.getElementById('usuarioEstado').value = usuario.idEstadoUsuario;
                document.getElementById('usuarioCorreo').value = usuario.strCorreo;
                document.getElementById('usuarioCelular').value = usuario.strNumeroCelular || '';
                document.getElementById('usuarioPerfil').value = usuario.idPerfil;

                if (usuario.strFotoPerfil) {
                    document.getElementById('fotoPreview').innerHTML = `
                        <img src="${usuario.strFotoPerfil}" width="100" height="100" class="rounded-circle mt-2">
                    `;
                } else {
                    document.getElementById('fotoPreview').innerHTML = '';
                }

                const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
                modal.show();
            } else {
                this.showError('Error al cargar el usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error al cargar el usuario');
        }
    }

    async saveUsuario() {
        const id = document.getElementById('usuarioId').value;
        const usuario = {
            strNombreUsuario: document.getElementById('usuarioNombre').value.trim(),
            idPerfil: parseInt(document.getElementById('usuarioPerfil').value),
            idEstadoUsuario: parseInt(document.getElementById('usuarioEstado').value),
            strCorreo: document.getElementById('usuarioCorreo').value.trim(),
            strNumeroCelular: document.getElementById('usuarioCelular').value.trim()
        };

        if (!usuario.strNombreUsuario) {
            this.showError('Por favor ingrese el nombre de usuario');
            return;
        }

        if (!usuario.idPerfil) {
            this.showError('Por favor seleccione un perfil');
            return;
        }

        if (!usuario.strCorreo) {
            this.showError('Por favor ingrese el correo electrónico');
            return;
        }

        const password = document.getElementById('usuarioPassword').value;

        try {
            let response;
            if (id) {
                response = await fetch(`/api/usuarios/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(usuario)
                });

                if (response.ok && password) {
                    await this.updatePassword(id, password);
                }
            } else {
                if (!password) {
                    this.showError('Por favor ingrese una contraseña');
                    return;
                }

                const createData = { ...usuario, password: password };
                response = await fetch('/api/usuarios', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(createData)
                });
            }

            if (response && response.ok) {
                await this.uploadFoto(id);
                bootstrap.Modal.getInstance(document.getElementById('usuarioModal')).hide();
                await this.loadUsuarios();
                alert(id ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
            } else if (response) {
                const error = await response.json();
                this.showError(error.error || 'Error al guardar el usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error al guardar el usuario');
        }
    }

    async updatePassword(id, password) {
        try {
            await fetch(`/api/usuarios/${id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ password: password })
            });
        } catch (error) {
            console.error('Error updating password:', error);
        }
    }

    async uploadFoto(id) {
        const fotoInput = document.getElementById('usuarioFoto');
        if (!fotoInput.files.length) return;

        const formData = new FormData();
        formData.append('foto', fotoInput.files[0]);

        try {
            await fetch(`/api/usuarios/${id}/foto`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });
        } catch (error) {
            console.error('Error uploading foto:', error);
        }
    }

    async deleteUsuario(id) {
        if (confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
            try {
                const response = await fetch(`/api/usuarios/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.ok) {
                    await this.loadUsuarios();
                    alert('Usuario eliminado exitosamente');
                } else {
                    const error = await response.json();
                    this.showError(error.error || 'Error al eliminar el usuario');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showError('Error al eliminar el usuario');
            }
        }
    }

    async viewDetail(id) {
        try {
            const response = await fetch(`/api/usuarios/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const usuario = await response.json();
                const perfil = this.perfiles.find(p => p.id === usuario.idPerfil);

                document.getElementById('detailId').textContent = usuario.id;
                document.getElementById('detailNombre').textContent = usuario.strNombreUsuario;
                document.getElementById('detailPerfil').textContent = perfil ? perfil.strNombrePerfil : 'N/A';
                document.getElementById('detailEstado').textContent = usuario.idEstadoUsuario === 1 ? 'Activo' : 'Inactivo';
                document.getElementById('detailCorreo').textContent = usuario.strCorreo;
                document.getElementById('detailCelular').textContent = usuario.strNumeroCelular || 'N/A';

                const fotoImg = document.getElementById('detailFoto');
                if (usuario.strFotoPerfil) {
                    fotoImg.src = usuario.strFotoPerfil;
                    fotoImg.style.display = 'block';
                } else {
                    fotoImg.style.display = 'none';
                }

                const modal = new bootstrap.Modal(document.getElementById('usuarioDetailModal'));
                modal.show();
            } else {
                this.showError('Error al cargar el detalle del usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error al cargar el detalle del usuario');
        }
    }

    bindEvents() {
        const form = document.getElementById('usuarioForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveUsuario();
            });
        }

        const fotoInput = document.getElementById('usuarioFoto');
        if (fotoInput) {
            fotoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        document.getElementById('fotoPreview').innerHTML = `
                            <img src="${e.target.result}" width="100" height="100" class="rounded-circle mt-2">
                        `;
                    };
                    reader.readAsDataURL(file);
                }
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

window.usuarioModule = null;