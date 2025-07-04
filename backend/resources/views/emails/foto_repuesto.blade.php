<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Repuesto No Disponible</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="font-family:'Poppins',sans-serif; background:#f4f4f9; margin:0; padding:0;">

  <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">

    {{-- Encabezado --}}
    <div style="background:#34495e; color:#fff; padding:20px; text-align:center;">
      <img 
        src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg" 
        alt="Don Chavo"
        style="max-width:200px; width:100%; margin-bottom:15px; border-radius:8px;"
      >
      <h1 style="margin:0; font-size:24px;">Mecánica Automotriz Don Chavo</h1>
    </div>

    {{-- Contenido --}}
    <div style="padding:20px;">
      <h2 style="margin-bottom:20px; font-size:20px; color:#34495e;">Repuesto No Disponible</h2>
      <table style="width:100%; font-size:16px; margin-bottom:20px;">
        <tr>
          <td style="font-weight:600; width:40%;">Repuesto:</td>
          <td>{{ $nombre }}</td>
        </tr>
        <tr>
          <td style="font-weight:600;">Cantidad solicitada:</td>
          <td>{{ $cantidad }}</td>
        </tr>
      </table>

      <p style="font-size:16px; margin-bottom:20px;">
        Por favor, tráelo al taller para continuar con el servicio.
      </p>
      <p style="font-size:16px;">¡Gracias por tu comprensión!</p>
    </div>

    {{-- Pie --}}
    <div style="background:#f4f4f9; color:#666; text-align:center; padding:10px; font-size:14px;">
      <p>*Correo generado automáticamente. No respondas este mensaje.</p>
      <p><strong>Mecánica Automotriz Don Chavo</strong></p>
    </div>

  </div>
</body>
</html>
