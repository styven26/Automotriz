<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Servicios Recomendados</title>
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
                A continuación, te presentamos los <strong>servicios recomendados</strong> para tu vehículo:
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

            <!-- Servicios Recomendados -->
            <h3 style="margin-top: 20px; font-size: 20px; color: #34495e; font-weight: 600;">Servicios Recomendados:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 16px; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #f4f4f9; text-align: left;">
                        <th style="padding: 10px; border-bottom: 2px solid #ddd; font-weight: 600;">Servicio</th>
                        <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right; font-weight: 600;">Precio sin IVA</th>
                        <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right; font-weight: 600;">IVA (%)</th>
                        <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right; font-weight: 600;">Precio Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($subtipos as $subtipo)
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{ $subtipo->nombre }}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
                            ${{ number_format($subtipo->precio_base, 2) }}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
                            {{ number_format($subtipo->iva, 2) }}%
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
                            ${{ number_format($subtipo->precio, 2) }}
                        </td>
                    </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 10px; font-weight: 600; border-top: 2px solid #ddd;">Total Estimado:</td>
                        <td style="padding: 10px; font-weight: 600; border-top: 2px solid #ddd; text-align: right;">
                            ${{ number_format($total, 2) }}
                        </td>
                    </tr>
                </tfoot>
            </table>

            <!-- Enlaces para que el cliente responda -->
            <p style="font-size: 16px; color: #333; font-weight: 400;">
                Si deseas proceder con estos servicios, haz clic en el siguiente enlace para <strong>aceptarlos</strong> y actualizar tu cita:
                <a href="{{ url('api/mecanico/diagnosticos/'.$diagnostico->id.'/aceptar') }}"
                   style="color: #27ae60; font-weight: 600; text-decoration: none;">
                    Aceptar
                </a>
            </p>
            <p style="font-size: 16px; color: #333; font-weight: 400;">
                Si no deseas realizarlos, haz clic en el siguiente enlace para <strong>rechazarlos</strong>:
                <a href="{{ url('api/mecanico/diagnosticos/'.$diagnostico->id.'/rechazar') }}"
                   style="color: #c0392b; font-weight: 600; text-decoration: none;">
                    Rechazar
                </a>
            </p>
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
