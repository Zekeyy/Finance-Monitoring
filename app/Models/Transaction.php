<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class Transaction extends Model
{
    use HasFactory;

    protected $table = 'transactions';

    protected $fillable = [
        'name',
        'tags',
        'company',
        'date',
        'type_of_payment',
        'amount',
        'description',
        'receipt',
        'cost_or_income',
        'total_income_month',
        'total_cost_month',
        'expenses_category'
        
    ];

    protected $casts = [
        'tags' => 'array', // Ensure JSON data is cast to an array
        'date' => 'date',
        'amount' => 'decimal:2',
    ];
    
}
