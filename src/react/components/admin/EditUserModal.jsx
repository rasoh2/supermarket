import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient.js';

export default function EditUserModal({ show, user, onHide, onUserUpdated }) {
  const [formData, setFormData] = useState({
    username: '',
    nombre_real: '',
    rol: 'ADMIN_TIENDA',
    activo: true,
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        nombre_real: user.nombre_real || '',
        rol: user.rol || 'ADMIN_TIENDA',
        activo: user.activo !== undefined ? !!user.activo : true,
        password: ''
      });
    }
  }, [user]);

  if (!show || !user) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    setIsSubmitting(true);
    try {
      const payload = {
        username: formData.username.trim().toLowerCase(),
        nombre_real: formData.nombre_real.trim(),
        rol: formData.rol,
        activo: formData.activo
      };
      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await apiClient.updateUser(user.id_usuario, payload);
      if (res?.success) {
        if (onUserUpdated) onUserUpdated();
        onHide();
      } else {
        throw new Error(res?.error || 'No se pudo actualizar el usuario.');
      }
    } catch (err) {
      setErrorMsg(err.data?.error || err.message || 'Error al conectar con la API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1060 }}></div>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1065 }} id="edit-user-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content modal-content-dark">
            <div className="modal-header">
              <h5 className="modal-title text-white fw-bold">
                <i className="bi bi-pencil-square text-primary me-2"></i>
                Modificar Usuario del Sistema
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                {errorMsg && (
                  <div className="alert alert-danger py-2 small mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    {errorMsg}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label text-light small fw-bold">Nombre de Usuario (Login)</label>
                  <input
                    type="text"
                    name="username"
                    className="form-control form-control-dark"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-light small fw-bold">Nombre Completo / Cargo</label>
                  <input
                    type="text"
                    name="nombre_real"
                    className="form-control form-control-dark"
                    value={formData.nombre_real}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-light small fw-bold">Rol Jerárquico RBAC</label>
                  <select
                    name="rol"
                    className="form-select form-select-dark"
                    value={formData.rol}
                    onChange={handleChange}
                    disabled={user.rol === 'SUPER_ADMIN'}
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN_TIENDA">Administrador de Tienda</option>
                    <option value="DESPACHADOR">Despachador</option>
                  </select>
                  {user.rol === 'SUPER_ADMIN' && (
                    <small className="text-secondary">El rol del Super Admin principal es permanente.</small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label text-light small fw-bold">Nueva Contraseña (Dejar en blanco para no cambiar)</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control form-control-dark"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="switch-user-active"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleChange}
                    disabled={user.rol === 'SUPER_ADMIN'}
                  />
                  <label className="form-check-label text-light small" htmlFor="switch-user-active">
                    Cuenta Activa (Desactivar para suspender acceso)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onHide}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary fw-bold px-4" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
