<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mecánica Automotriz Don Chavo</title>
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
            width: 180px; /* Imagen más grande */
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
            color:rgb(22, 15, 234); /* Cambié el color a un tono anaranjado */
            margin: 10px 0 15px 0;
            font-weight: 700; /* Negrita más pronunciada */
            text-transform: capitalize; /* Cambia el texto para que cada palabra inicie en mayúscula */
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
        <h2>Reporte de Trabajos Completados</h2>
        <div class="line"></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Estado</th>
                <th>Fecha de Inicio</th>
                <th>Fecha de Fin</th>
            </tr>
        </thead>
        <tbody>
            @foreach($trabajos as $trabajo)
            <tr>
                <td>{{ $trabajo->cliente_nombre_completo }}</td>
                <td>{{ $trabajo->vehiculo->marca ?? 'Sin vehículo' }} - {{ $trabajo->vehiculo->modelo ?? '' }}</td>
                <td>{{ ucfirst($trabajo->estado) }}</td>
                <td>{{ $trabajo->fecha_inicio ?? 'Sin fecha' }}</td>
                <td>{{ $trabajo->fecha_fin ?? 'Pendiente' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Reporte generado automáticamente el {{ now()->format('d/m/Y H:i') }}</p>
    </div>
</body>
</html>
