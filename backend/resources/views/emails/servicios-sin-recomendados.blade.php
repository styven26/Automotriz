<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sin Servicios Recomendados</title>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Poppins', sans-serif; background-color: #f4f4f9; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Encabezado -->
    <div style="background-color: #34495e; color: white; padding: 20px; text-align: center;">
      <img 
        src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg" 
        alt="Logo Mecánica Automotriz Don Chavo"
        style="max-width: 200px; width: 100%; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);"
      >
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Mecánica Automotriz Don Chavo</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 20px;">
      <p style="font-size: 18px; font-weight: 400;">¡Hola, {{ $cliente->nombre }} {{ $cliente->apellido }}!</p>
      <p style="font-size: 16px; font-weight: 400;">
        En este momento, no contamos con <strong>servicios recomendados</strong> para tu vehículo.
      </p>
      
      <!-- Datos del vehículo -->
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 16px;">
        <tr>
          <td style="padding: 10px; font-weight: 600;">Vehículo:</td>
          <td style="padding: 10px;">{{ $vehiculo->marca }} {{ $vehiculo->modelo }}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: 600;">Matrícula:</td>
          <td style="padding: 10px;">{{ $vehiculo->numero_placa }}</td>
        </tr>
      </table>  
    </div>
    
    <!-- Pie de Página -->
    <div style="background-color: #f4f4f9; color: #666; text-align: center; padding: 10px; font-size: 14px; font-weight: 400;">
      <p>¡Gracias por confiar en nosotros!</p>
      <p><strong>Mecánica Automotriz Don Chavo</strong></p>
      <p>*Correo generado automáticamente. Por favor, no responda.</p>
    </div>
  </div>
</body>
</html>
