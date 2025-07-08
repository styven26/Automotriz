{{-- resources/views/reportes/sin_trabajos.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mecánica Automotriz Don Chavo</title>
    <style>
        /* ===== Estilos generales ===== */
        body { font-family:'Poppins',sans-serif;margin:10px;color:#333; }
        .header { text-align:center;margin-bottom:20px; }
        .header img { width:180px;height:auto;margin:0 auto 10px;display:block; }
        .header h1 { font-size:36px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0; }
        .header h2 { font-size:22px;color:rgb(22,15,234);margin:10px 0 15px;font-weight:700;letter-spacing:1px; }
        .line      { width:100%;height:3px;background:#007bff;margin:10px 0 20px; }

        /* ===== Mensaje central ===== */
        .message { text-align:center;margin-top:80px; }
        .message h2 { font-size:24px;color:#555; }

        /* ===== Pie de página ===== */
        .footer { margin-top:20px;text-align:center;font-size:14px;color:#666; }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg"
             alt="Logo Mecánica Automotriz Don Chavo">
        <h1>Mecánica Automotriz Don Chavo</h1><br>
        <h2>Reporte de Trabajos Completados</h2>
        <div class="line"></div>
    </div>

    <div class="message">
        <h2>{{ $mensaje }}</h2>
    </div>

    <div class="footer">
        <p><em>Reporte generado automáticamente el {{ now()->format('d/m/Y H:i') }}</em></p>
        <p><em>Mecánico: {{ $mecanico->nombre }} {{ $mecanico->apellido }} – {{ $mecanico->cedula }}</em></p>
    </div>
</body>
</html>