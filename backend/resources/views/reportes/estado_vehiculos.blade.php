<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mecánica Automotriz Don Chavo - Estado de Vehículos</title>
    <style>
        /* Estilos generales */
        body {
            font-family: 'Poppins', sans-serif;
            margin: 10px;
            color: #333;
        }

        /* Cabecera */
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header img {
            width: 180px;
            height: auto;
            margin: 0 auto 10px;
            display: block;
        }
        .header h1 {
            font-size: 36px;
            font-weight: bold;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0;
        }
        .header h2 {
            font-size: 22px;
            color: rgb(22, 15, 234);
            margin: 10px 0 15px 0;
            font-weight: 700;
            text-transform: capitalize;
            letter-spacing: 1px;
        }
        .header .line {
            width: 100%;
            height: 3px;
            background: #007bff;
            margin: 10px 0 20px 0;
        }

        /* Tabla */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        th {
            background-color: #007bff;
            color: white;
            padding: 12px 10px;
            text-align: left;
            font-size: 16px;
        }
        td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            font-size: 14px;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #e9ecef;
        }

        /* Mensaje final */
        .good-job {
            margin-top: 30px;
            font-size: 18px;
            color: #28a745;
            font-weight: bold;
            text-align: center;
        }

        /* Pie de página */
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <img 
            src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg" 
            alt="Logo Mecánica Automotriz Don Chavo">
        <h1>Mecánica Automotriz Don Chavo</h1><br><br>
        <h2>Etapas de Vehículos </h2>
        <div class="line"></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Placa</th>
                <th>Etapa</th>
                <th>Mecánico Asignado</th>
            </tr>
        </thead>
        <tbody>
            @foreach($vehiculos as $vehiculo)
                @php
                    $totalMonitoreos = count($vehiculo['monitoreos']);
                @endphp
                @foreach($vehiculo['monitoreos'] as $index => $monitoreo)
                    <tr>
                        @if($index === 0)
                            <td rowspan="{{ $totalMonitoreos }}">{{ $vehiculo['marca'] }}</td>
                            <td rowspan="{{ $totalMonitoreos }}">{{ $vehiculo['modelo'] }}</td>
                            <td rowspan="{{ $totalMonitoreos }}">{{ $vehiculo['placa'] }}</td>
                        @endif
                        <td>{{ $monitoreo['etapa'] }}</td>
                        <td>{{ $monitoreo['mecanico'] }}</td>
                    </tr>
                @endforeach
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Reporte generado automáticamente el {{ now()->format('d/m/Y H:i') }}</p>
    </div>
</body>
</html>
