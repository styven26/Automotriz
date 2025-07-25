<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Recordatorio de Cita</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="font-family:'Poppins',sans-serif; background-color:#f4f4f9; margin:0; padding:0;">
  <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px;
              overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">

    <!-- Encabezado -->
    <div style="background-color:#34495e; color:#fff; padding:20px; text-align:center;">
      <img 
        src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg" 
        alt="Mecánica Automotriz Don Chavo"
        style="max-width:200px; width:100%; margin-bottom:15px; border-radius:8px;
               box-shadow:0 4px 10px rgba(0,0,0,0.1);"
      >
      <h1 style="margin:0; font-size:24px; font-weight:600;">
        Recordatorio de Cita
      </h1>
    </div>

    <!-- Contenido -->
    <div style="padding:20px;">
      <p style="font-size:18px; margin:0 0 10px;">
        Hola {{ $cita->cliente->nombre }} {{ $cita->cliente->apellido }},
      </p>
      <p style="font-size:16px; margin:0 0 20px;">
        Este es un recordatorio de que tu cita empezará en 10 minutos:
      </p>

      <!-- Detalles de la cita -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:16px;">
        <tr>
          <td style="padding:8px; font-weight:600;">Fecha:</td>
          <td style="padding:8px;">{{ \Carbon\Carbon::parse($cita->fecha)->format('d/m/Y') }}</td>
        </tr>
        <tr>
          <td style="padding:8px; font-weight:600;">Hora de inicio:</td>
          <td style="padding:8px;">{{ \Carbon\Carbon::parse($cita->hora)->format('H:i') }}</td>
        </tr>
        <tr>
          <td style="padding:8px; font-weight:600;">Vehículo:</td>
          <td style="padding:8px;">{{ $cita->vehiculo->marca }} {{ $cita->vehiculo->modelo }} ({{ $cita->vehiculo->numero_placa }})</td>
        </tr>
      </table>

      <!-- Servicios solicitados -->
      <h3 style="margin:20px 0 10px; font-size:20px; color:#34495e; font-weight:600;">
        Servicios:
      </h3>
      <ul style="font-size:16px; margin:0 0 20px; padding-left:20px;">
        @foreach ($servicios as $detalle)
          <li>{{ $detalle->servicio->nombre }}</li>
        @endforeach
      </ul>

      <p style="font-size:16px; color:#333; margin:20px 0 0;">
        ¡Te esperamos!
      </p>
    </div>

    <!-- Pie de página -->
    <div style="background-color:#f4f4f9; color:#666; text-align:center; padding:10px; font-size:14px;">
      <p>*Correo generado automáticamente. Por favor, no respondas este mensaje.</p>
      <p><strong>Mecánica Automotriz Don Chavo</strong></p>
    </div>
  </div>
</body>
</html>
