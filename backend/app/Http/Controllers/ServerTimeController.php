<?php
namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class ServerTimeController extends Controller
{
    public function now(): JsonResponse
    {
        return response()->json([
            'today' => Carbon::today()->toDateString()
        ]);
    }
}
