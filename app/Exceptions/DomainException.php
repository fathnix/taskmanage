<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

abstract class DomainException extends Exception
{
    public function __construct(
        string $message,
        public readonly int $statusCode = 400,
        public readonly ?string $errorCode = null,
    ) {
        parent::__construct($message);
    }

    public function toResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error' => $this->errorCode,
        ], $this->statusCode);
    }
}
