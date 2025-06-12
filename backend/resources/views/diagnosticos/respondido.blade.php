<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ $titulo }}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="font-family:'Poppins',sans-serif;background:#f4f4f9;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">

    <!-- Cabecera -->
    <div style="background:#34495e;color:#fff;padding:20px;text-align:center;">
      <img
        src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg"
        alt="Don Chavo"
        style="max-width:120px;margin-bottom:10px;border-radius:5px;"
      >
      <h1 style="margin:0;font-size:24px;font-weight:600;">{{ $titulo }}</h1>
    </div>

    <!-- Cuerpo -->
    <div style="padding:20px;text-align:left;">
      <p style="font-size:16px;line-height:1.5;margin-bottom:20px;">
        {{ $mensaje }}
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:16px;margin-bottom:20px;">
        <tr>
          <td style="padding:8px;font-weight:600;width:40%;">Fecha de la cita:</td>
          <td style="padding:8px;">{{ $cita->fecha }}</td>
        </tr>
        <tr>
          <td style="padding:8px;font-weight:600;">Hora inicio:</td>
          <td style="padding:8px;">{{ $cita->hora }}</td>
        </tr>
        @if(!empty($cita->hora_fin))
        <tr>
          <td style="padding:8px;font-weight:600;">Hora fin:</td>
          <td style="padding:8px;">{{ $cita->hora_fin }}</td>
        </tr>
        @endif
      </table>

      <p style="font-size:14px;color:#888;text-align:center;">
        No puedes volver a aceptar o rechazar esta solicitud.
      </p>
    </div>

    <!-- Pie -->
    <div style="background:#f4f4f9;color:#666;text-align:center;padding:15px;font-size:14px;">
      <p style="margin:5px 0;"><strong>Mecánica Automotriz Don Chavo</strong></p>
      <p style="margin:5px 0;font-style:italic;">*Correo generado automáticamente. Por favor, no respondas a este mensaje.*</p>
    </div>

  </div>
</body>
</html>
