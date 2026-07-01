<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'wf_users';
    
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'name',
        'email',
        'password',
        'role',
        'avatar',
        'status',
    ];

    protected $hidden = [
        'password',
    ];
}
