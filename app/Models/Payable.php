<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payable extends Model
{
    protected $table = 'payables';

    protected $fillable = [
        
        'what_to_pay',
        'date',
        'amount',
        'status',
        'description',
        'receipts',
    ];
}
