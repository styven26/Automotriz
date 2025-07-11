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

        /* ===== Pie de página ===== */
        .footer { margin-top:20px;text-align:center;font-size:14px;color:#666; }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg" alt="Logo Mecánica Automotriz Don Chavo">
        <h1>Mecánica Automotriz Don Chavo</h1><br>
        <h2>Reporte del Inventario Actual de Repuestos</h2>
        <div class="line"></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Fecha Registro</th>
                <th>Nombre</th>
                <th>Precio Base</th>
                <th>IVA (%)</th>
                <th>Precio Final</th>
                <th>Stock</th>
                <th>Stock Mínimo</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($repuestos as $i => $r)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ \Carbon\Carbon::parse($r->created_at)->format('d/m/Y') }}</td>
                    <td>{{ $r->nombre }}</td>
                    <td>${{ number_format($r->precio_base, 2) }}</td>
                    <td>{{ $r->iva }}%</td>
                    <td>${{ number_format($r->precio_final, 2) }}</td>
                    <td>{{ $r->stock }}</td>
                    <td>{{ $r->stock_minimo }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p><em>Reporte generado automáticamente el {{ now()->format('d/m/Y H:i') }}</em></p>
        <p><em>Total de repuestos: {{ $repuestos->count() }}</em></p>
    </div>
</body>
</html>
