import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient.js';
import AddUserModal from './AddUserModal.jsx';
import EditUserModal from './EditUserModal.jsx';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar la lista de usuarios del sistema.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleStatus = async (user) => {
    if (user.rol === 'SUPER_ADMIN') {
      return alert('No es posible suspender la cuenta del Super Admin principal.');
    }

    const action = user.activo ? 'suspender' : 'reactivar';
    const confirmMessage = `¿Estás seguro de ${action} la cuenta de @${user.username}?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await apiClient.toggleUserStatus(user.id_usuario, !user.activo);
      loadUsers();
    } catch (err) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  return (
    <div className="users-management-tab">
      {/* Barra Superior de Acciones */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 bg-dark p-3 rounded border border-secondary">
        <div>
          <h4 className="text-white fw-bold mb-1">
            <i className="bi bi-people-fill text-primary me-2"></i>
            Gestión de Cuentas y Accesos (CU-13)
          </h4>
          <p className="text-secondary small mb-0">
            Gobernanza exclusiva del Super Admin: alta, edición y suspensión de usuarios del sistema.
          </p>
        </div>

        <button
          id="btn-add-new-user"
          className="btn btn-success fw-bold d-flex align-items-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-person-plus-fill"></i>
          <span>+ Agregar Nuevo Usuario</span>
        </button>
      </div>

      {/* Tabla de Usuarios */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-secondary mt-2">Cargando cuentas de sistema...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger p-3">
          {error}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={loadUsers}>
            Reintentar
          </button>
        </div>
      ) : (
        <div className="table-responsive bg-dark rounded border border-secondary shadow-sm">
          <table className="table table-dark table-hover table-striped align-middle mb-0" id="users-table">
            <thead className="table-secondary text-secondary small text-uppercase">
              <tr>
                <th scope="col" style={{ width: '60px' }}>ID</th>
                <th scope="col">Usuario</th>
                <th scope="col">Titular / Cargo</th>
                <th scope="col">Rol RBAC</th>
                <th scope="col">Estado</th>
                <th scope="col">Último Acceso</th>
                <th scope="col" className="text-end" style={{ width: '220px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id_usuario}>
                  <td className="font-monospace text-secondary">{u.id_usuario}</td>
                  <td>
                    <span className="fw-bold text-white">@{u.username}</span>
                  </td>
                  <td>{u.nombre_real}</td>
                  <td>
                    <span className={`badge ${
                      u.rol === 'SUPER_ADMIN' 
                        ? 'bg-danger' 
                        : u.rol === 'ADMIN_TIENDA' 
                          ? 'bg-primary' 
                          : 'bg-info text-dark'
                    }`}>
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.activo ? 'bg-success' : 'bg-secondary'}`}>
                      {u.activo ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="small text-secondary">
                    {u.ultimo_acceso 
                      ? new Date(u.ultimo_acceso).toLocaleString('es-CL') 
                      : 'Sin registros'}
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary btn-edit-user"
                        onClick={() => setSelectedUserToEdit(u)}
                        title="Modificar datos y rol"
                      >
                        <i className="bi bi-pencil me-1"></i> Modificar
                      </button>

                      {u.rol !== 'SUPER_ADMIN' && (
                        <button
                          className={`btn ${u.activo ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => handleToggleStatus(u)}
                          title={u.activo ? 'Suspender acceso' : 'Reactivar acceso'}
                        >
                          <i className={`bi ${u.activo ? 'bi-person-slash' : 'bi-person-check'} me-1`}></i>
                          {u.activo ? 'Suspender' : 'Reactivar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      <AddUserModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onUserCreated={loadUsers}
      />

      <EditUserModal
        show={!!selectedUserToEdit}
        user={selectedUserToEdit}
        onHide={() => setSelectedUserToEdit(null)}
        onUserUpdated={loadUsers}
      />
    </div>
  );
}
