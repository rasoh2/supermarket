import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginForm() {
  const { login, isLoading, authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username.trim().toLowerCase(), password);
  };

  return (
    <div className="row justify-content-center py-5">
      <div className="col-12 col-sm-10 col-md-8 col-lg-5">
        <div className="card bg-dark border-secondary shadow-lg rounded-4 overflow-hidden">
          <div className="card-header bg-gradient p-4 text-center border-secondary" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
            <div className="brand-badge-logo mx-auto mb-2" style={{ width: '54px', height: '54px', fontSize: '1.5rem' }}>
              SM
            </div>
            <h4 className="text-white fw-bold mb-1">Acceso Administrativo</h4>
            <span className="text-secondary small">SuperMarket.cl &bull; Consola de Gobierno RBAC</span>
          </div>

          <div className="card-body p-4">
            {authError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-3 small" role="alert">
                <i className="bi bi-shield-x fs-5"></i>
                <div>{authError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} id="admin-login-form" autoComplete="off">
              <div className="mb-3">
                <label className="form-label text-light small fw-bold">Usuario de Sistema</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-secondary">
                    <i className="bi bi-person-badge"></i>
                  </span>
                  <input
                    id="login-username-input"
                    type="text"
                    className="form-control form-control-dark"
                    placeholder="Ej. superadmin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-light small fw-bold">Contraseña</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-secondary">
                    <i className="bi bi-key"></i>
                  </span>
                  <input
                    id="login-password-input"
                    type="password"
                    className="form-control form-control-dark"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                className="btn btn-primary w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right"></i>
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-top border-secondary text-center small text-secondary">
              <i className="bi bi-shield-lock me-1 text-info"></i>
              Acceso protegido por limitador anti fuerza bruta (15 intentos máx.) y bitácora SIEM inmutable.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
