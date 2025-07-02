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

        /* ===== Tabla principal ===== */
        table      { width:100%;border-collapse:collapse;margin-top:20px;border-radius:10px;overflow:hidden; }
        th         { background:#007bff;color:#fff;padding:10px;font-size:14px;text-align:left; }
        td         { border:1px solid #ddd;padding:8px;font-size:13px;text-align:left; }
        tr:nth-child(even){ background:#f9f9f9; }
        .right     { text-align:right; }

        /* ===== Subtablas ===== */
        .subtable  { width:100%;border-collapse:collapse;margin-top:6px; }
        .subtable th { background:#17a2b8;color:#fff;font-size:12px;padding:6px; }
        .subtable td { border:1px solid #ccc;font-size:12px;padding:4px; }
        .subtotal-row { font-weight:bold; background:#e2e6ea; }

        /* ===== Pie de página ===== */
        .footer { margin-top:20px;text-align:center;font-size:14px;color:#666; }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg" alt="Logo Mecánica Automotriz Don Chavo">
        <h1>Mecánica Automotriz Don Chavo</h1><br>
        <h2>Reporte de Trabajos Completados por Cita Atendida</h2>
        <div class="line"></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Nº Cita</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Estado de Cita</th>
                <th>F. Inicio</th>
                <th>F. Fin</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($trabajos as $t)
                <tr>
                    <td>{{ $t->cita_numero }}</td>
                    <td>{{ $t->cliente_nombre }}</td>
                    <td>{{ $t->vehiculo_full }}</td>
                    <td>{{ ucfirst($t->estado_nombre) }}</td>
                    <td>{{ $t->fecha_inicio_f }}</td>
                    <td>{{ $t->fecha_fin_f }}</td>
                </tr>

                @if ($t->servicios->count())
                <tr>
                    <td colspan="6">
                        <strong>Servicios realizados</strong>
                        <table class="subtable">
                            <thead>
                                <tr>
                                    <th>Servicio</th>
                                    <th class="right">Cant.</th>
                                    <th class="right">Precio U.</th>
                                    <th class="right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($t->servicios as $s)
                                    <tr>
                                        <td>{{ $s['nombre'] }}</td>
                                        <td class="right">{{ $s['cant'] }}</td>
                                        <td class="right">{{ $s['precio'] }}</td>
                                        <td class="right">{{ $s['subtotal'] }}</td>
                                    </tr>
                                @endforeach
                                <tr class="subtotal-row">
                                    <td colspan="3" class="right">Total servicios:</td>
                                    <td class="right">${{ $t->total_servicios }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                @endif

                @if ($t->repuestos->count())
                <tr>
                    <td colspan="6">
                        <strong>Repuestos utilizados</strong>
                        <table class="subtable">
                            <thead>
                                <tr>
                                    <th>Repuesto</th>
                                    <th class="right">Cant.</th>
                                    <th class="right">Precio U.</th>
                                    <th class="right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($t->repuestos as $r)
                                    <tr>
                                        <td>{{ $r['nombre'] }}</td>
                                        <td class="right">{{ $r['cant'] }}</td>
                                        <td class="right">{{ $r['precio'] }}</td>
                                        <td class="right">{{ $r['subtotal'] }}</td>
                                    </tr>
                                @endforeach
                                <tr class="subtotal-row">
                                    <td colspan="3" class="right">Total repuestos:</td>
                                    <td class="right">${{ $t->total_repuestos }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                @endif

            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p><em>Reporte generado automáticamente el {{ now()->format('d/m/Y H:i') }}</em></p>
        <p><em>Mecánico: {{ $mecanico->nombre }} {{ $mecanico->apellido }} - {{ $mecanico->cedula }}</em></p>
    </div>
</body>
</html>
