import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-dark text-secondary pt-5 pb-4 border-top border-secondary mt-auto" id="site-footer">
      <div className="container">
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-3">
            <h5 className="text-white fw-bold mb-3">SuperMarket.cl</h5>
            <p className="small">
              Tu supermercado digital con precios mayoristas para familias y comerciantes de Santiago. Compra de cuatro tiendas en un solo pedido con un único despacho logístico.
            </p>
          </div>

          <div className="col-12 col-md-3">
            <h5 className="text-white fw-bold mb-3">Precios por Volumen</h5>
            <ul className="list-unstyled small mb-0">
              <li className="mb-2">
                <span className="badge bg-primary me-1">1 a 2 u.</span>
                <span className="text-light">Retail:</span> Precio base unitario.
              </li>
              <li className="mb-2">
                <span className="badge bg-success me-1">3 a 5 u.</span>
                <span className="text-light">Mayorista:</span> ~15% de ahorro.
              </li>
              <li className="mb-2">
                <span className="badge bg-warning text-dark me-1">6+ u.</span>
                <span className="text-light">Distribuidor:</span> ~30% de ahorro.
              </li>
            </ul>
          </div>

          <div className="col-12 col-md-3">
            <h5 className="text-white fw-bold mb-3">Despachos Santiago</h5>
            <p className="small mb-1"><i className="bi bi-geo-alt-fill text-danger me-1"></i> Cobertura en toda la Región Metropolitana.</p>
            <p className="small mb-1"><i className="bi bi-truck text-primary me-1"></i> Entregas en 24 a 48 horas hábiles.</p>
            <p className="small"><i className="bi bi-shield-check text-success me-1"></i> Pago por transferencia o efectivo al recibir.</p>
          </div>

          <div className="col-12 col-md-3">
            <h5 className="text-white fw-bold mb-3">Atención y Contacto</h5>
            <p className="small mb-1"><i className="bi bi-clock text-info me-1"></i> Lunes a Sábado: 08:30 a 20:00 hrs.</p>
            <p className="small mb-1"><i className="bi bi-whatsapp text-success me-1"></i> +56 9 6675 3705</p>
            <p className="small"><i className="bi bi-envelope text-warning me-1"></i> ventas@supermarket.cl</p>
          </div>
        </div>

        <div className="border-top border-secondary pt-3 text-center">
          <p className="mb-0 small">
            &copy; 2026 SuperMarket.cl — Todos los derechos reservados. Precios expresados en pesos chilenos ($ CLP).
          </p>
        </div>
      </div>
    </footer>
  );
}
