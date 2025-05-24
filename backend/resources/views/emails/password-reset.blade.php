<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
    <style>
        /* Estilos generales */
        body {
            font-family: 'Poppins', sans-serif;
            background-color: #f9f9fc;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid #e0e0e0;
        }

        /* Encabezado */
        .email-header {
            background-color: #34495e;
            color: white;
            text-align: center;
            padding: 30px 20px;
            position: relative;
        }

        .email-header img {
            max-width: 80px;
            margin-bottom: 10px;
        }

        .email-header h1 {
            font-size: 24px;
            margin: 0;
            font-weight: 600;
        }

        /* Cuerpo del mensaje */
        .email-body {
            padding: 30px;
            text-align: center;
            line-height: 1.6;
        }

        .email-body h1 {
            font-size: 22px;
            margin-bottom: 20px;
            color: #34495e;
            font-weight: 600;
        }

        .email-body p {
            font-size: 16px;
            margin: 10px 0;
            font-weight: 400;
        }

        .email-body .cta-button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 30px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 123, 255, 0.3);
            transition: background-color 0.3s ease;
        }

        .email-body .cta-button:hover {
            background-color: #0056b3;
        }

        /* Pie de página */
        .email-footer {
            background-color: #f3f4f6;
            color: #666;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            font-weight: 400;
        }

        .email-footer a {
            color: #007bff;
            text-decoration: none;
            font-weight: 600;
        }

        .email-footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Encabezado -->
        <div class="email-header">
            <img 
                src="https://st.depositphotos.com/1006018/3132/v/450/depositphotos_31322065-stock-illustration-automotive-mechanic-car-repair-retro.jpg" 
                alt="Logo Mecánica Automotriz Don Chavo"
                style="max-width: 200px; width: 100%; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);"
            >
            <h1>Mecánica Automotriz Don Chavo</h1>
        </div>

        <!-- Cuerpo del mensaje -->
        <div class="email-body">
            <h1>Hola, {{ $nombre }} {{ $apellido }}</h1>
            <p>Hemos recibido una solicitud para restablecer tu contraseña como <strong>{{ $role }}</strong>.</p>
            <p>Haz clic en el botón a continuación para restablecer tu contraseña:</p>
            <a href="{{ config('app.frontend.url') }}/password-reset/confirm?token={{ $token }}" class="cta-button">
                Restablecer Contraseña
            </a><br>
            <p>Si no solicitaste esta recuperación, puedes ignorar este mensaje. Tu cuenta está segura.</p>
        </div>

        <!-- Pie de página -->
        <div class="email-footer">
            <p>¿Necesitas ayuda? <a href="mailto:segundogpadilla@gmail.com">Contáctanos</a></p>
            <p>&copy; 2025 Mecánica Automotriz. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
