<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'period_type',
        'year',
        'month',
        'budgeted_income',
        'budgeted_expenses',
        'notes',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'budgeted_income' => 'decimal:2',
        'budgeted_expenses' => 'decimal:2',
    ];

    protected $appends = ['actual_income', 'actual_expenses'];

    public function getFormattedPeriodAttribute()
    {
        if ($this->period_type === 'yearly') {
            return "Yearly {$this->year}";
        }
        $monthName = date('F', mktime(0, 0, 0, $this->month, 1));
        return "{$monthName} {$this->year}";
    }

    /** 
     * Accessor to get actual income for the given period.
     */
    public function getActualIncomeAttribute()
    {
        return DB::table('transactions')
            ->where(function ($query) {
                if (strtolower($this->period_type) === 'monthly') {
                    $query->whereYear('date', $this->year)
                          ->whereMonth('date', $this->month);
                } else {
                    $query->whereYear('date', $this->year);
                }
            })
            ->where('cost_or_income', 'Income')
            ->sum('amount');
    }

    /** 
     * Accessor to get actual expenses for the given period.
     */
    public function getActualExpensesAttribute()
    {
        return DB::table('transactions')
            ->where(function ($query) {
                if (strtolower($this->period_type) === 'monthly') {
                    $query->whereYear('date', $this->year)
                          ->whereMonth('date', $this->month);
                } else {
                    $query->whereYear('date', $this->year);
                }
            })
            ->where('cost_or_income', 'Expenses')
            ->sum('amount');
    }

    public function scopeForPeriod($query, $periodType, $year, $month = null)
    {
        return $query->where('period_type', $periodType)
            ->where('year', $year)
            ->when($month, function ($query) use ($month) {
                $query->where('month', $month);
            });
    }
}