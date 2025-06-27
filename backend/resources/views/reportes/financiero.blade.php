<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mecánica Automotriz Don Chavo - Reporte de Ingresos</title>
    <style>
        body {
            font-family: 'Poppins', sans-serif;
            margin: 10px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header img {
            width: 180px;
            height: auto;
            display: block;
            margin: 0 auto 10px;
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
            margin: 10px 0 15px;
            font-weight: 700;
            text-transform: capitalize;
        }
        .header .line {
            width: 100%;
            height: 3px;
            background: #007bff;
            margin: 10px 0 20px;
        }

        /* Títulos centrados de sección y mes */
        .section-title {
            margin-top: 10px;
            font-size: 16px;
            font-weight: 700;
            color: rgb(22, 15, 234);
            text-transform: capitalize;
            text-align: center;
        }
        .month-title {
            margin-top: 14px;
            font-size: 16px;
            font-weight: 700;
            color: rgb(22, 15, 234);
            text-transform: capitalize;
            text-align: center;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
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
            padding: 8px 10px;
            font-size: 14px;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #e9ecef;
        }
        .subtotal-row {
            font-weight: bold;
            background-color: #e2e6ea;
        }
        .total-row {
            margin-top: 20px;
            font-size: 18px;
            color: #28a745;
            font-weight: bold;
            text-align: right;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    @php use Carbon\Carbon; @endphp

    <div class="header">
        <img src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg" alt="Logo Mecánica Automotriz Don Chavo">
        <h1>Mecánica Automotriz Don Chavo</h1><br>
        <h2>Reporte de Ingresos por Año y Mes</h2>
        <div class="line"></div>
    </div>

    @if($mensaje)
        <div class="total-row">{{ $mensaje }}</div>
    @else
        @foreach($grouped as $year => $months)
            @foreach($months as $month => $items)
                {{-- Título de mes centrado --}}
                <div class="month-title">
                    {{ Carbon::createFromFormat('m', $month)
                        ->locale('es')
                        ->translatedFormat('F') }}
                    {{ $year }}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Servicio</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($items as $ing)
                            <tr>
                                <td>{{ Carbon::parse($ing['fecha'])->format('d/m/Y') }}</td>
                                <td>{{ $ing['cliente_nombre'] }}</td>
                                <td>{{ $ing['servicio_nombre'] }}</td>
                                <td>{{ $ing['cantidad'] }}</td>
                                <td>${{ number_format($ing['precio_unitario'], 2) }}</td>
                                <td>${{ number_format($ing['subtotal'], 2) }}</td>
                            </tr>
                        @endforeach
                        <tr class="subtotal-row">
                            <td colspan="5">
                                Total {{ Carbon::createFromFormat('m', $month)
                                    ->locale('es')
                                    ->translatedFormat('F') }}
                                {{ $year }}
                            </td>
                            <td>
                                ${{ number_format(collect($items)->sum('subtotal'), 2) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            @endforeach

            <div class="total-row">
                Total año {{ $year }}:
                ${{ number_format(
                    collect($months)
                        ->flatMap(fn($it) => $it)
                        ->sum('subtotal'),
                    2
                ) }}
            </div>
        @endforeach

        <div class="total-row">
            <strong>Total General Ingresos:</strong>
            ${{ number_format($totalGeneral, 2) }}
        </div>
    @endif

    <div class="footer">
        <p>Reporte generado automáticamente el {{ now()->format('d/m/Y H:i') }}</p>
    </div>
</body>
</html>
