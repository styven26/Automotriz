<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mecánica Automotriz Don Chavo - Reporte de Citas</title>
    <style>
        body { font-family:'Poppins',sans-serif; margin:10px; color:#333; }
        .header { text-align:center; margin-bottom:15px; }
        .header img { width:180px; height:auto; display:block; margin:0 auto 10px; }
        .header h1 { font-size:36px; font-weight:bold; text-transform:uppercase; letter-spacing:2px; margin:0; color:#333; }
        .header h2 { font-size:22px; font-weight:700; text-transform:capitalize; color:rgb(22,15,234); margin:10px 0 15px; }
        .header .line { width:100%; height:3px; background:#007bff; margin:10px 0 20px; }

        table { width:100%; border-collapse:collapse; margin-top:10px; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1); }
        th, td { border:1px solid #ddd; padding:6px 8px; font-size:12px; text-align:left; }
        th { background:#007bff; color:#fff; font-size:13px; }
        tr:nth-child(even){ background:#f9f9f9; }
        tr:hover { background:#e9ecef; }
        .footer { margin-top:12px; text-align:center; font-size:11px; color:#666; }

        /* Tabla de servicios abajo */
        .service-table { margin-top:30px; }
        .service-table th { background:#17a2b8; }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg" alt="Logo Mecánica Automotriz Don Chavo">
        <h1>Mecánica Automotriz Don Chavo</h1><br>
        <h2>Reporte de Citas Atendidas</h2>
        @if($mesAno)
            <h2>{{ $mesAno }}</h2>
        @endif
        <div class="line"></div>
    </div>

    {{-- Tabla principal de citas --}}
    <table>
        <thead>
            <tr>
                <th>Cita</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Mecánico</th>
                <th>Estado</th>
                <th>F. Inicio</th>
                <th>H. Inicio</th>
                <th>F. Fin</th>
                <th>H. Fin</th>
            </tr>
        </thead>
        <tbody>
            @forelse($citas as $cita)
            <tr>
                <td>#{{ $cita['cita_id'] }}</td>
                <td>{{ $cita['cliente'] }}</td>
                <td>{{ $cita['vehiculo'] }}</td>
                <td>{{ $cita['mecanico'] }}</td>
                <td>{{ ucfirst($cita['estado']) }}</td>
                <td>{{ $cita['fecha_inicio'] }}</td>
                <td>{{ $cita['hora_inicio'] }}</td>
                <td>{{ $cita['fecha_fin'] }}</td>
                <td>{{ $cita['hora_fin'] }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="9" style="text-align:center;font-weight:bold;">No hay citas atendidas.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Tabla de servicios detallados --}}
    <table class="service-table">
        <thead>
            <tr>
                <th>Cita</th>
                <th>Servicio</th>
                <th>Cant.</th>
                <th>Precio U.</th>
                <th>Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($citas as $cita)
                @foreach($cita['servicios'] as $s)
                <tr>
                    <td>#{{ $cita['cita_id'] }}</td>
                    <td>{{ $s['nombre'] }}</td>
                    <td>{{ $s['cant'] }}</td>
                    <td>${{ $s['precio'] }}</td>
                    <td>${{ $s['subtotal'] }}</td>
                </tr>
                @endforeach
                {{-- fila de total por cita --}}
                <tr>
                    <td colspan="4" style="text-align:right;font-weight:bold;">Total servicios cita #{{ $cita['cita_id'] }}:</td>
                    <td style="font-weight:bold;">${{ $cita['total_servicios'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <em>Reporte generado automáticamente el {{ now()->format('d/m/Y H:i') }}</em>
    </div>
</body>
</html>
