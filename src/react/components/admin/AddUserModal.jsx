import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient.js';

export default function AddUserModal({ show, onHide, onUserCreated }) {
  const [formData, setFormData] = useState({
    username: '',
    nombre_real: '',
    rol: 'ADMIN_TIENDA',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.username.trim() || !formData.nombre_real.trim() || !formData.password.trim()) {
      return setErrorMsg('Todos los campos son obligatorios.');
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.createUser({
        username: formData.username.trim().toLowerCase(),
        nombre_real: formData.nombre_real.trim(),
        rol: formData.rol,
        password: formData.password
      });

      if (res?.success) {
        setFormData({ username: '', nombre_real: '', rol: 'ADMIN_TIENDA', password: '' });
        if (onUserCreated) onUserCreated();
        onHide();
      } else {
        throw new Error(res?.error || 'No se pudo crear el usuario.');
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
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1065 }} id="create-user-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content modal-content-dark">
            <div className="modal-header">
              <h5 className="modal-title text-white fw-bold">
                <i className="bi bi-person-plus-fill text-success me-2"></i>
                Agregar Nuevo Usuario del Sistema
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
                  <label className="form-label text-light small fw-bold">Nombre de Usuario (Login) *</label>
                  <input
                    type="text"
                    name="username"
                    className="form-control form-control-dark"
                    placeholder="Ej. encargado_bodega"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                  <small className="text-secondary">Se guardará en minúsculas para acceso al sistema.</small>
                </div>

                <div className="mb-3">
                  <label className="form-label text-light small fw-bold">Nombre Completo / Titular *</label>
                  <input
                    type="text"
                    name="nombre_real"
                    className="form-control form-control-dark"
                    placeholder="Ej. Encargado de Bodega Principal"
                    value={formData.nombre_real}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-light small fw-bold">Rol Jerárquico RBAC *</label>
                  <select
                    name="rol"
                    className="form-select form-select-dark"
                    value={formData.rol}
                    onChange={handleChange}
                  >
                    <option value="ADMIN_TIENDA">Administrador de Tienda (Inventario y Métricas)</option>
                    <option value="DESPACHADOR">Despachador (Rutas y Entregas)</option>
                    <option value="SUPER_ADMIN">Super Admin (Gobierno y SIEM)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label text-light small fw-bold">Contraseña Inicial *</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control form-control-dark"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onHide}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success fw-bold px-4" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
