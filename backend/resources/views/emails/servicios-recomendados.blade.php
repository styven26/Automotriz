<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Servicios Recomendados</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="font-family:'Poppins',sans-serif;background:#f4f4f9;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">

    <!-- Cabecera -->
    <div style="background:#34495e;color:#fff;padding:20px;text-align:center;">
      <img
        src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg"
        alt="Don Chavo"
        style="max-width:150px;margin-bottom:10px;border-radius:5px;"
      >
      <h1 style="margin:0;font-size:24px;font-weight:600;">Mecánica Automotriz Don Chavo</h1>
    </div>

    <!-- Cuerpo -->
    <div style="padding:20px;">
      <p style="font-size:18px;margin-bottom:10px;">
        ¡Hola, <strong>{{ $cliente->nombre }} {{ $cliente->apellido }}</strong>!
      </p>
      <p style="font-size:16px;line-height:1.5;">
        A continuación, te presentamos los <strong>servicios recomendados</strong> para tu vehículo:
      </p>

      <!-- Datos del vehículo -->
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:16px;">
        <tr>
          <td style="padding:8px;font-weight:600;">Vehículo:</td>
          <td style="padding:8px;">{{ $vehiculo->marca }} {{ $vehiculo->modelo }}</td>
        </tr>
        <tr>
          <td style="padding:8px;font-weight:600;">Matrícula:</td>
          <td style="padding:8px;">{{ $vehiculo->numero_placa }}</td>
        </tr>
      </table>

      <!-- Tabla de servicios -->
      <h3 style="margin-top:20px;font-size:20px;color:#34495e;font-weight:600;">Servicios Recomendados:</h3>
      <table style="width:100%;border-collapse:collapse;font-size:16px;margin-bottom:20px;">
        <thead>
          <tr style="background:#f4f4f9;text-align:left;">
            <th style="padding:10px;border-bottom:2px solid #ddd;font-weight:600;">Servicio</th>
            <th style="padding:10px;border-bottom:2px solid #ddd;text-align:right;font-weight:600;">Precio sin IVA</th>
            <th style="padding:10px;border-bottom:2px solid #ddd;text-align:right;font-weight:600;">IVA (%)</th>
            <th style="padding:10px;border-bottom:2px solid #ddd;text-align:right;font-weight:600;">Precio Total</th>
          </tr>
        </thead>
        <tbody>
          @foreach ($servicios as $servicio)
            <tr>
              <td style="padding:10px;border-bottom:1px solid #ddd;">{{ $servicio->nombre }}</td>
              <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;">
                ${{ number_format($servicio->precio_base, 2) }}
              </td>
              <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;">
                {{ number_format($servicio->iva, 2) }}%
              </td>
              <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;">
                ${{ number_format($servicio->precio, 2) }}
              </td>
            </tr>
          @endforeach
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:10px;font-weight:600;border-top:2px solid #ddd;">Total Estimado:</td>
            <td style="padding:10px;font-weight:600;border-top:2px solid #ddd;text-align:right;">
              ${{ number_format($total, 2) }}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Enlaces de respuesta -->
      <p style="font-size:16px;line-height:1.5;">
        <a
          href="{{ url('api/mecanico/diagnosticos/'.$orden->id_orden.'/aceptar') }}"
          style="color:#27ae60;font-weight:600;text-decoration:none;"
        >✅ Aceptar Servicios</a>
        &nbsp;|&nbsp;
        <a
          href="{{ url('api/mecanico/diagnosticos/'.$orden->id_orden.'/rechazar') }}"
          style="color:#c0392b;font-weight:600;text-decoration:none;"
        >❌ Rechazar Servicios</a>
      </p>
    </div>

    <!-- Pie -->
    <div style="background:#f4f4f9;color:#666;text-align:center;padding:15px;font-size:14px;">
      <p style="margin:5px 0;">¡Gracias por confiar en nosotros!</p>
      <p style="margin:5px 0;"><strong>Mecánica Automotriz Don Chavo</strong></p>
      <p style="margin:5px 0;font-style:italic;">*Correo generado automáticamente. Por favor, no responda.*</p>
    </div>

  </div>
</body>
</html>
