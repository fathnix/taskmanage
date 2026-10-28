<?php

namespace App\Exceptions;

class ConflictException extends DomainException
{
    public function __construct(string $message = 'The request conflicts with the current state of the resource.')
    {
        parent::__construct($message, 409, 'conflict');
    }
}
