<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Historial de Órdenes de Servicio</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
            font-family: 'Poppins', sans-serif;
            background: #f4f4f4;
            color: #333;
            position: relative;
            padding-bottom: 60px; /* espacio para el footer */
        }
        .header {
            background: #003366;
            color: #fff;
            text-align: center;
            padding: 20px;
            border-bottom: 5px solid #002244;
        }
        .header img {
            width: 80px;
            margin-bottom: 10px;
        }
        .header h1 {
            font-size: 26px;
        }
        .header h2 {
            font-size: 18px;
            color: #b0c4de;
            margin-bottom: 8px;
        }
        .header p {
            font-size: 14px;
            margin-bottom: 4px;
        }

        .container {
            padding: 20px;
            max-width: 900px;
            margin: 0 auto;
        }

        .card {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card h3 {
            font-size: 16px;
            color: #003366;
            margin-bottom: 12px;
        }

        .subtabla {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .subtabla th,
        .subtabla td {
            border: 1px solid #ccc;
            padding: 6px;
            text-align: left;
            font-size: 13px;
        }
        .subtabla th {
            background: #e8eaf6;
        }

        .totales {
            text-align: right;
            font-weight: bold;
            margin-top: 8px;
        }

        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background: #003366;
            color: #fff;
            text-align: center;
            padding: 10px 0;
        }
        .footer p {
            font-size: 12px;
        }
    </style>
</head>
<body>

    <!-- Cabecera -->
    <div class="header">
        <img src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg"
             alt="Logo">
        <h1>Mecánica Automotriz Don Chavo</h1>
        <h2>Historial de Órdenes de Servicio</h2>

        <br/>

        <!-- Datos del cliente -->
        <p>
            <strong>Cliente:</strong>
            {{ $cliente->nombre }} {{ $cliente->apellido }}
        </p>
        <p>
            <strong>Cédula:</strong> {{ $cliente->cedula }}
        </p>

        <!-- Filtros -->
        <p>
            <strong>Mes:</strong> {{ $mesSeleccionado }}
            &nbsp;|&nbsp;
            <strong>Año:</strong> {{ $anioSeleccionado }}
        </p>
    </div>

    <!-- Contenido principal -->
    <div class="container">
        @forelse($ordenes as $o)
            <div class="card">
                <h3>
                    Cita #{{ $o['cita_id'] }}
                    — Inicio: {{ $o['inicio'] }}
                    — Fin: {{ $o['fin'] }}<br><br>
                    Vehículo: {{ $o['vehiculo'] }}
                </h3>

                <!-- Tabla de Servicios -->
                <table class="subtabla">
                    <thead>
                        <tr>
                            <th>Servicio</th>
                            <th>Cantidad</th>
                            <th>Precio U.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($o['servicios'] as $s)
                        <tr>
                            <td>{{ $s['nombre'] }}</td>
                            <td>{{ $s['cantidad'] }}</td>
                            <td>${{ $s['precio_unitario'] }}</td>
                            <td>${{ $s['subtotal'] }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
                <div class="totales">Total Servicios: ${{ $o['total_servicios'] }}</div>

                <br/>

                <!-- Tabla de Repuestos -->
                <table class="subtabla">
                    <thead>
                        <tr>
                            <th>Repuesto</th>
                            <th>Cantidad</th>
                            <th>Precio U.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($o['repuestos'] as $r)
                        <tr>
                            <td>{{ $r['nombre'] }}</td>
                            <td>{{ $r['cantidad'] }}</td>
                            <td>${{ $r['precio_unitario'] }}</td>
                            <td>${{ $r['subtotal'] }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
                <div class="totales">Total Repuestos: ${{ $o['total_repuestos'] }}</div>

                <br/>

                <!-- Total General -->
                <div class="totales" style="font-size:1.1em; color:#003366;">
                    Total General: ${{ $o['total_general'] }}
                </div>
            </div>
        @empty
            <p style="text-align:center; font-size:14px; color:#555;">
                No hay registros para estos filtros.
            </p>
        @endforelse
    </div>

    <!-- Footer: siempre al fondo -->
    <div class="footer">
        <p>Generado el {{ now()->format('d/m/Y H:i') }}</p>
        <p>© {{ date('Y') }} Mecánica Automotriz Don Chavo</p>
    </div>

</body>
</html>
