<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sin Servicios Recomendados</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Poppins', sans-serif; background-color: #f4f4f9; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

    <!-- Cabecera -->
    <div style="background-color: #34495e; color: #fff; padding: 20px; text-align: center;">
      <img
        src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg"
        alt="Don Chavo"
        style="max-width:150px; margin-bottom:10px; border-radius:5px;"
      >
      <h1 style="margin: 0; font-size:24px; font-weight:600;">Mecánica Automotriz Don Chavo</h1>
    </div>

    <!-- Cuerpo -->
    <div style="padding: 20px;">
      <p style="font-size:18px; margin-bottom:10px;">
        ¡Hola, <strong>{{ $cliente->nombre }} {{ $cliente->apellido }}</strong>!
      </p>
      <p style="font-size:16px; line-height:1.5;">
        En este momento, no contamos con <strong>servicios recomendados</strong> para tu vehículo te recomendamos buscar un taller alternativo que sí los ofrezca. 
      </p>

      <!-- Datos del vehículo -->
      <table style="width:100%; border-collapse:collapse; margin-top:20px; font-size:16px;">
        <tr>
          <td style="padding:8px; font-weight:600;">Vehículo:</td>
          <td style="padding:8px;">{{ $vehiculo->marca }} {{ $vehiculo->modelo }}</td>
        </tr>
        <tr>
          <td style="padding:8px; font-weight:600;">Matrícula:</td>
          <td style="padding:8px;">{{ $vehiculo->numero_placa }}</td>
        </tr>
      </table>
    </div>

    <!-- Pie -->
    <div style="background-color:#f4f4f9; color:#666; text-align:center; padding:15px; font-size:14px;">
      <p style="margin:5px 0;">¡Gracias por confiar en nosotros!</p>
      <p style="margin:5px 0;"><strong>Mecánica Automotriz Don Chavo</strong></p>
      <p style="margin:5px 0; font-style:italic;">*Correo generado automáticamente. Por favor, no responda.*</p>
    </div>
  </div>
</body>
</html>
