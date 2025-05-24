<?php

namespace App\Services;

use GuzzleHttp\Client;

class WhatsAppService
{
    protected $client;
    protected $token;
    protected $phoneId;

    public function __construct()
    {
        $this->client = new Client();
        $this->token = env('WHATSAPP_API_TOKEN'); // Token de acceso
        $this->phoneId = env('WHATSAPP_PHONE_ID'); // ID del número de WhatsApp
    }

    public function sendTemplateMessage($phoneNumber, $name)
    {
        $url = "https://graph.facebook.com/v21.0/{$this->phoneId}/messages";

        try {
            $response = $this->client->post($url, [
                'headers' => [
                    'Authorization' => "Bearer {$this->token}",
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'messaging_product' => 'whatsapp',
                    'to' => $phoneNumber,
                    'type' => 'template',
                    'template' => [
                        'name' => 'mecanica',
                        'language' => ['code' => 'es'],
                        'components' => [
                            [
                                'type' => 'body',
                                'parameters' => [
                                    ['type' => 'text', 'text' => $name],
                                ],
                            ],
                        ],
                    ],
                ],
                'verify' => false, // Desactiva la verificación SSL
            ]);

            return json_decode($response->getBody(), true);
        } catch (\Exception $e) {
            \Log::error('Error al enviar mensaje:', ['error' => $e->getMessage()]);
            throw new \Exception("Error al enviar mensaje: " . $e->getMessage());
        }
    }
}
