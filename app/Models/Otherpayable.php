<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Otherpayable extends Model
{
    use HasFactory;

    protected $fillable = [
        'lab',
        'city',
        'address',
        'date',
        'amount_paid',
        'mode_of_payment',
        'account_number',
        'received_by'
    ];

}
