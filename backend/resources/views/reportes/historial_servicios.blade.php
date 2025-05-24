<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mecánica Automotriz Don Chavo - Historial de Servicios</title>
    <style>
        /* Reseteo y layout principal */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
            height: 100%;
            font-family: 'Poppins', sans-serif;
            background-color: #f4f4f4;
            color: #333;
        }
        body {
            display: flex;
            flex-direction: column;
        }
        .container {
            flex: 1;               /* ocupa todo el espacio disponible */
            padding: 20px;
            max-width: 900px;
            margin: 0 auto;
        }

        /* Cabecera */
        .header {
            background: #003366;
            color: #fff;
            text-align: center;
            padding: 20px 10px;
            border-bottom: 5px solid #002244;
        }
        .header img {
            width: 100px;
            height: auto;
            margin-bottom: 10px;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 5px;
        }
        .header h2 {
            font-size: 18px;
            color: #b0c4de;
        }
        .header p {
            margin-top: 10px;
            font-size: 14px;
            font-weight: bold;
        }

        /* Tarjeta de servicios */
        .service-card {
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
            padding: 15px 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .service-card h3 {
            font-size: 18px;
            color: #003366;
        }
        .service-details {
            background: #f9f9f9;
            padding: 12px;
            border-radius: 6px;
            margin-top: 10px;
        }
        .service-details ul {
            list-style: none;
        }
        .service-details li {
            margin-bottom: 8px;
            line-height: 1.5;
        }
        .highlight-label {
            font-weight: bold;
            color: #000;
        }
        .total-cost {
            text-align: right;
            font-size: 16px;
            font-weight: bold;
            color: #003366;
            margin-top: 10px;
        }

        /* Pie de página siempre abajo */
        .footer {
            background: #003366;
            color: #fff;
            text-align: center;
            padding: 12px;
            border-top: 5px solid #002244;
            /* fija el footer al fondo */
            position: fixed;
            bottom: 0;
            width: 100%;
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
             alt="Logo Don Chavo"><br>
        <h1>Mecánica Automotriz Don Chavo</h1>
        <h2>Historial de Citas</h2>
        <p><strong>Mes:</strong> {{ $mesSeleccionado }} &nbsp;|&nbsp; <strong>Año:</strong> {{ $anioSeleccionado }}</p>
    </div>

    <!-- Contenedor de contenido -->
    <div class="container">
        @if(!empty($mensaje))
            <p style="text-align:center; font-weight:bold; color:#003366;">
                {{ $mensaje }}
            </p>
        @else
            @foreach($servicios as $servicio)
                <div class="service-card">
                    <h3>Fecha: {{ $servicio['fecha'] }} &mdash; Vehículo: {{ $servicio['vehiculo'] }}</h3>
                    <div class="service-details">
                        <ul>
                            @foreach($servicio['servicios'] as $det)
                                <li>
                                    <span class="highlight-label">{{ $det['nombre'] }}</span><br>
                                    <span class="highlight-label">Precio sin IVA:</span>
                                        ${{ number_format($det['precio_base'],2) }}<br>
                                    <span class="highlight-label">IVA:</span>
                                        {{ $det['iva'] }}%<br>
                                    <span class="highlight-label">Total:</span>
                                        ${{ number_format($det['precio_total'],2) }}
                                </li>
                            @endforeach
                        </ul>
                    </div>
                    <p class="total-cost">
                        Costo Total: ${{ number_format($servicio['costo_total'],2) }}
                    </p>
                </div>
            @endforeach
        @endif
    </div>

    <!-- Pie de página (siempre abajo) -->
    <div class="footer">
        <p>Reporte generado el {{ now()->format('d/m/Y H:i') }}</p>
        <p>Mecánica Automotriz Don Chavo © {{ date('Y') }}</p>
    </div>

</body>
</html>
