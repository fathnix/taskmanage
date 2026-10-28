<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;

class BusinessRuleException extends DomainException
{
    public function __construct(
        public readonly ?string $field,
        string $message,
        int $statusCode = 422,
    ) {
        parent::__construct($message, $statusCode, 'business_rule_violation');
    }

    public function toResponse(): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $this->getMessage(),
            'error' => $this->errorCode,
        ];

        if ($this->field !== null) {
            $payload['errors'] = [$this->field => [$this->getMessage()]];
        }

        return response()->json($payload, $this->statusCode);
    }
}
