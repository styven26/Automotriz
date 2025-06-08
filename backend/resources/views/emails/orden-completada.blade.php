<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orden Completada</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="font-family:'Poppins',sans-serif; background-color:#f4f4f9; margin:0; padding:0;">
    <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <!-- Encabezado -->
        <div style="background-color:#34495e; color:#fff; padding:20px; text-align:center;">
            <img 
                src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg" 
                alt="Mecánica Automotriz Don Chavo"
                style="max-width:200px; width:100%; margin-bottom:15px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.1);"
            >
            <h1 style="margin:0; font-size:24px; font-weight:600;">Mecánica Automotriz Don Chavo</h1>
        </div>

        <!-- Contenido -->
        <div style="padding:20px;">
            <p style="font-size:18px; margin:0 0 10px;">Reciba un cordial saludo,</p>
            <p style="font-size:16px; margin:0 0 20px;">
                {{ $cliente->nombre }} {{ $cliente->apellido }}, su vehículo está listo para ser retirado.  
                A continuación, los detalles de su servicio:
            </p>

            <!-- Servicios -->
            <h3 style="margin:20px 0 10px; font-size:20px; color:#34495e; font-weight:600;">Servicios Realizados:</h3>
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:16px;">
                <thead>
                    <tr style="background-color:#f4f4f9; text-align:left;">
                        <th style="padding:8px; border-bottom:2px solid #ddd; font-weight:600;">Servicio</th>
                        <th style="padding:8px; border-bottom:2px solid #ddd; text-align:right; font-weight:600;">Precio sin IVA</th>
                        <th style="padding:8px; border-bottom:2px solid #ddd; text-align:right; font-weight:600;">IVA (%)</th>
                        <th style="padding:8px; border-bottom:2px solid #ddd; text-align:right; font-weight:600;">Precio Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($detalles as $d)
                        <tr>
                            <td style="padding:8px; border-bottom:1px solid #ddd;">
                                {{ $d->servicio->nombre }}
                            </td>
                            <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">
                                ${{ number_format($d->servicio->precio_base, 2) }}
                            </td>
                            <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">
                                {{ $d->servicio->iva }}%
                            </td>
                            <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">
                                ${{ number_format($d->servicio->precio, 2) }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding:8px; font-weight:600; border-top:2px solid #ddd;">Total Servicios:</td>
                        <td style="padding:8px; font-weight:600; text-align:right; border-top:2px solid #ddd;">
                            ${{ number_format($totalServicios, 2) }}
                        </td>
                    </tr>
                </tfoot>
            </table>

            <!-- Repuestos -->
            <h3 style="margin:20px 0 10px; font-size:20px; color:#34495e; font-weight:600;">Repuestos Utilizados:</h3>
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:16px;">
                <thead>
                    <tr style="background-color:#f4f4f9; text-align:left;">
                        <th style="padding:8px; border-bottom:2px solid #ddd; font-weight:600;">Repuesto</th>
                        <th style="padding:8px; border-bottom:2px solid #ddd; text-align:right; font-weight:600;">Cantidad</th>
                        <th style="padding:8px; border-bottom:2px solid #ddd; text-align:right; font-weight:600;">Precio sin IVA</th>
                        <th style="padding:8px; border-bottom:2px solid #ddd; text-align:right; font-weight:600;">IVA (%)</th>
                        <th style="padding:8px; border-bottom:2px solid #ddd; text-align:right; font-weight:600;">Precio Unitario</th>
                        <th style="padding:8px; border-bottom:2px solid #ddd; text-align:right; font-weight:600;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($repuestos as $r)
                        <tr>
                            <td style="padding:8px; border-bottom:1px solid #ddd;">
                                {{ $r->repuesto->nombre }}
                            </td>
                            <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">
                                {{ $r->cantidad }}
                            </td>
                            <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">
                                ${{ number_format($r->repuesto->precio_base, 2) }}
                            </td>
                            <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">
                                {{ $r->repuesto->iva }}%
                            </td>
                            <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">
                                ${{ number_format($r->precio, 2) }}
                            </td>
                            <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">
                                ${{ number_format($r->subtotal, 2) }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="5" style="padding:8px; font-weight:600; border-top:2px solid #ddd;">Total Repuestos:</td>
                        <td style="padding:8px; font-weight:600; text-align:right; border-top:2px solid #ddd;">
                            ${{ number_format($totalRepuestos, 2) }}
                        </td>
                    </tr>
                </tfoot>
            </table>

            <!-- Gran Total -->
            <div style="text-align:right; font-size:18px; font-weight:600; margin-top:10px;">
                Total a Pagar: ${{ number_format($total, 2) }}
            </div>

            <p style="font-size:16px; color:#333; margin:20px 0 0;">
                Por favor pague en efectivo al retirar su vehículo.  
                ¡Gracias por confiar en nosotros!
            </p>
        </div>

        <!-- Pie de página -->
        <div style="background-color:#f4f4f9; color:#666; text-align:center; padding:10px; font-size:14px;">
            <p>*Correo generado automáticamente. Por favor, no responda.</p>
            <p><strong>Mecánica Automotriz Don Chavo</strong></p>
        </div>
    </div>
</body>
</html>
