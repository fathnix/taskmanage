<?php

namespace App\Exceptions;

class ResourceNotFoundException extends DomainException
{
    public function __construct(string $message = 'Resource not found.')
    {
        parent::__construct($message, 404, 'resource_not_found');
    }
}
