<?php

namespace App\Exceptions;

class AccessDeniedException extends DomainException
{
    public function __construct(string $message = 'You are not allowed to perform this action.')
    {
        parent::__construct($message, 403, 'access_denied');
    }
}
