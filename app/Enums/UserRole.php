<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case ProjectManager = 'project_manager';
    case QA = 'qa';
    case Member = 'member';
    case Client = 'client';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::ProjectManager => 'Project Manager',
            self::QA => 'QA',
            self::Member => 'Member',
            self::Client => 'Client',
        };
    }

    /**
     * Roles that users may choose when signing up. Admin is intentionally excluded.
     *
     * @return array<int, string>
     */
    public static function selfAssignable(): array
    {
        return [
            self::ProjectManager->value,
            self::QA->value,
            self::Member->value,
            self::Client->value,
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
