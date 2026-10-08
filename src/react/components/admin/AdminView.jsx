import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import LoginForm from './LoginForm.jsx';
import UsersTab from './UsersTab.jsx';
import SecurityTab from './SecurityTab.jsx';
import InventoryTab from './InventoryTab.jsx';
import DispatchTab from './DispatchTab.jsx';
import MetricsTab from './MetricsTab.jsx';

export default function AdminView() {
  const { user, isAuthenticated, isSuperAdmin, isStoreAdmin, isDispatcher, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Ajustar pestaña por defecto según rol al autenticarse
  useEffect(() => {
    if (isSuperAdmin) {
      setActiveTab('users');
    } else if (isStoreAdmin) {
      setActiveTab('inventory');
    } else if (isDispatcher) {
      setActiveTab('dispatch');
    }
  }, [isSuperAdmin, isStoreAdmin, isDispatcher]);

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="admin-view" id="admin-view-root">
      {/* Cabecera de Sesión y Gobernanza */}
      <div className="card bg-dark border-secondary p-3 mb-4 shadow-sm">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-primary p-2 d-flex align-items-center justify-content-center text-white" style={{ width: '45px', height: '45px' }}>
              <i className="bi bi-person-fill fs-4"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="text-white fw-bold mb-0">{user?.nombre_real}</h5>
                <span className={`badge ${
                  isSuperAdmin 
                    ? 'bg-danger' 
                    : isStoreAdmin 
                      ? 'bg-primary' 
                      : 'bg-info text-dark'
                }`}>
                  {user?.rol}
                </span>
              </div>
              <small className="text-secondary font-monospace">@{user?.username} &bull; Sesión Activa</small>
            </div>
          </div>

          <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" onClick={logout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Navegación Segmentadas Estrictamente por Rol */}
      <ul className="nav nav-pills mb-4 bg-dark p-2 rounded border border-secondary" id="admin-tabs" role="tablist">
        {/* Pestañas EXCLUSIVAS de Super Admin (CU-13 / CU-12) */}
        {isSuperAdmin && (
          <>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link text-white ${activeTab === 'users' ? 'active bg-primary' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <i className="bi bi-people-fill me-2"></i>
                Gestión de Cuentas (CU-13)
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link text-white ${activeTab === 'security' ? 'active bg-warning text-dark fw-bold' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="bi bi-shield-shaded me-2"></i>
                Auditoría SIEM (CU-12)
              </button>
            </li>
          </>
        )}

        {/* Pestañas de Admin de Tienda */}
        {isStoreAdmin && (
          <>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link text-white ${activeTab === 'inventory' ? 'active bg-info text-dark fw-bold' : ''}`}
                onClick={() => setActiveTab('inventory')}
              >
                <i className="bi bi-boxes me-2"></i>
                Inventario Kardex
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link text-white ${activeTab === 'metrics' ? 'active bg-success' : ''}`}
                onClick={() => setActiveTab('metrics')}
              >
                <i className="bi bi-graph-up me-2"></i>
                Métricas Comerciales
              </button>
            </li>
          </>
        )}

        {/* Pestañas de Despachador */}
        {isDispatcher && (
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link text-white ${activeTab === 'dispatch' ? 'active bg-success' : ''}`}
              onClick={() => setActiveTab('dispatch')}
            >
              <i className="bi bi-truck me-2"></i>
              Módulo de Despachos
            </button>
          </li>
        )}
      </ul>

      {/* Contenido de la Pestaña Activa */}
      <div className="tab-content" id="admin-tab-content">
        {isSuperAdmin && activeTab === 'users' && <UsersTab />}
        {isSuperAdmin && activeTab === 'security' && <SecurityTab />}

        {isStoreAdmin && activeTab === 'inventory' && <InventoryTab />}
        {isStoreAdmin && activeTab === 'metrics' && <MetricsTab />}

        {isDispatcher && activeTab === 'dispatch' && <DispatchTab />}
      </div>
    </div>
  );
}
